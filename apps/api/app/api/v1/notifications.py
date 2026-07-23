from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.dependencies.auth import get_current_user, verify_allowed_origin
from app.dependencies.foundation import get_user_data_service
from app.dependencies.notifications import get_notification_workflow_service
from app.dependencies.pagination import PaginationParams, get_pagination
from app.domain.notifications import NotificationWorkflowType
from app.models.auth import User
from app.schemas.common import ApiErrorResponse
from app.schemas.foundation import NotificationPage, NotificationResponse
from app.schemas.notifications import (
    MonthlyReviewPage,
    MonthlyReviewResponse,
    MonthlyReviewUpsert,
    NotificationPreferencesResponse,
    NotificationPreferencesUpdate,
    NotificationWorkflowRecordPage,
    NotificationWorkflowRecordResponse,
    NotificationWorkflowRunRequest,
    NotificationWorkflowRunResponse,
)
from app.services.foundation import UserDataService
from app.services.notifications import NotificationWorkflowService

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


@router.post(
    "/read-all",
    response_model=NotificationPage,
    responses={
        401: {"model": ApiErrorResponse},
        403: {"model": ApiErrorResponse},
    },
    dependencies=[Depends(verify_allowed_origin)],
)
async def mark_all_notifications_read(
    pagination: PaginationParams = Depends(get_pagination),
    current_user: User = Depends(get_current_user),
    service: UserDataService = Depends(get_user_data_service),
) -> NotificationPage:
    try:
        await service.mark_all_notifications_read(current_user)
        await service.db.commit()
        updated_page, updated_unread_count = await service.list_notifications(
            current_user, pagination
        )
        return NotificationPage(
            items=[NotificationResponse.model_validate(item) for item in updated_page.items],
            total=updated_page.total,
            unreadCount=updated_unread_count,
            limit=updated_page.limit,
            offset=updated_page.offset,
        )
    except Exception:
        await service.db.rollback()
        raise


@router.get(
    "/preferences",
    response_model=NotificationPreferencesResponse,
    responses={401: {"model": ApiErrorResponse}},
)
async def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    service: NotificationWorkflowService = Depends(get_notification_workflow_service),
) -> NotificationPreferencesResponse:
    preferences = await service.get_or_create_preferences(current_user)
    await service.db.commit()
    return NotificationPreferencesResponse.from_preferences(preferences)


@router.patch(
    "/preferences",
    response_model=NotificationPreferencesResponse,
    responses={
        401: {"model": ApiErrorResponse},
        403: {"model": ApiErrorResponse},
        422: {"model": ApiErrorResponse},
    },
    dependencies=[Depends(verify_allowed_origin)],
)
async def update_notification_preferences(
    payload: NotificationPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    service: NotificationWorkflowService = Depends(get_notification_workflow_service),
) -> NotificationPreferencesResponse:
    try:
        updates = payload.model_dump(exclude_unset=True)
        preferences = await service.update_preferences(current_user, updates)
        await service.db.commit()
        return NotificationPreferencesResponse.from_preferences(preferences)
    except Exception:
        await service.db.rollback()
        raise


@router.get(
    "/workflows",
    response_model=NotificationWorkflowRecordPage,
    responses={401: {"model": ApiErrorResponse}, 422: {"model": ApiErrorResponse}},
)
async def list_notification_workflow_records(
    pagination: PaginationParams = Depends(get_pagination),
    workflow_type: NotificationWorkflowType | None = Query(default=None, alias="workflowType"),
    current_user: User = Depends(get_current_user),
    service: NotificationWorkflowService = Depends(get_notification_workflow_service),
) -> NotificationWorkflowRecordPage:
    page = await service.list_workflow_records(current_user, pagination, workflow_type)
    await service.db.commit()
    return NotificationWorkflowRecordPage(
        items=[NotificationWorkflowRecordResponse.from_record(record) for record in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/workflows/run",
    response_model=NotificationWorkflowRunResponse,
    responses={
        401: {"model": ApiErrorResponse},
        403: {"model": ApiErrorResponse},
        422: {"model": ApiErrorResponse},
    },
    dependencies=[Depends(verify_allowed_origin)],
)
async def run_notification_workflows(
    payload: NotificationWorkflowRunRequest,
    current_user: User = Depends(get_current_user),
    service: NotificationWorkflowService = Depends(get_notification_workflow_service),
) -> NotificationWorkflowRunResponse:
    try:
        result = await service.run_due_workflows(
            current_user,
            reference_date=payload.reference_date,
        )
        await service.db.commit()
        return NotificationWorkflowRunResponse.from_result(result)
    except Exception:
        await service.db.rollback()
        raise


@router.get(
    "/monthly-reviews",
    response_model=MonthlyReviewPage,
    responses={401: {"model": ApiErrorResponse}},
)
async def list_monthly_reviews(
    pagination: PaginationParams = Depends(get_pagination),
    current_user: User = Depends(get_current_user),
    service: NotificationWorkflowService = Depends(get_notification_workflow_service),
) -> MonthlyReviewPage:
    page = await service.list_monthly_reviews(current_user, pagination)
    await service.db.commit()
    return MonthlyReviewPage(
        items=[MonthlyReviewResponse.from_review(review) for review in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/monthly-reviews",
    response_model=MonthlyReviewResponse,
    status_code=201,
    responses={
        401: {"model": ApiErrorResponse},
        403: {"model": ApiErrorResponse},
        422: {"model": ApiErrorResponse},
    },
    dependencies=[Depends(verify_allowed_origin)],
)
async def upsert_monthly_review(
    payload: MonthlyReviewUpsert,
    current_user: User = Depends(get_current_user),
    service: NotificationWorkflowService = Depends(get_notification_workflow_service),
) -> MonthlyReviewResponse:
    try:
        review = await service.upsert_monthly_review(
            current_user,
            month_start=payload.month_start,
            wins=payload.wins,
            challenges=payload.challenges,
            next_steps=payload.next_steps,
        )
        await service.db.commit()
        return MonthlyReviewResponse.from_review(review)
    except Exception:
        await service.db.rollback()
        raise
