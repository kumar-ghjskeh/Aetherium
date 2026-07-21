from __future__ import annotations

import hashlib
from collections.abc import AsyncIterator, Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any, Protocol, cast

import httpx

from app.core.config import Settings
from app.domain.ai import (
    AETHERIUM_DETERMINISTIC_PROVIDER,
    ANTHROPIC_PROVIDER,
    OLLAMA_PROVIDER,
    OPENAI_PROVIDER,
    AIMessageRole,
    AIProviderCapability,
    AIProviderKind,
    AIResponseFormat,
)


class AIProviderError(Exception):
    def __init__(self, code: str, message: str, *, retryable: bool = False):
        self.code = code
        self.message = message
        self.retryable = retryable
        super().__init__(message)


@dataclass(frozen=True)
class AIProviderMetadata:
    name: str
    kind: AIProviderKind
    display_name: str
    external: bool
    configured: bool
    capabilities: tuple[AIProviderCapability, ...]
    default_chat_model: str | None = None
    default_embedding_model: str | None = None


@dataclass(frozen=True)
class AIAdapterMessage:
    role: AIMessageRole
    content: str


@dataclass(frozen=True)
class AIAdapterChatRequest:
    messages: Sequence[AIAdapterMessage]
    model: str
    temperature: float
    max_output_tokens: int
    response_format: AIResponseFormat = AIResponseFormat.TEXT
    tools: Sequence[Mapping[str, Any]] = field(default_factory=tuple)
    tool_choice: Mapping[str, Any] | None = None


@dataclass(frozen=True)
class AIAdapterChatResponse:
    content: str
    input_tokens: int
    output_tokens: int
    total_tokens: int


@dataclass(frozen=True)
class AIAdapterEmbeddingRequest:
    input: Sequence[str]
    model: str


@dataclass(frozen=True)
class AIAdapterEmbeddingResponse:
    embeddings: list[list[float]]
    input_tokens: int
    output_tokens: int
    total_tokens: int


class AIProviderAdapter(Protocol):
    @property
    def metadata(self) -> AIProviderMetadata: ...

    async def chat(self, request: AIAdapterChatRequest) -> AIAdapterChatResponse: ...

    async def stream_chat(self, request: AIAdapterChatRequest) -> AsyncIterator[str]: ...

    async def embeddings(
        self, request: AIAdapterEmbeddingRequest
    ) -> AIAdapterEmbeddingResponse: ...


class DeterministicAetheriumAdapter:
    def __init__(self) -> None:
        self._metadata = AIProviderMetadata(
            name=AETHERIUM_DETERMINISTIC_PROVIDER,
            kind=AIProviderKind.AETHERIUM_DETERMINISTIC,
            display_name="Aetherium deterministic adapter",
            external=False,
            configured=True,
            capabilities=(
                AIProviderCapability.CHAT,
                AIProviderCapability.STREAMING_CHAT,
                AIProviderCapability.EMBEDDINGS,
                AIProviderCapability.STRUCTURED_OUTPUTS,
                AIProviderCapability.TOOL_CALLING,
            ),
            default_chat_model="aetherium-deterministic-chat",
            default_embedding_model="aetherium-deterministic-embedding",
        )

    @property
    def metadata(self) -> AIProviderMetadata:
        return self._metadata

    async def chat(self, request: AIAdapterChatRequest) -> AIAdapterChatResponse:
        user_messages = [
            message.content for message in request.messages if message.role == AIMessageRole.USER
        ]
        seed_text = user_messages[-1] if user_messages else "No user message supplied."
        if request.response_format == AIResponseFormat.JSON_OBJECT:
            content = '{"response":"Aetherium deterministic response","source":"local"}'
        else:
            content = f"Aetherium deterministic response: {seed_text[:240]}"
        input_tokens = _estimate_tokens(" ".join(message.content for message in request.messages))
        output_tokens = _estimate_tokens(content)
        return AIAdapterChatResponse(
            content=content,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=input_tokens + output_tokens,
        )

    async def stream_chat(self, request: AIAdapterChatRequest) -> AsyncIterator[str]:
        response = await self.chat(request)
        for chunk in _chunk_text(response.content):
            yield chunk

    async def embeddings(self, request: AIAdapterEmbeddingRequest) -> AIAdapterEmbeddingResponse:
        embeddings = [_deterministic_embedding(item) for item in request.input]
        input_tokens = sum(_estimate_tokens(item) for item in request.input)
        return AIAdapterEmbeddingResponse(
            embeddings=embeddings,
            input_tokens=input_tokens,
            output_tokens=0,
            total_tokens=input_tokens,
        )


class OpenAICompatibleAdapter:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._metadata = AIProviderMetadata(
            name=OPENAI_PROVIDER,
            kind=AIProviderKind.OPENAI_COMPATIBLE,
            display_name="OpenAI-compatible provider",
            external=True,
            configured=bool(settings.ai_openai_api_key),
            capabilities=(
                AIProviderCapability.CHAT,
                AIProviderCapability.STREAMING_CHAT,
                AIProviderCapability.EMBEDDINGS,
                AIProviderCapability.STRUCTURED_OUTPUTS,
                AIProviderCapability.TOOL_CALLING,
            ),
            default_chat_model=settings.ai_openai_chat_model,
            default_embedding_model=settings.ai_openai_embedding_model,
        )

    @property
    def metadata(self) -> AIProviderMetadata:
        return self._metadata

    async def chat(self, request: AIAdapterChatRequest) -> AIAdapterChatResponse:
        if not self.settings.ai_openai_api_key:
            raise AIProviderError(
                "provider_unconfigured", "OpenAI-compatible provider is not configured."
            )

        payload: dict[str, Any] = {
            "max_tokens": request.max_output_tokens,
            "messages": [
                {"role": message.role.value, "content": message.content}
                for message in request.messages
            ],
            "model": request.model,
            "temperature": request.temperature,
        }
        if request.response_format == AIResponseFormat.JSON_OBJECT:
            payload["response_format"] = {"type": "json_object"}
        if request.tools:
            payload["tools"] = list(request.tools)
        if request.tool_choice is not None:
            payload["tool_choice"] = dict(request.tool_choice)

        data = await self._post_json("/chat/completions", payload)
        choices = data.get("choices") if isinstance(data, dict) else None
        content = ""
        if isinstance(choices, list) and choices:
            first = choices[0]
            if isinstance(first, dict):
                message = first.get("message")
                if isinstance(message, dict):
                    raw_content = message.get("content")
                    content = raw_content if isinstance(raw_content, str) else ""
        usage = data.get("usage") if isinstance(data, dict) else None
        input_tokens, output_tokens, total_tokens = _usage_tokens(usage, content, request.messages)
        return AIAdapterChatResponse(
            content=content,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
        )

    async def stream_chat(self, request: AIAdapterChatRequest) -> AsyncIterator[str]:
        response = await self.chat(request)
        for chunk in _chunk_text(response.content):
            yield chunk

    async def embeddings(self, request: AIAdapterEmbeddingRequest) -> AIAdapterEmbeddingResponse:
        if not self.settings.ai_openai_api_key:
            raise AIProviderError(
                "provider_unconfigured", "OpenAI-compatible provider is not configured."
            )
        data = await self._post_json(
            "/embeddings",
            {"input": list(request.input), "model": request.model},
        )
        raw_data = data.get("data") if isinstance(data, dict) else None
        embeddings: list[list[float]] = []
        if isinstance(raw_data, list):
            for item in raw_data:
                if isinstance(item, dict) and isinstance(item.get("embedding"), list):
                    embeddings.append([float(value) for value in item["embedding"]])
        usage = data.get("usage") if isinstance(data, dict) else None
        input_tokens = _usage_int(usage, "prompt_tokens") or sum(
            _estimate_tokens(item) for item in request.input
        )
        total_tokens = _usage_int(usage, "total_tokens") or input_tokens
        return AIAdapterEmbeddingResponse(
            embeddings=embeddings,
            input_tokens=input_tokens,
            output_tokens=0,
            total_tokens=total_tokens,
        )

    async def _post_json(self, path: str, payload: Mapping[str, Any]) -> dict[str, Any]:
        return await _post_json(
            f"{self.settings.ai_openai_base_url.rstrip('/')}{path}",
            payload,
            headers={"Authorization": f"Bearer {self.settings.ai_openai_api_key}"},
            timeout_seconds=self.settings.ai_timeout_seconds,
        )


class AnthropicCompatibleAdapter:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._metadata = AIProviderMetadata(
            name=ANTHROPIC_PROVIDER,
            kind=AIProviderKind.ANTHROPIC_COMPATIBLE,
            display_name="Anthropic-compatible provider",
            external=True,
            configured=bool(settings.ai_anthropic_api_key),
            capabilities=(
                AIProviderCapability.CHAT,
                AIProviderCapability.STREAMING_CHAT,
                AIProviderCapability.STRUCTURED_OUTPUTS,
                AIProviderCapability.TOOL_CALLING,
            ),
            default_chat_model=settings.ai_anthropic_chat_model,
            default_embedding_model=None,
        )

    @property
    def metadata(self) -> AIProviderMetadata:
        return self._metadata

    async def chat(self, request: AIAdapterChatRequest) -> AIAdapterChatResponse:
        if not self.settings.ai_anthropic_api_key:
            raise AIProviderError(
                "provider_unconfigured", "Anthropic-compatible provider is not configured."
            )

        system_messages = [
            message.content for message in request.messages if message.role == AIMessageRole.SYSTEM
        ]
        user_messages = [
            {"role": message.role.value, "content": message.content}
            for message in request.messages
            if message.role != AIMessageRole.SYSTEM
        ]
        payload: dict[str, Any] = {
            "max_tokens": request.max_output_tokens,
            "messages": user_messages,
            "model": request.model,
            "temperature": request.temperature,
        }
        if system_messages:
            payload["system"] = "\n\n".join(system_messages)
        if request.tools:
            payload["tools"] = list(request.tools)
        if request.tool_choice is not None:
            payload["tool_choice"] = dict(request.tool_choice)

        data = await _post_json(
            f"{self.settings.ai_anthropic_base_url.rstrip('/')}/v1/messages",
            payload,
            headers={
                "anthropic-version": "2023-06-01",
                "x-api-key": self.settings.ai_anthropic_api_key,
            },
            timeout_seconds=self.settings.ai_timeout_seconds,
        )
        content = _anthropic_text_content(data.get("content") if isinstance(data, dict) else None)
        usage = data.get("usage") if isinstance(data, dict) else None
        input_tokens = _usage_int(usage, "input_tokens") or _estimate_tokens(
            " ".join(message.content for message in request.messages)
        )
        output_tokens = _usage_int(usage, "output_tokens") or _estimate_tokens(content)
        return AIAdapterChatResponse(
            content=content,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=input_tokens + output_tokens,
        )

    async def stream_chat(self, request: AIAdapterChatRequest) -> AsyncIterator[str]:
        response = await self.chat(request)
        for chunk in _chunk_text(response.content):
            yield chunk

    async def embeddings(self, _request: AIAdapterEmbeddingRequest) -> AIAdapterEmbeddingResponse:
        raise AIProviderError(
            "provider_capability_unavailable",
            "Anthropic-compatible embeddings are not configured in this gateway.",
        )


class OllamaCompatibleAdapter:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._metadata = AIProviderMetadata(
            name=OLLAMA_PROVIDER,
            kind=AIProviderKind.OLLAMA_COMPATIBLE,
            display_name="Ollama-compatible local provider",
            external=True,
            configured=bool(settings.ai_ollama_base_url),
            capabilities=(
                AIProviderCapability.CHAT,
                AIProviderCapability.STREAMING_CHAT,
                AIProviderCapability.EMBEDDINGS,
            ),
            default_chat_model=settings.ai_ollama_chat_model,
            default_embedding_model=settings.ai_ollama_embedding_model,
        )

    @property
    def metadata(self) -> AIProviderMetadata:
        return self._metadata

    async def chat(self, request: AIAdapterChatRequest) -> AIAdapterChatResponse:
        data = await _post_json(
            f"{self.settings.ai_ollama_base_url.rstrip('/')}/api/chat",
            {
                "messages": [
                    {"role": message.role.value, "content": message.content}
                    for message in request.messages
                ],
                "model": request.model,
                "options": {
                    "num_predict": request.max_output_tokens,
                    "temperature": request.temperature,
                },
                "stream": False,
            },
            headers={},
            timeout_seconds=self.settings.ai_timeout_seconds,
        )
        message = data.get("message") if isinstance(data, dict) else None
        content = ""
        if isinstance(message, dict) and isinstance(message.get("content"), str):
            content = message["content"]
        input_tokens = _estimate_tokens(" ".join(message.content for message in request.messages))
        output_tokens = _estimate_tokens(content)
        return AIAdapterChatResponse(
            content=content,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=input_tokens + output_tokens,
        )

    async def stream_chat(self, request: AIAdapterChatRequest) -> AsyncIterator[str]:
        response = await self.chat(request)
        for chunk in _chunk_text(response.content):
            yield chunk

    async def embeddings(self, request: AIAdapterEmbeddingRequest) -> AIAdapterEmbeddingResponse:
        embeddings: list[list[float]] = []
        for item in request.input:
            data = await _post_json(
                f"{self.settings.ai_ollama_base_url.rstrip('/')}/api/embeddings",
                {"model": request.model, "prompt": item},
                headers={},
                timeout_seconds=self.settings.ai_timeout_seconds,
            )
            raw_embedding = data.get("embedding") if isinstance(data, dict) else None
            if isinstance(raw_embedding, list):
                embeddings.append([float(value) for value in raw_embedding])
        input_tokens = sum(_estimate_tokens(item) for item in request.input)
        return AIAdapterEmbeddingResponse(
            embeddings=embeddings,
            input_tokens=input_tokens,
            output_tokens=0,
            total_tokens=input_tokens,
        )


def create_default_ai_adapters(settings: Settings) -> dict[str, AIProviderAdapter]:
    adapters: dict[str, AIProviderAdapter] = {
        AETHERIUM_DETERMINISTIC_PROVIDER: cast(AIProviderAdapter, DeterministicAetheriumAdapter()),
        OPENAI_PROVIDER: cast(AIProviderAdapter, OpenAICompatibleAdapter(settings)),
        ANTHROPIC_PROVIDER: cast(AIProviderAdapter, AnthropicCompatibleAdapter(settings)),
        OLLAMA_PROVIDER: cast(AIProviderAdapter, OllamaCompatibleAdapter(settings)),
    }
    return adapters


async def _post_json(
    url: str,
    payload: Mapping[str, Any],
    *,
    headers: Mapping[str, str],
    timeout_seconds: int,
) -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            response = await client.post(url, json=payload, headers=dict(headers))
            response.raise_for_status()
            data = response.json()
    except httpx.TimeoutException as exc:
        raise AIProviderError(
            "provider_timeout", "AI provider request timed out.", retryable=True
        ) from exc
    except httpx.HTTPStatusError as exc:
        retryable = 500 <= exc.response.status_code < 600 or exc.response.status_code == 429
        raise AIProviderError(
            "provider_http_error",
            "AI provider returned an error.",
            retryable=retryable,
        ) from exc
    except httpx.HTTPError as exc:
        raise AIProviderError(
            "provider_request_failed", "AI provider request failed.", retryable=True
        ) from exc
    except ValueError as exc:
        raise AIProviderError(
            "provider_invalid_response", "AI provider returned invalid JSON."
        ) from exc

    if not isinstance(data, dict):
        raise AIProviderError(
            "provider_invalid_response", "AI provider returned an invalid payload."
        )
    return data


def _estimate_tokens(text: str) -> int:
    compact = " ".join(text.split())
    if not compact:
        return 0
    return max(1, len(compact) // 4)


def _usage_int(usage: object, key: str) -> int | None:
    if isinstance(usage, dict):
        value = usage.get(key)
        if isinstance(value, int):
            return value
    return None


def _usage_tokens(
    usage: object,
    content: str,
    messages: Sequence[AIAdapterMessage],
) -> tuple[int, int, int]:
    input_tokens = _usage_int(usage, "prompt_tokens")
    output_tokens = _usage_int(usage, "completion_tokens")
    total_tokens = _usage_int(usage, "total_tokens")
    if input_tokens is None:
        input_tokens = _estimate_tokens(" ".join(message.content for message in messages))
    if output_tokens is None:
        output_tokens = _estimate_tokens(content)
    if total_tokens is None:
        total_tokens = input_tokens + output_tokens
    return input_tokens, output_tokens, total_tokens


def _anthropic_text_content(content: object) -> str:
    if not isinstance(content, list):
        return ""
    pieces: list[str] = []
    for item in content:
        if (
            isinstance(item, dict)
            and item.get("type") == "text"
            and isinstance(item.get("text"), str)
        ):
            pieces.append(item["text"])
    return "\n".join(pieces)


def _chunk_text(text: str, chunk_size: int = 64) -> list[str]:
    if not text:
        return [""]
    return [text[index : index + chunk_size] for index in range(0, len(text), chunk_size)]


def _deterministic_embedding(text: str, dimensions: int = 8) -> list[float]:
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    values = []
    for index in range(dimensions):
        value = digest[index] / 255
        values.append(round((value * 2) - 1, 6))
    return values
