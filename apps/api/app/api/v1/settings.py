from typing import Any

from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user, verify_allowed_origin
from app.dependencies.foundation import get_user_data_service
from app.models.auth import User
from app.schemas.common import ApiErrorResponse
from app.schemas.foundation import UserPreferencesResponse, UserPreferencesUpdate
from app.services.foundation import UserDataService

router = APIRouter()

ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    401: {"model": ApiErrorResponse},
    403: {"model": ApiErrorResponse},
    422: {"model": ApiErrorResponse},
}


@router.get(
    "/preferences",
    response_model=UserPreferencesResponse,
    responses={401: {"model": ApiErrorResponse}},
)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    service: UserDataService = Depends(get_user_data_service),
) -> UserPreferencesResponse:
    preferences = await service.get_or_create_preferences(current_user)
    await service.db.commit()
    return UserPreferencesResponse.model_validate(preferences)


@router.patch(
    "/preferences",
    response_model=UserPreferencesResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def update_preferences(
    payload: UserPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    service: UserDataService = Depends(get_user_data_service),
) -> UserPreferencesResponse:
    try:
        preferences = await service.update_preferences(
            current_user,
            payload.model_dump(exclude_unset=True),
        )
        await service.db.commit()
        return UserPreferencesResponse.model_validate(preferences)
    except Exception:
        await service.db.rollback()
        raise
