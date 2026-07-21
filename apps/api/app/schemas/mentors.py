from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.domain.ai import AIMessageRole
from app.domain.mentors import (
    ConversationMemoryPolicy,
    ConversationStatus,
    MentorTone,
    MentorTool,
    MessageSourceType,
    MessageStatus,
)
from app.models.mentors import (
    ConversationMemorySettings,
    MentorPermission,
    Message,
    MessageSource,
)
from app.services.mentors import ConversationExport, ConversationView, MentorView, MessageSendResult


class MentorSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class MentorPermissionResponse(MentorSchema):
    id: UUID
    mentor_id: UUID = Field(alias="mentorId")
    allowed_tools: list[MentorTool] = Field(alias="allowedTools")
    allowed_collection_ids: list[str] = Field(alias="allowedCollectionIds")
    allow_file_content: bool = Field(alias="allowFileContent")
    allow_conversations: bool = Field(alias="allowConversations")
    allow_projects: bool = Field(alias="allowProjects")
    allow_learning_records: bool = Field(alias="allowLearningRecords")
    allow_habit_data: bool = Field(alias="allowHabitData")
    allow_profile_data: bool = Field(alias="allowProfileData")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_permission(cls, permission: MentorPermission) -> MentorPermissionResponse:
        return cls.model_validate(permission)


class MentorResponse(MentorSchema):
    id: UUID
    slug: str
    name: str
    fictional_identity: str = Field(alias="fictionalIdentity")
    avatar_reference: str | None = Field(alias="avatarReference")
    description: str
    system_instructions: str = Field(alias="systemInstructions")
    tone: MentorTone
    preferred_model_name: str | None = Field(alias="preferredModelName")
    is_default: bool = Field(alias="isDefault")
    archived_at: datetime | None = Field(alias="archivedAt")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    permissions: MentorPermissionResponse

    @classmethod
    def from_view(cls, view: MentorView) -> MentorResponse:
        return cls(
            id=view.mentor.id,
            slug=view.mentor.slug,
            name=view.mentor.name,
            fictionalIdentity=view.mentor.fictional_identity,
            avatarReference=view.mentor.avatar_reference,
            description=view.mentor.description,
            systemInstructions=view.mentor.system_instructions,
            tone=MentorTone(view.mentor.tone),
            preferredModelName=view.mentor.preferred_model_name,
            isDefault=view.mentor.is_default,
            archivedAt=view.mentor.archived_at,
            createdAt=view.mentor.created_at,
            updatedAt=view.mentor.updated_at,
            permissions=MentorPermissionResponse.from_permission(view.permissions),
        )


class MentorPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[MentorResponse]


class MentorCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    name: str = Field(min_length=1, max_length=80)
    fictional_identity: str = Field(alias="fictionalIdentity", min_length=1, max_length=160)
    avatar_reference: str | None = Field(default=None, alias="avatarReference", max_length=160)
    description: str = Field(min_length=1, max_length=2000)
    system_instructions: str = Field(alias="systemInstructions", min_length=20, max_length=12000)
    tone: MentorTone = MentorTone.CALM
    preferred_model_name: str | None = Field(
        default=None, alias="preferredModelName", max_length=120
    )
    allowed_tools: list[MentorTool] = Field(
        default_factory=lambda: [MentorTool.EXPLAIN],
        alias="allowedTools",
        max_length=20,
    )

    @field_validator("allowed_tools")
    @classmethod
    def dedupe_tools(cls, value: list[MentorTool]) -> list[MentorTool]:
        return list(dict.fromkeys(value))


class MentorUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    name: str | None = Field(default=None, min_length=1, max_length=80)
    fictional_identity: str | None = Field(
        default=None, alias="fictionalIdentity", min_length=1, max_length=160
    )
    avatar_reference: str | None = Field(default=None, alias="avatarReference", max_length=160)
    description: str | None = Field(default=None, min_length=1, max_length=2000)
    system_instructions: str | None = Field(
        default=None, alias="systemInstructions", min_length=20, max_length=12000
    )
    tone: MentorTone | None = None
    preferred_model_name: str | None = Field(
        default=None, alias="preferredModelName", max_length=120
    )

    @model_validator(mode="after")
    def require_update_field(self) -> MentorUpdateRequest:
        if not self.model_fields_set:
            raise ValueError("At least one mentor field is required")
        return self


class MentorPermissionUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    allowed_tools: list[MentorTool] | None = Field(
        default=None, alias="allowedTools", max_length=20
    )
    allowed_collection_ids: list[str] | None = Field(
        default=None, alias="allowedCollectionIds", max_length=100
    )
    allow_file_content: bool | None = Field(default=None, alias="allowFileContent")
    allow_conversations: bool | None = Field(default=None, alias="allowConversations")
    allow_projects: bool | None = Field(default=None, alias="allowProjects")
    allow_learning_records: bool | None = Field(default=None, alias="allowLearningRecords")
    allow_habit_data: bool | None = Field(default=None, alias="allowHabitData")
    allow_profile_data: bool | None = Field(default=None, alias="allowProfileData")

    @field_validator("allowed_tools")
    @classmethod
    def dedupe_permission_tools(cls, value: list[MentorTool] | None) -> list[MentorTool] | None:
        if value is None:
            return value
        return list(dict.fromkeys(value))

    @field_validator("allowed_collection_ids")
    @classmethod
    def dedupe_collection_ids(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return value
        return list(dict.fromkeys(value))

    @model_validator(mode="after")
    def require_update_field(self) -> MentorPermissionUpdate:
        if not self.model_fields_set:
            raise ValueError("At least one mentor permission field is required")
        return self


class ConversationMemorySettingsResponse(MentorSchema):
    id: UUID
    conversation_id: UUID = Field(alias="conversationId")
    memory_enabled: bool = Field(alias="memoryEnabled")
    memory_policy: ConversationMemoryPolicy = Field(alias="memoryPolicy")
    memory_summary: str | None = Field(alias="memorySummary")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_settings(
        cls, settings: ConversationMemorySettings
    ) -> ConversationMemorySettingsResponse:
        return cls.model_validate(settings)


class ConversationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: UUID
    mentor_id: UUID = Field(alias="mentorId")
    mentor_name: str = Field(alias="mentorName")
    title: str
    status: ConversationStatus
    archived_at: datetime | None = Field(alias="archivedAt")
    deleted_at: datetime | None = Field(alias="deletedAt")
    last_message_at: datetime | None = Field(alias="lastMessageAt")
    message_count: int = Field(alias="messageCount")
    memory_settings: ConversationMemorySettingsResponse = Field(alias="memorySettings")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_view(cls, view: ConversationView) -> ConversationResponse:
        return cls(
            id=view.conversation.id,
            mentorId=view.mentor.id,
            mentorName=view.mentor.name,
            title=view.conversation.title,
            status=ConversationStatus(view.conversation.status),
            archivedAt=view.conversation.archived_at,
            deletedAt=view.conversation.deleted_at,
            lastMessageAt=view.conversation.last_message_at,
            messageCount=view.message_count,
            memorySettings=ConversationMemorySettingsResponse.from_settings(view.memory_settings),
            createdAt=view.conversation.created_at,
            updatedAt=view.conversation.updated_at,
        )


class ConversationPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[ConversationResponse]
    total: int
    limit: int
    offset: int


class ConversationCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    mentor_id: UUID = Field(alias="mentorId")
    title: str | None = Field(default=None, min_length=1, max_length=160)


class ConversationUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    title: str | None = Field(default=None, min_length=1, max_length=160)

    @model_validator(mode="after")
    def require_update_field(self) -> ConversationUpdateRequest:
        if not self.model_fields_set:
            raise ValueError("At least one conversation field is required")
        return self


class ConversationMemorySettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    memory_enabled: bool = Field(alias="memoryEnabled")
    memory_policy: ConversationMemoryPolicy | None = Field(default=None, alias="memoryPolicy")


class MessageSourceResponse(MentorSchema):
    id: UUID
    message_id: UUID = Field(alias="messageId")
    source_type: MessageSourceType = Field(alias="sourceType")
    source_id: str | None = Field(alias="sourceId")
    title: str
    url: str | None
    page_number: int | None = Field(alias="pageNumber")
    section_label: str | None = Field(alias="sectionLabel")
    snippet: str | None
    metadata: dict[str, Any]
    created_at: datetime = Field(alias="createdAt")

    @classmethod
    def from_source(cls, source: MessageSource) -> MessageSourceResponse:
        return cls(
            id=source.id,
            messageId=source.message_id,
            sourceType=MessageSourceType(source.source_type),
            sourceId=source.source_id,
            title=source.title,
            url=source.url,
            pageNumber=source.page_number,
            sectionLabel=source.section_label,
            snippet=source.snippet,
            metadata=source.metadata_json,
            createdAt=source.created_at,
        )


class MessageResponse(MentorSchema):
    id: UUID
    conversation_id: UUID = Field(alias="conversationId")
    role: AIMessageRole
    content: str
    status: MessageStatus
    ai_usage_record_id: UUID | None = Field(alias="aiUsageRecordId")
    provider_name: str | None = Field(alias="providerName")
    model_name: str | None = Field(alias="modelName")
    error_code: str | None = Field(alias="errorCode")
    error_message: str | None = Field(alias="errorMessage")
    edited_from_message_id: UUID | None = Field(alias="editedFromMessageId")
    regenerated_from_message_id: UUID | None = Field(alias="regeneratedFromMessageId")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_message(cls, message: Message) -> MessageResponse:
        return cls.model_validate(message)


class MessagePage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[MessageResponse]
    total: int
    limit: int
    offset: int


class MessageSendRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: str = Field(min_length=1, max_length=12000)


class MessageSendResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    conversation: ConversationResponse
    user_message: MessageResponse | None = Field(alias="userMessage")
    assistant_message: MessageResponse = Field(alias="assistantMessage")

    @classmethod
    def from_result(
        cls,
        result: MessageSendResult,
        conversation_view: ConversationView,
    ) -> MessageSendResponse:
        return cls(
            conversation=ConversationResponse.from_view(conversation_view),
            userMessage=MessageResponse.from_message(result.user_message)
            if result.user_message is not None
            else None,
            assistantMessage=MessageResponse.from_message(result.assistant_message),
        )


class ConversationExportMessage(MessageResponse):
    sources: list[MessageSourceResponse]


class ConversationExportResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    exported_at: datetime = Field(alias="exportedAt")
    conversation: ConversationResponse
    mentor: MentorResponse
    messages: list[ConversationExportMessage]

    @classmethod
    def from_export(
        cls,
        exported: ConversationExport,
        conversation_view: ConversationView,
        mentor_view: MentorView,
    ) -> ConversationExportResponse:
        return cls(
            exportedAt=datetime.now(UTC),
            conversation=ConversationResponse.from_view(conversation_view),
            mentor=MentorResponse.from_view(mentor_view),
            messages=[
                ConversationExportMessage(
                    **MessageResponse.from_message(message).model_dump(by_alias=True),
                    sources=[
                        MessageSourceResponse.from_source(source)
                        for source in exported.sources_by_message_id.get(message.id, [])
                    ],
                )
                for message in exported.messages
            ],
        )


class StopGenerationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    stopped: bool
    reason: str
