from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator, Iterator
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any
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
from app.domain.ai import AIFeature, AIOperation, AIProviderKind, AIUsageStatus
from app.domain.file_vault import (
    FileDeletionStatus,
    FileKind,
    FileProcessingStatus,
    MalwareScanStatus,
)
from app.main import create_app
from app.models.ai import AIUsageRecord
from app.models.auth import User
from app.models.file_vault import FileRecord

VALID_ORIGIN = "http://localhost:3000"
VALID_PASSWORD = "StrongPass123!"


@dataclass(frozen=True)
class AnalyticsTestContext:
    client: TestClient
    sessionmaker: async_sessionmaker[AsyncSession]


@pytest.fixture()
def analytics_context(monkeypatch: pytest.MonkeyPatch) -> Iterator[AnalyticsTestContext]:
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
        yield AnalyticsTestContext(client=client, sessionmaker=testing_sessionmaker)

    asyncio.run(engine.dispose())
    get_settings.cache_clear()


def register(client: TestClient, *, email: str = "analytics@example.com") -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"displayName": "Analytics User", "email": email, "password": VALID_PASSWORD},
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201


async def get_user_id(sessionmaker: async_sessionmaker[AsyncSession], email: str) -> UUID:
    async with sessionmaker() as session:
        result = await session.execute(select(User.id).where(User.email == email))
        return result.scalar_one()


async def insert_file_and_ai_usage(
    sessionmaker: async_sessionmaker[AsyncSession],
    *,
    owner_user_id: UUID,
) -> None:
    async with sessionmaker() as session:
        session.add(
            FileRecord(
                owner_user_id=owner_user_id,
                display_name="Processed notes",
                original_file_name="processed-notes.txt",
                sanitized_file_name="processed-notes.txt",
                file_extension=".txt",
                file_kind=FileKind.TEXT.value,
                content_type="text/plain",
                size_bytes=128,
                object_bucket="aetherium-private-files-test",
                object_key=f"{owner_user_id}/processed-notes.txt",
                processing_status=FileProcessingStatus.READY.value,
                deletion_status=FileDeletionStatus.ACTIVE.value,
                malware_scan_status=MalwareScanStatus.NOT_CONFIGURED.value,
            )
        )
        session.add(
            AIUsageRecord(
                owner_user_id=owner_user_id,
                request_id=f"analytics-{owner_user_id}",
                feature=AIFeature.GENERAL_CHAT.value,
                provider_name="aetherium_deterministic",
                provider_kind=AIProviderKind.AETHERIUM_DETERMINISTIC.value,
                model_name="aetherium-deterministic-chat",
                operation=AIOperation.CHAT_COMPLETION.value,
                status=AIUsageStatus.SUCCESS.value,
                input_tokens=10,
                output_tokens=5,
                total_tokens=15,
                estimated_cost_micro_usd=0,
                latency_ms=4,
                used_fallback=False,
            )
        )
        await session.commit()


def seed_learning_habit_project_data(client: TestClient) -> None:
    now = datetime.now(UTC)
    started_at = (now - timedelta(minutes=45)).isoformat()
    ended_at = now.isoformat()

    subject = client.post(
        "/api/v1/learning/subjects",
        json={"name": "Systems"},
        headers={"Origin": VALID_ORIGIN},
    )
    assert subject.status_code == 201
    topic = client.post(
        "/api/v1/learning/topics",
        json={"name": "Pipelines", "subjectId": subject.json()["id"]},
        headers={"Origin": VALID_ORIGIN},
    )
    assert topic.status_code == 201
    course = client.post(
        "/api/v1/learning/courses",
        json={"subjectId": subject.json()["id"], "title": "Architecture Path"},
        headers={"Origin": VALID_ORIGIN},
    )
    assert course.status_code == 201
    module = client.post(
        f"/api/v1/learning/courses/{course.json()['id']}/modules",
        json={"position": 0, "title": "CPU Basics"},
        headers={"Origin": VALID_ORIGIN},
    )
    assert module.status_code == 201
    lesson = client.post(
        f"/api/v1/learning/modules/{module.json()['id']}/lessons",
        json={"position": 0, "title": "Hazards", "topicId": topic.json()["id"]},
        headers={"Origin": VALID_ORIGIN},
    )
    assert lesson.status_code == 201
    complete_lesson = client.post(
        f"/api/v1/learning/lessons/{lesson.json()['id']}/complete",
        headers={"Origin": VALID_ORIGIN},
    )
    assert complete_lesson.status_code == 200
    session = client.post(
        "/api/v1/learning/study-sessions",
        json={"mode": "quick_review", "startedAt": started_at, "topicId": topic.json()["id"]},
        headers={"Origin": VALID_ORIGIN},
    )
    assert session.status_code == 201
    end_session = client.patch(
        f"/api/v1/learning/study-sessions/{session.json()['id']}/end",
        json={"endedAt": ended_at},
        headers={"Origin": VALID_ORIGIN},
    )
    assert end_session.status_code == 200
    quiz = client.post(
        "/api/v1/learning/quizzes",
        json={"title": "Hazards quiz", "topicId": topic.json()["id"]},
        headers={"Origin": VALID_ORIGIN},
    )
    assert quiz.status_code == 201
    attempt = client.post(
        f"/api/v1/learning/quizzes/{quiz.json()['id']}/attempts",
        json={"confidence": 4, "hintsUsed": 0, "maxScore": 10, "score": 8},
        headers={"Origin": VALID_ORIGIN},
    )
    assert attempt.status_code == 201

    habit = client.post(
        "/api/v1/habits",
        json={
            "name": "Deep reading",
            "scheduleType": "daily",
            "targetValue": 1,
            "valueType": "boolean",
        },
        headers={"Origin": VALID_ORIGIN},
    )
    assert habit.status_code == 201
    habit_log = client.post(
        f"/api/v1/habits/{habit.json()['id']}/logs",
        json={"logDate": now.date().isoformat(), "value": 1},
        headers={"Origin": VALID_ORIGIN},
    )
    assert habit_log.status_code == 201

    project = client.post(
        "/api/v1/projects",
        json={"name": "Compiler Lab", "objective": "Ship a parser prototype."},
        headers={"Origin": VALID_ORIGIN},
    )
    assert project.status_code == 201
    task = client.post(
        f"/api/v1/projects/{project.json()['id']}/tasks",
        json={"priority": "high", "title": "Tokenize input"},
        headers={"Origin": VALID_ORIGIN},
    )
    assert task.status_code == 201
    done = client.patch(
        f"/api/v1/projects/tasks/{task.json()['id']}",
        json={"status": "done"},
        headers={"Origin": VALID_ORIGIN},
    )
    assert done.status_code == 200
    completed = client.patch(
        f"/api/v1/projects/{project.json()['id']}",
        json={"status": "completed"},
        headers={"Origin": VALID_ORIGIN},
    )
    assert completed.status_code == 200


def metric(summary: dict[str, Any], key: str) -> dict[str, Any]:
    for item in summary["metrics"]:
        if item["key"] == key:
            return item
    raise AssertionError(f"Metric {key} not found")


def test_analytics_summary_uses_real_owner_data(analytics_context: AnalyticsTestContext) -> None:
    register(analytics_context.client)
    seed_learning_habit_project_data(analytics_context.client)
    owner_user_id = asyncio.run(
        get_user_id(analytics_context.sessionmaker, "analytics@example.com")
    )
    asyncio.run(
        insert_file_and_ai_usage(analytics_context.sessionmaker, owner_user_id=owner_user_id)
    )

    response = analytics_context.client.get("/api/v1/analytics/summary?period=month")

    assert response.status_code == 200
    summary = response.json()
    assert summary["period"] == "month"
    assert metric(summary, "study_minutes")["value"] == 45
    assert metric(summary, "lessons_completed")["value"] == 1
    assert metric(summary, "quiz_accuracy")["value"] == 0.8
    assert metric(summary, "habit_completions")["value"] == 1
    assert metric(summary, "project_progress")["value"] == 1
    assert metric(summary, "files_processed")["value"] == 1
    assert metric(summary, "ai_requests")["value"] == 1
    assert metric(summary, "ai_tokens")["value"] == 15
    assert metric(summary, "files_opened")["available"] is False
    assert metric(summary, "coding_sessions")["available"] is False
    assert any(bucket["studyMinutes"] == 45 for bucket in summary["trendBuckets"])
    assert any(bucket["projectsCompleted"] == 1 for bucket in summary["trendBuckets"])


def test_analytics_requires_authentication(analytics_context: AnalyticsTestContext) -> None:
    response = analytics_context.client.get("/api/v1/analytics/summary")

    assert response.status_code == 401


def test_analytics_is_owner_scoped(analytics_context: AnalyticsTestContext) -> None:
    register(analytics_context.client, email="owner-one@example.com")
    seed_learning_habit_project_data(analytics_context.client)
    analytics_context.client.post("/api/v1/auth/logout", headers={"Origin": VALID_ORIGIN})
    register(analytics_context.client, email="owner-two@example.com")

    response = analytics_context.client.get("/api/v1/analytics/summary?period=month")

    assert response.status_code == 200
    summary = response.json()
    assert metric(summary, "study_minutes")["value"] == 0
    assert metric(summary, "lessons_completed")["value"] == 0
    assert metric(summary, "habit_completions")["value"] == 0
    assert metric(summary, "project_progress")["available"] is False


def test_analytics_rejects_invalid_period(analytics_context: AnalyticsTestContext) -> None:
    register(analytics_context.client)

    response = analytics_context.client.get("/api/v1/analytics/summary?period=decade")

    assert response.status_code == 422
