"""Add asynchronous file ingestion.

Revision ID: 0005_file_ingestion
Revises: 0004_file_vault
Create Date: 2026-07-20 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0005_file_ingestion"
down_revision: str | None = "0004_file_vault"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "processing_jobs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("file_id", sa.Uuid(), nullable=False),
        sa.Column("idempotency_key", sa.String(length=160), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("stage", sa.String(length=32), nullable=False),
        sa.Column("attempt_count", sa.Integer(), nullable=False),
        sa.Column("max_attempts", sa.Integer(), nullable=False),
        sa.Column("locked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_attempt_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error_code", sa.String(length=80), nullable=True),
        sa.Column("last_error_message", sa.String(length=512), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "attempt_count >= 0", name=op.f("ck_processing_jobs_attempt_count_nonnegative")
        ),
        sa.CheckConstraint(
            "max_attempts > 0", name=op.f("ck_processing_jobs_max_attempts_positive")
        ),
        sa.CheckConstraint(
            "stage IN ('queued', 'validating', 'extracting', 'chunking', 'indexing', "
            "'embedding', 'ready', 'failed', 'canceled')",
            name=op.f("ck_processing_jobs_stage_allowed"),
        ),
        sa.CheckConstraint(
            "status IN ('queued', 'processing', 'completed', 'failed', 'canceled')",
            name=op.f("ck_processing_jobs_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["file_id"],
            ["files.id"],
            name=op.f("fk_processing_jobs_file_id_files"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_processing_jobs_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_processing_jobs")),
        sa.UniqueConstraint(
            "owner_user_id",
            "idempotency_key",
            name="uq_processing_jobs_owner_key",
        ),
    )
    op.create_index(op.f("ix_processing_jobs_file_id"), "processing_jobs", ["file_id"])
    op.create_index(
        op.f("ix_processing_jobs_owner_user_id"),
        "processing_jobs",
        ["owner_user_id"],
    )
    op.create_index(
        "ix_processing_jobs_owner_file",
        "processing_jobs",
        ["owner_user_id", "file_id"],
    )
    op.create_index(
        "ix_processing_jobs_status_next",
        "processing_jobs",
        ["status", "next_attempt_at", "created_at"],
    )

    op.create_table(
        "extraction_results",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("file_id", sa.Uuid(), nullable=False),
        sa.Column("processing_job_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("extractor_name", sa.String(length=80), nullable=False),
        sa.Column("text_char_count", sa.Integer(), nullable=False),
        sa.Column("chunk_count", sa.Integer(), nullable=False),
        sa.Column("source_metadata", sa.JSON(), nullable=False),
        sa.Column("error_message", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "chunk_count >= 0",
            name=op.f("ck_extraction_results_chunk_count_nonnegative"),
        ),
        sa.CheckConstraint(
            "status IN ('pending', 'completed', 'empty', 'failed')",
            name=op.f("ck_extraction_results_status_allowed"),
        ),
        sa.CheckConstraint(
            "text_char_count >= 0",
            name=op.f("ck_extraction_results_text_char_count_nonnegative"),
        ),
        sa.ForeignKeyConstraint(
            ["file_id"],
            ["files.id"],
            name=op.f("fk_extraction_results_file_id_files"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_extraction_results_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["processing_job_id"],
            ["processing_jobs.id"],
            name=op.f("fk_extraction_results_processing_job_id_processing_jobs"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_extraction_results")),
        sa.UniqueConstraint(
            "processing_job_id",
            name="uq_extraction_results_processing_job",
        ),
    )
    op.create_index(op.f("ix_extraction_results_file_id"), "extraction_results", ["file_id"])
    op.create_index(
        op.f("ix_extraction_results_owner_user_id"),
        "extraction_results",
        ["owner_user_id"],
    )
    op.create_index(
        op.f("ix_extraction_results_processing_job_id"),
        "extraction_results",
        ["processing_job_id"],
    )
    op.create_index(
        "ix_extraction_results_owner_file",
        "extraction_results",
        ["owner_user_id", "file_id"],
    )

    op.create_table(
        "file_chunks",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("file_id", sa.Uuid(), nullable=False),
        sa.Column("processing_job_id", sa.Uuid(), nullable=False),
        sa.Column("sequence_number", sa.Integer(), nullable=False),
        sa.Column("chunk_text", sa.Text(), nullable=False),
        sa.Column("search_text", sa.Text(), nullable=False),
        sa.Column("token_estimate", sa.Integer(), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=True),
        sa.Column("section_label", sa.String(length=160), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("source_metadata", sa.JSON(), nullable=False),
        sa.Column("embedding", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "sequence_number >= 0",
            name=op.f("ck_file_chunks_sequence_number_nonnegative"),
        ),
        sa.CheckConstraint(
            "status IN ('ready', 'deleted')",
            name=op.f("ck_file_chunks_status_allowed"),
        ),
        sa.CheckConstraint(
            "token_estimate >= 0",
            name=op.f("ck_file_chunks_token_estimate_nonnegative"),
        ),
        sa.ForeignKeyConstraint(
            ["file_id"],
            ["files.id"],
            name=op.f("fk_file_chunks_file_id_files"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_file_chunks_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["processing_job_id"],
            ["processing_jobs.id"],
            name=op.f("fk_file_chunks_processing_job_id_processing_jobs"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_file_chunks")),
        sa.UniqueConstraint("file_id", "sequence_number", name="uq_file_chunks_file_sequence"),
    )
    op.create_index(op.f("ix_file_chunks_file_id"), "file_chunks", ["file_id"])
    op.create_index(op.f("ix_file_chunks_owner_user_id"), "file_chunks", ["owner_user_id"])
    op.create_index(
        op.f("ix_file_chunks_processing_job_id"),
        "file_chunks",
        ["processing_job_id"],
    )
    op.create_index(
        "ix_file_chunks_owner_file_sequence",
        "file_chunks",
        ["owner_user_id", "file_id", "sequence_number"],
    )
    op.create_index("ix_file_chunks_owner_status", "file_chunks", ["owner_user_id", "status"])

    op.create_table(
        "embedding_jobs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("file_id", sa.Uuid(), nullable=False),
        sa.Column("processing_job_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("provider_name", sa.String(length=80), nullable=True),
        sa.Column("model_name", sa.String(length=120), nullable=True),
        sa.Column("attempt_count", sa.Integer(), nullable=False),
        sa.Column("max_attempts", sa.Integer(), nullable=False),
        sa.Column("next_attempt_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error_code", sa.String(length=80), nullable=True),
        sa.Column("last_error_message", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "attempt_count >= 0",
            name=op.f("ck_embedding_jobs_attempt_count_nonnegative"),
        ),
        sa.CheckConstraint(
            "max_attempts > 0",
            name=op.f("ck_embedding_jobs_max_attempts_positive"),
        ),
        sa.CheckConstraint(
            "status IN ('queued', 'skipped', 'completed', 'failed')",
            name=op.f("ck_embedding_jobs_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["file_id"],
            ["files.id"],
            name=op.f("fk_embedding_jobs_file_id_files"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_embedding_jobs_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["processing_job_id"],
            ["processing_jobs.id"],
            name=op.f("fk_embedding_jobs_processing_job_id_processing_jobs"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_embedding_jobs")),
        sa.UniqueConstraint("processing_job_id", name="uq_embedding_jobs_processing_job"),
    )
    op.create_index(op.f("ix_embedding_jobs_file_id"), "embedding_jobs", ["file_id"])
    op.create_index(op.f("ix_embedding_jobs_owner_user_id"), "embedding_jobs", ["owner_user_id"])
    op.create_index(
        op.f("ix_embedding_jobs_processing_job_id"),
        "embedding_jobs",
        ["processing_job_id"],
    )
    op.create_index(
        "ix_embedding_jobs_owner_file",
        "embedding_jobs",
        ["owner_user_id", "file_id"],
    )
    op.create_index(
        "ix_embedding_jobs_status_next",
        "embedding_jobs",
        ["status", "next_attempt_at", "created_at"],
    )

    op.create_table(
        "processing_failures",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("file_id", sa.Uuid(), nullable=False),
        sa.Column("processing_job_id", sa.Uuid(), nullable=False),
        sa.Column("failure_kind", sa.String(length=32), nullable=False),
        sa.Column("error_code", sa.String(length=80), nullable=False),
        sa.Column("message", sa.String(length=512), nullable=False),
        sa.Column("retryable", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "failure_kind IN ('validation', 'storage', 'extraction', 'chunking', "
            "'embedding', 'internal')",
            name=op.f("ck_processing_failures_failure_kind_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["file_id"],
            ["files.id"],
            name=op.f("fk_processing_failures_file_id_files"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_processing_failures_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["processing_job_id"],
            ["processing_jobs.id"],
            name=op.f("fk_processing_failures_processing_job_id_processing_jobs"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_processing_failures")),
    )
    op.create_index(op.f("ix_processing_failures_file_id"), "processing_failures", ["file_id"])
    op.create_index(
        op.f("ix_processing_failures_owner_user_id"),
        "processing_failures",
        ["owner_user_id"],
    )
    op.create_index(
        op.f("ix_processing_failures_processing_job_id"),
        "processing_failures",
        ["processing_job_id"],
    )
    op.create_index(
        "ix_processing_failures_job_created",
        "processing_failures",
        ["processing_job_id", "created_at"],
    )
    op.create_index(
        "ix_processing_failures_owner_file",
        "processing_failures",
        ["owner_user_id", "file_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_processing_failures_owner_file", table_name="processing_failures")
    op.drop_index("ix_processing_failures_job_created", table_name="processing_failures")
    op.drop_index(
        op.f("ix_processing_failures_processing_job_id"), table_name="processing_failures"
    )
    op.drop_index(op.f("ix_processing_failures_owner_user_id"), table_name="processing_failures")
    op.drop_index(op.f("ix_processing_failures_file_id"), table_name="processing_failures")
    op.drop_table("processing_failures")

    op.drop_index("ix_embedding_jobs_status_next", table_name="embedding_jobs")
    op.drop_index("ix_embedding_jobs_owner_file", table_name="embedding_jobs")
    op.drop_index(op.f("ix_embedding_jobs_processing_job_id"), table_name="embedding_jobs")
    op.drop_index(op.f("ix_embedding_jobs_owner_user_id"), table_name="embedding_jobs")
    op.drop_index(op.f("ix_embedding_jobs_file_id"), table_name="embedding_jobs")
    op.drop_table("embedding_jobs")

    op.drop_index("ix_file_chunks_owner_status", table_name="file_chunks")
    op.drop_index("ix_file_chunks_owner_file_sequence", table_name="file_chunks")
    op.drop_index(op.f("ix_file_chunks_processing_job_id"), table_name="file_chunks")
    op.drop_index(op.f("ix_file_chunks_owner_user_id"), table_name="file_chunks")
    op.drop_index(op.f("ix_file_chunks_file_id"), table_name="file_chunks")
    op.drop_table("file_chunks")

    op.drop_index("ix_extraction_results_owner_file", table_name="extraction_results")
    op.drop_index(op.f("ix_extraction_results_processing_job_id"), table_name="extraction_results")
    op.drop_index(op.f("ix_extraction_results_owner_user_id"), table_name="extraction_results")
    op.drop_index(op.f("ix_extraction_results_file_id"), table_name="extraction_results")
    op.drop_table("extraction_results")

    op.drop_index("ix_processing_jobs_status_next", table_name="processing_jobs")
    op.drop_index("ix_processing_jobs_owner_file", table_name="processing_jobs")
    op.drop_index(op.f("ix_processing_jobs_owner_user_id"), table_name="processing_jobs")
    op.drop_index(op.f("ix_processing_jobs_file_id"), table_name="processing_jobs")
    op.drop_table("processing_jobs")
