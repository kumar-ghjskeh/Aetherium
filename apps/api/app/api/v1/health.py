from typing import Protocol

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.db.session import get_async_session
from app.schemas.health import HealthResponse

router = APIRouter()


class ReadinessProbe(Protocol):
    async def check(self) -> None:
        """Raise an exception when the dependency is unavailable."""


class DatabaseReadinessProbe:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def check(self) -> None:
        await self._session.execute(text("SELECT 1"))


async def get_readiness_probe(
    session: AsyncSession = Depends(get_async_session),
) -> ReadinessProbe:
    return DatabaseReadinessProbe(session)


@router.get("/live", response_model=HealthResponse)
async def live(settings: Settings = Depends(get_settings)) -> HealthResponse:
    return HealthResponse(service="api", status="ok", version=settings.app_version)


@router.get("/ready", response_model=HealthResponse)
async def ready(
    probe: ReadinessProbe = Depends(get_readiness_probe),
    settings: Settings = Depends(get_settings),
) -> HealthResponse | JSONResponse:
    try:
        await probe.check()
    except Exception:
        body = HealthResponse(
            checks={"database": "unavailable"},
            service="api",
            status="degraded",
            version=settings.app_version,
        )
        return JSONResponse(
            content=body.model_dump(),
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return HealthResponse(
        checks={"database": "ok"},
        service="api",
        status="ok",
        version=settings.app_version,
    )
