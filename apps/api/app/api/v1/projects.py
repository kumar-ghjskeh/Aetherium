from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.core.pagination import PaginationParams
from app.dependencies.auth import get_current_user, verify_allowed_origin
from app.dependencies.pagination import get_pagination
from app.dependencies.projects import get_project_service
from app.models.auth import User
from app.models.projects import Project
from app.schemas.common import ApiErrorResponse
from app.schemas.projects import (
    ProjectActivityPage,
    ProjectActivityResponse,
    ProjectBlockerCreate,
    ProjectBlockerResponse,
    ProjectBlockerUpdate,
    ProjectCreate,
    ProjectDetailResponse,
    ProjectFileCreate,
    ProjectFileResponse,
    ProjectLinkCreate,
    ProjectLinkResponse,
    ProjectMilestoneCreate,
    ProjectMilestoneResponse,
    ProjectMilestoneUpdate,
    ProjectNoteCreate,
    ProjectNoteResponse,
    ProjectPage,
    ProjectResponse,
    ProjectTaskCreate,
    ProjectTaskResponse,
    ProjectTaskUpdate,
    ProjectTechnologyCreate,
    ProjectTechnologyResponse,
    ProjectTopicCreate,
    ProjectTopicResponse,
    ProjectUpdate,
)
from app.services.projects import ProjectService

router = APIRouter()

ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    401: {"model": ApiErrorResponse},
    403: {"model": ApiErrorResponse},
    404: {"model": ApiErrorResponse},
    409: {"model": ApiErrorResponse},
    422: {"model": ApiErrorResponse},
}


@router.get("", response_model=ProjectPage, responses=ERROR_RESPONSES)
async def list_projects(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProjectService, Depends(get_project_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
    include_archived: bool = Query(default=False, alias="includeArchived"),
) -> ProjectPage:
    page = await service.list_projects(
        current_user,
        pagination,
        include_archived=include_archived,
    )
    await service.db.commit()
    return ProjectPage(
        items=[ProjectResponse.model_validate(project) for project in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_project(
    payload: ProjectCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectResponse:
    try:
        project = await service.create_project(current_user, payload)
        await service.db.commit()
        return ProjectResponse.model_validate(project)
    except Exception:
        await service.db.rollback()
        raise


@router.get("/{project_id}", response_model=ProjectDetailResponse, responses=ERROR_RESPONSES)
async def get_project(
    project_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectDetailResponse:
    detail = await service.get_project_detail(current_user, project_id)
    await service.db.commit()
    return _detail_response(detail)


@router.patch(
    "/{project_id}",
    response_model=ProjectResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def update_project(
    project_id: UUID,
    payload: ProjectUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectResponse:
    try:
        project = await service.update_project(current_user, project_id, payload)
        await service.db.commit()
        return ProjectResponse.model_validate(project)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/{project_id}/archive",
    response_model=ProjectResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def archive_project(
    project_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectResponse:
    try:
        project = await service.archive_project(current_user, project_id)
        await service.db.commit()
        return ProjectResponse.model_validate(project)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/{project_id}/milestones",
    response_model=ProjectMilestoneResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_milestone(
    project_id: UUID,
    payload: ProjectMilestoneCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectMilestoneResponse:
    try:
        milestone = await service.create_milestone(current_user, project_id, payload)
        await service.db.commit()
        return ProjectMilestoneResponse.model_validate(milestone)
    except Exception:
        await service.db.rollback()
        raise


@router.patch(
    "/milestones/{milestone_id}",
    response_model=ProjectMilestoneResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def update_milestone(
    milestone_id: UUID,
    payload: ProjectMilestoneUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectMilestoneResponse:
    try:
        milestone = await service.update_milestone(current_user, milestone_id, payload)
        await service.db.commit()
        return ProjectMilestoneResponse.model_validate(milestone)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/{project_id}/tasks",
    response_model=ProjectTaskResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_task(
    project_id: UUID,
    payload: ProjectTaskCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectTaskResponse:
    try:
        task = await service.create_task(current_user, project_id, payload)
        await service.db.commit()
        return ProjectTaskResponse.model_validate(task)
    except Exception:
        await service.db.rollback()
        raise


@router.patch(
    "/tasks/{task_id}",
    response_model=ProjectTaskResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def update_task(
    task_id: UUID,
    payload: ProjectTaskUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectTaskResponse:
    try:
        task = await service.update_task(current_user, task_id, payload)
        await service.db.commit()
        return ProjectTaskResponse.model_validate(task)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/{project_id}/notes",
    response_model=ProjectNoteResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_note(
    project_id: UUID,
    payload: ProjectNoteCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectNoteResponse:
    try:
        note = await service.create_note(current_user, project_id, payload)
        await service.db.commit()
        return ProjectNoteResponse.model_validate(note)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/{project_id}/links",
    response_model=ProjectLinkResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_link(
    project_id: UUID,
    payload: ProjectLinkCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectLinkResponse:
    try:
        link = await service.create_link(current_user, project_id, payload)
        await service.db.commit()
        return ProjectLinkResponse.model_validate(link)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/{project_id}/files",
    response_model=ProjectFileResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def attach_file(
    project_id: UUID,
    payload: ProjectFileCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectFileResponse:
    try:
        project_file = await service.attach_file(current_user, project_id, payload)
        await service.db.commit()
        return ProjectFileResponse.model_validate(project_file)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/{project_id}/topics",
    response_model=ProjectTopicResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def link_topic(
    project_id: UUID,
    payload: ProjectTopicCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectTopicResponse:
    try:
        project_topic = await service.link_topic(current_user, project_id, payload)
        await service.db.commit()
        return ProjectTopicResponse.model_validate(project_topic)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/{project_id}/technologies",
    response_model=ProjectTechnologyResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def add_technology(
    project_id: UUID,
    payload: ProjectTechnologyCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectTechnologyResponse:
    try:
        technology = await service.add_technology(current_user, project_id, payload)
        await service.db.commit()
        return ProjectTechnologyResponse.model_validate(technology)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/{project_id}/blockers",
    response_model=ProjectBlockerResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_blocker(
    project_id: UUID,
    payload: ProjectBlockerCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectBlockerResponse:
    try:
        blocker = await service.create_blocker(current_user, project_id, payload)
        await service.db.commit()
        return ProjectBlockerResponse.model_validate(blocker)
    except Exception:
        await service.db.rollback()
        raise


@router.patch(
    "/blockers/{blocker_id}",
    response_model=ProjectBlockerResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def update_blocker(
    blocker_id: UUID,
    payload: ProjectBlockerUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectBlockerResponse:
    try:
        blocker = await service.update_blocker(current_user, blocker_id, payload)
        await service.db.commit()
        return ProjectBlockerResponse.model_validate(blocker)
    except Exception:
        await service.db.rollback()
        raise


@router.get(
    "/{project_id}/activity",
    response_model=ProjectActivityPage,
    responses=ERROR_RESPONSES,
)
async def list_activity(
    project_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProjectService, Depends(get_project_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
) -> ProjectActivityPage:
    page = await service.list_activity(current_user, project_id, pagination)
    await service.db.commit()
    return ProjectActivityPage(
        items=[ProjectActivityResponse.model_validate(activity) for activity in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


def _detail_response(detail: dict[str, object]) -> ProjectDetailResponse:
    project = detail["project"]
    if not isinstance(project, Project):
        raise TypeError("Project detail is missing the project record.")
    return ProjectDetailResponse.model_validate(
        {
            "id": project.id,
            "name": project.name,
            "objective": project.objective,
            "description": project.description,
            "status": project.status,
            "repositoryUrl": project.repository_url,
            "startedOn": project.started_on,
            "targetDate": project.target_date,
            "completedAt": project.completed_at,
            "archivedAt": project.archived_at,
            "createdAt": project.created_at,
            "updatedAt": project.updated_at,
            "milestones": detail["milestones"],
            "tasks": detail["tasks"],
            "notes": detail["notes"],
            "links": detail["links"],
            "files": detail["files"],
            "topics": detail["topics"],
            "technologies": detail["technologies"],
            "blockers": detail["blockers"],
            "recentActivity": detail["recent_activity"],
        }
    )
