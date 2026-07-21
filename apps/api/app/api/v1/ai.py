from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse

from app.core.errors import AppError
from app.core.pagination import PaginationParams
from app.dependencies.ai import get_ai_gateway_service
from app.dependencies.auth import get_current_user, verify_allowed_origin
from app.dependencies.pagination import get_pagination
from app.domain.ai import AIFeature, AIOperation
from app.models.auth import User
from app.schemas.ai import (
    AIChatCompletionRequest,
    AIChatCompletionResponse,
    AIConsentPolicyPage,
    AIConsentPolicyResponse,
    AIConsentPolicyUpdate,
    AIEmbeddingRequest,
    AIEmbeddingResponse,
    AIModelConfigurationPage,
    AIModelConfigurationResponse,
    AIModelConfigurationUpdate,
    AIProviderPage,
    AIProviderResponse,
    AIUsageRecordPage,
    AIUsageRecordResponse,
)
from app.schemas.common import ApiErrorResponse
from app.services.ai_adapters import AIAdapterMessage
from app.services.ai_gateway import AIGatewayService

router = APIRouter()

ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    401: {"model": ApiErrorResponse},
    403: {"model": ApiErrorResponse},
    422: {"model": ApiErrorResponse},
    429: {"model": ApiErrorResponse},
    502: {"model": ApiErrorResponse},
}


@router.get("/providers", response_model=AIProviderPage, responses=ERROR_RESPONSES)
async def list_providers(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[AIGatewayService, Depends(get_ai_gateway_service)],
) -> AIProviderPage:
    _ = current_user
    return AIProviderPage(
        items=[AIProviderResponse.from_metadata(metadata) for metadata in service.list_providers()]
    )


@router.get("/consent", response_model=AIConsentPolicyPage, responses=ERROR_RESPONSES)
async def list_consent_policies(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[AIGatewayService, Depends(get_ai_gateway_service)],
) -> AIConsentPolicyPage:
    policies = await service.list_consent_policies(current_user)
    await service.db.commit()
    return AIConsentPolicyPage(
        items=[AIConsentPolicyResponse.from_policy(policy) for policy in policies]
    )


@router.patch(
    "/consent/{feature}",
    response_model=AIConsentPolicyResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def update_consent_policy(
    feature: AIFeature,
    payload: AIConsentPolicyUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[AIGatewayService, Depends(get_ai_gateway_service)],
) -> AIConsentPolicyResponse:
    try:
        policy = await service.update_consent_policy(
            current_user,
            feature,
            payload.model_dump(exclude_unset=True),
        )
        await service.db.commit()
        return AIConsentPolicyResponse.from_policy(policy)
    except Exception:
        await service.db.rollback()
        raise


@router.get("/model-configs", response_model=AIModelConfigurationPage, responses=ERROR_RESPONSES)
async def list_model_configurations(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[AIGatewayService, Depends(get_ai_gateway_service)],
) -> AIModelConfigurationPage:
    configurations = await service.list_model_configurations(current_user)
    await service.db.commit()
    return AIModelConfigurationPage(
        items=[
            AIModelConfigurationResponse.from_configuration(configuration)
            for configuration in configurations
        ]
    )


@router.put(
    "/model-configs/{feature}",
    response_model=AIModelConfigurationResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def update_model_configuration(
    feature: AIFeature,
    payload: AIModelConfigurationUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[AIGatewayService, Depends(get_ai_gateway_service)],
) -> AIModelConfigurationResponse:
    try:
        configuration = await service.update_model_configuration(
            current_user,
            feature,
            payload.model_dump(exclude_unset=True),
        )
        await service.db.commit()
        return AIModelConfigurationResponse.from_configuration(configuration)
    except Exception:
        await service.db.rollback()
        raise


@router.get("/usage", response_model=AIUsageRecordPage, responses=ERROR_RESPONSES)
async def list_usage_records(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[AIGatewayService, Depends(get_ai_gateway_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
    feature: AIFeature | None = Query(default=None),
) -> AIUsageRecordPage:
    page = await service.list_usage_records(current_user, pagination, feature)
    await service.db.commit()
    return AIUsageRecordPage(
        items=[AIUsageRecordResponse.from_usage_record(record) for record in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/chat/completions",
    response_model=AIChatCompletionResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def complete_chat(
    payload: AIChatCompletionRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[AIGatewayService, Depends(get_ai_gateway_service)],
) -> AIChatCompletionResponse:
    try:
        result = await service.complete_chat(
            current_user,
            feature=payload.feature,
            messages=[
                AIAdapterMessage(role=message.role, content=message.content)
                for message in payload.messages
            ],
            requested_data_categories=payload.requested_data_categories,
            provider_name=payload.provider_name,
            model_name=payload.model_name,
            temperature=payload.temperature,
            max_output_tokens=payload.max_output_tokens,
            response_format=payload.response_format,
            tools=payload.tools,
            tool_choice=payload.tool_choice,
        )
        await service.db.commit()
        return AIChatCompletionResponse.from_result(result)
    except AppError:
        await service.db.commit()
        raise
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/chat/completions/stream",
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def stream_chat(
    payload: AIChatCompletionRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[AIGatewayService, Depends(get_ai_gateway_service)],
) -> StreamingResponse:
    try:
        result = await service.complete_chat(
            current_user,
            feature=payload.feature,
            messages=[
                AIAdapterMessage(role=message.role, content=message.content)
                for message in payload.messages
            ],
            requested_data_categories=payload.requested_data_categories,
            operation=AIOperation.STREAMING_CHAT_COMPLETION,
            provider_name=payload.provider_name,
            model_name=payload.model_name,
            temperature=payload.temperature,
            max_output_tokens=payload.max_output_tokens,
            response_format=payload.response_format,
            tools=payload.tools,
            tool_choice=payload.tool_choice,
        )
        await service.db.commit()
    except AppError:
        await service.db.commit()
        raise
    except Exception:
        await service.db.rollback()
        raise

    async def event_stream() -> AsyncIterator[bytes]:
        yield f"event: metadata\ndata: {result.request_id}\n\n".encode()
        for chunk in _stream_chunks(result.content):
            yield f"event: token\ndata: {chunk}\n\n".encode()
        yield b"event: done\ndata: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post(
    "/embeddings",
    response_model=AIEmbeddingResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_embeddings(
    payload: AIEmbeddingRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[AIGatewayService, Depends(get_ai_gateway_service)],
) -> AIEmbeddingResponse:
    if payload.feature != AIFeature.EMBEDDINGS:
        raise AppError(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "invalid_ai_feature",
            "Embedding requests must use the embeddings feature.",
        )
    try:
        result = await service.create_embeddings(
            current_user,
            feature=payload.feature,
            input_texts=payload.input,
            requested_data_categories=payload.requested_data_categories,
            provider_name=payload.provider_name,
            model_name=payload.model_name,
        )
        await service.db.commit()
        return AIEmbeddingResponse.from_result(result)
    except AppError:
        await service.db.commit()
        raise
    except Exception:
        await service.db.rollback()
        raise


def _stream_chunks(text: str, chunk_size: int = 64) -> list[str]:
    if not text:
        return [""]
    return [text[index : index + chunk_size] for index in range(0, len(text), chunk_size)]
