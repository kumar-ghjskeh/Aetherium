from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin
from app.domain.file_vault import (
    FileDeletionStatus,
    FileKind,
    FileProcessingStatus,
    MalwareScanStatus,
    UploadStatus,
)
from app.models.foundation import enum_values_sql


class FileRecord(TimestampMixin, Base):
    __tablename__ = "files"
    __table_args__ = (
        CheckConstraint(f"file_kind IN ({enum_values_sql(FileKind)})", name="file_kind_allowed"),
        CheckConstraint(
            f"processing_status IN ({enum_values_sql(FileProcessingStatus)})",
            name="processing_status_allowed",
        ),
        CheckConstraint(
            f"deletion_status IN ({enum_values_sql(FileDeletionStatus)})",
            name="deletion_status_allowed",
        ),
        CheckConstraint(
            f"malware_scan_status IN ({enum_values_sql(MalwareScanStatus)})",
            name="malware_scan_status_allowed",
        ),
        CheckConstraint("size_bytes > 0", name="size_bytes_positive"),
        Index("ix_files_owner_created", "owner_user_id", "created_at"),
        Index("ix_files_owner_deleted", "owner_user_id", "deleted_at"),
        Index("ix_files_owner_processing", "owner_user_id", "processing_status"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    display_name: Mapped[str] = mapped_column(String(160), nullable=False)
    original_file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sanitized_file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_extension: Mapped[str] = mapped_column(String(16), nullable=False)
    file_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    content_type: Mapped[str] = mapped_column(String(160), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    object_bucket: Mapped[str] = mapped_column(String(120), nullable=False)
    object_key: Mapped[str] = mapped_column(String(512), nullable=False)
    checksum_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)
    processing_status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=FileProcessingStatus.NOT_STARTED.value,
    )
    deletion_status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=FileDeletionStatus.ACTIVE.value,
    )
    malware_scan_status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=MalwareScanStatus.NOT_CONFIGURED.value,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class FileVersion(TimestampMixin, Base):
    __tablename__ = "file_versions"
    __table_args__ = (
        CheckConstraint("version_number > 0", name="version_number_positive"),
        CheckConstraint("size_bytes > 0", name="size_bytes_positive"),
        UniqueConstraint("file_id", "version_number", name="uq_file_versions_file_version"),
        Index("ix_file_versions_owner_file", "owner_user_id", "file_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    upload_record_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("upload_records.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    object_bucket: Mapped[str] = mapped_column(String(120), nullable=False)
    object_key: Mapped[str] = mapped_column(String(512), nullable=False)
    content_type: Mapped[str] = mapped_column(String(160), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    checksum_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)


class UploadRecord(TimestampMixin, Base):
    __tablename__ = "upload_records"
    __table_args__ = (
        CheckConstraint(f"file_kind IN ({enum_values_sql(FileKind)})", name="file_kind_allowed"),
        CheckConstraint(f"status IN ({enum_values_sql(UploadStatus)})", name="status_allowed"),
        CheckConstraint(
            f"malware_scan_status IN ({enum_values_sql(MalwareScanStatus)})",
            name="malware_scan_status_allowed",
        ),
        CheckConstraint("size_bytes > 0", name="size_bytes_positive"),
        UniqueConstraint("owner_user_id", "idempotency_key", name="uq_upload_records_owner_key"),
        Index("ix_upload_records_owner_status", "owner_user_id", "status"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("files.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    idempotency_key: Mapped[str] = mapped_column(String(160), nullable=False)
    completion_idempotency_key: Mapped[str | None] = mapped_column(String(160), nullable=True)
    original_file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sanitized_file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_extension: Mapped[str] = mapped_column(String(16), nullable=False)
    file_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    content_type: Mapped[str] = mapped_column(String(160), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    object_bucket: Mapped[str] = mapped_column(String(120), nullable=False)
    object_key: Mapped[str] = mapped_column(String(512), nullable=False)
    checksum_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=UploadStatus.PENDING.value,
    )
    malware_scan_status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=MalwareScanStatus.NOT_CONFIGURED.value,
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Collection(TimestampMixin, Base):
    __tablename__ = "collections"
    __table_args__ = (
        UniqueConstraint("owner_user_id", "normalized_name", name="uq_collections_owner_name"),
        Index("ix_collections_owner_created", "owner_user_id", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    normalized_name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)


class CollectionItem(TimestampMixin, Base):
    __tablename__ = "collection_items"
    __table_args__ = (
        UniqueConstraint(
            "owner_user_id",
            "collection_id",
            "file_id",
            name="uq_collection_items_owner_collection_file",
        ),
        Index("ix_collection_items_owner_collection", "owner_user_id", "collection_id"),
        Index("ix_collection_items_owner_file", "owner_user_id", "file_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    collection_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("collections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )


class Tag(TimestampMixin, Base):
    __tablename__ = "tags"
    __table_args__ = (
        UniqueConstraint("owner_user_id", "normalized_name", name="uq_tags_owner_name"),
        Index("ix_tags_owner_created", "owner_user_id", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    normalized_name: Mapped[str] = mapped_column(String(80), nullable=False)
    color: Mapped[str | None] = mapped_column(String(32), nullable=True)


class FileTag(TimestampMixin, Base):
    __tablename__ = "file_tags"
    __table_args__ = (
        UniqueConstraint("owner_user_id", "file_id", "tag_id", name="uq_file_tags_owner_file_tag"),
        Index("ix_file_tags_owner_file", "owner_user_id", "file_id"),
        Index("ix_file_tags_owner_tag", "owner_user_id", "tag_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tag_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("tags.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )


class FileFavorite(TimestampMixin, Base):
    __tablename__ = "file_favorites"
    __table_args__ = (
        UniqueConstraint("owner_user_id", "file_id", name="uq_file_favorites_owner_file"),
        Index("ix_file_favorites_owner_file", "owner_user_id", "file_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
