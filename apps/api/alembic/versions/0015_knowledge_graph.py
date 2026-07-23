"""Add knowledge graph data foundation.

Revision ID: 0015_knowledge_graph
Revises: 0014_coding_workspace
Create Date: 2026-07-22 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0015_knowledge_graph"
down_revision: str | None = "0014_coding_workspace"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

KNOWLEDGE_NODE_TYPE_VALUES = (
    "'topic', 'file', 'lesson', 'project', 'skill', 'question', 'achievement'"
)
KNOWLEDGE_NODE_STATUS_VALUES = "'active', 'archived'"
KNOWLEDGE_RELATION_TYPE_VALUES = (
    "'requires', 'explains', 'references', 'practices', 'used_in', "
    "'related_to', 'mastered_through', 'derived_from'"
)
KNOWLEDGE_RELATION_SOURCE_VALUES = "'user', 'system', 'sync', 'learning', 'project', 'achievement'"


def upgrade() -> None:
    op.create_table(
        "knowledge_nodes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("node_type", sa.String(length=32), nullable=False),
        sa.Column("source_id", sa.Uuid(), nullable=True),
        sa.Column("source_key", sa.String(length=160), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("open_url", sa.String(length=600), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"node_type IN ({KNOWLEDGE_NODE_TYPE_VALUES})",
            name=op.f("ck_knowledge_nodes_node_type_allowed"),
        ),
        sa.CheckConstraint(
            f"status IN ({KNOWLEDGE_NODE_STATUS_VALUES})",
            name=op.f("ck_knowledge_nodes_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_knowledge_nodes_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_knowledge_nodes")),
        sa.UniqueConstraint(
            "owner_user_id",
            "node_type",
            "source_key",
            name="uq_knowledge_nodes_owner_type_source_key",
        ),
    )
    op.create_index(op.f("ix_knowledge_nodes_owner_user_id"), "knowledge_nodes", ["owner_user_id"])
    op.create_index(op.f("ix_knowledge_nodes_source_id"), "knowledge_nodes", ["source_id"])
    op.create_index(
        "ix_knowledge_nodes_owner_type_status",
        "knowledge_nodes",
        ["owner_user_id", "node_type", "status"],
    )
    op.create_index(
        "ix_knowledge_nodes_owner_source",
        "knowledge_nodes",
        ["owner_user_id", "source_id"],
    )
    op.create_index(
        "ix_knowledge_nodes_owner_updated",
        "knowledge_nodes",
        ["owner_user_id", "updated_at"],
    )

    op.create_table(
        "knowledge_relationships",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("source_node_id", sa.Uuid(), nullable=False),
        sa.Column("target_node_id", sa.Uuid(), nullable=False),
        sa.Column("relation_type", sa.String(length=48), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("weight", sa.Float(), nullable=False),
        sa.Column("evidence", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"relation_type IN ({KNOWLEDGE_RELATION_TYPE_VALUES})",
            name=op.f("ck_knowledge_relationships_relation_type_allowed"),
        ),
        sa.CheckConstraint(
            f"source IN ({KNOWLEDGE_RELATION_SOURCE_VALUES})",
            name=op.f("ck_knowledge_relationships_source_allowed"),
        ),
        sa.CheckConstraint(
            "weight >= 0 AND weight <= 1",
            name=op.f("ck_knowledge_relationships_weight_range"),
        ),
        sa.CheckConstraint(
            "source_node_id <> target_node_id",
            name=op.f("ck_knowledge_relationships_different_nodes"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_knowledge_relationships_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["source_node_id"],
            ["knowledge_nodes.id"],
            name=op.f("fk_knowledge_relationships_source_node_id_knowledge_nodes"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["target_node_id"],
            ["knowledge_nodes.id"],
            name=op.f("fk_knowledge_relationships_target_node_id_knowledge_nodes"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_knowledge_relationships")),
        sa.UniqueConstraint(
            "owner_user_id",
            "source_node_id",
            "target_node_id",
            "relation_type",
            name="uq_knowledge_relationships_owner_source_target_type",
        ),
    )
    op.create_index(
        op.f("ix_knowledge_relationships_owner_user_id"),
        "knowledge_relationships",
        ["owner_user_id"],
    )
    op.create_index(
        op.f("ix_knowledge_relationships_source_node_id"),
        "knowledge_relationships",
        ["source_node_id"],
    )
    op.create_index(
        op.f("ix_knowledge_relationships_target_node_id"),
        "knowledge_relationships",
        ["target_node_id"],
    )
    op.create_index(
        "ix_knowledge_relationships_owner_source",
        "knowledge_relationships",
        ["owner_user_id", "source_node_id", "relation_type"],
    )
    op.create_index(
        "ix_knowledge_relationships_owner_target",
        "knowledge_relationships",
        ["owner_user_id", "target_node_id", "relation_type"],
    )
    op.create_index(
        "ix_knowledge_relationships_owner_updated",
        "knowledge_relationships",
        ["owner_user_id", "updated_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_knowledge_relationships_owner_updated", table_name="knowledge_relationships")
    op.drop_index("ix_knowledge_relationships_owner_target", table_name="knowledge_relationships")
    op.drop_index("ix_knowledge_relationships_owner_source", table_name="knowledge_relationships")
    op.drop_index(
        op.f("ix_knowledge_relationships_target_node_id"),
        table_name="knowledge_relationships",
    )
    op.drop_index(
        op.f("ix_knowledge_relationships_source_node_id"),
        table_name="knowledge_relationships",
    )
    op.drop_index(
        op.f("ix_knowledge_relationships_owner_user_id"),
        table_name="knowledge_relationships",
    )
    op.drop_table("knowledge_relationships")

    op.drop_index("ix_knowledge_nodes_owner_updated", table_name="knowledge_nodes")
    op.drop_index("ix_knowledge_nodes_owner_source", table_name="knowledge_nodes")
    op.drop_index("ix_knowledge_nodes_owner_type_status", table_name="knowledge_nodes")
    op.drop_index(op.f("ix_knowledge_nodes_source_id"), table_name="knowledge_nodes")
    op.drop_index(op.f("ix_knowledge_nodes_owner_user_id"), table_name="knowledge_nodes")
    op.drop_table("knowledge_nodes")
