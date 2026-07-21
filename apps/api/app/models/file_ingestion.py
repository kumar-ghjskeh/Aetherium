from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin
from app.domain.file_ingestion import (
    ChunkStatus,
    EmbeddingJobStatus,
    ExtractionStatus,
    ProcessingFailureKind,
    ProcessingJobStatus,
    ProcessingStage,
)
from app.models.foundation import enum_values_sql


class ProcessingJob(TimestampMixin, Base):
    __tablename__ = "processing_jobs"
    __table_args__ = (
        CheckConstraint(
            f"status IN ({enum_values_sql(ProcessingJobStatus)})",
            name="status_allowed",
        ),
        CheckConstraint(
            f"stage IN ({enum_values_sql(ProcessingStage)})",
            name="stage_allowed",
        ),
        CheckConstraint("attempt_count >= 0", name="attempt_count_nonnegative"),
        CheckConstraint("max_attempts > 0", name="max_attempts_positive"),
        UniqueConstraint("owner_user_id", "idempotency_key", name="uq_processing_jobs_owner_key"),
        Index("ix_processing_jobs_owner_file", "owner_user_id", "file_id"),
        Index("ix_processing_jobs_status_next", "status", "next_attempt_at", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    idempotency_key: Mapped[str] = mapped_column(String(160), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=ProcessingJobStatus.QUEUED.value,
    )
    stage: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=ProcessingStage.QUEUED.value,
    )
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    max_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    next_attempt_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    last_error_message: Mapped[str | None] = mapped_column(String(512), nullable=True)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSON,
        nullable=False,
        default=dict,
    )


class ExtractionResult(TimestampMixin, Base):
    __tablename__ = "extraction_results"
    __table_args__ = (
        CheckConstraint(
            f"status IN ({enum_values_sql(ExtractionStatus)})",
            name="status_allowed",
        ),
        CheckConstraint("text_char_count >= 0", name="text_char_count_nonnegative"),
        CheckConstraint("chunk_count >= 0", name="chunk_count_nonnegative"),
        UniqueConstraint("processing_job_id", name="uq_extraction_results_processing_job"),
        Index("ix_extraction_results_owner_file", "owner_user_id", "file_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    processing_job_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("processing_jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    extractor_name: Mapped[str] = mapped_column(String(80), nullable=False)
    text_char_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    chunk_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    source_metadata: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    error_message: Mapped[str | None] = mapped_column(String(512), nullable=True)


class FileChunk(TimestampMixin, Base):
    __tablename__ = "file_chunks"
    __table_args__ = (
        CheckConstraint(f"status IN ({enum_values_sql(ChunkStatus)})", name="status_allowed"),
        CheckConstraint("sequence_number >= 0", name="sequence_number_nonnegative"),
        CheckConstraint("token_estimate >= 0", name="token_estimate_nonnegative"),
        UniqueConstraint("file_id", "sequence_number", name="uq_file_chunks_file_sequence"),
        Index("ix_file_chunks_owner_file_sequence", "owner_user_id", "file_id", "sequence_number"),
        Index("ix_file_chunks_owner_status", "owner_user_id", "status"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    processing_job_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("processing_jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    search_text: Mapped[str] = mapped_column(Text, nullable=False)
    token_estimate: Mapped[int] = mapped_column(Integer, nullable=False)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    section_label: Mapped[str | None] = mapped_column(String(160), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default=ChunkStatus.READY.value)
    source_metadata: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    embedding: Mapped[list[float] | None] = mapped_column(JSON, nullable=True)


class EmbeddingJob(TimestampMixin, Base):
    __tablename__ = "embedding_jobs"
    __table_args__ = (
        CheckConstraint(
            f"status IN ({enum_values_sql(EmbeddingJobStatus)})",
            name="status_allowed",
        ),
        CheckConstraint("attempt_count >= 0", name="attempt_count_nonnegative"),
        CheckConstraint("max_attempts > 0", name="max_attempts_positive"),
        UniqueConstraint("processing_job_id", name="uq_embedding_jobs_processing_job"),
        Index("ix_embedding_jobs_owner_file", "owner_user_id", "file_id"),
        Index("ix_embedding_jobs_status_next", "status", "next_attempt_at", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    processing_job_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("processing_jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=EmbeddingJobStatus.SKIPPED.value,
    )
    provider_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    model_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    max_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    next_attempt_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    last_error_message: Mapped[str | None] = mapped_column(String(512), nullable=True)


class ProcessingFailure(TimestampMixin, Base):
    __tablename__ = "processing_failures"
    __table_args__ = (
        CheckConstraint(
            f"failure_kind IN ({enum_values_sql(ProcessingFailureKind)})",
            name="failure_kind_allowed",
        ),
        Index("ix_processing_failures_owner_file", "owner_user_id", "file_id"),
        Index("ix_processing_failures_job_created", "processing_job_id", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    processing_job_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("processing_jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    failure_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    error_code: Mapped[str] = mapped_column(String(80), nullable=False)
    message: Mapped[str] = mapped_column(String(512), nullable=False)
    retryable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
