"""Add achievements and progression foundation.

Revision ID: 0012_achievement_engine
Revises: 0011_project_dock
Create Date: 2026-07-21 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0012_achievement_engine"
down_revision: str | None = "0011_project_dock"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

ACHIEVEMENT_CATEGORY_VALUES = "'files', 'habits', 'learning', 'projects', 'coding'"
ACHIEVEMENT_RARITY_VALUES = "'common', 'focused', 'milestone'"
DOMAIN_EVENT_TYPE_VALUES = (
    "'user.registered', 'user.preference_updated', 'file.uploaded', 'file.ingested', "
    "'habit.logged', 'lesson.completed', 'quiz.completed', 'project.completed', "
    "'achievement.unlocked', 'world.location_visited'"
)
REWARD_TYPE_VALUES = "'badge', 'world_unlock'"
WORLD_UNLOCK_SOURCE_VALUES = "'achievement'"


def upgrade() -> None:
    op.create_table(
        "achievement_definitions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("rarity", sa.String(length=32), nullable=False),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"category IN ({ACHIEVEMENT_CATEGORY_VALUES})",
            name=op.f("ck_achievement_definitions_category_allowed"),
        ),
        sa.CheckConstraint(
            f"rarity IN ({ACHIEVEMENT_RARITY_VALUES})",
            name=op.f("ck_achievement_definitions_rarity_allowed"),
        ),
        sa.CheckConstraint(
            "points >= 0", name=op.f("ck_achievement_definitions_points_nonnegative")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_achievement_definitions")),
        sa.UniqueConstraint("slug", name=op.f("uq_achievement_definitions_slug")),
    )
    op.create_index(op.f("ix_achievement_definitions_slug"), "achievement_definitions", ["slug"])
    op.create_index(
        "ix_achievement_definitions_active_category",
        "achievement_definitions",
        ["is_active", "category"],
    )

    op.create_table(
        "achievement_rules",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("achievement_definition_id", sa.Uuid(), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("counter_key", sa.String(length=120), nullable=False),
        sa.Column("threshold_count", sa.Integer(), nullable=False),
        sa.Column("payload_filters", sa.JSON(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"event_type IN ({DOMAIN_EVENT_TYPE_VALUES})",
            name=op.f("ck_achievement_rules_event_type_allowed"),
        ),
        sa.CheckConstraint(
            "threshold_count > 0", name=op.f("ck_achievement_rules_threshold_count_positive")
        ),
        sa.ForeignKeyConstraint(
            ["achievement_definition_id"],
            ["achievement_definitions.id"],
            name=op.f("fk_achievement_rules_achievement_definition_id_achievement_definitions"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_achievement_rules")),
        sa.UniqueConstraint(
            "achievement_definition_id",
            "event_type",
            "counter_key",
            name="uq_achievement_rules_definition_event_counter",
        ),
    )
    op.create_index(
        op.f("ix_achievement_rules_achievement_definition_id"),
        "achievement_rules",
        ["achievement_definition_id"],
    )
    op.create_index(
        "ix_achievement_rules_event_active", "achievement_rules", ["event_type", "is_active"]
    )

    op.create_table(
        "reward_definitions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("achievement_definition_id", sa.Uuid(), nullable=False),
        sa.Column("reward_type", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"reward_type IN ({REWARD_TYPE_VALUES})",
            name=op.f("ck_reward_definitions_reward_type_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["achievement_definition_id"],
            ["achievement_definitions.id"],
            name=op.f("fk_reward_definitions_achievement_definition_id_achievement_definitions"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_reward_definitions")),
        sa.UniqueConstraint(
            "achievement_definition_id",
            "reward_type",
            name="uq_reward_definitions_definition_type",
        ),
    )
    op.create_index(
        op.f("ix_reward_definitions_achievement_definition_id"),
        "reward_definitions",
        ["achievement_definition_id"],
    )

    op.create_table(
        "user_achievements",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("achievement_definition_id", sa.Uuid(), nullable=False),
        sa.Column("source_event_id", sa.Uuid(), nullable=True),
        sa.Column("progress_count", sa.Integer(), nullable=False),
        sa.Column("target_count", sa.Integer(), nullable=False),
        sa.Column("unlocked_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["achievement_definition_id"],
            ["achievement_definitions.id"],
            name=op.f("fk_user_achievements_achievement_definition_id_achievement_definitions"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_user_achievements_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["source_event_id"],
            ["domain_events.id"],
            name=op.f("fk_user_achievements_source_event_id_domain_events"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_user_achievements")),
        sa.UniqueConstraint(
            "owner_user_id",
            "achievement_definition_id",
            name="uq_user_achievements_owner_definition",
        ),
    )
    op.create_index(
        op.f("ix_user_achievements_owner_user_id"), "user_achievements", ["owner_user_id"]
    )
    op.create_index(
        op.f("ix_user_achievements_achievement_definition_id"),
        "user_achievements",
        ["achievement_definition_id"],
    )
    op.create_index(
        op.f("ix_user_achievements_source_event_id"), "user_achievements", ["source_event_id"]
    )
    op.create_index(
        "ix_user_achievements_owner_unlocked", "user_achievements", ["owner_user_id", "unlocked_at"]
    )

    op.create_table(
        "achievement_progress_counters",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("achievement_rule_id", sa.Uuid(), nullable=False),
        sa.Column("counter_key", sa.String(length=120), nullable=False),
        sa.Column("count", sa.Integer(), nullable=False),
        sa.Column("last_event_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["achievement_rule_id"],
            ["achievement_rules.id"],
            name=op.f("fk_achievement_progress_counters_achievement_rule_id_achievement_rules"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["last_event_id"],
            ["domain_events.id"],
            name=op.f("fk_achievement_progress_counters_last_event_id_domain_events"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_achievement_progress_counters_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_achievement_progress_counters")),
        sa.UniqueConstraint(
            "owner_user_id",
            "achievement_rule_id",
            name="uq_achievement_progress_owner_rule",
        ),
    )
    op.create_index(
        op.f("ix_achievement_progress_counters_owner_user_id"),
        "achievement_progress_counters",
        ["owner_user_id"],
    )
    op.create_index(
        op.f("ix_achievement_progress_counters_achievement_rule_id"),
        "achievement_progress_counters",
        ["achievement_rule_id"],
    )
    op.create_index(
        "ix_achievement_progress_owner_updated",
        "achievement_progress_counters",
        ["owner_user_id", "updated_at"],
    )

    op.create_table(
        "achievement_processed_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("domain_event_id", sa.Uuid(), nullable=False),
        sa.Column("achievement_rule_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["achievement_rule_id"],
            ["achievement_rules.id"],
            name=op.f("fk_achievement_processed_events_achievement_rule_id_achievement_rules"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["domain_event_id"],
            ["domain_events.id"],
            name=op.f("fk_achievement_processed_events_domain_event_id_domain_events"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_achievement_processed_events_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_achievement_processed_events")),
        sa.UniqueConstraint(
            "owner_user_id",
            "domain_event_id",
            "achievement_rule_id",
            name="uq_achievement_processed_events_owner_event_rule",
        ),
    )
    op.create_index(
        op.f("ix_achievement_processed_events_owner_user_id"),
        "achievement_processed_events",
        ["owner_user_id"],
    )
    op.create_index(
        op.f("ix_achievement_processed_events_domain_event_id"),
        "achievement_processed_events",
        ["domain_event_id"],
    )
    op.create_index(
        op.f("ix_achievement_processed_events_achievement_rule_id"),
        "achievement_processed_events",
        ["achievement_rule_id"],
    )
    op.create_index(
        "ix_achievement_processed_events_owner_created",
        "achievement_processed_events",
        ["owner_user_id", "created_at"],
    )

    op.create_table(
        "world_unlock_records",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("achievement_definition_id", sa.Uuid(), nullable=False),
        sa.Column("reward_definition_id", sa.Uuid(), nullable=False),
        sa.Column("location_id", sa.String(length=120), nullable=False),
        sa.Column("unlock_source", sa.String(length=32), nullable=False),
        sa.Column("unlocked_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"unlock_source IN ({WORLD_UNLOCK_SOURCE_VALUES})",
            name=op.f("ck_world_unlock_records_unlock_source_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["achievement_definition_id"],
            ["achievement_definitions.id"],
            name=op.f("fk_world_unlock_records_achievement_definition_id_achievement_definitions"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_world_unlock_records_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["reward_definition_id"],
            ["reward_definitions.id"],
            name=op.f("fk_world_unlock_records_reward_definition_id_reward_definitions"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_world_unlock_records")),
        sa.UniqueConstraint(
            "owner_user_id",
            "location_id",
            name="uq_world_unlock_records_owner_location",
        ),
    )
    op.create_index(
        op.f("ix_world_unlock_records_owner_user_id"), "world_unlock_records", ["owner_user_id"]
    )
    op.create_index(
        op.f("ix_world_unlock_records_achievement_definition_id"),
        "world_unlock_records",
        ["achievement_definition_id"],
    )
    op.create_index(
        op.f("ix_world_unlock_records_reward_definition_id"),
        "world_unlock_records",
        ["reward_definition_id"],
    )
    op.create_index(
        "ix_world_unlock_records_owner_unlocked",
        "world_unlock_records",
        ["owner_user_id", "unlocked_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_world_unlock_records_owner_unlocked", table_name="world_unlock_records")
    op.drop_index(
        op.f("ix_world_unlock_records_reward_definition_id"), table_name="world_unlock_records"
    )
    op.drop_index(
        op.f("ix_world_unlock_records_achievement_definition_id"), table_name="world_unlock_records"
    )
    op.drop_index(op.f("ix_world_unlock_records_owner_user_id"), table_name="world_unlock_records")
    op.drop_table("world_unlock_records")

    op.drop_index(
        "ix_achievement_processed_events_owner_created", table_name="achievement_processed_events"
    )
    op.drop_index(
        op.f("ix_achievement_processed_events_achievement_rule_id"),
        table_name="achievement_processed_events",
    )
    op.drop_index(
        op.f("ix_achievement_processed_events_domain_event_id"),
        table_name="achievement_processed_events",
    )
    op.drop_index(
        op.f("ix_achievement_processed_events_owner_user_id"),
        table_name="achievement_processed_events",
    )
    op.drop_table("achievement_processed_events")

    op.drop_index(
        "ix_achievement_progress_owner_updated", table_name="achievement_progress_counters"
    )
    op.drop_index(
        op.f("ix_achievement_progress_counters_achievement_rule_id"),
        table_name="achievement_progress_counters",
    )
    op.drop_index(
        op.f("ix_achievement_progress_counters_owner_user_id"),
        table_name="achievement_progress_counters",
    )
    op.drop_table("achievement_progress_counters")

    op.drop_index("ix_user_achievements_owner_unlocked", table_name="user_achievements")
    op.drop_index(op.f("ix_user_achievements_source_event_id"), table_name="user_achievements")
    op.drop_index(
        op.f("ix_user_achievements_achievement_definition_id"), table_name="user_achievements"
    )
    op.drop_index(op.f("ix_user_achievements_owner_user_id"), table_name="user_achievements")
    op.drop_table("user_achievements")

    op.drop_index(
        op.f("ix_reward_definitions_achievement_definition_id"), table_name="reward_definitions"
    )
    op.drop_table("reward_definitions")

    op.drop_index("ix_achievement_rules_event_active", table_name="achievement_rules")
    op.drop_index(
        op.f("ix_achievement_rules_achievement_definition_id"), table_name="achievement_rules"
    )
    op.drop_table("achievement_rules")

    op.drop_index(
        "ix_achievement_definitions_active_category", table_name="achievement_definitions"
    )
    op.drop_index(op.f("ix_achievement_definitions_slug"), table_name="achievement_definitions")
    op.drop_table("achievement_definitions")
