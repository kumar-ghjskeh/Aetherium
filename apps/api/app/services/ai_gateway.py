from __future__ import annotations

import time
from collections.abc import Awaitable, Callable, Mapping, Sequence
from dataclasses import dataclass
from uuid import uuid4

from fastapi import status
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.errors import AppError
from app.core.pagination import PaginationParams
from app.domain.ai import (
    AETHERIUM_DETERMINISTIC_PROVIDER,
    DISABLED_PROVIDER,
    KNOWN_PROVIDER_NAMES,
    AIDataCategory,
    AIFeature,
    AIOperation,
    AIProviderCapability,
    AIProviderKind,
    AIResponseFormat,
    AIUsageStatus,
)
from app.models.ai import AIConsentPolicy, AIModelConfiguration, AIUsageRecord
from app.models.auth import User
from app.security.rate_limit import InMemoryRateLimiter
from app.services.ai_adapters import (
    AIAdapterChatRequest,
    AIAdapterEmbeddingRequest,
    AIAdapterMessage,
    AIProviderAdapter,
    AIProviderError,
    AIProviderMetadata,
    create_default_ai_adapters,
)
from app.services.foundation import PageResult, UserDataService

CATEGORY_FIELD_MAP = {
    AIDataCategory.FILE_CONTENT: "allow_file_content",
    AIDataCategory.COLLECTIONS: "allow_collections",
    AIDataCategory.CONVERSATIONS: "allow_conversations",
    AIDataCategory.PROJECTS: "allow_projects",
    AIDataCategory.LEARNING_RECORDS: "allow_learning_records",
    AIDataCategory.HABIT_DATA: "allow_habit_data",
    AIDataCategory.PROFILE_DATA: "allow_profile_data",
}


@dataclass(frozen=True)
class AIUsageSummary:
    input_tokens: int
    output_tokens: int
    total_tokens: int
    estimated_cost_micro_usd: int


@dataclass(frozen=True)
class AIChatCompletionResult:
    request_id: str
    feature: AIFeature
    provider_name: str
    provider_kind: AIProviderKind
    model_name: str
    content: str
    usage: AIUsageSummary
    used_fallback: bool
    usage_record: AIUsageRecord


@dataclass(frozen=True)
class AIEmbeddingResult:
    request_id: str
    feature: AIFeature
    provider_name: str
    provider_kind: AIProviderKind
    model_name: str
    embeddings: list[list[float]]
    usage: AIUsageSummary
    used_fallback: bool
    usage_record: AIUsageRecord


@dataclass(frozen=True)
class ResolvedProvider:
    adapter: AIProviderAdapter
    metadata: AIProviderMetadata
    model_name: str


class AIGatewayService:
    def __init__(
        self,
        *,
        db: AsyncSession,
        settings: Settings,
        rate_limiter: InMemoryRateLimiter,
        adapters: Mapping[str, AIProviderAdapter] | None = None,
    ):
        self.db = db
        self.settings = settings
        self.rate_limiter = rate_limiter
        self.adapters = (
            dict(adapters) if adapters is not None else create_default_ai_adapters(settings)
        )

    def list_providers(self) -> list[AIProviderMetadata]:
        return sorted(
            (adapter.metadata for adapter in self.adapters.values()),
            key=lambda metadata: metadata.name,
        )

    async def list_consent_policies(self, user: User) -> list[AIConsentPolicy]:
        return [await self.get_or_create_consent_policy(user, feature) for feature in AIFeature]

    async def get_or_create_consent_policy(
        self,
        user: User,
        feature: AIFeature,
    ) -> AIConsentPolicy:
        result = await self.db.execute(
            select(AIConsentPolicy).where(
                AIConsentPolicy.owner_user_id == user.id,
                AIConsentPolicy.feature == feature.value,
            )
        )
        policy = result.scalar_one_or_none()
        if policy is not None:
            return policy

        policy = AIConsentPolicy(owner_user_id=user.id, feature=feature.value)
        self.db.add(policy)
        await self.db.flush()
        return policy

    async def update_consent_policy(
        self,
        user: User,
        feature: AIFeature,
        updates: dict[str, object],
    ) -> AIConsentPolicy:
        policy = await self.get_or_create_consent_policy(user, feature)
        for field_name, value in updates.items():
            setattr(policy, field_name, value)
        await UserDataService(self.db).record_audit_log(
            user,
            action="ai.consent_updated",
            entity_type="ai_consent_policy",
            entity_id=policy.id,
            metadata={"feature": feature.value, "updatedFields": sorted(updates.keys())},
        )
        await self.db.flush()
        return policy

    async def list_model_configurations(self, user: User) -> list[AIModelConfiguration]:
        return [
            await self.get_or_create_model_configuration(user, feature) for feature in AIFeature
        ]

    async def get_or_create_model_configuration(
        self,
        user: User,
        feature: AIFeature,
    ) -> AIModelConfiguration:
        result = await self.db.execute(
            select(AIModelConfiguration).where(
                AIModelConfiguration.owner_user_id == user.id,
                AIModelConfiguration.feature == feature.value,
            )
        )
        configuration = result.scalar_one_or_none()
        if configuration is not None:
            return configuration

        provider_name = self._default_provider_name()
        metadata = self._metadata_for_provider(provider_name)
        model_name = self._default_model_name(metadata, feature)
        configuration = AIModelConfiguration(
            owner_user_id=user.id,
            feature=feature.value,
            provider_name=metadata.name,
            provider_kind=metadata.kind.value,
            model_name=model_name,
            enabled=self.settings.ai_provider_default != DISABLED_PROVIDER,
        )
        self.db.add(configuration)
        await self.db.flush()
        return configuration

    async def update_model_configuration(
        self,
        user: User,
        feature: AIFeature,
        updates: dict[str, object],
    ) -> AIModelConfiguration:
        configuration = await self.get_or_create_model_configuration(user, feature)
        previous_provider_name = configuration.provider_name
        provider_name = str(updates.get("provider_name", configuration.provider_name))
        fallback_provider_name = updates.get(
            "fallback_provider_name", configuration.fallback_provider_name
        )
        if provider_name not in KNOWN_PROVIDER_NAMES or provider_name == DISABLED_PROVIDER:
            raise AppError(422, "unknown_ai_provider", "Unknown AI provider.")
        metadata = self._metadata_for_provider(provider_name)
        configuration.provider_name = metadata.name
        configuration.provider_kind = metadata.kind.value
        if "model_name" not in updates and metadata.name != previous_provider_name:
            configuration.model_name = self._default_model_name(metadata, feature)

        for field_name, value in updates.items():
            if field_name == "provider_name":
                continue
            setattr(configuration, field_name, value)

        if fallback_provider_name is not None:
            fallback_name = str(fallback_provider_name)
            if fallback_name not in KNOWN_PROVIDER_NAMES or fallback_name == DISABLED_PROVIDER:
                raise AppError(422, "unknown_ai_provider", "Unknown fallback AI provider.")

        await UserDataService(self.db).record_audit_log(
            user,
            action="ai.model_configuration_updated",
            entity_type="ai_model_configuration",
            entity_id=configuration.id,
            metadata={"feature": feature.value, "updatedFields": sorted(updates.keys())},
        )
        await self.db.flush()
        return configuration

    async def list_usage_records(
        self,
        user: User,
        pagination: PaginationParams,
        feature: AIFeature | None = None,
    ) -> PageResult[AIUsageRecord]:
        predicates = [AIUsageRecord.owner_user_id == user.id]
        if feature is not None:
            predicates.append(AIUsageRecord.feature == feature.value)

        total = await self._count(select(func.count(AIUsageRecord.id)).where(*predicates))
        result = await self.db.execute(
            select(AIUsageRecord)
            .where(*predicates)
            .order_by(AIUsageRecord.created_at.desc(), AIUsageRecord.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def complete_chat(
        self,
        user: User,
        *,
        feature: AIFeature,
        messages: Sequence[AIAdapterMessage],
        requested_data_categories: Sequence[AIDataCategory],
        operation: AIOperation = AIOperation.CHAT_COMPLETION,
        provider_name: str | None = None,
        model_name: str | None = None,
        temperature: float | None = None,
        max_output_tokens: int | None = None,
        response_format: AIResponseFormat = AIResponseFormat.TEXT,
        tools: Sequence[Mapping[str, object]] = (),
        tool_choice: Mapping[str, object] | None = None,
    ) -> AIChatCompletionResult:
        request_id = f"ai_{uuid4()}"
        started = time.perf_counter()
        configuration = await self.get_or_create_model_configuration(user, feature)
        policy = await self.get_or_create_consent_policy(user, feature)
        resolved = self._resolve_provider(configuration, provider_name, model_name, feature)
        operation_model_name = resolved.model_name
        try:
            self._check_feature_enabled(configuration)
            self._check_rate_limit(user, feature)
            self._enforce_consent(policy, resolved.metadata, requested_data_categories)
            if AIProviderCapability.CHAT not in resolved.metadata.capabilities:
                raise AIProviderError(
                    "provider_capability_unavailable",
                    "The selected provider does not support chat completions.",
                )
            adapter_request = AIAdapterChatRequest(
                messages=messages,
                model=operation_model_name,
                temperature=temperature if temperature is not None else configuration.temperature,
                max_output_tokens=max_output_tokens
                if max_output_tokens is not None
                else configuration.max_output_tokens,
                response_format=response_format,
                tools=tools,
                tool_choice=tool_choice,
            )
            try:
                response = await self._with_retries(lambda: resolved.adapter.chat(adapter_request))
                used_fallback = False
                final = resolved
            except AIProviderError as primary_error:
                fallback = self._resolve_fallback(configuration, feature)
                if fallback is None:
                    raise primary_error
                self._enforce_consent(policy, fallback.metadata, requested_data_categories)
                fallback_request = AIAdapterChatRequest(
                    messages=messages,
                    model=fallback.model_name,
                    temperature=adapter_request.temperature,
                    max_output_tokens=adapter_request.max_output_tokens,
                    response_format=adapter_request.response_format,
                    tools=adapter_request.tools,
                    tool_choice=adapter_request.tool_choice,
                )
                response = await self._with_retries(lambda: fallback.adapter.chat(fallback_request))
                used_fallback = True
                final = fallback

            usage = AIUsageSummary(
                input_tokens=response.input_tokens,
                output_tokens=response.output_tokens,
                total_tokens=response.total_tokens,
                estimated_cost_micro_usd=0,
            )
            usage_record = await self._record_usage(
                user,
                request_id=request_id,
                feature=feature,
                provider=final.metadata,
                model_name=final.model_name,
                operation=operation,
                status_value=AIUsageStatus.SUCCESS,
                usage=usage,
                latency_ms=_elapsed_ms(started),
                used_fallback=used_fallback,
            )
            return AIChatCompletionResult(
                request_id=request_id,
                feature=feature,
                provider_name=final.metadata.name,
                provider_kind=final.metadata.kind,
                model_name=final.model_name,
                content=response.content,
                usage=usage,
                used_fallback=used_fallback,
                usage_record=usage_record,
            )
        except AppError as exc:
            await self._record_usage_for_error(
                user,
                request_id=request_id,
                feature=feature,
                provider=resolved.metadata,
                model_name=operation_model_name,
                operation=operation,
                status_value=_usage_status_for_app_error(exc),
                error_code=exc.code,
                error_message=exc.message,
                latency_ms=_elapsed_ms(started),
            )
            raise
        except AIProviderError as exc:
            await self._record_usage_for_error(
                user,
                request_id=request_id,
                feature=feature,
                provider=resolved.metadata,
                model_name=operation_model_name,
                operation=operation,
                status_value=AIUsageStatus.FAILED,
                error_code=exc.code,
                error_message=exc.message,
                latency_ms=_elapsed_ms(started),
            )
            raise AppError(status.HTTP_502_BAD_GATEWAY, exc.code, exc.message) from exc

    async def create_embeddings(
        self,
        user: User,
        *,
        feature: AIFeature,
        input_texts: Sequence[str],
        requested_data_categories: Sequence[AIDataCategory],
        provider_name: str | None = None,
        model_name: str | None = None,
    ) -> AIEmbeddingResult:
        request_id = f"ai_{uuid4()}"
        started = time.perf_counter()
        configuration = await self.get_or_create_model_configuration(user, feature)
        policy = await self.get_or_create_consent_policy(user, feature)
        resolved = self._resolve_provider(configuration, provider_name, model_name, feature)
        operation_model_name = resolved.model_name
        try:
            self._check_feature_enabled(configuration)
            self._check_rate_limit(user, feature)
            self._enforce_consent(policy, resolved.metadata, requested_data_categories)
            if AIProviderCapability.EMBEDDINGS not in resolved.metadata.capabilities:
                raise AIProviderError(
                    "provider_capability_unavailable",
                    "The selected provider does not support embeddings.",
                )
            adapter_request = AIAdapterEmbeddingRequest(
                input=input_texts, model=operation_model_name
            )
            try:
                response = await self._with_retries(
                    lambda: resolved.adapter.embeddings(adapter_request)
                )
                used_fallback = False
                final = resolved
            except AIProviderError as primary_error:
                fallback = self._resolve_fallback(configuration, feature)
                if fallback is None:
                    raise primary_error
                self._enforce_consent(policy, fallback.metadata, requested_data_categories)
                fallback_request = AIAdapterEmbeddingRequest(
                    input=input_texts, model=fallback.model_name
                )
                response = await self._with_retries(
                    lambda: fallback.adapter.embeddings(fallback_request)
                )
                used_fallback = True
                final = fallback

            usage = AIUsageSummary(
                input_tokens=response.input_tokens,
                output_tokens=response.output_tokens,
                total_tokens=response.total_tokens,
                estimated_cost_micro_usd=0,
            )
            usage_record = await self._record_usage(
                user,
                request_id=request_id,
                feature=feature,
                provider=final.metadata,
                model_name=final.model_name,
                operation=AIOperation.EMBEDDING,
                status_value=AIUsageStatus.SUCCESS,
                usage=usage,
                latency_ms=_elapsed_ms(started),
                used_fallback=used_fallback,
            )
            return AIEmbeddingResult(
                request_id=request_id,
                feature=feature,
                provider_name=final.metadata.name,
                provider_kind=final.metadata.kind,
                model_name=final.model_name,
                embeddings=response.embeddings,
                usage=usage,
                used_fallback=used_fallback,
                usage_record=usage_record,
            )
        except AppError as exc:
            await self._record_usage_for_error(
                user,
                request_id=request_id,
                feature=feature,
                provider=resolved.metadata,
                model_name=operation_model_name,
                operation=AIOperation.EMBEDDING,
                status_value=_usage_status_for_app_error(exc),
                error_code=exc.code,
                error_message=exc.message,
                latency_ms=_elapsed_ms(started),
            )
            raise
        except AIProviderError as exc:
            await self._record_usage_for_error(
                user,
                request_id=request_id,
                feature=feature,
                provider=resolved.metadata,
                model_name=operation_model_name,
                operation=AIOperation.EMBEDDING,
                status_value=AIUsageStatus.FAILED,
                error_code=exc.code,
                error_message=exc.message,
                latency_ms=_elapsed_ms(started),
            )
            raise AppError(status.HTTP_502_BAD_GATEWAY, exc.code, exc.message) from exc

    def _default_provider_name(self) -> str:
        if self.settings.ai_provider_default == DISABLED_PROVIDER:
            return AETHERIUM_DETERMINISTIC_PROVIDER
        return self.settings.ai_provider_default

    def _metadata_for_provider(self, provider_name: str) -> AIProviderMetadata:
        adapter = self.adapters.get(provider_name)
        if adapter is None:
            raise AppError(422, "unknown_ai_provider", "Unknown AI provider.")
        return adapter.metadata

    def _default_model_name(self, metadata: AIProviderMetadata, feature: AIFeature) -> str:
        if feature == AIFeature.EMBEDDINGS and metadata.default_embedding_model:
            return metadata.default_embedding_model
        if metadata.default_chat_model:
            return metadata.default_chat_model
        raise AppError(422, "provider_model_required", "AI provider model is required.")

    def _resolve_provider(
        self,
        configuration: AIModelConfiguration,
        provider_name: str | None,
        model_name: str | None,
        feature: AIFeature,
    ) -> ResolvedProvider:
        selected_provider = provider_name or configuration.provider_name
        adapter = self.adapters.get(selected_provider)
        if adapter is None:
            raise AppError(422, "unknown_ai_provider", "Unknown AI provider.")
        resolved_model = (
            model_name
            or configuration.model_name
            or self._default_model_name(adapter.metadata, feature)
        )
        return ResolvedProvider(
            adapter=adapter, metadata=adapter.metadata, model_name=resolved_model
        )

    def _resolve_fallback(
        self, configuration: AIModelConfiguration, feature: AIFeature
    ) -> ResolvedProvider | None:
        if not configuration.fallback_provider_name:
            return None
        adapter = self.adapters.get(configuration.fallback_provider_name)
        if adapter is None:
            return None
        model_name = configuration.fallback_model_name or self._default_model_name(
            adapter.metadata, feature
        )
        return ResolvedProvider(adapter=adapter, metadata=adapter.metadata, model_name=model_name)

    def _check_feature_enabled(self, configuration: AIModelConfiguration) -> None:
        if not configuration.enabled:
            raise AppError(
                status.HTTP_403_FORBIDDEN, "ai_feature_disabled", "AI feature is disabled."
            )

    def _check_rate_limit(self, user: User, feature: AIFeature) -> None:
        decision = self.rate_limiter.check(
            key=f"ai:{user.id}:{feature.value}",
            limit=self.settings.ai_rate_limit_attempts,
            window_seconds=self.settings.ai_rate_limit_window_seconds,
        )
        if decision.allowed:
            return
        raise AppError(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "rate_limited",
            "Too many AI requests. Please wait before trying again.",
        )

    def _enforce_consent(
        self,
        policy: AIConsentPolicy,
        provider: AIProviderMetadata,
        requested_data_categories: Sequence[AIDataCategory],
    ) -> None:
        if provider.external:
            if not self.settings.ai_external_calls_enabled:
                raise AppError(
                    status.HTTP_403_FORBIDDEN,
                    "external_ai_disabled",
                    "External AI provider calls are disabled for this environment.",
                )
            if not policy.external_providers_allowed:
                raise AppError(
                    status.HTTP_403_FORBIDDEN,
                    "external_ai_consent_required",
                    "External AI provider access requires explicit consent.",
                )
            if not provider.configured:
                raise AppError(
                    status.HTTP_502_BAD_GATEWAY,
                    "provider_unconfigured",
                    "AI provider is not configured.",
                )

        for category in requested_data_categories:
            field_name = CATEGORY_FIELD_MAP[category]
            if not bool(getattr(policy, field_name)):
                raise AppError(
                    status.HTTP_403_FORBIDDEN,
                    "ai_data_consent_required",
                    f"AI access to {category.value} requires explicit consent.",
                )

    async def _with_retries[T](self, operation: Callable[[], Awaitable[T]]) -> T:
        attempts = self.settings.ai_max_retries + 1
        last_error: AIProviderError | None = None
        for _attempt in range(attempts):
            try:
                return await operation()
            except AIProviderError as exc:
                last_error = exc
                if not exc.retryable:
                    break
        if last_error is None:
            raise AIProviderError("provider_request_failed", "AI provider request failed.")
        raise last_error

    async def _record_usage(
        self,
        user: User,
        *,
        request_id: str,
        feature: AIFeature,
        provider: AIProviderMetadata,
        model_name: str,
        operation: AIOperation,
        status_value: AIUsageStatus,
        usage: AIUsageSummary,
        latency_ms: int,
        used_fallback: bool = False,
        error_code: str | None = None,
        error_message: str | None = None,
    ) -> AIUsageRecord:
        record = AIUsageRecord(
            owner_user_id=user.id,
            request_id=request_id,
            feature=feature.value,
            provider_name=provider.name,
            provider_kind=provider.kind.value,
            model_name=model_name,
            operation=operation.value,
            status=status_value.value,
            input_tokens=usage.input_tokens,
            output_tokens=usage.output_tokens,
            total_tokens=usage.total_tokens,
            estimated_cost_micro_usd=usage.estimated_cost_micro_usd,
            latency_ms=latency_ms,
            used_fallback=used_fallback,
            error_code=error_code,
            error_message=error_message[:512] if error_message else None,
        )
        self.db.add(record)
        await self.db.flush()
        return record

    async def _record_usage_for_error(
        self,
        user: User,
        *,
        request_id: str,
        feature: AIFeature,
        provider: AIProviderMetadata,
        model_name: str,
        operation: AIOperation,
        status_value: AIUsageStatus,
        error_code: str,
        error_message: str,
        latency_ms: int,
    ) -> AIUsageRecord:
        return await self._record_usage(
            user,
            request_id=request_id,
            feature=feature,
            provider=provider,
            model_name=model_name,
            operation=operation,
            status_value=status_value,
            usage=AIUsageSummary(
                input_tokens=0,
                output_tokens=0,
                total_tokens=0,
                estimated_cost_micro_usd=0,
            ),
            latency_ms=latency_ms,
            error_code=error_code,
            error_message=error_message,
        )

    async def _count(self, query: Select[tuple[int]]) -> int:
        value = await self.db.scalar(query)
        return int(value or 0)


def _elapsed_ms(started: float) -> int:
    return max(0, int((time.perf_counter() - started) * 1000))


def _usage_status_for_app_error(error: AppError) -> AIUsageStatus:
    if error.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
        return AIUsageStatus.RATE_LIMITED
    if error.status_code == status.HTTP_403_FORBIDDEN:
        return AIUsageStatus.BLOCKED
    return AIUsageStatus.FAILED
