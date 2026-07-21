from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status

from app.core.errors import AppError
from app.core.pagination import PaginationParams
from app.dependencies.auth import get_current_user, verify_allowed_origin
from app.dependencies.mentors import get_mentor_service
from app.dependencies.pagination import get_pagination
from app.models.auth import User
from app.schemas.common import ApiErrorResponse
from app.schemas.mentors import (
    ConversationCreateRequest,
    ConversationExportResponse,
    ConversationMemorySettingsResponse,
    ConversationMemorySettingsUpdate,
    ConversationPage,
    ConversationResponse,
    ConversationUpdateRequest,
    MentorCreateRequest,
    MentorPage,
    MentorPermissionResponse,
    MentorPermissionUpdate,
    MentorResponse,
    MentorUpdateRequest,
    MessagePage,
    MessageResponse,
    MessageSendRequest,
    MessageSendResponse,
    StopGenerationResponse,
)
from app.services.mentors import MentorService

router = APIRouter()

ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    401: {"model": ApiErrorResponse},
    403: {"model": ApiErrorResponse},
    404: {"model": ApiErrorResponse},
    409: {"model": ApiErrorResponse},
    422: {"model": ApiErrorResponse},
    429: {"model": ApiErrorResponse},
    502: {"model": ApiErrorResponse},
}


@router.get("", response_model=MentorPage, responses=ERROR_RESPONSES)
async def list_mentors(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[MentorService, Depends(get_mentor_service)],
    include_archived: bool = Query(default=False, alias="includeArchived"),
) -> MentorPage:
    mentors = await service.list_mentors(current_user, include_archived=include_archived)
    await service.db.commit()
    return MentorPage(items=[MentorResponse.from_view(item) for item in mentors])


@router.post(
    "",
    response_model=MentorResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_mentor(
    payload: MentorCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[MentorService, Depends(get_mentor_service)],
) -> MentorResponse:
    try:
        view = await service.create_mentor(
            current_user,
            allowed_tools=payload.allowed_tools,
            avatar_reference=payload.avatar_reference,
            description=payload.description,
            fictional_identity=payload.fictional_identity,
            name=payload.name,
            preferred_model_name=payload.preferred_model_name,
            system_instructions=payload.system_instructions,
            tone=payload.tone,
        )
        await service.db.commit()
        return MentorResponse.from_view(view)
    except Exception:
        await service.db.rollback()
        raise


@router.get("/conversations", response_model=ConversationPage, responses=ERROR_RESPONSES)
async def list_conversations(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[MentorService, Depends(get_mentor_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
    include_archived: bool = Query(default=False, alias="includeArchived"),
) -> ConversationPage:
    page = await service.list_conversations(
        current_user,
        pagination,
        include_archived=include_archived,
    )
    await service.db.commit()
    return ConversationPage(
        items=[ConversationResponse.from_view(item) for item in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_conversation(
    payload: ConversationCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[MentorService, Depends(get_mentor_service)],
) -> ConversationResponse:
    try:
        view = await service.create_conversation(
            current_user,
            mentor_id=payload.mentor_id,
            title=payload.title,
        )
        await service.db.commit()
        return ConversationResponse.from_view(view)
    except Exception:
        await service.db.rollback()
        raise


@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationResponse,
    responses=ERROR_RESPONSES,
)
async def get_conversation(
    conversation_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[MentorService, Depends(get_mentor_service)],
) -> ConversationResponse:
    view = await service.get_conversation_view(current_user, conversation_id)
    await service.db.commit()
    return ConversationResponse.from_view(view)


@router.patch(
    "/conversations/{conversation_id}",
    response_model=ConversationResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def update_conversation(
    conversation_id: UUID,
    payload: ConversationUpdateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[MentorService, Depends(get_mentor_service)],
) -> ConversationResponse:
    try:
        view = await service.update_conversation(
            current_user,
            conversation_id,
            payload.model_dump(exclude_unset=True),
        )
        await service.db.commit()
        return ConversationResponse.from_view(view)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/conversations/{conversation_id}/archive",
    response_model=ConversationResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def archive_conversation(
    conversation_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[MentorService, Depends(get_mentor_service)],
) -> ConversationResponse:
    try:
        view = await service.archive_conversation(current_user, conversation_id)
        await service.db.commit()
        return ConversationResponse.from_view(view)
    except Exception:
        await service.db.rollback()
        raise


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def delete_conversation(
    conversation_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[MentorService, Depends(get_mentor_service)],
) -> Response:
    try:
        await service.delete_conversation(current_user, conversation_id)
        await service.db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception:
        await service.db.rollback()
        raise


@router.patch(
    "/conversations/{conversation_id}/memory",
    response_model=ConversationMemorySettingsResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def update_memory_settings(
    conversation_id: UUID,
    payload: ConversationMemorySettingsUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[MentorService, Depends(get_mentor_service)],
) -> ConversationMemorySettingsResponse:
    try:
        settings = await service.update_memory_settings(
            current_user,
            conversation_id,
            memory_enabled=payload.memory_enabled,
            memory_policy=payload.memory_policy,
        )
        await service.db.commit()
        return ConversationMemorySettingsResponse.from_settings(settings)
    except Exception:
        await service.db.rollback()
        raise


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=MessagePage,
    responses=ERROR_RESPONSES,
)
async def list_messages(
    conversation_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[MentorService, Depends(get_mentor_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
) -> MessagePage:
    page = await service.list_messages(current_user, conversation_id, pagination)
    await service.db.commit()
    return MessagePage(
        items=[MessageResponse.from_message(message) for message in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageSendResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def send_message(
    conversation_id: UUID,
    payload: MessageSendRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[MentorService, Depends(get_mentor_service)],
) -> MessageSendResponse:
    try:
        result = await service.send_message(current_user, conversation_id, content=payload.content)
        conversation_view = await service.get_conversation_view(current_user, conversation_id)
        await service.db.commit()
        return MessageSendResponse.from_result(result, conversation_view)
    except AppError:
        await service.db.commit()
        raise
    except Exception:
        await service.db.rollback()
        raise


@router.patch(
    "/conversations/{conversation_id}/messages/{message_id}",
    response_model=MessageSendResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def edit_and_resend_message(
    conversation_id: UUID,
    message_id: UUID,
    payload: MessageSendRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[MentorService, Depends(get_mentor_service)],
) -> MessageSendResponse:
    try:
        result = await service.edit_and_resend_message(
            current_user,
            conversation_id,
            message_id,
            content=payload.content,
        )
        conversation_view = await service.get_conversation_view(current_user, conversation_id)
        await service.db.commit()
        return MessageSendResponse.from_result(result, conversation_view)
    except AppError:
        await service.db.commit()
        raise
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/conversations/{conversation_id}/messages/{message_id}/regenerate",
    response_model=MessageSendResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def regenerate_message(
    conversation_id: UUID,
    message_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[MentorService, Depends(get_mentor_service)],
) -> MessageSendResponse:
    try:
        result = await service.regenerate_message(current_user, conversation_id, message_id)
        conversation_view = await service.get_conversation_view(current_user, conversation_id)
        await service.db.commit()
        return MessageSendResponse.from_result(result, conversation_view)
    except AppError:
        await service.db.commit()
        raise
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/conversations/{conversation_id}/stop",
    response_model=StopGenerationResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def stop_generation(
    conversation_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[MentorService, Depends(get_mentor_service)],
) -> StopGenerationResponse:
    await service.stop_generation(current_user, conversation_id)
    return StopGenerationResponse(stopped=True, reason="stopped")


@router.get(
    "/conversations/{conversation_id}/export",
    response_model=ConversationExportResponse,
    responses=ERROR_RESPONSES,
)
async def export_conversation(
    conversation_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[MentorService, Depends(get_mentor_service)],
) -> ConversationExportResponse:
    exported = await service.export_conversation(current_user, conversation_id)
    conversation_view = await service.conversation_view(current_user, exported.conversation)
    mentor_view = await service.get_mentor_view(current_user, exported.mentor.id)
    await service.db.commit()
    return ConversationExportResponse.from_export(exported, conversation_view, mentor_view)


@router.get("/{mentor_id}", response_model=MentorResponse, responses=ERROR_RESPONSES)
async def get_mentor(
    mentor_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[MentorService, Depends(get_mentor_service)],
) -> MentorResponse:
    view = await service.get_mentor_view(current_user, mentor_id)
    await service.db.commit()
    return MentorResponse.from_view(view)


@router.patch(
    "/{mentor_id}",
    response_model=MentorResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def update_mentor(
    mentor_id: UUID,
    payload: MentorUpdateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[MentorService, Depends(get_mentor_service)],
) -> MentorResponse:
    try:
        view = await service.update_mentor(
            current_user,
            mentor_id,
            payload.model_dump(exclude_unset=True),
        )
        await service.db.commit()
        return MentorResponse.from_view(view)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/{mentor_id}/archive",
    response_model=MentorResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def archive_mentor(
    mentor_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[MentorService, Depends(get_mentor_service)],
) -> MentorResponse:
    try:
        view = await service.archive_mentor(current_user, mentor_id)
        await service.db.commit()
        return MentorResponse.from_view(view)
    except Exception:
        await service.db.rollback()
        raise


@router.get(
    "/{mentor_id}/permissions",
    response_model=MentorPermissionResponse,
    responses=ERROR_RESPONSES,
)
async def get_mentor_permissions(
    mentor_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[MentorService, Depends(get_mentor_service)],
) -> MentorPermissionResponse:
    view = await service.get_mentor_view(current_user, mentor_id)
    await service.db.commit()
    return MentorPermissionResponse.from_permission(view.permissions)


@router.patch(
    "/{mentor_id}/permissions",
    response_model=MentorPermissionResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def update_mentor_permissions(
    mentor_id: UUID,
    payload: MentorPermissionUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[MentorService, Depends(get_mentor_service)],
) -> MentorPermissionResponse:
    try:
        permissions = await service.update_permissions(
            current_user,
            mentor_id,
            payload.model_dump(exclude_unset=True),
        )
        await service.db.commit()
        return MentorPermissionResponse.from_permission(permissions)
    except Exception:
        await service.db.rollback()
        raise
