from __future__ import annotations

from datetime import date, datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin
from app.domain.profile import (
    AccountDeletionRequestStatus,
    AvatarKind,
    DataRequestStatus,
    FavoriteResourceType,
    ProfileLinkType,
    ProfileVisibility,
)
from app.models.foundation import enum_values_sql


class UserProfile(TimestampMixin, Base):
    __tablename__ = "user_profiles"
    __table_args__ = (
        CheckConstraint(
            f"avatar_kind IN ({enum_values_sql(AvatarKind)})", name="avatar_kind_allowed"
        ),
        UniqueConstraint("owner_user_id", name="uq_user_profiles_owner"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    headline: Mapped[str | None] = mapped_column(String(160), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(120), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    avatar_kind: Mapped[str] = mapped_column(
        String(32), nullable=False, default=AvatarKind.PRESET.value
    )
    avatar_preset: Mapped[str | None] = mapped_column(String(80), nullable=True)
    avatar_file_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("files.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )


class ProfileLink(TimestampMixin, Base):
    __tablename__ = "profile_links"
    __table_args__ = (
        CheckConstraint(
            f"link_type IN ({enum_values_sql(ProfileLinkType)})", name="link_type_allowed"
        ),
        UniqueConstraint(
            "owner_user_id", "link_type", "url", name="uq_profile_links_owner_type_url"
        ),
        Index("ix_profile_links_owner_type", "owner_user_id", "link_type"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    link_type: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)


class ProfileFavoriteProject(TimestampMixin, Base):
    __tablename__ = "profile_favorite_projects"
    __table_args__ = (
        UniqueConstraint(
            "owner_user_id", "project_id", name="uq_profile_favorite_projects_owner_project"
        ),
        Index("ix_profile_favorite_projects_owner_created", "owner_user_id", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    project_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )


class ProfileFavoriteResource(TimestampMixin, Base):
    __tablename__ = "profile_favorite_resources"
    __table_args__ = (
        CheckConstraint(
            f"resource_type IN ({enum_values_sql(FavoriteResourceType)})",
            name="resource_type_allowed",
        ),
        Index("ix_profile_favorite_resources_owner_created", "owner_user_id", "created_at"),
        Index("ix_profile_favorite_resources_owner_type", "owner_user_id", "resource_type"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    resource_type: Mapped[str] = mapped_column(String(32), nullable=False)
    file_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    learning_resource_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("learning_resources.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class Certificate(TimestampMixin, Base):
    __tablename__ = "certificates"
    __table_args__ = (
        Index("ix_certificates_owner_issued", "owner_user_id", "issued_on"),
        Index("ix_certificates_owner_title", "owner_user_id", "title"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    issuer: Mapped[str | None] = mapped_column(String(160), nullable=True)
    issued_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    expires_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    credential_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("files.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class PrivacySettings(TimestampMixin, Base):
    __tablename__ = "privacy_settings"
    __table_args__ = (
        CheckConstraint(
            f"profile_visibility IN ({enum_values_sql(ProfileVisibility)})",
            name="profile_visibility_allowed",
        ),
        UniqueConstraint("owner_user_id", name="uq_privacy_settings_owner"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    profile_visibility: Mapped[str] = mapped_column(
        String(32), nullable=False, default=ProfileVisibility.PRIVATE.value
    )
    show_email_on_profile: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    allow_profile_in_ai_context: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    allow_profile_search_indexing: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    include_profile_in_exports: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class DataExportRequest(TimestampMixin, Base):
    __tablename__ = "data_export_requests"
    __table_args__ = (
        CheckConstraint(f"status IN ({enum_values_sql(DataRequestStatus)})", name="status_allowed"),
        UniqueConstraint(
            "owner_user_id", "idempotency_key", name="uq_data_export_requests_owner_key"
        ),
        Index("ix_data_export_requests_owner_created", "owner_user_id", "created_at"),
        Index("ix_data_export_requests_owner_status", "owner_user_id", "status"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    idempotency_key: Mapped[str] = mapped_column(String(160), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=DataRequestStatus.REQUESTED.value
    )
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    download_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    included_categories: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)


class AccountDeletionRequest(TimestampMixin, Base):
    __tablename__ = "account_deletion_requests"
    __table_args__ = (
        CheckConstraint(
            f"status IN ({enum_values_sql(AccountDeletionRequestStatus)})",
            name="status_allowed",
        ),
        UniqueConstraint(
            "owner_user_id",
            "idempotency_key",
            name="uq_account_deletion_requests_owner_key",
        ),
        Index("ix_account_deletion_requests_owner_created", "owner_user_id", "created_at"),
        Index("ix_account_deletion_requests_owner_status", "owner_user_id", "status"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    idempotency_key: Mapped[str] = mapped_column(String(160), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=AccountDeletionRequestStatus.REQUESTED.value
    )
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    scheduled_deletion_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    canceled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        "metadata", JSON, nullable=False, default=dict
    )
