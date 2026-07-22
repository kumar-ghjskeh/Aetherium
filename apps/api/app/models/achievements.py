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
from app.domain.achievements import (
    AchievementCategory,
    AchievementRarity,
    RewardType,
    WorldUnlockSource,
)
from app.domain.foundation import DomainEventType
from app.models.foundation import enum_values_sql


class AchievementDefinition(TimestampMixin, Base):
    __tablename__ = "achievement_definitions"
    __table_args__ = (
        CheckConstraint(
            f"category IN ({enum_values_sql(AchievementCategory)})", name="category_allowed"
        ),
        CheckConstraint(f"rarity IN ({enum_values_sql(AchievementRarity)})", name="rarity_allowed"),
        CheckConstraint("points >= 0", name="points_nonnegative"),
        Index("ix_achievement_definitions_active_category", "is_active", "category"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    slug: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    rarity: Mapped[str] = mapped_column(String(32), nullable=False)
    points: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class AchievementRule(TimestampMixin, Base):
    __tablename__ = "achievement_rules"
    __table_args__ = (
        CheckConstraint(
            f"event_type IN ({enum_values_sql(DomainEventType)})", name="event_type_allowed"
        ),
        CheckConstraint("threshold_count > 0", name="threshold_count_positive"),
        UniqueConstraint(
            "achievement_definition_id",
            "event_type",
            "counter_key",
            name="uq_achievement_rules_definition_event_counter",
        ),
        Index("ix_achievement_rules_event_active", "event_type", "is_active"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    achievement_definition_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("achievement_definitions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    counter_key: Mapped[str] = mapped_column(String(120), nullable=False)
    threshold_count: Mapped[int] = mapped_column(Integer, nullable=False)
    payload_filters: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class RewardDefinition(TimestampMixin, Base):
    __tablename__ = "reward_definitions"
    __table_args__ = (
        CheckConstraint(
            f"reward_type IN ({enum_values_sql(RewardType)})", name="reward_type_allowed"
        ),
        UniqueConstraint(
            "achievement_definition_id",
            "reward_type",
            name="uq_reward_definitions_definition_type",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    achievement_definition_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("achievement_definitions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reward_type: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        "metadata", JSON, nullable=False, default=dict
    )


class UserAchievement(TimestampMixin, Base):
    __tablename__ = "user_achievements"
    __table_args__ = (
        UniqueConstraint(
            "owner_user_id",
            "achievement_definition_id",
            name="uq_user_achievements_owner_definition",
        ),
        Index("ix_user_achievements_owner_unlocked", "owner_user_id", "unlocked_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    achievement_definition_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("achievement_definitions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_event_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("domain_events.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    progress_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    target_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    unlocked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class AchievementProgressCounter(TimestampMixin, Base):
    __tablename__ = "achievement_progress_counters"
    __table_args__ = (
        UniqueConstraint(
            "owner_user_id",
            "achievement_rule_id",
            name="uq_achievement_progress_owner_rule",
        ),
        Index("ix_achievement_progress_owner_updated", "owner_user_id", "updated_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    achievement_rule_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("achievement_rules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    counter_key: Mapped[str] = mapped_column(String(120), nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_event_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("domain_events.id", ondelete="SET NULL"),
        nullable=True,
    )


class AchievementProcessedEvent(TimestampMixin, Base):
    __tablename__ = "achievement_processed_events"
    __table_args__ = (
        UniqueConstraint(
            "owner_user_id",
            "domain_event_id",
            "achievement_rule_id",
            name="uq_achievement_processed_events_owner_event_rule",
        ),
        Index("ix_achievement_processed_events_owner_created", "owner_user_id", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    domain_event_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("domain_events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    achievement_rule_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("achievement_rules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )


class WorldUnlockRecord(TimestampMixin, Base):
    __tablename__ = "world_unlock_records"
    __table_args__ = (
        CheckConstraint(
            f"unlock_source IN ({enum_values_sql(WorldUnlockSource)})", name="unlock_source_allowed"
        ),
        UniqueConstraint(
            "owner_user_id",
            "location_id",
            name="uq_world_unlock_records_owner_location",
        ),
        Index("ix_world_unlock_records_owner_unlocked", "owner_user_id", "unlocked_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    achievement_definition_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("achievement_definitions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reward_definition_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("reward_definitions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    location_id: Mapped[str] = mapped_column(String(120), nullable=False)
    unlock_source: Mapped[str] = mapped_column(
        String(32), nullable=False, default=WorldUnlockSource.ACHIEVEMENT.value
    )
    unlocked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
