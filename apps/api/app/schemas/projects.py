from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator

from app.domain.projects import (
    ProjectActivityType,
    ProjectBlockerStatus,
    ProjectMilestoneStatus,
    ProjectPriority,
    ProjectStatus,
    ProjectTaskStatus,
)


class ProjectSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ProjectCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    name: str = Field(min_length=1, max_length=200)
    objective: str | None = Field(default=None, max_length=4000)
    description: str | None = Field(default=None, max_length=8000)
    repository_url: HttpUrl | None = Field(default=None, alias="repositoryUrl")
    started_on: date | None = Field(default=None, alias="startedOn")
    target_date: date | None = Field(default=None, alias="targetDate")


class ProjectUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    name: str | None = Field(default=None, min_length=1, max_length=200)
    objective: str | None = Field(default=None, max_length=4000)
    description: str | None = Field(default=None, max_length=8000)
    status: ProjectStatus | None = None
    repository_url: HttpUrl | None = Field(default=None, alias="repositoryUrl")
    started_on: date | None = Field(default=None, alias="startedOn")
    target_date: date | None = Field(default=None, alias="targetDate")

    @model_validator(mode="after")
    def require_update_field(self) -> "ProjectUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one project field is required")
        return self


class ProjectResponse(ProjectSchema):
    id: UUID
    name: str
    objective: str | None
    description: str | None
    status: ProjectStatus
    repository_url: str | None = Field(alias="repositoryUrl")
    started_on: date | None = Field(alias="startedOn")
    target_date: date | None = Field(alias="targetDate")
    completed_at: datetime | None = Field(alias="completedAt")
    archived_at: datetime | None = Field(alias="archivedAt")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class ProjectPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[ProjectResponse]
    total: int
    limit: int
    offset: int


class ProjectMilestoneCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    due_date: date | None = Field(default=None, alias="dueDate")
    position: int = Field(default=0, ge=0)


class ProjectMilestoneUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    status: ProjectMilestoneStatus | None = None
    due_date: date | None = Field(default=None, alias="dueDate")
    position: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def require_update_field(self) -> "ProjectMilestoneUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one milestone field is required")
        return self


class ProjectMilestoneResponse(ProjectSchema):
    id: UUID
    project_id: UUID = Field(alias="projectId")
    title: str
    description: str | None
    status: ProjectMilestoneStatus
    due_date: date | None = Field(alias="dueDate")
    completed_at: datetime | None = Field(alias="completedAt")
    position: int
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class ProjectTaskCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    milestone_id: UUID | None = Field(default=None, alias="milestoneId")
    priority: ProjectPriority = ProjectPriority.MEDIUM
    due_date: date | None = Field(default=None, alias="dueDate")


class ProjectTaskUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    milestone_id: UUID | None = Field(default=None, alias="milestoneId")
    status: ProjectTaskStatus | None = None
    priority: ProjectPriority | None = None
    due_date: date | None = Field(default=None, alias="dueDate")

    @model_validator(mode="after")
    def require_update_field(self) -> "ProjectTaskUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one task field is required")
        return self


class ProjectTaskResponse(ProjectSchema):
    id: UUID
    project_id: UUID = Field(alias="projectId")
    milestone_id: UUID | None = Field(alias="milestoneId")
    title: str
    description: str | None
    status: ProjectTaskStatus
    priority: ProjectPriority
    due_date: date | None = Field(alias="dueDate")
    completed_at: datetime | None = Field(alias="completedAt")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class ProjectNoteCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=12000)


class ProjectNoteResponse(ProjectSchema):
    id: UUID
    project_id: UUID = Field(alias="projectId")
    title: str
    body: str
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class ProjectLinkCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    url: HttpUrl


class ProjectLinkResponse(ProjectSchema):
    id: UUID
    project_id: UUID = Field(alias="projectId")
    title: str
    url: str
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class ProjectFileCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    file_id: UUID = Field(alias="fileId")
    description: str | None = Field(default=None, max_length=4000)


class ProjectFileResponse(ProjectSchema):
    id: UUID
    project_id: UUID = Field(alias="projectId")
    file_id: UUID = Field(alias="fileId")
    description: str | None
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class ProjectTopicCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    topic_id: UUID = Field(alias="topicId")


class ProjectTopicResponse(ProjectSchema):
    id: UUID
    project_id: UUID = Field(alias="projectId")
    topic_id: UUID = Field(alias="topicId")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class ProjectTechnologyCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)

    @field_validator("name")
    @classmethod
    def normalize_name_input(cls, value: str) -> str:
        compact = " ".join(value.strip().split())
        if not compact:
            raise ValueError("Technology name is required")
        return compact


class ProjectTechnologyResponse(ProjectSchema):
    id: UUID
    project_id: UUID = Field(alias="projectId")
    name: str
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class ProjectBlockerCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)


class ProjectBlockerUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    status: ProjectBlockerStatus | None = None

    @model_validator(mode="after")
    def require_update_field(self) -> "ProjectBlockerUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one blocker field is required")
        return self


class ProjectBlockerResponse(ProjectSchema):
    id: UUID
    project_id: UUID = Field(alias="projectId")
    title: str
    description: str | None
    status: ProjectBlockerStatus
    resolved_at: datetime | None = Field(alias="resolvedAt")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class ProjectActivityResponse(ProjectSchema):
    id: UUID
    project_id: UUID = Field(alias="projectId")
    activity_type: ProjectActivityType = Field(alias="activityType")
    description: str
    metadata_json: dict[str, Any] = Field(
        validation_alias="metadata_json",
        serialization_alias="metadata",
    )
    created_at: datetime = Field(alias="createdAt")


class ProjectActivityPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[ProjectActivityResponse]
    total: int
    limit: int
    offset: int


class ProjectDetailResponse(ProjectResponse):
    milestones: list[ProjectMilestoneResponse]
    tasks: list[ProjectTaskResponse]
    notes: list[ProjectNoteResponse]
    links: list[ProjectLinkResponse]
    files: list[ProjectFileResponse]
    topics: list[ProjectTopicResponse]
    technologies: list[ProjectTechnologyResponse]
    blockers: list[ProjectBlockerResponse]
    recent_activity: list[ProjectActivityResponse] = Field(alias="recentActivity")
