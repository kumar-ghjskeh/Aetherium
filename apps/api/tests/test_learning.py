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
from app.main import create_app
from app.models.auth import User
from app.models.learning import Subject

VALID_ORIGIN = "http://localhost:3000"
VALID_PASSWORD = "StrongPass123!"


@dataclass(frozen=True)
class LearningTestContext:
    client: TestClient
    sessionmaker: async_sessionmaker[AsyncSession]


@pytest.fixture()
def learning_context(monkeypatch: pytest.MonkeyPatch) -> Iterator[LearningTestContext]:
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
        yield LearningTestContext(client=client, sessionmaker=testing_sessionmaker)

    asyncio.run(engine.dispose())
    get_settings.cache_clear()


def register(client: TestClient, *, email: str = "learning@example.com") -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"displayName": "Learning User", "email": email, "password": VALID_PASSWORD},
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201


def create_subject(client: TestClient, *, name: str = "Computer Architecture") -> dict[str, object]:
    response = client.post(
        "/api/v1/learning/subjects",
        json={"description": "Hardware and systems topics.", "name": name},
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201
    return response.json()


def create_topic(
    client: TestClient,
    *,
    name: str = "Pipelining",
    subject_id: str | None = None,
) -> dict[str, object]:
    response = client.post(
        "/api/v1/learning/topics",
        json={
            "description": "Instruction overlap and hazards.",
            "name": name,
            "subjectId": subject_id,
        },
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201
    return response.json()


def create_quiz(client: TestClient, *, topic_id: str) -> dict[str, object]:
    response = client.post(
        "/api/v1/learning/quizzes",
        json={"title": "Pipeline hazards", "topicId": topic_id},
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201
    return response.json()


async def get_user_id(sessionmaker: async_sessionmaker[AsyncSession], email: str) -> UUID:
    async with sessionmaker() as session:
        result = await session.execute(select(User.id).where(User.email == email))
        return result.scalar_one()


def test_learning_subject_topic_mastery_and_search(
    learning_context: LearningTestContext,
) -> None:
    register(learning_context.client)
    subject = create_subject(learning_context.client)
    topic = create_topic(learning_context.client, subject_id=str(subject["id"]))

    topics = learning_context.client.get("/api/v1/learning/topics?limit=1&offset=0")
    mastery = learning_context.client.get(f"/api/v1/learning/topics/{topic['id']}/mastery")
    search = learning_context.client.post(
        "/api/v1/search",
        json={"entityTypes": ["learning_topic"], "query": "pipelining"},
        headers={"Origin": VALID_ORIGIN},
    )

    assert topics.status_code == 200
    assert topics.json()["total"] == 1
    assert mastery.status_code == 200
    assert mastery.json()["masteryScore"] == 0
    assert mastery.json()["calculation"]["method"] == "transparent_heuristic_v1"
    assert search.status_code == 200
    assert search.json()["total"] == 1
    assert search.json()["items"][0]["entityType"] == "learning_topic"
    assert search.json()["items"][0]["worldLocationId"] == "research_laboratory"


def test_learning_course_lesson_completion_records_event(
    learning_context: LearningTestContext,
) -> None:
    register(learning_context.client, email="lesson@example.com")
    subject = create_subject(learning_context.client)
    topic = create_topic(learning_context.client, subject_id=str(subject["id"]))
    course = learning_context.client.post(
        "/api/v1/learning/courses",
        json={"subjectId": subject["id"], "title": "Systems Path"},
        headers={"Origin": VALID_ORIGIN},
    )
    module = learning_context.client.post(
        f"/api/v1/learning/courses/{course.json()['id']}/modules",
        json={"position": 0, "title": "CPU Basics"},
        headers={"Origin": VALID_ORIGIN},
    )
    lesson = learning_context.client.post(
        f"/api/v1/learning/modules/{module.json()['id']}/lessons",
        json={"position": 0, "title": "Hazards", "topicId": topic["id"]},
        headers={"Origin": VALID_ORIGIN},
    )
    modules = learning_context.client.get(
        f"/api/v1/learning/modules?courseId={course.json()['id']}&limit=5&offset=0"
    )
    lessons = learning_context.client.get(
        f"/api/v1/learning/lessons?moduleId={module.json()['id']}&limit=5&offset=0"
    )
    completion = learning_context.client.post(
        f"/api/v1/learning/lessons/{lesson.json()['id']}/complete",
        headers={"Origin": VALID_ORIGIN},
    )
    mastery = learning_context.client.get(f"/api/v1/learning/topics/{topic['id']}/mastery")
    events = learning_context.client.get("/api/v1/domain-events?eventType=lesson.completed")

    assert course.status_code == 201
    assert module.status_code == 201
    assert lesson.status_code == 201
    assert modules.status_code == 200
    assert modules.json()["total"] == 1
    assert modules.json()["items"][0]["title"] == "CPU Basics"
    assert lessons.status_code == 200
    assert lessons.json()["total"] == 1
    assert lessons.json()["items"][0]["title"] == "Hazards"
    assert completion.status_code == 200
    assert completion.json()["status"] == "completed"
    assert mastery.json()["exerciseScore"] == 1
    assert events.status_code == 200
    assert events.json()["total"] == 1


def test_quiz_attempt_and_flashcard_review_recalculate_mastery(
    learning_context: LearningTestContext,
) -> None:
    register(learning_context.client, email="signals@example.com")
    topic = create_topic(learning_context.client)
    quiz = create_quiz(learning_context.client, topic_id=str(topic["id"]))
    question = learning_context.client.post(
        f"/api/v1/learning/quizzes/{quiz['id']}/questions",
        json={"prompt": "What is a data hazard?", "questionType": "free_text"},
        headers={"Origin": VALID_ORIGIN},
    )
    attempt = learning_context.client.post(
        f"/api/v1/learning/quizzes/{quiz['id']}/attempts",
        json={
            "confidence": 5,
            "hintsUsed": 1,
            "maxScore": 10,
            "questionId": question.json()["id"],
            "score": 8,
        },
        headers={"Origin": VALID_ORIGIN},
    )
    flashcard = learning_context.client.post(
        "/api/v1/learning/flashcards",
        json={
            "back": "A dependency between pipeline stages.",
            "front": "Data hazard",
            "topicId": topic["id"],
        },
        headers={"Origin": VALID_ORIGIN},
    )
    review = learning_context.client.post(
        f"/api/v1/learning/flashcards/{flashcard.json()['id']}/reviews",
        json={"confidence": 4, "rating": "good"},
        headers={"Origin": VALID_ORIGIN},
    )
    mastery = learning_context.client.get(f"/api/v1/learning/topics/{topic['id']}/mastery")
    events = learning_context.client.get("/api/v1/domain-events?eventType=quiz.completed")

    assert question.status_code == 201
    assert attempt.status_code == 201
    assert attempt.json()["accuracy"] == 0.8
    assert review.status_code == 201
    assert mastery.status_code == 200
    assert mastery.json()["quizAccuracy"] == 0.8
    assert mastery.json()["successfulRecallScore"] == 0.2
    assert mastery.json()["confidenceScore"] > 0
    assert mastery.json()["hintsPenalty"] == 0.2
    assert events.json()["total"] == 1


def test_learning_sessions_goals_roadmaps_and_validation(
    learning_context: LearningTestContext,
) -> None:
    register(learning_context.client, email="planning@example.com")
    topic = create_topic(learning_context.client)
    invalid_attempt = learning_context.client.post(
        "/api/v1/learning/quizzes/11111111-1111-4111-8111-111111111111/attempts",
        json={"maxScore": 1, "score": 2},
        headers={"Origin": VALID_ORIGIN},
    )
    session = learning_context.client.post(
        "/api/v1/learning/study-sessions",
        json={"mode": "quick_review", "notes": "Review hazards.", "topicId": topic["id"]},
        headers={"Origin": VALID_ORIGIN},
    )
    ended = learning_context.client.patch(
        f"/api/v1/learning/study-sessions/{session.json()['id']}/end",
        json={},
        headers={"Origin": VALID_ORIGIN},
    )
    goal = learning_context.client.post(
        "/api/v1/learning/goals",
        json={"targetDate": "2026-08-01", "title": "Master hazards", "topicId": topic["id"]},
        headers={"Origin": VALID_ORIGIN},
    )
    roadmap = learning_context.client.post(
        "/api/v1/learning/roadmaps",
        json={"steps": [{"label": "Review topic", "topicId": topic["id"]}], "title": "CPU path"},
        headers={"Origin": VALID_ORIGIN},
    )
    invalid_page = learning_context.client.get("/api/v1/learning/topics?limit=101")

    assert invalid_attempt.status_code == 422
    assert session.status_code == 201
    assert ended.status_code == 200
    assert ended.json()["durationMinutes"] >= 0
    assert goal.status_code == 201
    assert roadmap.status_code == 201
    assert invalid_page.status_code == 422


def test_learning_cross_user_isolation(learning_context: LearningTestContext) -> None:
    register(learning_context.client, email="owner@example.com")
    topic = create_topic(learning_context.client)
    course = learning_context.client.post(
        "/api/v1/learning/courses",
        json={"title": "Owner Course"},
        headers={"Origin": VALID_ORIGIN},
    )
    module = learning_context.client.post(
        f"/api/v1/learning/courses/{course.json()['id']}/modules",
        json={"position": 0, "title": "Owner Module"},
        headers={"Origin": VALID_ORIGIN},
    )
    lesson = learning_context.client.post(
        f"/api/v1/learning/modules/{module.json()['id']}/lessons",
        json={"position": 0, "title": "Owner Lesson", "topicId": topic["id"]},
        headers={"Origin": VALID_ORIGIN},
    )

    with TestClient(learning_context.client.app) as other_client:
        register(other_client, email="other-learning@example.com")
        other_mastery = other_client.get(f"/api/v1/learning/topics/{topic['id']}/mastery")
        other_quiz = other_client.post(
            "/api/v1/learning/quizzes",
            json={"title": "Other attempt", "topicId": topic["id"]},
            headers={"Origin": VALID_ORIGIN},
        )
        other_topics = other_client.get("/api/v1/learning/topics")
        other_modules = other_client.get("/api/v1/learning/modules")
        other_course_modules = other_client.get(
            f"/api/v1/learning/modules?courseId={course.json()['id']}"
        )
        other_lessons = other_client.get("/api/v1/learning/lessons")
        other_module_lessons = other_client.get(
            f"/api/v1/learning/lessons?moduleId={module.json()['id']}"
        )

    assert course.status_code == 201
    assert module.status_code == 201
    assert lesson.status_code == 201
    assert other_mastery.status_code == 404
    assert other_quiz.status_code == 404
    assert other_topics.status_code == 200
    assert other_topics.json()["total"] == 0
    assert other_modules.status_code == 200
    assert other_modules.json()["total"] == 0
    assert other_course_modules.status_code == 404
    assert other_lessons.status_code == 200
    assert other_lessons.json()["total"] == 0
    assert other_module_lessons.status_code == 404


def test_learning_duplicate_normalized_subject_constraint(
    learning_context: LearningTestContext,
) -> None:
    register(learning_context.client, email="constraint-learning@example.com")
    create_subject(learning_context.client, name="Digital Logic")
    duplicate = learning_context.client.post(
        "/api/v1/learning/subjects",
        json={"name": " digital   logic "},
        headers={"Origin": VALID_ORIGIN},
    )
    user_id = asyncio.run(
        get_user_id(learning_context.sessionmaker, "constraint-learning@example.com")
    )

    async def insert_duplicate_subjects() -> None:
        async with learning_context.sessionmaker() as session:
            session.add_all(
                [
                    Subject(
                        owner_user_id=user_id,
                        name="Signals",
                        normalized_name="signals",
                        status="active",
                    ),
                    Subject(
                        owner_user_id=user_id,
                        name="Signals",
                        normalized_name="signals",
                        status="active",
                    ),
                ]
            )
            with pytest.raises(IntegrityError):
                await session.commit()

    assert duplicate.status_code == 409
    asyncio.run(insert_duplicate_subjects())


def test_learning_endpoints_require_authentication(
    learning_context: LearningTestContext,
) -> None:
    response = learning_context.client.get("/api/v1/learning/topics")
    mutation = learning_context.client.post(
        "/api/v1/learning/subjects",
        json={"name": "Unauthenticated"},
        headers={"Origin": VALID_ORIGIN},
    )

    assert response.status_code == 401
    assert mutation.status_code == 401
