from __future__ import annotations

import asyncio
from collections.abc import Iterator
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

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
from app.dependencies.file_vault import get_object_storage_service
from app.main import create_app
from app.models.auth import User
from app.models.file_vault import Collection, FileRecord, Tag, UploadRecord
from app.services.object_storage import ObjectStat, PresignedObjectRequest

VALID_ORIGIN = "http://localhost:3000"
VALID_PASSWORD = "StrongPass123!"


@dataclass
class FakeObjectStorage:
    deleted_objects: list[tuple[str, str]] = field(default_factory=list)
    upload_requests: list[tuple[str, str, str]] = field(default_factory=list)
    download_requests: list[tuple[str, str, str]] = field(default_factory=list)

    async def create_presigned_upload(
        self,
        *,
        bucket: str,
        key: str,
        content_type: str,
        expires_in_seconds: int,
    ) -> PresignedObjectRequest:
        self.upload_requests.append((bucket, key, content_type))
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
        self.download_requests.append((bucket, key, download_name))
        return PresignedObjectRequest(
            expires_at=datetime.now(UTC) + timedelta(seconds=expires_in_seconds),
            headers={},
            method="GET",
            url=f"https://storage.test/{bucket}/{key}?operation=download",
        )

    async def head_object(self, *, bucket: str, key: str) -> ObjectStat:
        return ObjectStat(content_type="application/pdf", size_bytes=1024)

    async def delete_object(self, *, bucket: str, key: str) -> None:
        self.deleted_objects.append((bucket, key))


@dataclass(frozen=True)
class FileVaultTestContext:
    client: TestClient
    sessionmaker: async_sessionmaker[AsyncSession]
    storage: FakeObjectStorage


@pytest.fixture()
def file_vault_context(monkeypatch: pytest.MonkeyPatch) -> Iterator[FileVaultTestContext]:
    monkeypatch.setenv("AETHERIUM_APP_ENV", "test")
    monkeypatch.setenv("AETHERIUM_SESSION_SIGNING_SECRET", "aetherium-test-session-secret")
    monkeypatch.setenv("AETHERIUM_CORS_ORIGINS", VALID_ORIGIN)
    monkeypatch.setenv("AETHERIUM_OBJECT_STORAGE_BUCKET", "aetherium-private-files-test")
    monkeypatch.setenv(
        "AETHERIUM_OBJECT_STORAGE_DERIVED_ASSETS_BUCKET",
        "aetherium-derived-assets-test",
    )
    monkeypatch.setenv(
        "AETHERIUM_OBJECT_STORAGE_USER_AVATARS_BUCKET",
        "aetherium-user-avatars-test",
    )
    monkeypatch.delenv("AETHERIUM_AUTH_LOGIN_RATE_LIMIT_ATTEMPTS", raising=False)
    monkeypatch.delenv("AETHERIUM_AUTH_REGISTER_RATE_LIMIT_ATTEMPTS", raising=False)
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
        yield FileVaultTestContext(
            client=client,
            sessionmaker=testing_sessionmaker,
            storage=fake_storage,
        )

    asyncio.run(engine.dispose())
    get_settings.cache_clear()


def register(
    client: TestClient,
    *,
    email: str = "vault@example.com",
    display_name: str = "Vault User",
) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": VALID_PASSWORD, "displayName": display_name},
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201


def initiate_upload(
    client: TestClient,
    *,
    file_name: str = "notes.pdf",
    content_type: str = "application/pdf",
    idempotency_key: str | None = None,
) -> dict[str, object]:
    response = client.post(
        "/api/v1/files/uploads",
        json={
            "contentType": content_type,
            "fileName": file_name,
            "idempotencyKey": idempotency_key or f"upload-{uuid4()}",
            "sizeBytes": 1024,
        },
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201
    return response.json()


def complete_upload(
    client: TestClient,
    upload_id: str,
    *,
    display_name: str | None = None,
    idempotency_key: str | None = None,
) -> dict[str, object]:
    payload: dict[str, object] = {"idempotencyKey": idempotency_key or f"complete-{uuid4()}"}
    if display_name is not None:
        payload["displayName"] = display_name
    response = client.post(
        f"/api/v1/files/uploads/{upload_id}/complete",
        json=payload,
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201
    return response.json()


async def get_user_id(sessionmaker: async_sessionmaker[AsyncSession], email: str) -> UUID:
    async with sessionmaker() as session:
        result = await session.execute(select(User.id).where(User.email == email))
        return result.scalar_one()


def test_upload_flow_creates_file_event_and_audit_log(
    file_vault_context: FileVaultTestContext,
) -> None:
    register(file_vault_context.client)

    upload = initiate_upload(file_vault_context.client)
    file_payload = complete_upload(
        file_vault_context.client,
        str(upload["id"]),
        display_name="Lecture notes",
    )
    files = file_vault_context.client.get("/api/v1/files")
    events = file_vault_context.client.get("/api/v1/domain-events?eventType=file.uploaded")
    audit_logs = file_vault_context.client.get("/api/v1/audit-logs")

    assert upload["uploadUrl"].startswith("https://storage.test/aetherium-private-files-test/")
    assert "objectKey" not in upload
    assert upload["uploadHeaders"] == {"Content-Type": "application/pdf"}
    assert file_payload["displayName"] == "Lecture notes"
    assert file_payload["processingStatus"] == "not_started"
    assert file_payload["deletionStatus"] == "active"
    assert file_payload["malwareScanStatus"] == "not_configured"
    assert files.status_code == 200
    assert files.json()["total"] == 1
    assert events.json()["total"] == 1
    assert any(item["action"] == "file.uploaded" for item in audit_logs.json()["items"])


def test_upload_initiation_and_completion_are_idempotent(
    file_vault_context: FileVaultTestContext,
) -> None:
    register(file_vault_context.client, email="idempotent@example.com")

    first = file_vault_context.client.post(
        "/api/v1/files/uploads",
        json={
            "contentType": "text/plain",
            "fileName": "notes.txt",
            "idempotencyKey": "same-upload-key",
            "sizeBytes": 128,
        },
        headers={"Origin": VALID_ORIGIN},
    )
    second = file_vault_context.client.post(
        "/api/v1/files/uploads",
        json={
            "contentType": "text/plain",
            "fileName": "notes.txt",
            "idempotencyKey": "same-upload-key",
            "sizeBytes": 128,
        },
        headers={"Origin": VALID_ORIGIN},
    )
    completed = file_vault_context.client.post(
        f"/api/v1/files/uploads/{first.json()['id']}/complete",
        json={"idempotencyKey": "same-complete-key"},
        headers={"Origin": VALID_ORIGIN},
    )
    repeated = file_vault_context.client.post(
        f"/api/v1/files/uploads/{first.json()['id']}/complete",
        json={"idempotencyKey": "same-complete-key"},
        headers={"Origin": VALID_ORIGIN},
    )
    files = file_vault_context.client.get("/api/v1/files")

    assert first.status_code == 201
    assert second.status_code == 200
    assert first.json()["id"] == second.json()["id"]
    assert completed.status_code == 201
    assert repeated.status_code in {200, 201}
    assert completed.json()["id"] == repeated.json()["id"]
    assert files.json()["total"] == 1


@pytest.mark.parametrize(
    ("payload", "expected_code"),
    [
        (
            {
                "contentType": "application/pdf",
                "fileName": "folder/secrets.pdf",
                "idempotencyKey": "bad-path-upload",
                "sizeBytes": 1024,
            },
            "invalid_file_name",
        ),
        (
            {
                "contentType": "application/octet-stream",
                "fileName": "program.exe",
                "idempotencyKey": "bad-extension-upload",
                "sizeBytes": 1024,
            },
            "unsupported_file_type",
        ),
        (
            {
                "contentType": "text/plain",
                "fileName": "notes.pdf",
                "idempotencyKey": "bad-content-type-upload",
                "sizeBytes": 1024,
            },
            "unsupported_content_type",
        ),
        (
            {
                "contentType": "application/pdf",
                "fileName": "huge.pdf",
                "idempotencyKey": "too-large-upload",
                "sizeBytes": 50 * 1024 * 1024 + 1,
            },
            "validation_failed",
        ),
    ],
)
def test_upload_validation_rejects_unsafe_inputs(
    file_vault_context: FileVaultTestContext,
    payload: dict[str, object],
    expected_code: str,
) -> None:
    register(file_vault_context.client, email=f"{expected_code}@example.com")

    response = file_vault_context.client.post(
        "/api/v1/files/uploads",
        json=payload,
        headers={"Origin": VALID_ORIGIN},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == expected_code


def test_file_listing_supports_search_and_pagination(
    file_vault_context: FileVaultTestContext,
) -> None:
    register(file_vault_context.client, email="listing@example.com")
    first = complete_upload(
        file_vault_context.client,
        str(initiate_upload(file_vault_context.client, file_name="alpha.pdf")["id"]),
        display_name="Alpha Notes",
    )
    complete_upload(
        file_vault_context.client,
        str(initiate_upload(file_vault_context.client, file_name="beta.pdf")["id"]),
        display_name="Beta Notes",
    )

    page = file_vault_context.client.get("/api/v1/files?limit=1&offset=1")
    search = file_vault_context.client.get("/api/v1/files?query=Alpha")
    invalid = file_vault_context.client.get("/api/v1/files?limit=101")

    assert page.status_code == 200
    assert page.json()["total"] == 2
    assert len(page.json()["items"]) == 1
    assert search.status_code == 200
    assert search.json()["items"][0]["id"] == first["id"]
    assert invalid.status_code == 422


def test_file_metadata_favorites_tags_and_collections(
    file_vault_context: FileVaultTestContext,
) -> None:
    register(file_vault_context.client, email="organize@example.com")
    file_payload = complete_upload(
        file_vault_context.client,
        str(
            initiate_upload(
                file_vault_context.client, file_name="paper.md", content_type="text/markdown"
            )["id"]
        ),
        display_name="Paper Notes",
    )
    file_id = file_payload["id"]

    renamed = file_vault_context.client.patch(
        f"/api/v1/files/{file_id}",
        json={"displayName": "Renamed Paper"},
        headers={"Origin": VALID_ORIGIN},
    )
    favorited = file_vault_context.client.post(
        f"/api/v1/files/{file_id}/favorite",
        headers={"Origin": VALID_ORIGIN},
    )
    tagged = file_vault_context.client.post(
        f"/api/v1/files/{file_id}/tags",
        json={"color": "#8fd1c7", "name": "Research"},
        headers={"Origin": VALID_ORIGIN},
    )
    tags = file_vault_context.client.get("/api/v1/files/tags")
    collection = file_vault_context.client.post(
        "/api/v1/files/collections",
        json={"description": "Course material", "name": "Class Notes"},
        headers={"Origin": VALID_ORIGIN},
    )
    duplicate_collection = file_vault_context.client.post(
        "/api/v1/files/collections",
        json={"name": " class notes "},
        headers={"Origin": VALID_ORIGIN},
    )
    collected = file_vault_context.client.post(
        f"/api/v1/files/collections/{collection.json()['id']}/items",
        json={"fileId": file_id},
        headers={"Origin": VALID_ORIGIN},
    )
    favorite_page = file_vault_context.client.get("/api/v1/files?favoriteOnly=true")
    collection_page = file_vault_context.client.get(
        f"/api/v1/files?collectionId={collection.json()['id']}"
    )
    removed_collection = file_vault_context.client.delete(
        f"/api/v1/files/collections/{collection.json()['id']}/items/{file_id}",
        headers={"Origin": VALID_ORIGIN},
    )
    removed_tag = file_vault_context.client.delete(
        f"/api/v1/files/{file_id}/tags/{tags.json()['items'][0]['id']}",
        headers={"Origin": VALID_ORIGIN},
    )

    assert renamed.status_code == 200
    assert renamed.json()["displayName"] == "Renamed Paper"
    assert favorited.status_code == 200
    assert favorited.json()["isFavorite"] is True
    assert tagged.status_code == 200
    assert tagged.json()["tags"][0]["name"] == "Research"
    assert tags.json()["total"] == 1
    assert collection.status_code == 201
    assert duplicate_collection.status_code == 409
    assert collected.status_code == 200
    assert collection.json()["id"] in collected.json()["collectionIds"]
    assert favorite_page.json()["total"] == 1
    assert collection_page.json()["total"] == 1
    assert removed_collection.status_code == 200
    assert removed_collection.json()["collectionIds"] == []
    assert removed_tag.status_code == 200
    assert removed_tag.json()["tags"] == []


def test_soft_restore_and_permanent_delete(
    file_vault_context: FileVaultTestContext,
) -> None:
    register(file_vault_context.client, email="delete@example.com")
    file_payload = complete_upload(
        file_vault_context.client,
        str(initiate_upload(file_vault_context.client)["id"]),
    )
    file_id = file_payload["id"]

    deleted = file_vault_context.client.delete(
        f"/api/v1/files/{file_id}",
        headers={"Origin": VALID_ORIGIN},
    )
    get_deleted = file_vault_context.client.get(f"/api/v1/files/{file_id}")
    page = file_vault_context.client.get("/api/v1/files")
    deleted_page = file_vault_context.client.get("/api/v1/files?includeDeleted=true")
    restored = file_vault_context.client.post(
        f"/api/v1/files/{file_id}/restore",
        headers={"Origin": VALID_ORIGIN},
    )
    permanent_active = file_vault_context.client.delete(
        f"/api/v1/files/{file_id}/permanent",
        headers={"Origin": VALID_ORIGIN},
    )
    deleted_again = file_vault_context.client.delete(
        f"/api/v1/files/{file_id}",
        headers={"Origin": VALID_ORIGIN},
    )
    permanent = file_vault_context.client.delete(
        f"/api/v1/files/{file_id}/permanent",
        headers={"Origin": VALID_ORIGIN},
    )
    get_permanent = file_vault_context.client.get(f"/api/v1/files/{file_id}")

    assert deleted.status_code == 200
    assert deleted.json()["deletionStatus"] == "soft_deleted"
    assert get_deleted.status_code == 404
    assert page.json()["total"] == 0
    assert deleted_page.json()["total"] == 1
    assert restored.status_code == 200
    assert restored.json()["deletionStatus"] == "active"
    assert permanent_active.status_code == 409
    assert permanent_active.json()["error"]["code"] == "file_not_deleted"
    assert deleted_again.status_code == 200
    assert permanent.status_code == 204
    assert get_permanent.status_code == 404
    assert len(file_vault_context.storage.deleted_objects) == 1


def test_download_urls_are_owner_scoped(file_vault_context: FileVaultTestContext) -> None:
    register(file_vault_context.client, email="download-owner@example.com")
    file_payload = complete_upload(
        file_vault_context.client,
        str(initiate_upload(file_vault_context.client)["id"]),
    )
    file_id = file_payload["id"]
    owner_download = file_vault_context.client.get(f"/api/v1/files/{file_id}/download")

    with TestClient(file_vault_context.client.app) as other_client:
        register(other_client, email="download-other@example.com")
        other_get = other_client.get(f"/api/v1/files/{file_id}")
        other_download = other_client.get(f"/api/v1/files/{file_id}/download")
        other_delete = other_client.delete(
            f"/api/v1/files/{file_id}",
            headers={"Origin": VALID_ORIGIN},
        )
        other_page = other_client.get("/api/v1/files")

    assert owner_download.status_code == 200
    assert owner_download.json()["downloadMethod"] == "GET"
    assert owner_download.json()["downloadUrl"].endswith("operation=download")
    assert other_get.status_code == 404
    assert other_download.status_code == 404
    assert other_delete.status_code == 404
    assert other_page.json()["total"] == 0


def test_file_vault_endpoints_require_authentication(
    file_vault_context: FileVaultTestContext,
) -> None:
    assert file_vault_context.client.get("/api/v1/files").status_code == 401
    assert file_vault_context.client.get("/api/v1/files/collections").status_code == 401
    assert file_vault_context.client.get("/api/v1/files/tags").status_code == 401
    response = file_vault_context.client.post(
        "/api/v1/files/uploads",
        json={
            "contentType": "application/pdf",
            "fileName": "notes.pdf",
            "idempotencyKey": "unauth-upload",
            "sizeBytes": 1024,
        },
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 401


def test_file_vault_database_constraints(file_vault_context: FileVaultTestContext) -> None:
    register(file_vault_context.client, email="constraints@example.com")
    owner_user_id = asyncio.run(
        get_user_id(file_vault_context.sessionmaker, "constraints@example.com")
    )

    async def insert_duplicates() -> None:
        async with file_vault_context.sessionmaker() as session:
            file_id = uuid4()
            session.add(
                FileRecord(
                    id=file_id,
                    owner_user_id=owner_user_id,
                    display_name="Constrained",
                    original_file_name="constrained.pdf",
                    sanitized_file_name="constrained.pdf",
                    file_extension=".pdf",
                    file_kind="pdf",
                    content_type="application/pdf",
                    size_bytes=1024,
                    object_bucket="aetherium-private-files-test",
                    object_key="private/constrained/constrained.pdf",
                    processing_status="not_started",
                    deletion_status="active",
                    malware_scan_status="not_configured",
                )
            )
            session.add_all(
                [
                    UploadRecord(
                        owner_user_id=owner_user_id,
                        idempotency_key="duplicate-upload-key",
                        original_file_name="one.pdf",
                        sanitized_file_name="one.pdf",
                        file_extension=".pdf",
                        file_kind="pdf",
                        content_type="application/pdf",
                        size_bytes=1024,
                        object_bucket="aetherium-private-files-test",
                        object_key="private/one/one.pdf",
                        status="pending",
                        malware_scan_status="not_configured",
                        expires_at=datetime.now(UTC) + timedelta(minutes=15),
                    ),
                    UploadRecord(
                        owner_user_id=owner_user_id,
                        idempotency_key="duplicate-upload-key",
                        original_file_name="two.pdf",
                        sanitized_file_name="two.pdf",
                        file_extension=".pdf",
                        file_kind="pdf",
                        content_type="application/pdf",
                        size_bytes=1024,
                        object_bucket="aetherium-private-files-test",
                        object_key="private/two/two.pdf",
                        status="pending",
                        malware_scan_status="not_configured",
                        expires_at=datetime.now(UTC) + timedelta(minutes=15),
                    ),
                ]
            )
            session.add_all(
                [
                    Collection(
                        owner_user_id=owner_user_id,
                        name="Notes",
                        normalized_name="notes",
                    ),
                    Collection(
                        owner_user_id=owner_user_id,
                        name="notes",
                        normalized_name="notes",
                    ),
                ]
            )
            session.add_all(
                [
                    Tag(owner_user_id=owner_user_id, name="Research", normalized_name="research"),
                    Tag(owner_user_id=owner_user_id, name="research", normalized_name="research"),
                ]
            )
            with pytest.raises(IntegrityError):
                await session.commit()

    asyncio.run(insert_duplicates())
