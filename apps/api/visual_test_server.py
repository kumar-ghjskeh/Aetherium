"""Disposable real-API host used only by the World Mode Playwright suite."""

from __future__ import annotations

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

os.environ.setdefault("AETHERIUM_APP_ENV", "test")
os.environ.setdefault("AETHERIUM_CORS_ORIGINS", "http://localhost:3000")
os.environ.setdefault("AETHERIUM_SESSION_COOKIE_SECURE", "false")
os.environ.setdefault("AETHERIUM_SESSION_SIGNING_SECRET", "aetherium-visual-session-secret")

from fastapi import Depends, FastAPI, HTTPException, Request, status  # noqa: E402
from sqlalchemy import select  # noqa: E402
from sqlalchemy.ext.asyncio import (  # noqa: E402
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

import app.models  # noqa: E402, F401
from app.core.config import get_settings  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import get_async_session  # noqa: E402
from app.dependencies.auth import get_current_user  # noqa: E402
from app.dependencies.mentors import get_mentor_service  # noqa: E402
from app.domain.world import WORLD_LOCATION_DEFINITIONS  # noqa: E402
from app.main import create_app  # noqa: E402
from app.models.auth import User  # noqa: E402
from app.models.foundation import UserPreferences, WorldProfile  # noqa: E402
from app.services.achievements import AchievementService  # noqa: E402
from app.services.mentors import MentorService  # noqa: E402

get_settings.cache_clear()

DATABASE_PATH = Path("artifacts/world-visual.sqlite3").resolve()
DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
engine = create_async_engine(
    f"sqlite+aiosqlite:///{DATABASE_PATH.as_posix()}",
    connect_args={"timeout": 30},
)
VisualSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


@asynccontextmanager
async def visual_lifespan(_: FastAPI) -> AsyncIterator[None]:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)
    try:
        yield
    finally:
        await engine.dispose()


app = create_app()
app.router.lifespan_context = visual_lifespan


async def override_session() -> AsyncIterator[AsyncSession]:
    async with VisualSessionLocal() as session:
        yield session


app.dependency_overrides[get_async_session] = override_session


@app.post("/__aetherium_visual/seed", include_in_schema=False)
async def seed_visual_account(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
    mentor_service: MentorService = Depends(get_mentor_service),
) -> dict[str, object]:
    expected_token = os.environ.get("AETHERIUM_VISUAL_SEED_TOKEN", "aetherium-visual-seed")
    if request.headers.get("x-aetherium-visual-seed") != expected_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    profile = await db.scalar(
        select(WorldProfile).where(WorldProfile.owner_user_id == current_user.id)
    )
    preferences = await db.scalar(
        select(UserPreferences).where(UserPreferences.owner_user_id == current_user.id)
    )
    if profile is None or preferences is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="User defaults unavailable"
        )

    location_ids = [definition.id.value for definition in WORLD_LOCATION_DEFINITIONS]
    profile.unlocked_location_ids = location_ids
    profile.visited_location_ids = ["central_plaza"]
    profile.current_location_id = "central_plaza"
    profile.last_visited_location_id = None
    preferences.performance_preset = "low"
    preferences.reduced_motion = False
    await AchievementService(db).ensure_default_definitions()
    await mentor_service.ensure_default_mentors(current_user)
    await db.commit()
    return {"locationIds": location_ids, "ownerUserId": str(current_user.id)}
