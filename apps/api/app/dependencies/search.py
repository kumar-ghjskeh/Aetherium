from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.services.search import SearchService


def get_search_service(
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> SearchService:
    return SearchService(db)
