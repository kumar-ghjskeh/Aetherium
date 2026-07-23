from __future__ import annotations

import asyncio
from collections.abc import Iterator
from dataclasses import dataclass
from datetime import UTC, date, datetime
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
from app.domain.ai import AIFeature, AIOperation, AIProviderKind, AIUsageStatus
from app.domain.file_ingestion import (
    ProcessingFailureKind,
    ProcessingJobStatus,
    ProcessingStage,
)
from app.domain.file_vault import (
    FileDeletionStatus,
    FileKind,
    FileProcessingStatus,
    MalwareScanStatus,
)
from app.domain.learning import FlashcardReviewRating, FlashcardStatus, LearningRecordStatus
from app.domain.notifications import NotificationWorkflowStatus, NotificationWorkflowType
from app.domain.projects import (
    ProjectMilestoneStatus,
    ProjectPriority,
    ProjectStatus,
    ProjectTaskStatus,
)
from app.main import create_app
from app.models.ai import AIUsageRecord
from app.models.auth import User
from app.models.file_ingestion import ProcessingFailure, ProcessingJob
from app.models.file_vault import FileRecord
from app.models.learning import Flashcard, FlashcardReview, Subject, Topic
from app.models.notifications import NotificationWorkflowRecord
from app.models.projects import Project, ProjectMilestone, ProjectTask

VALID_ORIGIN = "http://localhost:3000"
VALID_PASSWORD = "StrongPass123!"
REFERENCE_DATE = date(2026, 7, 23)
REFERENCE_NOW = datetime(2026, 7, 23, 12, 0, tzinfo=UTC)


@dataclass(frozen=True)
class NotificationTestContext:
    client: TestClient
    sessionmaker: async_sessionmaker[AsyncSession]


@pytest.fixture()
def notification_context(monkeypatch: pytest.MonkeyPatch) -> Iterator[NotificationTestContext]:
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
        yield NotificationTestContext(client=client, sessionmaker=testing_sessionmaker)

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


async def seed_due_workflow_records(
    sessionmaker: async_sessionmaker[AsyncSession],
    owner_user_id: UUID,
) -> None:
    async with sessionmaker() as session:
        subject_id = uuid4()
        topic_id = uuid4()
        flashcard_id = uuid4()
        review_id = uuid4()
        file_id = uuid4()
        processing_job_id = uuid4()
        project_id = uuid4()
        milestone_id = uuid4()
        task_id = uuid4()
        session.add_all(
            [
                Subject(
                    id=subject_id,
                    owner_user_id=owner_user_id,
                    name="Computer Architecture",
                    normalized_name="computer architecture",
                    status=LearningRecordStatus.ACTIVE.value,
                ),
                Topic(
                    id=topic_id,
                    owner_user_id=owner_user_id,
                    subject_id=subject_id,
                    name="Pipelining",
                    normalized_name="pipelining",
                    status=LearningRecordStatus.ACTIVE.value,
                ),
                Flashcard(
                    id=flashcard_id,
                    owner_user_id=owner_user_id,
                    topic_id=topic_id,
                    front="Data hazard",
                    back="A dependency between pipeline stages.",
                    status=FlashcardStatus.ACTIVE.value,
                ),
                FlashcardReview(
                    id=review_id,
                    owner_user_id=owner_user_id,
                    flashcard_id=flashcard_id,
                    rating=FlashcardReviewRating.GOOD.value,
                    confidence=4,
                    reviewed_at=datetime(2026, 7, 20, tzinfo=UTC),
                    next_review_at=datetime(2026, 7, 22, tzinfo=UTC),
                ),
                FileRecord(
                    id=file_id,
                    owner_user_id=owner_user_id,
                    display_name="Upload failure",
                    original_file_name="upload-failure.txt",
                    sanitized_file_name="upload-failure.txt",
                    file_extension=".txt",
                    file_kind=FileKind.TEXT.value,
                    content_type="text/plain",
                    size_bytes=128,
                    object_bucket="aetherium-private-files",
                    object_key=f"{owner_user_id}/upload-failure.txt",
                    processing_status=FileProcessingStatus.FAILED.value,
                    deletion_status=FileDeletionStatus.ACTIVE.value,
                    malware_scan_status=MalwareScanStatus.NOT_CONFIGURED.value,
                ),
                ProcessingJob(
                    id=processing_job_id,
                    owner_user_id=owner_user_id,
                    file_id=file_id,
                    idempotency_key="processing-failure-seed",
                    status=ProcessingJobStatus.FAILED.value,
                    stage=ProcessingStage.FAILED.value,
                    attempt_count=1,
                    max_attempts=3,
                    next_attempt_at=REFERENCE_NOW,
                    last_error_code="extract_failed",
                    last_error_message="Extraction failed.",
                ),
                ProcessingFailure(
                    owner_user_id=owner_user_id,
                    file_id=file_id,
                    processing_job_id=processing_job_id,
                    failure_kind=ProcessingFailureKind.EXTRACTION.value,
                    error_code="extract_failed",
                    message="Extraction failed.",
                    retryable=True,
                ),
                AIUsageRecord(
                    owner_user_id=owner_user_id,
                    request_id="ai-failure-seed",
                    feature=AIFeature.GENERAL_CHAT.value,
                    provider_name="aetherium_deterministic",
                    provider_kind=AIProviderKind.AETHERIUM_DETERMINISTIC.value,
                    model_name="aetherium-deterministic-chat",
                    operation=AIOperation.CHAT_COMPLETION.value,
                    status=AIUsageStatus.FAILED.value,
                    error_code="provider_unavailable",
                    error_message="Provider unavailable.",
                ),
                Project(
                    id=project_id,
                    owner_user_id=owner_user_id,
                    name="Compiler Lab",
                    normalized_name="compiler lab",
                    status=ProjectStatus.ACTIVE.value,
                    target_date=date(2026, 7, 25),
                ),
                ProjectMilestone(
                    id=milestone_id,
                    owner_user_id=owner_user_id,
                    project_id=project_id,
                    title="Parser milestone",
                    status=ProjectMilestoneStatus.PLANNED.value,
                    due_date=date(2026, 7, 26),
                    position=0,
                ),
                ProjectTask(
                    id=task_id,
                    owner_user_id=owner_user_id,
                    project_id=project_id,
                    milestone_id=milestone_id,
                    title="Tokenize input",
                    status=ProjectTaskStatus.TODO.value,
                    priority=ProjectPriority.HIGH.value,
                    due_date=date(2026, 7, 24),
                ),
            ]
        )
        await session.commit()


def create_due_habit(client: TestClient) -> None:
    response = client.post(
        "/api/v1/habits",
        json={
            "name": "Deep reading",
            "scheduleType": "daily",
            "startsOn": "2026-07-01",
            "targetUnit": "pages",
            "targetValue": 1,
            "valueType": "quantity",
        },
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201


def run_workflows(client: TestClient) -> dict[str, object]:
    response = client.post(
        "/api/v1/notifications/workflows/run",
        json={"referenceDate": REFERENCE_DATE.isoformat()},
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 200
    return response.json()


def test_notification_preferences_persist(
    notification_context: NotificationTestContext,
) -> None:
    register(notification_context.client)

    defaults = notification_context.client.get("/api/v1/notifications/preferences")
    updated = notification_context.client.patch(
        "/api/v1/notifications/preferences",
        json={"habitRemindersEnabled": False, "reminderHour": 14},
        headers={"Origin": VALID_ORIGIN},
    )
    persisted = notification_context.client.get("/api/v1/notifications/preferences")
    invalid = notification_context.client.patch(
        "/api/v1/notifications/preferences",
        json={"reminderHour": 24},
        headers={"Origin": VALID_ORIGIN},
    )

    assert defaults.status_code == 200
    assert defaults.json()["habitRemindersEnabled"] is True
    assert updated.status_code == 200
    assert updated.json()["habitRemindersEnabled"] is False
    assert updated.json()["reminderHour"] == 14
    assert persisted.json()["habitRemindersEnabled"] is False
    assert invalid.status_code == 422


def test_due_workflows_generate_idempotent_owner_notifications(
    notification_context: NotificationTestContext,
) -> None:
    register(notification_context.client, email="workflow-owner@example.com")
    create_due_habit(notification_context.client)
    owner_user_id = asyncio.run(
        get_user_id(notification_context.sessionmaker, "workflow-owner@example.com")
    )
    asyncio.run(seed_due_workflow_records(notification_context.sessionmaker, owner_user_id))

    first = run_workflows(notification_context.client)
    second = run_workflows(notification_context.client)
    workflow_types = {record["workflowType"] for record in first["records"]}
    notifications = notification_context.client.get("/api/v1/notifications?limit=30&offset=0")

    assert first["generatedCount"] >= 7
    assert second["generatedCount"] == 0
    assert second["existingCount"] == len(first["records"])
    assert {
        "ai_provider_failure",
        "habit_reminder",
        "learning_review",
        "monthly_review",
        "processing_failure",
        "project_deadline",
        "weekly_review",
    }.issubset(workflow_types)
    assert notifications.status_code == 200
    assert any(
        item["title"] == "File processing needs attention" for item in notifications.json()["items"]
    )


def test_disabled_workflow_preferences_skip_categories(
    notification_context: NotificationTestContext,
) -> None:
    register(notification_context.client, email="disabled-workflows@example.com")
    create_due_habit(notification_context.client)
    owner_user_id = asyncio.run(
        get_user_id(notification_context.sessionmaker, "disabled-workflows@example.com")
    )
    asyncio.run(seed_due_workflow_records(notification_context.sessionmaker, owner_user_id))
    response = notification_context.client.patch(
        "/api/v1/notifications/preferences",
        json={"habitRemindersEnabled": False, "processingFailureEnabled": False},
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 200

    result = run_workflows(notification_context.client)
    workflow_types = {record["workflowType"] for record in result["records"]}

    assert "habit_reminder" not in workflow_types
    assert "processing_failure" not in workflow_types
    assert "weekly_review" in workflow_types


def test_monthly_reviews_are_owner_scoped(
    notification_context: NotificationTestContext,
) -> None:
    register(notification_context.client, email="review-owner@example.com")
    created = notification_context.client.post(
        "/api/v1/notifications/monthly-reviews",
        json={
            "monthStart": "2026-07-01",
            "wins": "Finished one strong review.",
            "challenges": None,
            "nextSteps": "Keep review sessions shorter.",
        },
        headers={"Origin": VALID_ORIGIN},
    )
    invalid = notification_context.client.post(
        "/api/v1/notifications/monthly-reviews",
        json={"monthStart": "2026-07-02"},
        headers={"Origin": VALID_ORIGIN},
    )
    owner_page = notification_context.client.get(
        "/api/v1/notifications/monthly-reviews?limit=5&offset=0"
    )

    with TestClient(notification_context.client.app) as other_client:
        register(other_client, email="review-other@example.com")
        other_page = other_client.get("/api/v1/notifications/monthly-reviews?limit=5&offset=0")

    assert created.status_code == 201
    assert created.json()["monthStart"] == "2026-07-01"
    assert invalid.status_code == 422
    assert owner_page.json()["total"] == 1
    assert other_page.status_code == 200
    assert other_page.json()["total"] == 0


def test_mark_all_notifications_read_is_owner_scoped(
    notification_context: NotificationTestContext,
) -> None:
    register(notification_context.client, email="mark-owner@example.com")

    with TestClient(notification_context.client.app) as other_client:
        register(other_client, email="mark-other@example.com")
        other_before = other_client.get("/api/v1/notifications")
        read_all = notification_context.client.post(
            "/api/v1/notifications/read-all",
            headers={"Origin": VALID_ORIGIN},
        )
        owner_after = notification_context.client.get("/api/v1/notifications")
        other_after = other_client.get("/api/v1/notifications")

    assert other_before.json()["unreadCount"] == 1
    assert read_all.status_code == 200
    assert read_all.json()["unreadCount"] == 0
    assert owner_after.json()["unreadCount"] == 0
    assert other_after.json()["unreadCount"] == 1


def test_notification_workflow_records_have_owner_source_constraint(
    notification_context: NotificationTestContext,
) -> None:
    register(notification_context.client, email="constraint@example.com")
    owner_user_id = asyncio.run(
        get_user_id(notification_context.sessionmaker, "constraint@example.com")
    )

    async def insert_duplicates() -> None:
        async with notification_context.sessionmaker() as session:
            session.add_all(
                [
                    NotificationWorkflowRecord(
                        owner_user_id=owner_user_id,
                        workflow_type=NotificationWorkflowType.WEEKLY_REVIEW.value,
                        source_key="weekly_review:2026-07-13",
                        status=NotificationWorkflowStatus.GENERATED.value,
                        scheduled_for=REFERENCE_NOW,
                    ),
                    NotificationWorkflowRecord(
                        owner_user_id=owner_user_id,
                        workflow_type=NotificationWorkflowType.WEEKLY_REVIEW.value,
                        source_key="weekly_review:2026-07-13",
                        status=NotificationWorkflowStatus.GENERATED.value,
                        scheduled_for=REFERENCE_NOW,
                    ),
                ]
            )
            with pytest.raises(IntegrityError):
                await session.commit()

    asyncio.run(insert_duplicates())


def test_notification_workflow_endpoints_require_authentication(
    notification_context: NotificationTestContext,
) -> None:
    assert notification_context.client.get("/api/v1/notifications/preferences").status_code == 401
    assert notification_context.client.get("/api/v1/notifications/workflows").status_code == 401
    assert (
        notification_context.client.post(
            "/api/v1/notifications/workflows/run",
            json={"referenceDate": REFERENCE_DATE.isoformat()},
            headers={"Origin": VALID_ORIGIN},
        ).status_code
        == 401
    )
    assert (
        notification_context.client.get("/api/v1/notifications/monthly-reviews").status_code == 401
    )
