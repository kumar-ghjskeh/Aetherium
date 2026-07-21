from __future__ import annotations

from enum import StrEnum


class AIFeature(StrEnum):
    GENERAL_CHAT = "general_chat"
    EMBEDDINGS = "embeddings"
    DOCUMENT_QA = "document_qa"
    MENTOR_CHAT = "mentor_chat"
    LEARNING_ASSISTANT = "learning_assistant"
    CODING_ASSISTANT = "coding_assistant"


class AIProviderKind(StrEnum):
    AETHERIUM_DETERMINISTIC = "aetherium_deterministic"
    OPENAI_COMPATIBLE = "openai_compatible"
    ANTHROPIC_COMPATIBLE = "anthropic_compatible"
    OLLAMA_COMPATIBLE = "ollama_compatible"


class AIProviderCapability(StrEnum):
    CHAT = "chat"
    STREAMING_CHAT = "streaming_chat"
    EMBEDDINGS = "embeddings"
    STRUCTURED_OUTPUTS = "structured_outputs"
    TOOL_CALLING = "tool_calling"


class AIMessageRole(StrEnum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"


class AIDataCategory(StrEnum):
    FILE_CONTENT = "file_content"
    COLLECTIONS = "collections"
    CONVERSATIONS = "conversations"
    PROJECTS = "projects"
    LEARNING_RECORDS = "learning_records"
    HABIT_DATA = "habit_data"
    PROFILE_DATA = "profile_data"


class AIOperation(StrEnum):
    CHAT_COMPLETION = "chat_completion"
    STREAMING_CHAT_COMPLETION = "streaming_chat_completion"
    EMBEDDING = "embedding"


class AIUsageStatus(StrEnum):
    SUCCESS = "success"
    FAILED = "failed"
    BLOCKED = "blocked"
    RATE_LIMITED = "rate_limited"


class AIResponseFormat(StrEnum):
    TEXT = "text"
    JSON_OBJECT = "json_object"


AETHERIUM_DETERMINISTIC_PROVIDER = "aetherium_deterministic"
OPENAI_PROVIDER = "openai"
ANTHROPIC_PROVIDER = "anthropic"
OLLAMA_PROVIDER = "ollama"
DISABLED_PROVIDER = "disabled"

KNOWN_PROVIDER_NAMES = {
    AETHERIUM_DETERMINISTIC_PROVIDER,
    OPENAI_PROVIDER,
    ANTHROPIC_PROVIDER,
    OLLAMA_PROVIDER,
    DISABLED_PROVIDER,
}

EXTERNAL_PROVIDER_NAMES = {OPENAI_PROVIDER, ANTHROPIC_PROVIDER, OLLAMA_PROVIDER}

DEFAULT_CHAT_MODEL_BY_PROVIDER = {
    AETHERIUM_DETERMINISTIC_PROVIDER: "aetherium-deterministic-chat",
    OPENAI_PROVIDER: "gpt-4.1-mini",
    ANTHROPIC_PROVIDER: "claude-3-5-haiku-latest",
    OLLAMA_PROVIDER: "llama3.1",
}

DEFAULT_EMBEDDING_MODEL_BY_PROVIDER = {
    AETHERIUM_DETERMINISTIC_PROVIDER: "aetherium-deterministic-embedding",
    OPENAI_PROVIDER: "text-embedding-3-small",
    OLLAMA_PROVIDER: "nomic-embed-text",
}
