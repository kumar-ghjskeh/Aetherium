from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domain.file_ingestion import ChunkStatus, ProcessingJobStatus, ProcessingStage
from app.models.file_ingestion import FileChunk, ProcessingJob
from app.services.file_ingestion import ProcessingJobView


class FileIngestionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ProcessingJobResponse(FileIngestionSchema):
    id: UUID
    file_id: UUID = Field(alias="fileId")
    status: ProcessingJobStatus
    stage: ProcessingStage
    attempt_count: int = Field(alias="attemptCount")
    max_attempts: int = Field(alias="maxAttempts")
    failure_count: int = Field(alias="failureCount")
    locked_at: datetime | None = Field(alias="lockedAt")
    started_at: datetime | None = Field(alias="startedAt")
    completed_at: datetime | None = Field(alias="completedAt")
    next_attempt_at: datetime | None = Field(alias="nextAttemptAt")
    last_error_code: str | None = Field(alias="lastErrorCode")
    last_error_message: str | None = Field(alias="lastErrorMessage")
    metadata: dict[str, Any]
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_view(cls, view: ProcessingJobView) -> ProcessingJobResponse:
        job = view.job
        return cls.from_job(job, failure_count=view.failure_count)

    @classmethod
    def from_job(cls, job: ProcessingJob, *, failure_count: int = 0) -> ProcessingJobResponse:
        return cls(
            id=job.id,
            fileId=job.file_id,
            status=ProcessingJobStatus(job.status),
            stage=ProcessingStage(job.stage),
            attemptCount=job.attempt_count,
            maxAttempts=job.max_attempts,
            failureCount=failure_count,
            lockedAt=job.locked_at,
            startedAt=job.started_at,
            completedAt=job.completed_at,
            nextAttemptAt=job.next_attempt_at,
            lastErrorCode=job.last_error_code,
            lastErrorMessage=job.last_error_message,
            metadata=job.metadata_json,
            createdAt=job.created_at,
            updatedAt=job.updated_at,
        )


class ProcessingJobPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[ProcessingJobResponse]
    total: int
    limit: int
    offset: int


class FileChunkResponse(FileIngestionSchema):
    id: UUID
    file_id: UUID = Field(alias="fileId")
    processing_job_id: UUID = Field(alias="processingJobId")
    sequence_number: int = Field(alias="sequenceNumber")
    chunk_text: str = Field(alias="chunkText")
    token_estimate: int = Field(alias="tokenEstimate")
    page_number: int | None = Field(alias="pageNumber")
    section_label: str | None = Field(alias="sectionLabel")
    status: ChunkStatus
    source_metadata: dict[str, Any] = Field(alias="sourceMetadata")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_chunk(cls, chunk: FileChunk) -> FileChunkResponse:
        return cls(
            id=chunk.id,
            fileId=chunk.file_id,
            processingJobId=chunk.processing_job_id,
            sequenceNumber=chunk.sequence_number,
            chunkText=chunk.chunk_text,
            tokenEstimate=chunk.token_estimate,
            pageNumber=chunk.page_number,
            sectionLabel=chunk.section_label,
            status=ChunkStatus(chunk.status),
            sourceMetadata=chunk.source_metadata,
            createdAt=chunk.created_at,
            updatedAt=chunk.updated_at,
        )


class FileChunkPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[FileChunkResponse]
    total: int
    limit: int
    offset: int
