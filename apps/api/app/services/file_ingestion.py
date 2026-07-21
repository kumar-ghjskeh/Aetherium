from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import Select, delete, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.errors import AppError
from app.core.pagination import PaginationParams
from app.domain.file_ingestion import (
    ChunkStatus,
    EmbeddingJobStatus,
    ExtractionStatus,
    ProcessingFailureKind,
    ProcessingJobStatus,
    ProcessingStage,
)
from app.domain.file_vault import FileDeletionStatus, FileProcessingStatus
from app.domain.foundation import DomainEventType, NotificationSeverity, NotificationType
from app.models.auth import User
from app.models.file_ingestion import (
    EmbeddingJob,
    ExtractionResult,
    FileChunk,
    ProcessingFailure,
    ProcessingJob,
)
from app.models.file_vault import FileRecord
from app.services.file_chunking import ChunkDraft, FileChunker
from app.services.file_extractors import FileTextExtractor, TextExtractionError
from app.services.foundation import PageResult, UserDataService
from app.services.object_storage import ObjectContent, ObjectStorageError, ObjectStorageService

MAX_FAILURE_MESSAGE_LENGTH = 512


@dataclass(frozen=True)
class QueueResult:
    created: bool
    job: ProcessingJob


@dataclass(frozen=True)
class ProcessingJobView:
    failure_count: int
    job: ProcessingJob


class IngestionProcessingError(Exception):
    def __init__(
        self,
        *,
        code: str,
        failure_kind: ProcessingFailureKind,
        message: str,
        retryable: bool = True,
    ):
        super().__init__(message)
        self.code = code
        self.failure_kind = failure_kind
        self.message = message
        self.retryable = retryable


class FileIngestionService:
    def __init__(
        self,
        *,
        db: AsyncSession,
        settings: Settings,
        storage: ObjectStorageService,
    ):
        self.db = db
        self.settings = settings
        self.storage = storage
        self.extractor = FileTextExtractor()
        self.chunker = FileChunker(
            max_chars=settings.file_ingestion_chunk_size_chars,
            overlap_chars=settings.file_ingestion_chunk_overlap_chars,
        )

    async def queue_file(
        self,
        user: User,
        file_id: UUID,
        *,
        idempotency_key: str | None = None,
    ) -> QueueResult:
        file = await self._get_owned_file(user, file_id)
        return await self.queue_owned_file(user, file, idempotency_key=idempotency_key)

    async def queue_owned_file(
        self,
        user: User,
        file: FileRecord,
        *,
        idempotency_key: str | None = None,
    ) -> QueueResult:
        key = idempotency_key or f"file.ingestion:{file.id}:initial"
        result = await self.db.execute(
            select(ProcessingJob).where(
                ProcessingJob.owner_user_id == user.id,
                ProcessingJob.idempotency_key == key,
            )
        )
        existing = result.scalar_one_or_none()
        if existing is not None:
            return QueueResult(created=False, job=existing)

        job = ProcessingJob(
            owner_user_id=user.id,
            file_id=file.id,
            idempotency_key=key,
            status=ProcessingJobStatus.QUEUED.value,
            stage=ProcessingStage.QUEUED.value,
            attempt_count=0,
            max_attempts=self.settings.file_ingestion_max_attempts,
            next_attempt_at=datetime.now(UTC),
            metadata_json={"queueName": self.settings.file_ingestion_queue_name},
        )
        self.db.add(job)
        file.processing_status = FileProcessingStatus.QUEUED.value
        file.updated_at = datetime.now(UTC)
        try:
            await self.db.flush()
        except IntegrityError as exc:
            raise AppError(
                409, "processing_already_queued", "File processing is already queued."
            ) from exc
        return QueueResult(created=True, job=job)

    async def list_jobs(
        self,
        user: User,
        pagination: PaginationParams,
        *,
        file_id: UUID | None = None,
    ) -> PageResult[ProcessingJobView]:
        predicates = [ProcessingJob.owner_user_id == user.id]
        if file_id is not None:
            await self._get_owned_file(user, file_id, include_deleted=True)
            predicates.append(ProcessingJob.file_id == file_id)

        total = await self._count(select(func.count(ProcessingJob.id)).where(*predicates))
        result = await self.db.execute(
            select(ProcessingJob)
            .where(*predicates)
            .order_by(ProcessingJob.created_at.desc(), ProcessingJob.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        jobs = list(result.scalars().all())
        return PageResult(
            items=[await self._build_job_view(job) for job in jobs],
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def job_view(self, job: ProcessingJob) -> ProcessingJobView:
        return await self._build_job_view(job)

    async def list_chunks(
        self,
        user: User,
        file_id: UUID,
        pagination: PaginationParams,
    ) -> PageResult[FileChunk]:
        await self._get_owned_file(user, file_id)
        predicates = [
            FileChunk.owner_user_id == user.id,
            FileChunk.file_id == file_id,
            FileChunk.status == ChunkStatus.READY.value,
        ]
        total = await self._count(select(func.count(FileChunk.id)).where(*predicates))
        result = await self.db.execute(
            select(FileChunk)
            .where(*predicates)
            .order_by(FileChunk.sequence_number.asc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def retry_job(self, user: User, job_id: UUID) -> ProcessingJobView:
        job = await self._get_owned_job(user, job_id)
        if job.status != ProcessingJobStatus.FAILED.value:
            raise AppError(
                409, "processing_not_failed", "Only failed processing jobs can be retried."
            )
        if job.attempt_count >= job.max_attempts:
            raise AppError(409, "processing_retry_limit_reached", "Processing retry limit reached.")

        file = await self._get_owned_file(user, job.file_id)
        now = datetime.now(UTC)
        job.status = ProcessingJobStatus.QUEUED.value
        job.stage = ProcessingStage.QUEUED.value
        job.locked_at = None
        job.completed_at = None
        job.last_error_code = None
        job.last_error_message = None
        job.next_attempt_at = now
        job.updated_at = now
        file.processing_status = FileProcessingStatus.QUEUED.value
        file.updated_at = now
        await UserDataService(self.db).record_audit_log(
            user,
            action="file.processing_retried",
            entity_type="processing_job",
            entity_id=job.id,
            metadata={"fileId": str(file.id), "attemptCount": job.attempt_count},
        )
        await self.db.flush()
        return await self._build_job_view(job)

    async def process_next_job(self) -> ProcessingJob | None:
        now = datetime.now(UTC)
        result = await self.db.execute(
            select(ProcessingJob)
            .where(
                ProcessingJob.status == ProcessingJobStatus.QUEUED.value,
                or_(ProcessingJob.next_attempt_at.is_(None), ProcessingJob.next_attempt_at <= now),
            )
            .order_by(ProcessingJob.created_at.asc(), ProcessingJob.id.asc())
            .limit(1)
            .with_for_update(skip_locked=True)
        )
        job = result.scalar_one_or_none()
        if job is None:
            return None
        await self.process_job(job.id)
        return job

    async def process_job(self, job_id: UUID) -> ProcessingJob:
        job = await self._get_job(job_id)
        user = await self._get_user(job.owner_user_id)
        file = await self._get_owned_file(user, job.file_id, include_deleted=True)
        now = datetime.now(UTC)
        job.status = ProcessingJobStatus.PROCESSING.value
        job.stage = ProcessingStage.VALIDATING.value
        job.attempt_count += 1
        job.locked_at = now
        job.started_at = job.started_at or now
        job.updated_at = now
        file.processing_status = FileProcessingStatus.PROCESSING.value
        file.updated_at = now
        await self.db.flush()

        try:
            if file.deletion_status == FileDeletionStatus.SOFT_DELETED.value:
                raise IngestionProcessingError(
                    code="file_deleted",
                    failure_kind=ProcessingFailureKind.VALIDATION,
                    message="Deleted files are not processed.",
                    retryable=False,
                )

            job.stage = ProcessingStage.EXTRACTING.value
            content = await self._read_file_content(file)
            document = self.extractor.extract(file, content.body)

            job.stage = ProcessingStage.CHUNKING.value
            chunks = self.chunker.chunk(document)

            job.stage = ProcessingStage.INDEXING.value
            await self._replace_file_chunks(job, chunks)
            extraction_status = (
                ExtractionStatus.COMPLETED if chunks else ExtractionStatus.EMPTY
            ).value
            self.db.add(
                ExtractionResult(
                    owner_user_id=job.owner_user_id,
                    file_id=file.id,
                    processing_job_id=job.id,
                    status=extraction_status,
                    extractor_name=document.extractor_name,
                    text_char_count=document.text_char_count,
                    chunk_count=len(chunks),
                    source_metadata=document.metadata,
                )
            )

            job.stage = ProcessingStage.EMBEDDING.value
            embedding_status = (
                EmbeddingJobStatus.QUEUED
                if self.settings.file_ingestion_embeddings_enabled
                else EmbeddingJobStatus.SKIPPED
            )
            self.db.add(
                EmbeddingJob(
                    owner_user_id=job.owner_user_id,
                    file_id=file.id,
                    processing_job_id=job.id,
                    status=embedding_status.value,
                    max_attempts=self.settings.file_ingestion_max_attempts,
                    completed_at=None
                    if embedding_status == EmbeddingJobStatus.QUEUED
                    else datetime.now(UTC),
                )
            )

            await self._mark_job_completed(user, file, job, chunk_count=len(chunks))
        except TextExtractionError as exc:
            await self._mark_job_failed(
                user,
                file,
                job,
                error=IngestionProcessingError(
                    code=exc.code,
                    failure_kind=ProcessingFailureKind.EXTRACTION,
                    message=exc.message,
                ),
            )
        except IngestionProcessingError as exc:
            await self._mark_job_failed(user, file, job, error=exc)
        except Exception as exc:
            await self._mark_job_failed(
                user,
                file,
                job,
                error=IngestionProcessingError(
                    code="file_processing_failed",
                    failure_kind=ProcessingFailureKind.INTERNAL,
                    message="File processing failed.",
                ),
            )
            raise AppError(500, "file_processing_failed", "File processing failed.") from exc

        await self.db.flush()
        return job

    async def delete_file_derivatives(self, user: User, file_id: UUID) -> None:
        await self.db.execute(
            delete(FileChunk).where(
                FileChunk.owner_user_id == user.id, FileChunk.file_id == file_id
            )
        )
        await self.db.execute(
            delete(ExtractionResult).where(
                ExtractionResult.owner_user_id == user.id,
                ExtractionResult.file_id == file_id,
            )
        )
        await self.db.execute(
            delete(EmbeddingJob).where(
                EmbeddingJob.owner_user_id == user.id,
                EmbeddingJob.file_id == file_id,
            )
        )
        await self.db.execute(
            delete(ProcessingFailure).where(
                ProcessingFailure.owner_user_id == user.id,
                ProcessingFailure.file_id == file_id,
            )
        )
        await self.db.execute(
            delete(ProcessingJob).where(
                ProcessingJob.owner_user_id == user.id,
                ProcessingJob.file_id == file_id,
            )
        )
        await self.db.flush()

    async def _read_file_content(self, file: FileRecord) -> ObjectContent:
        try:
            return await self.storage.read_object(
                bucket=file.object_bucket,
                key=file.object_key,
                max_bytes=self.settings.file_vault_max_upload_bytes,
            )
        except ObjectStorageError as exc:
            raise IngestionProcessingError(
                code="object_read_failed",
                failure_kind=ProcessingFailureKind.STORAGE,
                message="Aetherium could not read the uploaded object.",
            ) from exc

    async def _replace_file_chunks(self, job: ProcessingJob, chunks: list[ChunkDraft]) -> None:
        await self.db.execute(
            delete(FileChunk).where(
                FileChunk.owner_user_id == job.owner_user_id,
                FileChunk.file_id == job.file_id,
            )
        )
        for chunk in chunks:
            self.db.add(
                FileChunk(
                    owner_user_id=job.owner_user_id,
                    file_id=job.file_id,
                    processing_job_id=job.id,
                    sequence_number=chunk.sequence_number,
                    chunk_text=chunk.chunk_text,
                    search_text=chunk.search_text,
                    token_estimate=chunk.token_estimate,
                    page_number=chunk.page_number,
                    section_label=chunk.section_label,
                    source_metadata=chunk.source_metadata,
                    status=ChunkStatus.READY.value,
                )
            )

    async def _mark_job_completed(
        self,
        user: User,
        file: FileRecord,
        job: ProcessingJob,
        *,
        chunk_count: int,
    ) -> None:
        now = datetime.now(UTC)
        job.status = ProcessingJobStatus.COMPLETED.value
        job.stage = ProcessingStage.READY.value
        job.locked_at = None
        job.completed_at = now
        job.last_error_code = None
        job.last_error_message = None
        job.updated_at = now
        file.processing_status = FileProcessingStatus.READY.value
        file.updated_at = now
        foundation = UserDataService(self.db)
        event = await foundation.create_domain_event(
            user,
            event_type=DomainEventType.FILE_INGESTED,
            idempotency_key=f"file.ingested:{job.id}",
            payload={
                "chunkCount": chunk_count,
                "fileId": str(file.id),
                "processingJobId": str(job.id),
            },
        )
        if event.created:
            await foundation.create_notification(
                user,
                title="File processing complete",
                body=f"{file.display_name} is ready for future search and retrieval.",
                notification_type=NotificationType.PROCESSING,
                severity=NotificationSeverity.SUCCESS,
                source_event_id=event.event.id,
                action_url=f"/app/library?file={file.id}",
            )
        await foundation.record_audit_log(
            user,
            action="file.ingested",
            entity_type="file",
            entity_id=file.id,
            metadata={"chunkCount": chunk_count, "processingJobId": str(job.id)},
        )

    async def _mark_job_failed(
        self,
        user: User,
        file: FileRecord,
        job: ProcessingJob,
        *,
        error: IngestionProcessingError,
    ) -> None:
        now = datetime.now(UTC)
        message = error.message[:MAX_FAILURE_MESSAGE_LENGTH]
        job.status = ProcessingJobStatus.FAILED.value
        job.stage = ProcessingStage.FAILED.value
        job.locked_at = None
        job.completed_at = now
        job.last_error_code = error.code
        job.last_error_message = message
        job.updated_at = now
        file.processing_status = FileProcessingStatus.FAILED.value
        file.updated_at = now
        self.db.add(
            ProcessingFailure(
                owner_user_id=job.owner_user_id,
                file_id=file.id,
                processing_job_id=job.id,
                failure_kind=error.failure_kind.value,
                error_code=error.code,
                message=message,
                retryable=error.retryable and job.attempt_count < job.max_attempts,
            )
        )
        await UserDataService(self.db).create_notification(
            user,
            title="File processing failed",
            body=f"{file.display_name} could not be processed.",
            notification_type=NotificationType.PROCESSING,
            severity=NotificationSeverity.ERROR,
            action_url=f"/app/library?file={file.id}",
        )

    async def _build_job_view(self, job: ProcessingJob) -> ProcessingJobView:
        failure_count = await self._count(
            select(func.count(ProcessingFailure.id)).where(
                ProcessingFailure.owner_user_id == job.owner_user_id,
                ProcessingFailure.processing_job_id == job.id,
            )
        )
        return ProcessingJobView(failure_count=failure_count, job=job)

    async def _get_user(self, user_id: UUID) -> User:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise AppError(404, "not_found", "User was not found.")
        return user

    async def _get_job(self, job_id: UUID) -> ProcessingJob:
        result = await self.db.execute(select(ProcessingJob).where(ProcessingJob.id == job_id))
        job = result.scalar_one_or_none()
        if job is None:
            raise AppError(404, "not_found", "Processing job was not found.")
        return job

    async def _get_owned_job(self, user: User, job_id: UUID) -> ProcessingJob:
        result = await self.db.execute(
            select(ProcessingJob).where(
                ProcessingJob.id == job_id,
                ProcessingJob.owner_user_id == user.id,
            )
        )
        job = result.scalar_one_or_none()
        if job is None:
            raise AppError(404, "not_found", "Processing job was not found.")
        return job

    async def _get_owned_file(
        self,
        user: User,
        file_id: UUID,
        *,
        include_deleted: bool = False,
    ) -> FileRecord:
        predicates = [FileRecord.id == file_id, FileRecord.owner_user_id == user.id]
        if not include_deleted:
            predicates.append(FileRecord.deleted_at.is_(None))
        result = await self.db.execute(select(FileRecord).where(*predicates))
        file = result.scalar_one_or_none()
        if file is None:
            raise AppError(404, "not_found", "File was not found.")
        return file

    async def _count(self, query: Select[tuple[int]]) -> int:
        value = await self.db.scalar(query)
        return int(value or 0)
