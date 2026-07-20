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
from app.domain.foundation import (
    DEFAULT_SPAWN_LOCATION_ID,
    DEFAULT_UNLOCKED_LOCATION_IDS,
    DEFAULT_VISITED_LOCATION_IDS,
    DefaultInterfaceMode,
    DomainEventType,
    NavigationMethod,
    NotificationSeverity,
    NotificationType,
    PerformancePreset,
    Theme,
)


def enum_values_sql(enum_type: type[Any]) -> str:
    return ", ".join(f"'{member.value}'" for member in enum_type)


class UserPreferences(TimestampMixin, Base):
    __tablename__ = "user_preferences"
    __table_args__ = (
        CheckConstraint(f"theme IN ({enum_values_sql(Theme)})", name="theme_allowed"),
        CheckConstraint(
            f"default_interface_mode IN ({enum_values_sql(DefaultInterfaceMode)})",
            name="default_interface_mode_allowed",
        ),
        CheckConstraint(
            f"performance_preset IN ({enum_values_sql(PerformancePreset)})",
            name="performance_preset_allowed",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    theme: Mapped[str] = mapped_column(String(16), nullable=False, default=Theme.SYSTEM.value)
    default_interface_mode: Mapped[str] = mapped_column(
        String(16), nullable=False, default=DefaultInterfaceMode.COMMAND.value
    )
    reduced_motion: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    background_music_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    ambient_audio_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    camera_effects_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    performance_preset: Mapped[str] = mapped_column(
        String(16), nullable=False, default=PerformancePreset.AUTOMATIC.value
    )
    time_zone: Mapped[str] = mapped_column(String(64), nullable=False, default="UTC")
    locale: Mapped[str] = mapped_column(String(35), nullable=False, default="en-US")
    ai_memory_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    product_analytics_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class WorldProfile(TimestampMixin, Base):
    __tablename__ = "world_profiles"
    __table_args__ = (
        CheckConstraint(
            f"preferred_navigation_method IN ({enum_values_sql(NavigationMethod)})",
            name="preferred_navigation_method_allowed",
        ),
        CheckConstraint("world_state_version > 0", name="world_state_version_positive"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    current_location_id: Mapped[str] = mapped_column(
        String(64), nullable=False, default=DEFAULT_SPAWN_LOCATION_ID
    )
    last_visited_location_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    preferred_navigation_method: Mapped[str] = mapped_column(
        String(32), nullable=False, default=NavigationMethod.COMMAND_PALETTE.value
    )
    tutorial_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    world_state_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    spawn_location_id: Mapped[str] = mapped_column(
        String(64), nullable=False, default=DEFAULT_SPAWN_LOCATION_ID
    )
    visited_location_ids: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=lambda: list(DEFAULT_VISITED_LOCATION_IDS)
    )
    unlocked_location_ids: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=lambda: list(DEFAULT_UNLOCKED_LOCATION_IDS)
    )


class DomainEvent(TimestampMixin, Base):
    __tablename__ = "domain_events"
    __table_args__ = (
        CheckConstraint(
            f"event_type IN ({enum_values_sql(DomainEventType)})",
            name="event_type_allowed",
        ),
        UniqueConstraint(
            "owner_user_id",
            "idempotency_key",
            name="uq_domain_events_owner_idempotency_key",
        ),
        Index("ix_domain_events_owner_type_occurred", "owner_user_id", "event_type", "occurred_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    idempotency_key: Mapped[str] = mapped_column(String(160), nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Notification(TimestampMixin, Base):
    __tablename__ = "notifications"
    __table_args__ = (
        CheckConstraint(
            f"notification_type IN ({enum_values_sql(NotificationType)})",
            name="notification_type_allowed",
        ),
        CheckConstraint(
            f"severity IN ({enum_values_sql(NotificationSeverity)})",
            name="severity_allowed",
        ),
        Index("ix_notifications_owner_read_created", "owner_user_id", "read_at", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_event_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("domain_events.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    notification_type: Mapped[str] = mapped_column(
        String(32), nullable=False, default=NotificationType.SYSTEM.value
    )
    severity: Mapped[str] = mapped_column(
        String(16), nullable=False, default=NotificationSeverity.INFO.value
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    action_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AuditLog(TimestampMixin, Base):
    __tablename__ = "audit_logs"
    __table_args__ = (Index("ix_audit_logs_owner_created", "owner_user_id", "created_at"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    action: Mapped[str] = mapped_column(String(96), nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    entity_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        "metadata", JSON, nullable=False, default=dict
    )
