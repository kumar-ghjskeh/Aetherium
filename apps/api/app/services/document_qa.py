from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Any
from uuid import UUID

from fastapi import status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.domain.ai import AIDataCategory, AIFeature, AIMessageRole
from app.domain.document_qa import DocumentQAEvidenceStatus, DocumentQAMode
from app.domain.file_ingestion import ChunkStatus
from app.domain.file_vault import FileDeletionStatus
from app.models.auth import User
from app.models.file_ingestion import FileChunk
from app.models.file_vault import Collection, CollectionItem, FileRecord
from app.services.ai_adapters import AIAdapterMessage
from app.services.ai_gateway import AIGatewayService, AIUsageSummary

MAX_CANDIDATE_CHUNKS = 80
MAX_SOURCE_CHARS = 1000
MAX_SNIPPET_CHARS = 360
SUPPORTED_SOURCE_TYPE = "user_file_evidence"
INLINE_CITATION_PATTERN = re.compile(r"\[(S\d{1,2})\]")


@dataclass(frozen=True)
class DocumentQACitation:
    label: str
    file_id: UUID
    chunk_id: UUID
    file_name: str
    page_number: int | None
    section_label: str | None
    snippet: str
    score: float
    open_url: str
    source_type: str
    metadata: dict[str, object]


@dataclass(frozen=True)
class DocumentQARetrieval:
    semantic_enabled: bool
    candidate_count: int
    retrieved_count: int
    used_collection_filter: bool
    used_file_filter: bool


@dataclass(frozen=True)
class DocumentQAAnswer:
    question: str
    mode: DocumentQAMode
    answer: str
    evidence_status: DocumentQAEvidenceStatus
    citations: list[DocumentQACitation]
    retrieval: DocumentQARetrieval
    provider_name: str | None
    model_name: str | None
    usage: AIUsageSummary | None
    usage_record_id: UUID | None
    used_fallback: bool


@dataclass(frozen=True)
class RetrievedChunk:
    chunk: FileChunk
    file: FileRecord
    score: float


class DocumentQAService:
    def __init__(self, *, db: AsyncSession, ai_gateway: AIGatewayService):
        self.db = db
        self.ai_gateway = ai_gateway

    async def answer_question(
        self,
        user: User,
        *,
        question: str,
        mode: DocumentQAMode,
        file_ids: list[UUID],
        collection_ids: list[UUID],
        max_sources: int,
        provider_name: str | None = None,
        model_name: str | None = None,
    ) -> DocumentQAAnswer:
        normalized_question = _normalize(question)
        await self._enforce_file_content_consent(user)
        unique_file_ids = _dedupe_uuids(file_ids)
        requested_collection_ids = _dedupe_uuids(collection_ids)
        await self._validate_owned_files(user, unique_file_ids)
        await self._validate_owned_collections(user, requested_collection_ids)
        effective_collection_ids = await self._effective_collection_scope(
            user,
            requested_collection_ids,
        )
        retrieved, retrieval = await self._retrieve_chunks(
            user,
            question=normalized_question,
            file_ids=unique_file_ids,
            collection_ids=effective_collection_ids,
            requested_collection_filter=bool(requested_collection_ids),
            max_sources=max_sources,
        )
        citations = [
            _citation_from_chunk(index, item) for index, item in enumerate(retrieved, start=1)
        ]

        if not citations:
            return DocumentQAAnswer(
                question=normalized_question,
                mode=mode,
                answer=(
                    "I could not find enough evidence in your processed files to answer this. "
                    "Try processing the relevant files or narrowing the question."
                ),
                evidence_status=DocumentQAEvidenceStatus.INSUFFICIENT_EVIDENCE,
                citations=[],
                retrieval=retrieval,
                provider_name=None,
                model_name=None,
                usage=None,
                usage_record_id=None,
                used_fallback=False,
            )

        result = await self.ai_gateway.complete_chat(
            user,
            feature=AIFeature.DOCUMENT_QA,
            messages=[
                AIAdapterMessage(
                    role=AIMessageRole.SYSTEM,
                    content=_document_qa_system_prompt(),
                ),
                AIAdapterMessage(
                    role=AIMessageRole.USER,
                    content=_document_qa_user_prompt(
                        question=normalized_question,
                        mode=mode,
                        retrieved=retrieved,
                    ),
                ),
            ],
            requested_data_categories=[AIDataCategory.FILE_CONTENT],
            provider_name=provider_name,
            model_name=model_name,
            max_output_tokens=1200,
            temperature=0.2,
        )

        answer = _validate_inline_citations(
            result.content,
            {citation.label for citation in citations},
        )
        return DocumentQAAnswer(
            question=normalized_question,
            mode=mode,
            answer=answer,
            evidence_status=DocumentQAEvidenceStatus.SUPPORTED,
            citations=citations,
            retrieval=retrieval,
            provider_name=result.provider_name,
            model_name=result.model_name,
            usage=result.usage,
            usage_record_id=result.usage_record.id,
            used_fallback=result.used_fallback,
        )

    async def _enforce_file_content_consent(self, user: User) -> None:
        policy = await self.ai_gateway.get_or_create_consent_policy(user, AIFeature.DOCUMENT_QA)
        if not policy.allow_file_content:
            raise AppError(
                status.HTTP_403_FORBIDDEN,
                "ai_data_consent_required",
                "Document Q&A requires explicit AI file-content access consent.",
            )

    async def _effective_collection_scope(
        self,
        user: User,
        requested_collection_ids: list[UUID],
    ) -> list[UUID]:
        policy = await self.ai_gateway.get_or_create_consent_policy(user, AIFeature.DOCUMENT_QA)
        allowed_ids = _parse_policy_collection_ids(policy.allowed_collection_ids)
        if not allowed_ids:
            return requested_collection_ids
        if requested_collection_ids:
            disallowed = set(requested_collection_ids) - set(allowed_ids)
            if disallowed:
                raise AppError(
                    status.HTTP_403_FORBIDDEN,
                    "collection_ai_consent_required",
                    "Document Q&A access is limited to approved collections.",
                )
            return requested_collection_ids
        await self._validate_owned_collections(user, allowed_ids)
        return allowed_ids

    async def _validate_owned_files(self, user: User, file_ids: list[UUID]) -> None:
        if not file_ids:
            return
        result = await self.db.execute(
            select(FileRecord.id).where(
                FileRecord.owner_user_id == user.id,
                FileRecord.id.in_(file_ids),
                FileRecord.deletion_status == FileDeletionStatus.ACTIVE.value,
            )
        )
        found = set(result.scalars().all())
        if found != set(file_ids):
            raise AppError(status.HTTP_404_NOT_FOUND, "not_found", "File was not found.")

    async def _validate_owned_collections(self, user: User, collection_ids: list[UUID]) -> None:
        if not collection_ids:
            return
        result = await self.db.execute(
            select(Collection.id).where(
                Collection.owner_user_id == user.id,
                Collection.id.in_(collection_ids),
            )
        )
        found = set(result.scalars().all())
        if found != set(collection_ids):
            raise AppError(status.HTTP_404_NOT_FOUND, "not_found", "Collection was not found.")

    async def _retrieve_chunks(
        self,
        user: User,
        *,
        question: str,
        file_ids: list[UUID],
        collection_ids: list[UUID],
        requested_collection_filter: bool,
        max_sources: int,
    ) -> tuple[list[RetrievedChunk], DocumentQARetrieval]:
        lexical_rows = await self._fetch_candidate_rows(
            user,
            question=question,
            file_ids=file_ids,
            collection_ids=collection_ids,
            lexical_only=True,
        )
        semantic_rows = await self._fetch_candidate_rows(
            user,
            question=question,
            file_ids=file_ids,
            collection_ids=collection_ids,
            lexical_only=False,
        )
        rows = _merge_rows(lexical_rows, semantic_rows)
        semantic_enabled = any(chunk.embedding for chunk, _file in rows)
        query_embedding = await self._query_embedding(user, question) if semantic_enabled else None

        ranked: list[RetrievedChunk] = []
        for chunk, file in rows:
            lexical_score = _lexical_score(question, chunk.chunk_text, file.display_name)
            semantic_score = _semantic_score(query_embedding, chunk.embedding)
            combined_score = lexical_score + semantic_score
            if combined_score <= 0:
                continue
            ranked.append(RetrievedChunk(chunk=chunk, file=file, score=round(combined_score, 6)))

        ranked.sort(
            key=lambda item: (item.score, item.file.updated_at, -item.chunk.sequence_number),
            reverse=True,
        )
        retrieved = ranked[:max_sources]
        retrieval = DocumentQARetrieval(
            semantic_enabled=semantic_enabled and query_embedding is not None,
            candidate_count=len(rows),
            retrieved_count=len(retrieved),
            used_collection_filter=bool(collection_ids) or requested_collection_filter,
            used_file_filter=bool(file_ids),
        )
        return retrieved, retrieval

    async def _fetch_candidate_rows(
        self,
        user: User,
        *,
        question: str,
        file_ids: list[UUID],
        collection_ids: list[UUID],
        lexical_only: bool,
    ) -> list[tuple[FileChunk, FileRecord]]:
        predicates = [
            FileChunk.owner_user_id == user.id,
            FileChunk.status == ChunkStatus.READY.value,
            FileRecord.id == FileChunk.file_id,
            FileRecord.owner_user_id == user.id,
            FileRecord.deletion_status == FileDeletionStatus.ACTIVE.value,
        ]
        if file_ids:
            predicates.append(FileChunk.file_id.in_(file_ids))
        if collection_ids:
            collection_file_ids = (
                select(CollectionItem.file_id)
                .where(
                    CollectionItem.owner_user_id == user.id,
                    CollectionItem.collection_id.in_(collection_ids),
                )
                .scalar_subquery()
            )
            predicates.append(FileChunk.file_id.in_(collection_file_ids))
        if lexical_only:
            predicates.append(
                or_(
                    _contains(FileChunk.search_text, question),
                    _contains(FileRecord.display_name, question),
                )
            )
        else:
            predicates.append(FileChunk.embedding.is_not(None))

        result = await self.db.execute(
            select(FileChunk, FileRecord)
            .where(*predicates)
            .order_by(FileRecord.updated_at.desc(), FileChunk.sequence_number.asc())
            .limit(MAX_CANDIDATE_CHUNKS)
        )
        return [(chunk, file) for chunk, file in result.all()]

    async def _query_embedding(self, user: User, question: str) -> list[float] | None:
        try:
            result = await self.ai_gateway.create_embeddings(
                user,
                feature=AIFeature.EMBEDDINGS,
                input_texts=[question],
                requested_data_categories=[],
            )
        except AppError:
            return None
        return result.embeddings[0] if result.embeddings else None


def _document_qa_system_prompt() -> str:
    return (
        "You are Aetherium's source-grounded document question-answering engine. "
        "Use only the supplied source excerpts. Cite source-backed statements with labels like "
        "[S1]. If the excerpts do not support an answer, say that the available evidence is "
        "insufficient. Do not invent sources, page numbers, files, tasks, or user data."
    )


def _document_qa_user_prompt(
    *,
    question: str,
    mode: DocumentQAMode,
    retrieved: list[RetrievedChunk],
) -> str:
    source_blocks = []
    for index, item in enumerate(retrieved, start=1):
        location = _source_location(item.chunk)
        source_blocks.append(
            "\n".join(
                [
                    f"[S{index}] {item.file.display_name}{location}",
                    item.chunk.chunk_text[:MAX_SOURCE_CHARS],
                ]
            )
        )
    return "\n\n".join(
        [
            f"Mode: {_mode_instruction(mode)}",
            f"Question: {question}",
            "Sources:",
            "\n\n".join(source_blocks),
            (
                "Answer using concise markdown. Distinguish direct evidence from inference. "
                "Every file-based claim must cite one of the supplied source labels."
            ),
        ]
    )


def _mode_instruction(mode: DocumentQAMode) -> str:
    return {
        DocumentQAMode.EXPLAIN: "Explain the answer from the retrieved sources.",
        DocumentQAMode.SUMMARIZE: "Summarize the retrieved sources.",
        DocumentQAMode.COMPARE: "Compare source-supported points and call out gaps.",
        DocumentQAMode.QUIZ_ME: "Create a short quiz based only on the retrieved sources.",
        DocumentQAMode.CREATE_FLASHCARDS: "Create concise flashcards from the retrieved sources.",
        DocumentQAMode.EXTRACT_TASKS: "Extract possible tasks only when the sources support them.",
        DocumentQAMode.CREATE_STUDY_NOTES: "Create study notes from the retrieved sources.",
        DocumentQAMode.IDENTIFY_CONTRADICTIONS: (
            "Identify contradictions only when the retrieved sources contain conflicting evidence."
        ),
    }[mode]


def _citation_from_chunk(index: int, item: RetrievedChunk) -> DocumentQACitation:
    return DocumentQACitation(
        label=f"S{index}",
        file_id=item.file.id,
        chunk_id=item.chunk.id,
        file_name=item.file.display_name,
        page_number=item.chunk.page_number,
        section_label=item.chunk.section_label,
        snippet=_snippet(item.chunk.chunk_text),
        score=item.score,
        open_url=f"/app/library?file={item.file.id}&chunk={item.chunk.id}",
        source_type=SUPPORTED_SOURCE_TYPE,
        metadata={
            "fileKind": item.file.file_kind,
            "sequenceNumber": item.chunk.sequence_number,
        },
    )


def _validate_inline_citations(answer: str, allowed_labels: set[str]) -> str:
    cleaned = INLINE_CITATION_PATTERN.sub(
        lambda match: match.group(0) if match.group(1) in allowed_labels else "",
        answer.strip(),
    )
    found_labels = set(INLINE_CITATION_PATTERN.findall(cleaned))
    if found_labels:
        return cleaned
    references = " ".join(f"[{label}]" for label in sorted(allowed_labels, key=_label_index))
    return f"{cleaned}\n\nSources: {references}"


def _label_index(label: str) -> int:
    return int(label[1:])


def _source_location(chunk: FileChunk) -> str:
    parts = []
    if chunk.page_number is not None:
        parts.append(f"page {chunk.page_number}")
    if chunk.section_label:
        parts.append(chunk.section_label)
    return f" ({', '.join(parts)})" if parts else ""


def _merge_rows(
    first: list[tuple[FileChunk, FileRecord]],
    second: list[tuple[FileChunk, FileRecord]],
) -> list[tuple[FileChunk, FileRecord]]:
    merged: dict[UUID, tuple[FileChunk, FileRecord]] = {}
    for chunk, file in [*first, *second]:
        merged[chunk.id] = (chunk, file)
    return list(merged.values())


def _lexical_score(question: str, text: str, title: str) -> float:
    normalized_question = _normalize(question)
    normalized_text = _normalize(f"{title} {text}")
    if not normalized_text:
        return 0.0
    score = 0.0
    if normalized_question in normalized_text:
        score += 1.0
    terms = {term for term in normalized_question.split() if len(term) > 2}
    if terms:
        matches = sum(1 for term in terms if term in normalized_text)
        score += matches / len(terms)
    return score


def _semantic_score(query_embedding: list[float] | None, chunk_embedding: object) -> float:
    if query_embedding is None or not isinstance(chunk_embedding, list):
        return 0.0
    values: list[float] = []
    for value in chunk_embedding:
        if isinstance(value, int | float):
            values.append(float(value))
    if not values or len(values) != len(query_embedding):
        return 0.0
    numerator = sum(left * right for left, right in zip(query_embedding, values, strict=True))
    left_norm = math.sqrt(sum(value * value for value in query_embedding))
    right_norm = math.sqrt(sum(value * value for value in values))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    cosine = numerator / (left_norm * right_norm)
    return max(0.0, (cosine + 1) / 2)


def _snippet(text: str) -> str:
    compact = " ".join(text.split())
    if len(compact) <= MAX_SNIPPET_CHARS:
        return compact
    return f"{compact[:MAX_SNIPPET_CHARS].rstrip()}..."


def _normalize(text: str) -> str:
    return " ".join(text.strip().casefold().split())


def _contains(column: Any, query: str) -> Any:
    return func.lower(func.coalesce(column, "")).like(f"%{_normalize(query)}%")


def _dedupe_uuids(values: list[UUID]) -> list[UUID]:
    return list(dict.fromkeys(values))


def _parse_policy_collection_ids(values: object) -> list[UUID]:
    parsed: list[UUID] = []
    if not isinstance(values, list):
        return parsed
    for value in values:
        try:
            parsed.append(UUID(str(value)))
        except ValueError:
            continue
    return _dedupe_uuids(parsed)
