from __future__ import annotations

import asyncio
from collections.abc import Iterator
from dataclasses import dataclass
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.db.base import Base
from app.db.session import get_async_session
from app.main import create_app
from app.models.auth import User
from app.models.foundation import UserPreferences
from app.services.authorization import require_owner
from app.services.foundation import UserDataService, sanitize_audit_metadata

VALID_ORIGIN = "http://localhost:3000"
VALID_PASSWORD = "StrongPass123!"


@dataclass(frozen=True)
class FoundationTestContext:
    client: TestClient
    sessionmaker: async_sessionmaker[AsyncSession]


@pytest.fixture()
def foundation_context(monkeypatch: pytest.MonkeyPatch) -> Iterator[FoundationTestContext]:
    from app.core.config import get_settings

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

    async def override_session() -> Iterator[AsyncSession]:
        async with testing_sessionmaker() as session:
            yield session

    app.dependency_overrides[get_async_session] = override_session
    app.state.rate_limiter.reset()

    with TestClient(app) as client:
        yield FoundationTestContext(client=client, sessionmaker=testing_sessionmaker)

    asyncio.run(engine.dispose())
    get_settings.cache_clear()


def register(
    client: TestClient,
    *,
    email: str = "learner@example.com",
    display_name: str = "Aetherium Learner",
) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": VALID_PASSWORD, "displayName": display_name},
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201


async def get_user_id(sessionmaker: async_sessionmaker[AsyncSession], email: str) -> UUID:
    async with sessionmaker() as session:
        result = await session.execute(select(User.id).where(User.email == email))
        return result.scalar_one()


def test_registration_creates_default_foundation_records(
    foundation_context: FoundationTestContext,
) -> None:
    register(foundation_context.client)

    preferences = foundation_context.client.get("/api/v1/settings/preferences")
    profile = foundation_context.client.get("/api/v1/world/profile")
    notifications = foundation_context.client.get("/api/v1/notifications")
    events = foundation_context.client.get("/api/v1/domain-events?eventType=user.registered")
    audit_logs = foundation_context.client.get("/api/v1/audit-logs")

    assert preferences.status_code == 200
    assert preferences.json()["theme"] == "system"
    assert preferences.json()["defaultInterfaceMode"] == "command"
    assert preferences.json()["aiMemoryEnabled"] is False
    assert profile.status_code == 200
    assert profile.json()["currentLocationId"] == "central_plaza"
    assert profile.json()["unlockedLocationIds"] == [
        "central_plaza",
        "library",
        "habit_garden",
        "command_center",
    ]
    assert notifications.status_code == 200
    assert notifications.json()["unreadCount"] == 1
    assert notifications.json()["items"][0]["title"] == "Welcome to Aetherium"
    assert events.status_code == 200
    assert events.json()["total"] == 1
    assert audit_logs.status_code == 200
    assert any(item["action"] == "user.registered" for item in audit_logs.json()["items"])


def test_preferences_persist_and_record_event_and_audit_log(
    foundation_context: FoundationTestContext,
) -> None:
    register(foundation_context.client, email="prefs@example.com")

    update = foundation_context.client.patch(
        "/api/v1/settings/preferences",
        json={
            "theme": "dark",
            "reducedMotion": True,
            "timeZone": "UTC",
            "productAnalyticsEnabled": True,
        },
        headers={"Origin": VALID_ORIGIN},
    )
    persisted = foundation_context.client.get("/api/v1/settings/preferences")
    events = foundation_context.client.get(
        "/api/v1/domain-events?eventType=user.preference_updated"
    )
    audit_logs = foundation_context.client.get("/api/v1/audit-logs")

    assert update.status_code == 200
    assert update.json()["theme"] == "dark"
    assert update.json()["reducedMotion"] is True
    assert persisted.json()["theme"] == "dark"
    assert events.status_code == 200
    assert events.json()["total"] == 1
    assert any(item["action"] == "user.preference_updated" for item in audit_logs.json()["items"])


def test_invalid_preference_time_zone_rejected(
    foundation_context: FoundationTestContext,
) -> None:
    register(foundation_context.client, email="invalid-zone@example.com")

    response = foundation_context.client.patch(
        "/api/v1/settings/preferences",
        json={"timeZone": "Mars/Colony"},
        headers={"Origin": VALID_ORIGIN},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_failed"


def test_world_location_visit_is_idempotent(
    foundation_context: FoundationTestContext,
) -> None:
    register(foundation_context.client, email="world@example.com")

    first = foundation_context.client.post(
        "/api/v1/world/visit",
        json={"locationId": "library", "idempotencyKey": "visit-library-1"},
        headers={"Origin": VALID_ORIGIN},
    )
    second = foundation_context.client.post(
        "/api/v1/world/visit",
        json={"locationId": "library", "idempotencyKey": "visit-library-1"},
        headers={"Origin": VALID_ORIGIN},
    )
    events = foundation_context.client.get("/api/v1/domain-events?eventType=world.location_visited")

    assert first.status_code == 200
    assert first.json()["currentLocationId"] == "library"
    assert first.json()["lastVisitedLocationId"] == "central_plaza"
    assert second.status_code == 200
    assert second.json()["currentLocationId"] == "library"
    assert events.json()["total"] == 1


def test_locked_world_location_rejected(foundation_context: FoundationTestContext) -> None:
    register(foundation_context.client, email="locked@example.com")

    response = foundation_context.client.post(
        "/api/v1/world/visit",
        json={"locationId": "ai_hall", "idempotencyKey": "visit-ai-hall-1"},
        headers={"Origin": VALID_ORIGIN},
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "location_locked"


def test_world_profile_update_requires_unlocked_spawn(
    foundation_context: FoundationTestContext,
) -> None:
    register(foundation_context.client, email="spawn@example.com")

    response = foundation_context.client.patch(
        "/api/v1/world/profile",
        json={"spawnLocationId": "ai_hall"},
        headers={"Origin": VALID_ORIGIN},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "location_locked"


def test_notifications_support_read_unread_state(
    foundation_context: FoundationTestContext,
) -> None:
    register(foundation_context.client, email="notifications@example.com")

    page = foundation_context.client.get("/api/v1/notifications")
    notification_id = page.json()["items"][0]["id"]
    read = foundation_context.client.post(
        f"/api/v1/notifications/{notification_id}/read",
        headers={"Origin": VALID_ORIGIN},
    )
    unread = foundation_context.client.get("/api/v1/notifications?unreadOnly=true")
    repeat = foundation_context.client.post(
        f"/api/v1/notifications/{notification_id}/read",
        headers={"Origin": VALID_ORIGIN},
    )

    assert page.status_code == 200
    assert page.json()["unreadCount"] == 1
    assert read.status_code == 200
    assert read.json()["readAt"] is not None
    assert unread.json()["total"] == 0
    assert repeat.status_code == 200
    assert repeat.json()["readAt"] == read.json()["readAt"]


def test_cross_user_notification_access_returns_not_found(
    foundation_context: FoundationTestContext,
) -> None:
    register(foundation_context.client, email="owner@example.com")
    owner_notification_id = foundation_context.client.get("/api/v1/notifications").json()["items"][
        0
    ]["id"]

    with TestClient(foundation_context.client.app) as other_client:
        register(other_client, email="other@example.com")
        response = other_client.post(
            f"/api/v1/notifications/{owner_notification_id}/read",
            headers={"Origin": VALID_ORIGIN},
        )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_domain_events_are_idempotent_per_user(
    foundation_context: FoundationTestContext,
) -> None:
    register(foundation_context.client, email="events@example.com")
    payload = {
        "eventType": "habit.logged",
        "idempotencyKey": "habit-log-2026-07-20",
        "payload": {"habitId": "demo"},
    }

    first = foundation_context.client.post(
        "/api/v1/domain-events",
        json=payload,
        headers={"Origin": VALID_ORIGIN},
    )
    second = foundation_context.client.post(
        "/api/v1/domain-events",
        json=payload,
        headers={"Origin": VALID_ORIGIN},
    )
    page = foundation_context.client.get("/api/v1/domain-events?eventType=habit.logged")

    assert first.status_code == 201
    assert second.status_code == 200
    assert first.json()["id"] == second.json()["id"]
    assert page.json()["total"] == 1


def test_cross_user_domain_events_are_isolated(
    foundation_context: FoundationTestContext,
) -> None:
    register(foundation_context.client, email="event-owner@example.com")
    response = foundation_context.client.post(
        "/api/v1/domain-events",
        json={
            "eventType": "habit.logged",
            "idempotencyKey": "owner-habit-event",
            "payload": {"habitId": "owner"},
        },
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201

    with TestClient(foundation_context.client.app) as other_client:
        register(other_client, email="event-other@example.com")
        other_page = other_client.get("/api/v1/domain-events?eventType=habit.logged")

    assert other_page.status_code == 200
    assert other_page.json()["total"] == 0


def test_paginated_domain_events_are_bounded(
    foundation_context: FoundationTestContext,
) -> None:
    register(foundation_context.client, email="pagination@example.com")
    for index in range(3):
        response = foundation_context.client.post(
            "/api/v1/domain-events",
            json={
                "eventType": "habit.logged",
                "idempotencyKey": f"habit-event-{index}",
                "payload": {"index": index},
            },
            headers={"Origin": VALID_ORIGIN},
        )
        assert response.status_code == 201

    page = foundation_context.client.get(
        "/api/v1/domain-events?eventType=habit.logged&limit=1&offset=1"
    )
    invalid = foundation_context.client.get("/api/v1/domain-events?limit=101")

    assert page.status_code == 200
    assert page.json()["total"] == 3
    assert len(page.json()["items"]) == 1
    assert invalid.status_code == 422


def test_audit_metadata_is_sanitized(foundation_context: FoundationTestContext) -> None:
    register(foundation_context.client, email="audit@example.com")
    user_id = asyncio.run(get_user_id(foundation_context.sessionmaker, "audit@example.com"))

    async def record_sensitive_metadata() -> dict[str, object]:
        async with foundation_context.sessionmaker() as session:
            user = await session.get(User, user_id)
            assert user is not None
            service = UserDataService(session)
            log = await service.record_audit_log(
                user,
                action="security.test",
                metadata={
                    "password": "StrongPass123!",
                    "nested": {"sessionToken": "raw-token"},
                    "safe": "kept",
                },
            )
            await session.commit()
            return log.metadata_json

    metadata = asyncio.run(record_sensitive_metadata())

    assert metadata == {
        "nested": {"sessionToken": "[redacted]"},
        "password": "[redacted]",
        "safe": "kept",
    }


def test_audit_logs_are_user_scoped(foundation_context: FoundationTestContext) -> None:
    register(foundation_context.client, email="audit-owner@example.com")
    owner_page = foundation_context.client.get("/api/v1/audit-logs")
    owner_log_ids = {item["id"] for item in owner_page.json()["items"]}

    with TestClient(foundation_context.client.app) as other_client:
        register(other_client, email="audit-other@example.com")
        other_page = other_client.get("/api/v1/audit-logs")

    other_log_ids = {item["id"] for item in other_page.json()["items"]}

    assert owner_log_ids
    assert other_log_ids
    assert owner_log_ids.isdisjoint(other_log_ids)


def test_user_owned_endpoints_require_authentication(
    foundation_context: FoundationTestContext,
) -> None:
    assert foundation_context.client.get("/api/v1/settings/preferences").status_code == 401
    assert foundation_context.client.get("/api/v1/world/profile").status_code == 401
    assert foundation_context.client.get("/api/v1/notifications").status_code == 401
    assert foundation_context.client.get("/api/v1/domain-events").status_code == 401
    assert foundation_context.client.get("/api/v1/audit-logs").status_code == 401


def test_user_preferences_unique_owner_constraint(
    foundation_context: FoundationTestContext,
) -> None:
    register(foundation_context.client, email="constraint@example.com")
    owner_user_id = asyncio.run(
        get_user_id(foundation_context.sessionmaker, "constraint@example.com")
    )

    async def insert_duplicate_preferences() -> None:
        async with foundation_context.sessionmaker() as session:
            session.add_all(
                [
                    UserPreferences(owner_user_id=owner_user_id),
                    UserPreferences(owner_user_id=owner_user_id),
                ]
            )
            with pytest.raises(IntegrityError):
                await session.commit()

    asyncio.run(insert_duplicate_preferences())


def test_require_owner_rejects_cross_user_access() -> None:
    current_user = User(
        email="owner@example.com",
        normalized_email="owner@example.com",
        password_hash="hash",
        display_name="Owner",
    )
    current_user.id = uuid4()

    with pytest.raises(Exception) as exc_info:
        require_owner(
            current_user=current_user,
            owner_user_id=uuid4(),
            resource_name="Notification",
        )

    assert "Notification was not found" in str(exc_info.value)


def test_sanitize_audit_metadata_redacts_secret_values() -> None:
    assert sanitize_audit_metadata(
        {
            "apiKey": "key",
            "authorization": "bearer token",
            "safe": ["ok"],
            "text": "x" * 600,
        }
    ) == {
        "apiKey": "[redacted]",
        "authorization": "[redacted]",
        "safe": ["ok"],
        "text": f"{'x' * 512}...",
    }
