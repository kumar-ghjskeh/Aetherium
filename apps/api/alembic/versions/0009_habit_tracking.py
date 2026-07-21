"""Add habit tracking foundation.

Revision ID: 0009_habit_tracking
Revises: 0008_ai_mentors
Create Date: 2026-07-21 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0009_habit_tracking"
down_revision: str | None = "0008_ai_mentors"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

HABIT_STATUS_VALUES = "'active', 'archived'"
HABIT_VALUE_TYPE_VALUES = "'boolean', 'duration', 'count', 'quantity'"
HABIT_SCHEDULE_TYPE_VALUES = "'daily', 'selected_weekdays', 'weekly_target'"
HABIT_TARGET_PERIOD_VALUES = "'day', 'week'"
HABIT_LOG_STATUS_VALUES = "'completed'"


def upgrade() -> None:
    op.create_table(
        "habits",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("value_type", sa.String(length=32), nullable=False),
        sa.Column("color", sa.String(length=32), nullable=True),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"status IN ({HABIT_STATUS_VALUES})",
            name=op.f("ck_habits_status_allowed"),
        ),
        sa.CheckConstraint(
            f"value_type IN ({HABIT_VALUE_TYPE_VALUES})",
            name=op.f("ck_habits_value_type_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_habits_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_habits")),
    )
    op.create_index(op.f("ix_habits_owner_user_id"), "habits", ["owner_user_id"])
    op.create_index(
        "ix_habits_owner_status_updated", "habits", ["owner_user_id", "status", "updated_at"]
    )
    op.create_index("ix_habits_owner_created", "habits", ["owner_user_id", "created_at"])
    op.execute(
        "CREATE INDEX ix_habits_search_name_fts ON habits USING GIN "
        "(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')))"
    )

    op.create_table(
        "habit_schedules",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("habit_id", sa.Uuid(), nullable=False),
        sa.Column("schedule_type", sa.String(length=32), nullable=False),
        sa.Column("weekdays", sa.JSON(), nullable=False),
        sa.Column("weekly_target", sa.Integer(), nullable=True),
        sa.Column("starts_on", sa.Date(), nullable=False),
        sa.Column("time_zone", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"schedule_type IN ({HABIT_SCHEDULE_TYPE_VALUES})",
            name=op.f("ck_habit_schedules_schedule_type_allowed"),
        ),
        sa.CheckConstraint(
            "weekly_target IS NULL OR weekly_target > 0",
            name=op.f("ck_habit_schedules_weekly_target_positive"),
        ),
        sa.ForeignKeyConstraint(
            ["habit_id"],
            ["habits.id"],
            name=op.f("fk_habit_schedules_habit_id_habits"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_habit_schedules_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_habit_schedules")),
        sa.UniqueConstraint("habit_id", name="uq_habit_schedules_habit_id"),
    )
    op.create_index(op.f("ix_habit_schedules_owner_user_id"), "habit_schedules", ["owner_user_id"])
    op.create_index(op.f("ix_habit_schedules_habit_id"), "habit_schedules", ["habit_id"])
    op.create_index(
        "ix_habit_schedules_owner_habit", "habit_schedules", ["owner_user_id", "habit_id"]
    )

    op.create_table(
        "habit_targets",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("habit_id", sa.Uuid(), nullable=False),
        sa.Column("target_value", sa.Float(), nullable=False),
        sa.Column("target_unit", sa.String(length=40), nullable=True),
        sa.Column("target_period", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "target_value > 0",
            name=op.f("ck_habit_targets_target_value_positive"),
        ),
        sa.CheckConstraint(
            f"target_period IN ({HABIT_TARGET_PERIOD_VALUES})",
            name=op.f("ck_habit_targets_target_period_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["habit_id"],
            ["habits.id"],
            name=op.f("fk_habit_targets_habit_id_habits"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_habit_targets_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_habit_targets")),
        sa.UniqueConstraint("habit_id", name="uq_habit_targets_habit_id"),
    )
    op.create_index(op.f("ix_habit_targets_owner_user_id"), "habit_targets", ["owner_user_id"])
    op.create_index(op.f("ix_habit_targets_habit_id"), "habit_targets", ["habit_id"])
    op.create_index("ix_habit_targets_owner_habit", "habit_targets", ["owner_user_id", "habit_id"])

    op.create_table(
        "habit_logs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("habit_id", sa.Uuid(), nullable=False),
        sa.Column("log_date", sa.Date(), nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("unit", sa.String(length=40), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("value >= 0", name=op.f("ck_habit_logs_value_nonnegative")),
        sa.CheckConstraint(
            f"status IN ({HABIT_LOG_STATUS_VALUES})",
            name=op.f("ck_habit_logs_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["habit_id"],
            ["habits.id"],
            name=op.f("fk_habit_logs_habit_id_habits"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_habit_logs_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_habit_logs")),
        sa.UniqueConstraint(
            "owner_user_id",
            "habit_id",
            "log_date",
            name="uq_habit_logs_owner_date",
        ),
    )
    op.create_index(op.f("ix_habit_logs_owner_user_id"), "habit_logs", ["owner_user_id"])
    op.create_index(op.f("ix_habit_logs_habit_id"), "habit_logs", ["habit_id"])
    op.create_index(
        "ix_habit_logs_owner_habit_date", "habit_logs", ["owner_user_id", "habit_id", "log_date"]
    )
    op.create_index("ix_habit_logs_owner_date", "habit_logs", ["owner_user_id", "log_date"])

    op.create_table(
        "habit_streaks",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("habit_id", sa.Uuid(), nullable=False),
        sa.Column("current_streak", sa.Integer(), nullable=False),
        sa.Column("best_streak", sa.Integer(), nullable=False),
        sa.Column("recovery_streak", sa.Integer(), nullable=False),
        sa.Column("completion_rate_30d", sa.Float(), nullable=False),
        sa.Column("last_logged_on", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "current_streak >= 0",
            name=op.f("ck_habit_streaks_current_streak_nonnegative"),
        ),
        sa.CheckConstraint(
            "best_streak >= 0",
            name=op.f("ck_habit_streaks_best_streak_nonnegative"),
        ),
        sa.CheckConstraint(
            "recovery_streak >= 0",
            name=op.f("ck_habit_streaks_recovery_streak_nonnegative"),
        ),
        sa.CheckConstraint(
            "completion_rate_30d >= 0 AND completion_rate_30d <= 1",
            name=op.f("ck_habit_streaks_completion_rate_30d_range"),
        ),
        sa.ForeignKeyConstraint(
            ["habit_id"],
            ["habits.id"],
            name=op.f("fk_habit_streaks_habit_id_habits"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_habit_streaks_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_habit_streaks")),
        sa.UniqueConstraint("habit_id", name="uq_habit_streaks_habit_id"),
    )
    op.create_index(op.f("ix_habit_streaks_owner_user_id"), "habit_streaks", ["owner_user_id"])
    op.create_index(op.f("ix_habit_streaks_habit_id"), "habit_streaks", ["habit_id"])
    op.create_index("ix_habit_streaks_owner_habit", "habit_streaks", ["owner_user_id", "habit_id"])

    op.create_table(
        "daily_check_ins",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("check_in_date", sa.Date(), nullable=False),
        sa.Column("mood", sa.Integer(), nullable=True),
        sa.Column("energy", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "mood IS NULL OR (mood >= 1 AND mood <= 5)",
            name=op.f("ck_daily_check_ins_mood_range"),
        ),
        sa.CheckConstraint(
            "energy IS NULL OR (energy >= 1 AND energy <= 5)",
            name=op.f("ck_daily_check_ins_energy_range"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_daily_check_ins_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_daily_check_ins")),
        sa.UniqueConstraint("owner_user_id", "check_in_date", name="uq_daily_check_ins_owner_date"),
    )
    op.create_index(op.f("ix_daily_check_ins_owner_user_id"), "daily_check_ins", ["owner_user_id"])
    op.create_index(
        "ix_daily_check_ins_owner_date", "daily_check_ins", ["owner_user_id", "check_in_date"]
    )

    op.create_table(
        "weekly_reviews",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("week_start", sa.Date(), nullable=False),
        sa.Column("wins", sa.Text(), nullable=True),
        sa.Column("challenges", sa.Text(), nullable=True),
        sa.Column("next_steps", sa.Text(), nullable=True),
        sa.Column("period", sa.String(length=16), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_weekly_reviews_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_weekly_reviews")),
        sa.UniqueConstraint("owner_user_id", "week_start", name="uq_weekly_reviews_owner_week"),
    )
    op.create_index(op.f("ix_weekly_reviews_owner_user_id"), "weekly_reviews", ["owner_user_id"])
    op.create_index(
        "ix_weekly_reviews_owner_week", "weekly_reviews", ["owner_user_id", "week_start"]
    )


def downgrade() -> None:
    op.drop_index("ix_weekly_reviews_owner_week", table_name="weekly_reviews")
    op.drop_index(op.f("ix_weekly_reviews_owner_user_id"), table_name="weekly_reviews")
    op.drop_table("weekly_reviews")

    op.drop_index("ix_daily_check_ins_owner_date", table_name="daily_check_ins")
    op.drop_index(op.f("ix_daily_check_ins_owner_user_id"), table_name="daily_check_ins")
    op.drop_table("daily_check_ins")

    op.drop_index("ix_habit_streaks_owner_habit", table_name="habit_streaks")
    op.drop_index(op.f("ix_habit_streaks_habit_id"), table_name="habit_streaks")
    op.drop_index(op.f("ix_habit_streaks_owner_user_id"), table_name="habit_streaks")
    op.drop_table("habit_streaks")

    op.drop_index("ix_habit_logs_owner_date", table_name="habit_logs")
    op.drop_index("ix_habit_logs_owner_habit_date", table_name="habit_logs")
    op.drop_index(op.f("ix_habit_logs_habit_id"), table_name="habit_logs")
    op.drop_index(op.f("ix_habit_logs_owner_user_id"), table_name="habit_logs")
    op.drop_table("habit_logs")

    op.drop_index("ix_habit_targets_owner_habit", table_name="habit_targets")
    op.drop_index(op.f("ix_habit_targets_habit_id"), table_name="habit_targets")
    op.drop_index(op.f("ix_habit_targets_owner_user_id"), table_name="habit_targets")
    op.drop_table("habit_targets")

    op.drop_index("ix_habit_schedules_owner_habit", table_name="habit_schedules")
    op.drop_index(op.f("ix_habit_schedules_habit_id"), table_name="habit_schedules")
    op.drop_index(op.f("ix_habit_schedules_owner_user_id"), table_name="habit_schedules")
    op.drop_table("habit_schedules")

    op.execute("DROP INDEX IF EXISTS ix_habits_search_name_fts")
    op.drop_index("ix_habits_owner_created", table_name="habits")
    op.drop_index("ix_habits_owner_status_updated", table_name="habits")
    op.drop_index(op.f("ix_habits_owner_user_id"), table_name="habits")
    op.drop_table("habits")
