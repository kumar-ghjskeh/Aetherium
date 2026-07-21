from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.dependencies.ai import get_ai_gateway_service
from app.services.ai_gateway import AIGatewayService
from app.services.mentors import MentorService


def get_mentor_service(
    db: AsyncSession = Depends(get_async_session),
    ai_gateway: AIGatewayService = Depends(get_ai_gateway_service),
) -> MentorService:
    return MentorService(db=db, ai_gateway=ai_gateway)
