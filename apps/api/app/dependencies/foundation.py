from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.services.foundation import UserDataService


def get_user_data_service(db: AsyncSession = Depends(get_async_session)) -> UserDataService:
    return UserDataService(db=db)
