from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.services.achievements import AchievementService


def get_achievement_service(db: AsyncSession = Depends(get_async_session)) -> AchievementService:
    return AchievementService(db)
