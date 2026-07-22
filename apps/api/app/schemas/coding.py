from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.domain.coding import (
    CODE_RUNNER_SECURITY_REQUIREMENTS,
    CodeAssistantKind,
    CodeAssistantStatus,
    CodeRunnerAvailability,
    CodeSnippetStatus,
    CodingAttemptStatus,
    CodingExerciseDifficulty,
    CodingExerciseStatus,
    CodingLanguage,
)


class CodingSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class CodeSnippetCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    title: str = Field(min_length=1, max_length=200)
    language: CodingLanguage = CodingLanguage.TEXT
    content: str = Field(min_length=1, max_length=120000)
    notes: str | None = Field(default=None, max_length=8000)
    project_id: UUID | None = Field(default=None, alias="projectId")
    file_id: UUID | None = Field(default=None, alias="fileId")


class CodeSnippetUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    title: str | None = Field(default=None, min_length=1, max_length=200)
    language: CodingLanguage | None = None
    content: str | None = Field(default=None, min_length=1, max_length=120000)
    notes: str | None = Field(default=None, max_length=8000)
    project_id: UUID | None = Field(default=None, alias="projectId")
    file_id: UUID | None = Field(default=None, alias="fileId")

    @model_validator(mode="after")
    def require_update_field(self) -> "CodeSnippetUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one snippet field is required")
        return self


class CodeSnippetResponse(CodingSchema):
    id: UUID
    title: str
    language: CodingLanguage
    content: str
    notes: str | None
    status: CodeSnippetStatus
    project_id: UUID | None = Field(alias="projectId")
    file_id: UUID | None = Field(alias="fileId")
    archived_at: datetime | None = Field(alias="archivedAt")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class CodeSnippetPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[CodeSnippetResponse]
    total: int
    limit: int
    offset: int


class CodingExerciseCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    title: str = Field(min_length=1, max_length=200)
    language: CodingLanguage = CodingLanguage.TEXT
    prompt: str = Field(min_length=1, max_length=12000)
    starter_code: str = Field(default="", max_length=120000, alias="starterCode")
    solution_notes: str | None = Field(default=None, max_length=12000, alias="solutionNotes")
    difficulty: CodingExerciseDifficulty = CodingExerciseDifficulty.PRACTICE
    topic_id: UUID | None = Field(default=None, alias="topicId")
    project_id: UUID | None = Field(default=None, alias="projectId")


class CodingExerciseResponse(CodingSchema):
    id: UUID
    title: str
    language: CodingLanguage
    prompt: str
    starter_code: str = Field(alias="starterCode")
    solution_notes: str | None = Field(alias="solutionNotes")
    difficulty: CodingExerciseDifficulty
    status: CodingExerciseStatus
    topic_id: UUID | None = Field(alias="topicId")
    project_id: UUID | None = Field(alias="projectId")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class CodingExercisePage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[CodingExerciseResponse]
    total: int
    limit: int
    offset: int


class CodingAttemptCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    submitted_code: str = Field(min_length=1, max_length=120000, alias="submittedCode")
    snippet_id: UUID | None = Field(default=None, alias="snippetId")
    notes: str | None = Field(default=None, max_length=8000)


class CodingAttemptResponse(CodingSchema):
    id: UUID
    exercise_id: UUID = Field(alias="exerciseId")
    snippet_id: UUID | None = Field(alias="snippetId")
    submitted_code: str = Field(alias="submittedCode")
    notes: str | None
    feedback: str | None
    status: CodingAttemptStatus
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class CodeAssistantCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    code: str | None = Field(default=None, min_length=1, max_length=120000)
    language: CodingLanguage | None = None
    prompt: str | None = Field(default=None, max_length=4000)
    snippet_id: UUID | None = Field(default=None, alias="snippetId")
    project_id: UUID | None = Field(default=None, alias="projectId")
    include_project_context: bool = Field(default=False, alias="includeProjectContext")
    provider_name: str | None = Field(default=None, max_length=80, alias="providerName")
    model_name: str | None = Field(default=None, max_length=120, alias="modelName")

    @model_validator(mode="after")
    def require_code_or_snippet(self) -> "CodeAssistantCreate":
        if self.code is None and self.snippet_id is None:
            raise ValueError("Provide code or a snippet ID.")
        return self


class CodeAssistantResponse(CodingSchema):
    id: UUID
    snippet_id: UUID | None = Field(alias="snippetId")
    project_id: UUID | None = Field(alias="projectId")
    ai_usage_record_id: UUID | None = Field(alias="aiUsageRecordId")
    kind: CodeAssistantKind
    language: CodingLanguage
    prompt: str | None
    code_excerpt: str = Field(alias="codeExcerpt")
    response: str
    status: CodeAssistantStatus
    provider_name: str | None = Field(alias="providerName")
    model_name: str | None = Field(alias="modelName")
    error_code: str | None = Field(alias="errorCode")
    error_message: str | None = Field(alias="errorMessage")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class CodeAssistantRequestPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[CodeAssistantResponse]
    total: int
    limit: int
    offset: int


class CodeRunnerStatusResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    availability: CodeRunnerAvailability = CodeRunnerAvailability.UNAVAILABLE
    execution_available: bool = Field(default=False, alias="executionAvailable")
    provider_name: str = Field(default="none", alias="providerName")
    reason: str
    supported_languages: list[CodingLanguage] = Field(alias="supportedLanguages")
    security_requirements: list[str] = Field(alias="securityRequirements")

    @classmethod
    def unavailable(cls) -> "CodeRunnerStatusResponse":
        return cls(
            reason=(
                "Aetherium stores snippets and exercises, but no sandboxed execution provider is "
                "connected. Code is never executed in the API, worker, database, or web container."
            ),
            supportedLanguages=list(CodingLanguage),
            securityRequirements=list(CODE_RUNNER_SECURITY_REQUIREMENTS),
        )
