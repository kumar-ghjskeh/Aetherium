from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import PurePosixPath
from uuid import UUID, uuid4

from sqlalchemy import Select, delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.errors import AppError
from app.core.pagination import PaginationParams
from app.domain.file_vault import (
    MAX_DISPLAY_NAME_LENGTH,
    MAX_ORIGINAL_FILE_NAME_LENGTH,
    SUPPORTED_CONTENT_TYPES_BY_EXTENSION,
    SUPPORTED_FILE_EXTENSIONS_BY_KIND,
    FileDeletionStatus,
    FileProcessingStatus,
    MalwareScanStatus,
    UploadStatus,
)
from app.domain.foundation import DomainEventType
from app.models.auth import User
from app.models.file_vault import (
    Collection,
    CollectionItem,
    FileFavorite,
    FileRecord,
    FileTag,
    FileVersion,
    Tag,
    UploadRecord,
)
from app.services.file_ingestion import FileIngestionService
from app.services.foundation import PageResult, UserDataService
from app.services.object_storage import (
    ObjectStorageError,
    ObjectStorageService,
    PresignedObjectRequest,
)

SAFE_FILE_CHARACTER_PATTERN = re.compile(r"[^A-Za-z0-9._ -]+")
SHA256_PATTERN = re.compile(r"^[a-fA-F0-9]{64}$")


@dataclass(frozen=True)
class UploadInitResult:
    created: bool
    presigned: PresignedObjectRequest
    upload: UploadRecord


@dataclass(frozen=True)
class FileView:
    collection_ids: list[UUID]
    file: FileRecord
    is_favorite: bool
    tags: list[Tag]


@dataclass(frozen=True)
class DownloadResult:
    file: FileRecord
    presigned: PresignedObjectRequest


def normalize_name(value: str) -> str:
    return " ".join(value.strip().split()).casefold()


def ensure_aware_utc(value: datetime) -> datetime:
    if value.tzinfo is not None:
        return value
    return value.replace(tzinfo=UTC)


def sanitize_file_name(original_name: str) -> str:
    name = original_name.strip()
    if not name or len(name) > MAX_ORIGINAL_FILE_NAME_LENGTH:
        raise AppError(422, "invalid_file_name", "File name is invalid.")
    if "\x00" in name or "/" in name or "\\" in name:
        raise AppError(422, "invalid_file_name", "File name must not contain path segments.")
    if name in {".", ".."}:
        raise AppError(422, "invalid_file_name", "File name is invalid.")

    sanitized = SAFE_FILE_CHARACTER_PATTERN.sub("_", name).strip(" .")
    if not sanitized:
        raise AppError(422, "invalid_file_name", "File name is invalid.")

    return sanitized[:MAX_ORIGINAL_FILE_NAME_LENGTH]


def file_extension_for_name(file_name: str) -> str:
    extension = PurePosixPath(file_name).suffix.casefold()
    if extension not in SUPPORTED_FILE_EXTENSIONS_BY_KIND:
        raise AppError(422, "unsupported_file_type", "That file type is not supported.")
    return extension


def normalize_content_type(content_type: str) -> str:
    return content_type.split(";", maxsplit=1)[0].strip().casefold()


def validate_upload_metadata(
    *,
    content_type: str,
    file_name: str,
    settings: Settings,
    size_bytes: int,
    checksum_sha256: str | None,
) -> tuple[str, str]:
    sanitized_name = sanitize_file_name(file_name)
    extension = file_extension_for_name(sanitized_name)
    normalized_content_type = normalize_content_type(content_type)
    if normalized_content_type not in SUPPORTED_CONTENT_TYPES_BY_EXTENSION[extension]:
        raise AppError(
            422,
            "unsupported_content_type",
            "File content type does not match the supported file extension.",
        )
    if size_bytes < 1 or size_bytes > settings.file_vault_max_upload_bytes:
        raise AppError(422, "file_too_large", "File size is outside the allowed range.")
    if checksum_sha256 is not None and SHA256_PATTERN.fullmatch(checksum_sha256) is None:
        raise AppError(422, "invalid_checksum", "Checksum must be a SHA-256 hex digest.")

    return sanitized_name, extension


class FileVaultService:
    def __init__(
        self,
        *,
        db: AsyncSession,
        settings: Settings,
        storage: ObjectStorageService,
    ):
        self.db = db
        self.settings = settings
        self.storage = storage

    async def initiate_upload(
        self,
        user: User,
        *,
        file_name: str,
        content_type: str,
        size_bytes: int,
        checksum_sha256: str | None,
        idempotency_key: str,
    ) -> UploadInitResult:
        existing = await self._get_upload_by_idempotency_key(user, idempotency_key)
        if existing is not None:
            if existing.status == UploadStatus.EXPIRED.value or ensure_aware_utc(
                existing.expires_at
            ) < datetime.now(UTC):
                existing.status = UploadStatus.EXPIRED.value
                await self.db.flush()
                raise AppError(409, "upload_expired", "Upload URL has expired; start a new upload.")
            presigned = await self._create_presigned_upload(existing)
            return UploadInitResult(created=False, presigned=presigned, upload=existing)

        sanitized_name, extension = validate_upload_metadata(
            checksum_sha256=checksum_sha256,
            content_type=content_type,
            file_name=file_name,
            settings=self.settings,
            size_bytes=size_bytes,
        )
        file_kind = SUPPORTED_FILE_EXTENSIONS_BY_KIND[extension]
        upload_id = uuid4()
        upload = UploadRecord(
            id=upload_id,
            owner_user_id=user.id,
            idempotency_key=idempotency_key,
            original_file_name=file_name.strip(),
            sanitized_file_name=sanitized_name,
            file_extension=extension,
            file_kind=file_kind.value,
            content_type=normalize_content_type(content_type),
            size_bytes=size_bytes,
            object_bucket=self.settings.object_storage_bucket,
            object_key=f"private/{upload_id.hex}/{sanitized_name}",
            checksum_sha256=checksum_sha256.casefold() if checksum_sha256 else None,
            status=UploadStatus.PENDING.value,
            malware_scan_status=MalwareScanStatus.NOT_CONFIGURED.value,
            expires_at=datetime.now(UTC)
            + timedelta(seconds=self.settings.file_vault_upload_url_expires_seconds),
        )
        self.db.add(upload)
        await self.db.flush()
        presigned = await self._create_presigned_upload(upload)
        return UploadInitResult(created=True, presigned=presigned, upload=upload)

    async def complete_upload(
        self,
        user: User,
        *,
        upload_id: UUID,
        idempotency_key: str,
        display_name: str | None,
    ) -> FileView:
        upload = await self._get_owned_upload(user, upload_id)
        if upload.status == UploadStatus.COMPLETED.value:
            if upload.completion_idempotency_key != idempotency_key:
                raise AppError(409, "upload_already_completed", "Upload is already completed.")
            if upload.file_id is None:
                raise AppError(409, "upload_incomplete", "Upload completion is inconsistent.")
            return await self.get_file(user, upload.file_id)

        if upload.status != UploadStatus.PENDING.value:
            raise AppError(409, "upload_not_pending", "Upload is not pending.")
        if ensure_aware_utc(upload.expires_at) < datetime.now(UTC):
            upload.status = UploadStatus.EXPIRED.value
            await self.db.flush()
            raise AppError(409, "upload_expired", "Upload URL has expired; start a new upload.")

        if self.settings.file_vault_verify_uploads:
            await self._verify_uploaded_object(upload)

        file = FileRecord(
            owner_user_id=user.id,
            display_name=self._validated_display_name(display_name or upload.original_file_name),
            original_file_name=upload.original_file_name,
            sanitized_file_name=upload.sanitized_file_name,
            file_extension=upload.file_extension,
            file_kind=upload.file_kind,
            content_type=upload.content_type,
            size_bytes=upload.size_bytes,
            object_bucket=upload.object_bucket,
            object_key=upload.object_key,
            checksum_sha256=upload.checksum_sha256,
            processing_status=FileProcessingStatus.NOT_STARTED.value,
            deletion_status=FileDeletionStatus.ACTIVE.value,
            malware_scan_status=upload.malware_scan_status,
        )
        self.db.add(file)
        await self.db.flush()

        self.db.add(
            FileVersion(
                owner_user_id=user.id,
                file_id=file.id,
                upload_record_id=upload.id,
                version_number=1,
                object_bucket=upload.object_bucket,
                object_key=upload.object_key,
                content_type=upload.content_type,
                size_bytes=upload.size_bytes,
                checksum_sha256=upload.checksum_sha256,
            )
        )
        now = datetime.now(UTC)
        upload.file_id = file.id
        upload.status = UploadStatus.COMPLETED.value
        upload.completion_idempotency_key = idempotency_key
        upload.completed_at = now
        upload.updated_at = now

        foundation = UserDataService(self.db)
        await foundation.create_domain_event(
            user,
            event_type=DomainEventType.FILE_UPLOADED,
            idempotency_key=f"file.uploaded:{upload.id}",
            payload={"fileId": str(file.id), "uploadId": str(upload.id)},
        )
        await foundation.record_audit_log(
            user,
            action="file.uploaded",
            entity_type="file",
            entity_id=file.id,
            metadata={
                "contentType": file.content_type,
                "fileKind": file.file_kind,
                "originalFileName": file.original_file_name,
                "sizeBytes": file.size_bytes,
            },
        )
        await FileIngestionService(
            db=self.db,
            settings=self.settings,
            storage=self.storage,
        ).queue_owned_file(
            user,
            file,
            idempotency_key=f"file.ingestion:{file.id}:initial",
        )
        await self.db.flush()
        return await self._build_file_view(file)

    async def list_files(
        self,
        user: User,
        *,
        pagination: PaginationParams,
        include_deleted: bool = False,
        favorite_only: bool = False,
        query: str | None = None,
        collection_id: UUID | None = None,
        tag_id: UUID | None = None,
    ) -> PageResult[FileView]:
        predicates = [FileRecord.owner_user_id == user.id]
        if not include_deleted:
            predicates.append(FileRecord.deleted_at.is_(None))
        if query:
            predicates.append(FileRecord.display_name.ilike(f"%{query.strip()}%"))
        if favorite_only:
            predicates.append(
                FileRecord.id.in_(
                    select(FileFavorite.file_id).where(FileFavorite.owner_user_id == user.id)
                )
            )
        if collection_id is not None:
            await self._get_owned_collection(user, collection_id)
            predicates.append(
                FileRecord.id.in_(
                    select(CollectionItem.file_id).where(
                        CollectionItem.owner_user_id == user.id,
                        CollectionItem.collection_id == collection_id,
                    )
                )
            )
        if tag_id is not None:
            await self._get_owned_tag(user, tag_id)
            predicates.append(
                FileRecord.id.in_(
                    select(FileTag.file_id).where(
                        FileTag.owner_user_id == user.id,
                        FileTag.tag_id == tag_id,
                    )
                )
            )

        total = await self._count(select(func.count(FileRecord.id)).where(*predicates))
        result = await self.db.execute(
            select(FileRecord)
            .where(*predicates)
            .order_by(FileRecord.created_at.desc(), FileRecord.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        files = list(result.scalars().all())
        views = [await self._build_file_view(file) for file in files]
        return PageResult(
            items=views,
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def get_file(
        self,
        user: User,
        file_id: UUID,
        *,
        include_deleted: bool = False,
    ) -> FileView:
        file = await self._get_owned_file(user, file_id, include_deleted=include_deleted)
        return await self._build_file_view(file)

    async def update_file(self, user: User, file_id: UUID, *, display_name: str) -> FileView:
        file = await self._get_owned_file(user, file_id)
        file.display_name = self._validated_display_name(display_name)
        file.updated_at = datetime.now(UTC)
        await UserDataService(self.db).record_audit_log(
            user,
            action="file.updated",
            entity_type="file",
            entity_id=file.id,
            metadata={"updatedFields": ["displayName"]},
        )
        await self.db.flush()
        return await self._build_file_view(file)

    async def soft_delete_file(self, user: User, file_id: UUID) -> FileView:
        file = await self._get_owned_file(user, file_id)
        now = datetime.now(UTC)
        file.deleted_at = now
        file.deletion_status = FileDeletionStatus.SOFT_DELETED.value
        file.updated_at = now
        await UserDataService(self.db).record_audit_log(
            user,
            action="file.deleted",
            entity_type="file",
            entity_id=file.id,
            metadata={"deletionStatus": file.deletion_status},
        )
        await self.db.flush()
        return await self._build_file_view(file)

    async def restore_file(self, user: User, file_id: UUID) -> FileView:
        file = await self._get_owned_file(user, file_id, include_deleted=True)
        now = datetime.now(UTC)
        file.deleted_at = None
        file.deletion_status = FileDeletionStatus.ACTIVE.value
        file.updated_at = now
        await UserDataService(self.db).record_audit_log(
            user,
            action="file.restored",
            entity_type="file",
            entity_id=file.id,
            metadata={},
        )
        await self.db.flush()
        return await self._build_file_view(file)

    async def permanently_delete_file(self, user: User, file_id: UUID) -> None:
        file = await self._get_owned_file(user, file_id, include_deleted=True)
        if file.deleted_at is None:
            raise AppError(
                409,
                "file_not_deleted",
                "Soft delete the file before permanent deletion.",
            )
        result = await self.db.execute(
            select(FileVersion).where(
                FileVersion.owner_user_id == user.id,
                FileVersion.file_id == file.id,
            )
        )
        versions = list(result.scalars().all())
        object_locations = {(version.object_bucket, version.object_key) for version in versions}
        object_locations.add((file.object_bucket, file.object_key))

        for bucket, key in object_locations:
            try:
                await self.storage.delete_object(bucket=bucket, key=key)
            except ObjectStorageError as exc:
                raise AppError(
                    502,
                    "object_storage_unavailable",
                    "Aetherium could not delete the stored object.",
                ) from exc

        await UserDataService(self.db).record_audit_log(
            user,
            action="file.permanently_deleted",
            entity_type="file",
            entity_id=file.id,
            metadata={"versionCount": len(versions)},
        )
        await FileIngestionService(
            db=self.db,
            settings=self.settings,
            storage=self.storage,
        ).delete_file_derivatives(user, file.id)
        await self.db.execute(
            delete(UploadRecord).where(
                UploadRecord.owner_user_id == user.id,
                UploadRecord.file_id == file.id,
            )
        )
        await self.db.delete(file)
        await self.db.flush()

    async def create_download_url(self, user: User, file_id: UUID) -> DownloadResult:
        file = await self._get_owned_file(user, file_id)
        try:
            presigned = await self.storage.create_presigned_download(
                bucket=file.object_bucket,
                key=file.object_key,
                download_name=file.sanitized_file_name,
                expires_in_seconds=self.settings.file_vault_download_url_expires_seconds,
            )
        except ObjectStorageError as exc:
            raise AppError(
                502,
                "object_storage_unavailable",
                "Aetherium could not create a download URL.",
            ) from exc

        await UserDataService(self.db).record_audit_log(
            user,
            action="file.download_requested",
            entity_type="file",
            entity_id=file.id,
            metadata={"contentType": file.content_type},
        )
        await self.db.flush()
        return DownloadResult(file=file, presigned=presigned)

    async def favorite_file(self, user: User, file_id: UUID) -> FileView:
        file = await self._get_owned_file(user, file_id)
        favorite = await self._get_file_favorite(user, file_id)
        if favorite is None:
            self.db.add(FileFavorite(owner_user_id=user.id, file_id=file_id))
            await self.db.flush()
        return await self._build_file_view(file)

    async def unfavorite_file(self, user: User, file_id: UUID) -> FileView:
        file = await self._get_owned_file(user, file_id)
        favorite = await self._get_file_favorite(user, file_id)
        if favorite is not None:
            await self.db.delete(favorite)
            await self.db.flush()
        return await self._build_file_view(file)

    async def list_collections(
        self,
        user: User,
        pagination: PaginationParams,
    ) -> PageResult[Collection]:
        total = await self._count(
            select(func.count(Collection.id)).where(Collection.owner_user_id == user.id)
        )
        result = await self.db.execute(
            select(Collection)
            .where(Collection.owner_user_id == user.id)
            .order_by(Collection.name.asc(), Collection.id.asc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def create_collection(
        self,
        user: User,
        *,
        name: str,
        description: str | None,
    ) -> Collection:
        normalized_name = normalize_name(name)
        if not normalized_name:
            raise AppError(422, "invalid_collection_name", "Collection name is required.")
        collection = Collection(
            owner_user_id=user.id,
            name=name.strip(),
            normalized_name=normalized_name,
            description=description.strip() if description else None,
        )
        self.db.add(collection)
        try:
            await self.db.flush()
        except IntegrityError as exc:
            raise AppError(409, "collection_exists", "Collection already exists.") from exc
        return collection

    async def add_file_to_collection(
        self,
        user: User,
        *,
        collection_id: UUID,
        file_id: UUID,
    ) -> FileView:
        await self._get_owned_collection(user, collection_id)
        file = await self._get_owned_file(user, file_id)
        existing = await self._get_collection_item(user, collection_id, file_id)
        if existing is None:
            self.db.add(
                CollectionItem(
                    owner_user_id=user.id,
                    collection_id=collection_id,
                    file_id=file_id,
                )
            )
            await self.db.flush()
        return await self._build_file_view(file)

    async def remove_file_from_collection(
        self,
        user: User,
        *,
        collection_id: UUID,
        file_id: UUID,
    ) -> FileView:
        await self._get_owned_collection(user, collection_id)
        file = await self._get_owned_file(user, file_id, include_deleted=True)
        item = await self._get_collection_item(user, collection_id, file_id)
        if item is not None:
            await self.db.delete(item)
            await self.db.flush()
        return await self._build_file_view(file)

    async def list_tags(self, user: User, pagination: PaginationParams) -> PageResult[Tag]:
        total = await self._count(select(func.count(Tag.id)).where(Tag.owner_user_id == user.id))
        result = await self.db.execute(
            select(Tag)
            .where(Tag.owner_user_id == user.id)
            .order_by(Tag.name.asc(), Tag.id.asc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def add_tag_to_file(
        self,
        user: User,
        *,
        file_id: UUID,
        name: str,
        color: str | None,
    ) -> FileView:
        file = await self._get_owned_file(user, file_id)
        tag = await self._get_or_create_tag(user, name=name, color=color)
        existing = await self._get_file_tag(user, file_id, tag.id)
        if existing is None:
            self.db.add(FileTag(owner_user_id=user.id, file_id=file_id, tag_id=tag.id))
            await self.db.flush()
        return await self._build_file_view(file)

    async def remove_tag_from_file(self, user: User, *, file_id: UUID, tag_id: UUID) -> FileView:
        file = await self._get_owned_file(user, file_id, include_deleted=True)
        await self._get_owned_tag(user, tag_id)
        file_tag = await self._get_file_tag(user, file_id, tag_id)
        if file_tag is not None:
            await self.db.delete(file_tag)
            await self.db.flush()
        return await self._build_file_view(file)

    async def _create_presigned_upload(self, upload: UploadRecord) -> PresignedObjectRequest:
        try:
            return await self.storage.create_presigned_upload(
                bucket=upload.object_bucket,
                key=upload.object_key,
                content_type=upload.content_type,
                expires_in_seconds=self.settings.file_vault_upload_url_expires_seconds,
            )
        except ObjectStorageError as exc:
            raise AppError(
                502,
                "object_storage_unavailable",
                "Aetherium could not create an upload URL.",
            ) from exc

    async def _verify_uploaded_object(self, upload: UploadRecord) -> None:
        try:
            stat = await self.storage.head_object(
                bucket=upload.object_bucket,
                key=upload.object_key,
            )
        except ObjectStorageError as exc:
            raise AppError(
                409,
                "upload_not_found",
                "Uploaded object was not found in Aetherium storage.",
            ) from exc

        if stat.size_bytes != upload.size_bytes:
            raise AppError(409, "upload_size_mismatch", "Uploaded object size does not match.")

    async def _get_upload_by_idempotency_key(
        self,
        user: User,
        idempotency_key: str,
    ) -> UploadRecord | None:
        result = await self.db.execute(
            select(UploadRecord).where(
                UploadRecord.owner_user_id == user.id,
                UploadRecord.idempotency_key == idempotency_key,
            )
        )
        return result.scalar_one_or_none()

    async def _get_owned_upload(self, user: User, upload_id: UUID) -> UploadRecord:
        result = await self.db.execute(
            select(UploadRecord).where(
                UploadRecord.id == upload_id,
                UploadRecord.owner_user_id == user.id,
            )
        )
        upload = result.scalar_one_or_none()
        if upload is None:
            raise AppError(404, "not_found", "Upload was not found.")
        return upload

    async def _get_owned_file(
        self,
        user: User,
        file_id: UUID,
        *,
        include_deleted: bool = False,
    ) -> FileRecord:
        predicates = [FileRecord.id == file_id, FileRecord.owner_user_id == user.id]
        if not include_deleted:
            predicates.append(FileRecord.deleted_at.is_(None))

        result = await self.db.execute(select(FileRecord).where(*predicates))
        file = result.scalar_one_or_none()
        if file is None:
            raise AppError(404, "not_found", "File was not found.")
        return file

    async def _build_file_view(self, file: FileRecord) -> FileView:
        tag_result = await self.db.execute(
            select(Tag)
            .join(FileTag, FileTag.tag_id == Tag.id)
            .where(
                FileTag.owner_user_id == file.owner_user_id,
                FileTag.file_id == file.id,
            )
            .order_by(Tag.name.asc(), Tag.id.asc())
        )
        collection_result = await self.db.execute(
            select(CollectionItem.collection_id)
            .where(
                CollectionItem.owner_user_id == file.owner_user_id,
                CollectionItem.file_id == file.id,
            )
            .order_by(CollectionItem.created_at.asc(), CollectionItem.id.asc())
        )
        favorite = await self._get_file_favorite_for_owner(file.owner_user_id, file.id)
        return FileView(
            collection_ids=list(collection_result.scalars().all()),
            file=file,
            is_favorite=favorite is not None,
            tags=list(tag_result.scalars().all()),
        )

    async def _get_file_favorite(self, user: User, file_id: UUID) -> FileFavorite | None:
        return await self._get_file_favorite_for_owner(user.id, file_id)

    async def _get_file_favorite_for_owner(
        self,
        owner_user_id: UUID,
        file_id: UUID,
    ) -> FileFavorite | None:
        result = await self.db.execute(
            select(FileFavorite).where(
                FileFavorite.owner_user_id == owner_user_id,
                FileFavorite.file_id == file_id,
            )
        )
        return result.scalar_one_or_none()

    async def _get_owned_collection(self, user: User, collection_id: UUID) -> Collection:
        result = await self.db.execute(
            select(Collection).where(
                Collection.id == collection_id,
                Collection.owner_user_id == user.id,
            )
        )
        collection = result.scalar_one_or_none()
        if collection is None:
            raise AppError(404, "not_found", "Collection was not found.")
        return collection

    async def _get_collection_item(
        self,
        user: User,
        collection_id: UUID,
        file_id: UUID,
    ) -> CollectionItem | None:
        result = await self.db.execute(
            select(CollectionItem).where(
                CollectionItem.owner_user_id == user.id,
                CollectionItem.collection_id == collection_id,
                CollectionItem.file_id == file_id,
            )
        )
        return result.scalar_one_or_none()

    async def _get_owned_tag(self, user: User, tag_id: UUID) -> Tag:
        result = await self.db.execute(
            select(Tag).where(Tag.id == tag_id, Tag.owner_user_id == user.id)
        )
        tag = result.scalar_one_or_none()
        if tag is None:
            raise AppError(404, "not_found", "Tag was not found.")
        return tag

    async def _get_or_create_tag(self, user: User, *, name: str, color: str | None) -> Tag:
        normalized_name = normalize_name(name)
        if not normalized_name:
            raise AppError(422, "invalid_tag_name", "Tag name is required.")

        result = await self.db.execute(
            select(Tag).where(
                Tag.owner_user_id == user.id,
                Tag.normalized_name == normalized_name,
            )
        )
        tag = result.scalar_one_or_none()
        if tag is not None:
            if color is not None:
                tag.color = color
                tag.updated_at = datetime.now(UTC)
            return tag

        tag = Tag(
            owner_user_id=user.id,
            name=name.strip(),
            normalized_name=normalized_name,
            color=color,
        )
        self.db.add(tag)
        await self.db.flush()
        return tag

    async def _get_file_tag(self, user: User, file_id: UUID, tag_id: UUID) -> FileTag | None:
        result = await self.db.execute(
            select(FileTag).where(
                FileTag.owner_user_id == user.id,
                FileTag.file_id == file_id,
                FileTag.tag_id == tag_id,
            )
        )
        return result.scalar_one_or_none()

    def _validated_display_name(self, display_name: str) -> str:
        value = " ".join(display_name.strip().split())
        if not value or len(value) > MAX_DISPLAY_NAME_LENGTH:
            raise AppError(422, "invalid_display_name", "Display name is invalid.")
        return value

    async def _count(self, query: Select[tuple[int]]) -> int:
        value = await self.db.scalar(query)
        return int(value or 0)
