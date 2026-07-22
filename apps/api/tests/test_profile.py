from __future__ import annotations

import asyncio
from collections.abc import Iterator
from dataclasses import dataclass
from datetime import UTC, datetime
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
from app.domain.file_vault import (
    FileDeletionStatus,
    FileKind,
    FileProcessingStatus,
    MalwareScanStatus,
)
from app.domain.projects import ProjectStatus
from app.main import create_app
from app.models.auth import User
from app.models.file_vault import FileRecord
from app.models.foundation import AuditLog
from app.models.profile import DataExportRequest, PrivacySettings, UserProfile
from app.models.projects import Project

VALID_ORIGIN = "http://localhost:3000"
VALID_PASSWORD = "StrongPass123!"


@dataclass(frozen=True)
class ProfileTestContext:
    client: TestClient
    sessionmaker: async_sessionmaker[AsyncSession]


@pytest.fixture()
def profile_context(monkeypatch: pytest.MonkeyPatch) -> Iterator[ProfileTestContext]:
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
        yield ProfileTestContext(client=client, sessionmaker=testing_sessionmaker)

    asyncio.run(engine.dispose())
    get_settings.cache_clear()


def register(
    client: TestClient,
    *,
    email: str = "profile@example.com",
    display_name: str = "Profile User",
) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"displayName": display_name, "email": email, "password": VALID_PASSWORD},
        headers={"Origin": VALID_ORIGIN},
    )
    assert response.status_code == 201


async def get_user_id(sessionmaker: async_sessionmaker[AsyncSession], email: str) -> UUID:
    async with sessionmaker() as session:
        result = await session.execute(select(User.id).where(User.email == email))
        return result.scalar_one()


async def create_owned_file(
    sessionmaker: async_sessionmaker[AsyncSession],
    *,
    owner_user_id: UUID,
    file_kind: FileKind = FileKind.IMAGE,
) -> UUID:
    extension = ".png" if file_kind == FileKind.IMAGE else ".pdf"
    content_type = "image/png" if file_kind == FileKind.IMAGE else "application/pdf"
    async with sessionmaker() as session:
        file_record = FileRecord(
            owner_user_id=owner_user_id,
            display_name=f"Profile {file_kind.value}",
            original_file_name=f"profile{extension}",
            sanitized_file_name=f"profile{extension}",
            file_extension=extension,
            file_kind=file_kind.value,
            content_type=content_type,
            size_bytes=1024,
            object_bucket="aetherium-private-files-test",
            object_key=f"{owner_user_id}/profile{extension}",
            processing_status=FileProcessingStatus.READY.value,
            deletion_status=FileDeletionStatus.ACTIVE.value,
            malware_scan_status=MalwareScanStatus.NOT_CONFIGURED.value,
        )
        session.add(file_record)
        await session.commit()
        return file_record.id


async def create_owned_project(
    sessionmaker: async_sessionmaker[AsyncSession],
    *,
    owner_user_id: UUID,
) -> UUID:
    async with sessionmaker() as session:
        project = Project(
            owner_user_id=owner_user_id,
            name="Profile Portfolio",
            normalized_name="profile portfolio",
            objective="Showcase a completed learning project.",
            status=ProjectStatus.ACTIVE.value,
        )
        session.add(project)
        await session.commit()
        return project.id


async def audit_actions(sessionmaker: async_sessionmaker[AsyncSession]) -> set[str]:
    async with sessionmaker() as session:
        result = await session.execute(select(AuditLog.action))
        return set(result.scalars().all())


def test_profile_defaults_update_and_auth_me_display_name(
    profile_context: ProfileTestContext,
) -> None:
    register(profile_context.client)

    profile = profile_context.client.get("/api/v1/users/profile")
    updated = profile_context.client.patch(
        "/api/v1/users/profile",
        json={
            "bio": "Building a personal learning operating system.",
            "displayName": "Updated Profile User",
            "headline": "Systems learner",
            "location": "UTC",
            "websiteUrl": "https://example.com/profile",
        },
        headers={"Origin": VALID_ORIGIN},
    )
    me = profile_context.client.get("/api/v1/auth/me")
    actions = asyncio.run(audit_actions(profile_context.sessionmaker))

    assert profile.status_code == 200
    assert profile.json()["displayName"] == "Profile User"
    assert profile.json()["avatarKind"] == "preset"
    assert profile.json()["avatarPreset"] == "lumen"
    assert updated.status_code == 200
    assert updated.json()["displayName"] == "Updated Profile User"
    assert updated.json()["websiteUrl"] == "https://example.com/profile"
    assert me.json()["displayName"] == "Updated Profile User"
    assert "profile.updated" in actions


def test_profile_avatar_file_must_be_owned_image(profile_context: ProfileTestContext) -> None:
    register(profile_context.client, email="avatar-owner@example.com")
    owner_id = asyncio.run(get_user_id(profile_context.sessionmaker, "avatar-owner@example.com"))
    owner_pdf_id = asyncio.run(
        create_owned_file(
            profile_context.sessionmaker, owner_user_id=owner_id, file_kind=FileKind.PDF
        )
    )
    owner_image_id = asyncio.run(
        create_owned_file(profile_context.sessionmaker, owner_user_id=owner_id)
    )

    with TestClient(profile_context.client.app) as other_client:
        register(other_client, email="avatar-other@example.com")
        other_id = asyncio.run(
            get_user_id(profile_context.sessionmaker, "avatar-other@example.com")
        )
        other_image_id = asyncio.run(
            create_owned_file(profile_context.sessionmaker, owner_user_id=other_id)
        )

    other_file = profile_context.client.patch(
        "/api/v1/users/profile",
        json={"avatarFileId": str(other_image_id)},
        headers={"Origin": VALID_ORIGIN},
    )
    non_image = profile_context.client.patch(
        "/api/v1/users/profile",
        json={"avatarFileId": str(owner_pdf_id)},
        headers={"Origin": VALID_ORIGIN},
    )
    image = profile_context.client.patch(
        "/api/v1/users/profile",
        json={"avatarFileId": str(owner_image_id)},
        headers={"Origin": VALID_ORIGIN},
    )

    assert other_file.status_code == 404
    assert non_image.status_code == 422
    assert non_image.json()["error"]["code"] == "avatar_file_must_be_image"
    assert image.status_code == 200
    assert image.json()["avatarKind"] == "vault_file"
    assert image.json()["avatarFileId"] == str(owner_image_id)


def test_profile_links_favorites_and_certificates_are_owner_scoped(
    profile_context: ProfileTestContext,
) -> None:
    register(profile_context.client, email="owner-scoped@example.com")
    owner_id = asyncio.run(get_user_id(profile_context.sessionmaker, "owner-scoped@example.com"))
    project_id = asyncio.run(
        create_owned_project(profile_context.sessionmaker, owner_user_id=owner_id)
    )

    link = profile_context.client.post(
        "/api/v1/users/profile/links",
        json={"linkType": "portfolio", "title": "Portfolio", "url": "https://example.com/work"},
        headers={"Origin": VALID_ORIGIN},
    )
    duplicate_link = profile_context.client.post(
        "/api/v1/users/profile/links",
        json={"linkType": "portfolio", "title": "Portfolio", "url": "https://example.com/work"},
        headers={"Origin": VALID_ORIGIN},
    )
    favorite_project = profile_context.client.post(
        "/api/v1/users/profile/favorite-projects",
        json={"projectId": str(project_id)},
        headers={"Origin": VALID_ORIGIN},
    )
    favorite_resource = profile_context.client.post(
        "/api/v1/users/profile/favorite-resources",
        json={
            "notes": "Important reference.",
            "resourceType": "external_link",
            "title": "Portfolio guide",
            "url": "https://example.com/guide",
        },
        headers={"Origin": VALID_ORIGIN},
    )
    certificate = profile_context.client.post(
        "/api/v1/users/profile/certificates",
        json={
            "credentialUrl": "https://example.com/certificate",
            "issuedOn": "2026-07-01",
            "issuer": "Aetherium Lab",
            "title": "Learning Systems",
        },
        headers={"Origin": VALID_ORIGIN},
    )
    links_page = profile_context.client.get("/api/v1/users/profile/links")
    favorites_page = profile_context.client.get("/api/v1/users/profile/favorite-resources")
    certificates_page = profile_context.client.get("/api/v1/users/profile/certificates")

    with TestClient(profile_context.client.app) as other_client:
        register(other_client, email="owner-scoped-other@example.com")
        other_favorite = other_client.post(
            "/api/v1/users/profile/favorite-projects",
            json={"projectId": str(project_id)},
            headers={"Origin": VALID_ORIGIN},
        )
        other_delete_link = other_client.delete(
            f"/api/v1/users/profile/links/{link.json()['id']}",
            headers={"Origin": VALID_ORIGIN},
        )

    assert link.status_code == 201
    assert duplicate_link.status_code == 409
    assert favorite_project.status_code == 201
    assert favorite_project.json()["projectId"] == str(project_id)
    assert favorite_resource.status_code == 201
    assert certificate.status_code == 201
    assert certificate.json()["title"] == "Learning Systems"
    assert links_page.json()["total"] == 1
    assert favorites_page.json()["total"] == 1
    assert certificates_page.json()["total"] == 1
    assert other_favorite.status_code == 404
    assert other_delete_link.status_code == 404


def test_privacy_updates_preferences_and_records_audit(
    profile_context: ProfileTestContext,
) -> None:
    register(profile_context.client, email="privacy@example.com")

    defaults = profile_context.client.get("/api/v1/users/privacy")
    updated = profile_context.client.patch(
        "/api/v1/users/privacy",
        json={
            "aiMemoryEnabled": True,
            "allowProfileInAiContext": True,
            "includeProfileInExports": False,
            "productAnalyticsEnabled": True,
            "profileVisibility": "unlisted",
            "showEmailOnProfile": True,
        },
        headers={"Origin": VALID_ORIGIN},
    )
    preferences = profile_context.client.get("/api/v1/settings/preferences")
    actions = asyncio.run(audit_actions(profile_context.sessionmaker))

    assert defaults.status_code == 200
    assert defaults.json()["profileVisibility"] == "private"
    assert defaults.json()["aiMemoryEnabled"] is False
    assert updated.status_code == 200
    assert updated.json()["profileVisibility"] == "unlisted"
    assert updated.json()["allowProfileInAiContext"] is True
    assert updated.json()["includeProfileInExports"] is False
    assert preferences.json()["aiMemoryEnabled"] is True
    assert preferences.json()["productAnalyticsEnabled"] is True
    assert "privacy.updated" in actions
    assert "user.preference_updated" in actions


def test_data_export_requests_are_idempotent_and_notify(
    profile_context: ProfileTestContext,
) -> None:
    register(profile_context.client, email="export@example.com")
    payload = {
        "idempotencyKey": "export-request-1",
        "includedCategories": ["profile", "settings"],
        "note": "Need a profile copy.",
    }

    first = profile_context.client.post(
        "/api/v1/users/data-export-requests",
        json=payload,
        headers={"Origin": VALID_ORIGIN},
    )
    second = profile_context.client.post(
        "/api/v1/users/data-export-requests",
        json=payload,
        headers={"Origin": VALID_ORIGIN},
    )
    page = profile_context.client.get("/api/v1/users/data-export-requests")
    notifications = profile_context.client.get("/api/v1/notifications")

    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["id"] == second.json()["id"]
    assert first.json()["includedCategories"] == ["profile", "settings"]
    assert page.json()["total"] == 1
    assert any(item["title"] == "Data export requested" for item in notifications.json()["items"])


def test_account_deletion_request_requires_confirmation_and_is_idempotent(
    profile_context: ProfileTestContext,
) -> None:
    register(profile_context.client, email="deletion@example.com")

    invalid = profile_context.client.post(
        "/api/v1/users/account-deletion-requests",
        json={"confirmation": "delete me", "idempotencyKey": "delete-request-1"},
        headers={"Origin": VALID_ORIGIN},
    )
    valid_payload = {
        "confirmation": "DELETE MY AETHERIUM ACCOUNT",
        "idempotencyKey": "delete-request-1",
        "reason": "Testing future deletion workflow.",
    }
    first = profile_context.client.post(
        "/api/v1/users/account-deletion-requests",
        json=valid_payload,
        headers={"Origin": VALID_ORIGIN},
    )
    second = profile_context.client.post(
        "/api/v1/users/account-deletion-requests",
        json=valid_payload,
        headers={"Origin": VALID_ORIGIN},
    )
    page = profile_context.client.get("/api/v1/users/account-deletion-requests")
    me = profile_context.client.get("/api/v1/auth/me")

    assert invalid.status_code == 422
    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["id"] == second.json()["id"]
    assert first.json()["status"] == "requested"
    assert page.json()["total"] == 1
    assert me.status_code == 200


def test_profile_endpoints_require_authentication(profile_context: ProfileTestContext) -> None:
    assert profile_context.client.get("/api/v1/users/profile").status_code == 401
    assert profile_context.client.get("/api/v1/users/privacy").status_code == 401
    assert profile_context.client.get("/api/v1/users/profile/links").status_code == 401
    assert profile_context.client.get("/api/v1/users/data-export-requests").status_code == 401
    create = profile_context.client.post(
        "/api/v1/users/profile/links",
        json={"linkType": "portfolio", "title": "Portfolio", "url": "https://example.com"},
        headers={"Origin": VALID_ORIGIN},
    )
    assert create.status_code == 401


def test_profile_database_constraints(profile_context: ProfileTestContext) -> None:
    register(profile_context.client, email="constraints@example.com")
    owner_id = asyncio.run(get_user_id(profile_context.sessionmaker, "constraints@example.com"))

    async def insert_duplicates() -> None:
        async with profile_context.sessionmaker() as session:
            session.add_all(
                [
                    UserProfile(
                        owner_user_id=owner_id, avatar_kind="preset", avatar_preset="lumen"
                    ),
                    UserProfile(
                        owner_user_id=owner_id, avatar_kind="preset", avatar_preset="aurora"
                    ),
                ]
            )
            with pytest.raises(IntegrityError):
                await session.commit()

    asyncio.run(insert_duplicates())


def test_privacy_and_export_constraints(profile_context: ProfileTestContext) -> None:
    register(profile_context.client, email="privacy-constraints@example.com")
    owner_id = asyncio.run(
        get_user_id(profile_context.sessionmaker, "privacy-constraints@example.com")
    )

    async def insert_duplicate_settings_and_export_key() -> None:
        async with profile_context.sessionmaker() as session:
            session.add_all(
                [
                    PrivacySettings(owner_user_id=owner_id),
                    PrivacySettings(owner_user_id=owner_id),
                ]
            )
            with pytest.raises(IntegrityError):
                await session.commit()

        requested_at = datetime.now(UTC)
        async with profile_context.sessionmaker() as session:
            session.add_all(
                [
                    DataExportRequest(
                        owner_user_id=owner_id,
                        idempotency_key="same-export",
                        requested_at=requested_at,
                        included_categories=["profile"],
                    ),
                    DataExportRequest(
                        owner_user_id=owner_id,
                        idempotency_key="same-export",
                        requested_at=requested_at,
                        included_categories=["settings"],
                    ),
                ]
            )
            with pytest.raises(IntegrityError):
                await session.commit()

    asyncio.run(insert_duplicate_settings_and_export_key())
