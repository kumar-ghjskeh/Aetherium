from enum import StrEnum


class CodingLanguage(StrEnum):
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    SQL = "sql"
    CPP = "cpp"
    SYSTEMVERILOG = "systemverilog"
    TEXT = "text"


class CodeSnippetStatus(StrEnum):
    ACTIVE = "active"
    ARCHIVED = "archived"


class CodingExerciseDifficulty(StrEnum):
    INTRO = "intro"
    PRACTICE = "practice"
    CHALLENGE = "challenge"


class CodingExerciseStatus(StrEnum):
    ACTIVE = "active"
    ARCHIVED = "archived"


class CodingAttemptStatus(StrEnum):
    SUBMITTED = "submitted"
    REVIEWED = "reviewed"


class CodeAssistantKind(StrEnum):
    EXPLAIN = "explain"
    REVIEW = "review"


class CodeAssistantStatus(StrEnum):
    COMPLETE = "complete"
    FAILED = "failed"


class CodeRunnerAvailability(StrEnum):
    UNAVAILABLE = "unavailable"


CODE_RUNNER_SECURITY_REQUIREMENTS = (
    "cpu_limit",
    "memory_limit",
    "execution_timeout",
    "network_disabled_by_default",
    "ephemeral_filesystem",
    "read_only_base_image",
    "output_size_limit",
    "language_allowlist",
    "no_aetherium_secrets",
    "no_aetherium_database_access",
    "no_object_storage_credentials",
)
