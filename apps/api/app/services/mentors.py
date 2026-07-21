from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID, uuid4

from fastapi import status
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.pagination import PaginationParams
from app.domain.ai import AIFeature, AIMessageRole
from app.domain.mentors import (
    DEFAULT_CONTEXT_MESSAGE_LIMIT,
    DEFAULT_MENTORS,
    ConversationMemoryPolicy,
    ConversationStatus,
    MentorTone,
    MentorTool,
    MessageStatus,
)
from app.models.auth import User
from app.models.mentors import (
    Conversation,
    ConversationMemorySettings,
    Mentor,
    MentorPermission,
    Message,
    MessageSource,
)
from app.services.ai_adapters import AIAdapterMessage
from app.services.ai_gateway import AIGatewayService
from app.services.foundation import PageResult, UserDataService


@dataclass(frozen=True)
class MentorView:
    mentor: Mentor
    permissions: MentorPermission


@dataclass(frozen=True)
class ConversationView:
    conversation: Conversation
    mentor: Mentor
    memory_settings: ConversationMemorySettings
    message_count: int


@dataclass(frozen=True)
class MessageSendResult:
    conversation: Conversation
    user_message: Message | None
    assistant_message: Message


@dataclass(frozen=True)
class ConversationExport:
    conversation: Conversation
    mentor: Mentor
    memory_settings: ConversationMemorySettings
    messages: list[Message]
    sources_by_message_id: dict[UUID, list[MessageSource]]


class MentorService:
    def __init__(
        self,
        *,
        db: AsyncSession,
        ai_gateway: AIGatewayService,
    ):
        self.db = db
        self.ai_gateway = ai_gateway
        self.user_data = UserDataService(db)

    async def ensure_default_mentors(self, user: User) -> None:
        result = await self.db.execute(
            select(Mentor).where(
                Mentor.owner_user_id == user.id,
                Mentor.slug.in_([mentor.slug for mentor in DEFAULT_MENTORS]),
            )
        )
        existing_slugs = {mentor.slug for mentor in result.scalars().all()}

        for default in DEFAULT_MENTORS:
            if default.slug in existing_slugs:
                continue
            mentor = Mentor(
                owner_user_id=user.id,
                slug=default.slug,
                name=default.name,
                fictional_identity=default.fictional_identity,
                avatar_reference=default.avatar_reference,
                description=default.description,
                system_instructions=default.system_instructions,
                tone=default.tone.value,
                preferred_model_name=None,
                is_default=True,
            )
            self.db.add(mentor)
            await self.db.flush()
            self.db.add(
                MentorPermission(
                    owner_user_id=user.id,
                    mentor_id=mentor.id,
                    allowed_tools=[tool.value for tool in default.allowed_tools],
                    allowed_collection_ids=[],
                )
            )
        await self.db.flush()

    async def list_mentors(
        self,
        user: User,
        *,
        include_archived: bool = False,
    ) -> list[MentorView]:
        await self.ensure_default_mentors(user)
        predicates = [Mentor.owner_user_id == user.id]
        if not include_archived:
            predicates.append(Mentor.archived_at.is_(None))
        result = await self.db.execute(
            select(Mentor, MentorPermission)
            .join(MentorPermission, MentorPermission.mentor_id == Mentor.id)
            .where(*predicates)
            .order_by(Mentor.is_default.desc(), Mentor.name.asc())
        )
        return [
            MentorView(mentor=mentor, permissions=permissions)
            for mentor, permissions in result.all()
        ]

    async def get_mentor_view(self, user: User, mentor_id: UUID) -> MentorView:
        await self.ensure_default_mentors(user)
        result = await self.db.execute(
            select(Mentor, MentorPermission)
            .join(MentorPermission, MentorPermission.mentor_id == Mentor.id)
            .where(Mentor.id == mentor_id, Mentor.owner_user_id == user.id)
        )
        row = result.one_or_none()
        if row is None:
            raise AppError(status.HTTP_404_NOT_FOUND, "not_found", "Mentor was not found.")
        mentor, permissions = row
        return MentorView(mentor=mentor, permissions=permissions)

    async def create_mentor(
        self,
        user: User,
        *,
        name: str,
        fictional_identity: str,
        description: str,
        system_instructions: str,
        tone: MentorTone,
        avatar_reference: str | None,
        preferred_model_name: str | None,
        allowed_tools: list[MentorTool],
    ) -> MentorView:
        await self.ensure_default_mentors(user)
        mentor = Mentor(
            owner_user_id=user.id,
            slug=_custom_slug(name),
            name=name.strip(),
            fictional_identity=fictional_identity.strip(),
            avatar_reference=avatar_reference.strip() if avatar_reference else None,
            description=description.strip(),
            system_instructions=system_instructions.strip(),
            tone=tone.value,
            preferred_model_name=preferred_model_name.strip() if preferred_model_name else None,
            is_default=False,
        )
        self.db.add(mentor)
        await self.db.flush()
        permissions = MentorPermission(
            owner_user_id=user.id,
            mentor_id=mentor.id,
            allowed_tools=[tool.value for tool in allowed_tools],
            allowed_collection_ids=[],
        )
        self.db.add(permissions)
        await self.user_data.record_audit_log(
            user,
            action="mentor.created",
            entity_type="mentor",
            entity_id=mentor.id,
            metadata={"name": mentor.name, "allowedTools": permissions.allowed_tools},
        )
        await self.db.flush()
        return MentorView(mentor=mentor, permissions=permissions)

    async def update_mentor(
        self,
        user: User,
        mentor_id: UUID,
        updates: dict[str, object],
    ) -> MentorView:
        view = await self.get_mentor_view(user, mentor_id)
        for field_name, value in updates.items():
            if value is None and field_name in {"avatar_reference", "preferred_model_name"}:
                setattr(view.mentor, field_name, None)
                continue
            setattr(view.mentor, field_name, _enum_or_value(value))
        view.mentor.updated_at = datetime.now(UTC)
        await self.user_data.record_audit_log(
            user,
            action="mentor.updated",
            entity_type="mentor",
            entity_id=view.mentor.id,
            metadata={"updatedFields": sorted(updates.keys())},
        )
        await self.db.flush()
        return view

    async def archive_mentor(self, user: User, mentor_id: UUID) -> MentorView:
        view = await self.get_mentor_view(user, mentor_id)
        if view.mentor.is_default:
            raise AppError(
                status.HTTP_409_CONFLICT,
                "default_mentor_required",
                "Default mentors cannot be archived.",
            )
        now = datetime.now(UTC)
        view.mentor.archived_at = now
        view.mentor.updated_at = now
        await self.user_data.record_audit_log(
            user,
            action="mentor.archived",
            entity_type="mentor",
            entity_id=view.mentor.id,
            metadata={},
        )
        await self.db.flush()
        return view

    async def update_permissions(
        self,
        user: User,
        mentor_id: UUID,
        updates: dict[str, object],
    ) -> MentorPermission:
        view = await self.get_mentor_view(user, mentor_id)
        for field_name, value in updates.items():
            if field_name == "allowed_tools" and isinstance(value, list):
                view.permissions.allowed_tools = [str(_enum_or_value(item)) for item in value]
                continue
            setattr(view.permissions, field_name, value)
        view.permissions.updated_at = datetime.now(UTC)
        await self.user_data.record_audit_log(
            user,
            action="mentor.permissions_updated",
            entity_type="mentor",
            entity_id=view.mentor.id,
            metadata={"updatedFields": sorted(updates.keys())},
        )
        await self.db.flush()
        return view.permissions

    async def create_conversation(
        self,
        user: User,
        *,
        mentor_id: UUID,
        title: str | None = None,
    ) -> ConversationView:
        mentor_view = await self.get_mentor_view(user, mentor_id)
        if mentor_view.mentor.archived_at is not None:
            raise AppError(
                status.HTTP_409_CONFLICT,
                "mentor_archived",
                "Archived mentors cannot start new conversations.",
            )
        preferences = await self.user_data.get_or_create_preferences(user)
        memory_enabled = bool(preferences.ai_memory_enabled)
        conversation = Conversation(
            owner_user_id=user.id,
            mentor_id=mentor_view.mentor.id,
            title=_conversation_title(title),
            status=ConversationStatus.ACTIVE.value,
        )
        self.db.add(conversation)
        await self.db.flush()
        memory_settings = ConversationMemorySettings(
            owner_user_id=user.id,
            conversation_id=conversation.id,
            memory_enabled=memory_enabled,
            memory_policy=ConversationMemoryPolicy.PERSISTENT.value
            if memory_enabled
            else ConversationMemoryPolicy.DISABLED.value,
        )
        self.db.add(memory_settings)
        await self.user_data.record_audit_log(
            user,
            action="ai.conversation_created",
            entity_type="conversation",
            entity_id=conversation.id,
            metadata={"mentorId": str(mentor_view.mentor.id)},
        )
        await self.db.flush()
        return ConversationView(
            conversation=conversation,
            mentor=mentor_view.mentor,
            memory_settings=memory_settings,
            message_count=0,
        )

    async def list_conversations(
        self,
        user: User,
        pagination: PaginationParams,
        *,
        include_archived: bool = False,
    ) -> PageResult[ConversationView]:
        await self.ensure_default_mentors(user)
        predicates = [Conversation.owner_user_id == user.id]
        if include_archived:
            predicates.append(Conversation.status != ConversationStatus.DELETED.value)
        else:
            predicates.append(Conversation.status == ConversationStatus.ACTIVE.value)

        total = await self._count(select(func.count(Conversation.id)).where(*predicates))
        result = await self.db.execute(
            select(Conversation)
            .where(*predicates)
            .order_by(Conversation.updated_at.desc(), Conversation.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        views = [
            await self.conversation_view(user, conversation) for conversation in result.scalars()
        ]
        return PageResult(
            items=views, total=total, limit=pagination.limit, offset=pagination.offset
        )

    async def get_conversation_view(self, user: User, conversation_id: UUID) -> ConversationView:
        conversation = await self._get_conversation(user, conversation_id, include_deleted=False)
        return await self.conversation_view(user, conversation)

    async def conversation_view(
        self,
        user: User,
        conversation: Conversation,
    ) -> ConversationView:
        mentor = await self._get_mentor_by_id(user, conversation.mentor_id)
        memory_settings = await self._get_or_create_memory_settings(user, conversation)
        message_count = await self._count(
            select(func.count(Message.id)).where(
                Message.owner_user_id == user.id,
                Message.conversation_id == conversation.id,
            )
        )
        return ConversationView(
            conversation=conversation,
            mentor=mentor,
            memory_settings=memory_settings,
            message_count=message_count,
        )

    async def update_conversation(
        self,
        user: User,
        conversation_id: UUID,
        updates: dict[str, object],
    ) -> ConversationView:
        conversation = await self._get_conversation(user, conversation_id, include_deleted=False)
        if "title" in updates:
            conversation.title = _conversation_title(str(updates["title"]))
        conversation.updated_at = datetime.now(UTC)
        await self.user_data.record_audit_log(
            user,
            action="ai.conversation_updated",
            entity_type="conversation",
            entity_id=conversation.id,
            metadata={"updatedFields": sorted(updates.keys())},
        )
        await self.db.flush()
        return await self.conversation_view(user, conversation)

    async def archive_conversation(self, user: User, conversation_id: UUID) -> ConversationView:
        conversation = await self._get_conversation(user, conversation_id, include_deleted=False)
        now = datetime.now(UTC)
        conversation.status = ConversationStatus.ARCHIVED.value
        conversation.archived_at = now
        conversation.updated_at = now
        await self.user_data.record_audit_log(
            user,
            action="ai.conversation_archived",
            entity_type="conversation",
            entity_id=conversation.id,
            metadata={},
        )
        await self.db.flush()
        return await self.conversation_view(user, conversation)

    async def delete_conversation(self, user: User, conversation_id: UUID) -> ConversationView:
        conversation = await self._get_conversation(user, conversation_id, include_deleted=False)
        now = datetime.now(UTC)
        conversation.status = ConversationStatus.DELETED.value
        conversation.deleted_at = now
        conversation.updated_at = now
        await self.user_data.record_audit_log(
            user,
            action="ai.conversation_deleted",
            entity_type="conversation",
            entity_id=conversation.id,
            metadata={},
        )
        await self.db.flush()
        return await self.conversation_view(user, conversation)

    async def update_memory_settings(
        self,
        user: User,
        conversation_id: UUID,
        *,
        memory_enabled: bool,
        memory_policy: ConversationMemoryPolicy | None,
    ) -> ConversationMemorySettings:
        conversation = await self._get_conversation(user, conversation_id, include_deleted=False)
        preferences = await self.user_data.get_or_create_preferences(user)
        if memory_enabled and not preferences.ai_memory_enabled:
            raise AppError(
                status.HTTP_403_FORBIDDEN,
                "ai_memory_disabled",
                "AI memory is disabled in user preferences.",
            )
        settings = await self._get_or_create_memory_settings(user, conversation)
        settings.memory_enabled = memory_enabled
        settings.memory_policy = (
            memory_policy.value
            if memory_enabled and memory_policy is not None
            else ConversationMemoryPolicy.DISABLED.value
        )
        settings.updated_at = datetime.now(UTC)
        await self.user_data.record_audit_log(
            user,
            action="ai.conversation_memory_updated",
            entity_type="conversation",
            entity_id=conversation.id,
            metadata={"memoryEnabled": memory_enabled, "memoryPolicy": settings.memory_policy},
        )
        await self.db.flush()
        return settings

    async def list_messages(
        self,
        user: User,
        conversation_id: UUID,
        pagination: PaginationParams,
    ) -> PageResult[Message]:
        conversation = await self._get_conversation(user, conversation_id, include_deleted=False)
        total = await self._count(
            select(func.count(Message.id)).where(
                Message.owner_user_id == user.id,
                Message.conversation_id == conversation.id,
            )
        )
        result = await self.db.execute(
            select(Message)
            .where(
                Message.owner_user_id == user.id,
                Message.conversation_id == conversation.id,
            )
            .order_by(Message.created_at.asc(), Message.id.asc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def send_message(
        self,
        user: User,
        conversation_id: UUID,
        *,
        content: str,
    ) -> MessageSendResult:
        conversation = await self._active_conversation(user, conversation_id)
        now = datetime.now(UTC)
        if conversation.title == "New conversation":
            conversation.title = _conversation_title(content)
        user_message = Message(
            owner_user_id=user.id,
            conversation_id=conversation.id,
            role=AIMessageRole.USER.value,
            content=content.strip(),
            status=MessageStatus.COMPLETE.value,
        )
        self.db.add(user_message)
        conversation.last_message_at = now
        conversation.updated_at = now
        await self.db.flush()

        assistant_message = await self._generate_assistant_reply(
            user,
            conversation,
            regenerated_from_message_id=None,
        )
        return MessageSendResult(
            conversation=conversation,
            user_message=user_message,
            assistant_message=assistant_message,
        )

    async def edit_and_resend_message(
        self,
        user: User,
        conversation_id: UUID,
        message_id: UUID,
        *,
        content: str,
    ) -> MessageSendResult:
        conversation = await self._active_conversation(user, conversation_id)
        original = await self._get_message(user, conversation.id, message_id)
        if original.role != AIMessageRole.USER.value:
            raise AppError(
                status.HTTP_409_CONFLICT,
                "message_not_editable",
                "Only user messages can be edited and resent.",
            )

        now = datetime.now(UTC)
        edited_message = Message(
            owner_user_id=user.id,
            conversation_id=conversation.id,
            role=AIMessageRole.USER.value,
            content=content.strip(),
            status=MessageStatus.COMPLETE.value,
            edited_from_message_id=original.id,
        )
        self.db.add(edited_message)
        conversation.last_message_at = now
        conversation.updated_at = now
        await self.db.flush()
        assistant_message = await self._generate_assistant_reply(
            user,
            conversation,
            regenerated_from_message_id=None,
        )
        return MessageSendResult(
            conversation=conversation,
            user_message=edited_message,
            assistant_message=assistant_message,
        )

    async def regenerate_message(
        self,
        user: User,
        conversation_id: UUID,
        message_id: UUID,
    ) -> MessageSendResult:
        conversation = await self._active_conversation(user, conversation_id)
        original = await self._get_message(user, conversation.id, message_id)
        if original.role != AIMessageRole.ASSISTANT.value:
            raise AppError(
                status.HTTP_409_CONFLICT,
                "message_not_regeneratable",
                "Only assistant messages can be regenerated.",
            )
        assistant_message = await self._generate_assistant_reply(
            user,
            conversation,
            regenerated_from_message_id=original.id,
        )
        return MessageSendResult(
            conversation=conversation,
            user_message=None,
            assistant_message=assistant_message,
        )

    async def stop_generation(self, user: User, conversation_id: UUID) -> None:
        await self._get_conversation(user, conversation_id, include_deleted=False)
        raise AppError(
            status.HTTP_409_CONFLICT,
            "generation_not_active",
            "No active generation exists for this conversation.",
        )

    async def export_conversation(
        self,
        user: User,
        conversation_id: UUID,
    ) -> ConversationExport:
        conversation = await self._get_conversation(user, conversation_id, include_deleted=False)
        mentor = await self._get_mentor_by_id(user, conversation.mentor_id)
        memory_settings = await self._get_or_create_memory_settings(user, conversation)
        messages = (
            (
                await self.db.execute(
                    select(Message)
                    .where(
                        Message.owner_user_id == user.id,
                        Message.conversation_id == conversation.id,
                    )
                    .order_by(Message.created_at.asc(), Message.id.asc())
                )
            )
            .scalars()
            .all()
        )
        sources_by_message_id: dict[UUID, list[MessageSource]] = {
            message.id: [] for message in messages
        }
        if messages:
            result = await self.db.execute(
                select(MessageSource)
                .where(
                    MessageSource.owner_user_id == user.id,
                    MessageSource.message_id.in_([message.id for message in messages]),
                )
                .order_by(MessageSource.created_at.asc(), MessageSource.id.asc())
            )
            for source in result.scalars().all():
                sources_by_message_id.setdefault(source.message_id, []).append(source)
        return ConversationExport(
            conversation=conversation,
            mentor=mentor,
            memory_settings=memory_settings,
            messages=list(messages),
            sources_by_message_id=sources_by_message_id,
        )

    async def _generate_assistant_reply(
        self,
        user: User,
        conversation: Conversation,
        *,
        regenerated_from_message_id: UUID | None,
    ) -> Message:
        mentor = await self._get_mentor_by_id(user, conversation.mentor_id)
        context = await self._gateway_context(user, conversation, mentor)
        try:
            result = await self.ai_gateway.complete_chat(
                user,
                feature=AIFeature.MENTOR_CHAT,
                messages=context,
                requested_data_categories=[],
                model_name=mentor.preferred_model_name,
            )
            assistant_message = Message(
                owner_user_id=user.id,
                conversation_id=conversation.id,
                role=AIMessageRole.ASSISTANT.value,
                content=result.content,
                status=MessageStatus.COMPLETE.value,
                ai_usage_record_id=result.usage_record.id,
                provider_name=result.provider_name,
                model_name=result.model_name,
                regenerated_from_message_id=regenerated_from_message_id,
            )
            self.db.add(assistant_message)
            now = datetime.now(UTC)
            conversation.last_message_at = now
            conversation.updated_at = now
            await self.db.flush()
            await self.user_data.record_audit_log(
                user,
                action="ai.message_created",
                entity_type="conversation",
                entity_id=conversation.id,
                metadata={
                    "mentorId": str(mentor.id),
                    "providerName": result.provider_name,
                    "usedFallback": result.used_fallback,
                },
            )
            return assistant_message
        except AppError as exc:
            assistant_message = Message(
                owner_user_id=user.id,
                conversation_id=conversation.id,
                role=AIMessageRole.ASSISTANT.value,
                content="AI response could not be generated.",
                status=MessageStatus.FAILED.value,
                error_code=exc.code,
                error_message=exc.message[:512],
                regenerated_from_message_id=regenerated_from_message_id,
            )
            self.db.add(assistant_message)
            now = datetime.now(UTC)
            conversation.last_message_at = now
            conversation.updated_at = now
            await self.db.flush()
            raise

    async def _gateway_context(
        self,
        user: User,
        conversation: Conversation,
        mentor: Mentor,
    ) -> list[AIAdapterMessage]:
        memory_settings = await self._get_or_create_memory_settings(user, conversation)
        system_prompt = (
            f"{mentor.system_instructions}\n\n"
            "You are fictional and must identify yourself as an AI mentor when relevant. "
            "Do not claim access to uploaded files, projects, habits, learning records, or "
            "citations unless Aetherium explicitly provides retrieved context. "
            "Do not silently modify user data. Any suggested durable change requires explicit "
            "user approval and a separate application action."
        )
        if memory_settings.memory_enabled and memory_settings.memory_summary:
            system_prompt = (
                f"{system_prompt}\n\nConversation memory summary: {memory_settings.memory_summary}"
            )

        result = await self.db.execute(
            select(Message)
            .where(
                Message.owner_user_id == user.id,
                Message.conversation_id == conversation.id,
                Message.status == MessageStatus.COMPLETE.value,
            )
            .order_by(Message.created_at.desc(), Message.id.desc())
            .limit(DEFAULT_CONTEXT_MESSAGE_LIMIT)
        )
        recent_messages = list(reversed(result.scalars().all()))
        return [
            AIAdapterMessage(role=AIMessageRole.SYSTEM, content=system_prompt),
            *[
                AIAdapterMessage(role=AIMessageRole(message.role), content=message.content)
                for message in recent_messages
                if message.role in {AIMessageRole.USER.value, AIMessageRole.ASSISTANT.value}
            ],
        ]

    async def _get_conversation(
        self,
        user: User,
        conversation_id: UUID,
        *,
        include_deleted: bool,
    ) -> Conversation:
        predicates = [
            Conversation.id == conversation_id,
            Conversation.owner_user_id == user.id,
        ]
        if not include_deleted:
            predicates.append(Conversation.status != ConversationStatus.DELETED.value)
        result = await self.db.execute(select(Conversation).where(*predicates))
        conversation = result.scalar_one_or_none()
        if conversation is None:
            raise AppError(
                status.HTTP_404_NOT_FOUND,
                "not_found",
                "Conversation was not found.",
            )
        return conversation

    async def _active_conversation(self, user: User, conversation_id: UUID) -> Conversation:
        conversation = await self._get_conversation(user, conversation_id, include_deleted=False)
        if conversation.status != ConversationStatus.ACTIVE.value:
            raise AppError(
                status.HTTP_409_CONFLICT,
                "conversation_not_active",
                "Conversation is not active.",
            )
        return conversation

    async def _get_mentor_by_id(self, user: User, mentor_id: UUID) -> Mentor:
        await self.ensure_default_mentors(user)
        result = await self.db.execute(
            select(Mentor).where(Mentor.id == mentor_id, Mentor.owner_user_id == user.id)
        )
        mentor = result.scalar_one_or_none()
        if mentor is None:
            raise AppError(status.HTTP_404_NOT_FOUND, "not_found", "Mentor was not found.")
        return mentor

    async def _get_message(self, user: User, conversation_id: UUID, message_id: UUID) -> Message:
        result = await self.db.execute(
            select(Message).where(
                Message.id == message_id,
                Message.owner_user_id == user.id,
                Message.conversation_id == conversation_id,
            )
        )
        message = result.scalar_one_or_none()
        if message is None:
            raise AppError(status.HTTP_404_NOT_FOUND, "not_found", "Message was not found.")
        return message

    async def _get_or_create_memory_settings(
        self,
        user: User,
        conversation: Conversation,
    ) -> ConversationMemorySettings:
        result = await self.db.execute(
            select(ConversationMemorySettings).where(
                ConversationMemorySettings.owner_user_id == user.id,
                ConversationMemorySettings.conversation_id == conversation.id,
            )
        )
        settings = result.scalar_one_or_none()
        if settings is not None:
            return settings
        settings = ConversationMemorySettings(
            owner_user_id=user.id,
            conversation_id=conversation.id,
            memory_enabled=False,
            memory_policy=ConversationMemoryPolicy.DISABLED.value,
        )
        self.db.add(settings)
        await self.db.flush()
        return settings

    async def _count(self, query: Select[tuple[int]]) -> int:
        value = await self.db.scalar(query)
        return int(value or 0)


def _custom_slug(name: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", name.casefold()).strip("-")
    if not normalized:
        normalized = "custom"
    return f"custom-{normalized[:40]}-{uuid4().hex[:8]}"


def _conversation_title(title: str | None) -> str:
    compact = " ".join((title or "New conversation").strip().split())
    if not compact:
        compact = "New conversation"
    return compact[:160]


def _enum_or_value(value: object) -> object:
    enum_value = getattr(value, "value", None)
    return enum_value if isinstance(enum_value, str) else value
