"""Add personal profile and settings foundation.

Revision ID: 0013_profile_settings
Revises: 0012_achievement_engine
Create Date: 2026-07-21 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0013_profile_settings"
down_revision: str | None = "0012_achievement_engine"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

AVATAR_KIND_VALUES = "'preset', 'vault_file'"
PROFILE_LINK_TYPE_VALUES = "'resume', 'portfolio', 'website', 'github', 'linkedin', 'other'"
PROFILE_VISIBILITY_VALUES = "'private', 'unlisted'"
FAVORITE_RESOURCE_TYPE_VALUES = "'file', 'learning_resource', 'external_link'"
DATA_REQUEST_STATUS_VALUES = "'requested', 'processing', 'ready', 'canceled', 'failed'"
ACCOUNT_DELETION_STATUS_VALUES = "'requested', 'canceled', 'completed'"


def upgrade() -> None:
    op.create_table(
        "user_profiles",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("headline", sa.String(length=160), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("location", sa.String(length=120), nullable=True),
        sa.Column("website_url", sa.String(length=500), nullable=True),
        sa.Column("avatar_kind", sa.String(length=32), nullable=False),
        sa.Column("avatar_preset", sa.String(length=80), nullable=True),
        sa.Column("avatar_file_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"avatar_kind IN ({AVATAR_KIND_VALUES})",
            name=op.f("ck_user_profiles_avatar_kind_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["avatar_file_id"],
            ["files.id"],
            name=op.f("fk_user_profiles_avatar_file_id_files"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_user_profiles_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_user_profiles")),
        sa.UniqueConstraint("owner_user_id", name="uq_user_profiles_owner"),
    )
    op.create_index(op.f("ix_user_profiles_owner_user_id"), "user_profiles", ["owner_user_id"])
    op.create_index(op.f("ix_user_profiles_avatar_file_id"), "user_profiles", ["avatar_file_id"])

    op.create_table(
        "profile_links",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("link_type", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("url", sa.String(length=500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"link_type IN ({PROFILE_LINK_TYPE_VALUES})",
            name=op.f("ck_profile_links_link_type_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_profile_links_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_profile_links")),
        sa.UniqueConstraint(
            "owner_user_id",
            "link_type",
            "url",
            name="uq_profile_links_owner_type_url",
        ),
    )
    op.create_index(op.f("ix_profile_links_owner_user_id"), "profile_links", ["owner_user_id"])
    op.create_index("ix_profile_links_owner_type", "profile_links", ["owner_user_id", "link_type"])

    op.create_table(
        "profile_favorite_projects",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_profile_favorite_projects_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name=op.f("fk_profile_favorite_projects_project_id_projects"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_profile_favorite_projects")),
        sa.UniqueConstraint(
            "owner_user_id",
            "project_id",
            name="uq_profile_favorite_projects_owner_project",
        ),
    )
    op.create_index(
        op.f("ix_profile_favorite_projects_owner_user_id"),
        "profile_favorite_projects",
        ["owner_user_id"],
    )
    op.create_index(
        op.f("ix_profile_favorite_projects_project_id"),
        "profile_favorite_projects",
        ["project_id"],
    )
    op.create_index(
        "ix_profile_favorite_projects_owner_created",
        "profile_favorite_projects",
        ["owner_user_id", "created_at"],
    )

    op.create_table(
        "profile_favorite_resources",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("resource_type", sa.String(length=32), nullable=False),
        sa.Column("file_id", sa.Uuid(), nullable=True),
        sa.Column("learning_resource_id", sa.Uuid(), nullable=True),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("url", sa.String(length=500), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"resource_type IN ({FAVORITE_RESOURCE_TYPE_VALUES})",
            name=op.f("ck_profile_favorite_resources_resource_type_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["file_id"],
            ["files.id"],
            name=op.f("fk_profile_favorite_resources_file_id_files"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["learning_resource_id"],
            ["learning_resources.id"],
            name=op.f("fk_profile_favorite_resources_learning_resource_id_learning_resources"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_profile_favorite_resources_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_profile_favorite_resources")),
    )
    op.create_index(
        op.f("ix_profile_favorite_resources_owner_user_id"),
        "profile_favorite_resources",
        ["owner_user_id"],
    )
    op.create_index(
        op.f("ix_profile_favorite_resources_file_id"),
        "profile_favorite_resources",
        ["file_id"],
    )
    op.create_index(
        op.f("ix_profile_favorite_resources_learning_resource_id"),
        "profile_favorite_resources",
        ["learning_resource_id"],
    )
    op.create_index(
        "ix_profile_favorite_resources_owner_created",
        "profile_favorite_resources",
        ["owner_user_id", "created_at"],
    )
    op.create_index(
        "ix_profile_favorite_resources_owner_type",
        "profile_favorite_resources",
        ["owner_user_id", "resource_type"],
    )

    op.create_table(
        "certificates",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("issuer", sa.String(length=160), nullable=True),
        sa.Column("issued_on", sa.Date(), nullable=True),
        sa.Column("expires_on", sa.Date(), nullable=True),
        sa.Column("credential_url", sa.String(length=500), nullable=True),
        sa.Column("file_id", sa.Uuid(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["file_id"],
            ["files.id"],
            name=op.f("fk_certificates_file_id_files"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_certificates_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_certificates")),
    )
    op.create_index(op.f("ix_certificates_owner_user_id"), "certificates", ["owner_user_id"])
    op.create_index(op.f("ix_certificates_file_id"), "certificates", ["file_id"])
    op.create_index("ix_certificates_owner_issued", "certificates", ["owner_user_id", "issued_on"])
    op.create_index("ix_certificates_owner_title", "certificates", ["owner_user_id", "title"])

    op.create_table(
        "privacy_settings",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("profile_visibility", sa.String(length=32), nullable=False),
        sa.Column("show_email_on_profile", sa.Boolean(), nullable=False),
        sa.Column("allow_profile_in_ai_context", sa.Boolean(), nullable=False),
        sa.Column("allow_profile_search_indexing", sa.Boolean(), nullable=False),
        sa.Column("include_profile_in_exports", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"profile_visibility IN ({PROFILE_VISIBILITY_VALUES})",
            name=op.f("ck_privacy_settings_profile_visibility_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_privacy_settings_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_privacy_settings")),
        sa.UniqueConstraint("owner_user_id", name="uq_privacy_settings_owner"),
    )
    op.create_index(
        op.f("ix_privacy_settings_owner_user_id"), "privacy_settings", ["owner_user_id"]
    )

    op.create_table(
        "data_export_requests",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("idempotency_key", sa.String(length=160), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("download_url", sa.String(length=500), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("included_categories", sa.JSON(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"status IN ({DATA_REQUEST_STATUS_VALUES})",
            name=op.f("ck_data_export_requests_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_data_export_requests_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_data_export_requests")),
        sa.UniqueConstraint(
            "owner_user_id",
            "idempotency_key",
            name="uq_data_export_requests_owner_key",
        ),
    )
    op.create_index(
        op.f("ix_data_export_requests_owner_user_id"),
        "data_export_requests",
        ["owner_user_id"],
    )
    op.create_index(
        "ix_data_export_requests_owner_created",
        "data_export_requests",
        ["owner_user_id", "created_at"],
    )
    op.create_index(
        "ix_data_export_requests_owner_status",
        "data_export_requests",
        ["owner_user_id", "status"],
    )

    op.create_table(
        "account_deletion_requests",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("idempotency_key", sa.String(length=160), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("scheduled_deletion_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("canceled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"status IN ({ACCOUNT_DELETION_STATUS_VALUES})",
            name=op.f("ck_account_deletion_requests_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_account_deletion_requests_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_account_deletion_requests")),
        sa.UniqueConstraint(
            "owner_user_id",
            "idempotency_key",
            name="uq_account_deletion_requests_owner_key",
        ),
    )
    op.create_index(
        op.f("ix_account_deletion_requests_owner_user_id"),
        "account_deletion_requests",
        ["owner_user_id"],
    )
    op.create_index(
        "ix_account_deletion_requests_owner_created",
        "account_deletion_requests",
        ["owner_user_id", "created_at"],
    )
    op.create_index(
        "ix_account_deletion_requests_owner_status",
        "account_deletion_requests",
        ["owner_user_id", "status"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_account_deletion_requests_owner_status", table_name="account_deletion_requests"
    )
    op.drop_index(
        "ix_account_deletion_requests_owner_created", table_name="account_deletion_requests"
    )
    op.drop_index(
        op.f("ix_account_deletion_requests_owner_user_id"),
        table_name="account_deletion_requests",
    )
    op.drop_table("account_deletion_requests")

    op.drop_index("ix_data_export_requests_owner_status", table_name="data_export_requests")
    op.drop_index("ix_data_export_requests_owner_created", table_name="data_export_requests")
    op.drop_index(op.f("ix_data_export_requests_owner_user_id"), table_name="data_export_requests")
    op.drop_table("data_export_requests")

    op.drop_index(op.f("ix_privacy_settings_owner_user_id"), table_name="privacy_settings")
    op.drop_table("privacy_settings")

    op.drop_index("ix_certificates_owner_title", table_name="certificates")
    op.drop_index("ix_certificates_owner_issued", table_name="certificates")
    op.drop_index(op.f("ix_certificates_file_id"), table_name="certificates")
    op.drop_index(op.f("ix_certificates_owner_user_id"), table_name="certificates")
    op.drop_table("certificates")

    op.drop_index(
        "ix_profile_favorite_resources_owner_type", table_name="profile_favorite_resources"
    )
    op.drop_index(
        "ix_profile_favorite_resources_owner_created", table_name="profile_favorite_resources"
    )
    op.drop_index(
        op.f("ix_profile_favorite_resources_learning_resource_id"),
        table_name="profile_favorite_resources",
    )
    op.drop_index(
        op.f("ix_profile_favorite_resources_file_id"), table_name="profile_favorite_resources"
    )
    op.drop_index(
        op.f("ix_profile_favorite_resources_owner_user_id"),
        table_name="profile_favorite_resources",
    )
    op.drop_table("profile_favorite_resources")

    op.drop_index(
        "ix_profile_favorite_projects_owner_created", table_name="profile_favorite_projects"
    )
    op.drop_index(
        op.f("ix_profile_favorite_projects_project_id"), table_name="profile_favorite_projects"
    )
    op.drop_index(
        op.f("ix_profile_favorite_projects_owner_user_id"),
        table_name="profile_favorite_projects",
    )
    op.drop_table("profile_favorite_projects")

    op.drop_index("ix_profile_links_owner_type", table_name="profile_links")
    op.drop_index(op.f("ix_profile_links_owner_user_id"), table_name="profile_links")
    op.drop_table("profile_links")

    op.drop_index(op.f("ix_user_profiles_avatar_file_id"), table_name="user_profiles")
    op.drop_index(op.f("ix_user_profiles_owner_user_id"), table_name="user_profiles")
    op.drop_table("user_profiles")
