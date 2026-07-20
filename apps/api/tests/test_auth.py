from __future__ import annotations

import asyncio
from collections.abc import Iterator
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import get_async_session
from app.main import create_app
from app.models.auth import AuthSession, User

VALID_ORIGIN = "http://localhost:3000"
VALID_PASSWORD = "StrongPass123!"


@dataclass(frozen=True)
class AuthTestContext:
    client: TestClient
    sessionmaker: async_sessionmaker[AsyncSession]


@pytest.fixture()
def auth_context(monkeypatch: pytest.MonkeyPatch) -> Iterator[AuthTestContext]:
    monkeypatch.setenv("AETHERIUM_APP_ENV", "test")
    monkeypatch.setenv("AETHERIUM_SESSION_SIGNING_SECRET", "aetherium-test-session-secret")
    monkeypatch.setenv("AETHERIUM_CORS_ORIGINS", VALID_ORIGIN)
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

    async def override_session() -> Iterator[AsyncSession]:
        async with testing_sessionmaker() as session:
            yield session

    app.dependency_overrides[get_async_session] = override_session
    app.state.rate_limiter.reset()

    with TestClient(app) as client:
        yield AuthTestContext(client=client, sessionmaker=testing_sessionmaker)

    asyncio.run(engine.dispose())
    get_settings.cache_clear()


def register(
    client: TestClient,
    *,
    email: str = "learner@example.com",
    password: str = VALID_PASSWORD,
    display_name: str = "Aetherium Learner",
) -> object:
    return client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "displayName": display_name},
        headers={"Origin": VALID_ORIGIN},
    )


def login(client: TestClient, *, email: str, password: str) -> object:
    return client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
        headers={"Origin": VALID_ORIGIN},
    )


def logout(client: TestClient) -> object:
    return client.post("/api/v1/auth/logout", headers={"Origin": VALID_ORIGIN})


def test_successful_registration_creates_user_session_and_cookie(
    auth_context: AuthTestContext,
) -> None:
    response = register(auth_context.client)

    assert response.status_code == 201
    payload = response.json()
    assert payload["user"]["email"] == "learner@example.com"
    assert payload["user"]["displayName"] == "Aetherium Learner"
    assert payload["user"]["isEmailVerified"] is False
    set_cookie = response.headers["set-cookie"]
    assert "aetherium_session=" in set_cookie
    assert "HttpOnly" in set_cookie
    assert "SameSite=lax" in set_cookie


async def test_duplicate_normalized_email_rejected(auth_context: AuthTestContext) -> None:
    first = register(auth_context.client, email="Learner@Example.com")
    second = register(auth_context.client, email="learner@example.com")

    assert first.status_code == 201
    assert second.status_code == 409
    assert second.json()["error"]["code"] == "email_unavailable"


def test_invalid_email_rejected(auth_context: AuthTestContext) -> None:
    response = register(auth_context.client, email="not-an-email")

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_failed"


@pytest.mark.parametrize(
    "password",
    ["short", "alllowercase123!", "ALLUPPERCASE123!", "NoNumberSymbol!", "NoSymbol123"],
)
def test_weak_or_invalid_password_rejected(auth_context: AuthTestContext, password: str) -> None:
    response = register(auth_context.client, password=password)

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_failed"


def test_successful_login_creates_session(auth_context: AuthTestContext) -> None:
    register(auth_context.client, email="login@example.com")
    logout(auth_context.client)

    response = login(auth_context.client, email="login@example.com", password=VALID_PASSWORD)

    assert response.status_code == 200
    assert response.json()["user"]["email"] == "login@example.com"
    assert "aetherium_session=" in response.headers["set-cookie"]


def test_incorrect_password_uses_non_revealing_error(auth_context: AuthTestContext) -> None:
    register(auth_context.client, email="wrong-password@example.com")
    logout(auth_context.client)

    response = login(
        auth_context.client,
        email="wrong-password@example.com",
        password="WrongPass123!",
    )

    assert response.status_code == 401
    assert response.json()["error"] == {
        "code": "invalid_credentials",
        "message": "Email or password is incorrect.",
    }


def test_nonexistent_account_uses_same_login_error(auth_context: AuthTestContext) -> None:
    response = login(auth_context.client, email="missing@example.com", password="WrongPass123!")

    assert response.status_code == 401
    assert response.json()["error"] == {
        "code": "invalid_credentials",
        "message": "Email or password is incorrect.",
    }


def test_me_with_valid_session(auth_context: AuthTestContext) -> None:
    register(auth_context.client, email="me@example.com", display_name="Current User")

    response = auth_context.client.get("/api/v1/auth/me")

    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"
    assert response.json()["displayName"] == "Current User"


def test_me_without_session_rejected(auth_context: AuthTestContext) -> None:
    response = auth_context.client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthenticated"


def test_logout_revokes_session_and_clears_cookie(auth_context: AuthTestContext) -> None:
    register(auth_context.client, email="logout@example.com")

    logout_response = logout(auth_context.client)
    me_response = auth_context.client.get("/api/v1/auth/me")

    assert logout_response.status_code == 204
    assert "aetherium_session=" in logout_response.headers["set-cookie"]
    assert "Max-Age=0" in logout_response.headers["set-cookie"]
    assert me_response.status_code == 401


def test_revoked_session_rejected(auth_context: AuthTestContext) -> None:
    register(auth_context.client, email="revoked@example.com")
    logout(auth_context.client)

    response = auth_context.client.get("/api/v1/auth/me")

    assert response.status_code == 401


def test_expired_session_rejected(auth_context: AuthTestContext) -> None:
    register(auth_context.client, email="expired@example.com")

    async def expire_session() -> None:
        async with auth_context.sessionmaker() as session:
            auth_session = await session.get(AuthSession, (await _first_session_id(session)))
            assert auth_session is not None
            auth_session.expires_at = datetime.now(UTC) - timedelta(seconds=1)
            await session.commit()

    asyncio.run(expire_session())

    response = auth_context.client.get("/api/v1/auth/me")

    assert response.status_code == 401


async def _first_session_id(session: AsyncSession) -> object:
    from sqlalchemy import select

    result = await session.execute(select(AuthSession.id).limit(1))
    session_id = result.scalar_one()
    return session_id


def test_cookie_security_settings_in_production(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AETHERIUM_APP_ENV", "production")
    monkeypatch.setenv("AETHERIUM_SESSION_SIGNING_SECRET", "aetherium-production-test-secret")
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

    with TestClient(app) as client:
        response = register(client, email="secure-cookie@example.com")

    asyncio.run(engine.dispose())
    get_settings.cache_clear()

    assert response.status_code == 201
    set_cookie = response.headers["set-cookie"]
    assert "HttpOnly" in set_cookie
    assert "Secure" in set_cookie
    assert "SameSite=lax" in set_cookie


def test_cross_user_sessions_return_correct_user(auth_context: AuthTestContext) -> None:
    client_a = auth_context.client
    register(client_a, email="user-a@example.com", display_name="User A")

    with TestClient(client_a.app) as client_b:
        register(client_b, email="user-b@example.com", display_name="User B")
        response_b = client_b.get("/api/v1/auth/me")

    response_a = client_a.get("/api/v1/auth/me")

    assert response_a.status_code == 200
    assert response_b.status_code == 200
    assert response_a.json()["email"] == "user-a@example.com"
    assert response_b.json()["email"] == "user-b@example.com"
    assert response_a.json()["id"] != response_b.json()["id"]


def test_login_rate_limit_behavior(auth_context: AuthTestContext) -> None:
    responses = [
        login(auth_context.client, email="limited@example.com", password="WrongPass123!")
        for _ in range(6)
    ]

    assert [response.status_code for response in responses[:5]] == [401, 401, 401, 401, 401]
    assert responses[5].status_code == 429
    assert responses[5].json()["error"]["code"] == "rate_limited"


def test_database_constraint_prevents_duplicate_normalized_email(
    auth_context: AuthTestContext,
) -> None:
    async def insert_duplicates() -> None:
        async with auth_context.sessionmaker() as session:
            session.add_all(
                [
                    User(
                        email="Constraint@Example.com",
                        normalized_email="constraint@example.com",
                        password_hash="hash-one",
                        display_name="One",
                    ),
                    User(
                        email="constraint@example.com",
                        normalized_email="constraint@example.com",
                        password_hash="hash-two",
                        display_name="Two",
                    ),
                ]
            )
            with pytest.raises(IntegrityError):
                await session.commit()

    asyncio.run(insert_duplicates())
