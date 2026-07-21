from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.services.learning import LearningService


def get_learning_service(db: AsyncSession = Depends(get_async_session)) -> LearningService:
    return LearningService(db)
