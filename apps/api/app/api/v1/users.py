from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, status
from fastapi.responses import Response

from app.core.pagination import PaginationParams
from app.dependencies.auth import get_current_user, verify_allowed_origin
from app.dependencies.pagination import get_pagination
from app.dependencies.profile import get_profile_service
from app.models.auth import User
from app.models.profile import UserProfile
from app.schemas.common import ApiErrorResponse
from app.schemas.profile import (
    AccountDeletionRequestCreate,
    AccountDeletionRequestPage,
    AccountDeletionRequestResponse,
    CertificateCreate,
    CertificatePage,
    CertificateResponse,
    DataExportRequestCreate,
    DataExportRequestPage,
    DataExportRequestResponse,
    FavoriteProjectCreate,
    FavoriteProjectPage,
    FavoriteProjectResponse,
    FavoriteResourceCreate,
    FavoriteResourcePage,
    FavoriteResourceResponse,
    PrivacySettingsResponse,
    PrivacySettingsUpdate,
    ProfileLinkCreate,
    ProfileLinkPage,
    ProfileLinkResponse,
    UserProfileResponse,
    UserProfileUpdate,
)
from app.services.profile import PrivacyView, ProfileService

router = APIRouter()

ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    401: {"model": ApiErrorResponse},
    403: {"model": ApiErrorResponse},
    404: {"model": ApiErrorResponse},
    409: {"model": ApiErrorResponse},
    422: {"model": ApiErrorResponse},
}


@router.get("/profile", response_model=UserProfileResponse, responses=ERROR_RESPONSES)
async def get_profile(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
) -> UserProfileResponse:
    profile = await service.get_or_create_profile(current_user)
    await service.db.commit()
    return _profile_response(current_user, profile)


@router.patch(
    "/profile",
    response_model=UserProfileResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def update_profile(
    payload: UserProfileUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
) -> UserProfileResponse:
    try:
        profile = await service.update_profile(
            current_user,
            payload.model_dump(exclude_unset=True),
        )
        await service.db.commit()
        return _profile_response(current_user, profile)
    except Exception:
        await service.db.rollback()
        raise


@router.get("/profile/links", response_model=ProfileLinkPage, responses=ERROR_RESPONSES)
async def list_links(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
) -> ProfileLinkPage:
    page = await service.list_links(current_user, pagination)
    await service.db.commit()
    return ProfileLinkPage(
        items=[ProfileLinkResponse.model_validate(link) for link in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/profile/links",
    response_model=ProfileLinkResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_link(
    payload: ProfileLinkCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
) -> ProfileLinkResponse:
    try:
        link = await service.create_link(current_user, payload)
        await service.db.commit()
        return ProfileLinkResponse.model_validate(link)
    except Exception:
        await service.db.rollback()
        raise


@router.delete(
    "/profile/links/{link_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def delete_link(
    link_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
) -> Response:
    try:
        await service.delete_link(current_user, link_id)
        await service.db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception:
        await service.db.rollback()
        raise


@router.get(
    "/profile/favorite-projects",
    response_model=FavoriteProjectPage,
    responses=ERROR_RESPONSES,
)
async def list_favorite_projects(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
) -> FavoriteProjectPage:
    page = await service.list_favorite_projects(current_user, pagination)
    await service.db.commit()
    return FavoriteProjectPage(
        items=[FavoriteProjectResponse.model_validate(favorite) for favorite in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/profile/favorite-projects",
    response_model=FavoriteProjectResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def favorite_project(
    payload: FavoriteProjectCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
) -> FavoriteProjectResponse:
    try:
        favorite = await service.favorite_project(current_user, payload.project_id)
        await service.db.commit()
        return FavoriteProjectResponse.model_validate(favorite)
    except Exception:
        await service.db.rollback()
        raise


@router.delete(
    "/profile/favorite-projects/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def remove_favorite_project(
    project_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
) -> Response:
    try:
        await service.remove_favorite_project(current_user, project_id)
        await service.db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception:
        await service.db.rollback()
        raise


@router.get(
    "/profile/favorite-resources",
    response_model=FavoriteResourcePage,
    responses=ERROR_RESPONSES,
)
async def list_favorite_resources(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
) -> FavoriteResourcePage:
    page = await service.list_favorite_resources(current_user, pagination)
    await service.db.commit()
    return FavoriteResourcePage(
        items=[FavoriteResourceResponse.model_validate(favorite) for favorite in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/profile/favorite-resources",
    response_model=FavoriteResourceResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def favorite_resource(
    payload: FavoriteResourceCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
) -> FavoriteResourceResponse:
    try:
        favorite = await service.favorite_resource(current_user, payload)
        await service.db.commit()
        return FavoriteResourceResponse.model_validate(favorite)
    except Exception:
        await service.db.rollback()
        raise


@router.delete(
    "/profile/favorite-resources/{favorite_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def remove_favorite_resource(
    favorite_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
) -> Response:
    try:
        await service.remove_favorite_resource(current_user, favorite_id)
        await service.db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception:
        await service.db.rollback()
        raise


@router.get("/profile/certificates", response_model=CertificatePage, responses=ERROR_RESPONSES)
async def list_certificates(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
) -> CertificatePage:
    page = await service.list_certificates(current_user, pagination)
    await service.db.commit()
    return CertificatePage(
        items=[CertificateResponse.model_validate(certificate) for certificate in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/profile/certificates",
    response_model=CertificateResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_certificate(
    payload: CertificateCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
) -> CertificateResponse:
    try:
        certificate = await service.create_certificate(current_user, payload)
        await service.db.commit()
        return CertificateResponse.model_validate(certificate)
    except Exception:
        await service.db.rollback()
        raise


@router.delete(
    "/profile/certificates/{certificate_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def delete_certificate(
    certificate_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
) -> Response:
    try:
        await service.delete_certificate(current_user, certificate_id)
        await service.db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception:
        await service.db.rollback()
        raise


@router.get("/privacy", response_model=PrivacySettingsResponse, responses=ERROR_RESPONSES)
async def get_privacy_settings(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
) -> PrivacySettingsResponse:
    view = await service.get_or_create_privacy_settings(current_user)
    await service.db.commit()
    return _privacy_response(view)


@router.patch(
    "/privacy",
    response_model=PrivacySettingsResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def update_privacy_settings(
    payload: PrivacySettingsUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
) -> PrivacySettingsResponse:
    try:
        view = await service.update_privacy_settings(
            current_user,
            payload.model_dump(exclude_unset=True),
        )
        await service.db.commit()
        return _privacy_response(view)
    except Exception:
        await service.db.rollback()
        raise


@router.get(
    "/data-export-requests",
    response_model=DataExportRequestPage,
    responses=ERROR_RESPONSES,
)
async def list_data_export_requests(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
) -> DataExportRequestPage:
    page = await service.list_export_requests(current_user, pagination)
    await service.db.commit()
    return DataExportRequestPage(
        items=[DataExportRequestResponse.model_validate(request) for request in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/data-export-requests",
    response_model=DataExportRequestResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_data_export_request(
    payload: DataExportRequestCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
) -> DataExportRequestResponse:
    try:
        request = await service.create_export_request(
            current_user,
            idempotency_key=payload.idempotency_key,
            included_categories=payload.included_categories,
            note=payload.note,
        )
        await service.db.commit()
        return DataExportRequestResponse.model_validate(request)
    except Exception:
        await service.db.rollback()
        raise


@router.get(
    "/account-deletion-requests",
    response_model=AccountDeletionRequestPage,
    responses=ERROR_RESPONSES,
)
async def list_account_deletion_requests(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
) -> AccountDeletionRequestPage:
    page = await service.list_deletion_requests(current_user, pagination)
    await service.db.commit()
    return AccountDeletionRequestPage(
        items=[AccountDeletionRequestResponse.model_validate(request) for request in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/account-deletion-requests",
    response_model=AccountDeletionRequestResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_account_deletion_request(
    payload: AccountDeletionRequestCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
) -> AccountDeletionRequestResponse:
    try:
        request = await service.create_deletion_request(
            current_user,
            idempotency_key=payload.idempotency_key,
            reason=payload.reason,
        )
        await service.db.commit()
        return AccountDeletionRequestResponse.model_validate(request)
    except Exception:
        await service.db.rollback()
        raise


def _profile_response(user: User, profile: UserProfile) -> UserProfileResponse:
    return UserProfileResponse.model_validate(
        {
            "id": profile.id,
            "userId": user.id,
            "email": user.email,
            "displayName": user.display_name,
            "isEmailVerified": user.is_email_verified,
            "headline": profile.headline,
            "bio": profile.bio,
            "location": profile.location,
            "websiteUrl": profile.website_url,
            "avatarKind": profile.avatar_kind,
            "avatarPreset": profile.avatar_preset,
            "avatarFileId": profile.avatar_file_id,
            "createdAt": profile.created_at,
            "updatedAt": profile.updated_at,
        }
    )


def _privacy_response(view: PrivacyView) -> PrivacySettingsResponse:
    return PrivacySettingsResponse.model_validate(
        {
            "id": view.privacy.id,
            "profileVisibility": view.privacy.profile_visibility,
            "showEmailOnProfile": view.privacy.show_email_on_profile,
            "allowProfileInAiContext": view.privacy.allow_profile_in_ai_context,
            "allowProfileSearchIndexing": view.privacy.allow_profile_search_indexing,
            "includeProfileInExports": view.privacy.include_profile_in_exports,
            "aiMemoryEnabled": view.preferences.ai_memory_enabled,
            "productAnalyticsEnabled": view.preferences.product_analytics_enabled,
            "createdAt": view.privacy.created_at,
            "updatedAt": view.privacy.updated_at,
        }
    )
