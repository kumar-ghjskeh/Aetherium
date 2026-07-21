from __future__ import annotations

import asyncio
from collections.abc import Iterator
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import get_async_session
from app.dependencies.file_vault import get_object_storage_service
from app.main import create_app
from app.models.file_ingestion import EmbeddingJob, FileChunk, ProcessingJob
from app.services.file_ingestion import FileIngestionService
from app.services.object_storage import ObjectContent, ObjectStat, PresignedObjectRequest

VALID_ORIGIN = "http://localhost:3000"
VALID_PASSWORD = "StrongPass123!"


@dataclass
class FakeObjectStorage:
    body: bytes = b"Alpha systems notes.\n\nBeta concepts for retrieval."
    read_error: bool = False
    deleted_objects: list[tuple[str, str]] = field(default_factory=list)

    async def create_presigned_upload(
        self,
        *,
        bucket: str,
        key: str,
        content_type: str,
        expires_in_seconds: int,
    ) -> PresignedObjectRequest:
        return PresignedObjectRequest(
            expires_at=datetime.now(UTC) + timedelta(seconds=expires_in_seconds),
            headers={"Content-Type": content_type},
            method="PUT",
            url=f"https://storage.test/{bucket}/{key}?operation=upload",
        )

    async def create_presigned_download(
        self,
        *,
        bucket: str,
        key: str,
        download_name: str,
        expires_in_seconds: int,
    ) -> PresignedObjectRequest:
        return PresignedObjectRequest(
            expires_at=datetime.now(UTC) + timedelta(seconds=expires_in_seconds),
            headers={},
            method="GET",
            url=f"https://storage.test/{bucket}/{key}?operation=download",
        )

    async def head_object(self, *, bucket: str, key: str) -> ObjectStat:
        return ObjectStat(content_type="text/plain", size_bytes=len(self.body))

    async def read_object(self, *, bucket: str, key: str, max_bytes: int) -> ObjectContent:
        if self.read_error:
            from app.services.object_storage import ObjectStorageError

            raise ObjectStorageError("read failed")
        return ObjectContent(body=self.body[:max_bytes], content_type="text/plain")

    async def delete_object(self, *, bucket: str, key: str) -> None:
        self.deleted_objects.append((bucket, key))


@dataclass(frozen=True)
class FileIngestionTestContext:
    client: TestClient
    sessionmaker: async_sessionmaker[AsyncSession]
    storage: FakeObjectStorage


def create_context() -> Iterator[FileIngestionTestContext]:
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
    fake_storage = FakeObjectStorage()

    async def override_session() -> Iterator[AsyncSession]:
        async with testing_sessionmaker() as session:
            yield session

    app.dependency_overrides[get_async_session] = override_session
    app.dependency_overrides[get_object_storage_service] = lambda: fake_storage
    app.state.rate_limiter.reset()

    with TestClient(app) as client:
        yield FileIngestionTestContext(
            client=client,
            sessionmaker=testing_sessionmaker,
            storage=fake_storage,
        )

    asyncio.run(engine.dispose())
    get_settings.cache_clear()


def register(client: TestClient, *, email: str) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"displayName": "Ingestion User", "email": email, "password": VALID_PASSWORD},
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201


def upload_text_file(client: TestClient, *, file_name: str = "notes.txt") -> dict[str, object]:
    upload = client.post(
        "/api/v1/files/uploads",
        json={
            "contentType": "text/plain",
            "fileName": file_name,
            "idempotencyKey": f"upload-{uuid4()}",
            "sizeBytes": 128,
        },
        headers={"Origin": VALID_ORIGIN},
    )
    assert upload.status_code == 201
    completed = client.post(
        f"/api/v1/files/uploads/{upload.json()['id']}/complete",
        json={"idempotencyKey": f"complete-{uuid4()}", "displayName": "Notes"},
        headers={"Origin": VALID_ORIGIN},
    )
    assert completed.status_code == 201
    return completed.json()


async def process_next_job(context: FileIngestionTestContext) -> UUID | None:
    async with context.sessionmaker() as session:
        service = FileIngestionService(
            db=session,
            settings=get_settings(),
            storage=context.storage,
        )
        job = await service.process_next_job()
        await session.commit()
        return job.id if job is not None else None


async def count_records(context: FileIngestionTestContext) -> tuple[int, int, int]:
    async with context.sessionmaker() as session:
        chunks = await session.scalar(select(func.count(FileChunk.id)))
        jobs = await session.scalar(select(func.count(ProcessingJob.id)))
        embedding_jobs = await session.scalar(select(func.count(EmbeddingJob.id)))
        return int(chunks or 0), int(jobs or 0), int(embedding_jobs or 0)


def test_file_upload_queues_and_processes_text_chunks(monkeypatch) -> None:
    monkeypatch.setenv("AETHERIUM_APP_ENV", "test")
    monkeypatch.setenv("AETHERIUM_SESSION_SIGNING_SECRET", "aetherium-test-session-secret")
    monkeypatch.setenv("AETHERIUM_CORS_ORIGINS", VALID_ORIGIN)
    monkeypatch.setenv("AETHERIUM_OBJECT_STORAGE_BUCKET", "aetherium-private-files-test")
    monkeypatch.setenv("AETHERIUM_OBJECT_STORAGE_DERIVED_ASSETS_BUCKET", "aetherium-derived-test")
    monkeypatch.setenv("AETHERIUM_OBJECT_STORAGE_USER_AVATARS_BUCKET", "aetherium-avatars-test")

    for context in create_context():
        register(context.client, email="ingest@example.com")
        file_payload = upload_text_file(context.client)
        file_id = file_payload["id"]

        jobs = context.client.get("/api/v1/files/processing-jobs")
        repeated = context.client.post(
            f"/api/v1/files/{file_id}/processing-jobs",
            headers={"Origin": VALID_ORIGIN},
        )
        processed_job_id = asyncio.run(process_next_job(context))
        updated_file = context.client.get(f"/api/v1/files/{file_id}")
        chunks = context.client.get(f"/api/v1/files/{file_id}/chunks")
        events = context.client.get("/api/v1/domain-events?eventType=file.ingested")
        notifications = context.client.get("/api/v1/notifications")

        assert file_payload["processingStatus"] == "queued"
        assert jobs.status_code == 200
        assert jobs.json()["total"] == 1
        assert jobs.json()["items"][0]["status"] == "queued"
        assert repeated.status_code == 200
        assert processed_job_id is not None
        assert updated_file.json()["processingStatus"] == "ready"
        assert chunks.status_code == 200
        assert chunks.json()["total"] == 1
        assert "Alpha systems" in chunks.json()["items"][0]["chunkText"]
        assert events.json()["total"] == 1
        assert any(
            item["title"] == "File processing complete" for item in notifications.json()["items"]
        )


def test_file_processing_failure_is_visible_and_retryable(monkeypatch) -> None:
    monkeypatch.setenv("AETHERIUM_APP_ENV", "test")
    monkeypatch.setenv("AETHERIUM_SESSION_SIGNING_SECRET", "aetherium-test-session-secret")
    monkeypatch.setenv("AETHERIUM_CORS_ORIGINS", VALID_ORIGIN)
    monkeypatch.setenv("AETHERIUM_OBJECT_STORAGE_BUCKET", "aetherium-private-files-test")
    monkeypatch.setenv("AETHERIUM_OBJECT_STORAGE_DERIVED_ASSETS_BUCKET", "aetherium-derived-test")
    monkeypatch.setenv("AETHERIUM_OBJECT_STORAGE_USER_AVATARS_BUCKET", "aetherium-avatars-test")

    for context in create_context():
        register(context.client, email="retry@example.com")
        file_payload = upload_text_file(context.client)
        context.storage.read_error = True

        asyncio.run(process_next_job(context))
        failed_jobs = context.client.get("/api/v1/files/processing-jobs")
        job_id = failed_jobs.json()["items"][0]["id"]
        failed_file = context.client.get(f"/api/v1/files/{file_payload['id']}")
        retry = context.client.post(
            f"/api/v1/files/processing-jobs/{job_id}/retry",
            headers={"Origin": VALID_ORIGIN},
        )
        context.storage.read_error = False
        asyncio.run(process_next_job(context))
        ready_file = context.client.get(f"/api/v1/files/{file_payload['id']}")

        assert failed_file.json()["processingStatus"] == "failed"
        assert failed_jobs.json()["items"][0]["failureCount"] == 1
        assert failed_jobs.json()["items"][0]["lastErrorCode"] == "object_read_failed"
        assert retry.status_code == 200
        assert retry.json()["status"] == "queued"
        assert ready_file.json()["processingStatus"] == "ready"


def test_processing_jobs_and_chunks_are_owner_scoped(monkeypatch) -> None:
    monkeypatch.setenv("AETHERIUM_APP_ENV", "test")
    monkeypatch.setenv("AETHERIUM_SESSION_SIGNING_SECRET", "aetherium-test-session-secret")
    monkeypatch.setenv("AETHERIUM_CORS_ORIGINS", VALID_ORIGIN)
    monkeypatch.setenv("AETHERIUM_OBJECT_STORAGE_BUCKET", "aetherium-private-files-test")
    monkeypatch.setenv("AETHERIUM_OBJECT_STORAGE_DERIVED_ASSETS_BUCKET", "aetherium-derived-test")
    monkeypatch.setenv("AETHERIUM_OBJECT_STORAGE_USER_AVATARS_BUCKET", "aetherium-avatars-test")

    for context in create_context():
        register(context.client, email="owner@example.com")
        file_payload = upload_text_file(context.client)
        asyncio.run(process_next_job(context))
        owner_jobs = context.client.get("/api/v1/files/processing-jobs").json()["items"]
        job_id = owner_jobs[0]["id"]

        with TestClient(context.client.app) as other_client:
            register(other_client, email="other@example.com")
            other_jobs = other_client.get("/api/v1/files/processing-jobs")
            other_file_jobs = other_client.get(
                f"/api/v1/files/{file_payload['id']}/processing-jobs"
            )
            other_chunks = other_client.get(f"/api/v1/files/{file_payload['id']}/chunks")
            other_retry = other_client.post(
                f"/api/v1/files/processing-jobs/{job_id}/retry",
                headers={"Origin": VALID_ORIGIN},
            )

        assert other_jobs.status_code == 200
        assert other_jobs.json()["total"] == 0
        assert other_file_jobs.status_code == 404
        assert other_chunks.status_code == 404
        assert other_retry.status_code == 404


def test_permanent_delete_removes_derived_processing_records(monkeypatch) -> None:
    monkeypatch.setenv("AETHERIUM_APP_ENV", "test")
    monkeypatch.setenv("AETHERIUM_SESSION_SIGNING_SECRET", "aetherium-test-session-secret")
    monkeypatch.setenv("AETHERIUM_CORS_ORIGINS", VALID_ORIGIN)
    monkeypatch.setenv("AETHERIUM_OBJECT_STORAGE_BUCKET", "aetherium-private-files-test")
    monkeypatch.setenv("AETHERIUM_OBJECT_STORAGE_DERIVED_ASSETS_BUCKET", "aetherium-derived-test")
    monkeypatch.setenv("AETHERIUM_OBJECT_STORAGE_USER_AVATARS_BUCKET", "aetherium-avatars-test")

    for context in create_context():
        register(context.client, email="cleanup@example.com")
        file_payload = upload_text_file(context.client)
        asyncio.run(process_next_job(context))
        before = asyncio.run(count_records(context))

        deleted = context.client.delete(
            f"/api/v1/files/{file_payload['id']}",
            headers={"Origin": VALID_ORIGIN},
        )
        permanent = context.client.delete(
            f"/api/v1/files/{file_payload['id']}/permanent",
            headers={"Origin": VALID_ORIGIN},
        )
        after = asyncio.run(count_records(context))

        assert before == (1, 1, 1)
        assert deleted.status_code == 200
        assert permanent.status_code == 204
        assert after == (0, 0, 0)
