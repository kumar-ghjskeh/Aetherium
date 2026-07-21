from __future__ import annotations

import asyncio
from collections.abc import Iterator
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import get_async_session
from app.dependencies.file_vault import get_object_storage_service
from app.main import create_app
from app.services.file_ingestion import FileIngestionService
from app.services.object_storage import ObjectContent, ObjectStat, PresignedObjectRequest

VALID_ORIGIN = "http://localhost:3000"
VALID_PASSWORD = "StrongPass123!"


@dataclass
class SearchFakeObjectStorage:
    body: bytes = b"Alpha systems notes.\n\nBeta retrieval concepts."
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
        return ObjectContent(body=self.body[:max_bytes], content_type="text/plain")

    async def delete_object(self, *, bucket: str, key: str) -> None:
        self.deleted_objects.append((bucket, key))


@dataclass(frozen=True)
class SearchTestContext:
    client: TestClient
    sessionmaker: async_sessionmaker[AsyncSession]
    storage: SearchFakeObjectStorage


def create_context() -> Iterator[SearchTestContext]:
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
    fake_storage = SearchFakeObjectStorage()

    async def override_session() -> Iterator[AsyncSession]:
        async with testing_sessionmaker() as session:
            yield session

    app.dependency_overrides[get_async_session] = override_session
    app.dependency_overrides[get_object_storage_service] = lambda: fake_storage
    app.state.rate_limiter.reset()

    with TestClient(app) as client:
        yield SearchTestContext(
            client=client,
            sessionmaker=testing_sessionmaker,
            storage=fake_storage,
        )

    asyncio.run(engine.dispose())
    get_settings.cache_clear()


def configure_env(monkeypatch) -> None:
    monkeypatch.setenv("AETHERIUM_APP_ENV", "test")
    monkeypatch.setenv("AETHERIUM_SESSION_SIGNING_SECRET", "aetherium-test-session-secret")
    monkeypatch.setenv("AETHERIUM_CORS_ORIGINS", VALID_ORIGIN)
    monkeypatch.setenv("AETHERIUM_OBJECT_STORAGE_BUCKET", "aetherium-private-files-test")
    monkeypatch.setenv("AETHERIUM_OBJECT_STORAGE_DERIVED_ASSETS_BUCKET", "aetherium-derived-test")
    monkeypatch.setenv("AETHERIUM_OBJECT_STORAGE_USER_AVATARS_BUCKET", "aetherium-avatars-test")


def register(client: TestClient, *, email: str) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"displayName": "Search User", "email": email, "password": VALID_PASSWORD},
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201


def upload_text_file(client: TestClient, *, display_name: str = "Alpha Notes") -> dict[str, object]:
    upload = client.post(
        "/api/v1/files/uploads",
        json={
            "contentType": "text/plain",
            "fileName": "alpha-notes.txt",
            "idempotencyKey": f"upload-{uuid4()}",
            "sizeBytes": 128,
        },
        headers={"Origin": VALID_ORIGIN},
    )
    assert upload.status_code == 201
    completed = client.post(
        f"/api/v1/files/uploads/{upload.json()['id']}/complete",
        json={"idempotencyKey": f"complete-{uuid4()}", "displayName": display_name},
        headers={"Origin": VALID_ORIGIN},
    )
    assert completed.status_code == 201
    return completed.json()


async def process_next_job(context: SearchTestContext) -> None:
    async with context.sessionmaker() as session:
        service = FileIngestionService(
            db=session,
            settings=get_settings(),
            storage=context.storage,
        )
        await service.process_next_job()
        await session.commit()


def seed_search_records(context: SearchTestContext) -> str:
    file_payload = upload_text_file(context.client)
    file_id = str(file_payload["id"])
    asyncio.run(process_next_job(context))
    collection = context.client.post(
        "/api/v1/files/collections",
        json={"name": "Alpha Research", "description": "Notes about retrieval systems."},
        headers={"Origin": VALID_ORIGIN},
    )
    tag = context.client.post(
        f"/api/v1/files/{file_id}/tags",
        json={"name": "alpha"},
        headers={"Origin": VALID_ORIGIN},
    )
    assert collection.status_code == 201
    assert tag.status_code == 200
    return file_id


def test_global_search_returns_owned_files_chunks_collections_and_tags(monkeypatch) -> None:
    configure_env(monkeypatch)

    for context in create_context():
        register(context.client, email="search@example.com")
        file_id = seed_search_records(context)

        response = context.client.post(
            "/api/v1/search",
            json={"query": "alpha", "limit": 10, "offset": 0},
            headers={"Origin": VALID_ORIGIN},
        )
        recent = context.client.get("/api/v1/search/recent")

        assert response.status_code == 200
        payload = response.json()
        assert payload["semanticEnabled"] is False
        assert payload["total"] == 4
        assert {item["entityType"] for item in payload["items"]} == {
            "collection",
            "file",
            "file_chunk",
            "tag",
        }
        chunk = next(item for item in payload["items"] if item["entityType"] == "file_chunk")
        assert "Alpha systems" in chunk["snippet"]
        assert chunk["source"]["fileId"] == file_id
        assert chunk["openUrl"].startswith(f"/app/library?file={file_id}")
        assert recent.status_code == 200
        assert recent.json()["total"] == 1
        assert recent.json()["items"][0]["query"] == "alpha"


def test_global_search_filters_entity_types_and_paginates(monkeypatch) -> None:
    configure_env(monkeypatch)

    for context in create_context():
        register(context.client, email="filtered@example.com")
        seed_search_records(context)

        response = context.client.post(
            "/api/v1/search",
            json={
                "entityTypes": ["file", "file_chunk"],
                "limit": 1,
                "offset": 1,
                "query": "alpha",
            },
            headers={"Origin": VALID_ORIGIN},
        )

        assert response.status_code == 200
        payload = response.json()
        assert payload["total"] == 2
        assert len(payload["items"]) == 1
        assert payload["items"][0]["entityType"] in {"file", "file_chunk"}


def test_global_search_is_owner_scoped(monkeypatch) -> None:
    configure_env(monkeypatch)

    for context in create_context():
        register(context.client, email="owner@example.com")
        seed_search_records(context)

        with TestClient(context.client.app) as other_client:
            register(other_client, email="other@example.com")
            other_search = other_client.post(
                "/api/v1/search",
                json={"query": "alpha"},
                headers={"Origin": VALID_ORIGIN},
            )
            other_recent = other_client.get("/api/v1/search/recent")

        owner_recent = context.client.get("/api/v1/search/recent")

        assert other_search.status_code == 200
        assert other_search.json()["total"] == 0
        assert other_recent.status_code == 200
        assert other_recent.json()["total"] == 1
        assert owner_recent.json()["total"] == 0


def test_global_search_requires_authentication(monkeypatch) -> None:
    configure_env(monkeypatch)

    for context in create_context():
        response = context.client.post(
            "/api/v1/search",
            json={"query": "alpha"},
            headers={"Origin": VALID_ORIGIN},
        )

        assert response.status_code == 401
