from typing import Any

from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user, verify_allowed_origin
from app.dependencies.foundation import get_user_data_service
from app.models.auth import User
from app.schemas.common import ApiErrorResponse
from app.schemas.foundation import WorldProfileResponse, WorldProfileUpdate, WorldVisitRequest
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
