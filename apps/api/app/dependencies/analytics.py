from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.services.analytics import AnalyticsService


def get_analytics_service(db: AsyncSession = Depends(get_async_session)) -> AnalyticsService:
    return AnalyticsService(db)
