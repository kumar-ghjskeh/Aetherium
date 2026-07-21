from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin
from app.domain.ai import AIFeature, AIOperation, AIProviderKind, AIUsageStatus
from app.models.foundation import enum_values_sql


class AIConsentPolicy(TimestampMixin, Base):
    __tablename__ = "ai_consent_policies"
    __table_args__ = (
        CheckConstraint(f"feature IN ({enum_values_sql(AIFeature)})", name="feature_allowed"),
        UniqueConstraint(
            "owner_user_id",
            "feature",
            name="uq_ai_consent_policies_owner_feature",
        ),
        Index("ix_ai_consent_policies_owner_feature", "owner_user_id", "feature"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    feature: Mapped[str] = mapped_column(String(64), nullable=False)
    external_providers_allowed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    allow_file_content: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    allow_collections: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    allow_conversations: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    allow_projects: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    allow_learning_records: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    allow_habit_data: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    allow_profile_data: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    allowed_collection_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)


class AIModelConfiguration(TimestampMixin, Base):
    __tablename__ = "ai_model_configurations"
    __table_args__ = (
        CheckConstraint(f"feature IN ({enum_values_sql(AIFeature)})", name="feature_allowed"),
        CheckConstraint(
            f"provider_kind IN ({enum_values_sql(AIProviderKind)})",
            name="provider_kind_allowed",
        ),
        CheckConstraint("temperature >= 0 AND temperature <= 2", name="temperature_range"),
        CheckConstraint("max_output_tokens > 0", name="max_output_tokens_positive"),
        UniqueConstraint(
            "owner_user_id",
            "feature",
            name="uq_ai_model_configurations_owner_feature",
        ),
        Index("ix_ai_model_configurations_owner_feature", "owner_user_id", "feature"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    feature: Mapped[str] = mapped_column(String(64), nullable=False)
    provider_name: Mapped[str] = mapped_column(String(80), nullable=False)
    provider_kind: Mapped[str] = mapped_column(String(40), nullable=False)
    model_name: Mapped[str] = mapped_column(String(120), nullable=False)
    fallback_provider_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    fallback_model_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    temperature: Mapped[float] = mapped_column(Float, nullable=False, default=0.2)
    max_output_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=512)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class AIUsageRecord(TimestampMixin, Base):
    __tablename__ = "ai_usage_records"
    __table_args__ = (
        CheckConstraint(f"feature IN ({enum_values_sql(AIFeature)})", name="feature_allowed"),
        CheckConstraint(
            f"provider_kind IN ({enum_values_sql(AIProviderKind)})",
            name="provider_kind_allowed",
        ),
        CheckConstraint(f"operation IN ({enum_values_sql(AIOperation)})", name="operation_allowed"),
        CheckConstraint(f"status IN ({enum_values_sql(AIUsageStatus)})", name="status_allowed"),
        CheckConstraint("input_tokens >= 0", name="input_tokens_nonnegative"),
        CheckConstraint("output_tokens >= 0", name="output_tokens_nonnegative"),
        CheckConstraint("total_tokens >= 0", name="total_tokens_nonnegative"),
        CheckConstraint("estimated_cost_micro_usd >= 0", name="estimated_cost_nonnegative"),
        CheckConstraint("latency_ms >= 0", name="latency_nonnegative"),
        UniqueConstraint("owner_user_id", "request_id", name="uq_ai_usage_records_owner_request"),
        Index("ix_ai_usage_records_owner_created", "owner_user_id", "created_at"),
        Index(
            "ix_ai_usage_records_owner_feature_created", "owner_user_id", "feature", "created_at"
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    request_id: Mapped[str] = mapped_column(String(120), nullable=False)
    feature: Mapped[str] = mapped_column(String(64), nullable=False)
    provider_name: Mapped[str] = mapped_column(String(80), nullable=False)
    provider_kind: Mapped[str] = mapped_column(String(40), nullable=False)
    model_name: Mapped[str] = mapped_column(String(120), nullable=False)
    operation: Mapped[str] = mapped_column(String(40), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    input_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    estimated_cost_micro_usd: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    used_fallback: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    error_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(512), nullable=True)
