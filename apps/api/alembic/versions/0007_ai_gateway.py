"""Add provider-neutral AI gateway foundation.

Revision ID: 0007_ai_gateway
Revises: 0006_hybrid_search
Create Date: 2026-07-20 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0007_ai_gateway"
down_revision: str | None = "0006_hybrid_search"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

FEATURE_VALUES = (
    "'general_chat', 'embeddings', 'document_qa', 'mentor_chat', "
    "'learning_assistant', 'coding_assistant'"
)
PROVIDER_KIND_VALUES = (
    "'aetherium_deterministic', 'openai_compatible', 'anthropic_compatible', 'ollama_compatible'"
)
OPERATION_VALUES = "'chat_completion', 'streaming_chat_completion', 'embedding'"
USAGE_STATUS_VALUES = "'success', 'failed', 'blocked', 'rate_limited'"


def upgrade() -> None:
    op.create_table(
        "ai_consent_policies",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("feature", sa.String(length=64), nullable=False),
        sa.Column("external_providers_allowed", sa.Boolean(), nullable=False),
        sa.Column("allow_file_content", sa.Boolean(), nullable=False),
        sa.Column("allow_collections", sa.Boolean(), nullable=False),
        sa.Column("allow_conversations", sa.Boolean(), nullable=False),
        sa.Column("allow_projects", sa.Boolean(), nullable=False),
        sa.Column("allow_learning_records", sa.Boolean(), nullable=False),
        sa.Column("allow_habit_data", sa.Boolean(), nullable=False),
        sa.Column("allow_profile_data", sa.Boolean(), nullable=False),
        sa.Column("allowed_collection_ids", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"feature IN ({FEATURE_VALUES})",
            name=op.f("ck_ai_consent_policies_feature_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_ai_consent_policies_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ai_consent_policies")),
        sa.UniqueConstraint(
            "owner_user_id",
            "feature",
            name="uq_ai_consent_policies_owner_feature",
        ),
    )
    op.create_index(
        op.f("ix_ai_consent_policies_owner_user_id"),
        "ai_consent_policies",
        ["owner_user_id"],
    )
    op.create_index(
        "ix_ai_consent_policies_owner_feature",
        "ai_consent_policies",
        ["owner_user_id", "feature"],
    )

    op.create_table(
        "ai_model_configurations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("feature", sa.String(length=64), nullable=False),
        sa.Column("provider_name", sa.String(length=80), nullable=False),
        sa.Column("provider_kind", sa.String(length=40), nullable=False),
        sa.Column("model_name", sa.String(length=120), nullable=False),
        sa.Column("fallback_provider_name", sa.String(length=80), nullable=True),
        sa.Column("fallback_model_name", sa.String(length=120), nullable=True),
        sa.Column("temperature", sa.Float(), nullable=False),
        sa.Column("max_output_tokens", sa.Integer(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"feature IN ({FEATURE_VALUES})",
            name=op.f("ck_ai_model_configurations_feature_allowed"),
        ),
        sa.CheckConstraint(
            "max_output_tokens > 0",
            name=op.f("ck_ai_model_configurations_max_output_tokens_positive"),
        ),
        sa.CheckConstraint(
            f"provider_kind IN ({PROVIDER_KIND_VALUES})",
            name=op.f("ck_ai_model_configurations_provider_kind_allowed"),
        ),
        sa.CheckConstraint(
            "temperature >= 0 AND temperature <= 2",
            name=op.f("ck_ai_model_configurations_temperature_range"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_ai_model_configurations_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ai_model_configurations")),
        sa.UniqueConstraint(
            "owner_user_id",
            "feature",
            name="uq_ai_model_configurations_owner_feature",
        ),
    )
    op.create_index(
        op.f("ix_ai_model_configurations_owner_user_id"),
        "ai_model_configurations",
        ["owner_user_id"],
    )
    op.create_index(
        "ix_ai_model_configurations_owner_feature",
        "ai_model_configurations",
        ["owner_user_id", "feature"],
    )

    op.create_table(
        "ai_usage_records",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("request_id", sa.String(length=120), nullable=False),
        sa.Column("feature", sa.String(length=64), nullable=False),
        sa.Column("provider_name", sa.String(length=80), nullable=False),
        sa.Column("provider_kind", sa.String(length=40), nullable=False),
        sa.Column("model_name", sa.String(length=120), nullable=False),
        sa.Column("operation", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("input_tokens", sa.Integer(), nullable=False),
        sa.Column("output_tokens", sa.Integer(), nullable=False),
        sa.Column("total_tokens", sa.Integer(), nullable=False),
        sa.Column("estimated_cost_micro_usd", sa.Integer(), nullable=False),
        sa.Column("latency_ms", sa.Integer(), nullable=False),
        sa.Column("used_fallback", sa.Boolean(), nullable=False),
        sa.Column("error_code", sa.String(length=80), nullable=True),
        sa.Column("error_message", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "estimated_cost_micro_usd >= 0",
            name=op.f("ck_ai_usage_records_estimated_cost_nonnegative"),
        ),
        sa.CheckConstraint(
            f"feature IN ({FEATURE_VALUES})",
            name=op.f("ck_ai_usage_records_feature_allowed"),
        ),
        sa.CheckConstraint(
            "input_tokens >= 0",
            name=op.f("ck_ai_usage_records_input_tokens_nonnegative"),
        ),
        sa.CheckConstraint(
            "latency_ms >= 0",
            name=op.f("ck_ai_usage_records_latency_nonnegative"),
        ),
        sa.CheckConstraint(
            f"operation IN ({OPERATION_VALUES})",
            name=op.f("ck_ai_usage_records_operation_allowed"),
        ),
        sa.CheckConstraint(
            "output_tokens >= 0",
            name=op.f("ck_ai_usage_records_output_tokens_nonnegative"),
        ),
        sa.CheckConstraint(
            f"provider_kind IN ({PROVIDER_KIND_VALUES})",
            name=op.f("ck_ai_usage_records_provider_kind_allowed"),
        ),
        sa.CheckConstraint(
            f"status IN ({USAGE_STATUS_VALUES})",
            name=op.f("ck_ai_usage_records_status_allowed"),
        ),
        sa.CheckConstraint(
            "total_tokens >= 0",
            name=op.f("ck_ai_usage_records_total_tokens_nonnegative"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_ai_usage_records_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ai_usage_records")),
        sa.UniqueConstraint(
            "owner_user_id",
            "request_id",
            name="uq_ai_usage_records_owner_request",
        ),
    )
    op.create_index(
        op.f("ix_ai_usage_records_owner_user_id"), "ai_usage_records", ["owner_user_id"]
    )
    op.create_index(
        "ix_ai_usage_records_owner_created",
        "ai_usage_records",
        ["owner_user_id", "created_at"],
    )
    op.create_index(
        "ix_ai_usage_records_owner_feature_created",
        "ai_usage_records",
        ["owner_user_id", "feature", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_ai_usage_records_owner_feature_created", table_name="ai_usage_records")
    op.drop_index("ix_ai_usage_records_owner_created", table_name="ai_usage_records")
    op.drop_index(op.f("ix_ai_usage_records_owner_user_id"), table_name="ai_usage_records")
    op.drop_table("ai_usage_records")

    op.drop_index(
        "ix_ai_model_configurations_owner_feature",
        table_name="ai_model_configurations",
    )
    op.drop_index(
        op.f("ix_ai_model_configurations_owner_user_id"),
        table_name="ai_model_configurations",
    )
    op.drop_table("ai_model_configurations")

    op.drop_index("ix_ai_consent_policies_owner_feature", table_name="ai_consent_policies")
    op.drop_index(
        op.f("ix_ai_consent_policies_owner_user_id"),
        table_name="ai_consent_policies",
    )
    op.drop_table("ai_consent_policies")
