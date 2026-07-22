from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator, Iterator
from dataclasses import dataclass
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
from app.domain.ai import AETHERIUM_DETERMINISTIC_PROVIDER
from app.domain.file_vault import (
    FileDeletionStatus,
    FileKind,
    FileProcessingStatus,
    MalwareScanStatus,
)
from app.main import create_app
from app.models.auth import User
from app.models.coding import CodeSnippet
from app.models.file_vault import FileRecord

VALID_ORIGIN = "http://localhost:3000"
VALID_PASSWORD = "StrongPass123!"


@dataclass(frozen=True)
class CodingTestContext:
    client: TestClient
    sessionmaker: async_sessionmaker[AsyncSession]


@pytest.fixture()
def coding_context(monkeypatch: pytest.MonkeyPatch) -> Iterator[CodingTestContext]:
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
        yield CodingTestContext(client=client, sessionmaker=testing_sessionmaker)

    asyncio.run(engine.dispose())
    get_settings.cache_clear()


def register(client: TestClient, *, email: str = "coding@example.com") -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"displayName": "Coding User", "email": email, "password": VALID_PASSWORD},
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201


def create_project(client: TestClient, *, name: str = "Assembler Lab") -> dict[str, object]:
    response = client.post(
        "/api/v1/projects",
        json={
            "description": "Build a compact assembler.",
            "name": name,
            "objective": "Practice parsing and symbol resolution.",
        },
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201
    return response.json()


async def get_user_id(sessionmaker: async_sessionmaker[AsyncSession], email: str) -> UUID:
    async with sessionmaker() as session:
        result = await session.execute(select(User.id).where(User.email == email))
        return result.scalar_one()


async def create_owned_file(
    sessionmaker: async_sessionmaker[AsyncSession],
    *,
    owner_user_id: UUID,
) -> UUID:
    async with sessionmaker() as session:
        file_record = FileRecord(
            owner_user_id=owner_user_id,
            display_name="Assembler notes",
            original_file_name="assembler-notes.md",
            sanitized_file_name="assembler-notes.md",
            file_extension=".md",
            file_kind=FileKind.MARKDOWN.value,
            content_type="text/markdown",
            size_bytes=128,
            object_bucket="aetherium-private-files-test",
            object_key=f"{owner_user_id}/assembler-notes.md",
            processing_status=FileProcessingStatus.READY.value,
            deletion_status=FileDeletionStatus.ACTIVE.value,
            malware_scan_status=MalwareScanStatus.NOT_CONFIGURED.value,
        )
        session.add(file_record)
        await session.commit()
        return file_record.id


def test_coding_workspace_core_workflow(coding_context: CodingTestContext) -> None:
    register(coding_context.client)
    project = create_project(coding_context.client)
    snippet = coding_context.client.post(
        "/api/v1/coding/snippets",
        json={
            "content": "const symbolTable = new Map<string, number>();",
            "language": "typescript",
            "notes": "Assembler parser notes",
            "projectId": project["id"],
            "title": "Symbol table",
        },
        headers={"Origin": VALID_ORIGIN},
    )
    updated = coding_context.client.patch(
        f"/api/v1/coding/snippets/{snippet.json()['id']}",
        json={
            "content": "const symbolTable = new Map<string, number>();\nconsole.log(symbolTable);"
        },
        headers={"Origin": VALID_ORIGIN},
    )
    exercise = coding_context.client.post(
        "/api/v1/coding/exercises",
        json={
            "difficulty": "practice",
            "language": "typescript",
            "prompt": "Write a parser helper for labels.",
            "projectId": project["id"],
            "starterCode": "function parseLabel(line: string) { return line; }",
            "title": "Parse labels",
        },
        headers={"Origin": VALID_ORIGIN},
    )
    attempt = coding_context.client.post(
        f"/api/v1/coding/exercises/{exercise.json()['id']}/attempts",
        json={"snippetId": snippet.json()["id"], "submittedCode": updated.json()["content"]},
        headers={"Origin": VALID_ORIGIN},
    )
    explanation = coding_context.client.post(
        "/api/v1/coding/assistant/explain",
        json={"snippetId": snippet.json()["id"], "prompt": "Explain this briefly."},
        headers={"Origin": VALID_ORIGIN},
    )
    review = coding_context.client.post(
        "/api/v1/coding/assistant/review",
        json={"code": "SELECT * FROM files", "language": "sql"},
        headers={"Origin": VALID_ORIGIN},
    )
    assistant_history = coding_context.client.get("/api/v1/coding/assistant/requests")
    runner = coding_context.client.get("/api/v1/coding/runner/status")
    audit_logs = coding_context.client.get("/api/v1/audit-logs")

    assert snippet.status_code == 201
    assert snippet.json()["projectId"] == project["id"]
    assert updated.status_code == 200
    assert "console.log" in updated.json()["content"]
    assert exercise.status_code == 201
    assert exercise.json()["projectId"] == project["id"]
    assert attempt.status_code == 201
    assert attempt.json()["status"] == "submitted"
    assert explanation.status_code == 200
    assert explanation.json()["kind"] == "explain"
    assert explanation.json()["aiUsageRecordId"] is not None
    assert "Explain this briefly" in explanation.json()["response"]
    assert review.status_code == 200
    assert review.json()["kind"] == "review"
    assert assistant_history.status_code == 200
    assert assistant_history.json()["total"] == 2
    assert runner.status_code == 200
    assert runner.json()["availability"] == "unavailable"
    assert runner.json()["executionAvailable"] is False
    assert "no_aetherium_secrets" in runner.json()["securityRequirements"]
    assert all("symbolTable" not in str(item) for item in audit_logs.json()["items"])


def test_snippet_file_project_and_attempt_links_are_owner_scoped(
    coding_context: CodingTestContext,
) -> None:
    register(coding_context.client, email="coding-owner@example.com")
    owner_project = create_project(coding_context.client)
    owner_id = asyncio.run(get_user_id(coding_context.sessionmaker, "coding-owner@example.com"))
    file_id = asyncio.run(create_owned_file(coding_context.sessionmaker, owner_user_id=owner_id))
    snippet = coding_context.client.post(
        "/api/v1/coding/snippets",
        json={
            "content": "print('owned')",
            "fileId": str(file_id),
            "language": "python",
            "projectId": owner_project["id"],
            "title": "Owned snippet",
        },
        headers={"Origin": VALID_ORIGIN},
    )
    exercise = coding_context.client.post(
        "/api/v1/coding/exercises",
        json={"language": "python", "prompt": "Use the owned snippet.", "title": "Owned exercise"},
        headers={"Origin": VALID_ORIGIN},
    )

    with TestClient(coding_context.client.app) as other_client:
        register(other_client, email="coding-other@example.com")
        other_project = create_project(other_client, name="Other coding project")
        other_file_link = other_client.post(
            "/api/v1/coding/snippets",
            json={
                "content": "print('other')",
                "fileId": str(file_id),
                "language": "python",
                "title": "Other file link",
            },
            headers={"Origin": VALID_ORIGIN},
        )
        other_project_link = other_client.post(
            "/api/v1/coding/snippets",
            json={
                "content": "print('other')",
                "language": "python",
                "projectId": owner_project["id"],
                "title": "Other project link",
            },
            headers={"Origin": VALID_ORIGIN},
        )
        other_get_snippet = other_client.get(f"/api/v1/coding/snippets/{snippet.json()['id']}")
        other_attempt = other_client.post(
            f"/api/v1/coding/exercises/{exercise.json()['id']}/attempts",
            json={"submittedCode": "print('cross-user')"},
            headers={"Origin": VALID_ORIGIN},
        )
        other_valid_link = other_client.post(
            "/api/v1/coding/snippets",
            json={
                "content": "print('other valid')",
                "language": "python",
                "projectId": other_project["id"],
                "title": "Other valid link",
            },
            headers={"Origin": VALID_ORIGIN},
        )

    assert snippet.status_code == 201
    assert exercise.status_code == 201
    assert other_file_link.status_code == 404
    assert other_project_link.status_code == 404
    assert other_get_snippet.status_code == 404
    assert other_attempt.status_code == 404
    assert other_valid_link.status_code == 201


def test_coding_validation_pagination_archive_and_constraints(
    coding_context: CodingTestContext,
) -> None:
    register(coding_context.client, email="coding-validation@example.com")
    invalid = coding_context.client.post(
        "/api/v1/coding/snippets",
        json={"content": "", "language": "typescript", "title": ""},
        headers={"Origin": VALID_ORIGIN},
    )
    first = coding_context.client.post(
        "/api/v1/coding/snippets",
        json={"content": "const first = true;", "language": "typescript", "title": "First"},
        headers={"Origin": VALID_ORIGIN},
    )
    second = coding_context.client.post(
        "/api/v1/coding/snippets",
        json={"content": "const second = true;", "language": "typescript", "title": "Second"},
        headers={"Origin": VALID_ORIGIN},
    )
    archived = coding_context.client.post(
        f"/api/v1/coding/snippets/{first.json()['id']}/archive",
        headers={"Origin": VALID_ORIGIN},
    )
    active_page = coding_context.client.get("/api/v1/coding/snippets")
    full_page = coding_context.client.get("/api/v1/coding/snippets?includeArchived=true&limit=1")
    invalid_page = coding_context.client.get("/api/v1/coding/snippets?limit=101")

    assert invalid.status_code == 422
    assert first.status_code == 201
    assert second.status_code == 201
    assert archived.status_code == 200
    assert archived.json()["status"] == "archived"
    assert active_page.status_code == 200
    assert active_page.json()["total"] == 1
    assert full_page.status_code == 200
    assert full_page.json()["total"] == 2
    assert len(full_page.json()["items"]) == 1
    assert invalid_page.status_code == 422


def test_coding_endpoints_require_authentication(coding_context: CodingTestContext) -> None:
    list_response = coding_context.client.get("/api/v1/coding/snippets")
    create_response = coding_context.client.post(
        "/api/v1/coding/snippets",
        json={"content": "print('no auth')", "language": "python", "title": "No auth"},
        headers={"Origin": VALID_ORIGIN},
    )
    runner = coding_context.client.get("/api/v1/coding/runner/status")

    assert list_response.status_code == 401
    assert create_response.status_code == 401
    assert runner.status_code == 401


def test_coding_language_database_constraint(coding_context: CodingTestContext) -> None:
    register(coding_context.client, email="coding-constraint@example.com")
    user_id = asyncio.run(get_user_id(coding_context.sessionmaker, "coding-constraint@example.com"))

    async def insert_invalid_language() -> None:
        async with coding_context.sessionmaker() as session:
            session.add(
                CodeSnippet(
                    owner_user_id=user_id,
                    title="Invalid language",
                    language="ruby",
                    content="puts 'unsupported'",
                )
            )
            with pytest.raises(IntegrityError):
                await session.commit()

    asyncio.run(insert_invalid_language())
