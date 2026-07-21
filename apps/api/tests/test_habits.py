from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator, Iterator
from dataclasses import dataclass
from datetime import date
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import get_async_session
from app.main import create_app
from app.models.auth import User
from app.models.habits import HabitLog

VALID_ORIGIN = "http://localhost:3000"
VALID_PASSWORD = "StrongPass123!"


@dataclass(frozen=True)
class HabitTestContext:
    client: TestClient
    sessionmaker: async_sessionmaker[AsyncSession]


@pytest.fixture()
def habit_context(monkeypatch: pytest.MonkeyPatch) -> Iterator[HabitTestContext]:
    monkeypatch.setenv("AETHERIUM_APP_ENV", "test")
    monkeypatch.setenv("AETHERIUM_SESSION_SIGNING_SECRET", "aetherium-test-session-secret")
    monkeypatch.setenv("AETHERIUM_CORS_ORIGINS", VALID_ORIGIN)
    get_settings.cache_clear()

    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    testing_sessionmaker = async_sessionmaker(engine, expire_on_commit=False)

    async def create_schema() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

    asyncio.run(create_schema())
    app = create_app()

    async def override_session() -> AsyncIterator[AsyncSession]:
        async with testing_sessionmaker() as session:
            yield session

    app.dependency_overrides[get_async_session] = override_session
    app.state.rate_limiter.reset()

    with TestClient(app) as client:
        yield HabitTestContext(client=client, sessionmaker=testing_sessionmaker)

    asyncio.run(engine.dispose())
    get_settings.cache_clear()


def register(client: TestClient, *, email: str = "habits@example.com") -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"displayName": "Habit User", "email": email, "password": VALID_PASSWORD},
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201


def create_habit(client: TestClient, *, name: str = "Deep reading") -> dict[str, object]:
    response = client.post(
        "/api/v1/habits",
        json={
            "description": "Read one technical page without rushing.",
            "name": name,
            "scheduleType": "daily",
            "targetUnit": "pages",
            "targetValue": 1,
            "valueType": "quantity",
        },
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201
    return response.json()


async def get_user_id(sessionmaker: async_sessionmaker[AsyncSession], email: str) -> UUID:
    async with sessionmaker() as session:
        result = await session.execute(select(User.id).where(User.email == email))
        return result.scalar_one()


def test_habit_create_log_summary_and_search(habit_context: HabitTestContext) -> None:
    register(habit_context.client)
    habit = create_habit(habit_context.client)
    habit_id = str(habit["id"])

    log = habit_context.client.post(
        f"/api/v1/habits/{habit_id}/logs",
        json={"logDate": "2026-07-21", "note": "Finished the first section.", "value": 2},
        headers={"Origin": VALID_ORIGIN},
    )
    refreshed = habit_context.client.get(f"/api/v1/habits/{habit_id}")
    summary = habit_context.client.get("/api/v1/habits/summary?period=week&startDate=2026-07-21")
    events = habit_context.client.get("/api/v1/domain-events?eventType=habit.logged")
    audit_logs = habit_context.client.get("/api/v1/audit-logs")
    search = habit_context.client.post(
        "/api/v1/search",
        json={"entityTypes": ["habit"], "query": "reading"},
        headers={"Origin": VALID_ORIGIN},
    )

    assert log.status_code == 201
    assert log.json()["unit"] == "pages"
    assert refreshed.status_code == 200
    assert refreshed.json()["streak"]["bestStreak"] == 1
    assert summary.status_code == 200
    assert summary.json()["completedLogCount"] == 1
    assert summary.json()["gardenGrowthPoints"] == 1
    assert events.status_code == 200
    assert events.json()["total"] == 1
    assert any(item["action"] == "habit.logged" for item in audit_logs.json()["items"])
    assert search.status_code == 200
    assert search.json()["total"] == 1
    assert search.json()["items"][0]["entityType"] == "habit"
    assert search.json()["items"][0]["worldLocationId"] == "habit_garden"


def test_habit_validation_and_pagination(habit_context: HabitTestContext) -> None:
    register(habit_context.client, email="validation@example.com")
    invalid = habit_context.client.post(
        "/api/v1/habits",
        json={"name": "Weekday habit", "scheduleType": "selected_weekdays"},
        headers={"Origin": VALID_ORIGIN},
    )
    weekly_invalid = habit_context.client.post(
        "/api/v1/habits",
        json={"name": "Weekly habit", "scheduleType": "weekly_target"},
        headers={"Origin": VALID_ORIGIN},
    )
    create_habit(habit_context.client, name="Reading one")
    create_habit(habit_context.client, name="Reading two")

    page = habit_context.client.get("/api/v1/habits?limit=1&offset=1")
    invalid_page = habit_context.client.get("/api/v1/habits?limit=101")

    assert invalid.status_code == 422
    assert weekly_invalid.status_code == 422
    assert page.status_code == 200
    assert page.json()["total"] == 2
    assert len(page.json()["items"]) == 1
    assert invalid_page.status_code == 422


def test_check_in_and_weekly_review_are_owner_scoped(habit_context: HabitTestContext) -> None:
    register(habit_context.client, email="owner@example.com")
    check_in = habit_context.client.put(
        "/api/v1/habits/check-ins/2026-07-21",
        json={"energy": 4, "mood": 5, "notes": "Focused start."},
        headers={"Origin": VALID_ORIGIN},
    )
    review = habit_context.client.post(
        "/api/v1/habits/weekly-reviews",
        json={
            "challenges": "One rushed evening.",
            "nextSteps": "Use shorter sessions.",
            "weekStart": "2026-07-21",
            "wins": "Started a habit.",
        },
        headers={"Origin": VALID_ORIGIN},
    )

    with TestClient(habit_context.client.app) as other_client:
        register(other_client, email="other@example.com")
        other_check_in = other_client.get("/api/v1/habits/check-ins/2026-07-21")
        other_reviews = other_client.get("/api/v1/habits/weekly-reviews")

    assert check_in.status_code == 200
    assert check_in.json()["mood"] == 5
    assert review.status_code == 201
    assert review.json()["weekStart"] == "2026-07-20"
    assert other_check_in.status_code == 200
    assert other_check_in.json() is None
    assert other_reviews.status_code == 200
    assert other_reviews.json()["total"] == 0


def test_cross_user_habit_access_returns_not_found(habit_context: HabitTestContext) -> None:
    register(habit_context.client, email="habit-owner@example.com")
    habit = create_habit(habit_context.client)

    with TestClient(habit_context.client.app) as other_client:
        register(other_client, email="habit-other@example.com")
        other_get = other_client.get(f"/api/v1/habits/{habit['id']}")
        other_log = other_client.post(
            f"/api/v1/habits/{habit['id']}/logs",
            json={"logDate": "2026-07-21", "value": 1},
            headers={"Origin": VALID_ORIGIN},
        )

    assert other_get.status_code == 404
    assert other_log.status_code == 404


def test_archived_habit_cannot_be_logged(habit_context: HabitTestContext) -> None:
    register(habit_context.client, email="archive@example.com")
    habit = create_habit(habit_context.client)
    habit_id = str(habit["id"])

    archive = habit_context.client.post(
        f"/api/v1/habits/{habit_id}/archive",
        headers={"Origin": VALID_ORIGIN},
    )
    log = habit_context.client.post(
        f"/api/v1/habits/{habit_id}/logs",
        json={"logDate": "2026-07-21", "value": 1},
        headers={"Origin": VALID_ORIGIN},
    )

    assert archive.status_code == 200
    assert archive.json()["status"] == "archived"
    assert log.status_code == 409
    assert log.json()["error"]["code"] == "habit_archived"


def test_habit_log_unique_owner_habit_date_constraint(habit_context: HabitTestContext) -> None:
    register(habit_context.client, email="constraint@example.com")
    habit = create_habit(habit_context.client)
    user_id = asyncio.run(get_user_id(habit_context.sessionmaker, "constraint@example.com"))
    habit_id = UUID(str(habit["id"]))

    async def insert_duplicate_logs() -> None:
        async with habit_context.sessionmaker() as session:
            session.add_all(
                [
                    HabitLog(
                        owner_user_id=user_id,
                        habit_id=habit_id,
                        log_date=date(2026, 7, 21),
                        value=1,
                        status="completed",
                    ),
                    HabitLog(
                        owner_user_id=user_id,
                        habit_id=habit_id,
                        log_date=date(2026, 7, 21),
                        value=1,
                        status="completed",
                    ),
                ]
            )
            with pytest.raises(IntegrityError):
                await session.commit()

    asyncio.run(insert_duplicate_logs())


def test_habit_endpoints_require_authentication(habit_context: HabitTestContext) -> None:
    response = habit_context.client.get("/api/v1/habits")
    summary = habit_context.client.get("/api/v1/habits/summary")

    assert response.status_code == 401
    assert summary.status_code == 401
