"""Add notification and review workflows.

Revision ID: 0016_notification_review_workflows
Revises: 0015_knowledge_graph
Create Date: 2026-07-23 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0016_notification_review_workflows"
down_revision: str | None = "0015_knowledge_graph"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

WORKFLOW_TYPE_VALUES = (
    "'weekly_review', 'monthly_review', 'learning_review', 'habit_reminder', "
    "'processing_failure', 'ai_provider_failure', 'project_deadline'"
)
WORKFLOW_STATUS_VALUES = "'generated', 'skipped'"
REVIEW_PERIOD_VALUES = "'month'"


def upgrade() -> None:
    op.create_table(
        "notification_preferences",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("in_app_enabled", sa.Boolean(), nullable=False),
        sa.Column("weekly_review_enabled", sa.Boolean(), nullable=False),
        sa.Column("monthly_review_enabled", sa.Boolean(), nullable=False),
        sa.Column("learning_reminders_enabled", sa.Boolean(), nullable=False),
        sa.Column("habit_reminders_enabled", sa.Boolean(), nullable=False),
        sa.Column("processing_failure_enabled", sa.Boolean(), nullable=False),
        sa.Column("ai_provider_failure_enabled", sa.Boolean(), nullable=False),
        sa.Column("project_deadline_enabled", sa.Boolean(), nullable=False),
        sa.Column("reminder_hour", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "reminder_hour >= 0 AND reminder_hour <= 23",
            name=op.f("ck_notification_preferences_reminder_hour_range"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_notification_preferences_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_notification_preferences")),
        sa.UniqueConstraint("owner_user_id", name="uq_notification_preferences_owner"),
    )
    op.create_index(
        op.f("ix_notification_preferences_owner_user_id"),
        "notification_preferences",
        ["owner_user_id"],
    )

    op.create_table(
        "notification_workflow_records",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("workflow_type", sa.String(length=48), nullable=False),
        sa.Column("source_key", sa.String(length=220), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("notification_id", sa.Uuid(), nullable=True),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"workflow_type IN ({WORKFLOW_TYPE_VALUES})",
            name=op.f("ck_notification_workflow_records_workflow_type_allowed"),
        ),
        sa.CheckConstraint(
            f"status IN ({WORKFLOW_STATUS_VALUES})",
            name=op.f("ck_notification_workflow_records_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["notification_id"],
            ["notifications.id"],
            name=op.f("fk_notification_workflow_records_notification_id_notifications"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_notification_workflow_records_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_notification_workflow_records")),
        sa.UniqueConstraint(
            "owner_user_id",
            "workflow_type",
            "source_key",
            name="uq_notification_workflow_records_owner_source",
        ),
    )
    op.create_index(
        op.f("ix_notification_workflow_records_owner_user_id"),
        "notification_workflow_records",
        ["owner_user_id"],
    )
    op.create_index(
        op.f("ix_notification_workflow_records_notification_id"),
        "notification_workflow_records",
        ["notification_id"],
    )
    op.create_index(
        "ix_notification_workflow_records_owner_type",
        "notification_workflow_records",
        ["owner_user_id", "workflow_type", "created_at"],
    )
    op.create_index(
        "ix_notification_workflow_records_owner_notification",
        "notification_workflow_records",
        ["owner_user_id", "notification_id"],
    )

    op.create_table(
        "monthly_reviews",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("month_start", sa.Date(), nullable=False),
        sa.Column("wins", sa.Text(), nullable=True),
        sa.Column("challenges", sa.Text(), nullable=True),
        sa.Column("next_steps", sa.Text(), nullable=True),
        sa.Column("period", sa.String(length=16), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"period IN ({REVIEW_PERIOD_VALUES})",
            name=op.f("ck_monthly_reviews_period_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_monthly_reviews_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_monthly_reviews")),
        sa.UniqueConstraint(
            "owner_user_id",
            "month_start",
            name="uq_monthly_reviews_owner_month",
        ),
    )
    op.create_index(op.f("ix_monthly_reviews_owner_user_id"), "monthly_reviews", ["owner_user_id"])
    op.create_index(
        "ix_monthly_reviews_owner_month",
        "monthly_reviews",
        ["owner_user_id", "month_start"],
    )


def downgrade() -> None:
    op.drop_index("ix_monthly_reviews_owner_month", table_name="monthly_reviews")
    op.drop_index(op.f("ix_monthly_reviews_owner_user_id"), table_name="monthly_reviews")
    op.drop_table("monthly_reviews")

    op.drop_index(
        "ix_notification_workflow_records_owner_notification",
        table_name="notification_workflow_records",
    )
    op.drop_index(
        "ix_notification_workflow_records_owner_type",
        table_name="notification_workflow_records",
    )
    op.drop_index(
        op.f("ix_notification_workflow_records_notification_id"),
        table_name="notification_workflow_records",
    )
    op.drop_index(
        op.f("ix_notification_workflow_records_owner_user_id"),
        table_name="notification_workflow_records",
    )
    op.drop_table("notification_workflow_records")

    op.drop_index(
        op.f("ix_notification_preferences_owner_user_id"),
        table_name="notification_preferences",
    )
    op.drop_table("notification_preferences")
