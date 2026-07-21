"""Add hybrid global search foundation.

Revision ID: 0006_hybrid_search
Revises: 0005_file_ingestion
Create Date: 2026-07-20 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0006_hybrid_search"
down_revision: str | None = "0005_file_ingestion"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "recent_searches",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("query_text", sa.String(length=240), nullable=False),
        sa.Column("normalized_query", sa.String(length=240), nullable=False),
        sa.Column("entity_types", sa.JSON(), nullable=False),
        sa.Column("filters", sa.JSON(), nullable=False),
        sa.Column("result_count", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "length(query_text) > 0", name=op.f("ck_recent_searches_query_text_not_empty")
        ),
        sa.CheckConstraint(
            "result_count >= 0", name=op.f("ck_recent_searches_result_count_nonnegative")
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_recent_searches_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_recent_searches")),
    )
    op.create_index(op.f("ix_recent_searches_owner_user_id"), "recent_searches", ["owner_user_id"])
    op.create_index(
        "ix_recent_searches_owner_created",
        "recent_searches",
        ["owner_user_id", "created_at"],
    )
    op.create_index(
        "ix_recent_searches_owner_query",
        "recent_searches",
        ["owner_user_id", "normalized_query"],
    )

    op.execute(
        "CREATE INDEX ix_files_search_metadata_fts ON files USING GIN "
        "(to_tsvector('english', coalesce(display_name, '') || ' ' || "
        "coalesce(original_file_name, '') || ' ' || coalesce(file_kind, '')))"
    )
    op.execute(
        "CREATE INDEX ix_file_chunks_search_text_fts ON file_chunks USING GIN "
        "(to_tsvector('english', coalesce(search_text, '')))"
    )
    op.execute(
        "CREATE INDEX ix_collections_search_metadata_fts ON collections USING GIN "
        "(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')))"
    )
    op.execute(
        "CREATE INDEX ix_tags_search_name_fts ON tags USING GIN "
        "(to_tsvector('english', coalesce(name, '')))"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_tags_search_name_fts")
    op.execute("DROP INDEX IF EXISTS ix_collections_search_metadata_fts")
    op.execute("DROP INDEX IF EXISTS ix_file_chunks_search_text_fts")
    op.execute("DROP INDEX IF EXISTS ix_files_search_metadata_fts")

    op.drop_index("ix_recent_searches_owner_query", table_name="recent_searches")
    op.drop_index("ix_recent_searches_owner_created", table_name="recent_searches")
    op.drop_index(op.f("ix_recent_searches_owner_user_id"), table_name="recent_searches")
    op.drop_table("recent_searches")
