from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, status

from app.dependencies.achievements import get_achievement_service
from app.dependencies.auth import get_current_user, verify_allowed_origin
from app.dependencies.pagination import PaginationParams, get_pagination
from app.models.auth import User
from app.schemas.achievements import (
    AchievementPage,
    AchievementProcessResponse,
    AchievementProgressResponse,
    AchievementSummaryResponse,
    RewardDefinitionResponse,
    WorldUnlockResponse,
)
from app.schemas.common import ApiErrorResponse
from app.services.achievements import (
    AchievementProcessResult,
    AchievementProgressItem,
    AchievementService,
    AchievementSummary,
)

router = APIRouter()

ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    401: {"model": ApiErrorResponse},
    403: {"model": ApiErrorResponse},
    422: {"model": ApiErrorResponse},
}


@router.get("", response_model=AchievementPage, responses={401: {"model": ApiErrorResponse}})
async def list_achievements(
    pagination: PaginationParams = Depends(get_pagination),
    unlocked_only: bool = Query(default=False, alias="unlockedOnly"),
    current_user: User = Depends(get_current_user),
    service: AchievementService = Depends(get_achievement_service),
) -> AchievementPage:
    try:
        page = await service.list_achievements(
            current_user, pagination, unlocked_only=unlocked_only
        )
        await service.db.commit()
    except Exception:
        await service.db.rollback()
        raise
    return AchievementPage(
        items=[_progress_response(item) for item in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.get(
    "/summary",
    response_model=AchievementSummaryResponse,
    responses={401: {"model": ApiErrorResponse}},
)
async def get_achievement_summary(
    current_user: User = Depends(get_current_user),
    service: AchievementService = Depends(get_achievement_service),
) -> AchievementSummaryResponse:
    try:
        summary = await service.get_summary(current_user)
        await service.db.commit()
        return _summary_response(summary)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/process",
    response_model=AchievementProcessResponse,
    responses=ERROR_RESPONSES,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(verify_allowed_origin)],
)
async def process_achievement_events(
    current_user: User = Depends(get_current_user),
    service: AchievementService = Depends(get_achievement_service),
) -> AchievementProcessResponse:
    try:
        result = await service.process_pending_events(current_user)
        await service.db.commit()
        return _process_response(result)
    except Exception:
        await service.db.rollback()
        raise


def _progress_response(item: AchievementProgressItem) -> AchievementProgressResponse:
    return AchievementProgressResponse.model_validate(
        {
            "category": item.definition.category,
            "createdAt": item.definition.created_at,
            "definitionId": item.definition.id,
            "description": item.definition.description,
            "points": item.definition.points,
            "progressCount": item.progress_count,
            "rarity": item.definition.rarity,
            "rewards": [RewardDefinitionResponse.model_validate(reward) for reward in item.rewards],
            "slug": item.definition.slug,
            "targetCount": item.target_count,
            "title": item.definition.title,
            "unlockedAt": item.unlocked_at,
            "updatedAt": item.definition.updated_at,
            "worldUnlocks": [
                WorldUnlockResponse.model_validate(unlock) for unlock in item.world_unlocks
            ],
        }
    )


def _summary_response(summary: AchievementSummary) -> AchievementSummaryResponse:
    return AchievementSummaryResponse.model_validate(
        {
            "lockedCount": summary.locked_count,
            "recentUnlocks": [_progress_response(item) for item in summary.recent_unlocks],
            "totalAchievements": summary.total_achievements,
            "totalPoints": summary.total_points,
            "unlockedCount": summary.unlocked_count,
            "unlockedPoints": summary.unlocked_points,
            "worldUnlocks": [
                WorldUnlockResponse.model_validate(unlock) for unlock in summary.world_unlocks
            ],
        }
    )


def _process_response(result: AchievementProcessResult) -> AchievementProcessResponse:
    return AchievementProcessResponse.model_validate(
        {
            "newUnlockCount": result.new_unlock_count,
            "processedEventCount": result.processed_event_count,
            "unlocked": [_progress_response(item) for item in result.unlocked],
        }
    )
