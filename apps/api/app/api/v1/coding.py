from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.core.pagination import PaginationParams
from app.dependencies.auth import get_current_user, verify_allowed_origin
from app.dependencies.coding import get_code_runner, get_coding_service
from app.dependencies.pagination import get_pagination
from app.models.auth import User
from app.schemas.coding import (
    CodeAssistantCreate,
    CodeAssistantRequestPage,
    CodeAssistantResponse,
    CodeRunnerStatusResponse,
    CodeSnippetCreate,
    CodeSnippetPage,
    CodeSnippetResponse,
    CodeSnippetUpdate,
    CodingAttemptCreate,
    CodingAttemptResponse,
    CodingExerciseCreate,
    CodingExercisePage,
    CodingExerciseResponse,
)
from app.schemas.common import ApiErrorResponse
from app.services.code_runner import CodeRunner
from app.services.coding import CodingService

router = APIRouter()

ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    401: {"model": ApiErrorResponse},
    403: {"model": ApiErrorResponse},
    404: {"model": ApiErrorResponse},
    422: {"model": ApiErrorResponse},
    429: {"model": ApiErrorResponse},
    502: {"model": ApiErrorResponse},
    503: {"model": ApiErrorResponse},
}


@router.get("/snippets", response_model=CodeSnippetPage, responses=ERROR_RESPONSES)
async def list_snippets(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[CodingService, Depends(get_coding_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
    include_archived: bool = Query(default=False, alias="includeArchived"),
) -> CodeSnippetPage:
    page = await service.list_snippets(current_user, pagination, include_archived=include_archived)
    await service.db.commit()
    return CodeSnippetPage(
        items=[CodeSnippetResponse.model_validate(snippet) for snippet in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/snippets",
    response_model=CodeSnippetResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_snippet(
    payload: CodeSnippetCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[CodingService, Depends(get_coding_service)],
) -> CodeSnippetResponse:
    try:
        snippet = await service.create_snippet(current_user, payload)
        await service.db.commit()
        return CodeSnippetResponse.model_validate(snippet)
    except Exception:
        await service.db.rollback()
        raise


@router.get("/snippets/{snippet_id}", response_model=CodeSnippetResponse, responses=ERROR_RESPONSES)
async def get_snippet(
    snippet_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[CodingService, Depends(get_coding_service)],
) -> CodeSnippetResponse:
    snippet = await service.get_snippet(current_user, snippet_id)
    await service.db.commit()
    return CodeSnippetResponse.model_validate(snippet)


@router.patch(
    "/snippets/{snippet_id}",
    response_model=CodeSnippetResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def update_snippet(
    snippet_id: UUID,
    payload: CodeSnippetUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[CodingService, Depends(get_coding_service)],
) -> CodeSnippetResponse:
    try:
        snippet = await service.update_snippet(current_user, snippet_id, payload)
        await service.db.commit()
        return CodeSnippetResponse.model_validate(snippet)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/snippets/{snippet_id}/archive",
    response_model=CodeSnippetResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def archive_snippet(
    snippet_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[CodingService, Depends(get_coding_service)],
) -> CodeSnippetResponse:
    try:
        snippet = await service.archive_snippet(current_user, snippet_id)
        await service.db.commit()
        return CodeSnippetResponse.model_validate(snippet)
    except Exception:
        await service.db.rollback()
        raise


@router.get("/exercises", response_model=CodingExercisePage, responses=ERROR_RESPONSES)
async def list_exercises(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[CodingService, Depends(get_coding_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
    include_archived: bool = Query(default=False, alias="includeArchived"),
) -> CodingExercisePage:
    page = await service.list_exercises(current_user, pagination, include_archived=include_archived)
    await service.db.commit()
    return CodingExercisePage(
        items=[CodingExerciseResponse.model_validate(exercise) for exercise in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/exercises",
    response_model=CodingExerciseResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_exercise(
    payload: CodingExerciseCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[CodingService, Depends(get_coding_service)],
) -> CodingExerciseResponse:
    try:
        exercise = await service.create_exercise(current_user, payload)
        await service.db.commit()
        return CodingExerciseResponse.model_validate(exercise)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/exercises/{exercise_id}/attempts",
    response_model=CodingAttemptResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_attempt(
    exercise_id: UUID,
    payload: CodingAttemptCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[CodingService, Depends(get_coding_service)],
) -> CodingAttemptResponse:
    try:
        attempt = await service.create_attempt(current_user, exercise_id, payload)
        await service.db.commit()
        return CodingAttemptResponse.model_validate(attempt)
    except Exception:
        await service.db.rollback()
        raise


@router.get(
    "/assistant/requests",
    response_model=CodeAssistantRequestPage,
    responses=ERROR_RESPONSES,
)
async def list_assistant_requests(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[CodingService, Depends(get_coding_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
) -> CodeAssistantRequestPage:
    page = await service.list_assistant_requests(current_user, pagination)
    await service.db.commit()
    return CodeAssistantRequestPage(
        items=[CodeAssistantResponse.model_validate(item) for item in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/assistant/explain",
    response_model=CodeAssistantResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def explain_code(
    payload: CodeAssistantCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[CodingService, Depends(get_coding_service)],
) -> CodeAssistantResponse:
    try:
        record = await service.explain_code(current_user, payload)
        await service.db.commit()
        return CodeAssistantResponse.model_validate(record)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/assistant/review",
    response_model=CodeAssistantResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def review_code(
    payload: CodeAssistantCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[CodingService, Depends(get_coding_service)],
) -> CodeAssistantResponse:
    try:
        record = await service.review_code(current_user, payload)
        await service.db.commit()
        return CodeAssistantResponse.model_validate(record)
    except Exception:
        await service.db.rollback()
        raise


@router.get("/runner/status", response_model=CodeRunnerStatusResponse, responses=ERROR_RESPONSES)
async def get_runner_status(
    _current_user: Annotated[User, Depends(get_current_user)],
    runner: Annotated[CodeRunner, Depends(get_code_runner)],
) -> CodeRunnerStatusResponse:
    return await runner.status()
