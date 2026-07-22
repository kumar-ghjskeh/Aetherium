from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.services.projects import ProjectService


def get_project_service(db: AsyncSession = Depends(get_async_session)) -> ProjectService:
    return ProjectService(db)
