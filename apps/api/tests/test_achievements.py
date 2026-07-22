from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator, Iterator
from dataclasses import dataclass

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import get_async_session
from app.domain.achievements import AchievementCategory, AchievementRarity
from app.main import create_app
from app.models.achievements import AchievementDefinition

VALID_ORIGIN = "http://localhost:3000"
VALID_PASSWORD = "StrongPass123!"


@dataclass(frozen=True)
class AchievementTestContext:
    client: TestClient
    sessionmaker: async_sessionmaker[AsyncSession]


@pytest.fixture()
def achievement_context(monkeypatch: pytest.MonkeyPatch) -> Iterator[AchievementTestContext]:
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
        yield AchievementTestContext(client=client, sessionmaker=testing_sessionmaker)

    asyncio.run(engine.dispose())
    get_settings.cache_clear()


def register(client: TestClient, *, email: str = "achievements@example.com") -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"displayName": "Achievement User", "email": email, "password": VALID_PASSWORD},
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201


def create_event(
    client: TestClient,
    *,
    event_type: str,
    idempotency_key: str,
    payload: dict[str, object] | None = None,
) -> dict[str, object]:
    response = client.post(
        "/api/v1/domain-events",
        json={
            "eventType": event_type,
            "idempotencyKey": idempotency_key,
            "payload": payload or {},
        },
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201
    return response.json()


def process_events(client: TestClient) -> dict[str, object]:
    response = client.post("/api/v1/achievements/process", headers={"Origin": VALID_ORIGIN})
    assert response.status_code == 200
    return response.json()


def test_achievement_defaults_and_summary_seeded(
    achievement_context: AchievementTestContext,
) -> None:
    register(achievement_context.client)

    response = achievement_context.client.get("/api/v1/achievements")
    summary = achievement_context.client.get("/api/v1/achievements/summary")

    assert response.status_code == 200
    assert response.json()["total"] == 7
    coding_starter = next(
        item for item in response.json()["items"] if item["slug"] == "coding-starter"
    )
    assert coding_starter["unlockedAt"] is None
    assert coding_starter["progressCount"] == 0
    assert summary.status_code == 200
    assert summary.json()["unlockedCount"] == 0
    assert summary.json()["totalAchievements"] == 7


def test_achievement_processing_is_idempotent_and_searchable(
    achievement_context: AchievementTestContext,
) -> None:
    register(achievement_context.client, email="first-file@example.com")
    create_event(
        achievement_context.client,
        event_type="file.uploaded",
        idempotency_key="file.uploaded:test-1",
        payload={"fileId": "11111111-1111-4111-8111-111111111111"},
    )

    result = process_events(achievement_context.client)
    second_result = process_events(achievement_context.client)
    achievements = achievement_context.client.get("/api/v1/achievements")
    notifications = achievement_context.client.get("/api/v1/notifications")
    events = achievement_context.client.get("/api/v1/domain-events?eventType=achievement.unlocked")
    search = achievement_context.client.post(
        "/api/v1/search",
        json={"entityTypes": ["achievement"], "query": "First File"},
        headers={"Origin": VALID_ORIGIN},
    )

    assert result["processedEventCount"] == 1
    assert result["newUnlockCount"] == 1
    assert result["unlocked"][0]["slug"] == "first-file"
    assert result["unlocked"][0]["worldUnlocks"][0]["locationId"] == (
        "achievement_hall:first_file_display"
    )
    assert second_result["processedEventCount"] == 0
    assert second_result["newUnlockCount"] == 0
    first_file = next(item for item in achievements.json()["items"] if item["slug"] == "first-file")
    assert first_file["unlockedAt"] is not None
    assert any(item["title"] == "Achievement unlocked" for item in notifications.json()["items"])
    assert events.json()["total"] == 1
    assert search.status_code == 200
    assert search.json()["total"] >= 1
    assert search.json()["items"][0]["matchReason"] == "achievement_metadata"


def test_achievement_threshold_progression(achievement_context: AchievementTestContext) -> None:
    register(achievement_context.client, email="quiz-progress@example.com")
    for index in range(2):
        create_event(
            achievement_context.client,
            event_type="quiz.completed",
            idempotency_key=f"quiz.completed:{index}",
            payload={"quizId": f"quiz-{index}"},
        )

    partial_result = process_events(achievement_context.client)
    partial_page = achievement_context.client.get("/api/v1/achievements")
    quiz_explorer = next(
        item for item in partial_page.json()["items"] if item["slug"] == "quiz-explorer"
    )
    create_event(
        achievement_context.client,
        event_type="quiz.completed",
        idempotency_key="quiz.completed:2",
        payload={"quizId": "quiz-2"},
    )
    completed_result = process_events(achievement_context.client)

    assert partial_result["processedEventCount"] == 2
    assert partial_result["newUnlockCount"] == 0
    assert quiz_explorer["progressCount"] == 2
    assert quiz_explorer["targetCount"] == 3
    assert completed_result["processedEventCount"] == 1
    assert completed_result["newUnlockCount"] == 1
    assert completed_result["unlocked"][0]["slug"] == "quiz-explorer"


def test_achievements_are_owner_scoped(achievement_context: AchievementTestContext) -> None:
    register(achievement_context.client, email="achievement-owner@example.com")
    create_event(
        achievement_context.client,
        event_type="file.uploaded",
        idempotency_key="file.uploaded:owner",
    )
    owner_result = process_events(achievement_context.client)

    with TestClient(achievement_context.client.app) as other_client:
        register(other_client, email="achievement-other@example.com")
        other_summary = other_client.get("/api/v1/achievements/summary")
        other_result = process_events(other_client)
        other_unlocked = other_client.get("/api/v1/achievements?unlockedOnly=true")

    assert owner_result["newUnlockCount"] == 1
    assert other_summary.status_code == 200
    assert other_summary.json()["unlockedCount"] == 0
    assert other_result["processedEventCount"] == 0
    assert other_result["newUnlockCount"] == 0
    assert other_unlocked.json()["total"] == 0


def test_achievement_endpoints_require_authentication(
    achievement_context: AchievementTestContext,
) -> None:
    list_response = achievement_context.client.get("/api/v1/achievements")
    summary_response = achievement_context.client.get("/api/v1/achievements/summary")
    process_response = achievement_context.client.post(
        "/api/v1/achievements/process",
        headers={"Origin": VALID_ORIGIN},
    )

    assert list_response.status_code == 401
    assert summary_response.status_code == 401
    assert process_response.status_code == 401


async def create_duplicate_definitions(
    sessionmaker: async_sessionmaker[AsyncSession],
) -> None:
    async with sessionmaker() as session:
        session.add_all(
            [
                AchievementDefinition(
                    slug="duplicate-definition",
                    title="Duplicate",
                    description="First duplicate definition.",
                    category=AchievementCategory.FILES.value,
                    rarity=AchievementRarity.COMMON.value,
                    points=1,
                    is_active=True,
                ),
                AchievementDefinition(
                    slug="duplicate-definition",
                    title="Duplicate",
                    description="Second duplicate definition.",
                    category=AchievementCategory.FILES.value,
                    rarity=AchievementRarity.COMMON.value,
                    points=1,
                    is_active=True,
                ),
            ]
        )
        await session.commit()


def test_achievement_definition_slug_constraint(
    achievement_context: AchievementTestContext,
) -> None:
    with pytest.raises(IntegrityError):
        asyncio.run(create_duplicate_definitions(achievement_context.sessionmaker))
