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
from app.models.knowledge import KnowledgeNode

VALID_ORIGIN = "http://localhost:3000"
VALID_PASSWORD = "StrongPass123!"


@dataclass(frozen=True)
class KnowledgeTestContext:
    client: TestClient
    sessionmaker: async_sessionmaker[AsyncSession]


@pytest.fixture()
def knowledge_context(monkeypatch: pytest.MonkeyPatch) -> Iterator[KnowledgeTestContext]:
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
        yield KnowledgeTestContext(client=client, sessionmaker=testing_sessionmaker)

    asyncio.run(engine.dispose())
    get_settings.cache_clear()


def register(client: TestClient, *, email: str = "knowledge@example.com") -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"displayName": "Knowledge User", "email": email, "password": VALID_PASSWORD},
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201


def create_topic(client: TestClient, *, name: str) -> dict[str, object]:
    response = client.post(
        "/api/v1/learning/topics",
        json={"description": f"{name} notes", "name": name},
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201
    return response.json()


async def get_user_id(sessionmaker: async_sessionmaker[AsyncSession], email: str) -> UUID:
    async with sessionmaker() as session:
        result = await session.execute(select(User.id).where(User.email == email))
        return result.scalar_one()


def test_knowledge_syncs_learning_prerequisites_and_related_topics(
    knowledge_context: KnowledgeTestContext,
) -> None:
    register(knowledge_context.client)
    topic = create_topic(knowledge_context.client, name="Pipelining")
    prerequisite = create_topic(knowledge_context.client, name="Digital Logic")

    relation = knowledge_context.client.post(
        f"/api/v1/learning/topics/{topic['id']}/prerequisites",
        json={"prerequisiteTopicId": prerequisite["id"]},
        headers={"Origin": VALID_ORIGIN},
    )
    prerequisites = knowledge_context.client.get(
        f"/api/v1/knowledge/topics/{topic['id']}/prerequisites"
    )
    related = knowledge_context.client.get(f"/api/v1/knowledge/topics/{topic['id']}/related")
    summary = knowledge_context.client.get("/api/v1/knowledge/summary")

    assert relation.status_code == 201
    assert prerequisites.status_code == 200
    assert prerequisites.json()["total"] == 1
    assert prerequisites.json()["items"][0]["node"]["title"] == "Digital Logic"
    assert prerequisites.json()["items"][0]["relationship"]["relationType"] == "requires"
    assert related.status_code == 200
    assert related.json()["total"] == 1
    assert summary.status_code == 200
    assert summary.json()["nodeCount"] >= 2
    assert summary.json()["relationshipCount"] >= 1


def test_knowledge_manual_nodes_and_relationships_are_idempotent(
    knowledge_context: KnowledgeTestContext,
) -> None:
    register(knowledge_context.client, email="manual-knowledge@example.com")
    topic = create_topic(knowledge_context.client, name="SQL Joins")
    skill = knowledge_context.client.post(
        "/api/v1/knowledge/nodes",
        json={"metadata": {"level": "beginner"}, "nodeType": "skill", "title": "Data Modeling"},
        headers={"Origin": VALID_ORIGIN},
    )
    topic_nodes = knowledge_context.client.get("/api/v1/knowledge/nodes?nodeType=topic&query=SQL")
    relationship_payload = {
        "evidence": {"approvedBy": "user"},
        "relationType": "related_to",
        "sourceNodeId": skill.json()["id"],
        "targetNodeId": topic_nodes.json()["items"][0]["id"],
        "weight": 0.5,
    }
    relationship = knowledge_context.client.post(
        "/api/v1/knowledge/relationships",
        json=relationship_payload,
        headers={"Origin": VALID_ORIGIN},
    )
    duplicate = knowledge_context.client.post(
        "/api/v1/knowledge/relationships",
        json=relationship_payload,
        headers={"Origin": VALID_ORIGIN},
    )
    invalid_source_node = knowledge_context.client.post(
        "/api/v1/knowledge/nodes",
        json={"nodeType": "topic", "title": "Unauthorized source node"},
        headers={"Origin": VALID_ORIGIN},
    )

    assert topic["name"] == "SQL Joins"
    assert skill.status_code == 201
    assert skill.json()["nodeType"] == "skill"
    assert topic_nodes.status_code == 200
    assert topic_nodes.json()["total"] == 1
    assert relationship.status_code == 201
    assert duplicate.status_code == 201
    assert duplicate.json()["id"] == relationship.json()["id"]
    assert invalid_source_node.status_code == 422


def test_knowledge_recommendations_use_real_mastery_records(
    knowledge_context: KnowledgeTestContext,
) -> None:
    register(knowledge_context.client, email="recommendations@example.com")
    topic = create_topic(knowledge_context.client, name="Cache Coherence")

    recommendations = knowledge_context.client.get("/api/v1/knowledge/recommendations?limit=5")

    assert recommendations.status_code == 200
    assert recommendations.json()["total"] >= 1
    assert recommendations.json()["items"][0]["topicId"] == topic["id"]
    assert recommendations.json()["items"][0]["priority"] == "high"
    assert "Mastery is below 50%" in recommendations.json()["items"][0]["reason"]


def test_knowledge_cross_user_isolation(knowledge_context: KnowledgeTestContext) -> None:
    register(knowledge_context.client, email="graph-owner@example.com")
    topic = create_topic(knowledge_context.client, name="Owner Topic")

    with TestClient(knowledge_context.client.app) as other_client:
        register(other_client, email="graph-other@example.com")
        other_nodes = other_client.get("/api/v1/knowledge/nodes")
        other_related = other_client.get(f"/api/v1/knowledge/topics/{topic['id']}/related")
        other_sync = other_client.post(
            "/api/v1/knowledge/sync",
            headers={"Origin": VALID_ORIGIN},
        )

    assert other_nodes.status_code == 200
    assert other_nodes.json()["total"] == 0
    assert other_related.status_code == 404
    assert other_sync.status_code == 200
    assert other_sync.json()["nodesCreated"] == 0


def test_knowledge_endpoints_require_authentication(
    knowledge_context: KnowledgeTestContext,
) -> None:
    response = knowledge_context.client.get("/api/v1/knowledge/nodes")
    mutation = knowledge_context.client.post(
        "/api/v1/knowledge/sync",
        headers={"Origin": VALID_ORIGIN},
    )

    assert response.status_code == 401
    assert mutation.status_code == 401


def test_knowledge_node_owner_source_constraint(
    knowledge_context: KnowledgeTestContext,
) -> None:
    register(knowledge_context.client, email="constraint-knowledge@example.com")
    user_id = asyncio.run(
        get_user_id(knowledge_context.sessionmaker, "constraint-knowledge@example.com")
    )

    async def insert_duplicate_nodes() -> None:
        async with knowledge_context.sessionmaker() as session:
            session.add_all(
                [
                    KnowledgeNode(
                        owner_user_id=user_id,
                        node_type="skill",
                        source_key="manual:skill:data-modeling",
                        title="Data Modeling",
                        open_url="/app/learning",
                        status="active",
                        metadata_json={},
                    ),
                    KnowledgeNode(
                        owner_user_id=user_id,
                        node_type="skill",
                        source_key="manual:skill:data-modeling",
                        title="Data Modeling",
                        open_url="/app/learning",
                        status="active",
                        metadata_json={},
                    ),
                ]
            )
            with pytest.raises(IntegrityError):
                await session.commit()

    asyncio.run(insert_duplicate_nodes())
