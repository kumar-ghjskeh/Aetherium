from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.services.profile import ProfileService


def get_profile_service(db: AsyncSession = Depends(get_async_session)) -> ProfileService:
    return ProfileService(db)
