from __future__ import annotations

from datetime import date, datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Date,
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
from app.domain.notifications import (
    NotificationReviewPeriod,
    NotificationWorkflowStatus,
    NotificationWorkflowType,
)
from app.models.foundation import enum_values_sql


class NotificationPreferences(TimestampMixin, Base):
    __tablename__ = "notification_preferences"
    __table_args__ = (
        CheckConstraint("reminder_hour >= 0 AND reminder_hour <= 23", name="reminder_hour_range"),
        UniqueConstraint("owner_user_id", name="uq_notification_preferences_owner"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    in_app_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    weekly_review_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    monthly_review_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    learning_reminders_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    habit_reminders_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    processing_failure_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    ai_provider_failure_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    project_deadline_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    reminder_hour: Mapped[int] = mapped_column(Integer, nullable=False, default=9)


class NotificationWorkflowRecord(TimestampMixin, Base):
    __tablename__ = "notification_workflow_records"
    __table_args__ = (
        CheckConstraint(
            f"workflow_type IN ({enum_values_sql(NotificationWorkflowType)})",
            name="workflow_type_allowed",
        ),
        CheckConstraint(
            f"status IN ({enum_values_sql(NotificationWorkflowStatus)})",
            name="status_allowed",
        ),
        UniqueConstraint(
            "owner_user_id",
            "workflow_type",
            "source_key",
            name="uq_notification_workflow_records_owner_source",
        ),
        Index(
            "ix_notification_workflow_records_owner_type",
            "owner_user_id",
            "workflow_type",
            "created_at",
        ),
        Index(
            "ix_notification_workflow_records_owner_notification",
            "owner_user_id",
            "notification_id",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    workflow_type: Mapped[str] = mapped_column(String(48), nullable=False)
    source_key: Mapped[str] = mapped_column(String(220), nullable=False)
    status: Mapped[str] = mapped_column(
        String(24), nullable=False, default=NotificationWorkflowStatus.GENERATED.value
    )
    notification_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("notifications.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    scheduled_for: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSON,
        nullable=False,
        default=dict,
    )


class MonthlyReview(TimestampMixin, Base):
    __tablename__ = "monthly_reviews"
    __table_args__ = (
        CheckConstraint(
            f"period IN ({enum_values_sql(NotificationReviewPeriod)})",
            name="period_allowed",
        ),
        UniqueConstraint("owner_user_id", "month_start", name="uq_monthly_reviews_owner_month"),
        Index("ix_monthly_reviews_owner_month", "owner_user_id", "month_start"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    month_start: Mapped[date] = mapped_column(Date, nullable=False)
    wins: Mapped[str | None] = mapped_column(Text, nullable=True)
    challenges: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_steps: Mapped[str | None] = mapped_column(Text, nullable=True)
    period: Mapped[str] = mapped_column(
        String(16), nullable=False, default=NotificationReviewPeriod.MONTH.value
    )
    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSON,
        nullable=False,
        default=dict,
    )
