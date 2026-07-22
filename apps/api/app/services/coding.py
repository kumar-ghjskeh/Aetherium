from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import status
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.pagination import PaginationParams
from app.domain.ai import AIDataCategory, AIFeature, AIMessageRole
from app.domain.coding import (
    CodeAssistantKind,
    CodeAssistantStatus,
    CodeSnippetStatus,
    CodingAttemptStatus,
    CodingExerciseStatus,
    CodingLanguage,
)
from app.domain.file_vault import FileDeletionStatus
from app.domain.learning import LearningRecordStatus
from app.models.auth import User
from app.models.coding import (
    CodeAssistantRequest,
    CodeSnippet,
    CodingExercise,
    CodingExerciseAttempt,
)
from app.models.file_vault import FileRecord
from app.models.learning import Topic
from app.models.projects import Project
from app.schemas.coding import (
    CodeAssistantCreate,
    CodeSnippetCreate,
    CodeSnippetUpdate,
    CodingAttemptCreate,
    CodingExerciseCreate,
)
from app.services.ai_adapters import AIAdapterMessage
from app.services.ai_gateway import AIGatewayService
from app.services.foundation import PageResult, UserDataService


class CodingService:
    def __init__(self, *, db: AsyncSession, ai_gateway: AIGatewayService | None = None):
        self.db = db
        self.ai_gateway = ai_gateway
        self.user_data = UserDataService(db)

    async def list_snippets(
        self,
        user: User,
        pagination: PaginationParams,
        *,
        include_archived: bool = False,
    ) -> PageResult[CodeSnippet]:
        predicates = [CodeSnippet.owner_user_id == user.id]
        if not include_archived:
            predicates.append(CodeSnippet.status == CodeSnippetStatus.ACTIVE.value)
        total = await self._count(select(func.count(CodeSnippet.id)).where(*predicates))
        result = await self.db.execute(
            select(CodeSnippet)
            .where(*predicates)
            .order_by(CodeSnippet.updated_at.desc(), CodeSnippet.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def create_snippet(self, user: User, payload: CodeSnippetCreate) -> CodeSnippet:
        if payload.project_id is not None:
            await self._get_owned_project(user, payload.project_id)
        if payload.file_id is not None:
            await self._get_owned_file(user, payload.file_id)

        snippet = CodeSnippet(
            owner_user_id=user.id,
            title=_compact(payload.title),
            language=payload.language.value,
            content=payload.content,
            notes=_compact_optional(payload.notes),
            project_id=payload.project_id,
            file_id=payload.file_id,
        )
        self.db.add(snippet)
        await self.db.flush()
        await self.user_data.record_audit_log(
            user,
            action="coding.snippet_created",
            entity_type="code_snippet",
            entity_id=snippet.id,
            metadata={
                "language": snippet.language,
                "projectId": str(snippet.project_id) if snippet.project_id else None,
                "fileId": str(snippet.file_id) if snippet.file_id else None,
                "contentLength": len(snippet.content),
            },
        )
        await self.db.flush()
        return snippet

    async def get_snippet(self, user: User, snippet_id: UUID) -> CodeSnippet:
        result = await self.db.execute(
            select(CodeSnippet).where(
                CodeSnippet.id == snippet_id,
                CodeSnippet.owner_user_id == user.id,
            )
        )
        snippet = result.scalar_one_or_none()
        if snippet is None:
            raise AppError(404, "not_found", "Code snippet was not found.")
        return snippet

    async def update_snippet(
        self, user: User, snippet_id: UUID, payload: CodeSnippetUpdate
    ) -> CodeSnippet:
        snippet = await self.get_snippet(user, snippet_id)
        updates = payload.model_dump(exclude_unset=True, by_alias=False)
        if "project_id" in updates and updates["project_id"] is not None:
            await self._get_owned_project(user, updates["project_id"])
        if "file_id" in updates and updates["file_id"] is not None:
            await self._get_owned_file(user, updates["file_id"])

        if "title" in updates and updates["title"] is not None:
            snippet.title = _compact(str(updates["title"]))
        if "language" in updates and updates["language"] is not None:
            snippet.language = _enum_value(updates["language"])
        if "content" in updates and updates["content"] is not None:
            snippet.content = str(updates["content"])
        if "notes" in updates:
            snippet.notes = _compact_optional(updates["notes"])
        if "project_id" in updates:
            snippet.project_id = updates["project_id"]
        if "file_id" in updates:
            snippet.file_id = updates["file_id"]

        snippet.updated_at = datetime.now(UTC)
        await self.user_data.record_audit_log(
            user,
            action="coding.snippet_updated",
            entity_type="code_snippet",
            entity_id=snippet.id,
            metadata={"updatedFields": sorted(updates.keys())},
        )
        await self.db.flush()
        return snippet

    async def archive_snippet(self, user: User, snippet_id: UUID) -> CodeSnippet:
        snippet = await self.get_snippet(user, snippet_id)
        if snippet.status != CodeSnippetStatus.ARCHIVED.value:
            now = datetime.now(UTC)
            snippet.status = CodeSnippetStatus.ARCHIVED.value
            snippet.archived_at = now
            snippet.updated_at = now
            await self.user_data.record_audit_log(
                user,
                action="coding.snippet_archived",
                entity_type="code_snippet",
                entity_id=snippet.id,
                metadata={"language": snippet.language},
            )
            await self.db.flush()
        return snippet

    async def list_exercises(
        self,
        user: User,
        pagination: PaginationParams,
        *,
        include_archived: bool = False,
    ) -> PageResult[CodingExercise]:
        predicates = [CodingExercise.owner_user_id == user.id]
        if not include_archived:
            predicates.append(CodingExercise.status == CodingExerciseStatus.ACTIVE.value)
        total = await self._count(select(func.count(CodingExercise.id)).where(*predicates))
        result = await self.db.execute(
            select(CodingExercise)
            .where(*predicates)
            .order_by(CodingExercise.updated_at.desc(), CodingExercise.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def create_exercise(self, user: User, payload: CodingExerciseCreate) -> CodingExercise:
        if payload.topic_id is not None:
            await self._get_owned_topic(user, payload.topic_id)
        if payload.project_id is not None:
            await self._get_owned_project(user, payload.project_id)
        exercise = CodingExercise(
            owner_user_id=user.id,
            title=_compact(payload.title),
            language=payload.language.value,
            prompt=payload.prompt.strip(),
            starter_code=payload.starter_code,
            solution_notes=_compact_optional(payload.solution_notes),
            difficulty=payload.difficulty.value,
            topic_id=payload.topic_id,
            project_id=payload.project_id,
        )
        self.db.add(exercise)
        await self.db.flush()
        await self.user_data.record_audit_log(
            user,
            action="coding.exercise_created",
            entity_type="coding_exercise",
            entity_id=exercise.id,
            metadata={
                "language": exercise.language,
                "difficulty": exercise.difficulty,
                "promptLength": len(exercise.prompt),
            },
        )
        await self.db.flush()
        return exercise

    async def get_exercise(self, user: User, exercise_id: UUID) -> CodingExercise:
        result = await self.db.execute(
            select(CodingExercise).where(
                CodingExercise.id == exercise_id,
                CodingExercise.owner_user_id == user.id,
            )
        )
        exercise = result.scalar_one_or_none()
        if exercise is None:
            raise AppError(404, "not_found", "Coding exercise was not found.")
        return exercise

    async def create_attempt(
        self, user: User, exercise_id: UUID, payload: CodingAttemptCreate
    ) -> CodingExerciseAttempt:
        exercise = await self.get_exercise(user, exercise_id)
        if payload.snippet_id is not None:
            await self.get_snippet(user, payload.snippet_id)
        attempt = CodingExerciseAttempt(
            owner_user_id=user.id,
            exercise_id=exercise.id,
            snippet_id=payload.snippet_id,
            submitted_code=payload.submitted_code,
            notes=_compact_optional(payload.notes),
            status=CodingAttemptStatus.SUBMITTED.value,
        )
        self.db.add(attempt)
        await self.db.flush()
        await self.user_data.record_audit_log(
            user,
            action="coding.exercise_attempt_submitted",
            entity_type="coding_exercise_attempt",
            entity_id=attempt.id,
            metadata={
                "exerciseId": str(exercise.id),
                "snippetId": str(attempt.snippet_id) if attempt.snippet_id else None,
                "codeLength": len(attempt.submitted_code),
            },
        )
        await self.db.flush()
        return attempt

    async def list_assistant_requests(
        self, user: User, pagination: PaginationParams
    ) -> PageResult[CodeAssistantRequest]:
        total = await self._count(
            select(func.count(CodeAssistantRequest.id)).where(
                CodeAssistantRequest.owner_user_id == user.id
            )
        )
        result = await self.db.execute(
            select(CodeAssistantRequest)
            .where(CodeAssistantRequest.owner_user_id == user.id)
            .order_by(CodeAssistantRequest.created_at.desc(), CodeAssistantRequest.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def explain_code(self, user: User, payload: CodeAssistantCreate) -> CodeAssistantRequest:
        return await self._assistant_request(user, payload, kind=CodeAssistantKind.EXPLAIN)

    async def review_code(self, user: User, payload: CodeAssistantCreate) -> CodeAssistantRequest:
        return await self._assistant_request(user, payload, kind=CodeAssistantKind.REVIEW)

    async def _assistant_request(
        self,
        user: User,
        payload: CodeAssistantCreate,
        *,
        kind: CodeAssistantKind,
    ) -> CodeAssistantRequest:
        if self.ai_gateway is None:
            raise AppError(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "ai_gateway_unavailable",
                "AI coding assistance is unavailable.",
            )

        snippet: CodeSnippet | None = None
        if payload.snippet_id is not None:
            snippet = await self.get_snippet(user, payload.snippet_id)

        code = payload.code if payload.code is not None else (snippet.content if snippet else None)
        if code is None or not code.strip():
            raise AppError(422, "code_required", "Code is required for assistant requests.")

        language = payload.language or (
            CodingLanguage(snippet.language) if snippet else CodingLanguage.TEXT
        )
        project_id = (
            payload.project_id
            if payload.project_id is not None
            else (snippet.project_id if snippet else None)
        )
        project_context = ""
        requested_categories: list[AIDataCategory] = []
        if project_id is not None:
            project = await self._get_owned_project(user, project_id)
            if payload.include_project_context:
                requested_categories.append(AIDataCategory.PROJECTS)
                project_context = (
                    "\n\nProject context:\n"
                    f"Name: {project.name}\n"
                    f"Objective: {project.objective or 'Not set'}\n"
                    f"Description: {project.description or 'Not set'}"
                )

        instruction = (
            "Explain what the code does, identify assumptions, and suggest one focused next step."
            if kind == CodeAssistantKind.EXPLAIN
            else (
                "Review the code for correctness, maintainability, security, and testing gaps. "
                "Do not rewrite unrelated code."
            )
        )
        user_prompt = payload.prompt or instruction
        messages = [
            AIAdapterMessage(
                role=AIMessageRole.SYSTEM,
                content=(
                    "You are Aetherium's coding assistant. Give concise, practical feedback. "
                    "Never claim code was executed; this environment only stores and reviews code."
                ),
            ),
            AIAdapterMessage(
                role=AIMessageRole.USER,
                content=(
                    f"Request type: {kind.value}\n"
                    f"Language: {language.value}\n"
                    f"User request: {user_prompt}{project_context}\n\n"
                    "Code:\n"
                    f"{code}"
                ),
            ),
        ]

        result = await self.ai_gateway.complete_chat(
            user,
            feature=AIFeature.CODING_ASSISTANT,
            messages=messages,
            requested_data_categories=requested_categories,
            provider_name=payload.provider_name,
            model_name=payload.model_name,
            temperature=0.2,
            max_output_tokens=700,
        )
        record = CodeAssistantRequest(
            owner_user_id=user.id,
            snippet_id=snippet.id if snippet is not None else None,
            project_id=project_id,
            ai_usage_record_id=result.usage_record.id,
            kind=kind.value,
            language=language.value,
            prompt=_compact_optional(payload.prompt),
            code_excerpt=code,
            response=result.content,
            status=CodeAssistantStatus.COMPLETE.value,
            provider_name=result.provider_name,
            model_name=result.model_name,
        )
        self.db.add(record)
        await self.db.flush()
        await self.user_data.record_audit_log(
            user,
            action=f"coding.assistant_{kind.value}",
            entity_type="code_assistant_request",
            entity_id=record.id,
            metadata={
                "kind": kind.value,
                "language": language.value,
                "snippetId": str(record.snippet_id) if record.snippet_id else None,
                "projectId": str(record.project_id) if record.project_id else None,
                "codeLength": len(code),
                "aiUsageRecordId": str(result.usage_record.id),
            },
        )
        await self.db.flush()
        return record

    async def _get_owned_project(self, user: User, project_id: UUID) -> Project:
        result = await self.db.execute(
            select(Project).where(Project.id == project_id, Project.owner_user_id == user.id)
        )
        project = result.scalar_one_or_none()
        if project is None:
            raise AppError(404, "not_found", "Project was not found.")
        return project

    async def _get_owned_file(self, user: User, file_id: UUID) -> FileRecord:
        result = await self.db.execute(
            select(FileRecord).where(
                FileRecord.id == file_id,
                FileRecord.owner_user_id == user.id,
                FileRecord.deletion_status == FileDeletionStatus.ACTIVE.value,
            )
        )
        file = result.scalar_one_or_none()
        if file is None:
            raise AppError(404, "not_found", "File was not found.")
        return file

    async def _get_owned_topic(self, user: User, topic_id: UUID) -> Topic:
        result = await self.db.execute(
            select(Topic).where(
                Topic.id == topic_id,
                Topic.owner_user_id == user.id,
                Topic.status == LearningRecordStatus.ACTIVE.value,
            )
        )
        topic = result.scalar_one_or_none()
        if topic is None:
            raise AppError(404, "not_found", "Topic was not found.")
        return topic

    async def _count(self, query: Select[tuple[int]]) -> int:
        value = await self.db.scalar(query)
        return int(value or 0)


def _compact(value: str) -> str:
    return " ".join(value.strip().split())


def _compact_optional(value: object) -> str | None:
    if value is None:
        return None
    compact = _compact(str(value))
    return compact or None


def _enum_value(value: object) -> str:
    if isinstance(value, str):
        return value
    enum_value = getattr(value, "value", None)
    return str(enum_value if enum_value is not None else value)
