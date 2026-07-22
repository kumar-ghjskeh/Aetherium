from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.pagination import PaginationParams
from app.domain.file_vault import FileDeletionStatus, FileKind
from app.domain.foundation import NotificationSeverity, NotificationType
from app.domain.profile import (
    ALLOWED_AVATAR_PRESETS,
    DATA_EXPORT_CATEGORIES,
    AccountDeletionRequestStatus,
    AvatarKind,
    DataRequestStatus,
    FavoriteResourceType,
    ProfileVisibility,
)
from app.models.auth import User
from app.models.file_vault import FileRecord
from app.models.foundation import UserPreferences
from app.models.learning import LearningResource
from app.models.profile import (
    AccountDeletionRequest,
    Certificate,
    DataExportRequest,
    PrivacySettings,
    ProfileFavoriteProject,
    ProfileFavoriteResource,
    ProfileLink,
    UserProfile,
)
from app.models.projects import Project
from app.schemas.profile import CertificateCreate, FavoriteResourceCreate, ProfileLinkCreate
from app.services.foundation import PageResult, UserDataService


@dataclass(frozen=True)
class PrivacyView:
    privacy: PrivacySettings
    preferences: UserPreferences


class ProfileService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.foundation = UserDataService(db)

    async def get_or_create_profile(self, user: User) -> UserProfile:
        result = await self.db.execute(
            select(UserProfile).where(UserProfile.owner_user_id == user.id)
        )
        profile = result.scalar_one_or_none()
        if profile is not None:
            return profile

        profile = UserProfile(
            owner_user_id=user.id,
            avatar_kind=AvatarKind.PRESET.value,
            avatar_preset="lumen",
        )
        self.db.add(profile)
        await self.db.flush()
        return profile

    async def update_profile(self, user: User, updates: dict[str, object]) -> UserProfile:
        profile = await self.get_or_create_profile(user)
        updated_fields: list[str] = []

        if "display_name" in updates:
            display_name = str(updates["display_name"]).strip()
            if not display_name:
                raise AppError(422, "invalid_display_name", "Display name is required.")
            user.display_name = display_name
            user.updated_at = datetime.now(UTC)
            updated_fields.append("displayName")

        for field_name in ("headline", "bio", "location", "website_url"):
            if field_name in updates:
                setattr(profile, field_name, updates[field_name])
                updated_fields.append(_public_field_name(field_name))

        if "avatar_preset" in updates:
            avatar_preset = updates["avatar_preset"]
            if avatar_preset is None:
                avatar_preset = "lumen"
            if str(avatar_preset) not in ALLOWED_AVATAR_PRESETS:
                raise AppError(422, "unknown_avatar_preset", "Unknown avatar preset.")
            profile.avatar_kind = AvatarKind.PRESET.value
            profile.avatar_preset = str(avatar_preset)
            profile.avatar_file_id = None
            updated_fields.append("avatarPreset")

        if "avatar_file_id" in updates:
            avatar_file_id = updates["avatar_file_id"]
            if avatar_file_id is None:
                profile.avatar_kind = AvatarKind.PRESET.value
                profile.avatar_preset = "lumen"
                profile.avatar_file_id = None
            else:
                await self._get_owned_file(user, UUID(str(avatar_file_id)), require_image=True)
                profile.avatar_kind = AvatarKind.VAULT_FILE.value
                profile.avatar_preset = None
                profile.avatar_file_id = UUID(str(avatar_file_id))
            updated_fields.append("avatarFileId")

        profile.updated_at = datetime.now(UTC)
        await self.foundation.record_audit_log(
            user,
            action="profile.updated",
            entity_type="user_profile",
            entity_id=profile.id,
            metadata={"updatedFields": sorted(set(updated_fields))},
        )
        await self.db.flush()
        return profile

    async def list_links(
        self,
        user: User,
        pagination: PaginationParams,
    ) -> PageResult[ProfileLink]:
        total = await self._count(
            select(func.count(ProfileLink.id)).where(ProfileLink.owner_user_id == user.id)
        )
        result = await self.db.execute(
            select(ProfileLink)
            .where(ProfileLink.owner_user_id == user.id)
            .order_by(ProfileLink.link_type.asc(), ProfileLink.created_at.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def create_link(self, user: User, payload: ProfileLinkCreate) -> ProfileLink:
        link_type = payload.link_type
        link = ProfileLink(
            owner_user_id=user.id,
            link_type=link_type.value,
            title=payload.title,
            url=payload.url,
        )
        self.db.add(link)
        try:
            await self.db.flush()
        except IntegrityError as exc:
            raise AppError(409, "profile_link_exists", "Profile link already exists.") from exc
        await self.foundation.record_audit_log(
            user,
            action="profile.link_created",
            entity_type="profile_link",
            entity_id=link.id,
            metadata={"linkType": link.link_type},
        )
        await self.db.flush()
        return link

    async def delete_link(self, user: User, link_id: UUID) -> None:
        result = await self.db.execute(
            select(ProfileLink).where(
                ProfileLink.id == link_id,
                ProfileLink.owner_user_id == user.id,
            )
        )
        link = result.scalar_one_or_none()
        if link is None:
            raise AppError(404, "not_found", "Profile link was not found.")
        await self.foundation.record_audit_log(
            user,
            action="profile.link_deleted",
            entity_type="profile_link",
            entity_id=link.id,
            metadata={"linkType": link.link_type},
        )
        await self.db.delete(link)
        await self.db.flush()

    async def list_favorite_projects(
        self,
        user: User,
        pagination: PaginationParams,
    ) -> PageResult[ProfileFavoriteProject]:
        total = await self._count(
            select(func.count(ProfileFavoriteProject.id)).where(
                ProfileFavoriteProject.owner_user_id == user.id
            )
        )
        result = await self.db.execute(
            select(ProfileFavoriteProject)
            .where(ProfileFavoriteProject.owner_user_id == user.id)
            .order_by(ProfileFavoriteProject.created_at.desc(), ProfileFavoriteProject.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def favorite_project(self, user: User, project_id: UUID) -> ProfileFavoriteProject:
        await self._get_owned_project(user, project_id)
        result = await self.db.execute(
            select(ProfileFavoriteProject).where(
                ProfileFavoriteProject.owner_user_id == user.id,
                ProfileFavoriteProject.project_id == project_id,
            )
        )
        existing = result.scalar_one_or_none()
        if existing is not None:
            return existing

        favorite = ProfileFavoriteProject(owner_user_id=user.id, project_id=project_id)
        self.db.add(favorite)
        await self.foundation.record_audit_log(
            user,
            action="profile.favorite_project_added",
            entity_type="project",
            entity_id=project_id,
            metadata={},
        )
        await self.db.flush()
        return favorite

    async def remove_favorite_project(self, user: User, project_id: UUID) -> None:
        result = await self.db.execute(
            select(ProfileFavoriteProject).where(
                ProfileFavoriteProject.owner_user_id == user.id,
                ProfileFavoriteProject.project_id == project_id,
            )
        )
        favorite = result.scalar_one_or_none()
        if favorite is None:
            raise AppError(404, "not_found", "Favorite project was not found.")
        await self.foundation.record_audit_log(
            user,
            action="profile.favorite_project_removed",
            entity_type="project",
            entity_id=project_id,
            metadata={},
        )
        await self.db.delete(favorite)
        await self.db.flush()

    async def list_favorite_resources(
        self,
        user: User,
        pagination: PaginationParams,
    ) -> PageResult[ProfileFavoriteResource]:
        total = await self._count(
            select(func.count(ProfileFavoriteResource.id)).where(
                ProfileFavoriteResource.owner_user_id == user.id
            )
        )
        result = await self.db.execute(
            select(ProfileFavoriteResource)
            .where(ProfileFavoriteResource.owner_user_id == user.id)
            .order_by(ProfileFavoriteResource.created_at.desc(), ProfileFavoriteResource.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def favorite_resource(
        self, user: User, payload: FavoriteResourceCreate
    ) -> ProfileFavoriteResource:
        resource_type = payload.resource_type
        file_id = payload.file_id
        learning_resource_id = payload.learning_resource_id
        title = payload.title
        url = payload.url

        if resource_type == FavoriteResourceType.FILE:
            if file_id is None:
                raise AppError(422, "invalid_favorite_resource", "File is required.")
            file = await self._get_owned_file(user, file_id)
            title = title or file.display_name
        elif resource_type == FavoriteResourceType.LEARNING_RESOURCE:
            resource = await self._get_owned_learning_resource(user, learning_resource_id)
            title = title or resource.title
            url = url or resource.url
        elif not title:
            raise AppError(422, "invalid_favorite_resource", "Favorite resource title is required.")

        if title is None:
            raise AppError(422, "invalid_favorite_resource", "Favorite resource title is required.")

        favorite = ProfileFavoriteResource(
            owner_user_id=user.id,
            resource_type=resource_type.value,
            file_id=file_id,
            learning_resource_id=learning_resource_id,
            title=str(title),
            url=url,
            notes=payload.notes,
        )
        self.db.add(favorite)
        await self.db.flush()
        await self.foundation.record_audit_log(
            user,
            action="profile.favorite_resource_added",
            entity_type="profile_favorite_resource",
            entity_id=favorite.id,
            metadata={"resourceType": resource_type.value},
        )
        await self.db.flush()
        return favorite

    async def remove_favorite_resource(self, user: User, favorite_id: UUID) -> None:
        result = await self.db.execute(
            select(ProfileFavoriteResource).where(
                ProfileFavoriteResource.id == favorite_id,
                ProfileFavoriteResource.owner_user_id == user.id,
            )
        )
        favorite = result.scalar_one_or_none()
        if favorite is None:
            raise AppError(404, "not_found", "Favorite resource was not found.")
        await self.foundation.record_audit_log(
            user,
            action="profile.favorite_resource_removed",
            entity_type="profile_favorite_resource",
            entity_id=favorite.id,
            metadata={"resourceType": favorite.resource_type},
        )
        await self.db.delete(favorite)
        await self.db.flush()

    async def list_certificates(
        self,
        user: User,
        pagination: PaginationParams,
    ) -> PageResult[Certificate]:
        total = await self._count(
            select(func.count(Certificate.id)).where(Certificate.owner_user_id == user.id)
        )
        result = await self.db.execute(
            select(Certificate)
            .where(Certificate.owner_user_id == user.id)
            .order_by(Certificate.issued_on.desc().nullslast(), Certificate.created_at.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def create_certificate(self, user: User, payload: CertificateCreate) -> Certificate:
        file_id = payload.file_id
        if file_id is not None:
            await self._get_owned_file(user, file_id)
        certificate = Certificate(
            owner_user_id=user.id,
            title=payload.title,
            issuer=payload.issuer,
            issued_on=payload.issued_on,
            expires_on=payload.expires_on,
            credential_url=payload.credential_url,
            file_id=file_id,
            notes=payload.notes,
        )
        self.db.add(certificate)
        await self.db.flush()
        await self.foundation.record_audit_log(
            user,
            action="profile.certificate_created",
            entity_type="certificate",
            entity_id=certificate.id,
            metadata={"title": certificate.title},
        )
        await self.db.flush()
        return certificate

    async def delete_certificate(self, user: User, certificate_id: UUID) -> None:
        result = await self.db.execute(
            select(Certificate).where(
                Certificate.id == certificate_id,
                Certificate.owner_user_id == user.id,
            )
        )
        certificate = result.scalar_one_or_none()
        if certificate is None:
            raise AppError(404, "not_found", "Certificate was not found.")
        await self.foundation.record_audit_log(
            user,
            action="profile.certificate_deleted",
            entity_type="certificate",
            entity_id=certificate.id,
            metadata={"title": certificate.title},
        )
        await self.db.delete(certificate)
        await self.db.flush()

    async def get_or_create_privacy_settings(self, user: User) -> PrivacyView:
        result = await self.db.execute(
            select(PrivacySettings).where(PrivacySettings.owner_user_id == user.id)
        )
        privacy = result.scalar_one_or_none()
        if privacy is None:
            privacy = PrivacySettings(
                owner_user_id=user.id,
                profile_visibility=ProfileVisibility.PRIVATE.value,
                show_email_on_profile=False,
                allow_profile_in_ai_context=False,
                allow_profile_search_indexing=False,
                include_profile_in_exports=True,
            )
            self.db.add(privacy)
            await self.db.flush()

        preferences = await self.foundation.get_or_create_preferences(user)
        return PrivacyView(privacy=privacy, preferences=preferences)

    async def update_privacy_settings(self, user: User, updates: dict[str, object]) -> PrivacyView:
        view = await self.get_or_create_privacy_settings(user)
        privacy_updates = {
            key: value
            for key, value in updates.items()
            if key
            in {
                "profile_visibility",
                "show_email_on_profile",
                "allow_profile_in_ai_context",
                "allow_profile_search_indexing",
                "include_profile_in_exports",
            }
        }
        preference_updates = {
            key: value
            for key, value in updates.items()
            if key in {"ai_memory_enabled", "product_analytics_enabled"}
        }

        for field_name, value in privacy_updates.items():
            setattr(view.privacy, field_name, _enum_value(value))

        if preference_updates:
            await self.foundation.update_preferences(user, preference_updates)

        view.privacy.updated_at = datetime.now(UTC)
        await self.foundation.record_audit_log(
            user,
            action="privacy.updated",
            entity_type="privacy_settings",
            entity_id=view.privacy.id,
            metadata={"updatedFields": sorted(_public_field_name(key) for key in updates)},
        )
        await self.db.flush()
        return PrivacyView(privacy=view.privacy, preferences=view.preferences)

    async def list_export_requests(
        self,
        user: User,
        pagination: PaginationParams,
    ) -> PageResult[DataExportRequest]:
        total = await self._count(
            select(func.count(DataExportRequest.id)).where(
                DataExportRequest.owner_user_id == user.id
            )
        )
        result = await self.db.execute(
            select(DataExportRequest)
            .where(DataExportRequest.owner_user_id == user.id)
            .order_by(DataExportRequest.created_at.desc(), DataExportRequest.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def create_export_request(
        self,
        user: User,
        *,
        idempotency_key: str,
        included_categories: list[str],
        note: str | None,
    ) -> DataExportRequest:
        existing = await self._get_export_request_by_key(user, idempotency_key)
        if existing is not None:
            return existing

        categories = included_categories or list(DATA_EXPORT_CATEGORIES)
        request = DataExportRequest(
            owner_user_id=user.id,
            idempotency_key=idempotency_key,
            status=DataRequestStatus.REQUESTED.value,
            requested_at=datetime.now(UTC),
            included_categories=categories,
            note=note,
        )
        self.db.add(request)
        await self.db.flush()
        await self.foundation.record_audit_log(
            user,
            action="privacy.data_export_requested",
            entity_type="data_export_request",
            entity_id=request.id,
            metadata={"includedCategories": categories},
        )
        await self.foundation.create_notification(
            user,
            title="Data export requested",
            body="Your export request has been recorded. Export generation is not active yet.",
            notification_type=NotificationType.SYSTEM,
            severity=NotificationSeverity.INFO,
            action_url="/app/settings",
        )
        await self.db.flush()
        return request

    async def list_deletion_requests(
        self,
        user: User,
        pagination: PaginationParams,
    ) -> PageResult[AccountDeletionRequest]:
        total = await self._count(
            select(func.count(AccountDeletionRequest.id)).where(
                AccountDeletionRequest.owner_user_id == user.id
            )
        )
        result = await self.db.execute(
            select(AccountDeletionRequest)
            .where(AccountDeletionRequest.owner_user_id == user.id)
            .order_by(AccountDeletionRequest.created_at.desc(), AccountDeletionRequest.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def create_deletion_request(
        self,
        user: User,
        *,
        idempotency_key: str,
        reason: str | None,
    ) -> AccountDeletionRequest:
        existing = await self._get_deletion_request_by_key(user, idempotency_key)
        if existing is not None:
            return existing

        request = AccountDeletionRequest(
            owner_user_id=user.id,
            idempotency_key=idempotency_key,
            status=AccountDeletionRequestStatus.REQUESTED.value,
            requested_at=datetime.now(UTC),
            reason=reason,
            metadata_json={"execution": "manual_future_workflow"},
        )
        self.db.add(request)
        await self.db.flush()
        await self.foundation.record_audit_log(
            user,
            action="privacy.account_deletion_requested",
            entity_type="account_deletion_request",
            entity_id=request.id,
            metadata={"status": request.status},
        )
        await self.foundation.create_notification(
            user,
            title="Account deletion request recorded",
            body=(
                "No data has been deleted. "
                "This request creates the future deletion workflow record."
            ),
            notification_type=NotificationType.SECURITY,
            severity=NotificationSeverity.WARNING,
            action_url="/app/settings",
        )
        await self.db.flush()
        return request

    async def _get_owned_file(
        self,
        user: User,
        file_id: UUID,
        *,
        require_image: bool = False,
    ) -> FileRecord:
        result = await self.db.execute(
            select(FileRecord).where(
                FileRecord.id == file_id,
                FileRecord.owner_user_id == user.id,
                FileRecord.deletion_status == FileDeletionStatus.ACTIVE.value,
            )
        )
        file = result.scalar_one_or_none()
        if file is None:
            raise AppError(404, "not_found", "File was not found.")
        if require_image and file.file_kind != FileKind.IMAGE.value:
            raise AppError(422, "avatar_file_must_be_image", "Avatar file must be an image.")
        return file

    async def _get_owned_project(self, user: User, project_id: UUID) -> Project:
        result = await self.db.execute(
            select(Project).where(Project.id == project_id, Project.owner_user_id == user.id)
        )
        project = result.scalar_one_or_none()
        if project is None:
            raise AppError(404, "not_found", "Project was not found.")
        return project

    async def _get_owned_learning_resource(
        self,
        user: User,
        resource_id: UUID | None,
    ) -> LearningResource:
        if resource_id is None:
            raise AppError(422, "invalid_favorite_resource", "Learning resource is required.")
        result = await self.db.execute(
            select(LearningResource).where(
                LearningResource.id == resource_id,
                LearningResource.owner_user_id == user.id,
            )
        )
        resource = result.scalar_one_or_none()
        if resource is None:
            raise AppError(404, "not_found", "Learning resource was not found.")
        return resource

    async def _get_export_request_by_key(
        self,
        user: User,
        idempotency_key: str,
    ) -> DataExportRequest | None:
        result = await self.db.execute(
            select(DataExportRequest).where(
                DataExportRequest.owner_user_id == user.id,
                DataExportRequest.idempotency_key == idempotency_key,
            )
        )
        return result.scalar_one_or_none()

    async def _get_deletion_request_by_key(
        self,
        user: User,
        idempotency_key: str,
    ) -> AccountDeletionRequest | None:
        result = await self.db.execute(
            select(AccountDeletionRequest).where(
                AccountDeletionRequest.owner_user_id == user.id,
                AccountDeletionRequest.idempotency_key == idempotency_key,
            )
        )
        return result.scalar_one_or_none()

    async def _count(self, query: Select[tuple[int]]) -> int:
        value = await self.db.scalar(query)
        return int(value or 0)


def _enum_value(value: object) -> object:
    enum_value = getattr(value, "value", None)
    return enum_value if isinstance(enum_value, str) else value


def _public_field_name(field_name: str) -> str:
    parts = field_name.split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])
