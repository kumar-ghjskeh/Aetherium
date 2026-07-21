from __future__ import annotations

from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.domain.document_qa import DocumentQAEvidenceStatus, DocumentQAMode
from app.schemas.ai import AIUsageSummaryResponse
from app.services.document_qa import DocumentQAAnswer, DocumentQACitation, DocumentQARetrieval


class DocumentQARequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    question: str = Field(min_length=3, max_length=2000)
    mode: DocumentQAMode = DocumentQAMode.EXPLAIN
    file_ids: list[UUID] = Field(default_factory=list, alias="fileIds", max_length=20)
    collection_ids: list[UUID] = Field(
        default_factory=list,
        alias="collectionIds",
        max_length=20,
    )
    max_sources: int = Field(default=4, alias="maxSources", ge=1, le=8)
    provider_name: str | None = Field(default=None, alias="providerName", max_length=80)
    model_name: str | None = Field(default=None, alias="modelName", max_length=120)

    @field_validator("question")
    @classmethod
    def normalize_question(cls, value: str) -> str:
        return " ".join(value.strip().split())


class DocumentQACitationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    label: str
    file_id: UUID = Field(alias="fileId")
    chunk_id: UUID = Field(alias="chunkId")
    file_name: str = Field(alias="fileName")
    page_number: int | None = Field(alias="pageNumber")
    section_label: str | None = Field(alias="sectionLabel")
    snippet: str
    score: float
    open_url: str = Field(alias="openUrl")
    source_type: str = Field(alias="sourceType")
    metadata: dict[str, Any]

    @classmethod
    def from_citation(cls, citation: DocumentQACitation) -> DocumentQACitationResponse:
        return cls(
            label=citation.label,
            fileId=citation.file_id,
            chunkId=citation.chunk_id,
            fileName=citation.file_name,
            pageNumber=citation.page_number,
            sectionLabel=citation.section_label,
            snippet=citation.snippet,
            score=citation.score,
            openUrl=citation.open_url,
            sourceType=citation.source_type,
            metadata=citation.metadata,
        )


class DocumentQARetrievalResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    semantic_enabled: bool = Field(alias="semanticEnabled")
    candidate_count: int = Field(alias="candidateCount")
    retrieved_count: int = Field(alias="retrievedCount")
    used_collection_filter: bool = Field(alias="usedCollectionFilter")
    used_file_filter: bool = Field(alias="usedFileFilter")

    @classmethod
    def from_retrieval(cls, retrieval: DocumentQARetrieval) -> DocumentQARetrievalResponse:
        return cls(
            semanticEnabled=retrieval.semantic_enabled,
            candidateCount=retrieval.candidate_count,
            retrievedCount=retrieval.retrieved_count,
            usedCollectionFilter=retrieval.used_collection_filter,
            usedFileFilter=retrieval.used_file_filter,
        )


class DocumentQAResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    question: str
    mode: DocumentQAMode
    answer: str
    evidence_status: DocumentQAEvidenceStatus = Field(alias="evidenceStatus")
    citations: list[DocumentQACitationResponse]
    retrieval: DocumentQARetrievalResponse
    provider_name: str | None = Field(alias="providerName")
    model_name: str | None = Field(alias="modelName")
    usage: AIUsageSummaryResponse | None
    usage_record_id: UUID | None = Field(alias="usageRecordId")
    used_fallback: bool = Field(alias="usedFallback")

    @classmethod
    def from_answer(cls, answer: DocumentQAAnswer) -> DocumentQAResponse:
        return cls(
            question=answer.question,
            mode=answer.mode,
            answer=answer.answer,
            evidenceStatus=answer.evidence_status,
            citations=[
                DocumentQACitationResponse.from_citation(citation) for citation in answer.citations
            ],
            retrieval=DocumentQARetrievalResponse.from_retrieval(answer.retrieval),
            providerName=answer.provider_name,
            modelName=answer.model_name,
            usage=AIUsageSummaryResponse.from_summary(answer.usage) if answer.usage else None,
            usageRecordId=answer.usage_record_id,
            usedFallback=answer.used_fallback,
        )
