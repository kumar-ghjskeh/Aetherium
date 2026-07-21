from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator, Iterator
from dataclasses import dataclass
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.db.base import Base
from app.db.session import get_async_session
from app.domain.ai import AETHERIUM_DETERMINISTIC_PROVIDER
from app.domain.file_ingestion import ChunkStatus, ProcessingJobStatus, ProcessingStage
from app.domain.file_vault import (
    FileDeletionStatus,
    FileKind,
    FileProcessingStatus,
    MalwareScanStatus,
)
from app.main import create_app
from app.models.auth import User
from app.models.file_ingestion import FileChunk, ProcessingJob
from app.models.file_vault import Collection, CollectionItem, FileRecord

VALID_ORIGIN = "http://localhost:3000"
VALID_PASSWORD = "StrongPass123!"


@dataclass(frozen=True)
class DocumentQATestContext:
    client: TestClient
    sessionmaker: async_sessionmaker[AsyncSession]


@pytest.fixture()
def document_qa_context(monkeypatch: pytest.MonkeyPatch) -> Iterator[DocumentQATestContext]:
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
        yield DocumentQATestContext(client=client, sessionmaker=testing_sessionmaker)

    asyncio.run(engine.dispose())
    get_settings.cache_clear()


def register(
    client: TestClient,
    *,
    email: str = "document-qa@example.com",
    display_name: str = "Document QA User",
) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"displayName": display_name, "email": email, "password": VALID_PASSWORD},
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201


def enable_document_file_access(
    client: TestClient,
    *,
    collection_ids: list[str] | None = None,
) -> None:
    response = client.patch(
        "/api/v1/ai/consent/document_qa",
        json={"allowFileContent": True, "allowedCollectionIds": collection_ids or []},
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 200


async def get_user(sessionmaker: async_sessionmaker[AsyncSession], email: str) -> User:
    async with sessionmaker() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one()
        await session.refresh(user)
        return user


async def insert_ready_chunk(
    sessionmaker: async_sessionmaker[AsyncSession],
    *,
    email: str,
    display_name: str,
    chunk_text: str,
    collection_name: str | None = None,
    embedding: list[float] | None = None,
) -> tuple[UUID, UUID | None]:
    async with sessionmaker() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one()
        file = FileRecord(
            owner_user_id=user.id,
            display_name=display_name,
            original_file_name=f"{display_name}.txt",
            sanitized_file_name=f"{display_name}.txt",
            file_extension=".txt",
            file_kind=FileKind.TEXT.value,
            content_type="text/plain",
            size_bytes=max(1, len(chunk_text.encode("utf-8"))),
            object_bucket="aetherium-private-files-test",
            object_key=f"users/{user.id}/files/{uuid4()}.txt",
            processing_status=FileProcessingStatus.READY.value,
            deletion_status=FileDeletionStatus.ACTIVE.value,
            malware_scan_status=MalwareScanStatus.NOT_CONFIGURED.value,
        )
        session.add(file)
        await session.flush()
        job = ProcessingJob(
            owner_user_id=user.id,
            file_id=file.id,
            idempotency_key=f"document-qa-test:{file.id}",
            status=ProcessingJobStatus.COMPLETED.value,
            stage=ProcessingStage.READY.value,
            attempt_count=1,
            max_attempts=3,
        )
        session.add(job)
        await session.flush()
        session.add(
            FileChunk(
                owner_user_id=user.id,
                file_id=file.id,
                processing_job_id=job.id,
                sequence_number=0,
                chunk_text=chunk_text,
                search_text=chunk_text,
                token_estimate=max(1, len(chunk_text) // 4),
                page_number=2,
                section_label="notes",
                status=ChunkStatus.READY.value,
                source_metadata={"test": True},
                embedding=embedding,
            )
        )
        collection_id = None
        if collection_name is not None:
            collection = Collection(
                owner_user_id=user.id,
                name=collection_name,
                normalized_name=collection_name.casefold(),
            )
            session.add(collection)
            await session.flush()
            session.add(
                CollectionItem(
                    owner_user_id=user.id,
                    collection_id=collection.id,
                    file_id=file.id,
                )
            )
            collection_id = collection.id
        await session.commit()
        return file.id, collection_id


def test_document_qa_requires_explicit_file_content_consent(
    document_qa_context: DocumentQATestContext,
) -> None:
    register(document_qa_context.client)
    file_id, _collection_id = asyncio.run(
        insert_ready_chunk(
            document_qa_context.sessionmaker,
            email="document-qa@example.com",
            display_name="Retrieval notes",
            chunk_text="Alpha systems use layered retrieval anchors.",
        )
    )

    response = document_qa_context.client.post(
        "/api/v1/ai/document-qa",
        json={"fileIds": [str(file_id)], "question": "What do alpha systems use?"},
        headers={"Origin": VALID_ORIGIN},
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "ai_data_consent_required"


def test_document_qa_returns_source_citations_and_usage(
    document_qa_context: DocumentQATestContext,
) -> None:
    register(document_qa_context.client)
    enable_document_file_access(document_qa_context.client)
    file_id, _collection_id = asyncio.run(
        insert_ready_chunk(
            document_qa_context.sessionmaker,
            email="document-qa@example.com",
            display_name="Retrieval notes",
            chunk_text="Alpha systems use layered retrieval anchors for source-grounded review.",
        )
    )

    response = document_qa_context.client.post(
        "/api/v1/ai/document-qa",
        json={
            "fileIds": [str(file_id)],
            "mode": "explain",
            "question": "What do alpha systems use?",
        },
        headers={"Origin": VALID_ORIGIN},
    )
    usage = document_qa_context.client.get("/api/v1/ai/usage?feature=document_qa")

    assert response.status_code == 200
    payload = response.json()
    assert payload["evidenceStatus"] == "supported"
    assert payload["citations"][0]["label"] == "S1"
    assert payload["citations"][0]["fileId"] == str(file_id)
    assert payload["citations"][0]["sourceType"] == "user_file_evidence"
    assert "[S1]" in payload["answer"]
    assert payload["usageRecordId"] is not None
    assert usage.json()["total"] == 1
    assert "layered retrieval anchors" not in str(usage.json()["items"])


def test_document_qa_returns_insufficient_evidence_without_fabricating_sources(
    document_qa_context: DocumentQATestContext,
) -> None:
    register(document_qa_context.client)
    enable_document_file_access(document_qa_context.client)
    asyncio.run(
        insert_ready_chunk(
            document_qa_context.sessionmaker,
            email="document-qa@example.com",
            display_name="Retrieval notes",
            chunk_text="Alpha systems use layered retrieval anchors.",
        )
    )

    response = document_qa_context.client.post(
        "/api/v1/ai/document-qa",
        json={"question": "What does the vault say about neutron stars?"},
        headers={"Origin": VALID_ORIGIN},
    )
    usage = document_qa_context.client.get("/api/v1/ai/usage?feature=document_qa")

    assert response.status_code == 200
    assert response.json()["evidenceStatus"] == "insufficient_evidence"
    assert response.json()["citations"] == []
    assert response.json()["usageRecordId"] is None
    assert usage.json()["total"] == 0


def test_document_qa_is_cross_user_isolated(document_qa_context: DocumentQATestContext) -> None:
    register(document_qa_context.client, email="owner@example.com")
    owner_file_id, _collection_id = asyncio.run(
        insert_ready_chunk(
            document_qa_context.sessionmaker,
            email="owner@example.com",
            display_name="Owner notes",
            chunk_text="Owner alpha content is private.",
        )
    )

    with TestClient(document_qa_context.client.app) as other_client:
        register(other_client, email="other@example.com")
        enable_document_file_access(other_client)
        direct = other_client.post(
            "/api/v1/ai/document-qa",
            json={"fileIds": [str(owner_file_id)], "question": "What is owner alpha?"},
            headers={"Origin": VALID_ORIGIN},
        )
        broad = other_client.post(
            "/api/v1/ai/document-qa",
            json={"question": "What is owner alpha?"},
            headers={"Origin": VALID_ORIGIN},
        )

    assert direct.status_code == 404
    assert broad.status_code == 200
    assert broad.json()["evidenceStatus"] == "insufficient_evidence"


def test_document_qa_honors_collection_consent_scope(
    document_qa_context: DocumentQATestContext,
) -> None:
    register(document_qa_context.client)
    _allowed_file_id, allowed_collection_id = asyncio.run(
        insert_ready_chunk(
            document_qa_context.sessionmaker,
            email="document-qa@example.com",
            display_name="Allowed notes",
            chunk_text="Allowed collection mentions matrix decomposition.",
            collection_name="Allowed",
        )
    )
    _blocked_file_id, blocked_collection_id = asyncio.run(
        insert_ready_chunk(
            document_qa_context.sessionmaker,
            email="document-qa@example.com",
            display_name="Blocked notes",
            chunk_text="Blocked collection mentions voltage regulators.",
            collection_name="Blocked",
        )
    )
    assert allowed_collection_id is not None
    assert blocked_collection_id is not None
    enable_document_file_access(
        document_qa_context.client,
        collection_ids=[str(allowed_collection_id)],
    )

    blocked_request = document_qa_context.client.post(
        "/api/v1/ai/document-qa",
        json={
            "collectionIds": [str(blocked_collection_id)],
            "question": "What mentions voltage regulators?",
        },
        headers={"Origin": VALID_ORIGIN},
    )
    allowed_request = document_qa_context.client.post(
        "/api/v1/ai/document-qa",
        json={"question": "What mentions matrix decomposition?"},
        headers={"Origin": VALID_ORIGIN},
    )

    assert blocked_request.status_code == 403
    assert blocked_request.json()["error"]["code"] == "collection_ai_consent_required"
    assert allowed_request.status_code == 200
    assert allowed_request.json()["evidenceStatus"] == "supported"
    assert allowed_request.json()["citations"][0]["fileName"] == "Allowed notes"


def test_document_qa_requires_authentication_and_valid_payload(
    document_qa_context: DocumentQATestContext,
) -> None:
    unauthenticated = document_qa_context.client.post(
        "/api/v1/ai/document-qa",
        json={"question": "What is indexed?"},
        headers={"Origin": VALID_ORIGIN},
    )
    register(document_qa_context.client, email="validation@example.com")
    invalid = document_qa_context.client.post(
        "/api/v1/ai/document-qa",
        json={"question": "  "},
        headers={"Origin": VALID_ORIGIN},
    )

    assert unauthenticated.status_code == 401
    assert invalid.status_code == 422
