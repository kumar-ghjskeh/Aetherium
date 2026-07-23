from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import PaginationParams
from app.domain.ai import AIUsageStatus
from app.domain.file_vault import FileDeletionStatus
from app.domain.foundation import NotificationSeverity, NotificationType
from app.domain.habits import HabitScheduleType, HabitStatus
from app.domain.learning import FlashcardStatus, LessonStatus
from app.domain.notifications import (
    NotificationReviewPeriod,
    NotificationWorkflowStatus,
    NotificationWorkflowType,
)
from app.domain.projects import ProjectMilestoneStatus, ProjectStatus, ProjectTaskStatus
from app.models.ai import AIUsageRecord
from app.models.auth import User
from app.models.file_ingestion import ProcessingFailure
from app.models.file_vault import FileRecord
from app.models.habits import Habit, HabitLog, HabitSchedule
from app.models.learning import Flashcard, FlashcardReview, Lesson, StudySession
from app.models.notifications import (
    MonthlyReview,
    NotificationPreferences,
    NotificationWorkflowRecord,
)
from app.models.projects import Project, ProjectMilestone, ProjectTask
from app.services.foundation import PageResult, UserDataService

DEFAULT_DEADLINE_WINDOW_DAYS = 7
MAX_WORKFLOW_ITEMS_PER_KIND = 10


@dataclass(frozen=True)
class WorkflowCandidate:
    workflow_type: NotificationWorkflowType
    source_key: str
    title: str
    body: str
    notification_type: NotificationType
    severity: NotificationSeverity
    action_url: str
    scheduled_for: datetime
    metadata: dict[str, object]


@dataclass(frozen=True)
class WorkflowRunResult:
    generated_count: int
    existing_count: int
    records: list[NotificationWorkflowRecord]


class NotificationWorkflowService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_data = UserDataService(db)

    async def get_or_create_preferences(self, user: User) -> NotificationPreferences:
        result = await self.db.execute(
            select(NotificationPreferences).where(NotificationPreferences.owner_user_id == user.id)
        )
        preferences = result.scalar_one_or_none()
        if preferences is not None:
            return preferences

        preferences = NotificationPreferences(owner_user_id=user.id)
        self.db.add(preferences)
        await self.db.flush()
        return preferences

    async def update_preferences(
        self, user: User, updates: dict[str, object]
    ) -> NotificationPreferences:
        preferences = await self.get_or_create_preferences(user)
        for field_name, value in updates.items():
            setattr(preferences, field_name, value)
        preferences.updated_at = datetime.now(UTC)
        await self.user_data.record_audit_log(
            user,
            action="notification.preferences_updated",
            entity_type="notification_preferences",
            entity_id=preferences.id,
            metadata={"updatedFields": sorted(updates.keys())},
        )
        await self.db.flush()
        return preferences

    async def list_workflow_records(
        self,
        user: User,
        pagination: PaginationParams,
        workflow_type: NotificationWorkflowType | None = None,
    ) -> PageResult[NotificationWorkflowRecord]:
        predicates = [NotificationWorkflowRecord.owner_user_id == user.id]
        if workflow_type is not None:
            predicates.append(NotificationWorkflowRecord.workflow_type == workflow_type.value)

        total = await self._count(
            select(func.count(NotificationWorkflowRecord.id)).where(*predicates)
        )
        result = await self.db.execute(
            select(NotificationWorkflowRecord)
            .where(*predicates)
            .order_by(
                NotificationWorkflowRecord.created_at.desc(),
                NotificationWorkflowRecord.id.desc(),
            )
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def list_monthly_reviews(
        self, user: User, pagination: PaginationParams
    ) -> PageResult[MonthlyReview]:
        total = await self._count(
            select(func.count(MonthlyReview.id)).where(MonthlyReview.owner_user_id == user.id)
        )
        result = await self.db.execute(
            select(MonthlyReview)
            .where(MonthlyReview.owner_user_id == user.id)
            .order_by(MonthlyReview.month_start.desc(), MonthlyReview.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def upsert_monthly_review(
        self,
        user: User,
        *,
        month_start: date,
        wins: str | None,
        challenges: str | None,
        next_steps: str | None,
    ) -> MonthlyReview:
        result = await self.db.execute(
            select(MonthlyReview).where(
                MonthlyReview.owner_user_id == user.id,
                MonthlyReview.month_start == month_start,
            )
        )
        review = result.scalar_one_or_none()
        metadata = await self._review_metadata(user, month_start, _month_end(month_start))
        if review is None:
            review = MonthlyReview(
                owner_user_id=user.id,
                month_start=month_start,
                wins=wins,
                challenges=challenges,
                next_steps=next_steps,
                period=NotificationReviewPeriod.MONTH.value,
                metadata_json=metadata,
            )
            self.db.add(review)
        else:
            review.wins = wins
            review.challenges = challenges
            review.next_steps = next_steps
            review.metadata_json = metadata
            review.updated_at = datetime.now(UTC)

        await self.user_data.record_audit_log(
            user,
            action="review.monthly_saved",
            entity_type="monthly_review",
            entity_id=review.id,
            metadata={"monthStart": month_start.isoformat()},
        )
        await self.db.flush()
        return review

    async def run_due_workflows(
        self,
        user: User,
        *,
        reference_date: date | None = None,
        now: datetime | None = None,
    ) -> WorkflowRunResult:
        preferences = await self.get_or_create_preferences(user)
        resolved_now = _ensure_aware_utc(now or datetime.now(UTC))
        today = reference_date or resolved_now.date()
        if not preferences.in_app_enabled:
            return WorkflowRunResult(generated_count=0, existing_count=0, records=[])

        candidates: list[WorkflowCandidate] = []
        if preferences.weekly_review_enabled:
            candidates.append(
                await self._weekly_review_candidate(user, today, preferences.reminder_hour)
            )
        if preferences.monthly_review_enabled:
            candidates.append(
                await self._monthly_review_candidate(user, today, preferences.reminder_hour)
            )
        if preferences.learning_reminders_enabled:
            candidates.extend(await self._learning_review_candidates(user, resolved_now))
        if preferences.habit_reminders_enabled:
            candidates.extend(await self._habit_reminder_candidates(user, today, resolved_now))
        if preferences.processing_failure_enabled:
            candidates.extend(await self._processing_failure_candidates(user, resolved_now))
        if preferences.ai_provider_failure_enabled:
            candidates.extend(await self._ai_failure_candidates(user, resolved_now))
        if preferences.project_deadline_enabled:
            candidates.extend(await self._project_deadline_candidates(user, today, resolved_now))

        generated_count = 0
        existing_count = 0
        records: list[NotificationWorkflowRecord] = []
        for candidate in candidates:
            record, created = await self._create_workflow_record(user, candidate, resolved_now)
            records.append(record)
            if created:
                generated_count += 1
            else:
                existing_count += 1

        await self.user_data.record_audit_log(
            user,
            action="notification.workflows_run",
            entity_type="notification_workflow",
            metadata={
                "existingCount": existing_count,
                "generatedCount": generated_count,
                "referenceDate": today.isoformat(),
            },
        )
        await self.db.flush()
        return WorkflowRunResult(
            generated_count=generated_count,
            existing_count=existing_count,
            records=records,
        )

    async def _create_workflow_record(
        self,
        user: User,
        candidate: WorkflowCandidate,
        now: datetime,
    ) -> tuple[NotificationWorkflowRecord, bool]:
        existing = await self._get_workflow_record(
            user,
            candidate.workflow_type,
            candidate.source_key,
        )
        if existing is not None:
            return existing, False

        notification = await self.user_data.create_notification(
            user,
            title=candidate.title,
            body=candidate.body,
            notification_type=candidate.notification_type,
            severity=candidate.severity,
            action_url=candidate.action_url,
        )
        record = NotificationWorkflowRecord(
            owner_user_id=user.id,
            workflow_type=candidate.workflow_type.value,
            source_key=candidate.source_key,
            status=NotificationWorkflowStatus.GENERATED.value,
            notification_id=notification.id,
            scheduled_for=candidate.scheduled_for,
            generated_at=now,
            metadata_json=candidate.metadata,
        )
        self.db.add(record)
        await self.db.flush()
        return record, True

    async def _get_workflow_record(
        self,
        user: User,
        workflow_type: NotificationWorkflowType,
        source_key: str,
    ) -> NotificationWorkflowRecord | None:
        result = await self.db.execute(
            select(NotificationWorkflowRecord).where(
                NotificationWorkflowRecord.owner_user_id == user.id,
                NotificationWorkflowRecord.workflow_type == workflow_type.value,
                NotificationWorkflowRecord.source_key == source_key,
            )
        )
        return result.scalar_one_or_none()

    async def _weekly_review_candidate(
        self, user: User, today: date, reminder_hour: int
    ) -> WorkflowCandidate:
        week_start = _week_start(today) - timedelta(days=7)
        week_end = week_start + timedelta(days=6)
        metadata = await self._review_metadata(user, week_start, week_end)
        return WorkflowCandidate(
            workflow_type=NotificationWorkflowType.WEEKLY_REVIEW,
            source_key=f"weekly_review:{week_start.isoformat()}",
            title="Weekly review ready",
            body=f"Review the week from {week_start.isoformat()} to {week_end.isoformat()}.",
            notification_type=NotificationType.REVIEW,
            severity=NotificationSeverity.INFO,
            action_url="/app/habits",
            scheduled_for=_scheduled_datetime(today, reminder_hour),
            metadata=metadata,
        )

    async def _monthly_review_candidate(
        self, user: User, today: date, reminder_hour: int
    ) -> WorkflowCandidate:
        month_start = _previous_month_start(today)
        month_end = _month_end(month_start)
        metadata = await self._review_metadata(user, month_start, month_end)
        return WorkflowCandidate(
            workflow_type=NotificationWorkflowType.MONTHLY_REVIEW,
            source_key=f"monthly_review:{month_start.isoformat()}",
            title="Monthly review ready",
            body=f"Reflect on progress from {month_start.isoformat()} to {month_end.isoformat()}.",
            notification_type=NotificationType.REVIEW,
            severity=NotificationSeverity.INFO,
            action_url="/app/settings",
            scheduled_for=_scheduled_datetime(today, reminder_hour),
            metadata=metadata,
        )

    async def _learning_review_candidates(
        self, user: User, now: datetime
    ) -> list[WorkflowCandidate]:
        result = await self.db.execute(
            select(FlashcardReview, Flashcard)
            .join(Flashcard, Flashcard.id == FlashcardReview.flashcard_id)
            .where(
                FlashcardReview.owner_user_id == user.id,
                Flashcard.owner_user_id == user.id,
                Flashcard.status == FlashcardStatus.ACTIVE.value,
                FlashcardReview.next_review_at.is_not(None),
                FlashcardReview.next_review_at <= now,
            )
            .order_by(FlashcardReview.next_review_at.asc(), FlashcardReview.id.asc())
            .limit(MAX_WORKFLOW_ITEMS_PER_KIND)
        )
        candidates: list[WorkflowCandidate] = []
        for review, flashcard in result.all():
            due_at = _ensure_aware_utc(review.next_review_at or now)
            candidates.append(
                WorkflowCandidate(
                    workflow_type=NotificationWorkflowType.LEARNING_REVIEW,
                    source_key=f"learning_review:{review.id}",
                    title="Learning review due",
                    body="A flashcard is ready for spaced review.",
                    notification_type=NotificationType.REVIEW,
                    severity=NotificationSeverity.INFO,
                    action_url="/app/learning",
                    scheduled_for=due_at,
                    metadata={
                        "flashcardId": str(flashcard.id),
                        "reviewId": str(review.id),
                        "topicId": str(flashcard.topic_id) if flashcard.topic_id else None,
                    },
                )
            )
        return candidates

    async def _habit_reminder_candidates(
        self, user: User, today: date, now: datetime
    ) -> list[WorkflowCandidate]:
        result = await self.db.execute(
            select(Habit, HabitSchedule)
            .join(HabitSchedule, HabitSchedule.habit_id == Habit.id)
            .where(
                Habit.owner_user_id == user.id,
                HabitSchedule.owner_user_id == user.id,
                Habit.status == HabitStatus.ACTIVE.value,
            )
            .order_by(Habit.created_at.asc(), Habit.id.asc())
            .limit(MAX_WORKFLOW_ITEMS_PER_KIND)
        )
        candidates: list[WorkflowCandidate] = []
        for habit, schedule in result.all():
            if not await self._habit_is_due_without_log(user, habit, schedule, today):
                continue
            candidates.append(
                WorkflowCandidate(
                    workflow_type=NotificationWorkflowType.HABIT_REMINDER,
                    source_key=f"habit_reminder:{habit.id}:{today.isoformat()}",
                    title=f"Habit check-in: {habit.name}",
                    body="Log this habit when it is complete. Missed days do not erase progress.",
                    notification_type=NotificationType.REVIEW,
                    severity=NotificationSeverity.INFO,
                    action_url="/app/habits",
                    scheduled_for=now,
                    metadata={"habitId": str(habit.id), "targetDate": today.isoformat()},
                )
            )
        return candidates

    async def _habit_is_due_without_log(
        self,
        user: User,
        habit: Habit,
        schedule: HabitSchedule,
        today: date,
    ) -> bool:
        if schedule.starts_on > today:
            return False
        if schedule.schedule_type == HabitScheduleType.DAILY.value:
            return not await self._habit_logged_on(user, habit.id, today)
        if schedule.schedule_type == HabitScheduleType.SELECTED_WEEKDAYS.value:
            return today.weekday() in schedule.weekdays and not await self._habit_logged_on(
                user, habit.id, today
            )
        if schedule.schedule_type == HabitScheduleType.WEEKLY_TARGET.value:
            week_start = _week_start(today)
            week_end = week_start + timedelta(days=6)
            total = await self._count(
                select(func.count(HabitLog.id)).where(
                    HabitLog.owner_user_id == user.id,
                    HabitLog.habit_id == habit.id,
                    HabitLog.log_date >= week_start,
                    HabitLog.log_date <= week_end,
                )
            )
            return total < int(schedule.weekly_target or 1)
        return False

    async def _habit_logged_on(self, user: User, habit_id: UUID, target_date: date) -> bool:
        total = await self._count(
            select(func.count(HabitLog.id)).where(
                HabitLog.owner_user_id == user.id,
                HabitLog.habit_id == habit_id,
                HabitLog.log_date == target_date,
            )
        )
        return total > 0

    async def _processing_failure_candidates(
        self, user: User, now: datetime
    ) -> list[WorkflowCandidate]:
        result = await self.db.execute(
            select(ProcessingFailure)
            .where(ProcessingFailure.owner_user_id == user.id)
            .order_by(ProcessingFailure.created_at.desc(), ProcessingFailure.id.desc())
            .limit(MAX_WORKFLOW_ITEMS_PER_KIND)
        )
        return [
            WorkflowCandidate(
                workflow_type=NotificationWorkflowType.PROCESSING_FAILURE,
                source_key=f"processing_failure:{failure.id}",
                title="File processing needs attention",
                body="A vault file failed during ingestion. You can inspect it from Library.",
                notification_type=NotificationType.PROCESSING,
                severity=NotificationSeverity.ERROR,
                action_url="/app/library",
                scheduled_for=now,
                metadata={
                    "errorCode": failure.error_code,
                    "failureId": str(failure.id),
                    "fileId": str(failure.file_id),
                    "retryable": failure.retryable,
                },
            )
            for failure in result.scalars().all()
        ]

    async def _ai_failure_candidates(self, user: User, now: datetime) -> list[WorkflowCandidate]:
        result = await self.db.execute(
            select(AIUsageRecord)
            .where(
                AIUsageRecord.owner_user_id == user.id,
                AIUsageRecord.status.in_(
                    [AIUsageStatus.FAILED.value, AIUsageStatus.RATE_LIMITED.value]
                ),
            )
            .order_by(AIUsageRecord.created_at.desc(), AIUsageRecord.id.desc())
            .limit(MAX_WORKFLOW_ITEMS_PER_KIND)
        )
        return [
            WorkflowCandidate(
                workflow_type=NotificationWorkflowType.AI_PROVIDER_FAILURE,
                source_key=f"ai_provider_failure:{record.id}",
                title="AI provider request failed",
                body=f"{record.feature} reported {record.error_code or record.status}.",
                notification_type=NotificationType.AI,
                severity=NotificationSeverity.WARNING,
                action_url="/app/ai",
                scheduled_for=now,
                metadata={
                    "aiUsageRecordId": str(record.id),
                    "errorCode": record.error_code,
                    "feature": record.feature,
                    "providerName": record.provider_name,
                    "status": record.status,
                },
            )
            for record in result.scalars().all()
        ]

    async def _project_deadline_candidates(
        self, user: User, today: date, now: datetime
    ) -> list[WorkflowCandidate]:
        window_end = today + timedelta(days=DEFAULT_DEADLINE_WINDOW_DAYS)
        candidates: list[WorkflowCandidate] = []
        candidates.extend(await self._project_target_candidates(user, today, window_end, now))
        candidates.extend(await self._project_milestone_candidates(user, today, window_end, now))
        candidates.extend(await self._project_task_candidates(user, today, window_end, now))
        return candidates[:MAX_WORKFLOW_ITEMS_PER_KIND]

    async def _project_target_candidates(
        self, user: User, today: date, window_end: date, now: datetime
    ) -> list[WorkflowCandidate]:
        result = await self.db.execute(
            select(Project)
            .where(
                Project.owner_user_id == user.id,
                Project.status.in_([ProjectStatus.ACTIVE.value, ProjectStatus.PAUSED.value]),
                Project.target_date.is_not(None),
                Project.target_date <= window_end,
            )
            .order_by(Project.target_date.asc(), Project.id.asc())
            .limit(MAX_WORKFLOW_ITEMS_PER_KIND)
        )
        return [
            self._deadline_candidate(
                workflow_source="project",
                entity_id=project.id,
                due_date=project.target_date or today,
                title=f"Project deadline: {project.name}",
                now=now,
            )
            for project in result.scalars().all()
        ]

    async def _project_milestone_candidates(
        self, user: User, today: date, window_end: date, now: datetime
    ) -> list[WorkflowCandidate]:
        result = await self.db.execute(
            select(ProjectMilestone)
            .where(
                ProjectMilestone.owner_user_id == user.id,
                ProjectMilestone.status.in_(
                    [
                        ProjectMilestoneStatus.PLANNED.value,
                        ProjectMilestoneStatus.ACTIVE.value,
                        ProjectMilestoneStatus.BLOCKED.value,
                    ]
                ),
                ProjectMilestone.due_date.is_not(None),
                ProjectMilestone.due_date <= window_end,
            )
            .order_by(ProjectMilestone.due_date.asc(), ProjectMilestone.id.asc())
            .limit(MAX_WORKFLOW_ITEMS_PER_KIND)
        )
        return [
            self._deadline_candidate(
                workflow_source="milestone",
                entity_id=milestone.id,
                due_date=milestone.due_date or today,
                title=f"Milestone deadline: {milestone.title}",
                now=now,
            )
            for milestone in result.scalars().all()
        ]

    async def _project_task_candidates(
        self, user: User, today: date, window_end: date, now: datetime
    ) -> list[WorkflowCandidate]:
        result = await self.db.execute(
            select(ProjectTask)
            .where(
                ProjectTask.owner_user_id == user.id,
                ProjectTask.status.in_(
                    [
                        ProjectTaskStatus.TODO.value,
                        ProjectTaskStatus.IN_PROGRESS.value,
                        ProjectTaskStatus.BLOCKED.value,
                    ]
                ),
                ProjectTask.due_date.is_not(None),
                ProjectTask.due_date <= window_end,
            )
            .order_by(ProjectTask.due_date.asc(), ProjectTask.id.asc())
            .limit(MAX_WORKFLOW_ITEMS_PER_KIND)
        )
        return [
            self._deadline_candidate(
                workflow_source="task",
                entity_id=task.id,
                due_date=task.due_date or today,
                title=f"Task deadline: {task.title}",
                now=now,
            )
            for task in result.scalars().all()
        ]

    def _deadline_candidate(
        self,
        *,
        workflow_source: str,
        entity_id: UUID,
        due_date: date,
        title: str,
        now: datetime,
    ) -> WorkflowCandidate:
        return WorkflowCandidate(
            workflow_type=NotificationWorkflowType.PROJECT_DEADLINE,
            source_key=f"project_deadline:{workflow_source}:{entity_id}:{due_date.isoformat()}",
            title=title,
            body=f"Due on {due_date.isoformat()}. Adjust the plan or mark progress from Projects.",
            notification_type=NotificationType.PROJECT,
            severity=NotificationSeverity.WARNING,
            action_url="/app/projects",
            scheduled_for=now,
            metadata={
                "dueDate": due_date.isoformat(),
                "entityId": str(entity_id),
                "source": workflow_source,
            },
        )

    async def _review_metadata(
        self, user: User, start_date: date, end_date: date
    ) -> dict[str, object]:
        start_at = datetime.combine(start_date, time.min, tzinfo=UTC)
        end_at = datetime.combine(end_date + timedelta(days=1), time.min, tzinfo=UTC)
        habit_logs = await self._count(
            select(func.count(HabitLog.id)).where(
                HabitLog.owner_user_id == user.id,
                HabitLog.log_date >= start_date,
                HabitLog.log_date <= end_date,
            )
        )
        study_sessions = await self._count(
            select(func.count(StudySession.id)).where(
                StudySession.owner_user_id == user.id,
                StudySession.started_at >= start_at,
                StudySession.started_at < end_at,
            )
        )
        completed_lessons = await self._count(
            select(func.count(Lesson.id)).where(
                Lesson.owner_user_id == user.id,
                Lesson.status == LessonStatus.COMPLETED.value,
                Lesson.updated_at >= start_at,
                Lesson.updated_at < end_at,
            )
        )
        processed_files = await self._count(
            select(func.count(FileRecord.id)).where(
                FileRecord.owner_user_id == user.id,
                FileRecord.deletion_status == FileDeletionStatus.ACTIVE.value,
                FileRecord.updated_at >= start_at,
                FileRecord.updated_at < end_at,
            )
        )
        completed_projects = await self._count(
            select(func.count(Project.id)).where(
                Project.owner_user_id == user.id,
                Project.status == ProjectStatus.COMPLETED.value,
                Project.completed_at >= start_at,
                Project.completed_at < end_at,
            )
        )
        return {
            "completedLessons": completed_lessons,
            "completedProjects": completed_projects,
            "habitLogs": habit_logs,
            "processedFiles": processed_files,
            "studySessions": study_sessions,
        }

    async def _count(self, query: Select[tuple[int]]) -> int:
        value = await self.db.scalar(query)
        return int(value or 0)


def _ensure_aware_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value


def _scheduled_datetime(target_date: date, reminder_hour: int) -> datetime:
    return datetime.combine(target_date, time(hour=reminder_hour), tzinfo=UTC)


def _week_start(target_date: date) -> date:
    return target_date - timedelta(days=target_date.weekday())


def _previous_month_start(target_date: date) -> date:
    first_day = target_date.replace(day=1)
    previous_month_end = first_day - timedelta(days=1)
    return previous_month_end.replace(day=1)


def _month_end(month_start: date) -> date:
    next_month = (
        month_start.replace(year=month_start.year + 1, month=1, day=1)
        if month_start.month == 12
        else month_start.replace(month=month_start.month + 1, day=1)
    )
    return next_month - timedelta(days=1)
