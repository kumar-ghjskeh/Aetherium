from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.dependencies.auth import get_current_user, verify_allowed_origin
from app.dependencies.foundation import get_user_data_service
from app.dependencies.pagination import PaginationParams, get_pagination
from app.models.auth import User
from app.schemas.common import ApiErrorResponse
from app.schemas.foundation import NotificationPage, NotificationResponse
from app.services.foundation import UserDataService

router = APIRouter()


@router.get(
    "",
    response_model=NotificationPage,
    responses={401: {"model": ApiErrorResponse}},
)
async def list_notifications(
    pagination: PaginationParams = Depends(get_pagination),
    unread_only: bool = Query(default=False, alias="unreadOnly"),
    current_user: User = Depends(get_current_user),
    service: UserDataService = Depends(get_user_data_service),
) -> NotificationPage:
    page, unread_count = await service.list_notifications(current_user, pagination, unread_only)
    return NotificationPage(
        items=[NotificationResponse.model_validate(item) for item in page.items],
        total=page.total,
        unreadCount=unread_count,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    responses={
        401: {"model": ApiErrorResponse},
        403: {"model": ApiErrorResponse},
        404: {"model": ApiErrorResponse},
    },
    dependencies=[Depends(verify_allowed_origin)],
)
async def mark_notification_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    service: UserDataService = Depends(get_user_data_service),
) -> NotificationResponse:
    try:
        notification = await service.mark_notification_read(current_user, notification_id)
        await service.db.commit()
        return NotificationResponse.model_validate(notification)
    except Exception:
        await service.db.rollback()
        raise
