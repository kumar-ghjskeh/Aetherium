from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator, Iterator
from dataclasses import dataclass
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import get_async_session
from app.domain.file_vault import (
    FileDeletionStatus,
    FileKind,
    FileProcessingStatus,
    MalwareScanStatus,
)
from app.main import create_app
from app.models.auth import User
from app.models.file_vault import FileRecord

VALID_ORIGIN = "http://localhost:3000"
VALID_PASSWORD = "StrongPass123!"


@dataclass(frozen=True)
class ProjectTestContext:
    client: TestClient
    sessionmaker: async_sessionmaker[AsyncSession]


@pytest.fixture()
def project_context(monkeypatch: pytest.MonkeyPatch) -> Iterator[ProjectTestContext]:
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
        yield ProjectTestContext(client=client, sessionmaker=testing_sessionmaker)

    asyncio.run(engine.dispose())
    get_settings.cache_clear()


def register(client: TestClient, *, email: str = "projects@example.com") -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"displayName": "Project User", "email": email, "password": VALID_PASSWORD},
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201


def create_project(client: TestClient, *, name: str = "Compiler Lab") -> dict[str, object]:
    response = client.post(
        "/api/v1/projects",
        json={
            "description": "Build a parser and optimization notes.",
            "name": name,
            "objective": "Finish a small compiler project.",
            "repositoryUrl": "https://example.com/aetherium/compiler-lab",
            "targetDate": "2026-08-01",
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
            display_name="Compiler notes",
            original_file_name="compiler-notes.md",
            sanitized_file_name="compiler-notes.md",
            file_extension=".md",
            file_kind=FileKind.MARKDOWN.value,
            content_type="text/markdown",
            size_bytes=128,
            object_bucket="aetherium-private-files-test",
            object_key=f"{owner_user_id}/compiler-notes.md",
            processing_status=FileProcessingStatus.READY.value,
            deletion_status=FileDeletionStatus.ACTIVE.value,
            malware_scan_status=MalwareScanStatus.NOT_CONFIGURED.value,
        )
        session.add(file_record)
        await session.commit()
        return file_record.id


def test_project_dock_core_workflow(project_context: ProjectTestContext) -> None:
    register(project_context.client)
    project = create_project(project_context.client)
    project_id = str(project["id"])

    milestone = project_context.client.post(
        f"/api/v1/projects/{project_id}/milestones",
        json={"position": 0, "title": "Parser complete"},
        headers={"Origin": VALID_ORIGIN},
    )
    task = project_context.client.post(
        f"/api/v1/projects/{project_id}/tasks",
        json={
            "milestoneId": milestone.json()["id"],
            "priority": "high",
            "title": "Write tokenizer",
        },
        headers={"Origin": VALID_ORIGIN},
    )
    done_task = project_context.client.patch(
        f"/api/v1/projects/tasks/{task.json()['id']}",
        json={"status": "done"},
        headers={"Origin": VALID_ORIGIN},
    )
    note = project_context.client.post(
        f"/api/v1/projects/{project_id}/notes",
        json={"body": "Use Pratt parsing for expressions.", "title": "Parser approach"},
        headers={"Origin": VALID_ORIGIN},
    )
    link = project_context.client.post(
        f"/api/v1/projects/{project_id}/links",
        json={"title": "Reference", "url": "https://example.com/compiler"},
        headers={"Origin": VALID_ORIGIN},
    )
    technology = project_context.client.post(
        f"/api/v1/projects/{project_id}/technologies",
        json={"name": "TypeScript"},
        headers={"Origin": VALID_ORIGIN},
    )
    blocker = project_context.client.post(
        f"/api/v1/projects/{project_id}/blockers",
        json={"description": "Need test fixtures.", "title": "Fixture gap"},
        headers={"Origin": VALID_ORIGIN},
    )
    resolved = project_context.client.patch(
        f"/api/v1/projects/blockers/{blocker.json()['id']}",
        json={"status": "resolved"},
        headers={"Origin": VALID_ORIGIN},
    )
    completed = project_context.client.patch(
        f"/api/v1/projects/{project_id}",
        json={"status": "completed"},
        headers={"Origin": VALID_ORIGIN},
    )
    detail = project_context.client.get(f"/api/v1/projects/{project_id}")
    activity = project_context.client.get(f"/api/v1/projects/{project_id}/activity")
    events = project_context.client.get("/api/v1/domain-events?eventType=project.completed")
    audit_logs = project_context.client.get("/api/v1/audit-logs")
    search = project_context.client.post(
        "/api/v1/search",
        json={"entityTypes": ["project", "task"], "query": "tokenizer"},
        headers={"Origin": VALID_ORIGIN},
    )

    assert milestone.status_code == 201
    assert task.status_code == 201
    assert done_task.status_code == 200
    assert done_task.json()["status"] == "done"
    assert note.status_code == 201
    assert link.status_code == 201
    assert technology.status_code == 201
    assert blocker.status_code == 201
    assert resolved.status_code == 200
    assert resolved.json()["resolvedAt"] is not None
    assert completed.status_code == 200
    assert completed.json()["completedAt"] is not None
    assert detail.status_code == 200
    assert len(detail.json()["milestones"]) == 1
    assert len(detail.json()["tasks"]) == 1
    assert len(detail.json()["notes"]) == 1
    assert len(detail.json()["links"]) == 1
    assert len(detail.json()["technologies"]) == 1
    assert activity.status_code == 200
    assert activity.json()["total"] >= 8
    assert events.status_code == 200
    assert events.json()["total"] == 1
    assert any(item["action"] == "project.completed" for item in audit_logs.json()["items"])
    assert search.status_code == 200
    assert search.json()["total"] >= 1
    assert search.json()["items"][0]["worldLocationId"] == "project_workshop"


def test_project_file_and_topic_links_are_owner_scoped(project_context: ProjectTestContext) -> None:
    register(project_context.client, email="project-links@example.com")
    project = create_project(project_context.client)
    owner_id = asyncio.run(get_user_id(project_context.sessionmaker, "project-links@example.com"))
    file_id = asyncio.run(create_owned_file(project_context.sessionmaker, owner_user_id=owner_id))
    topic = project_context.client.post(
        "/api/v1/learning/topics",
        json={"description": "Parser implementation techniques.", "name": "Parsing"},
        headers={"Origin": VALID_ORIGIN},
    )

    file_link = project_context.client.post(
        f"/api/v1/projects/{project['id']}/files",
        json={"description": "Design notes", "fileId": str(file_id)},
        headers={"Origin": VALID_ORIGIN},
    )
    topic_link = project_context.client.post(
        f"/api/v1/projects/{project['id']}/topics",
        json={"topicId": topic.json()["id"]},
        headers={"Origin": VALID_ORIGIN},
    )

    with TestClient(project_context.client.app) as other_client:
        register(other_client, email="project-links-other@example.com")
        other_project = create_project(other_client, name="Other project")
        other_file_link = other_client.post(
            f"/api/v1/projects/{other_project['id']}/files",
            json={"fileId": str(file_id)},
            headers={"Origin": VALID_ORIGIN},
        )
        other_topic_link = other_client.post(
            f"/api/v1/projects/{other_project['id']}/topics",
            json={"topicId": topic.json()["id"]},
            headers={"Origin": VALID_ORIGIN},
        )

    assert topic.status_code == 201
    assert file_link.status_code == 201
    assert topic_link.status_code == 201
    assert other_file_link.status_code == 404
    assert other_topic_link.status_code == 404


def test_project_validation_pagination_and_constraints(
    project_context: ProjectTestContext,
) -> None:
    register(project_context.client, email="project-validation@example.com")
    invalid = project_context.client.post(
        "/api/v1/projects",
        json={"name": ""},
        headers={"Origin": VALID_ORIGIN},
    )
    first = create_project(project_context.client, name="Project one")
    create_project(project_context.client, name="Project two")
    duplicate_position = project_context.client.post(
        f"/api/v1/projects/{first['id']}/milestones",
        json={"position": 0, "title": "First"},
        headers={"Origin": VALID_ORIGIN},
    )
    conflict = project_context.client.post(
        f"/api/v1/projects/{first['id']}/milestones",
        json={"position": 0, "title": "Second"},
        headers={"Origin": VALID_ORIGIN},
    )
    page = project_context.client.get("/api/v1/projects?limit=1&offset=1")
    invalid_page = project_context.client.get("/api/v1/projects?limit=101")

    assert invalid.status_code == 422
    assert duplicate_position.status_code == 201
    assert conflict.status_code == 409
    assert page.status_code == 200
    assert page.json()["total"] == 2
    assert len(page.json()["items"]) == 1
    assert invalid_page.status_code == 422


def test_project_cross_user_access_returns_not_found(project_context: ProjectTestContext) -> None:
    register(project_context.client, email="project-owner@example.com")
    project = create_project(project_context.client)
    task = project_context.client.post(
        f"/api/v1/projects/{project['id']}/tasks",
        json={"title": "Private task"},
        headers={"Origin": VALID_ORIGIN},
    )

    with TestClient(project_context.client.app) as other_client:
        register(other_client, email="project-other@example.com")
        other_get = other_client.get(f"/api/v1/projects/{project['id']}")
        other_patch_task = other_client.patch(
            f"/api/v1/projects/tasks/{task.json()['id']}",
            json={"status": "done"},
            headers={"Origin": VALID_ORIGIN},
        )

    assert task.status_code == 201
    assert other_get.status_code == 404
    assert other_patch_task.status_code == 404


def test_project_endpoints_require_authentication(project_context: ProjectTestContext) -> None:
    response = project_context.client.get("/api/v1/projects")
    create = project_context.client.post(
        "/api/v1/projects",
        json={"name": "Unauthorized project"},
        headers={"Origin": VALID_ORIGIN},
    )

    assert response.status_code == 401
    assert create.status_code == 401
