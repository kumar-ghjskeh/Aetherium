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
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin
from app.domain.ai import AIMessageRole
from app.domain.mentors import (
    ConversationMemoryPolicy,
    ConversationStatus,
    MentorTone,
    MessageSourceType,
    MessageStatus,
)
from app.models.foundation import enum_values_sql


class Mentor(TimestampMixin, Base):
    __tablename__ = "mentors"
    __table_args__ = (
        CheckConstraint(f"tone IN ({enum_values_sql(MentorTone)})", name="tone_allowed"),
        UniqueConstraint("owner_user_id", "slug", name="uq_mentors_owner_slug"),
        Index("ix_mentors_owner_archived", "owner_user_id", "archived_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    slug: Mapped[str] = mapped_column(String(80), nullable=False)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    fictional_identity: Mapped[str] = mapped_column(String(160), nullable=False)
    avatar_reference: Mapped[str | None] = mapped_column(String(160), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    system_instructions: Mapped[str] = mapped_column(Text, nullable=False)
    tone: Mapped[str] = mapped_column(String(32), nullable=False, default=MentorTone.CALM.value)
    preferred_model_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class MentorPermission(TimestampMixin, Base):
    __tablename__ = "mentor_permissions"
    __table_args__ = (
        UniqueConstraint("mentor_id", name="uq_mentor_permissions_mentor_id"),
        Index("ix_mentor_permissions_owner_mentor", "owner_user_id", "mentor_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    mentor_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("mentors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    allowed_tools: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    allowed_collection_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    allow_file_content: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    allow_conversations: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    allow_projects: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    allow_learning_records: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    allow_habit_data: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    allow_profile_data: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class Conversation(TimestampMixin, Base):
    __tablename__ = "conversations"
    __table_args__ = (
        CheckConstraint(
            f"status IN ({enum_values_sql(ConversationStatus)})",
            name="status_allowed",
        ),
        Index("ix_conversations_owner_status_updated", "owner_user_id", "status", "updated_at"),
        Index("ix_conversations_owner_mentor", "owner_user_id", "mentor_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    mentor_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("mentors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=ConversationStatus.ACTIVE.value
    )
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ConversationMemorySettings(TimestampMixin, Base):
    __tablename__ = "conversation_memory_settings"
    __table_args__ = (
        CheckConstraint(
            f"memory_policy IN ({enum_values_sql(ConversationMemoryPolicy)})",
            name="memory_policy_allowed",
        ),
        UniqueConstraint(
            "conversation_id",
            name="uq_conversation_memory_settings_conversation_id",
        ),
        Index(
            "ix_conversation_memory_settings_owner_conversation", "owner_user_id", "conversation_id"
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    conversation_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    memory_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    memory_policy: Mapped[str] = mapped_column(
        String(32), nullable=False, default=ConversationMemoryPolicy.DISABLED.value
    )
    memory_summary: Mapped[str | None] = mapped_column(Text, nullable=True)


class Message(TimestampMixin, Base):
    __tablename__ = "messages"
    __table_args__ = (
        CheckConstraint(f"role IN ({enum_values_sql(AIMessageRole)})", name="role_allowed"),
        CheckConstraint(
            f"status IN ({enum_values_sql(MessageStatus)})",
            name="status_allowed",
        ),
        Index(
            "ix_messages_owner_conversation_created",
            "owner_user_id",
            "conversation_id",
            "created_at",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    conversation_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=MessageStatus.COMPLETE.value
    )
    ai_usage_record_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("ai_usage_records.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    provider_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    model_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(512), nullable=True)
    edited_from_message_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("messages.id", ondelete="SET NULL"),
        nullable=True,
    )
    regenerated_from_message_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("messages.id", ondelete="SET NULL"),
        nullable=True,
    )


class MessageSource(TimestampMixin, Base):
    __tablename__ = "message_sources"
    __table_args__ = (
        CheckConstraint(
            f"source_type IN ({enum_values_sql(MessageSourceType)})",
            name="source_type_allowed",
        ),
        Index("ix_message_sources_owner_message", "owner_user_id", "message_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    message_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_type: Mapped[str] = mapped_column(String(40), nullable=False)
    source_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    page_number: Mapped[int | None] = mapped_column(nullable=True)
    section_label: Mapped[str | None] = mapped_column(String(160), nullable=True)
    snippet: Mapped[str | None] = mapped_column(String(512), nullable=True)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        "metadata", JSON, nullable=False, default=dict
    )
