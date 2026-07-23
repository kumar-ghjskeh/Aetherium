from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.pagination import PaginationParams
from app.domain.file_vault import FileDeletionStatus
from app.domain.foundation import DomainEventType
from app.domain.learning import LearningRecordStatus
from app.domain.projects import (
    ProjectActivityType,
    ProjectBlockerStatus,
    ProjectMilestoneStatus,
    ProjectStatus,
    ProjectTaskStatus,
)
from app.models.auth import User
from app.models.file_vault import FileRecord
from app.models.learning import Topic
from app.models.projects import (
    Project,
    ProjectActivity,
    ProjectBlocker,
    ProjectFile,
    ProjectLink,
    ProjectMilestone,
    ProjectNote,
    ProjectTask,
    ProjectTechnology,
    ProjectTopic,
)
from app.schemas.projects import (
    ProjectBlockerCreate,
    ProjectBlockerUpdate,
    ProjectCreate,
    ProjectFileCreate,
    ProjectLinkCreate,
    ProjectMilestoneCreate,
    ProjectMilestoneUpdate,
    ProjectNoteCreate,
    ProjectTaskCreate,
    ProjectTaskUpdate,
    ProjectTechnologyCreate,
    ProjectTopicCreate,
    ProjectUpdate,
)
from app.services.foundation import PageResult, UserDataService
from app.services.knowledge import KnowledgeGraphService


class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_data = UserDataService(db)

    async def list_projects(
        self,
        user: User,
        pagination: PaginationParams,
        *,
        include_archived: bool = False,
    ) -> PageResult[Project]:
        predicates = [Project.owner_user_id == user.id]
        if not include_archived:
            predicates.append(Project.status != ProjectStatus.ARCHIVED.value)

        total = await self._count(select(func.count(Project.id)).where(*predicates))
        result = await self.db.execute(
            select(Project)
            .where(*predicates)
            .order_by(Project.updated_at.desc(), Project.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def create_project(self, user: User, payload: ProjectCreate) -> Project:
        project = Project(
            owner_user_id=user.id,
            name=_compact(payload.name),
            normalized_name=_normalize_name(payload.name),
            objective=_compact_optional(payload.objective),
            description=_compact_optional(payload.description),
            status=ProjectStatus.ACTIVE.value,
            repository_url=str(payload.repository_url) if payload.repository_url else None,
            started_on=payload.started_on,
            target_date=payload.target_date,
        )
        self.db.add(project)
        await self.db.flush()
        await self._record_activity(
            user,
            project,
            activity_type=ProjectActivityType.PROJECT_CREATED,
            description=f"Project created: {project.name}",
            metadata={"projectId": str(project.id)},
        )
        await self.user_data.record_audit_log(
            user,
            action="project.created",
            entity_type="project",
            entity_id=project.id,
            metadata={"name": project.name},
        )
        await KnowledgeGraphService(self.db).sync_project(user, project)
        await self.db.flush()
        return project

    async def get_project(self, user: User, project_id: UUID) -> Project:
        result = await self.db.execute(
            select(Project).where(Project.id == project_id, Project.owner_user_id == user.id)
        )
        project = result.scalar_one_or_none()
        if project is None:
            raise AppError(404, "not_found", "Project was not found.")
        return project

    async def get_project_detail(self, user: User, project_id: UUID) -> dict[str, object]:
        project = await self.get_project(user, project_id)
        return {
            "project": project,
            "milestones": await self._list_for_project(ProjectMilestone, user, project.id),
            "tasks": await self._list_for_project(ProjectTask, user, project.id),
            "notes": await self._list_for_project(ProjectNote, user, project.id),
            "links": await self._list_for_project(ProjectLink, user, project.id),
            "files": await self._list_for_project(ProjectFile, user, project.id),
            "topics": await self._list_for_project(ProjectTopic, user, project.id),
            "technologies": await self._list_for_project(ProjectTechnology, user, project.id),
            "blockers": await self._list_for_project(ProjectBlocker, user, project.id),
            "recent_activity": await self._list_for_project(
                ProjectActivity, user, project.id, limit=10
            ),
        }

    async def update_project(self, user: User, project_id: UUID, payload: ProjectUpdate) -> Project:
        project = await self.get_project(user, project_id)
        updates = payload.model_dump(exclude_unset=True, by_alias=False)
        if "name" in updates and updates["name"] is not None:
            project.name = _compact(str(updates["name"]))
            project.normalized_name = _normalize_name(project.name)
        if "objective" in updates:
            project.objective = _compact_optional(updates["objective"])
        if "description" in updates:
            project.description = _compact_optional(updates["description"])
        if "repository_url" in updates:
            value = updates["repository_url"]
            project.repository_url = str(value) if value is not None else None
        if "started_on" in updates:
            project.started_on = updates["started_on"]
        if "target_date" in updates:
            project.target_date = updates["target_date"]
        if "status" in updates and updates["status"] is not None:
            await self._apply_project_status(user, project, updates["status"])

        project.updated_at = datetime.now(UTC)
        await self._record_activity(
            user,
            project,
            activity_type=ProjectActivityType.PROJECT_UPDATED,
            description=f"Project updated: {project.name}",
            metadata={"updatedFields": sorted(updates.keys())},
        )
        await self.user_data.record_audit_log(
            user,
            action="project.updated",
            entity_type="project",
            entity_id=project.id,
            metadata={"updatedFields": sorted(updates.keys())},
        )
        await KnowledgeGraphService(self.db).sync_project(user, project)
        await self.db.flush()
        return project

    async def archive_project(self, user: User, project_id: UUID) -> Project:
        project = await self.get_project(user, project_id)
        if project.status != ProjectStatus.ARCHIVED.value:
            now = datetime.now(UTC)
            project.status = ProjectStatus.ARCHIVED.value
            project.archived_at = now
            project.updated_at = now
            await self._record_activity(
                user,
                project,
                activity_type=ProjectActivityType.PROJECT_ARCHIVED,
                description=f"Project archived: {project.name}",
                metadata={"projectId": str(project.id)},
            )
            await self.user_data.record_audit_log(
                user,
                action="project.archived",
                entity_type="project",
                entity_id=project.id,
                metadata={"name": project.name},
            )
            await self.db.flush()
        return project

    async def create_milestone(
        self, user: User, project_id: UUID, payload: ProjectMilestoneCreate
    ) -> ProjectMilestone:
        project = await self.get_project(user, project_id)
        milestone = ProjectMilestone(
            owner_user_id=user.id,
            project_id=project.id,
            title=_compact(payload.title),
            description=_compact_optional(payload.description),
            due_date=payload.due_date,
            position=payload.position,
        )
        self.db.add(milestone)
        try:
            await self.db.flush()
        except IntegrityError as exc:
            raise AppError(
                409, "position_conflict", "A milestone already uses that position."
            ) from exc
        await self._record_activity(
            user,
            project,
            activity_type=ProjectActivityType.MILESTONE_CREATED,
            description=f"Milestone added: {milestone.title}",
            metadata={"milestoneId": str(milestone.id)},
        )
        await self.db.flush()
        return milestone

    async def update_milestone(
        self, user: User, milestone_id: UUID, payload: ProjectMilestoneUpdate
    ) -> ProjectMilestone:
        milestone = await self._get_owned(ProjectMilestone, user, milestone_id, "Milestone")
        updates = payload.model_dump(exclude_unset=True, by_alias=False)
        if "title" in updates and updates["title"] is not None:
            milestone.title = _compact(str(updates["title"]))
        if "description" in updates:
            milestone.description = _compact_optional(updates["description"])
        if "due_date" in updates:
            milestone.due_date = updates["due_date"]
        if "position" in updates and updates["position"] is not None:
            milestone.position = int(updates["position"])
        if "status" in updates and updates["status"] is not None:
            status = _enum_value(updates["status"])
            milestone.status = status
            milestone.completed_at = (
                datetime.now(UTC)
                if status == ProjectMilestoneStatus.COMPLETED.value
                else milestone.completed_at
            )
        milestone.updated_at = datetime.now(UTC)
        try:
            await self.db.flush()
        except IntegrityError as exc:
            raise AppError(
                409, "position_conflict", "A milestone already uses that position."
            ) from exc
        return milestone

    async def create_task(
        self, user: User, project_id: UUID, payload: ProjectTaskCreate
    ) -> ProjectTask:
        project = await self.get_project(user, project_id)
        if payload.milestone_id is not None:
            await self._get_project_milestone(user, project.id, payload.milestone_id)
        task = ProjectTask(
            owner_user_id=user.id,
            project_id=project.id,
            milestone_id=payload.milestone_id,
            title=_compact(payload.title),
            description=_compact_optional(payload.description),
            priority=payload.priority.value,
            due_date=payload.due_date,
        )
        self.db.add(task)
        await self.db.flush()
        await self._record_activity(
            user,
            project,
            activity_type=ProjectActivityType.TASK_CREATED,
            description=f"Task added: {task.title}",
            metadata={"taskId": str(task.id)},
        )
        await self.db.flush()
        return task

    async def update_task(
        self, user: User, task_id: UUID, payload: ProjectTaskUpdate
    ) -> ProjectTask:
        task = await self._get_owned(ProjectTask, user, task_id, "Task")
        project = await self.get_project(user, task.project_id)
        updates = payload.model_dump(exclude_unset=True, by_alias=False)
        if "milestone_id" in updates and updates["milestone_id"] is not None:
            await self._get_project_milestone(user, task.project_id, updates["milestone_id"])
            task.milestone_id = updates["milestone_id"]
        if "title" in updates and updates["title"] is not None:
            task.title = _compact(str(updates["title"]))
        if "description" in updates:
            task.description = _compact_optional(updates["description"])
        if "priority" in updates and updates["priority"] is not None:
            task.priority = _enum_value(updates["priority"])
        if "due_date" in updates:
            task.due_date = updates["due_date"]
        if "status" in updates and updates["status"] is not None:
            status = _enum_value(updates["status"])
            task.status = status
            task.completed_at = (
                datetime.now(UTC) if status == ProjectTaskStatus.DONE.value else None
            )
        task.updated_at = datetime.now(UTC)
        await self._record_activity(
            user,
            project,
            activity_type=ProjectActivityType.TASK_UPDATED,
            description=f"Task updated: {task.title}",
            metadata={"taskId": str(task.id), "updatedFields": sorted(updates.keys())},
        )
        await self.db.flush()
        return task

    async def create_note(
        self, user: User, project_id: UUID, payload: ProjectNoteCreate
    ) -> ProjectNote:
        project = await self.get_project(user, project_id)
        note = ProjectNote(
            owner_user_id=user.id,
            project_id=project.id,
            title=_compact(payload.title),
            body=payload.body.strip(),
        )
        self.db.add(note)
        await self.db.flush()
        await self._record_activity(
            user,
            project,
            activity_type=ProjectActivityType.NOTE_CREATED,
            description=f"Note added: {note.title}",
            metadata={"noteId": str(note.id)},
        )
        await self.db.flush()
        return note

    async def create_link(
        self, user: User, project_id: UUID, payload: ProjectLinkCreate
    ) -> ProjectLink:
        project = await self.get_project(user, project_id)
        link = ProjectLink(
            owner_user_id=user.id,
            project_id=project.id,
            title=_compact(payload.title),
            url=str(payload.url),
        )
        self.db.add(link)
        await self.db.flush()
        await self._record_activity(
            user,
            project,
            activity_type=ProjectActivityType.LINK_CREATED,
            description=f"Link added: {link.title}",
            metadata={"linkId": str(link.id)},
        )
        await self.db.flush()
        return link

    async def attach_file(
        self, user: User, project_id: UUID, payload: ProjectFileCreate
    ) -> ProjectFile:
        project = await self.get_project(user, project_id)
        await self._get_owned_file(user, payload.file_id)
        existing = await self._find_project_file(user, project.id, payload.file_id)
        if existing is not None:
            return existing
        project_file = ProjectFile(
            owner_user_id=user.id,
            project_id=project.id,
            file_id=payload.file_id,
            description=_compact_optional(payload.description),
        )
        self.db.add(project_file)
        await self.db.flush()
        await self._record_activity(
            user,
            project,
            activity_type=ProjectActivityType.FILE_ATTACHED,
            description="File attached to project.",
            metadata={"fileId": str(payload.file_id)},
        )
        await KnowledgeGraphService(self.db).sync_project_file(user, project_file)
        await self.db.flush()
        return project_file

    async def link_topic(
        self, user: User, project_id: UUID, payload: ProjectTopicCreate
    ) -> ProjectTopic:
        project = await self.get_project(user, project_id)
        await self._get_owned_topic(user, payload.topic_id)
        existing = await self._find_project_topic(user, project.id, payload.topic_id)
        if existing is not None:
            return existing
        project_topic = ProjectTopic(
            owner_user_id=user.id,
            project_id=project.id,
            topic_id=payload.topic_id,
        )
        self.db.add(project_topic)
        await self.db.flush()
        await self._record_activity(
            user,
            project,
            activity_type=ProjectActivityType.TOPIC_LINKED,
            description="Learning topic linked to project.",
            metadata={"topicId": str(payload.topic_id)},
        )
        await KnowledgeGraphService(self.db).sync_project_topic(user, project_topic)
        await self.db.flush()
        return project_topic

    async def add_technology(
        self, user: User, project_id: UUID, payload: ProjectTechnologyCreate
    ) -> ProjectTechnology:
        project = await self.get_project(user, project_id)
        normalized = _normalize_name(payload.name)
        result = await self.db.execute(
            select(ProjectTechnology).where(
                ProjectTechnology.owner_user_id == user.id,
                ProjectTechnology.project_id == project.id,
                ProjectTechnology.normalized_name == normalized,
            )
        )
        existing = result.scalar_one_or_none()
        if existing is not None:
            return existing
        technology = ProjectTechnology(
            owner_user_id=user.id,
            project_id=project.id,
            name=_compact(payload.name),
            normalized_name=normalized,
        )
        self.db.add(technology)
        await self.db.flush()
        await self._record_activity(
            user,
            project,
            activity_type=ProjectActivityType.TECHNOLOGY_ADDED,
            description=f"Technology added: {technology.name}",
            metadata={"technologyId": str(technology.id)},
        )
        await self.db.flush()
        return technology

    async def create_blocker(
        self, user: User, project_id: UUID, payload: ProjectBlockerCreate
    ) -> ProjectBlocker:
        project = await self.get_project(user, project_id)
        blocker = ProjectBlocker(
            owner_user_id=user.id,
            project_id=project.id,
            title=_compact(payload.title),
            description=_compact_optional(payload.description),
        )
        self.db.add(blocker)
        await self.db.flush()
        await self._record_activity(
            user,
            project,
            activity_type=ProjectActivityType.BLOCKER_CREATED,
            description=f"Blocker recorded: {blocker.title}",
            metadata={"blockerId": str(blocker.id)},
        )
        await self.db.flush()
        return blocker

    async def update_blocker(
        self, user: User, blocker_id: UUID, payload: ProjectBlockerUpdate
    ) -> ProjectBlocker:
        blocker = await self._get_owned(ProjectBlocker, user, blocker_id, "Blocker")
        project = await self.get_project(user, blocker.project_id)
        updates = payload.model_dump(exclude_unset=True, by_alias=False)
        if "title" in updates and updates["title"] is not None:
            blocker.title = _compact(str(updates["title"]))
        if "description" in updates:
            blocker.description = _compact_optional(updates["description"])
        if "status" in updates and updates["status"] is not None:
            status = _enum_value(updates["status"])
            blocker.status = status
            blocker.resolved_at = (
                datetime.now(UTC) if status == ProjectBlockerStatus.RESOLVED.value else None
            )
        blocker.updated_at = datetime.now(UTC)
        await self._record_activity(
            user,
            project,
            activity_type=ProjectActivityType.BLOCKER_UPDATED,
            description=f"Blocker updated: {blocker.title}",
            metadata={"blockerId": str(blocker.id), "updatedFields": sorted(updates.keys())},
        )
        await self.db.flush()
        return blocker

    async def list_activity(
        self, user: User, project_id: UUID, pagination: PaginationParams
    ) -> PageResult[ProjectActivity]:
        project = await self.get_project(user, project_id)
        total = await self._count(
            select(func.count(ProjectActivity.id)).where(
                ProjectActivity.owner_user_id == user.id,
                ProjectActivity.project_id == project.id,
            )
        )
        result = await self.db.execute(
            select(ProjectActivity)
            .where(
                ProjectActivity.owner_user_id == user.id, ProjectActivity.project_id == project.id
            )
            .order_by(ProjectActivity.created_at.desc(), ProjectActivity.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def _apply_project_status(
        self, user: User, project: Project, status: ProjectStatus | str
    ) -> None:
        status_value = _enum_value(status)
        previous_status = project.status
        now = datetime.now(UTC)
        project.status = status_value
        if status_value == ProjectStatus.COMPLETED.value:
            project.completed_at = project.completed_at or now
            if previous_status != ProjectStatus.COMPLETED.value:
                await self.user_data.create_domain_event(
                    user,
                    event_type=DomainEventType.PROJECT_COMPLETED,
                    idempotency_key=f"project.completed:{project.id}",
                    payload={"projectId": str(project.id), "name": project.name},
                )
                await self._record_activity(
                    user,
                    project,
                    activity_type=ProjectActivityType.PROJECT_COMPLETED,
                    description=f"Project completed: {project.name}",
                    metadata={"projectId": str(project.id)},
                )
        elif status_value == ProjectStatus.ARCHIVED.value:
            project.archived_at = project.archived_at or now
        elif status_value in {ProjectStatus.ACTIVE.value, ProjectStatus.PAUSED.value}:
            project.completed_at = None

    async def _record_activity(
        self,
        user: User,
        project: Project,
        *,
        activity_type: ProjectActivityType,
        description: str,
        metadata: dict[str, Any],
    ) -> ProjectActivity:
        activity = ProjectActivity(
            owner_user_id=user.id,
            project_id=project.id,
            activity_type=activity_type.value,
            description=description[:240],
            metadata_json=metadata,
        )
        self.db.add(activity)
        await self.user_data.record_audit_log(
            user,
            action=activity_type.value,
            entity_type="project",
            entity_id=project.id,
            metadata=metadata,
        )
        return activity

    async def _get_project_milestone(
        self, user: User, project_id: UUID, milestone_id: UUID
    ) -> ProjectMilestone:
        result = await self.db.execute(
            select(ProjectMilestone).where(
                ProjectMilestone.id == milestone_id,
                ProjectMilestone.project_id == project_id,
                ProjectMilestone.owner_user_id == user.id,
            )
        )
        milestone = result.scalar_one_or_none()
        if milestone is None:
            raise AppError(404, "not_found", "Milestone was not found.")
        return milestone

    async def _get_owned_file(self, user: User, file_id: UUID) -> FileRecord:
        result = await self.db.execute(
            select(FileRecord).where(
                FileRecord.id == file_id,
                FileRecord.owner_user_id == user.id,
                FileRecord.deletion_status == FileDeletionStatus.ACTIVE.value,
            )
        )
        file = result.scalar_one_or_none()
        if file is None:
            raise AppError(404, "not_found", "File was not found.")
        return file

    async def _get_owned_topic(self, user: User, topic_id: UUID) -> Topic:
        result = await self.db.execute(
            select(Topic).where(
                Topic.id == topic_id,
                Topic.owner_user_id == user.id,
                Topic.status == LearningRecordStatus.ACTIVE.value,
            )
        )
        topic = result.scalar_one_or_none()
        if topic is None:
            raise AppError(404, "not_found", "Topic was not found.")
        return topic

    async def _find_project_file(
        self, user: User, project_id: UUID, file_id: UUID
    ) -> ProjectFile | None:
        result = await self.db.execute(
            select(ProjectFile).where(
                ProjectFile.owner_user_id == user.id,
                ProjectFile.project_id == project_id,
                ProjectFile.file_id == file_id,
            )
        )
        return result.scalar_one_or_none()

    async def _find_project_topic(
        self, user: User, project_id: UUID, topic_id: UUID
    ) -> ProjectTopic | None:
        result = await self.db.execute(
            select(ProjectTopic).where(
                ProjectTopic.owner_user_id == user.id,
                ProjectTopic.project_id == project_id,
                ProjectTopic.topic_id == topic_id,
            )
        )
        return result.scalar_one_or_none()

    async def _get_owned(self, model: Any, user: User, record_id: UUID, label: str) -> Any:
        result = await self.db.execute(
            select(model).where(model.id == record_id, model.owner_user_id == user.id)
        )
        record = result.scalar_one_or_none()
        if record is None:
            raise AppError(404, "not_found", f"{label} was not found.")
        return record

    async def _list_for_project(
        self,
        model: Any,
        user: User,
        project_id: UUID,
        *,
        limit: int | None = None,
    ) -> list[Any]:
        query = select(model).where(model.owner_user_id == user.id, model.project_id == project_id)
        if hasattr(model, "position"):
            query = query.order_by(model.position.asc(), model.created_at.desc())
        else:
            query = query.order_by(model.created_at.desc(), model.id.desc())
        if limit is not None:
            query = query.limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def _count(self, query: Select[tuple[int]]) -> int:
        value = await self.db.scalar(query)
        return int(value or 0)


def _compact(value: str) -> str:
    return " ".join(value.strip().split())


def _compact_optional(value: object) -> str | None:
    if value is None:
        return None
    compact = _compact(str(value))
    return compact or None


def _normalize_name(value: str) -> str:
    return _compact(value).casefold()


def _enum_value(value: object) -> str:
    if isinstance(value, str):
        return value
    enum_value = getattr(value, "value", None)
    return str(enum_value if enum_value is not None else value)
