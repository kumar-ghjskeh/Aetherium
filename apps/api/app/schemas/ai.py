from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.domain.ai import (
    AIDataCategory,
    AIFeature,
    AIMessageRole,
    AIOperation,
    AIProviderCapability,
    AIProviderKind,
    AIResponseFormat,
    AIUsageStatus,
)
from app.models.ai import AIConsentPolicy, AIModelConfiguration, AIUsageRecord
from app.services.ai_adapters import AIProviderMetadata
from app.services.ai_gateway import AIChatCompletionResult, AIEmbeddingResult, AIUsageSummary


class AISchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class AIProviderResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    kind: AIProviderKind
    display_name: str = Field(alias="displayName")
    external: bool
    configured: bool
    capabilities: list[AIProviderCapability]
    default_chat_model: str | None = Field(alias="defaultChatModel")
    default_embedding_model: str | None = Field(alias="defaultEmbeddingModel")

    @classmethod
    def from_metadata(cls, metadata: AIProviderMetadata) -> AIProviderResponse:
        return cls(
            name=metadata.name,
            kind=metadata.kind,
            displayName=metadata.display_name,
            external=metadata.external,
            configured=metadata.configured,
            capabilities=list(metadata.capabilities),
            defaultChatModel=metadata.default_chat_model,
            defaultEmbeddingModel=metadata.default_embedding_model,
        )


class AIProviderPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[AIProviderResponse]


class AIConsentPolicyResponse(AISchema):
    id: UUID
    feature: AIFeature
    external_providers_allowed: bool = Field(alias="externalProvidersAllowed")
    allow_file_content: bool = Field(alias="allowFileContent")
    allow_collections: bool = Field(alias="allowCollections")
    allow_conversations: bool = Field(alias="allowConversations")
    allow_projects: bool = Field(alias="allowProjects")
    allow_learning_records: bool = Field(alias="allowLearningRecords")
    allow_habit_data: bool = Field(alias="allowHabitData")
    allow_profile_data: bool = Field(alias="allowProfileData")
    allowed_collection_ids: list[str] = Field(alias="allowedCollectionIds")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_policy(cls, policy: AIConsentPolicy) -> AIConsentPolicyResponse:
        return cls.model_validate(policy)


class AIConsentPolicyPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[AIConsentPolicyResponse]


class AIConsentPolicyUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    external_providers_allowed: bool | None = Field(default=None, alias="externalProvidersAllowed")
    allow_file_content: bool | None = Field(default=None, alias="allowFileContent")
    allow_collections: bool | None = Field(default=None, alias="allowCollections")
    allow_conversations: bool | None = Field(default=None, alias="allowConversations")
    allow_projects: bool | None = Field(default=None, alias="allowProjects")
    allow_learning_records: bool | None = Field(default=None, alias="allowLearningRecords")
    allow_habit_data: bool | None = Field(default=None, alias="allowHabitData")
    allow_profile_data: bool | None = Field(default=None, alias="allowProfileData")
    allowed_collection_ids: list[str] | None = Field(default=None, alias="allowedCollectionIds")

    @field_validator("allowed_collection_ids")
    @classmethod
    def validate_collection_ids(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return value
        return list(dict.fromkeys(value[:100]))

    @model_validator(mode="after")
    def require_update_field(self) -> AIConsentPolicyUpdate:
        if not self.model_fields_set:
            raise ValueError("At least one AI consent field is required")
        return self


class AIModelConfigurationResponse(AISchema):
    id: UUID
    feature: AIFeature
    provider_name: str = Field(alias="providerName")
    provider_kind: AIProviderKind = Field(alias="providerKind")
    model_name: str = Field(alias="modelName")
    fallback_provider_name: str | None = Field(alias="fallbackProviderName")
    fallback_model_name: str | None = Field(alias="fallbackModelName")
    temperature: float
    max_output_tokens: int = Field(alias="maxOutputTokens")
    enabled: bool
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_configuration(
        cls, configuration: AIModelConfiguration
    ) -> AIModelConfigurationResponse:
        return cls.model_validate(configuration)


class AIModelConfigurationPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[AIModelConfigurationResponse]


class AIModelConfigurationUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    provider_name: str | None = Field(
        default=None, alias="providerName", min_length=1, max_length=80
    )
    model_name: str | None = Field(default=None, alias="modelName", min_length=1, max_length=120)
    fallback_provider_name: str | None = Field(
        default=None,
        alias="fallbackProviderName",
        max_length=80,
    )
    fallback_model_name: str | None = Field(default=None, alias="fallbackModelName", max_length=120)
    temperature: float | None = Field(default=None, ge=0, le=2)
    max_output_tokens: int | None = Field(default=None, alias="maxOutputTokens", ge=1, le=8192)
    enabled: bool | None = None

    @model_validator(mode="after")
    def require_update_field(self) -> AIModelConfigurationUpdate:
        if not self.model_fields_set:
            raise ValueError("At least one AI model configuration field is required")
        return self


class AIChatMessageRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    role: AIMessageRole
    content: str = Field(min_length=1, max_length=12000)


class AIUsageSummaryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    input_tokens: int = Field(alias="inputTokens")
    output_tokens: int = Field(alias="outputTokens")
    total_tokens: int = Field(alias="totalTokens")
    estimated_cost_micro_usd: int = Field(alias="estimatedCostMicroUsd")

    @classmethod
    def from_summary(cls, summary: AIUsageSummary) -> AIUsageSummaryResponse:
        return cls(
            inputTokens=summary.input_tokens,
            outputTokens=summary.output_tokens,
            totalTokens=summary.total_tokens,
            estimatedCostMicroUsd=summary.estimated_cost_micro_usd,
        )


class AIChatCompletionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    feature: AIFeature = AIFeature.GENERAL_CHAT
    messages: list[AIChatMessageRequest] = Field(min_length=1, max_length=30)
    requested_data_categories: list[AIDataCategory] = Field(
        default_factory=list,
        alias="requestedDataCategories",
        max_length=10,
    )
    provider_name: str | None = Field(default=None, alias="providerName", max_length=80)
    model_name: str | None = Field(default=None, alias="modelName", max_length=120)
    temperature: float | None = Field(default=None, ge=0, le=2)
    max_output_tokens: int | None = Field(default=None, alias="maxOutputTokens", ge=1, le=8192)
    response_format: AIResponseFormat = Field(default=AIResponseFormat.TEXT, alias="responseFormat")
    tools: list[dict[str, Any]] = Field(default_factory=list, max_length=20)
    tool_choice: dict[str, Any] | None = Field(default=None, alias="toolChoice")


class AIChatAssistantMessage(BaseModel):
    role: AIMessageRole = AIMessageRole.ASSISTANT
    content: str


class AIChatCompletionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    request_id: str = Field(alias="requestId")
    feature: AIFeature
    provider_name: str = Field(alias="providerName")
    provider_kind: AIProviderKind = Field(alias="providerKind")
    model_name: str = Field(alias="modelName")
    message: AIChatAssistantMessage
    usage: AIUsageSummaryResponse
    used_fallback: bool = Field(alias="usedFallback")
    usage_record_id: UUID = Field(alias="usageRecordId")

    @classmethod
    def from_result(cls, result: AIChatCompletionResult) -> AIChatCompletionResponse:
        return cls(
            requestId=result.request_id,
            feature=result.feature,
            providerName=result.provider_name,
            providerKind=result.provider_kind,
            modelName=result.model_name,
            message=AIChatAssistantMessage(content=result.content),
            usage=AIUsageSummaryResponse.from_summary(result.usage),
            usedFallback=result.used_fallback,
            usageRecordId=result.usage_record.id,
        )


class AIEmbeddingRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    feature: AIFeature = AIFeature.EMBEDDINGS
    input: list[str] = Field(min_length=1, max_length=64)
    requested_data_categories: list[AIDataCategory] = Field(
        default_factory=list,
        alias="requestedDataCategories",
        max_length=10,
    )
    provider_name: str | None = Field(default=None, alias="providerName", max_length=80)
    model_name: str | None = Field(default=None, alias="modelName", max_length=120)

    @field_validator("input")
    @classmethod
    def validate_input_lengths(cls, value: list[str]) -> list[str]:
        for item in value:
            if len(item.strip()) < 1 or len(item) > 12000:
                raise ValueError("Embedding input must be between 1 and 12000 characters")
        return value


class AIEmbeddingItem(BaseModel):
    index: int
    embedding: list[float]


class AIEmbeddingResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    request_id: str = Field(alias="requestId")
    feature: AIFeature
    provider_name: str = Field(alias="providerName")
    provider_kind: AIProviderKind = Field(alias="providerKind")
    model_name: str = Field(alias="modelName")
    data: list[AIEmbeddingItem]
    usage: AIUsageSummaryResponse
    used_fallback: bool = Field(alias="usedFallback")
    usage_record_id: UUID = Field(alias="usageRecordId")

    @classmethod
    def from_result(cls, result: AIEmbeddingResult) -> AIEmbeddingResponse:
        return cls(
            requestId=result.request_id,
            feature=result.feature,
            providerName=result.provider_name,
            providerKind=result.provider_kind,
            modelName=result.model_name,
            data=[
                AIEmbeddingItem(index=index, embedding=embedding)
                for index, embedding in enumerate(result.embeddings)
            ],
            usage=AIUsageSummaryResponse.from_summary(result.usage),
            usedFallback=result.used_fallback,
            usageRecordId=result.usage_record.id,
        )


class AIUsageRecordResponse(AISchema):
    id: UUID
    request_id: str = Field(alias="requestId")
    feature: AIFeature
    provider_name: str = Field(alias="providerName")
    provider_kind: AIProviderKind = Field(alias="providerKind")
    model_name: str = Field(alias="modelName")
    operation: AIOperation
    status: AIUsageStatus
    input_tokens: int = Field(alias="inputTokens")
    output_tokens: int = Field(alias="outputTokens")
    total_tokens: int = Field(alias="totalTokens")
    estimated_cost_micro_usd: int = Field(alias="estimatedCostMicroUsd")
    latency_ms: int = Field(alias="latencyMs")
    used_fallback: bool = Field(alias="usedFallback")
    error_code: str | None = Field(alias="errorCode")
    error_message: str | None = Field(alias="errorMessage")
    created_at: datetime = Field(alias="createdAt")

    @classmethod
    def from_usage_record(cls, record: AIUsageRecord) -> AIUsageRecordResponse:
        return cls.model_validate(record)


class AIUsageRecordPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[AIUsageRecordResponse]
    total: int
    limit: int
    offset: int
