from __future__ import annotations

from datetime import date
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.core.errors import AppError
from app.core.pagination import PaginationParams
from app.dependencies.auth import get_current_user, verify_allowed_origin
from app.dependencies.habits import get_habit_service
from app.dependencies.pagination import get_pagination
from app.domain.habits import ReviewPeriod
from app.models.auth import User
from app.schemas.common import ApiErrorResponse
from app.schemas.habits import (
    DailyCheckInResponse,
    DailyCheckInUpsert,
    HabitCreateRequest,
    HabitLogPage,
    HabitLogRequest,
    HabitLogResponse,
    HabitPage,
    HabitResponse,
    HabitSummaryResponse,
    HabitUpdateRequest,
    WeeklyReviewPage,
    WeeklyReviewResponse,
    WeeklyReviewUpsert,
)
from app.services.habits import HabitService

router = APIRouter()

ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    401: {"model": ApiErrorResponse},
    403: {"model": ApiErrorResponse},
    404: {"model": ApiErrorResponse},
    409: {"model": ApiErrorResponse},
    422: {"model": ApiErrorResponse},
}


@router.get("", response_model=HabitPage, responses=ERROR_RESPONSES)
async def list_habits(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[HabitService, Depends(get_habit_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
    include_archived: bool = Query(default=False, alias="includeArchived"),
) -> HabitPage:
    page = await service.list_habits(
        current_user,
        pagination,
        include_archived=include_archived,
    )
    await service.db.commit()
    return HabitPage(
        items=[HabitResponse.from_view(view) for view in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "",
    response_model=HabitResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_habit(
    payload: HabitCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[HabitService, Depends(get_habit_service)],
) -> HabitResponse:
    try:
        view = await service.create_habit(
            current_user,
            name=payload.name,
            description=payload.description,
            value_type=payload.value_type,
            target_value=payload.target_value,
            target_unit=payload.target_unit,
            schedule_type=payload.schedule_type,
            weekdays=payload.weekdays,
            weekly_target=payload.weekly_target,
            starts_on=payload.starts_on,
            time_zone=payload.time_zone,
            color=payload.color,
        )
        await service.db.commit()
        return HabitResponse.from_view(view)
    except Exception:
        await service.db.rollback()
        raise


@router.get("/summary", response_model=HabitSummaryResponse, responses=ERROR_RESPONSES)
async def get_habit_summary(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[HabitService, Depends(get_habit_service)],
    period: ReviewPeriod = Query(default=ReviewPeriod.WEEK),
    start_date: date | None = Query(default=None, alias="startDate"),
) -> HabitSummaryResponse:
    summary = await service.get_summary(current_user, period=period, start_date=start_date)
    await service.db.commit()
    return HabitSummaryResponse.from_summary(summary)


@router.get(
    "/check-ins/{check_in_date}",
    response_model=DailyCheckInResponse | None,
    responses=ERROR_RESPONSES,
)
async def get_daily_check_in(
    check_in_date: date,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[HabitService, Depends(get_habit_service)],
) -> DailyCheckInResponse | None:
    check_in = await service.get_check_in(current_user, check_in_date)
    await service.db.commit()
    return DailyCheckInResponse.from_check_in(check_in) if check_in else None


@router.put(
    "/check-ins/{check_in_date}",
    response_model=DailyCheckInResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def upsert_daily_check_in(
    check_in_date: date,
    payload: DailyCheckInUpsert,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[HabitService, Depends(get_habit_service)],
) -> DailyCheckInResponse:
    try:
        check_in = await service.upsert_check_in(
            current_user,
            check_in_date=check_in_date,
            mood=payload.mood,
            energy=payload.energy,
            notes=payload.notes,
        )
        await service.db.commit()
        return DailyCheckInResponse.from_check_in(check_in)
    except Exception:
        await service.db.rollback()
        raise


@router.get("/weekly-reviews", response_model=WeeklyReviewPage, responses=ERROR_RESPONSES)
async def list_weekly_reviews(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[HabitService, Depends(get_habit_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
) -> WeeklyReviewPage:
    page = await service.list_weekly_reviews(current_user, pagination)
    await service.db.commit()
    return WeeklyReviewPage(
        items=[WeeklyReviewResponse.from_review(review) for review in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/weekly-reviews",
    response_model=WeeklyReviewResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def upsert_weekly_review(
    payload: WeeklyReviewUpsert,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[HabitService, Depends(get_habit_service)],
) -> WeeklyReviewResponse:
    try:
        review = await service.upsert_weekly_review(
            current_user,
            week_start=payload.week_start,
            wins=payload.wins,
            challenges=payload.challenges,
            next_steps=payload.next_steps,
        )
        await service.db.commit()
        return WeeklyReviewResponse.from_review(review)
    except Exception:
        await service.db.rollback()
        raise


@router.get("/{habit_id}", response_model=HabitResponse, responses=ERROR_RESPONSES)
async def get_habit(
    habit_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[HabitService, Depends(get_habit_service)],
) -> HabitResponse:
    view = await service.get_habit(current_user, habit_id)
    await service.db.commit()
    return HabitResponse.from_view(view)


@router.patch(
    "/{habit_id}",
    response_model=HabitResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def update_habit(
    habit_id: UUID,
    payload: HabitUpdateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[HabitService, Depends(get_habit_service)],
) -> HabitResponse:
    try:
        view = await service.update_habit(
            current_user,
            habit_id,
            payload.model_dump(exclude_unset=True),
        )
        await service.db.commit()
        return HabitResponse.from_view(view)
    except AppError:
        await service.db.commit()
        raise
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/{habit_id}/archive",
    response_model=HabitResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def archive_habit(
    habit_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[HabitService, Depends(get_habit_service)],
) -> HabitResponse:
    try:
        view = await service.archive_habit(current_user, habit_id)
        await service.db.commit()
        return HabitResponse.from_view(view)
    except AppError:
        await service.db.commit()
        raise
    except Exception:
        await service.db.rollback()
        raise


@router.get("/{habit_id}/logs", response_model=HabitLogPage, responses=ERROR_RESPONSES)
async def list_habit_logs(
    habit_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[HabitService, Depends(get_habit_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
) -> HabitLogPage:
    page = await service.list_logs(current_user, habit_id, pagination)
    await service.db.commit()
    return HabitLogPage(
        items=[HabitLogResponse.from_log(log) for log in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/{habit_id}/logs",
    response_model=HabitLogResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def log_habit(
    habit_id: UUID,
    payload: HabitLogRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[HabitService, Depends(get_habit_service)],
) -> HabitLogResponse:
    try:
        log = await service.log_habit(
            current_user,
            habit_id,
            log_date=payload.log_date,
            value=payload.value,
            note=payload.note,
        )
        await service.db.commit()
        return HabitLogResponse.from_log(log)
    except AppError:
        await service.db.commit()
        raise
    except Exception:
        await service.db.rollback()
        raise
