from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator, Iterator
from dataclasses import dataclass

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.core.config import Settings
from app.db.base import Base
from app.db.session import get_async_session
from app.domain.ai import (
    AETHERIUM_DETERMINISTIC_PROVIDER,
    OPENAI_PROVIDER,
    AIFeature,
    AIProviderCapability,
    AIProviderKind,
)
from app.main import create_app
from app.models.ai import AIConsentPolicy
from app.models.auth import User
from app.security.rate_limit import InMemoryRateLimiter
from app.services.ai_adapters import (
    AIAdapterChatRequest,
    AIAdapterChatResponse,
    AIAdapterEmbeddingRequest,
    AIAdapterEmbeddingResponse,
    AIProviderError,
    AIProviderMetadata,
)
from app.services.ai_gateway import AIGatewayService

VALID_ORIGIN = "http://localhost:3000"
VALID_PASSWORD = "StrongPass123!"


@dataclass(frozen=True)
class AITestContext:
    client: TestClient
    sessionmaker: async_sessionmaker[AsyncSession]


@pytest.fixture()
def ai_context(monkeypatch: pytest.MonkeyPatch) -> Iterator[AITestContext]:
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
        yield AITestContext(client=client, sessionmaker=testing_sessionmaker)

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


async def get_user(
    sessionmaker: async_sessionmaker[AsyncSession],
    email: str,
) -> User:
    async with sessionmaker() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one()
        await session.refresh(user)
        return user


def test_ai_provider_metadata_and_defaults_are_owner_scoped(ai_context: AITestContext) -> None:
    register(ai_context.client)

    providers = ai_context.client.get("/api/v1/ai/providers")
    consent = ai_context.client.get("/api/v1/ai/consent")
    configs = ai_context.client.get("/api/v1/ai/model-configs")

    assert providers.status_code == 200
    provider_names = {item["name"] for item in providers.json()["items"]}
    assert AETHERIUM_DETERMINISTIC_PROVIDER in provider_names
    assert OPENAI_PROVIDER in provider_names
    assert consent.status_code == 200
    assert all(not item["externalProvidersAllowed"] for item in consent.json()["items"])
    assert configs.status_code == 200
    assert all(
        item["providerName"] == AETHERIUM_DETERMINISTIC_PROVIDER for item in configs.json()["items"]
    )


def test_deterministic_chat_and_embeddings_record_usage(ai_context: AITestContext) -> None:
    register(ai_context.client)

    chat = ai_context.client.post(
        "/api/v1/ai/chat/completions",
        json={"messages": [{"role": "user", "content": "Explain database indexes."}]},
        headers={"Origin": VALID_ORIGIN},
    )
    embedding = ai_context.client.post(
        "/api/v1/ai/embeddings",
        json={"input": ["database indexes"]},
        headers={"Origin": VALID_ORIGIN},
    )
    usage = ai_context.client.get("/api/v1/ai/usage")

    assert chat.status_code == 200
    assert chat.json()["providerName"] == AETHERIUM_DETERMINISTIC_PROVIDER
    assert chat.json()["usage"]["totalTokens"] > 0
    assert "database indexes" in chat.json()["message"]["content"]
    assert embedding.status_code == 200
    assert embedding.json()["data"][0]["embedding"]
    assert usage.status_code == 200
    assert usage.json()["total"] == 2
    assert all("Explain database indexes" not in str(item) for item in usage.json()["items"])


def test_external_provider_requires_environment_and_user_consent(ai_context: AITestContext) -> None:
    register(ai_context.client)
    config = ai_context.client.put(
        "/api/v1/ai/model-configs/general_chat",
        json={"providerName": OPENAI_PROVIDER, "modelName": "gpt-test"},
        headers={"Origin": VALID_ORIGIN},
    )
    response = ai_context.client.post(
        "/api/v1/ai/chat/completions",
        json={"messages": [{"role": "user", "content": "Hello"}]},
        headers={"Origin": VALID_ORIGIN},
    )
    usage = ai_context.client.get("/api/v1/ai/usage?limit=5&offset=0")

    assert config.status_code == 200
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "external_ai_disabled"
    assert usage.json()["total"] == 1
    assert usage.json()["items"][0]["status"] == "blocked"


def test_requested_data_category_requires_explicit_consent(ai_context: AITestContext) -> None:
    register(ai_context.client)

    response = ai_context.client.post(
        "/api/v1/ai/chat/completions",
        json={
            "messages": [{"role": "user", "content": "Use my files"}],
            "requestedDataCategories": ["file_content"],
        },
        headers={"Origin": VALID_ORIGIN},
    )
    usage = ai_context.client.get("/api/v1/ai/usage")

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "ai_data_consent_required"
    assert usage.json()["items"][0]["status"] == "blocked"


def test_ai_rate_limit_records_rate_limited_usage(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.core.config import get_settings

    monkeypatch.setenv("AETHERIUM_APP_ENV", "test")
    monkeypatch.setenv("AETHERIUM_SESSION_SIGNING_SECRET", "aetherium-test-session-secret")
    monkeypatch.setenv("AETHERIUM_CORS_ORIGINS", VALID_ORIGIN)
    monkeypatch.setenv("AETHERIUM_AI_PROVIDER_DEFAULT", AETHERIUM_DETERMINISTIC_PROVIDER)
    monkeypatch.setenv("AETHERIUM_AI_RATE_LIMIT_ATTEMPTS", "1")
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

    with TestClient(app) as client:
        register(client)
        first = client.post(
            "/api/v1/ai/chat/completions",
            json={"messages": [{"role": "user", "content": "First"}]},
            headers={"Origin": VALID_ORIGIN},
        )
        second = client.post(
            "/api/v1/ai/chat/completions",
            json={"messages": [{"role": "user", "content": "Second"}]},
            headers={"Origin": VALID_ORIGIN},
        )
        usage = client.get("/api/v1/ai/usage")

    asyncio.run(engine.dispose())
    get_settings.cache_clear()

    assert first.status_code == 200
    assert second.status_code == 429
    assert usage.json()["total"] == 2
    assert {item["status"] for item in usage.json()["items"]} == {"success", "rate_limited"}


def test_ai_usage_records_are_cross_user_isolated(ai_context: AITestContext) -> None:
    register(ai_context.client, email="owner@example.com")
    chat = ai_context.client.post(
        "/api/v1/ai/chat/completions",
        json={"messages": [{"role": "user", "content": "Owner only"}]},
        headers={"Origin": VALID_ORIGIN},
    )
    assert chat.status_code == 200

    with TestClient(ai_context.client.app) as other_client:
        register(other_client, email="other@example.com")
        usage = other_client.get("/api/v1/ai/usage")

    assert usage.status_code == 200
    assert usage.json()["total"] == 0


class FailingAdapter:
    metadata = AIProviderMetadata(
        name=OPENAI_PROVIDER,
        kind=AIProviderKind.OPENAI_COMPATIBLE,
        display_name="Failing OpenAI-compatible test provider",
        external=False,
        configured=True,
        capabilities=(AIProviderCapability.CHAT,),
        default_chat_model="failing-chat",
        default_embedding_model=None,
    )

    async def chat(self, _request: AIAdapterChatRequest) -> AIAdapterChatResponse:
        raise AIProviderError("temporary_failure", "Temporary provider failure.", retryable=True)

    async def stream_chat(self, _request: AIAdapterChatRequest) -> AsyncIterator[str]:
        raise AIProviderError("temporary_failure", "Temporary provider failure.", retryable=True)
        yield ""

    async def embeddings(self, _request: AIAdapterEmbeddingRequest) -> AIAdapterEmbeddingResponse:
        raise AIProviderError("provider_capability_unavailable", "No embeddings.")


class RecordingFallbackAdapter:
    def __init__(self) -> None:
        self.requested_model: str | None = None

    metadata = AIProviderMetadata(
        name=AETHERIUM_DETERMINISTIC_PROVIDER,
        kind=AIProviderKind.AETHERIUM_DETERMINISTIC,
        display_name="Recording fallback test provider",
        external=False,
        configured=True,
        capabilities=(AIProviderCapability.CHAT,),
        default_chat_model="aetherium-deterministic-chat",
        default_embedding_model=None,
    )

    async def chat(self, request: AIAdapterChatRequest) -> AIAdapterChatResponse:
        self.requested_model = request.model
        return AIAdapterChatResponse(
            content=f"Fallback response from {request.model}",
            input_tokens=1,
            output_tokens=2,
            total_tokens=3,
        )

    async def stream_chat(self, _request: AIAdapterChatRequest) -> AsyncIterator[str]:
        yield "fallback"

    async def embeddings(self, _request: AIAdapterEmbeddingRequest) -> AIAdapterEmbeddingResponse:
        raise AIProviderError("provider_capability_unavailable", "No embeddings.")


def test_provider_fallback_uses_fallback_adapter(ai_context: AITestContext) -> None:
    register(ai_context.client, email="fallback@example.com")
    user = asyncio.run(get_user(ai_context.sessionmaker, "fallback@example.com"))
    fallback_adapter = RecordingFallbackAdapter()

    async def run_gateway_call() -> tuple[str, bool, str, str | None]:
        async with ai_context.sessionmaker() as session:
            attached_user = await session.get(User, user.id)
            assert attached_user is not None
            settings = Settings(_env_file=None)
            service = AIGatewayService(
                db=session,
                settings=settings,
                rate_limiter=InMemoryRateLimiter("aetherium:"),
                adapters={
                    OPENAI_PROVIDER: FailingAdapter(),
                    AETHERIUM_DETERMINISTIC_PROVIDER: fallback_adapter,
                },
            )
            config = await service.update_model_configuration(
                attached_user,
                AIFeature.GENERAL_CHAT,
                {
                    "fallback_model_name": "aetherium-deterministic-chat",
                    "fallback_provider_name": AETHERIUM_DETERMINISTIC_PROVIDER,
                    "model_name": "failing-chat",
                    "provider_name": OPENAI_PROVIDER,
                },
            )
            assert config.provider_name == OPENAI_PROVIDER
            result = await service.complete_chat(
                attached_user,
                feature=AIFeature.GENERAL_CHAT,
                messages=[service_message("Fallback please")],
                requested_data_categories=[],
            )
            await session.commit()
            return (
                result.provider_name,
                result.used_fallback,
                result.content,
                fallback_adapter.requested_model,
            )

    provider_name, used_fallback, content, requested_model = asyncio.run(run_gateway_call())

    assert provider_name == AETHERIUM_DETERMINISTIC_PROVIDER
    assert used_fallback is True
    assert requested_model == "aetherium-deterministic-chat"
    assert "aetherium-deterministic-chat" in content


def service_message(content: str) -> object:
    from app.domain.ai import AIMessageRole
    from app.services.ai_adapters import AIAdapterMessage

    return AIAdapterMessage(role=AIMessageRole.USER, content=content)


def test_ai_endpoints_require_authentication(ai_context: AITestContext) -> None:
    assert ai_context.client.get("/api/v1/ai/providers").status_code == 401
    assert ai_context.client.get("/api/v1/ai/usage").status_code == 401


def test_ai_consent_policy_unique_owner_feature_constraint(ai_context: AITestContext) -> None:
    register(ai_context.client, email="constraint@example.com")
    user = asyncio.run(get_user(ai_context.sessionmaker, "constraint@example.com"))

    async def insert_duplicates() -> None:
        async with ai_context.sessionmaker() as session:
            session.add_all(
                [
                    AIConsentPolicy(owner_user_id=user.id, feature=AIFeature.GENERAL_CHAT.value),
                    AIConsentPolicy(owner_user_id=user.id, feature=AIFeature.GENERAL_CHAT.value),
                ]
            )
            with pytest.raises(IntegrityError):
                await session.commit()

    asyncio.run(insert_duplicates())
