from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.domain.file_vault import (
    MAX_DISPLAY_NAME_LENGTH,
    MAX_FILE_SIZE_BYTES,
    MAX_ORIGINAL_FILE_NAME_LENGTH,
    FileDeletionStatus,
    FileKind,
    FileProcessingStatus,
    MalwareScanStatus,
    UploadStatus,
)
from app.models.file_vault import Collection, FileRecord, Tag, UploadRecord
from app.services.file_vault import FileView
from app.services.object_storage import PresignedObjectRequest


class FileVaultSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class UploadInitiateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    file_name: str = Field(alias="fileName", min_length=1, max_length=MAX_ORIGINAL_FILE_NAME_LENGTH)
    content_type: str = Field(alias="contentType", min_length=1, max_length=160)
    size_bytes: int = Field(alias="sizeBytes", ge=1, le=MAX_FILE_SIZE_BYTES)
    checksum_sha256: str | None = Field(default=None, alias="checksumSha256")
    idempotency_key: str = Field(alias="idempotencyKey", min_length=8, max_length=160)


class UploadCompleteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    idempotency_key: str = Field(alias="idempotencyKey", min_length=8, max_length=160)
    display_name: str | None = Field(
        default=None,
        alias="displayName",
        min_length=1,
        max_length=MAX_DISPLAY_NAME_LENGTH,
    )


class UploadResponse(FileVaultSchema):
    id: UUID
    file_name: str = Field(alias="fileName")
    sanitized_file_name: str = Field(alias="sanitizedFileName")
    content_type: str = Field(alias="contentType")
    size_bytes: int = Field(alias="sizeBytes")
    status: UploadStatus
    upload_url: str = Field(alias="uploadUrl")
    upload_method: str = Field(alias="uploadMethod")
    upload_headers: dict[str, str] = Field(alias="uploadHeaders")
    expires_at: datetime = Field(alias="expiresAt")
    created_at: datetime = Field(alias="createdAt")

    @classmethod
    def from_upload(
        cls,
        upload: UploadRecord,
        presigned: PresignedObjectRequest,
    ) -> UploadResponse:
        return cls(
            id=upload.id,
            fileName=upload.original_file_name,
            sanitizedFileName=upload.sanitized_file_name,
            contentType=upload.content_type,
            sizeBytes=upload.size_bytes,
            status=UploadStatus(upload.status),
            uploadUrl=presigned.url,
            uploadMethod=presigned.method,
            uploadHeaders=presigned.headers,
            expiresAt=presigned.expires_at,
            createdAt=upload.created_at,
        )


class TagResponse(FileVaultSchema):
    id: UUID
    name: str
    color: str | None
    created_at: datetime = Field(alias="createdAt")

    @classmethod
    def from_tag(cls, tag: Tag) -> TagResponse:
        return cls(id=tag.id, name=tag.name, color=tag.color, createdAt=tag.created_at)


class CollectionResponse(FileVaultSchema):
    id: UUID
    name: str
    description: str | None
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_collection(cls, collection: Collection) -> CollectionResponse:
        return cls(
            id=collection.id,
            name=collection.name,
            description=collection.description,
            createdAt=collection.created_at,
            updatedAt=collection.updated_at,
        )


class FileResponse(FileVaultSchema):
    id: UUID
    display_name: str = Field(alias="displayName")
    original_file_name: str = Field(alias="originalFileName")
    sanitized_file_name: str = Field(alias="sanitizedFileName")
    file_extension: str = Field(alias="fileExtension")
    file_kind: FileKind = Field(alias="fileKind")
    content_type: str = Field(alias="contentType")
    size_bytes: int = Field(alias="sizeBytes")
    processing_status: FileProcessingStatus = Field(alias="processingStatus")
    deletion_status: FileDeletionStatus = Field(alias="deletionStatus")
    malware_scan_status: MalwareScanStatus = Field(alias="malwareScanStatus")
    deleted_at: datetime | None = Field(alias="deletedAt")
    is_favorite: bool = Field(alias="isFavorite")
    tags: list[TagResponse]
    collection_ids: list[UUID] = Field(alias="collectionIds")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_view(cls, view: FileView) -> FileResponse:
        file = view.file
        return cls(
            id=file.id,
            displayName=file.display_name,
            originalFileName=file.original_file_name,
            sanitizedFileName=file.sanitized_file_name,
            fileExtension=file.file_extension,
            fileKind=FileKind(file.file_kind),
            contentType=file.content_type,
            sizeBytes=file.size_bytes,
            processingStatus=FileProcessingStatus(file.processing_status),
            deletionStatus=FileDeletionStatus(file.deletion_status),
            malwareScanStatus=MalwareScanStatus(file.malware_scan_status),
            deletedAt=file.deleted_at,
            isFavorite=view.is_favorite,
            tags=[TagResponse.from_tag(tag) for tag in view.tags],
            collectionIds=view.collection_ids,
            createdAt=file.created_at,
            updatedAt=file.updated_at,
        )


class FilePage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[FileResponse]
    total: int
    limit: int
    offset: int


class CollectionPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[CollectionResponse]
    total: int
    limit: int
    offset: int


class TagPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[TagResponse]
    total: int
    limit: int
    offset: int


class FileUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    display_name: str = Field(
        alias="displayName",
        min_length=1,
        max_length=MAX_DISPLAY_NAME_LENGTH,
    )


class CollectionCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=2000)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        return value.strip()


class CollectionItemRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    file_id: UUID = Field(alias="fileId")


class FileTagCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    name: str = Field(min_length=1, max_length=80)
    color: str | None = Field(default=None, max_length=32)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        return value.strip()


class DownloadUrlResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    file_id: UUID = Field(alias="fileId")
    download_url: str = Field(alias="downloadUrl")
    download_method: str = Field(alias="downloadMethod")
    download_headers: dict[str, str] = Field(alias="downloadHeaders")
    expires_at: datetime = Field(alias="expiresAt")

    @classmethod
    def from_presigned(
        cls,
        file: FileRecord,
        presigned: PresignedObjectRequest,
    ) -> DownloadUrlResponse:
        return cls(
            fileId=file.id,
            downloadUrl=presigned.url,
            downloadMethod=presigned.method,
            downloadHeaders=presigned.headers,
            expiresAt=presigned.expires_at,
        )
