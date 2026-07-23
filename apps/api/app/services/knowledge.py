from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import Select, and_, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.pagination import PaginationParams
from app.domain.file_vault import FileDeletionStatus
from app.domain.knowledge import (
    KnowledgeNodeStatus,
    KnowledgeNodeType,
    KnowledgeRecommendationPriority,
    KnowledgeRelationshipDirection,
    KnowledgeRelationshipSource,
    KnowledgeRelationType,
)
from app.domain.learning import LearningRecordStatus, LessonStatus
from app.domain.projects import ProjectStatus
from app.models.achievements import AchievementDefinition, UserAchievement
from app.models.auth import User
from app.models.file_vault import FileRecord
from app.models.knowledge import KnowledgeNode, KnowledgeRelationship
from app.models.learning import (
    LearningResource,
    Lesson,
    MasteryRecord,
    Question,
    Quiz,
    Topic,
    TopicRelation,
)
from app.models.projects import Project, ProjectFile, ProjectTopic
from app.services.foundation import PageResult, UserDataService


@dataclass(frozen=True)
class KnowledgeSyncResult:
    nodes_created: int = 0
    nodes_updated: int = 0
    relationships_created: int = 0
    relationships_reused: int = 0

    def add(self, other: KnowledgeSyncResult) -> KnowledgeSyncResult:
        return KnowledgeSyncResult(
            nodes_created=self.nodes_created + other.nodes_created,
            nodes_updated=self.nodes_updated + other.nodes_updated,
            relationships_created=self.relationships_created + other.relationships_created,
            relationships_reused=self.relationships_reused + other.relationships_reused,
        )


@dataclass(frozen=True)
class KnowledgeRelatedNode:
    node: KnowledgeNode
    relationship: KnowledgeRelationship
    direction: KnowledgeRelationshipDirection
    reason: str


@dataclass(frozen=True)
class KnowledgeRecommendation:
    topic_id: UUID
    title: str
    reason: str
    priority: KnowledgeRecommendationPriority
    open_url: str
    mastery_score: float | None
    stale_since: datetime | None


class KnowledgeGraphService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_data = UserDataService(db)

    async def list_nodes(
        self,
        user: User,
        pagination: PaginationParams,
        *,
        node_type: KnowledgeNodeType | None = None,
        query: str | None = None,
    ) -> PageResult[KnowledgeNode]:
        predicates = [
            KnowledgeNode.owner_user_id == user.id,
            KnowledgeNode.status == KnowledgeNodeStatus.ACTIVE.value,
        ]
        if node_type is not None:
            predicates.append(KnowledgeNode.node_type == node_type.value)
        if query:
            pattern = f"%{query.strip().casefold()}%"
            predicates.append(
                or_(
                    func.lower(KnowledgeNode.title).like(pattern),
                    func.lower(KnowledgeNode.description).like(pattern),
                )
            )

        total = await self._count(select(func.count(KnowledgeNode.id)).where(*predicates))
        result = await self.db.execute(
            select(KnowledgeNode)
            .where(*predicates)
            .order_by(KnowledgeNode.updated_at.desc(), KnowledgeNode.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def create_node(
        self,
        user: User,
        *,
        node_type: KnowledgeNodeType,
        title: str,
        description: str | None,
        open_url: str | None,
        metadata: dict[str, object],
    ) -> KnowledgeNode:
        if node_type != KnowledgeNodeType.SKILL:
            raise AppError(
                422,
                "source_backed_node",
                "Only manual skill nodes can be created directly; "
                "source-backed nodes sync from approved records.",
            )
        node, created = await self._upsert_node(
            user,
            node_type=node_type,
            source_id=None,
            source_key=f"manual:{node_type.value}:{_slug(title)}",
            title=title,
            description=description,
            open_url=open_url or "/app/learning",
            metadata={"source": "manual", **metadata},
        )
        await self.user_data.record_audit_log(
            user,
            action="knowledge.node_created" if created else "knowledge.node_reused",
            entity_type="knowledge_node",
            entity_id=node.id,
            metadata={"nodeType": node.node_type, "sourceKey": node.source_key},
        )
        return node

    async def get_node(self, user: User, node_id: UUID) -> KnowledgeNode:
        result = await self.db.execute(
            select(KnowledgeNode).where(
                KnowledgeNode.id == node_id,
                KnowledgeNode.owner_user_id == user.id,
                KnowledgeNode.status == KnowledgeNodeStatus.ACTIVE.value,
            )
        )
        node = result.scalar_one_or_none()
        if node is None:
            raise AppError(404, "not_found", "Knowledge node was not found.")
        return node

    async def list_relationships(
        self,
        user: User,
        pagination: PaginationParams,
        *,
        node_id: UUID | None = None,
        relation_type: KnowledgeRelationType | None = None,
        direction: KnowledgeRelationshipDirection = KnowledgeRelationshipDirection.BOTH,
    ) -> PageResult[KnowledgeRelationship]:
        predicates = [KnowledgeRelationship.owner_user_id == user.id]
        if node_id is not None:
            await self.get_node(user, node_id)
            if direction == KnowledgeRelationshipDirection.OUTGOING:
                predicates.append(KnowledgeRelationship.source_node_id == node_id)
            elif direction == KnowledgeRelationshipDirection.INCOMING:
                predicates.append(KnowledgeRelationship.target_node_id == node_id)
            else:
                predicates.append(
                    or_(
                        KnowledgeRelationship.source_node_id == node_id,
                        KnowledgeRelationship.target_node_id == node_id,
                    )
                )
        if relation_type is not None:
            predicates.append(KnowledgeRelationship.relation_type == relation_type.value)

        total = await self._count(select(func.count(KnowledgeRelationship.id)).where(*predicates))
        result = await self.db.execute(
            select(KnowledgeRelationship)
            .where(*predicates)
            .order_by(KnowledgeRelationship.updated_at.desc(), KnowledgeRelationship.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def create_relationship(
        self,
        user: User,
        *,
        source_node_id: UUID,
        target_node_id: UUID,
        relation_type: KnowledgeRelationType,
        weight: float,
        evidence: dict[str, object],
    ) -> KnowledgeRelationship:
        if source_node_id == target_node_id:
            raise AppError(422, "self_relationship", "A knowledge node cannot link to itself.")
        source = await self.get_node(user, source_node_id)
        target = await self.get_node(user, target_node_id)
        relationship, created = await self._upsert_relationship(
            user,
            source_node=source,
            target_node=target,
            relation_type=relation_type,
            source=KnowledgeRelationshipSource.USER,
            weight=weight,
            evidence={"source": "manual", **evidence},
        )
        await self.user_data.record_audit_log(
            user,
            action="knowledge.relationship_created" if created else "knowledge.relationship_reused",
            entity_type="knowledge_relationship",
            entity_id=relationship.id,
            metadata={
                "relationType": relationship.relation_type,
                "sourceNodeId": str(source_node_id),
                "targetNodeId": str(target_node_id),
            },
        )
        return relationship

    async def sync_from_sources(self, user: User) -> KnowledgeSyncResult:
        result = KnowledgeSyncResult()

        for topic in await self._all_topics(user):
            result = result.add(await self.sync_topic(user, topic))
        for file in await self._all_files(user):
            result = result.add(await self.sync_file(user, file))
        for lesson in await self._all_lessons(user):
            result = result.add(await self.sync_lesson(user, lesson))
        for question in await self._all_questions(user):
            result = result.add(await self.sync_question(user, question))
        for project in await self._all_projects(user):
            result = result.add(await self.sync_project(user, project))
        for relation in await self._all_topic_relations(user):
            result = result.add(await self.sync_topic_relation(user, relation))
        for resource in await self._all_learning_resources(user):
            result = result.add(await self.sync_learning_resource(user, resource))
        for project_topic in await self._all_project_topics(user):
            result = result.add(await self.sync_project_topic(user, project_topic))
        for project_file in await self._all_project_files(user):
            result = result.add(await self.sync_project_file(user, project_file))
        for achievement in await self._all_user_achievements(user):
            result = result.add(await self.sync_user_achievement(user, achievement))

        await self.user_data.record_audit_log(
            user,
            action="knowledge.sync_completed",
            entity_type="knowledge_graph",
            metadata={
                "nodesCreated": result.nodes_created,
                "nodesUpdated": result.nodes_updated,
                "relationshipsCreated": result.relationships_created,
                "relationshipsReused": result.relationships_reused,
            },
        )
        return result

    async def sync_topic(self, user: User, topic: Topic) -> KnowledgeSyncResult:
        await self._ensure_owner(user, topic.owner_user_id, "Topic")
        _node, created = await self._upsert_node(
            user,
            node_type=KnowledgeNodeType.TOPIC,
            source_id=topic.id,
            source_key=str(topic.id),
            title=topic.name,
            description=topic.description,
            open_url=f"/app/learning?topicId={topic.id}",
            metadata={"subjectId": str(topic.subject_id) if topic.subject_id else None},
        )
        return _node_result(created)

    async def sync_file(self, user: User, file: FileRecord) -> KnowledgeSyncResult:
        await self._ensure_owner(user, file.owner_user_id, "File")
        _node, created = await self._upsert_node(
            user,
            node_type=KnowledgeNodeType.FILE,
            source_id=file.id,
            source_key=str(file.id),
            title=file.display_name,
            description=f"{file.file_kind} file in Personal Vault",
            open_url=f"/app/library?fileId={file.id}",
            metadata={
                "processingStatus": file.processing_status,
                "fileKind": file.file_kind,
                "sizeBytes": file.size_bytes,
            },
        )
        return _node_result(created)

    async def sync_lesson(self, user: User, lesson: Lesson) -> KnowledgeSyncResult:
        await self._ensure_owner(user, lesson.owner_user_id, "Lesson")
        lesson_node, created = await self._upsert_node(
            user,
            node_type=KnowledgeNodeType.LESSON,
            source_id=lesson.id,
            source_key=str(lesson.id),
            title=lesson.title,
            description=None,
            open_url=f"/app/learning?lessonId={lesson.id}",
            metadata={
                "moduleId": str(lesson.module_id),
                "topicId": str(lesson.topic_id) if lesson.topic_id else None,
                "status": lesson.status,
            },
        )
        sync = _node_result(created)
        if lesson.topic_id is not None:
            topic = await self._get_owned_topic(user, lesson.topic_id)
            topic_node = await self._topic_node(user, topic)
            _relationship, relationship_created = await self._upsert_relationship(
                user,
                source_node=lesson_node,
                target_node=topic_node,
                relation_type=KnowledgeRelationType.EXPLAINS,
                source=KnowledgeRelationshipSource.LEARNING,
                weight=0.85,
                evidence={"lessonId": str(lesson.id), "topicId": str(topic.id)},
            )
            sync = sync.add(_relationship_result(relationship_created))
            if lesson.status == LessonStatus.COMPLETED.value:
                _mastery_relationship, mastery_created = await self._upsert_relationship(
                    user,
                    source_node=topic_node,
                    target_node=lesson_node,
                    relation_type=KnowledgeRelationType.MASTERED_THROUGH,
                    source=KnowledgeRelationshipSource.LEARNING,
                    weight=0.6,
                    evidence={"lessonId": str(lesson.id), "topicId": str(topic.id)},
                )
                sync = sync.add(_relationship_result(mastery_created))
        return sync

    async def sync_question(self, user: User, question: Question) -> KnowledgeSyncResult:
        await self._ensure_owner(user, question.owner_user_id, "Question")
        quiz = await self._get_owned_quiz(user, question.quiz_id)
        question_node, created = await self._upsert_node(
            user,
            node_type=KnowledgeNodeType.QUESTION,
            source_id=question.id,
            source_key=str(question.id),
            title=_excerpt(question.prompt, 120),
            description=question.explanation,
            open_url=f"/app/learning?questionId={question.id}",
            metadata={"quizId": str(question.quiz_id), "difficulty": question.difficulty},
        )
        sync = _node_result(created)
        if quiz.topic_id is not None:
            topic = await self._get_owned_topic(user, quiz.topic_id)
            topic_node = await self._topic_node(user, topic)
            _relationship, relationship_created = await self._upsert_relationship(
                user,
                source_node=question_node,
                target_node=topic_node,
                relation_type=KnowledgeRelationType.PRACTICES,
                source=KnowledgeRelationshipSource.LEARNING,
                weight=0.8,
                evidence={"questionId": str(question.id), "quizId": str(quiz.id)},
            )
            sync = sync.add(_relationship_result(relationship_created))
        return sync

    async def sync_project(self, user: User, project: Project) -> KnowledgeSyncResult:
        await self._ensure_owner(user, project.owner_user_id, "Project")
        _node, created = await self._upsert_node(
            user,
            node_type=KnowledgeNodeType.PROJECT,
            source_id=project.id,
            source_key=str(project.id),
            title=project.name,
            description=project.objective or project.description,
            open_url=f"/app/projects?projectId={project.id}",
            metadata={"status": project.status, "repositoryUrl": project.repository_url},
        )
        return _node_result(created)

    async def sync_topic_relation(
        self, user: User, topic_relation: TopicRelation
    ) -> KnowledgeSyncResult:
        await self._ensure_owner(user, topic_relation.owner_user_id, "Topic relation")
        source_topic = await self._get_owned_topic(user, topic_relation.source_topic_id)
        target_topic = await self._get_owned_topic(user, topic_relation.target_topic_id)
        source_node = await self._topic_node(user, source_topic)
        target_node = await self._topic_node(user, target_topic)
        _relationship, created = await self._upsert_relationship(
            user,
            source_node=source_node,
            target_node=target_node,
            relation_type=KnowledgeRelationType.REQUIRES,
            source=KnowledgeRelationshipSource.LEARNING,
            weight=1.0,
            evidence={
                "topicRelationId": str(topic_relation.id),
                "sourceTopicId": str(source_topic.id),
                "targetTopicId": str(target_topic.id),
            },
        )
        return _relationship_result(created)

    async def sync_learning_resource(
        self, user: User, resource: LearningResource
    ) -> KnowledgeSyncResult:
        await self._ensure_owner(user, resource.owner_user_id, "Learning resource")
        if resource.file_id is None or resource.topic_id is None:
            return KnowledgeSyncResult()
        file = await self._get_owned_file(user, resource.file_id)
        topic = await self._get_owned_topic(user, resource.topic_id)
        file_node = await self._file_node(user, file)
        topic_node = await self._topic_node(user, topic)
        _relationship, created = await self._upsert_relationship(
            user,
            source_node=file_node,
            target_node=topic_node,
            relation_type=KnowledgeRelationType.EXPLAINS,
            source=KnowledgeRelationshipSource.LEARNING,
            weight=0.75,
            evidence={
                "learningResourceId": str(resource.id),
                "fileId": str(file.id),
                "topicId": str(topic.id),
            },
        )
        return _relationship_result(created)

    async def sync_project_topic(
        self, user: User, project_topic: ProjectTopic
    ) -> KnowledgeSyncResult:
        await self._ensure_owner(user, project_topic.owner_user_id, "Project topic")
        project = await self._get_owned_project(user, project_topic.project_id)
        topic = await self._get_owned_topic(user, project_topic.topic_id)
        topic_node = await self._topic_node(user, topic)
        project_node = await self._project_node(user, project)
        _relationship, created = await self._upsert_relationship(
            user,
            source_node=topic_node,
            target_node=project_node,
            relation_type=KnowledgeRelationType.USED_IN,
            source=KnowledgeRelationshipSource.PROJECT,
            weight=0.8,
            evidence={"projectTopicId": str(project_topic.id)},
        )
        return _relationship_result(created)

    async def sync_project_file(self, user: User, project_file: ProjectFile) -> KnowledgeSyncResult:
        await self._ensure_owner(user, project_file.owner_user_id, "Project file")
        project = await self._get_owned_project(user, project_file.project_id)
        file = await self._get_owned_file(user, project_file.file_id)
        project_node = await self._project_node(user, project)
        file_node = await self._file_node(user, file)
        _relationship, created = await self._upsert_relationship(
            user,
            source_node=project_node,
            target_node=file_node,
            relation_type=KnowledgeRelationType.REFERENCES,
            source=KnowledgeRelationshipSource.PROJECT,
            weight=0.7,
            evidence={"projectFileId": str(project_file.id)},
        )
        return _relationship_result(created)

    async def sync_user_achievement(
        self, user: User, user_achievement: UserAchievement
    ) -> KnowledgeSyncResult:
        await self._ensure_owner(user, user_achievement.owner_user_id, "Achievement")
        definition = await self._get_achievement_definition(
            user_achievement.achievement_definition_id
        )
        _node, created = await self._upsert_node(
            user,
            node_type=KnowledgeNodeType.ACHIEVEMENT,
            source_id=definition.id,
            source_key=str(definition.id),
            title=definition.title,
            description=definition.description,
            open_url=f"/app/achievements?achievement={definition.slug}",
            metadata={
                "slug": definition.slug,
                "category": definition.category,
                "points": definition.points,
                "unlockedAt": user_achievement.unlocked_at.isoformat(),
            },
        )
        return _node_result(created)

    async def related_topic(
        self,
        user: User,
        topic_id: UUID,
        pagination: PaginationParams,
    ) -> PageResult[KnowledgeRelatedNode]:
        topic = await self._get_owned_topic(user, topic_id)
        topic_node = await self._topic_node(user, topic)
        return await self._related_nodes(
            user,
            topic_node,
            pagination,
            only_node_type=KnowledgeNodeType.TOPIC,
        )

    async def prerequisites(
        self,
        user: User,
        topic_id: UUID,
        pagination: PaginationParams,
    ) -> PageResult[KnowledgeRelatedNode]:
        topic = await self._get_owned_topic(user, topic_id)
        topic_node = await self._topic_node(user, topic)
        predicates = [
            KnowledgeRelationship.owner_user_id == user.id,
            KnowledgeRelationship.source_node_id == topic_node.id,
            KnowledgeRelationship.relation_type == KnowledgeRelationType.REQUIRES.value,
        ]
        total = await self._count(select(func.count(KnowledgeRelationship.id)).where(*predicates))
        result = await self.db.execute(
            select(KnowledgeRelationship, KnowledgeNode)
            .join(KnowledgeNode, KnowledgeNode.id == KnowledgeRelationship.target_node_id)
            .where(
                *predicates,
                KnowledgeNode.owner_user_id == user.id,
                KnowledgeNode.status == KnowledgeNodeStatus.ACTIVE.value,
            )
            .order_by(KnowledgeNode.title.asc(), KnowledgeNode.id.asc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        items = [
            KnowledgeRelatedNode(
                node=node,
                relationship=relationship,
                direction=KnowledgeRelationshipDirection.OUTGOING,
                reason="Prerequisite topic",
            )
            for relationship, node in result.all()
        ]
        return PageResult(
            items=items, total=total, limit=pagination.limit, offset=pagination.offset
        )

    async def recommendations(
        self,
        user: User,
        pagination: PaginationParams,
    ) -> PageResult[KnowledgeRecommendation]:
        cutoff = datetime.now(UTC) - timedelta(days=30)
        database_cutoff = cutoff.replace(tzinfo=None)
        result = await self.db.execute(
            select(Topic, MasteryRecord)
            .join(MasteryRecord, MasteryRecord.topic_id == Topic.id)
            .where(
                Topic.owner_user_id == user.id,
                MasteryRecord.owner_user_id == user.id,
                Topic.status == LearningRecordStatus.ACTIVE.value,
                or_(
                    MasteryRecord.mastery_score < 0.5,
                    MasteryRecord.updated_at < database_cutoff,
                ),
            )
            .order_by(MasteryRecord.mastery_score.asc(), MasteryRecord.updated_at.asc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        items: list[KnowledgeRecommendation] = []
        for topic, mastery in result.all():
            is_weak = mastery.mastery_score < 0.5
            is_stale = _ensure_aware_utc(mastery.updated_at) < cutoff
            if is_weak:
                priority = KnowledgeRecommendationPriority.HIGH
                reason = "Mastery is below 50%; review evidence and practice this topic."
            elif is_stale:
                priority = KnowledgeRecommendationPriority.MEDIUM
                reason = "This topic has not been reviewed recently."
            else:
                priority = KnowledgeRecommendationPriority.LOW
                reason = "Review recommended from related learning records."
            items.append(
                KnowledgeRecommendation(
                    topic_id=topic.id,
                    title=topic.name,
                    reason=reason,
                    priority=priority,
                    open_url=f"/app/learning?topicId={topic.id}",
                    mastery_score=mastery.mastery_score,
                    stale_since=_ensure_aware_utc(mastery.updated_at) if is_stale else None,
                )
            )
        total = await self._count(
            select(func.count(MasteryRecord.id))
            .join(Topic, Topic.id == MasteryRecord.topic_id)
            .where(
                Topic.owner_user_id == user.id,
                MasteryRecord.owner_user_id == user.id,
                Topic.status == LearningRecordStatus.ACTIVE.value,
                or_(
                    MasteryRecord.mastery_score < 0.5,
                    MasteryRecord.updated_at < database_cutoff,
                ),
            )
        )
        return PageResult(
            items=items, total=total, limit=pagination.limit, offset=pagination.offset
        )

    async def summary(self, user: User) -> dict[str, int]:
        cutoff = datetime.now(UTC) - timedelta(days=30)
        node_count = await self._count(
            select(func.count(KnowledgeNode.id)).where(
                KnowledgeNode.owner_user_id == user.id,
                KnowledgeNode.status == KnowledgeNodeStatus.ACTIVE.value,
            )
        )
        relationship_count = await self._count(
            select(func.count(KnowledgeRelationship.id)).where(
                KnowledgeRelationship.owner_user_id == user.id
            )
        )
        weak_topic_count = await self._count(
            select(func.count(MasteryRecord.id)).where(
                MasteryRecord.owner_user_id == user.id,
                MasteryRecord.mastery_score < 0.5,
            )
        )
        stale_topic_count = await self._count(
            select(func.count(MasteryRecord.id)).where(
                MasteryRecord.owner_user_id == user.id,
                MasteryRecord.updated_at < cutoff.replace(tzinfo=None),
            )
        )
        return {
            "node_count": node_count,
            "relationship_count": relationship_count,
            "weak_topic_count": weak_topic_count,
            "stale_topic_count": stale_topic_count,
        }

    async def _related_nodes(
        self,
        user: User,
        node: KnowledgeNode,
        pagination: PaginationParams,
        *,
        only_node_type: KnowledgeNodeType | None = None,
    ) -> PageResult[KnowledgeRelatedNode]:
        relationship_filter = and_(
            KnowledgeRelationship.owner_user_id == user.id,
            or_(
                KnowledgeRelationship.source_node_id == node.id,
                KnowledgeRelationship.target_node_id == node.id,
            ),
        )
        total = await self._count(
            select(func.count(KnowledgeRelationship.id)).where(relationship_filter)
        )
        result = await self.db.execute(
            select(KnowledgeRelationship)
            .where(relationship_filter)
            .order_by(KnowledgeRelationship.weight.desc(), KnowledgeRelationship.updated_at.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        items: list[KnowledgeRelatedNode] = []
        for relationship in result.scalars().all():
            other_id = (
                relationship.target_node_id
                if relationship.source_node_id == node.id
                else relationship.source_node_id
            )
            other = await self.get_node(user, other_id)
            if only_node_type is not None and other.node_type != only_node_type.value:
                continue
            direction = (
                KnowledgeRelationshipDirection.OUTGOING
                if relationship.source_node_id == node.id
                else KnowledgeRelationshipDirection.INCOMING
            )
            items.append(
                KnowledgeRelatedNode(
                    node=other,
                    relationship=relationship,
                    direction=direction,
                    reason=_relationship_reason(relationship.relation_type, direction),
                )
            )
        return PageResult(
            items=items,
            total=len(items) if only_node_type is not None else total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def _upsert_node(
        self,
        user: User,
        *,
        node_type: KnowledgeNodeType,
        source_id: UUID | None,
        source_key: str,
        title: str,
        description: str | None,
        open_url: str,
        metadata: dict[str, object],
    ) -> tuple[KnowledgeNode, bool]:
        result = await self.db.execute(
            select(KnowledgeNode).where(
                KnowledgeNode.owner_user_id == user.id,
                KnowledgeNode.node_type == node_type.value,
                KnowledgeNode.source_key == source_key,
            )
        )
        node = result.scalar_one_or_none()
        if node is None:
            node = KnowledgeNode(
                owner_user_id=user.id,
                node_type=node_type.value,
                source_id=source_id,
                source_key=source_key,
                title=_compact(title),
                description=_compact_optional(description),
                open_url=open_url,
                status=KnowledgeNodeStatus.ACTIVE.value,
                metadata_json=metadata,
            )
            self.db.add(node)
            await self.db.flush()
            return node, True

        node.source_id = source_id
        node.title = _compact(title)
        node.description = _compact_optional(description)
        node.open_url = open_url
        node.status = KnowledgeNodeStatus.ACTIVE.value
        node.metadata_json = metadata
        node.updated_at = datetime.now(UTC)
        await self.db.flush()
        return node, False

    async def _upsert_relationship(
        self,
        user: User,
        *,
        source_node: KnowledgeNode,
        target_node: KnowledgeNode,
        relation_type: KnowledgeRelationType,
        source: KnowledgeRelationshipSource,
        weight: float,
        evidence: dict[str, object],
    ) -> tuple[KnowledgeRelationship, bool]:
        if source_node.id == target_node.id:
            raise AppError(422, "self_relationship", "A knowledge node cannot link to itself.")
        await self._ensure_owner(user, source_node.owner_user_id, "Knowledge source node")
        await self._ensure_owner(user, target_node.owner_user_id, "Knowledge target node")
        result = await self.db.execute(
            select(KnowledgeRelationship).where(
                KnowledgeRelationship.owner_user_id == user.id,
                KnowledgeRelationship.source_node_id == source_node.id,
                KnowledgeRelationship.target_node_id == target_node.id,
                KnowledgeRelationship.relation_type == relation_type.value,
            )
        )
        relationship = result.scalar_one_or_none()
        if relationship is None:
            relationship = KnowledgeRelationship(
                owner_user_id=user.id,
                source_node_id=source_node.id,
                target_node_id=target_node.id,
                relation_type=relation_type.value,
                source=source.value,
                weight=weight,
                evidence=evidence,
            )
            self.db.add(relationship)
            try:
                await self.db.flush()
            except IntegrityError as exc:
                raise AppError(
                    409, "relationship_conflict", "Knowledge relationship exists."
                ) from exc
            return relationship, True

        relationship.source = source.value
        relationship.weight = weight
        relationship.evidence = evidence
        relationship.updated_at = datetime.now(UTC)
        await self.db.flush()
        return relationship, False

    async def _topic_node(self, user: User, topic: Topic) -> KnowledgeNode:
        node, _created = await self._upsert_node(
            user,
            node_type=KnowledgeNodeType.TOPIC,
            source_id=topic.id,
            source_key=str(topic.id),
            title=topic.name,
            description=topic.description,
            open_url=f"/app/learning?topicId={topic.id}",
            metadata={"subjectId": str(topic.subject_id) if topic.subject_id else None},
        )
        return node

    async def _file_node(self, user: User, file: FileRecord) -> KnowledgeNode:
        node, _created = await self._upsert_node(
            user,
            node_type=KnowledgeNodeType.FILE,
            source_id=file.id,
            source_key=str(file.id),
            title=file.display_name,
            description=f"{file.file_kind} file in Personal Vault",
            open_url=f"/app/library?fileId={file.id}",
            metadata={"processingStatus": file.processing_status, "fileKind": file.file_kind},
        )
        return node

    async def _project_node(self, user: User, project: Project) -> KnowledgeNode:
        node, _created = await self._upsert_node(
            user,
            node_type=KnowledgeNodeType.PROJECT,
            source_id=project.id,
            source_key=str(project.id),
            title=project.name,
            description=project.objective or project.description,
            open_url=f"/app/projects?projectId={project.id}",
            metadata={"status": project.status},
        )
        return node

    async def _all_topics(self, user: User) -> list[Topic]:
        result = await self.db.execute(
            select(Topic).where(
                Topic.owner_user_id == user.id,
                Topic.status == LearningRecordStatus.ACTIVE.value,
            )
        )
        return list(result.scalars().all())

    async def _all_files(self, user: User) -> list[FileRecord]:
        result = await self.db.execute(
            select(FileRecord).where(
                FileRecord.owner_user_id == user.id,
                FileRecord.deletion_status == FileDeletionStatus.ACTIVE.value,
            )
        )
        return list(result.scalars().all())

    async def _all_lessons(self, user: User) -> list[Lesson]:
        result = await self.db.execute(select(Lesson).where(Lesson.owner_user_id == user.id))
        return list(result.scalars().all())

    async def _all_questions(self, user: User) -> list[Question]:
        result = await self.db.execute(select(Question).where(Question.owner_user_id == user.id))
        return list(result.scalars().all())

    async def _all_projects(self, user: User) -> list[Project]:
        result = await self.db.execute(
            select(Project).where(
                Project.owner_user_id == user.id,
                Project.status != ProjectStatus.ARCHIVED.value,
            )
        )
        return list(result.scalars().all())

    async def _all_topic_relations(self, user: User) -> list[TopicRelation]:
        result = await self.db.execute(
            select(TopicRelation).where(TopicRelation.owner_user_id == user.id)
        )
        return list(result.scalars().all())

    async def _all_learning_resources(self, user: User) -> list[LearningResource]:
        result = await self.db.execute(
            select(LearningResource).where(LearningResource.owner_user_id == user.id)
        )
        return list(result.scalars().all())

    async def _all_project_topics(self, user: User) -> list[ProjectTopic]:
        result = await self.db.execute(
            select(ProjectTopic).where(ProjectTopic.owner_user_id == user.id)
        )
        return list(result.scalars().all())

    async def _all_project_files(self, user: User) -> list[ProjectFile]:
        result = await self.db.execute(
            select(ProjectFile).where(ProjectFile.owner_user_id == user.id)
        )
        return list(result.scalars().all())

    async def _all_user_achievements(self, user: User) -> list[UserAchievement]:
        result = await self.db.execute(
            select(UserAchievement).where(UserAchievement.owner_user_id == user.id)
        )
        return list(result.scalars().all())

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

    async def _get_owned_project(self, user: User, project_id: UUID) -> Project:
        result = await self.db.execute(
            select(Project).where(Project.id == project_id, Project.owner_user_id == user.id)
        )
        project = result.scalar_one_or_none()
        if project is None:
            raise AppError(404, "not_found", "Project was not found.")
        return project

    async def _get_owned_quiz(self, user: User, quiz_id: UUID) -> Quiz:
        result = await self.db.execute(
            select(Quiz).where(Quiz.id == quiz_id, Quiz.owner_user_id == user.id)
        )
        quiz = result.scalar_one_or_none()
        if quiz is None:
            raise AppError(404, "not_found", "Quiz was not found.")
        return quiz

    async def _get_achievement_definition(self, definition_id: UUID) -> AchievementDefinition:
        result = await self.db.execute(
            select(AchievementDefinition).where(AchievementDefinition.id == definition_id)
        )
        definition = result.scalar_one_or_none()
        if definition is None:
            raise AppError(404, "not_found", "Achievement definition was not found.")
        return definition

    async def _ensure_owner(self, user: User, owner_user_id: UUID, label: str) -> None:
        if owner_user_id != user.id:
            raise AppError(404, "not_found", f"{label} was not found.")

    async def _count(self, query: Select[tuple[int]]) -> int:
        value = await self.db.scalar(query)
        return int(value or 0)


def _node_result(created: bool) -> KnowledgeSyncResult:
    return KnowledgeSyncResult(nodes_created=1 if created else 0, nodes_updated=0 if created else 1)


def _relationship_result(created: bool) -> KnowledgeSyncResult:
    return KnowledgeSyncResult(
        relationships_created=1 if created else 0,
        relationships_reused=0 if created else 1,
    )


def _compact(value: str) -> str:
    return " ".join(value.strip().split())


def _compact_optional(value: str | None) -> str | None:
    if value is None:
        return None
    compact = _compact(value)
    return compact or None


def _slug(value: str) -> str:
    return "-".join(_compact(value).casefold().split())[:120]


def _excerpt(value: str, limit: int) -> str:
    compact = _compact(value)
    return compact if len(compact) <= limit else f"{compact[: limit - 1]}..."


def _ensure_aware_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _relationship_reason(
    relation_type: str,
    direction: KnowledgeRelationshipDirection,
) -> str:
    if relation_type == KnowledgeRelationType.REQUIRES.value:
        if direction == KnowledgeRelationshipDirection.OUTGOING:
            return "Requires this topic"
        return "Required by this topic"
    if relation_type == KnowledgeRelationType.EXPLAINS.value:
        if direction == KnowledgeRelationshipDirection.INCOMING:
            return "Explains this topic"
        return "Explained by this topic"
    if relation_type == KnowledgeRelationType.PRACTICES.value:
        return "Practice evidence"
    if relation_type == KnowledgeRelationType.USED_IN.value:
        return "Used in a project"
    if relation_type == KnowledgeRelationType.REFERENCES.value:
        return "Reference connection"
    return "Related learning record"
