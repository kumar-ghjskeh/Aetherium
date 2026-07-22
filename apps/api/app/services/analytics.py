from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.ai import AIUsageStatus
from app.domain.analytics import AnalyticsMetricKey, AnalyticsPeriod
from app.domain.file_vault import FileProcessingStatus
from app.domain.habits import HabitLogStatus
from app.domain.learning import LessonStatus
from app.domain.projects import ProjectStatus, ProjectTaskStatus
from app.models.ai import AIUsageRecord
from app.models.file_vault import FileRecord
from app.models.habits import HabitLog
from app.models.learning import Attempt, Lesson, MasteryRecord, StudySession
from app.models.projects import Project, ProjectTask
from app.schemas.analytics import AnalyticsMetric, AnalyticsSummary, AnalyticsTrendBucket


@dataclass(frozen=True)
class Bucket:
    period_start: date
    period_end: date
    label: str


def _utc_now() -> datetime:
    return datetime.now(UTC)


def _period_start(period: AnalyticsPeriod, today: date) -> date:
    if period == AnalyticsPeriod.WEEK:
        return today - timedelta(days=6)
    if period == AnalyticsPeriod.MONTH:
        return today - timedelta(days=29)
    if period == AnalyticsPeriod.QUARTER:
        return today - timedelta(days=89)
    return date(today.year - 1, today.month, 1) if today.month < 12 else date(today.year, 1, 1)


def _bucket_label(start: date, end: date, period: AnalyticsPeriod) -> str:
    if period == AnalyticsPeriod.YEAR:
        return start.strftime("%b %Y")
    if start == end:
        return start.strftime("%b %d")
    return f"{start.strftime('%b %d')} - {end.strftime('%b %d')}"


def _trend_buckets(period: AnalyticsPeriod, period_start: date, period_end: date) -> list[Bucket]:
    if period == AnalyticsPeriod.WEEK:
        return [
            Bucket(period_start + timedelta(days=offset), period_start + timedelta(days=offset), "")
            for offset in range((period_end - period_start).days + 1)
        ]

    if period == AnalyticsPeriod.YEAR:
        buckets: list[Bucket] = []
        cursor = date(period_start.year, period_start.month, 1)
        while cursor <= period_end:
            next_month = (
                date(cursor.year + 1, 1, 1)
                if cursor.month == 12
                else date(cursor.year, cursor.month + 1, 1)
            )
            buckets.append(Bucket(cursor, min(next_month - timedelta(days=1), period_end), ""))
            cursor = next_month
        return buckets

    buckets = []
    cursor = period_start
    while cursor <= period_end:
        bucket_end = min(cursor + timedelta(days=6), period_end)
        buckets.append(Bucket(cursor, bucket_end, ""))
        cursor = bucket_end + timedelta(days=1)
    return buckets


def _date_from_datetime(value: datetime | None) -> date | None:
    return value.date() if value else None


def _metric(
    key: AnalyticsMetricKey,
    label: str,
    value: float | int | None,
    unit: str,
    available: bool,
    explanation: str,
) -> AnalyticsMetric:
    return AnalyticsMetric(
        available=available,
        explanation=explanation,
        key=key,
        label=label,
        unit=unit,
        value=None if value is None else float(value),
    )


class AnalyticsService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_summary(
        self,
        owner_user_id: UUID,
        period: AnalyticsPeriod = AnalyticsPeriod.MONTH,
    ) -> AnalyticsSummary:
        generated_at = _utc_now()
        period_end = generated_at.date()
        period_start = _period_start(period, period_end)
        since = datetime.combine(period_start, datetime.min.time(), tzinfo=UTC)

        study_minutes = await self._sum_study_minutes(owner_user_id, since)
        lessons_completed = await self._count_lessons_completed(owner_user_id, since)
        quiz_accuracy = await self._average_quiz_accuracy(owner_user_id, since)
        topic_mastery = await self._average_topic_mastery(owner_user_id)
        habit_completions, habit_total = await self._habit_counts(owner_user_id, period_start)
        files_processed = await self._count_files_processed(owner_user_id, since)
        ai_requests, ai_tokens = await self._ai_usage(owner_user_id, since)
        project_progress = await self._project_progress(owner_user_id)

        metrics = [
            _metric(
                AnalyticsMetricKey.STUDY_MINUTES,
                "Study time",
                study_minutes,
                "minutes",
                True,
                "Sum of completed study-session duration minutes in the selected period.",
            ),
            _metric(
                AnalyticsMetricKey.LESSONS_COMPLETED,
                "Lessons completed",
                lessons_completed,
                "lessons",
                True,
                "Count of owned lessons marked completed in the selected period.",
            ),
            _metric(
                AnalyticsMetricKey.QUIZ_ACCURACY,
                "Quiz accuracy",
                quiz_accuracy,
                "ratio",
                quiz_accuracy is not None,
                "Average completed quiz-attempt accuracy in the selected period.",
            ),
            _metric(
                AnalyticsMetricKey.TOPIC_MASTERY,
                "Topic mastery",
                topic_mastery,
                "ratio",
                topic_mastery is not None,
                "Average current transparent mastery score across owned topics with mastery data.",
            ),
            _metric(
                AnalyticsMetricKey.HABIT_COMPLETIONS,
                "Habit completions",
                habit_completions,
                "logs",
                True,
                "Count of completed habit logs in the selected period.",
            ),
            _metric(
                AnalyticsMetricKey.HABIT_COMPLETION_RATE,
                "Habit completion rate",
                None if habit_total == 0 else habit_completions / habit_total,
                "ratio",
                habit_total > 0,
                "Completed habit logs divided by total habit logs in the selected period.",
            ),
            _metric(
                AnalyticsMetricKey.PROJECT_PROGRESS,
                "Project progress",
                project_progress,
                "ratio",
                project_progress is not None,
                "Done project tasks divided by all tasks on non-archived projects.",
            ),
            _metric(
                AnalyticsMetricKey.FILES_PROCESSED,
                "Files processed",
                files_processed,
                "files",
                True,
                "Count of files that became ready in the selected period.",
            ),
            _metric(
                AnalyticsMetricKey.FILES_OPENED,
                "Files opened",
                None,
                "files",
                False,
                "File-open events are not tracked yet, so this metric is unavailable.",
            ),
            _metric(
                AnalyticsMetricKey.AI_REQUESTS,
                "AI requests",
                ai_requests,
                "requests",
                True,
                "Count of successful AI usage records in the selected period.",
            ),
            _metric(
                AnalyticsMetricKey.AI_TOKENS,
                "AI tokens",
                ai_tokens,
                "tokens",
                True,
                "Sum of token counts from AI usage records in the selected period.",
            ),
            _metric(
                AnalyticsMetricKey.CODING_SESSIONS,
                "Coding sessions",
                None,
                "sessions",
                False,
                "Coding workspace session records do not exist yet, so this metric is unavailable.",
            ),
        ]

        return AnalyticsSummary(
            generatedAt=generated_at,
            metrics=metrics,
            period=period,
            periodEnd=period_end,
            periodStart=period_start,
            trendBuckets=await self._build_trends(owner_user_id, period, period_start, period_end),
        )

    async def _sum_study_minutes(self, owner_user_id: UUID, since: datetime) -> int:
        value = await self._session.scalar(
            select(func.coalesce(func.sum(StudySession.duration_minutes), 0)).where(
                StudySession.owner_user_id == owner_user_id,
                StudySession.started_at >= since,
                StudySession.duration_minutes.is_not(None),
            )
        )
        return int(value or 0)

    async def _count_lessons_completed(self, owner_user_id: UUID, since: datetime) -> int:
        value = await self._session.scalar(
            select(func.count())
            .select_from(Lesson)
            .where(
                Lesson.owner_user_id == owner_user_id,
                Lesson.status == LessonStatus.COMPLETED.value,
                Lesson.updated_at >= since,
            )
        )
        return int(value or 0)

    async def _average_quiz_accuracy(self, owner_user_id: UUID, since: datetime) -> float | None:
        value = await self._session.scalar(
            select(func.avg(Attempt.accuracy)).where(
                Attempt.owner_user_id == owner_user_id,
                Attempt.created_at >= since,
            )
        )
        return None if value is None else float(value)

    async def _average_topic_mastery(self, owner_user_id: UUID) -> float | None:
        value = await self._session.scalar(
            select(func.avg(MasteryRecord.mastery_score)).where(
                MasteryRecord.owner_user_id == owner_user_id
            )
        )
        return None if value is None else float(value)

    async def _habit_counts(self, owner_user_id: UUID, since: date) -> tuple[int, int]:
        rows = (
            await self._session.execute(
                select(HabitLog.status).where(
                    HabitLog.owner_user_id == owner_user_id,
                    HabitLog.log_date >= since,
                )
            )
        ).scalars()
        total = 0
        completed = 0
        for status in rows:
            total += 1
            if status == HabitLogStatus.COMPLETED.value:
                completed += 1
        return completed, total

    async def _count_files_processed(self, owner_user_id: UUID, since: datetime) -> int:
        value = await self._session.scalar(
            select(func.count())
            .select_from(FileRecord)
            .where(
                FileRecord.owner_user_id == owner_user_id,
                FileRecord.processing_status == FileProcessingStatus.READY.value,
                FileRecord.updated_at >= since,
            )
        )
        return int(value or 0)

    async def _ai_usage(self, owner_user_id: UUID, since: datetime) -> tuple[int, int]:
        row = (
            await self._session.execute(
                select(func.count(), func.coalesce(func.sum(AIUsageRecord.total_tokens), 0)).where(
                    AIUsageRecord.owner_user_id == owner_user_id,
                    AIUsageRecord.status == AIUsageStatus.SUCCESS.value,
                    AIUsageRecord.created_at >= since,
                )
            )
        ).one()
        return int(row[0] or 0), int(row[1] or 0)

    async def _project_progress(self, owner_user_id: UUID) -> float | None:
        rows = (
            await self._session.execute(
                select(ProjectTask.status)
                .join(Project, Project.id == ProjectTask.project_id)
                .where(
                    ProjectTask.owner_user_id == owner_user_id,
                    Project.owner_user_id == owner_user_id,
                    Project.status != ProjectStatus.ARCHIVED.value,
                )
            )
        ).scalars()
        total = 0
        done = 0
        for status in rows:
            total += 1
            if status == ProjectTaskStatus.DONE.value:
                done += 1
        return None if total == 0 else done / total

    async def _build_trends(
        self,
        owner_user_id: UUID,
        period: AnalyticsPeriod,
        period_start: date,
        period_end: date,
    ) -> list[AnalyticsTrendBucket]:
        buckets = _trend_buckets(period, period_start, period_end)
        bucket_values = [
            {
                "ai_requests": 0,
                "files_processed": 0,
                "habit_completions": 0,
                "lessons_completed": 0,
                "projects_completed": 0,
                "study_minutes": 0,
            }
            for _ in buckets
        ]

        def bucket_index(value: date | None) -> int | None:
            if value is None:
                return None
            for index, bucket in enumerate(buckets):
                if bucket.period_start <= value <= bucket.period_end:
                    return index
            return None

        since = datetime.combine(period_start, datetime.min.time(), tzinfo=UTC)

        study_rows = (
            await self._session.execute(
                select(StudySession.started_at, StudySession.duration_minutes).where(
                    StudySession.owner_user_id == owner_user_id,
                    StudySession.started_at >= since,
                    StudySession.duration_minutes.is_not(None),
                )
            )
        ).all()
        for started_at, duration_minutes in study_rows:
            index = bucket_index(_date_from_datetime(started_at))
            if index is not None:
                bucket_values[index]["study_minutes"] += int(duration_minutes or 0)

        lesson_rows = (
            await self._session.execute(
                select(Lesson.updated_at).where(
                    Lesson.owner_user_id == owner_user_id,
                    Lesson.status == LessonStatus.COMPLETED.value,
                    Lesson.updated_at >= since,
                )
            )
        ).scalars()
        for updated_at in lesson_rows:
            index = bucket_index(_date_from_datetime(updated_at))
            if index is not None:
                bucket_values[index]["lessons_completed"] += 1

        habit_rows = (
            await self._session.execute(
                select(HabitLog.log_date).where(
                    HabitLog.owner_user_id == owner_user_id,
                    HabitLog.status == HabitLogStatus.COMPLETED.value,
                    HabitLog.log_date >= period_start,
                )
            )
        ).scalars()
        for log_date in habit_rows:
            index = bucket_index(log_date)
            if index is not None:
                bucket_values[index]["habit_completions"] += 1

        file_rows = (
            await self._session.execute(
                select(FileRecord.updated_at).where(
                    FileRecord.owner_user_id == owner_user_id,
                    FileRecord.processing_status == FileProcessingStatus.READY.value,
                    FileRecord.updated_at >= since,
                )
            )
        ).scalars()
        for updated_at in file_rows:
            index = bucket_index(_date_from_datetime(updated_at))
            if index is not None:
                bucket_values[index]["files_processed"] += 1

        ai_rows = (
            await self._session.execute(
                select(AIUsageRecord.created_at).where(
                    AIUsageRecord.owner_user_id == owner_user_id,
                    AIUsageRecord.status == AIUsageStatus.SUCCESS.value,
                    AIUsageRecord.created_at >= since,
                )
            )
        ).scalars()
        for created_at in ai_rows:
            index = bucket_index(_date_from_datetime(created_at))
            if index is not None:
                bucket_values[index]["ai_requests"] += 1

        project_rows = (
            await self._session.execute(
                select(Project.completed_at).where(
                    Project.owner_user_id == owner_user_id,
                    Project.status == ProjectStatus.COMPLETED.value,
                    Project.completed_at >= since,
                )
            )
        ).scalars()
        for completed_at in project_rows:
            index = bucket_index(_date_from_datetime(completed_at))
            if index is not None:
                bucket_values[index]["projects_completed"] += 1

        return [
            AnalyticsTrendBucket(
                aiRequests=values["ai_requests"],
                filesProcessed=values["files_processed"],
                habitCompletions=values["habit_completions"],
                label=_bucket_label(bucket.period_start, bucket.period_end, period),
                lessonsCompleted=values["lessons_completed"],
                periodEnd=bucket.period_end,
                periodStart=bucket.period_start,
                projectsCompleted=values["projects_completed"],
                studyMinutes=values["study_minutes"],
            )
            for bucket, values in zip(buckets, bucket_values, strict=True)
        ]
