from __future__ import annotations

from datetime import date, datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import (
    JSON,
    CheckConstraint,
    Date,
    DateTime,
    Float,
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
from app.domain.habits import (
    HabitLogStatus,
    HabitScheduleType,
    HabitStatus,
    HabitTargetPeriod,
    HabitValueType,
    ReviewPeriod,
)
from app.models.foundation import enum_values_sql


class Habit(TimestampMixin, Base):
    __tablename__ = "habits"
    __table_args__ = (
        CheckConstraint(f"status IN ({enum_values_sql(HabitStatus)})", name="status_allowed"),
        CheckConstraint(
            f"value_type IN ({enum_values_sql(HabitValueType)})",
            name="value_type_allowed",
        ),
        Index("ix_habits_owner_status_updated", "owner_user_id", "status", "updated_at"),
        Index("ix_habits_owner_created", "owner_user_id", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=HabitStatus.ACTIVE.value
    )
    value_type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=HabitValueType.BOOLEAN.value,
    )
    color: Mapped[str | None] = mapped_column(String(32), nullable=True)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class HabitSchedule(TimestampMixin, Base):
    __tablename__ = "habit_schedules"
    __table_args__ = (
        CheckConstraint(
            f"schedule_type IN ({enum_values_sql(HabitScheduleType)})",
            name="schedule_type_allowed",
        ),
        CheckConstraint(
            "weekly_target IS NULL OR weekly_target > 0", name="weekly_target_positive"
        ),
        UniqueConstraint("habit_id", name="uq_habit_schedules_habit_id"),
        Index("ix_habit_schedules_owner_habit", "owner_user_id", "habit_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    habit_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("habits.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    schedule_type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=HabitScheduleType.DAILY.value,
    )
    weekdays: Mapped[list[int]] = mapped_column(JSON, nullable=False, default=list)
    weekly_target: Mapped[int | None] = mapped_column(Integer, nullable=True)
    starts_on: Mapped[date] = mapped_column(Date, nullable=False)
    time_zone: Mapped[str] = mapped_column(String(64), nullable=False, default="UTC")


class HabitTarget(TimestampMixin, Base):
    __tablename__ = "habit_targets"
    __table_args__ = (
        CheckConstraint("target_value > 0", name="target_value_positive"),
        CheckConstraint(
            f"target_period IN ({enum_values_sql(HabitTargetPeriod)})",
            name="target_period_allowed",
        ),
        UniqueConstraint("habit_id", name="uq_habit_targets_habit_id"),
        Index("ix_habit_targets_owner_habit", "owner_user_id", "habit_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    habit_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("habits.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    target_value: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    target_unit: Mapped[str | None] = mapped_column(String(40), nullable=True)
    target_period: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        default=HabitTargetPeriod.DAY.value,
    )


class HabitLog(TimestampMixin, Base):
    __tablename__ = "habit_logs"
    __table_args__ = (
        CheckConstraint("value >= 0", name="value_nonnegative"),
        CheckConstraint(f"status IN ({enum_values_sql(HabitLogStatus)})", name="status_allowed"),
        UniqueConstraint("owner_user_id", "habit_id", "log_date", name="uq_habit_logs_owner_date"),
        Index("ix_habit_logs_owner_habit_date", "owner_user_id", "habit_id", "log_date"),
        Index("ix_habit_logs_owner_date", "owner_user_id", "log_date"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    habit_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("habits.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    log_date: Mapped[date] = mapped_column(Date, nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    unit: Mapped[str | None] = mapped_column(String(40), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=HabitLogStatus.COMPLETED.value,
    )


class HabitStreak(TimestampMixin, Base):
    __tablename__ = "habit_streaks"
    __table_args__ = (
        CheckConstraint("current_streak >= 0", name="current_streak_nonnegative"),
        CheckConstraint("best_streak >= 0", name="best_streak_nonnegative"),
        CheckConstraint("recovery_streak >= 0", name="recovery_streak_nonnegative"),
        CheckConstraint(
            "completion_rate_30d >= 0 AND completion_rate_30d <= 1",
            name="completion_rate_30d_range",
        ),
        UniqueConstraint("habit_id", name="uq_habit_streaks_habit_id"),
        Index("ix_habit_streaks_owner_habit", "owner_user_id", "habit_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    habit_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("habits.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    current_streak: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    best_streak: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    recovery_streak: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    completion_rate_30d: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    last_logged_on: Mapped[date | None] = mapped_column(Date, nullable=True)


class DailyCheckIn(TimestampMixin, Base):
    __tablename__ = "daily_check_ins"
    __table_args__ = (
        CheckConstraint("mood IS NULL OR (mood >= 1 AND mood <= 5)", name="mood_range"),
        CheckConstraint("energy IS NULL OR (energy >= 1 AND energy <= 5)", name="energy_range"),
        UniqueConstraint("owner_user_id", "check_in_date", name="uq_daily_check_ins_owner_date"),
        Index("ix_daily_check_ins_owner_date", "owner_user_id", "check_in_date"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    check_in_date: Mapped[date] = mapped_column(Date, nullable=False)
    mood: Mapped[int | None] = mapped_column(Integer, nullable=True)
    energy: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class WeeklyReview(TimestampMixin, Base):
    __tablename__ = "weekly_reviews"
    __table_args__ = (
        UniqueConstraint("owner_user_id", "week_start", name="uq_weekly_reviews_owner_week"),
        Index("ix_weekly_reviews_owner_week", "owner_user_id", "week_start"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    week_start: Mapped[date] = mapped_column(Date, nullable=False)
    wins: Mapped[str | None] = mapped_column(Text, nullable=True)
    challenges: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_steps: Mapped[str | None] = mapped_column(Text, nullable=True)
    period: Mapped[str] = mapped_column(String(16), nullable=False, default=ReviewPeriod.WEEK.value)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSON,
        nullable=False,
        default=dict,
    )
