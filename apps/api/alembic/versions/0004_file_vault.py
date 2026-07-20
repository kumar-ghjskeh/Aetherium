"""Add personal file vault.

Revision ID: 0004_file_vault
Revises: 0003_user_owned_foundation
Create Date: 2026-07-20 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0004_file_vault"
down_revision: str | None = "0003_user_owned_foundation"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "files",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("display_name", sa.String(length=160), nullable=False),
        sa.Column("original_file_name", sa.String(length=255), nullable=False),
        sa.Column("sanitized_file_name", sa.String(length=255), nullable=False),
        sa.Column("file_extension", sa.String(length=16), nullable=False),
        sa.Column("file_kind", sa.String(length=32), nullable=False),
        sa.Column("content_type", sa.String(length=160), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("object_bucket", sa.String(length=120), nullable=False),
        sa.Column("object_key", sa.String(length=512), nullable=False),
        sa.Column("checksum_sha256", sa.String(length=64), nullable=True),
        sa.Column("processing_status", sa.String(length=32), nullable=False),
        sa.Column("deletion_status", sa.String(length=32), nullable=False),
        sa.Column("malware_scan_status", sa.String(length=32), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "deletion_status IN ('active', 'soft_deleted')",
            name=op.f("ck_files_deletion_status_allowed"),
        ),
        sa.CheckConstraint(
            "file_kind IN ('pdf', 'text', 'markdown', 'docx', 'csv', 'json', "
            "'source_code', 'image')",
            name=op.f("ck_files_file_kind_allowed"),
        ),
        sa.CheckConstraint(
            "malware_scan_status IN ('not_configured', 'pending', 'clean', 'suspicious', 'failed')",
            name=op.f("ck_files_malware_scan_status_allowed"),
        ),
        sa.CheckConstraint(
            "processing_status IN ('not_started', 'queued', 'processing', 'ready', 'failed')",
            name=op.f("ck_files_processing_status_allowed"),
        ),
        sa.CheckConstraint("size_bytes > 0", name=op.f("ck_files_size_bytes_positive")),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_files_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_files")),
    )
    op.create_index(op.f("ix_files_owner_user_id"), "files", ["owner_user_id"], unique=False)
    op.create_index("ix_files_owner_created", "files", ["owner_user_id", "created_at"])
    op.create_index("ix_files_owner_deleted", "files", ["owner_user_id", "deleted_at"])
    op.create_index(
        "ix_files_owner_processing",
        "files",
        ["owner_user_id", "processing_status"],
    )

    op.create_table(
        "upload_records",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("file_id", sa.Uuid(), nullable=True),
        sa.Column("idempotency_key", sa.String(length=160), nullable=False),
        sa.Column("completion_idempotency_key", sa.String(length=160), nullable=True),
        sa.Column("original_file_name", sa.String(length=255), nullable=False),
        sa.Column("sanitized_file_name", sa.String(length=255), nullable=False),
        sa.Column("file_extension", sa.String(length=16), nullable=False),
        sa.Column("file_kind", sa.String(length=32), nullable=False),
        sa.Column("content_type", sa.String(length=160), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("object_bucket", sa.String(length=120), nullable=False),
        sa.Column("object_key", sa.String(length=512), nullable=False),
        sa.Column("checksum_sha256", sa.String(length=64), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("malware_scan_status", sa.String(length=32), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "file_kind IN ('pdf', 'text', 'markdown', 'docx', 'csv', 'json', "
            "'source_code', 'image')",
            name=op.f("ck_upload_records_file_kind_allowed"),
        ),
        sa.CheckConstraint(
            "malware_scan_status IN ('not_configured', 'pending', 'clean', 'suspicious', 'failed')",
            name=op.f("ck_upload_records_malware_scan_status_allowed"),
        ),
        sa.CheckConstraint("size_bytes > 0", name=op.f("ck_upload_records_size_bytes_positive")),
        sa.CheckConstraint(
            "status IN ('pending', 'completed', 'aborted', 'expired')",
            name=op.f("ck_upload_records_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["file_id"],
            ["files.id"],
            name=op.f("fk_upload_records_file_id_files"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_upload_records_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_upload_records")),
        sa.UniqueConstraint(
            "owner_user_id",
            "idempotency_key",
            name="uq_upload_records_owner_key",
        ),
    )
    op.create_index(
        op.f("ix_upload_records_owner_user_id"),
        "upload_records",
        ["owner_user_id"],
        unique=False,
    )
    op.create_index(op.f("ix_upload_records_file_id"), "upload_records", ["file_id"])
    op.create_index(
        "ix_upload_records_owner_status",
        "upload_records",
        ["owner_user_id", "status"],
    )

    op.create_table(
        "file_versions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("file_id", sa.Uuid(), nullable=False),
        sa.Column("upload_record_id", sa.Uuid(), nullable=True),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("object_bucket", sa.String(length=120), nullable=False),
        sa.Column("object_key", sa.String(length=512), nullable=False),
        sa.Column("content_type", sa.String(length=160), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("checksum_sha256", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("size_bytes > 0", name=op.f("ck_file_versions_size_bytes_positive")),
        sa.CheckConstraint(
            "version_number > 0",
            name=op.f("ck_file_versions_version_number_positive"),
        ),
        sa.ForeignKeyConstraint(
            ["file_id"],
            ["files.id"],
            name=op.f("fk_file_versions_file_id_files"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_file_versions_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["upload_record_id"],
            ["upload_records.id"],
            name=op.f("fk_file_versions_upload_record_id_upload_records"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_file_versions")),
        sa.UniqueConstraint("file_id", "version_number", name="uq_file_versions_file_version"),
    )
    op.create_index(
        op.f("ix_file_versions_owner_user_id"),
        "file_versions",
        ["owner_user_id"],
        unique=False,
    )
    op.create_index(op.f("ix_file_versions_file_id"), "file_versions", ["file_id"])
    op.create_index(
        op.f("ix_file_versions_upload_record_id"),
        "file_versions",
        ["upload_record_id"],
    )
    op.create_index(
        "ix_file_versions_owner_file",
        "file_versions",
        ["owner_user_id", "file_id"],
    )

    op.create_table(
        "collections",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("normalized_name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_collections_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_collections")),
        sa.UniqueConstraint("owner_user_id", "normalized_name", name="uq_collections_owner_name"),
    )
    op.create_index(op.f("ix_collections_owner_user_id"), "collections", ["owner_user_id"])
    op.create_index("ix_collections_owner_created", "collections", ["owner_user_id", "created_at"])

    op.create_table(
        "tags",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("normalized_name", sa.String(length=80), nullable=False),
        sa.Column("color", sa.String(length=32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_tags_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_tags")),
        sa.UniqueConstraint("owner_user_id", "normalized_name", name="uq_tags_owner_name"),
    )
    op.create_index(op.f("ix_tags_owner_user_id"), "tags", ["owner_user_id"])
    op.create_index("ix_tags_owner_created", "tags", ["owner_user_id", "created_at"])

    op.create_table(
        "collection_items",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("collection_id", sa.Uuid(), nullable=False),
        sa.Column("file_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["collection_id"],
            ["collections.id"],
            name=op.f("fk_collection_items_collection_id_collections"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["file_id"],
            ["files.id"],
            name=op.f("fk_collection_items_file_id_files"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_collection_items_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_collection_items")),
        sa.UniqueConstraint(
            "owner_user_id",
            "collection_id",
            "file_id",
            name="uq_collection_items_owner_collection_file",
        ),
    )
    op.create_index(
        op.f("ix_collection_items_owner_user_id"),
        "collection_items",
        ["owner_user_id"],
    )
    op.create_index(
        op.f("ix_collection_items_collection_id"),
        "collection_items",
        ["collection_id"],
    )
    op.create_index(op.f("ix_collection_items_file_id"), "collection_items", ["file_id"])
    op.create_index(
        "ix_collection_items_owner_collection",
        "collection_items",
        ["owner_user_id", "collection_id"],
    )
    op.create_index(
        "ix_collection_items_owner_file",
        "collection_items",
        ["owner_user_id", "file_id"],
    )

    op.create_table(
        "file_tags",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("file_id", sa.Uuid(), nullable=False),
        sa.Column("tag_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["file_id"],
            ["files.id"],
            name=op.f("fk_file_tags_file_id_files"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_file_tags_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["tag_id"],
            ["tags.id"],
            name=op.f("fk_file_tags_tag_id_tags"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_file_tags")),
        sa.UniqueConstraint(
            "owner_user_id",
            "file_id",
            "tag_id",
            name="uq_file_tags_owner_file_tag",
        ),
    )
    op.create_index(op.f("ix_file_tags_owner_user_id"), "file_tags", ["owner_user_id"])
    op.create_index(op.f("ix_file_tags_file_id"), "file_tags", ["file_id"])
    op.create_index(op.f("ix_file_tags_tag_id"), "file_tags", ["tag_id"])
    op.create_index("ix_file_tags_owner_file", "file_tags", ["owner_user_id", "file_id"])
    op.create_index("ix_file_tags_owner_tag", "file_tags", ["owner_user_id", "tag_id"])

    op.create_table(
        "file_favorites",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("file_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["file_id"],
            ["files.id"],
            name=op.f("fk_file_favorites_file_id_files"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_file_favorites_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_file_favorites")),
        sa.UniqueConstraint("owner_user_id", "file_id", name="uq_file_favorites_owner_file"),
    )
    op.create_index(
        op.f("ix_file_favorites_owner_user_id"),
        "file_favorites",
        ["owner_user_id"],
    )
    op.create_index(op.f("ix_file_favorites_file_id"), "file_favorites", ["file_id"])
    op.create_index(
        "ix_file_favorites_owner_file",
        "file_favorites",
        ["owner_user_id", "file_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_file_favorites_owner_file", table_name="file_favorites")
    op.drop_index(op.f("ix_file_favorites_file_id"), table_name="file_favorites")
    op.drop_index(op.f("ix_file_favorites_owner_user_id"), table_name="file_favorites")
    op.drop_table("file_favorites")

    op.drop_index("ix_file_tags_owner_tag", table_name="file_tags")
    op.drop_index("ix_file_tags_owner_file", table_name="file_tags")
    op.drop_index(op.f("ix_file_tags_tag_id"), table_name="file_tags")
    op.drop_index(op.f("ix_file_tags_file_id"), table_name="file_tags")
    op.drop_index(op.f("ix_file_tags_owner_user_id"), table_name="file_tags")
    op.drop_table("file_tags")

    op.drop_index("ix_collection_items_owner_file", table_name="collection_items")
    op.drop_index("ix_collection_items_owner_collection", table_name="collection_items")
    op.drop_index(op.f("ix_collection_items_file_id"), table_name="collection_items")
    op.drop_index(op.f("ix_collection_items_collection_id"), table_name="collection_items")
    op.drop_index(op.f("ix_collection_items_owner_user_id"), table_name="collection_items")
    op.drop_table("collection_items")

    op.drop_index("ix_tags_owner_created", table_name="tags")
    op.drop_index(op.f("ix_tags_owner_user_id"), table_name="tags")
    op.drop_table("tags")

    op.drop_index("ix_collections_owner_created", table_name="collections")
    op.drop_index(op.f("ix_collections_owner_user_id"), table_name="collections")
    op.drop_table("collections")

    op.drop_index("ix_file_versions_owner_file", table_name="file_versions")
    op.drop_index(op.f("ix_file_versions_upload_record_id"), table_name="file_versions")
    op.drop_index(op.f("ix_file_versions_file_id"), table_name="file_versions")
    op.drop_index(op.f("ix_file_versions_owner_user_id"), table_name="file_versions")
    op.drop_table("file_versions")

    op.drop_index("ix_upload_records_owner_status", table_name="upload_records")
    op.drop_index(op.f("ix_upload_records_file_id"), table_name="upload_records")
    op.drop_index(op.f("ix_upload_records_owner_user_id"), table_name="upload_records")
    op.drop_table("upload_records")

    op.drop_index("ix_files_owner_processing", table_name="files")
    op.drop_index("ix_files_owner_deleted", table_name="files")
    op.drop_index("ix_files_owner_created", table_name="files")
    op.drop_index(op.f("ix_files_owner_user_id"), table_name="files")
    op.drop_table("files")
