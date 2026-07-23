from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.services.knowledge import KnowledgeGraphService


def get_knowledge_service(db: AsyncSession = Depends(get_async_session)) -> KnowledgeGraphService:
    return KnowledgeGraphService(db)
