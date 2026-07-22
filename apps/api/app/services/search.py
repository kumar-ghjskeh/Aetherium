from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.pagination import PaginationParams
from app.domain.file_ingestion import ChunkStatus
from app.domain.file_vault import FileDeletionStatus
from app.domain.foundation import WorldLocationId
from app.domain.habits import HabitStatus
from app.domain.learning import LearningRecordStatus
from app.domain.mentors import ConversationStatus
from app.domain.projects import ProjectStatus
from app.domain.search import SearchEntityType, SearchMatchReason, SearchMode, SearchSort
from app.models.auth import User
from app.models.file_ingestion import FileChunk
from app.models.file_vault import Collection, FileRecord, Tag
from app.models.habits import Habit
from app.models.learning import Topic
from app.models.mentors import Conversation
from app.models.projects import Project, ProjectTask
from app.models.search import RecentSearch
from app.services.foundation import PageResult

IMPLEMENTED_ENTITY_TYPES = (
    SearchEntityType.FILE,
    SearchEntityType.FILE_CHUNK,
    SearchEntityType.COLLECTION,
    SearchEntityType.TAG,
    SearchEntityType.AI_CONVERSATION,
    SearchEntityType.HABIT,
    SearchEntityType.LEARNING_TOPIC,
    SearchEntityType.PROJECT,
    SearchEntityType.TASK,
)
MAX_SNIPPET_LENGTH = 180


@dataclass(frozen=True)
class SearchResultSource:
    file_id: UUID | None = None
    chunk_id: UUID | None = None
    page_number: int | None = None
    section_label: str | None = None


@dataclass(frozen=True)
class SearchResultItem:
    id: str
    entity_type: SearchEntityType
    entity_id: UUID
    title: str
    snippet: str
    match_reason: SearchMatchReason
    score: float
    open_url: str
    world_location_id: str | None
    source: SearchResultSource | None
    created_at: datetime


class SearchService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def search(
        self,
        user: User,
        *,
        query_text: str,
        pagination: PaginationParams,
        entity_types: list[SearchEntityType] | None = None,
        mode: SearchMode = SearchMode.HYBRID,
        sort: SearchSort = SearchSort.RELEVANCE,
        record_recent: bool = True,
    ) -> PageResult[SearchResultItem]:
        query = _normalize_query(query_text)
        if not query:
            raise AppError(422, "search_query_required", "Search query is required.")

        target_types = _implemented_targets(entity_types)
        fetch_limit = pagination.offset + pagination.limit
        candidates: list[SearchResultItem] = []
        total = 0

        if SearchEntityType.FILE in target_types:
            file_items, file_total = await self._search_files(user, query, fetch_limit)
            candidates.extend(file_items)
            total += file_total
        if SearchEntityType.FILE_CHUNK in target_types:
            chunk_items, chunk_total = await self._search_file_chunks(user, query, fetch_limit)
            candidates.extend(chunk_items)
            total += chunk_total
        if SearchEntityType.COLLECTION in target_types:
            collection_items, collection_total = await self._search_collections(
                user, query, fetch_limit
            )
            candidates.extend(collection_items)
            total += collection_total
        if SearchEntityType.TAG in target_types:
            tag_items, tag_total = await self._search_tags(user, query, fetch_limit)
            candidates.extend(tag_items)
            total += tag_total
        if SearchEntityType.AI_CONVERSATION in target_types:
            conversation_items, conversation_total = await self._search_conversations(
                user, query, fetch_limit
            )
            candidates.extend(conversation_items)
            total += conversation_total
        if SearchEntityType.HABIT in target_types:
            habit_items, habit_total = await self._search_habits(user, query, fetch_limit)
            candidates.extend(habit_items)
            total += habit_total
        if SearchEntityType.LEARNING_TOPIC in target_types:
            topic_items, topic_total = await self._search_learning_topics(user, query, fetch_limit)
            candidates.extend(topic_items)
            total += topic_total
        if SearchEntityType.PROJECT in target_types:
            project_items, project_total = await self._search_projects(user, query, fetch_limit)
            candidates.extend(project_items)
            total += project_total
        if SearchEntityType.TASK in target_types:
            task_items, task_total = await self._search_project_tasks(user, query, fetch_limit)
            candidates.extend(task_items)
            total += task_total

        ordered = _sort_results(candidates, sort)
        items = ordered[pagination.offset : pagination.offset + pagination.limit]

        if record_recent:
            await self.record_recent_search(
                user,
                query_text=query,
                entity_types=list(target_types),
                filters={"mode": mode.value, "sort": sort.value},
                result_count=total,
            )

        return PageResult(
            items=items, total=total, limit=pagination.limit, offset=pagination.offset
        )

    async def list_recent_searches(
        self,
        user: User,
        pagination: PaginationParams,
    ) -> PageResult[RecentSearch]:
        total = await self._count(
            select(func.count(RecentSearch.id)).where(RecentSearch.owner_user_id == user.id)
        )
        result = await self.db.execute(
            select(RecentSearch)
            .where(RecentSearch.owner_user_id == user.id)
            .order_by(RecentSearch.created_at.desc(), RecentSearch.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def record_recent_search(
        self,
        user: User,
        *,
        query_text: str,
        entity_types: list[SearchEntityType],
        filters: dict[str, Any],
        result_count: int,
    ) -> RecentSearch:
        search = RecentSearch(
            owner_user_id=user.id,
            query_text=query_text[:240],
            normalized_query=_normalize_query(query_text)[:240],
            entity_types=[entity_type.value for entity_type in entity_types],
            filters_json=filters,
            result_count=result_count,
        )
        self.db.add(search)
        await self.db.flush()
        return search

    async def _search_files(
        self,
        user: User,
        query: str,
        limit: int,
    ) -> tuple[list[SearchResultItem], int]:
        predicates = [
            FileRecord.owner_user_id == user.id,
            FileRecord.deletion_status == FileDeletionStatus.ACTIVE.value,
        ]
        if self._is_postgres:
            vector = func.to_tsvector(
                "english",
                func.concat(
                    func.coalesce(FileRecord.display_name, ""),
                    " ",
                    func.coalesce(FileRecord.original_file_name, ""),
                    " ",
                    func.coalesce(FileRecord.file_kind, ""),
                ),
            )
            ts_query = func.plainto_tsquery("english", query)
            predicates.append(vector.op("@@")(ts_query))
            score_expression = func.ts_rank_cd(vector, ts_query).label("score")
            result = await self.db.execute(
                select(FileRecord, score_expression)
                .where(*predicates)
                .order_by(score_expression.desc(), FileRecord.updated_at.desc())
                .limit(limit)
            )
            rows = result.all()
            items = [
                self._file_result(file, query=query, score=float(score or 0.0))
                for file, score in rows
            ]
        else:
            predicates.append(
                or_(
                    _contains(FileRecord.display_name, query),
                    _contains(FileRecord.original_file_name, query),
                    _contains(FileRecord.file_kind, query),
                )
            )
            result = await self.db.execute(
                select(FileRecord)
                .where(*predicates)
                .order_by(FileRecord.updated_at.desc())
                .limit(limit)
            )
            items = [
                self._file_result(
                    file, query=query, score=_metadata_score(file.display_name, query)
                )
                for file in result.scalars().all()
            ]
        total = await self._count(select(func.count(FileRecord.id)).where(*predicates))
        return items, total

    async def _search_file_chunks(
        self,
        user: User,
        query: str,
        limit: int,
    ) -> tuple[list[SearchResultItem], int]:
        predicates = [
            FileChunk.owner_user_id == user.id,
            FileChunk.status == ChunkStatus.READY.value,
            FileRecord.id == FileChunk.file_id,
            FileRecord.deletion_status == FileDeletionStatus.ACTIVE.value,
        ]
        if self._is_postgres:
            vector = func.to_tsvector("english", func.coalesce(FileChunk.search_text, ""))
            ts_query = func.plainto_tsquery("english", query)
            predicates.append(vector.op("@@")(ts_query))
            score_expression = func.ts_rank_cd(vector, ts_query).label("score")
            result = await self.db.execute(
                select(FileChunk, FileRecord, score_expression)
                .where(*predicates)
                .order_by(score_expression.desc(), FileChunk.sequence_number.asc())
                .limit(limit)
            )
            rows = result.all()
            items = [
                self._chunk_result(chunk, file, query=query, score=float(score or 0.0))
                for chunk, file, score in rows
            ]
        else:
            predicates.append(
                or_(_contains(FileChunk.search_text, query), _contains(FileChunk.chunk_text, query))
            )
            result = await self.db.execute(
                select(FileChunk, FileRecord)
                .where(*predicates)
                .order_by(FileChunk.sequence_number.asc())
                .limit(limit)
            )
            rows = result.all()
            items = [
                self._chunk_result(
                    chunk, file, query=query, score=_metadata_score(chunk.search_text, query)
                )
                for chunk, file in rows
            ]
        total = await self._count(
            select(func.count(FileChunk.id)).select_from(FileChunk, FileRecord).where(*predicates)
        )
        return items, total

    async def _search_collections(
        self,
        user: User,
        query: str,
        limit: int,
    ) -> tuple[list[SearchResultItem], int]:
        predicates = [Collection.owner_user_id == user.id]
        if self._is_postgres:
            vector = func.to_tsvector(
                "english",
                func.concat(
                    func.coalesce(Collection.name, ""),
                    " ",
                    func.coalesce(Collection.description, ""),
                ),
            )
            ts_query = func.plainto_tsquery("english", query)
            predicates.append(vector.op("@@")(ts_query))
            score_expression = func.ts_rank_cd(vector, ts_query).label("score")
            result = await self.db.execute(
                select(Collection, score_expression)
                .where(*predicates)
                .order_by(score_expression.desc(), Collection.updated_at.desc())
                .limit(limit)
            )
            rows = result.all()
            items = [
                self._collection_result(collection, query=query, score=float(score or 0.0))
                for collection, score in rows
            ]
        else:
            predicates.append(
                or_(_contains(Collection.name, query), _contains(Collection.description, query))
            )
            result = await self.db.execute(
                select(Collection)
                .where(*predicates)
                .order_by(Collection.updated_at.desc())
                .limit(limit)
            )
            items = [
                self._collection_result(
                    collection,
                    query=query,
                    score=_metadata_score(collection.name, query),
                )
                for collection in result.scalars().all()
            ]
        total = await self._count(select(func.count(Collection.id)).where(*predicates))
        return items, total

    async def _search_tags(
        self,
        user: User,
        query: str,
        limit: int,
    ) -> tuple[list[SearchResultItem], int]:
        predicates = [Tag.owner_user_id == user.id]
        if self._is_postgres:
            vector = func.to_tsvector("english", func.coalesce(Tag.name, ""))
            ts_query = func.plainto_tsquery("english", query)
            predicates.append(vector.op("@@")(ts_query))
            score_expression = func.ts_rank_cd(vector, ts_query).label("score")
            result = await self.db.execute(
                select(Tag, score_expression)
                .where(*predicates)
                .order_by(score_expression.desc(), Tag.updated_at.desc())
                .limit(limit)
            )
            rows = result.all()
            items = [
                self._tag_result(tag, query=query, score=float(score or 0.0)) for tag, score in rows
            ]
        else:
            predicates.append(_contains(Tag.name, query))
            result = await self.db.execute(
                select(Tag).where(*predicates).order_by(Tag.updated_at.desc()).limit(limit)
            )
            items = [
                self._tag_result(tag, query=query, score=_metadata_score(tag.name, query))
                for tag in result.scalars().all()
            ]
        total = await self._count(select(func.count(Tag.id)).where(*predicates))
        return items, total

    async def _search_conversations(
        self,
        user: User,
        query: str,
        limit: int,
    ) -> tuple[list[SearchResultItem], int]:
        predicates = [
            Conversation.owner_user_id == user.id,
            Conversation.status != ConversationStatus.DELETED.value,
        ]
        if self._is_postgres:
            vector = func.to_tsvector("english", func.coalesce(Conversation.title, ""))
            ts_query = func.plainto_tsquery("english", query)
            predicates.append(vector.op("@@")(ts_query))
            score_expression = func.ts_rank_cd(vector, ts_query).label("score")
            result = await self.db.execute(
                select(Conversation, score_expression)
                .where(*predicates)
                .order_by(score_expression.desc(), Conversation.updated_at.desc())
                .limit(limit)
            )
            rows = result.all()
            items = [
                self._conversation_result(
                    conversation,
                    query=query,
                    score=float(score or 0.0),
                )
                for conversation, score in rows
            ]
        else:
            predicates.append(_contains(Conversation.title, query))
            result = await self.db.execute(
                select(Conversation)
                .where(*predicates)
                .order_by(Conversation.updated_at.desc())
                .limit(limit)
            )
            items = [
                self._conversation_result(
                    conversation,
                    query=query,
                    score=_metadata_score(conversation.title, query),
                )
                for conversation in result.scalars().all()
            ]
        total = await self._count(select(func.count(Conversation.id)).where(*predicates))
        return items, total

    async def _search_habits(
        self,
        user: User,
        query: str,
        limit: int,
    ) -> tuple[list[SearchResultItem], int]:
        predicates = [
            Habit.owner_user_id == user.id,
            Habit.status == HabitStatus.ACTIVE.value,
        ]
        if self._is_postgres:
            vector = func.to_tsvector(
                "english",
                func.concat(
                    func.coalesce(Habit.name, ""),
                    " ",
                    func.coalesce(Habit.description, ""),
                    " ",
                    func.coalesce(Habit.value_type, ""),
                ),
            )
            ts_query = func.plainto_tsquery("english", query)
            predicates.append(vector.op("@@")(ts_query))
            score_expression = func.ts_rank_cd(vector, ts_query).label("score")
            result = await self.db.execute(
                select(Habit, score_expression)
                .where(*predicates)
                .order_by(score_expression.desc(), Habit.updated_at.desc())
                .limit(limit)
            )
            rows = result.all()
            items = [
                self._habit_result(habit, query=query, score=float(score or 0.0))
                for habit, score in rows
            ]
        else:
            predicates.append(
                or_(_contains(Habit.name, query), _contains(Habit.description, query))
            )
            result = await self.db.execute(
                select(Habit).where(*predicates).order_by(Habit.updated_at.desc()).limit(limit)
            )
            items = [
                self._habit_result(
                    habit,
                    query=query,
                    score=_metadata_score(habit.name, query),
                )
                for habit in result.scalars().all()
            ]
        total = await self._count(select(func.count(Habit.id)).where(*predicates))
        return items, total

    async def _search_learning_topics(
        self,
        user: User,
        query: str,
        limit: int,
    ) -> tuple[list[SearchResultItem], int]:
        predicates = [
            Topic.owner_user_id == user.id,
            Topic.status == LearningRecordStatus.ACTIVE.value,
        ]
        if self._is_postgres:
            vector = func.to_tsvector(
                "english",
                func.concat(
                    func.coalesce(Topic.name, ""),
                    " ",
                    func.coalesce(Topic.description, ""),
                ),
            )
            ts_query = func.plainto_tsquery("english", query)
            predicates.append(vector.op("@@")(ts_query))
            score_expression = func.ts_rank_cd(vector, ts_query).label("score")
            result = await self.db.execute(
                select(Topic, score_expression)
                .where(*predicates)
                .order_by(score_expression.desc(), Topic.updated_at.desc())
                .limit(limit)
            )
            rows = result.all()
            items = [
                self._learning_topic_result(topic, query=query, score=float(score or 0.0))
                for topic, score in rows
            ]
        else:
            predicates.append(
                or_(_contains(Topic.name, query), _contains(Topic.description, query))
            )
            result = await self.db.execute(
                select(Topic).where(*predicates).order_by(Topic.updated_at.desc()).limit(limit)
            )
            items = [
                self._learning_topic_result(
                    topic,
                    query=query,
                    score=_metadata_score(topic.name, query),
                )
                for topic in result.scalars().all()
            ]
        total = await self._count(select(func.count(Topic.id)).where(*predicates))
        return items, total

    async def _search_projects(
        self,
        user: User,
        query: str,
        limit: int,
    ) -> tuple[list[SearchResultItem], int]:
        predicates = [
            Project.owner_user_id == user.id,
            Project.status != ProjectStatus.ARCHIVED.value,
        ]
        if self._is_postgres:
            vector = func.to_tsvector(
                "english",
                func.concat(
                    func.coalesce(Project.name, ""),
                    " ",
                    func.coalesce(Project.objective, ""),
                    " ",
                    func.coalesce(Project.description, ""),
                    " ",
                    func.coalesce(Project.repository_url, ""),
                ),
            )
            ts_query = func.plainto_tsquery("english", query)
            predicates.append(vector.op("@@")(ts_query))
            score_expression = func.ts_rank_cd(vector, ts_query).label("score")
            result = await self.db.execute(
                select(Project, score_expression)
                .where(*predicates)
                .order_by(score_expression.desc(), Project.updated_at.desc())
                .limit(limit)
            )
            rows = result.all()
            items = [
                self._project_result(project, query=query, score=float(score or 0.0))
                for project, score in rows
            ]
        else:
            predicates.append(
                or_(
                    _contains(Project.name, query),
                    _contains(Project.objective, query),
                    _contains(Project.description, query),
                    _contains(Project.repository_url, query),
                )
            )
            result = await self.db.execute(
                select(Project).where(*predicates).order_by(Project.updated_at.desc()).limit(limit)
            )
            items = [
                self._project_result(
                    project,
                    query=query,
                    score=_metadata_score(project.name, query),
                )
                for project in result.scalars().all()
            ]
        total = await self._count(select(func.count(Project.id)).where(*predicates))
        return items, total

    async def _search_project_tasks(
        self,
        user: User,
        query: str,
        limit: int,
    ) -> tuple[list[SearchResultItem], int]:
        predicates = [
            ProjectTask.owner_user_id == user.id,
            Project.id == ProjectTask.project_id,
            Project.owner_user_id == user.id,
            Project.status != ProjectStatus.ARCHIVED.value,
        ]
        if self._is_postgres:
            vector = func.to_tsvector(
                "english",
                func.concat(
                    func.coalesce(ProjectTask.title, ""),
                    " ",
                    func.coalesce(ProjectTask.description, ""),
                ),
            )
            ts_query = func.plainto_tsquery("english", query)
            predicates.append(vector.op("@@")(ts_query))
            score_expression = func.ts_rank_cd(vector, ts_query).label("score")
            result = await self.db.execute(
                select(ProjectTask, Project, score_expression)
                .where(*predicates)
                .order_by(score_expression.desc(), ProjectTask.updated_at.desc())
                .limit(limit)
            )
            rows = result.all()
            items = [
                self._project_task_result(task, project, query=query, score=float(score or 0.0))
                for task, project, score in rows
            ]
        else:
            predicates.append(
                or_(_contains(ProjectTask.title, query), _contains(ProjectTask.description, query))
            )
            result = await self.db.execute(
                select(ProjectTask, Project)
                .where(*predicates)
                .order_by(ProjectTask.updated_at.desc())
                .limit(limit)
            )
            rows = result.all()
            items = [
                self._project_task_result(
                    task,
                    project,
                    query=query,
                    score=_metadata_score(task.title, query),
                )
                for task, project in rows
            ]
        total = await self._count(
            select(func.count(ProjectTask.id)).select_from(ProjectTask, Project).where(*predicates)
        )
        return items, total

    def _file_result(self, file: FileRecord, *, query: str, score: float) -> SearchResultItem:
        return SearchResultItem(
            id=f"file:{file.id}",
            entity_type=SearchEntityType.FILE,
            entity_id=file.id,
            title=file.display_name,
            snippet=_snippet(
                f"{file.original_file_name} {file.file_kind} {file.content_type}", query
            ),
            match_reason=SearchMatchReason.FILE_METADATA,
            score=max(score, _metadata_score(file.display_name, query)),
            open_url=f"/app/library?file={file.id}",
            world_location_id="library",
            source=SearchResultSource(file_id=file.id),
            created_at=file.created_at,
        )

    def _chunk_result(
        self,
        chunk: FileChunk,
        file: FileRecord,
        *,
        query: str,
        score: float,
    ) -> SearchResultItem:
        return SearchResultItem(
            id=f"file_chunk:{chunk.id}",
            entity_type=SearchEntityType.FILE_CHUNK,
            entity_id=chunk.id,
            title=f"{file.display_name} content",
            snippet=_snippet(chunk.chunk_text, query),
            match_reason=SearchMatchReason.FILE_CONTENT,
            score=max(score, _metadata_score(chunk.search_text, query)),
            open_url=f"/app/library?file={file.id}&chunk={chunk.id}",
            world_location_id="library",
            source=SearchResultSource(
                file_id=file.id,
                chunk_id=chunk.id,
                page_number=chunk.page_number,
                section_label=chunk.section_label,
            ),
            created_at=chunk.created_at,
        )

    def _collection_result(
        self,
        collection: Collection,
        *,
        query: str,
        score: float,
    ) -> SearchResultItem:
        return SearchResultItem(
            id=f"collection:{collection.id}",
            entity_type=SearchEntityType.COLLECTION,
            entity_id=collection.id,
            title=collection.name,
            snippet=_snippet(collection.description or "Collection", query),
            match_reason=SearchMatchReason.COLLECTION_METADATA,
            score=max(score, _metadata_score(collection.name, query)),
            open_url=f"/app/library?collection={collection.id}",
            world_location_id="library",
            source=None,
            created_at=collection.created_at,
        )

    def _tag_result(self, tag: Tag, *, query: str, score: float) -> SearchResultItem:
        return SearchResultItem(
            id=f"tag:{tag.id}",
            entity_type=SearchEntityType.TAG,
            entity_id=tag.id,
            title=tag.name,
            snippet="Tag",
            match_reason=SearchMatchReason.TAG_METADATA,
            score=max(score, _metadata_score(tag.name, query)),
            open_url=f"/app/library?tag={tag.id}",
            world_location_id="library",
            source=None,
            created_at=tag.created_at,
        )

    def _conversation_result(
        self,
        conversation: Conversation,
        *,
        query: str,
        score: float,
    ) -> SearchResultItem:
        return SearchResultItem(
            id=f"ai_conversation:{conversation.id}",
            entity_type=SearchEntityType.AI_CONVERSATION,
            entity_id=conversation.id,
            title=conversation.title,
            snippet=_snippet(f"AI conversation: {conversation.title}", query),
            match_reason=SearchMatchReason.AI_CONVERSATION,
            score=max(score, _metadata_score(conversation.title, query)),
            open_url=f"/app/ai?conversation={conversation.id}",
            world_location_id=WorldLocationId.AI_HALL.value,
            source=None,
            created_at=conversation.created_at,
        )

    def _habit_result(self, habit: Habit, *, query: str, score: float) -> SearchResultItem:
        return SearchResultItem(
            id=f"habit:{habit.id}",
            entity_type=SearchEntityType.HABIT,
            entity_id=habit.id,
            title=habit.name,
            snippet=_snippet(habit.description or f"{habit.value_type.title()} habit", query),
            match_reason=SearchMatchReason.HABIT_METADATA,
            score=max(score, _metadata_score(habit.name, query)),
            open_url=f"/app/habits?habit={habit.id}",
            world_location_id=WorldLocationId.HABIT_GARDEN.value,
            source=None,
            created_at=habit.created_at,
        )

    def _learning_topic_result(
        self,
        topic: Topic,
        *,
        query: str,
        score: float,
    ) -> SearchResultItem:
        return SearchResultItem(
            id=f"learning_topic:{topic.id}",
            entity_type=SearchEntityType.LEARNING_TOPIC,
            entity_id=topic.id,
            title=topic.name,
            snippet=_snippet(topic.description or "Learning topic", query),
            match_reason=SearchMatchReason.LEARNING_TOPIC_METADATA,
            score=max(score, _metadata_score(topic.name, query)),
            open_url=f"/app/learning?topic={topic.id}",
            world_location_id=WorldLocationId.RESEARCH_LABORATORY.value,
            source=None,
            created_at=topic.created_at,
        )

    def _project_result(self, project: Project, *, query: str, score: float) -> SearchResultItem:
        return SearchResultItem(
            id=f"project:{project.id}",
            entity_type=SearchEntityType.PROJECT,
            entity_id=project.id,
            title=project.name,
            snippet=_snippet(project.objective or project.description or "Project", query),
            match_reason=SearchMatchReason.PROJECT_METADATA,
            score=max(score, _metadata_score(project.name, query)),
            open_url=f"/app/projects?project={project.id}",
            world_location_id=WorldLocationId.PROJECT_WORKSHOP.value,
            source=None,
            created_at=project.created_at,
        )

    def _project_task_result(
        self,
        task: ProjectTask,
        project: Project,
        *,
        query: str,
        score: float,
    ) -> SearchResultItem:
        return SearchResultItem(
            id=f"task:{task.id}",
            entity_type=SearchEntityType.TASK,
            entity_id=task.id,
            title=task.title,
            snippet=_snippet(task.description or f"Task in {project.name}", query),
            match_reason=SearchMatchReason.PROJECT_TASK_METADATA,
            score=max(score, _metadata_score(task.title, query)),
            open_url=f"/app/projects?project={project.id}&task={task.id}",
            world_location_id=WorldLocationId.PROJECT_WORKSHOP.value,
            source=None,
            created_at=task.created_at,
        )

    @property
    def _is_postgres(self) -> bool:
        return self.db.get_bind().dialect.name == "postgresql"

    async def _count(self, query: Select[tuple[int]]) -> int:
        value = await self.db.scalar(query)
        return int(value or 0)


def _normalize_query(query_text: str) -> str:
    return " ".join(query_text.strip().casefold().split())


def _implemented_targets(
    requested: list[SearchEntityType] | None,
) -> tuple[SearchEntityType, ...]:
    if requested is None or len(requested) == 0:
        return IMPLEMENTED_ENTITY_TYPES
    return tuple(
        entity_type for entity_type in requested if entity_type in IMPLEMENTED_ENTITY_TYPES
    )


def _contains(column: Any, query: str) -> Any:
    return func.lower(func.coalesce(column, "")).like(f"%{query.casefold()}%")


def _metadata_score(text: str | None, query: str) -> float:
    normalized_text = _normalize_query(text or "")
    if not normalized_text:
        return 0.0
    if normalized_text == query:
        return 1.0
    if normalized_text.startswith(query):
        return 0.85
    if query in normalized_text:
        return 0.65
    return 0.1


def _snippet(text: str, query: str) -> str:
    compact = " ".join(text.split())
    if len(compact) <= MAX_SNIPPET_LENGTH:
        return compact
    index = compact.casefold().find(query.casefold())
    if index == -1:
        return f"{compact[:MAX_SNIPPET_LENGTH].rstrip()}..."
    start = max(0, index - 60)
    end = min(len(compact), index + len(query) + 100)
    prefix = "..." if start > 0 else ""
    suffix = "..." if end < len(compact) else ""
    return f"{prefix}{compact[start:end].strip()}{suffix}"


def _sort_results(
    results: list[SearchResultItem],
    sort: SearchSort,
) -> list[SearchResultItem]:
    if sort == SearchSort.RECENT:
        return sorted(results, key=lambda item: (item.created_at, item.score), reverse=True)
    return sorted(results, key=lambda item: (item.score, item.created_at), reverse=True)
