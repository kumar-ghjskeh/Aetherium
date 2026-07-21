from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.db.session import get_async_session
from app.dependencies.auth import get_rate_limiter
from app.security.rate_limit import InMemoryRateLimiter
from app.services.ai_gateway import AIGatewayService


def get_ai_gateway_service(
    db: AsyncSession = Depends(get_async_session),
    settings: Settings = Depends(get_settings),
    rate_limiter: InMemoryRateLimiter = Depends(get_rate_limiter),
) -> AIGatewayService:
    return AIGatewayService(db=db, settings=settings, rate_limiter=rate_limiter)
