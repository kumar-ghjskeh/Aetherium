"""Add AI mentors and conversations.

Revision ID: 0008_ai_mentors
Revises: 0007_ai_gateway
Create Date: 2026-07-21 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0008_ai_mentors"
down_revision: str | None = "0007_ai_gateway"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

MENTOR_TONE_VALUES = "'calm', 'direct', 'analytical', 'encouraging'"
CONVERSATION_STATUS_VALUES = "'active', 'archived', 'deleted'"
MEMORY_POLICY_VALUES = "'disabled', 'session_only', 'persistent'"
MESSAGE_ROLE_VALUES = "'system', 'user', 'assistant', 'tool'"
MESSAGE_STATUS_VALUES = "'complete', 'failed'"
MESSAGE_SOURCE_TYPE_VALUES = "'file_chunk', 'general_model_knowledge', 'user_message', 'inference'"


def upgrade() -> None:
    op.create_table(
        "mentors",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(length=80), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("fictional_identity", sa.String(length=160), nullable=False),
        sa.Column("avatar_reference", sa.String(length=160), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("system_instructions", sa.Text(), nullable=False),
        sa.Column("tone", sa.String(length=32), nullable=False),
        sa.Column("preferred_model_name", sa.String(length=120), nullable=True),
        sa.Column("is_default", sa.Boolean(), nullable=False),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"tone IN ({MENTOR_TONE_VALUES})",
            name=op.f("ck_mentors_tone_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_mentors_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_mentors")),
        sa.UniqueConstraint("owner_user_id", "slug", name="uq_mentors_owner_slug"),
    )
    op.create_index(op.f("ix_mentors_owner_user_id"), "mentors", ["owner_user_id"])
    op.create_index("ix_mentors_owner_archived", "mentors", ["owner_user_id", "archived_at"])

    op.create_table(
        "mentor_permissions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("mentor_id", sa.Uuid(), nullable=False),
        sa.Column("allowed_tools", sa.JSON(), nullable=False),
        sa.Column("allowed_collection_ids", sa.JSON(), nullable=False),
        sa.Column("allow_file_content", sa.Boolean(), nullable=False),
        sa.Column("allow_conversations", sa.Boolean(), nullable=False),
        sa.Column("allow_projects", sa.Boolean(), nullable=False),
        sa.Column("allow_learning_records", sa.Boolean(), nullable=False),
        sa.Column("allow_habit_data", sa.Boolean(), nullable=False),
        sa.Column("allow_profile_data", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["mentor_id"],
            ["mentors.id"],
            name=op.f("fk_mentor_permissions_mentor_id_mentors"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_mentor_permissions_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_mentor_permissions")),
        sa.UniqueConstraint("mentor_id", name="uq_mentor_permissions_mentor_id"),
    )
    op.create_index(
        op.f("ix_mentor_permissions_owner_user_id"),
        "mentor_permissions",
        ["owner_user_id"],
    )
    op.create_index(op.f("ix_mentor_permissions_mentor_id"), "mentor_permissions", ["mentor_id"])
    op.create_index(
        "ix_mentor_permissions_owner_mentor",
        "mentor_permissions",
        ["owner_user_id", "mentor_id"],
    )

    op.create_table(
        "conversations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("mentor_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_message_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"status IN ({CONVERSATION_STATUS_VALUES})",
            name=op.f("ck_conversations_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["mentor_id"],
            ["mentors.id"],
            name=op.f("fk_conversations_mentor_id_mentors"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_conversations_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_conversations")),
    )
    op.create_index(op.f("ix_conversations_owner_user_id"), "conversations", ["owner_user_id"])
    op.create_index(op.f("ix_conversations_mentor_id"), "conversations", ["mentor_id"])
    op.create_index(
        "ix_conversations_owner_status_updated",
        "conversations",
        ["owner_user_id", "status", "updated_at"],
    )
    op.create_index(
        "ix_conversations_owner_mentor",
        "conversations",
        ["owner_user_id", "mentor_id"],
    )
    op.execute(
        "CREATE INDEX ix_conversations_search_title_fts ON conversations USING GIN "
        "(to_tsvector('english', coalesce(title, '')))"
    )

    op.create_table(
        "conversation_memory_settings",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("conversation_id", sa.Uuid(), nullable=False),
        sa.Column("memory_enabled", sa.Boolean(), nullable=False),
        sa.Column("memory_policy", sa.String(length=32), nullable=False),
        sa.Column("memory_summary", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"memory_policy IN ({MEMORY_POLICY_VALUES})",
            name=op.f("ck_conversation_memory_settings_memory_policy_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["conversations.id"],
            name=op.f("fk_conversation_memory_settings_conversation_id_conversations"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_conversation_memory_settings_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_conversation_memory_settings")),
        sa.UniqueConstraint(
            "conversation_id",
            name="uq_conversation_memory_settings_conversation_id",
        ),
    )
    op.create_index(
        op.f("ix_conversation_memory_settings_owner_user_id"),
        "conversation_memory_settings",
        ["owner_user_id"],
    )
    op.create_index(
        op.f("ix_conversation_memory_settings_conversation_id"),
        "conversation_memory_settings",
        ["conversation_id"],
    )
    op.create_index(
        "ix_conversation_memory_settings_owner_conversation",
        "conversation_memory_settings",
        ["owner_user_id", "conversation_id"],
    )

    op.create_table(
        "messages",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("conversation_id", sa.Uuid(), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("ai_usage_record_id", sa.Uuid(), nullable=True),
        sa.Column("provider_name", sa.String(length=80), nullable=True),
        sa.Column("model_name", sa.String(length=120), nullable=True),
        sa.Column("error_code", sa.String(length=80), nullable=True),
        sa.Column("error_message", sa.String(length=512), nullable=True),
        sa.Column("edited_from_message_id", sa.Uuid(), nullable=True),
        sa.Column("regenerated_from_message_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"role IN ({MESSAGE_ROLE_VALUES})",
            name=op.f("ck_messages_role_allowed"),
        ),
        sa.CheckConstraint(
            f"status IN ({MESSAGE_STATUS_VALUES})",
            name=op.f("ck_messages_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["ai_usage_record_id"],
            ["ai_usage_records.id"],
            name=op.f("fk_messages_ai_usage_record_id_ai_usage_records"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["conversations.id"],
            name=op.f("fk_messages_conversation_id_conversations"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["edited_from_message_id"],
            ["messages.id"],
            name=op.f("fk_messages_edited_from_message_id_messages"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_messages_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["regenerated_from_message_id"],
            ["messages.id"],
            name=op.f("fk_messages_regenerated_from_message_id_messages"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_messages")),
    )
    op.create_index(op.f("ix_messages_owner_user_id"), "messages", ["owner_user_id"])
    op.create_index(op.f("ix_messages_conversation_id"), "messages", ["conversation_id"])
    op.create_index(
        op.f("ix_messages_ai_usage_record_id"),
        "messages",
        ["ai_usage_record_id"],
    )
    op.create_index(
        "ix_messages_owner_conversation_created",
        "messages",
        ["owner_user_id", "conversation_id", "created_at"],
    )

    op.create_table(
        "message_sources",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("message_id", sa.Uuid(), nullable=False),
        sa.Column("source_type", sa.String(length=40), nullable=False),
        sa.Column("source_id", sa.String(length=120), nullable=True),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("url", sa.String(length=512), nullable=True),
        sa.Column("page_number", sa.Integer(), nullable=True),
        sa.Column("section_label", sa.String(length=160), nullable=True),
        sa.Column("snippet", sa.String(length=512), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"source_type IN ({MESSAGE_SOURCE_TYPE_VALUES})",
            name=op.f("ck_message_sources_source_type_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["message_id"],
            ["messages.id"],
            name=op.f("fk_message_sources_message_id_messages"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_message_sources_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_message_sources")),
    )
    op.create_index(op.f("ix_message_sources_owner_user_id"), "message_sources", ["owner_user_id"])
    op.create_index(op.f("ix_message_sources_message_id"), "message_sources", ["message_id"])
    op.create_index(
        "ix_message_sources_owner_message",
        "message_sources",
        ["owner_user_id", "message_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_message_sources_owner_message", table_name="message_sources")
    op.drop_index(op.f("ix_message_sources_message_id"), table_name="message_sources")
    op.drop_index(op.f("ix_message_sources_owner_user_id"), table_name="message_sources")
    op.drop_table("message_sources")

    op.drop_index("ix_messages_owner_conversation_created", table_name="messages")
    op.drop_index(op.f("ix_messages_ai_usage_record_id"), table_name="messages")
    op.drop_index(op.f("ix_messages_conversation_id"), table_name="messages")
    op.drop_index(op.f("ix_messages_owner_user_id"), table_name="messages")
    op.drop_table("messages")

    op.drop_index(
        "ix_conversation_memory_settings_owner_conversation",
        table_name="conversation_memory_settings",
    )
    op.drop_index(
        op.f("ix_conversation_memory_settings_conversation_id"),
        table_name="conversation_memory_settings",
    )
    op.drop_index(
        op.f("ix_conversation_memory_settings_owner_user_id"),
        table_name="conversation_memory_settings",
    )
    op.drop_table("conversation_memory_settings")

    op.execute("DROP INDEX IF EXISTS ix_conversations_search_title_fts")
    op.drop_index("ix_conversations_owner_mentor", table_name="conversations")
    op.drop_index("ix_conversations_owner_status_updated", table_name="conversations")
    op.drop_index(op.f("ix_conversations_mentor_id"), table_name="conversations")
    op.drop_index(op.f("ix_conversations_owner_user_id"), table_name="conversations")
    op.drop_table("conversations")

    op.drop_index("ix_mentor_permissions_owner_mentor", table_name="mentor_permissions")
    op.drop_index(op.f("ix_mentor_permissions_mentor_id"), table_name="mentor_permissions")
    op.drop_index(op.f("ix_mentor_permissions_owner_user_id"), table_name="mentor_permissions")
    op.drop_table("mentor_permissions")

    op.drop_index("ix_mentors_owner_archived", table_name="mentors")
    op.drop_index(op.f("ix_mentors_owner_user_id"), table_name="mentors")
    op.drop_table("mentors")
