from typing import Any

from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user, verify_allowed_origin
from app.dependencies.foundation import get_user_data_service
from app.models.auth import User
from app.schemas.common import ApiErrorResponse
from app.schemas.foundation import (
    WorldDeepLinkPage,
    WorldFeatureFlagsResponse,
    WorldLocationPage,
    WorldLocationResponse,
    WorldProfileResponse,
    WorldProfileUpdate,
    WorldSceneManifestResponse,
    WorldVisitRequest,
)
from app.services.foundation import UserDataService

router = APIRouter()

ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    401: {"model": ApiErrorResponse},
    403: {"model": ApiErrorResponse},
    422: {"model": ApiErrorResponse},
}


@router.get(
    "/profile",
    response_model=WorldProfileResponse,
    responses={401: {"model": ApiErrorResponse}},
)
async def get_world_profile(
    current_user: User = Depends(get_current_user),
    service: UserDataService = Depends(get_user_data_service),
) -> WorldProfileResponse:
    profile = await service.get_or_create_world_profile(current_user)
    await service.db.commit()
    return WorldProfileResponse.model_validate(profile)


@router.get(
    "/locations",
    response_model=WorldLocationPage,
    responses={401: {"model": ApiErrorResponse}},
)
async def list_world_locations(
    current_user: User = Depends(get_current_user),
    service: UserDataService = Depends(get_user_data_service),
) -> WorldLocationPage:
    profile = await service.get_or_create_world_profile(current_user)
    locations = await service.list_world_locations(current_user)
    await service.db.commit()
    return WorldLocationPage.model_validate(
        {
            "items": locations,
            "total": len(locations),
            "unlockedCount": len(profile.unlocked_location_ids),
            "visitedCount": len(profile.visited_location_ids),
            "currentLocationId": profile.current_location_id,
        }
    )


@router.get(
    "/locations/unlocked",
    response_model=WorldLocationPage,
    responses={401: {"model": ApiErrorResponse}},
)
async def list_unlocked_world_locations(
    current_user: User = Depends(get_current_user),
    service: UserDataService = Depends(get_user_data_service),
) -> WorldLocationPage:
    profile = await service.get_or_create_world_profile(current_user)
    locations = await service.list_world_locations(current_user, state_filter="unlocked")
    await service.db.commit()
    return WorldLocationPage.model_validate(
        {
            "items": locations,
            "total": len(locations),
            "unlockedCount": len(profile.unlocked_location_ids),
            "visitedCount": len(profile.visited_location_ids),
            "currentLocationId": profile.current_location_id,
        }
    )


@router.get(
    "/locations/visited",
    response_model=WorldLocationPage,
    responses={401: {"model": ApiErrorResponse}},
)
async def list_visited_world_locations(
    current_user: User = Depends(get_current_user),
    service: UserDataService = Depends(get_user_data_service),
) -> WorldLocationPage:
    profile = await service.get_or_create_world_profile(current_user)
    locations = await service.list_world_locations(current_user, state_filter="visited")
    await service.db.commit()
    return WorldLocationPage.model_validate(
        {
            "items": locations,
            "total": len(locations),
            "unlockedCount": len(profile.unlocked_location_ids),
            "visitedCount": len(profile.visited_location_ids),
            "currentLocationId": profile.current_location_id,
        }
    )


@router.get(
    "/locations/{location_id}",
    response_model=WorldLocationResponse,
    responses={401: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}},
)
async def get_world_location(
    location_id: str,
    current_user: User = Depends(get_current_user),
    service: UserDataService = Depends(get_user_data_service),
) -> WorldLocationResponse:
    location = await service.get_world_location(current_user, location_id)
    await service.db.commit()
    return WorldLocationResponse.model_validate(location)


@router.get(
    "/deep-links",
    response_model=WorldDeepLinkPage,
    responses={401: {"model": ApiErrorResponse}},
)
async def list_world_deep_links(
    current_user: User = Depends(get_current_user),
    service: UserDataService = Depends(get_user_data_service),
) -> WorldDeepLinkPage:
    deep_links = await service.list_world_deep_links(current_user)
    await service.db.commit()
    return WorldDeepLinkPage.model_validate({"items": deep_links, "total": len(deep_links)})


@router.get(
    "/scene-manifest",
    response_model=WorldSceneManifestResponse,
    responses={401: {"model": ApiErrorResponse}},
)
async def get_world_scene_manifest(
    current_user: User = Depends(get_current_user),
    service: UserDataService = Depends(get_user_data_service),
) -> WorldSceneManifestResponse:
    manifest = await service.get_world_scene_manifest(current_user)
    await service.db.commit()
    return WorldSceneManifestResponse.model_validate(manifest)


@router.get(
    "/feature-flags",
    response_model=WorldFeatureFlagsResponse,
    responses={401: {"model": ApiErrorResponse}},
)
async def get_world_feature_flags(
    current_user: User = Depends(get_current_user),
    service: UserDataService = Depends(get_user_data_service),
) -> WorldFeatureFlagsResponse:
    await service.get_or_create_world_profile(current_user)
    await service.db.commit()
    return WorldFeatureFlagsResponse.model_validate(service.get_world_feature_flags())


@router.patch(
    "/profile",
    response_model=WorldProfileResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def update_world_profile(
    payload: WorldProfileUpdate,
    current_user: User = Depends(get_current_user),
    service: UserDataService = Depends(get_user_data_service),
) -> WorldProfileResponse:
    try:
        profile = await service.update_world_profile(
            current_user,
            payload.model_dump(exclude_unset=True),
        )
        await service.db.commit()
        return WorldProfileResponse.model_validate(profile)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/visit",
    response_model=WorldProfileResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def visit_world_location(
    payload: WorldVisitRequest,
    current_user: User = Depends(get_current_user),
    service: UserDataService = Depends(get_user_data_service),
) -> WorldProfileResponse:
    try:
        profile = await service.visit_world_location(
            current_user,
            location_id=payload.location_id,
            idempotency_key=payload.idempotency_key,
        )
        await service.db.commit()
        return WorldProfileResponse.model_validate(profile)
    except Exception:
        await service.db.rollback()
        raise
