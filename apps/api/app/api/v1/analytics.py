from __future__ import annotations

from fastapi import APIRouter, Depends

from app.dependencies.analytics import get_analytics_service
from app.dependencies.auth import get_current_user
from app.domain.analytics import AnalyticsPeriod
from app.models.auth import User
from app.schemas.analytics import AnalyticsSummary
from app.services.analytics import AnalyticsService

router = APIRouter()


@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    period: AnalyticsPeriod = AnalyticsPeriod.MONTH,
    current_user: User = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service),
) -> AnalyticsSummary:
    return await service.get_summary(current_user.id, period)
