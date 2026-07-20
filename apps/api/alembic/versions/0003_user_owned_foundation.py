"""Add user-owned data foundation.

Revision ID: 0003_user_owned_foundation
Revises: 0002_auth_foundation
Create Date: 2026-07-20
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0003_user_owned_foundation"
down_revision: str | None = "0002_auth_foundation"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_preferences",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("theme", sa.String(length=16), nullable=False),
        sa.Column("default_interface_mode", sa.String(length=16), nullable=False),
        sa.Column("reduced_motion", sa.Boolean(), nullable=False),
        sa.Column("background_music_enabled", sa.Boolean(), nullable=False),
        sa.Column("ambient_audio_enabled", sa.Boolean(), nullable=False),
        sa.Column("camera_effects_enabled", sa.Boolean(), nullable=False),
        sa.Column("performance_preset", sa.String(length=16), nullable=False),
        sa.Column("time_zone", sa.String(length=64), nullable=False),
        sa.Column("locale", sa.String(length=35), nullable=False),
        sa.Column("ai_memory_enabled", sa.Boolean(), nullable=False),
        sa.Column("product_analytics_enabled", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint(
            "theme IN ('system', 'light', 'dark')", name=op.f("ck_user_preferences_theme_allowed")
        ),
        sa.CheckConstraint(
            "default_interface_mode IN ('command', 'world')",
            name=op.f("ck_user_preferences_default_interface_mode_allowed"),
        ),
        sa.CheckConstraint(
            "performance_preset IN ('automatic', 'low', 'balanced', 'high')",
            name=op.f("ck_user_preferences_performance_preset_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_user_preferences_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_user_preferences")),
        sa.UniqueConstraint("owner_user_id", name=op.f("uq_user_preferences_owner_user_id")),
    )
    op.create_index(
        op.f("ix_user_preferences_owner_user_id"),
        "user_preferences",
        ["owner_user_id"],
        unique=False,
    )

    op.create_table(
        "world_profiles",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("current_location_id", sa.String(length=64), nullable=False),
        sa.Column("last_visited_location_id", sa.String(length=64), nullable=True),
        sa.Column("preferred_navigation_method", sa.String(length=32), nullable=False),
        sa.Column("tutorial_completed", sa.Boolean(), nullable=False),
        sa.Column("world_state_version", sa.Integer(), nullable=False),
        sa.Column("spawn_location_id", sa.String(length=64), nullable=False),
        sa.Column("visited_location_ids", sa.JSON(), nullable=False),
        sa.Column("unlocked_location_ids", sa.JSON(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint(
            "preferred_navigation_method IN ('command_palette', 'fast_travel', 'guided', 'direct')",
            name=op.f("ck_world_profiles_preferred_navigation_method_allowed"),
        ),
        sa.CheckConstraint(
            "world_state_version > 0", name=op.f("ck_world_profiles_world_state_version_positive")
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_world_profiles_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_world_profiles")),
        sa.UniqueConstraint("owner_user_id", name=op.f("uq_world_profiles_owner_user_id")),
    )
    op.create_index(
        op.f("ix_world_profiles_owner_user_id"),
        "world_profiles",
        ["owner_user_id"],
        unique=False,
    )

    op.create_table(
        "domain_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("idempotency_key", sa.String(length=160), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint(
            "event_type IN ('user.registered', 'user.preference_updated', 'file.uploaded', "
            "'file.ingested', 'habit.logged', 'lesson.completed', 'quiz.completed', "
            "'project.completed', 'achievement.unlocked', 'world.location_visited')",
            name=op.f("ck_domain_events_event_type_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_domain_events_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_domain_events")),
        sa.UniqueConstraint(
            "owner_user_id",
            "idempotency_key",
            name="uq_domain_events_owner_idempotency_key",
        ),
    )
    op.create_index(op.f("ix_domain_events_owner_user_id"), "domain_events", ["owner_user_id"])
    op.create_index(
        "ix_domain_events_owner_type_occurred",
        "domain_events",
        ["owner_user_id", "event_type", "occurred_at"],
    )

    op.create_table(
        "notifications",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("source_event_id", sa.Uuid(), nullable=True),
        sa.Column("notification_type", sa.String(length=32), nullable=False),
        sa.Column("severity", sa.String(length=16), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("action_url", sa.String(length=512), nullable=True),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint(
            "notification_type IN ('system', 'security', 'processing', 'review', 'ai', 'project')",
            name=op.f("ck_notifications_notification_type_allowed"),
        ),
        sa.CheckConstraint(
            "severity IN ('info', 'success', 'warning', 'error')",
            name=op.f("ck_notifications_severity_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_notifications_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["source_event_id"],
            ["domain_events.id"],
            name=op.f("fk_notifications_source_event_id_domain_events"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_notifications")),
    )
    op.create_index(op.f("ix_notifications_owner_user_id"), "notifications", ["owner_user_id"])
    op.create_index(op.f("ix_notifications_source_event_id"), "notifications", ["source_event_id"])
    op.create_index(
        "ix_notifications_owner_read_created",
        "notifications",
        ["owner_user_id", "read_at", "created_at"],
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("action", sa.String(length=96), nullable=False),
        sa.Column("entity_type", sa.String(length=64), nullable=True),
        sa.Column("entity_id", sa.Uuid(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_audit_logs_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_audit_logs")),
    )
    op.create_index(op.f("ix_audit_logs_owner_user_id"), "audit_logs", ["owner_user_id"])
    op.create_index("ix_audit_logs_owner_created", "audit_logs", ["owner_user_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_audit_logs_owner_created", table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_owner_user_id"), table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_index("ix_notifications_owner_read_created", table_name="notifications")
    op.drop_index(op.f("ix_notifications_source_event_id"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_owner_user_id"), table_name="notifications")
    op.drop_table("notifications")
    op.drop_index("ix_domain_events_owner_type_occurred", table_name="domain_events")
    op.drop_index(op.f("ix_domain_events_owner_user_id"), table_name="domain_events")
    op.drop_table("domain_events")
    op.drop_index(op.f("ix_world_profiles_owner_user_id"), table_name="world_profiles")
    op.drop_table("world_profiles")
    op.drop_index(op.f("ix_user_preferences_owner_user_id"), table_name="user_preferences")
    op.drop_table("user_preferences")
