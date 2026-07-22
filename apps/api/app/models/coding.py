from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin
from app.domain.coding import (
    CodeAssistantKind,
    CodeAssistantStatus,
    CodeSnippetStatus,
    CodingAttemptStatus,
    CodingExerciseDifficulty,
    CodingExerciseStatus,
    CodingLanguage,
)
from app.models.foundation import enum_values_sql


class CodeSnippet(TimestampMixin, Base):
    __tablename__ = "code_snippets"
    __table_args__ = (
        CheckConstraint(
            f"language IN ({enum_values_sql(CodingLanguage)})", name="language_allowed"
        ),
        CheckConstraint(f"status IN ({enum_values_sql(CodeSnippetStatus)})", name="status_allowed"),
        Index("ix_code_snippets_owner_status_updated", "owner_user_id", "status", "updated_at"),
        Index("ix_code_snippets_owner_project", "owner_user_id", "project_id"),
        Index("ix_code_snippets_owner_file", "owner_user_id", "file_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    language: Mapped[str] = mapped_column(String(32), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=CodeSnippetStatus.ACTIVE.value
    )
    project_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    file_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("files.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class CodingExercise(TimestampMixin, Base):
    __tablename__ = "coding_exercises"
    __table_args__ = (
        CheckConstraint(
            f"language IN ({enum_values_sql(CodingLanguage)})", name="language_allowed"
        ),
        CheckConstraint(
            f"difficulty IN ({enum_values_sql(CodingExerciseDifficulty)})",
            name="difficulty_allowed",
        ),
        CheckConstraint(
            f"status IN ({enum_values_sql(CodingExerciseStatus)})", name="status_allowed"
        ),
        Index("ix_coding_exercises_owner_status_updated", "owner_user_id", "status", "updated_at"),
        Index("ix_coding_exercises_owner_topic", "owner_user_id", "topic_id"),
        Index("ix_coding_exercises_owner_project", "owner_user_id", "project_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    language: Mapped[str] = mapped_column(String(32), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    starter_code: Mapped[str] = mapped_column(Text, nullable=False, default="")
    solution_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulty: Mapped[str] = mapped_column(
        String(32), nullable=False, default=CodingExerciseDifficulty.PRACTICE.value
    )
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=CodingExerciseStatus.ACTIVE.value
    )
    topic_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("topics.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    project_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )


class CodingExerciseAttempt(TimestampMixin, Base):
    __tablename__ = "coding_exercise_attempts"
    __table_args__ = (
        CheckConstraint(
            f"status IN ({enum_values_sql(CodingAttemptStatus)})", name="status_allowed"
        ),
        Index(
            "ix_coding_exercise_attempts_owner_exercise",
            "owner_user_id",
            "exercise_id",
            "created_at",
        ),
        Index("ix_coding_exercise_attempts_owner_snippet", "owner_user_id", "snippet_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    exercise_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("coding_exercises.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    snippet_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("code_snippets.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    submitted_code: Mapped[str] = mapped_column(Text, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=CodingAttemptStatus.SUBMITTED.value
    )


class CodeAssistantRequest(TimestampMixin, Base):
    __tablename__ = "code_assistant_requests"
    __table_args__ = (
        CheckConstraint(f"kind IN ({enum_values_sql(CodeAssistantKind)})", name="kind_allowed"),
        CheckConstraint(
            f"status IN ({enum_values_sql(CodeAssistantStatus)})", name="status_allowed"
        ),
        CheckConstraint(
            f"language IN ({enum_values_sql(CodingLanguage)})", name="language_allowed"
        ),
        Index(
            "ix_code_assistant_requests_owner_created",
            "owner_user_id",
            "created_at",
        ),
        Index("ix_code_assistant_requests_owner_snippet", "owner_user_id", "snippet_id"),
        Index("ix_code_assistant_requests_owner_project", "owner_user_id", "project_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    snippet_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("code_snippets.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    project_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    ai_usage_record_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("ai_usage_records.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    language: Mapped[str] = mapped_column(String(32), nullable=False)
    prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    code_excerpt: Mapped[str] = mapped_column(Text, nullable=False)
    response: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=CodeAssistantStatus.COMPLETE.value
    )
    provider_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    model_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(512), nullable=True)
