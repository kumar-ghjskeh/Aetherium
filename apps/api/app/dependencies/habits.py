from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.services.habits import HabitService


def get_habit_service(db: AsyncSession = Depends(get_async_session)) -> HabitService:
    return HabitService(db)
