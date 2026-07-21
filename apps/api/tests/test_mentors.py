from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator, Iterator
from dataclasses import dataclass

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.db.base import Base
from app.db.session import get_async_session
from app.domain.ai import AETHERIUM_DETERMINISTIC_PROVIDER
from app.domain.mentors import DEFAULT_MENTORS
from app.main import create_app
from app.models.auth import User
from app.models.mentors import Mentor

VALID_ORIGIN = "http://localhost:3000"
VALID_PASSWORD = "StrongPass123!"


@dataclass(frozen=True)
class MentorTestContext:
    client: TestClient
    sessionmaker: async_sessionmaker[AsyncSession]


@pytest.fixture()
def mentor_context(monkeypatch: pytest.MonkeyPatch) -> Iterator[MentorTestContext]:
    from app.core.config import get_settings

    monkeypatch.setenv("AETHERIUM_APP_ENV", "test")
    monkeypatch.setenv("AETHERIUM_SESSION_SIGNING_SECRET", "aetherium-test-session-secret")
    monkeypatch.setenv("AETHERIUM_CORS_ORIGINS", VALID_ORIGIN)
    monkeypatch.setenv("AETHERIUM_AI_PROVIDER_DEFAULT", AETHERIUM_DETERMINISTIC_PROVIDER)
    monkeypatch.setenv("AETHERIUM_AI_RATE_LIMIT_ATTEMPTS", "20")
    monkeypatch.setenv("AETHERIUM_AI_RATE_LIMIT_WINDOW_SECONDS", "60")
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
        yield MentorTestContext(client=client, sessionmaker=testing_sessionmaker)

    asyncio.run(engine.dispose())
    get_settings.cache_clear()


def register(
    client: TestClient,
    *,
    email: str = "mentor@example.com",
    display_name: str = "Mentor User",
) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"displayName": display_name, "email": email, "password": VALID_PASSWORD},
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201


async def get_user(sessionmaker: async_sessionmaker[AsyncSession], email: str) -> User:
    async with sessionmaker() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one()
        await session.refresh(user)
        return user


def default_mentor_id(client: TestClient, *, slug: str = "lyra") -> str:
    response = client.get("/api/v1/mentors")
    assert response.status_code == 200
    mentor = next(item for item in response.json()["items"] if item["slug"] == slug)
    return str(mentor["id"])


def create_conversation(client: TestClient, mentor_id: str, *, title: str = "Index Study") -> str:
    response = client.post(
        "/api/v1/mentors/conversations",
        json={"mentorId": mentor_id, "title": title},
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201
    return str(response.json()["id"])


def test_default_mentors_are_created_per_user(mentor_context: MentorTestContext) -> None:
    register(mentor_context.client)

    response = mentor_context.client.get("/api/v1/mentors")

    assert response.status_code == 200
    payload = response.json()
    assert {item["slug"] for item in payload["items"]} == {
        mentor.slug for mentor in DEFAULT_MENTORS
    }
    assert all(item["isDefault"] for item in payload["items"])
    assert all(item["permissions"]["allowFileContent"] is False for item in payload["items"])


def test_custom_mentor_permissions_and_conversation_message_flow(
    mentor_context: MentorTestContext,
) -> None:
    register(mentor_context.client)
    created = mentor_context.client.post(
        "/api/v1/mentors",
        json={
            "allowedTools": ["explain", "quiz"],
            "description": "Focuses on rigorous conceptual review.",
            "fictionalIdentity": "A fictional synthesis mentor.",
            "name": "Ariadne",
            "systemInstructions": "Guide the learner through careful conceptual synthesis.",
            "tone": "analytical",
        },
        headers={"Origin": VALID_ORIGIN},
    )
    assert created.status_code == 201
    mentor_id = created.json()["id"]

    permissions = mentor_context.client.patch(
        f"/api/v1/mentors/{mentor_id}/permissions",
        json={"allowConversations": True, "allowedTools": ["explain", "flashcards"]},
        headers={"Origin": VALID_ORIGIN},
    )
    conversation_id = create_conversation(mentor_context.client, mentor_id)
    message = mentor_context.client.post(
        f"/api/v1/mentors/conversations/{conversation_id}/messages",
        json={"content": "Explain database indexes without using private files."},
        headers={"Origin": VALID_ORIGIN},
    )
    messages = mentor_context.client.get(
        f"/api/v1/mentors/conversations/{conversation_id}/messages"
    )
    usage = mentor_context.client.get("/api/v1/ai/usage")

    assert permissions.status_code == 200
    assert permissions.json()["allowConversations"] is True
    assert permissions.json()["allowedTools"] == ["explain", "flashcards"]
    assert message.status_code == 200
    assert message.json()["assistantMessage"]["status"] == "complete"
    assert message.json()["assistantMessage"]["providerName"] == AETHERIUM_DETERMINISTIC_PROVIDER
    assert messages.status_code == 200
    assert messages.json()["total"] == 2
    assert usage.status_code == 200
    assert usage.json()["total"] == 1
    assert "Explain database indexes" not in str(usage.json()["items"])


def test_conversation_lifecycle_edit_regenerate_export_archive_and_delete(
    mentor_context: MentorTestContext,
) -> None:
    register(mentor_context.client)
    conversation_id = create_conversation(
        mentor_context.client, default_mentor_id(mentor_context.client)
    )
    first = mentor_context.client.post(
        f"/api/v1/mentors/conversations/{conversation_id}/messages",
        json={"content": "Create a short review plan."},
        headers={"Origin": VALID_ORIGIN},
    )
    user_message_id = first.json()["userMessage"]["id"]
    assistant_message_id = first.json()["assistantMessage"]["id"]

    renamed = mentor_context.client.patch(
        f"/api/v1/mentors/conversations/{conversation_id}",
        json={"title": "Review Plan"},
        headers={"Origin": VALID_ORIGIN},
    )
    edited = mentor_context.client.patch(
        f"/api/v1/mentors/conversations/{conversation_id}/messages/{user_message_id}",
        json={"content": "Create a concise review plan."},
        headers={"Origin": VALID_ORIGIN},
    )
    regenerated = mentor_context.client.post(
        f"/api/v1/mentors/conversations/{conversation_id}/messages/{assistant_message_id}/regenerate",
        headers={"Origin": VALID_ORIGIN},
    )
    exported = mentor_context.client.get(f"/api/v1/mentors/conversations/{conversation_id}/export")
    stopped = mentor_context.client.post(
        f"/api/v1/mentors/conversations/{conversation_id}/stop",
        headers={"Origin": VALID_ORIGIN},
    )
    archived = mentor_context.client.post(
        f"/api/v1/mentors/conversations/{conversation_id}/archive",
        headers={"Origin": VALID_ORIGIN},
    )
    deleted = mentor_context.client.delete(
        f"/api/v1/mentors/conversations/{conversation_id}",
        headers={"Origin": VALID_ORIGIN},
    )
    after_delete = mentor_context.client.get(f"/api/v1/mentors/conversations/{conversation_id}")

    assert renamed.status_code == 200
    assert renamed.json()["title"] == "Review Plan"
    assert edited.status_code == 200
    assert edited.json()["userMessage"]["editedFromMessageId"] == user_message_id
    assert regenerated.status_code == 200
    assert (
        regenerated.json()["assistantMessage"]["regeneratedFromMessageId"] == assistant_message_id
    )
    assert exported.status_code == 200
    assert len(exported.json()["messages"]) >= 4
    assert stopped.status_code == 409
    assert stopped.json()["error"]["code"] == "generation_not_active"
    assert archived.status_code == 200
    assert archived.json()["status"] == "archived"
    assert deleted.status_code == 204
    assert after_delete.status_code == 404


def test_memory_update_honors_user_preference(mentor_context: MentorTestContext) -> None:
    register(mentor_context.client)
    conversation_id = create_conversation(
        mentor_context.client, default_mentor_id(mentor_context.client)
    )

    blocked = mentor_context.client.patch(
        f"/api/v1/mentors/conversations/{conversation_id}/memory",
        json={"memoryEnabled": True, "memoryPolicy": "persistent"},
        headers={"Origin": VALID_ORIGIN},
    )
    preference = mentor_context.client.patch(
        "/api/v1/settings/preferences",
        json={"aiMemoryEnabled": True},
        headers={"Origin": VALID_ORIGIN},
    )
    allowed = mentor_context.client.patch(
        f"/api/v1/mentors/conversations/{conversation_id}/memory",
        json={"memoryEnabled": True, "memoryPolicy": "persistent"},
        headers={"Origin": VALID_ORIGIN},
    )

    assert blocked.status_code == 403
    assert blocked.json()["error"]["code"] == "ai_memory_disabled"
    assert preference.status_code == 200
    assert allowed.status_code == 200
    assert allowed.json()["memoryEnabled"] is True
    assert allowed.json()["memoryPolicy"] == "persistent"


def test_mentor_conversations_are_cross_user_isolated(
    mentor_context: MentorTestContext,
) -> None:
    register(mentor_context.client, email="owner@example.com")
    conversation_id = create_conversation(
        mentor_context.client,
        default_mentor_id(mentor_context.client),
        title="Owner only",
    )

    with TestClient(mentor_context.client.app) as other_client:
        register(other_client, email="other@example.com")
        other_page = other_client.get("/api/v1/mentors/conversations")
        other_get = other_client.get(f"/api/v1/mentors/conversations/{conversation_id}")

    assert other_page.status_code == 200
    assert other_page.json()["total"] == 0
    assert other_get.status_code == 404


def test_mentor_conversation_titles_are_searchable(
    mentor_context: MentorTestContext,
) -> None:
    register(mentor_context.client, email="search-mentor@example.com")
    conversation_id = create_conversation(
        mentor_context.client,
        default_mentor_id(mentor_context.client),
        title="Topology Review",
    )

    response = mentor_context.client.post(
        "/api/v1/search",
        json={"entityTypes": ["ai_conversation"], "query": "topology"},
        headers={"Origin": VALID_ORIGIN},
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["entityId"] == conversation_id
    assert response.json()["items"][0]["matchReason"] == "ai_conversation"
    assert response.json()["items"][0]["openUrl"] == f"/app/ai?conversation={conversation_id}"


def test_mentor_endpoints_require_authentication(mentor_context: MentorTestContext) -> None:
    assert mentor_context.client.get("/api/v1/mentors").status_code == 401
    assert mentor_context.client.get("/api/v1/mentors/conversations").status_code == 401


def test_mentor_unique_owner_slug_constraint(mentor_context: MentorTestContext) -> None:
    register(mentor_context.client, email="constraint-mentor@example.com")
    user = asyncio.run(get_user(mentor_context.sessionmaker, "constraint-mentor@example.com"))

    async def insert_duplicates() -> None:
        async with mentor_context.sessionmaker() as session:
            session.add_all(
                [
                    Mentor(
                        owner_user_id=user.id,
                        slug="duplicate",
                        name="Duplicate",
                        fictional_identity="Fictional AI mentor.",
                        description="Duplicate mentor.",
                        system_instructions="Do not mutate data without explicit user approval.",
                    ),
                    Mentor(
                        owner_user_id=user.id,
                        slug="duplicate",
                        name="Duplicate two",
                        fictional_identity="Fictional AI mentor.",
                        description="Duplicate mentor.",
                        system_instructions="Do not mutate data without explicit user approval.",
                    ),
                ]
            )
            with pytest.raises(IntegrityError):
                await session.commit()

    asyncio.run(insert_duplicates())
