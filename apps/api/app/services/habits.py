from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from typing import TypedDict
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.pagination import PaginationParams
from app.domain.foundation import DomainEventType
from app.domain.habits import (
    HabitLogStatus,
    HabitScheduleType,
    HabitStatus,
    HabitTargetPeriod,
    HabitValueType,
    ReviewPeriod,
)
from app.models.auth import User
from app.models.habits import (
    DailyCheckIn,
    Habit,
    HabitLog,
    HabitSchedule,
    HabitStreak,
    HabitTarget,
    WeeklyReview,
)
from app.services.foundation import PageResult, UserDataService


@dataclass(frozen=True)
class HabitView:
    habit: Habit
    schedule: HabitSchedule
    target: HabitTarget
    streak: HabitStreak
    completed_today: bool
    log_count_30d: int


@dataclass(frozen=True)
class HabitSummary:
    period: ReviewPeriod
    start_date: date
    end_date: date
    active_habit_count: int
    completed_log_count: int
    scheduled_count: int
    completion_rate: float
    best_streak: int
    current_streak_total: int
    recovery_streak_total: int
    garden_growth_points: int


class _StreakMetrics(TypedDict):
    best: int
    completion_rate: float
    current: int
    recovery: int


class HabitService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_habit(
        self,
        user: User,
        *,
        name: str,
        description: str | None,
        value_type: HabitValueType,
        target_value: float,
        target_unit: str | None,
        schedule_type: HabitScheduleType,
        weekdays: list[int],
        weekly_target: int | None,
        starts_on: date,
        time_zone: str,
        color: str | None,
    ) -> HabitView:
        schedule_weekdays = _clean_weekdays(weekdays, schedule_type)
        resolved_weekly_target = _weekly_target(schedule_type, weekly_target)
        target_period = (
            HabitTargetPeriod.WEEK
            if schedule_type == HabitScheduleType.WEEKLY_TARGET
            else HabitTargetPeriod.DAY
        )
        habit = Habit(
            owner_user_id=user.id,
            name=name,
            description=description,
            status=HabitStatus.ACTIVE.value,
            value_type=value_type.value,
            color=color,
        )
        self.db.add(habit)
        await self.db.flush()
        self.db.add(
            HabitSchedule(
                owner_user_id=user.id,
                habit_id=habit.id,
                schedule_type=schedule_type.value,
                weekdays=schedule_weekdays,
                weekly_target=resolved_weekly_target,
                starts_on=starts_on,
                time_zone=time_zone,
            )
        )
        self.db.add(
            HabitTarget(
                owner_user_id=user.id,
                habit_id=habit.id,
                target_value=target_value,
                target_unit=target_unit,
                target_period=target_period.value,
            )
        )
        self.db.add(
            HabitStreak(
                owner_user_id=user.id,
                habit_id=habit.id,
                current_streak=0,
                best_streak=0,
                recovery_streak=0,
                completion_rate_30d=0.0,
            )
        )
        await UserDataService(self.db).record_audit_log(
            user,
            action="habit.created",
            entity_type="habit",
            entity_id=habit.id,
            metadata={"name": name, "scheduleType": schedule_type.value},
        )
        await self.db.flush()
        return await self._build_view(user, habit)

    async def list_habits(
        self,
        user: User,
        pagination: PaginationParams,
        *,
        include_archived: bool = False,
    ) -> PageResult[HabitView]:
        predicates = [Habit.owner_user_id == user.id]
        if not include_archived:
            predicates.append(Habit.status == HabitStatus.ACTIVE.value)
        total = await self._count(select(func.count(Habit.id)).where(*predicates))
        result = await self.db.execute(
            select(Habit)
            .where(*predicates)
            .order_by(Habit.updated_at.desc(), Habit.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        habits = list(result.scalars().all())
        return PageResult(
            items=[await self._build_view(user, habit) for habit in habits],
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def get_habit(self, user: User, habit_id: UUID) -> HabitView:
        return await self._build_view(user, await self._get_owned_habit(user, habit_id))

    async def update_habit(
        self,
        user: User,
        habit_id: UUID,
        updates: dict[str, object],
    ) -> HabitView:
        habit = await self._get_owned_habit(user, habit_id)
        schedule = await self._get_schedule(user, habit.id)
        target = await self._get_target(user, habit.id)

        for field_name in ("name", "description", "color"):
            if field_name in updates:
                setattr(habit, field_name, updates[field_name])
        if "target_value" in updates:
            target_value = updates["target_value"]
            if not isinstance(target_value, int | float):
                raise AppError(422, "target_value_invalid", "Target value must be numeric.")
            target.target_value = float(target_value)
        if "target_unit" in updates:
            target.target_unit = str(updates["target_unit"]) if updates["target_unit"] else None
        if "schedule_type" in updates:
            schedule_type = HabitScheduleType(str(updates["schedule_type"]))
            schedule.schedule_type = schedule_type.value
            target.target_period = (
                HabitTargetPeriod.WEEK
                if schedule_type == HabitScheduleType.WEEKLY_TARGET
                else HabitTargetPeriod.DAY
            ).value
        if "weekdays" in updates:
            schedule.weekdays = _clean_weekdays(
                list(updates["weekdays"]) if isinstance(updates["weekdays"], list) else [],
                HabitScheduleType(schedule.schedule_type),
            )
        if "weekly_target" in updates:
            weekly_target_value = updates["weekly_target"]
            if weekly_target_value is not None and not isinstance(weekly_target_value, int):
                raise AppError(422, "weekly_target_invalid", "Weekly target must be numeric.")
            resolved_weekly_target = (
                weekly_target_value if isinstance(weekly_target_value, int) else None
            )
            schedule.weekly_target = _weekly_target(
                HabitScheduleType(schedule.schedule_type),
                resolved_weekly_target,
            )

        schedule_type = HabitScheduleType(schedule.schedule_type)
        schedule.weekdays = _clean_weekdays(schedule.weekdays, schedule_type)
        schedule.weekly_target = _weekly_target(schedule_type, schedule.weekly_target)

        now = datetime.now(UTC)
        habit.updated_at = now
        schedule.updated_at = now
        target.updated_at = now
        await self._refresh_streak(user, habit, reference_date=date.today())
        await UserDataService(self.db).record_audit_log(
            user,
            action="habit.updated",
            entity_type="habit",
            entity_id=habit.id,
            metadata={"updatedFields": sorted(updates.keys())},
        )
        await self.db.flush()
        return await self._build_view(user, habit)

    async def archive_habit(self, user: User, habit_id: UUID) -> HabitView:
        habit = await self._get_owned_habit(user, habit_id)
        now = datetime.now(UTC)
        habit.status = HabitStatus.ARCHIVED.value
        habit.archived_at = now
        habit.updated_at = now
        await UserDataService(self.db).record_audit_log(
            user,
            action="habit.archived",
            entity_type="habit",
            entity_id=habit.id,
            metadata={},
        )
        await self.db.flush()
        return await self._build_view(user, habit)

    async def log_habit(
        self,
        user: User,
        habit_id: UUID,
        *,
        log_date: date,
        value: float,
        note: str | None,
    ) -> HabitLog:
        habit = await self._get_owned_habit(user, habit_id)
        if habit.status != HabitStatus.ACTIVE.value:
            raise AppError(409, "habit_archived", "Archived habits cannot be logged.")
        target = await self._get_target(user, habit.id)
        unit = target.target_unit
        result = await self.db.execute(
            select(HabitLog).where(
                HabitLog.owner_user_id == user.id,
                HabitLog.habit_id == habit.id,
                HabitLog.log_date == log_date,
            )
        )
        log = result.scalar_one_or_none()
        if log is None:
            log = HabitLog(
                owner_user_id=user.id,
                habit_id=habit.id,
                log_date=log_date,
                value=value,
                unit=unit,
                note=note,
                status=HabitLogStatus.COMPLETED.value,
            )
            self.db.add(log)
        else:
            log.value = value
            log.unit = unit
            log.note = note
            log.updated_at = datetime.now(UTC)

        foundation = UserDataService(self.db)
        await foundation.create_domain_event(
            user,
            event_type=DomainEventType.HABIT_LOGGED,
            idempotency_key=f"habit.logged:{habit.id}:{log_date.isoformat()}",
            payload={"habitId": str(habit.id), "logDate": log_date.isoformat(), "value": value},
        )
        await foundation.record_audit_log(
            user,
            action="habit.logged",
            entity_type="habit",
            entity_id=habit.id,
            metadata={"logDate": log_date.isoformat(), "value": value},
        )
        await self.db.flush()
        await self._refresh_streak(user, habit, reference_date=log_date)
        await self.db.flush()
        return log

    async def list_logs(
        self,
        user: User,
        habit_id: UUID,
        pagination: PaginationParams,
    ) -> PageResult[HabitLog]:
        await self._get_owned_habit(user, habit_id)
        predicates = [HabitLog.owner_user_id == user.id, HabitLog.habit_id == habit_id]
        total = await self._count(select(func.count(HabitLog.id)).where(*predicates))
        result = await self.db.execute(
            select(HabitLog)
            .where(*predicates)
            .order_by(HabitLog.log_date.desc(), HabitLog.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def get_summary(
        self,
        user: User,
        *,
        period: ReviewPeriod,
        start_date: date | None = None,
    ) -> HabitSummary:
        start, end = _period_bounds(period, start_date or date.today())
        habit_result = await self.db.execute(
            select(Habit, HabitSchedule, HabitTarget, HabitStreak)
            .where(
                Habit.owner_user_id == user.id,
                Habit.status == HabitStatus.ACTIVE.value,
                HabitSchedule.habit_id == Habit.id,
                HabitTarget.habit_id == Habit.id,
                HabitStreak.habit_id == Habit.id,
            )
            .order_by(Habit.created_at.asc())
        )
        rows = list(habit_result.all())
        logs = await self._logs_for_range(user, start, end)
        completed_log_count = len(logs)
        scheduled_count = sum(
            _scheduled_count(schedule, start, end) for _habit, schedule, _target, _streak in rows
        )
        completion_rate = completed_log_count / scheduled_count if scheduled_count else 0.0
        return HabitSummary(
            period=period,
            start_date=start,
            end_date=end,
            active_habit_count=len(rows),
            completed_log_count=completed_log_count,
            scheduled_count=scheduled_count,
            completion_rate=round(min(completion_rate, 1.0), 4),
            best_streak=max((streak.best_streak for _h, _s, _t, streak in rows), default=0),
            current_streak_total=sum(streak.current_streak for _h, _s, _t, streak in rows),
            recovery_streak_total=sum(streak.recovery_streak for _h, _s, _t, streak in rows),
            garden_growth_points=completed_log_count,
        )

    async def get_check_in(self, user: User, check_in_date: date) -> DailyCheckIn | None:
        result = await self.db.execute(
            select(DailyCheckIn).where(
                DailyCheckIn.owner_user_id == user.id,
                DailyCheckIn.check_in_date == check_in_date,
            )
        )
        return result.scalar_one_or_none()

    async def upsert_check_in(
        self,
        user: User,
        *,
        check_in_date: date,
        mood: int | None,
        energy: int | None,
        notes: str | None,
    ) -> DailyCheckIn:
        check_in = await self.get_check_in(user, check_in_date)
        if check_in is None:
            check_in = DailyCheckIn(
                owner_user_id=user.id,
                check_in_date=check_in_date,
                mood=mood,
                energy=energy,
                notes=notes,
            )
            self.db.add(check_in)
        else:
            check_in.mood = mood
            check_in.energy = energy
            check_in.notes = notes
            check_in.updated_at = datetime.now(UTC)
        await UserDataService(self.db).record_audit_log(
            user,
            action="habit.check_in_saved",
            entity_type="daily_check_in",
            entity_id=check_in.id,
            metadata={"date": check_in_date.isoformat()},
        )
        await self.db.flush()
        return check_in

    async def list_weekly_reviews(
        self,
        user: User,
        pagination: PaginationParams,
    ) -> PageResult[WeeklyReview]:
        total = await self._count(
            select(func.count(WeeklyReview.id)).where(WeeklyReview.owner_user_id == user.id)
        )
        result = await self.db.execute(
            select(WeeklyReview)
            .where(WeeklyReview.owner_user_id == user.id)
            .order_by(WeeklyReview.week_start.desc(), WeeklyReview.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def upsert_weekly_review(
        self,
        user: User,
        *,
        week_start: date,
        wins: str | None,
        challenges: str | None,
        next_steps: str | None,
    ) -> WeeklyReview:
        week_start = week_start - timedelta(days=week_start.weekday())
        result = await self.db.execute(
            select(WeeklyReview).where(
                WeeklyReview.owner_user_id == user.id,
                WeeklyReview.week_start == week_start,
            )
        )
        review = result.scalar_one_or_none()
        if review is None:
            review = WeeklyReview(
                owner_user_id=user.id,
                week_start=week_start,
                wins=wins,
                challenges=challenges,
                next_steps=next_steps,
                period=ReviewPeriod.WEEK.value,
                metadata_json={},
            )
            self.db.add(review)
        else:
            review.wins = wins
            review.challenges = challenges
            review.next_steps = next_steps
            review.updated_at = datetime.now(UTC)
        await UserDataService(self.db).record_audit_log(
            user,
            action="habit.weekly_review_saved",
            entity_type="weekly_review",
            entity_id=review.id,
            metadata={"weekStart": week_start.isoformat()},
        )
        await self.db.flush()
        return review

    async def _build_view(self, user: User, habit: Habit) -> HabitView:
        schedule = await self._get_schedule(user, habit.id)
        target = await self._get_target(user, habit.id)
        streak = await self._get_or_create_streak(user, habit.id)
        today = date.today()
        log_count = await self._count(
            select(func.count(HabitLog.id)).where(
                HabitLog.owner_user_id == user.id,
                HabitLog.habit_id == habit.id,
                HabitLog.log_date >= today - timedelta(days=29),
            )
        )
        completed_today = await self._count(
            select(func.count(HabitLog.id)).where(
                HabitLog.owner_user_id == user.id,
                HabitLog.habit_id == habit.id,
                HabitLog.log_date == today,
            )
        )
        return HabitView(
            habit=habit,
            schedule=schedule,
            target=target,
            streak=streak,
            completed_today=completed_today > 0,
            log_count_30d=log_count,
        )

    async def _refresh_streak(
        self,
        user: User,
        habit: Habit,
        *,
        reference_date: date,
    ) -> HabitStreak:
        schedule = await self._get_schedule(user, habit.id)
        target = await self._get_target(user, habit.id)
        streak = await self._get_or_create_streak(user, habit.id)
        start_date = max(schedule.starts_on, reference_date - timedelta(days=89))
        logs = await self._logs_for_habit_range(user, habit.id, start_date, reference_date)
        metrics = (
            _weekly_streak_metrics(schedule, logs, reference_date)
            if schedule.schedule_type == HabitScheduleType.WEEKLY_TARGET.value
            else _daily_streak_metrics(schedule, target, logs, reference_date)
        )
        streak.current_streak = metrics["current"]
        streak.best_streak = max(streak.best_streak, metrics["best"])
        streak.recovery_streak = metrics["recovery"]
        streak.completion_rate_30d = metrics["completion_rate"]
        streak.last_logged_on = max((log.log_date for log in logs), default=streak.last_logged_on)
        streak.updated_at = datetime.now(UTC)
        return streak

    async def _logs_for_range(self, user: User, start: date, end: date) -> list[HabitLog]:
        result = await self.db.execute(
            select(HabitLog).where(
                HabitLog.owner_user_id == user.id,
                HabitLog.log_date >= start,
                HabitLog.log_date <= end,
            )
        )
        return list(result.scalars().all())

    async def _logs_for_habit_range(
        self,
        user: User,
        habit_id: UUID,
        start: date,
        end: date,
    ) -> list[HabitLog]:
        result = await self.db.execute(
            select(HabitLog)
            .where(
                HabitLog.owner_user_id == user.id,
                HabitLog.habit_id == habit_id,
                HabitLog.log_date >= start,
                HabitLog.log_date <= end,
            )
            .order_by(HabitLog.log_date.asc())
        )
        return list(result.scalars().all())

    async def _get_owned_habit(self, user: User, habit_id: UUID) -> Habit:
        result = await self.db.execute(
            select(Habit).where(Habit.id == habit_id, Habit.owner_user_id == user.id)
        )
        habit = result.scalar_one_or_none()
        if habit is None:
            raise AppError(404, "not_found", "Habit was not found.")
        return habit

    async def _get_schedule(self, user: User, habit_id: UUID) -> HabitSchedule:
        result = await self.db.execute(
            select(HabitSchedule).where(
                HabitSchedule.owner_user_id == user.id,
                HabitSchedule.habit_id == habit_id,
            )
        )
        schedule = result.scalar_one_or_none()
        if schedule is None:
            raise AppError(404, "not_found", "Habit schedule was not found.")
        return schedule

    async def _get_target(self, user: User, habit_id: UUID) -> HabitTarget:
        result = await self.db.execute(
            select(HabitTarget).where(
                HabitTarget.owner_user_id == user.id,
                HabitTarget.habit_id == habit_id,
            )
        )
        target = result.scalar_one_or_none()
        if target is None:
            raise AppError(404, "not_found", "Habit target was not found.")
        return target

    async def _get_or_create_streak(self, user: User, habit_id: UUID) -> HabitStreak:
        result = await self.db.execute(
            select(HabitStreak).where(
                HabitStreak.owner_user_id == user.id,
                HabitStreak.habit_id == habit_id,
            )
        )
        streak = result.scalar_one_or_none()
        if streak is not None:
            return streak
        streak = HabitStreak(owner_user_id=user.id, habit_id=habit_id)
        self.db.add(streak)
        await self.db.flush()
        return streak

    async def _count(self, query: Select[tuple[int]]) -> int:
        value = await self.db.scalar(query)
        return int(value or 0)


def _clean_weekdays(weekdays: Sequence[object], schedule_type: HabitScheduleType) -> list[int]:
    if schedule_type != HabitScheduleType.SELECTED_WEEKDAYS:
        return []
    cleaned = sorted({int(day) for day in weekdays if isinstance(day, int) and 0 <= day <= 6})
    if not cleaned:
        raise AppError(422, "weekdays_required", "Selected weekday habits need at least one day.")
    return cleaned


def _weekly_target(schedule_type: HabitScheduleType, weekly_target: int | None) -> int | None:
    if schedule_type != HabitScheduleType.WEEKLY_TARGET:
        return None
    if weekly_target is None or weekly_target < 1 or weekly_target > 7:
        raise AppError(422, "weekly_target_invalid", "Weekly target must be between 1 and 7.")
    return weekly_target


def _daily_streak_metrics(
    schedule: HabitSchedule,
    target: HabitTarget,
    logs: list[HabitLog],
    reference_date: date,
) -> _StreakMetrics:
    completed_dates = {
        log.log_date
        for log in logs
        if log.value >= target.target_value and log.status == "completed"
    }
    scheduled_dates = [
        current
        for current in _date_range(
            max(schedule.starts_on, reference_date - timedelta(days=29)), reference_date
        )
        if _is_scheduled_day(schedule, current)
    ]
    current = _current_daily_streak(schedule, completed_dates, reference_date)
    best = _best_run([day in completed_dates for day in scheduled_dates])
    completed_count = sum(1 for day in scheduled_dates if day in completed_dates)
    completion_rate = completed_count / len(scheduled_dates) if scheduled_dates else 0.0
    recovery = current if current > 0 and completed_count < len(scheduled_dates) else 0
    return {
        "best": best,
        "completion_rate": round(completion_rate, 4),
        "current": current,
        "recovery": recovery,
    }


def _weekly_streak_metrics(
    schedule: HabitSchedule,
    logs: list[HabitLog],
    reference_date: date,
) -> _StreakMetrics:
    target = schedule.weekly_target or 1
    week_start = reference_date - timedelta(days=reference_date.weekday())
    weeks = [week_start - timedelta(days=7 * offset) for offset in range(12)]
    weeks.reverse()
    completed_weeks = []
    for start in weeks:
        end = start + timedelta(days=6)
        count = sum(1 for log in logs if start <= log.log_date <= end)
        completed_weeks.append(count >= target)
    current = 0
    for completed in reversed(completed_weeks):
        if not completed:
            break
        current += 1
    completed_count = sum(1 for completed in completed_weeks if completed)
    return {
        "best": _best_run(completed_weeks),
        "completion_rate": round(completed_count / len(completed_weeks), 4) if weeks else 0.0,
        "current": current,
        "recovery": current if current > 0 and completed_count < len(completed_weeks) else 0,
    }


def _current_daily_streak(
    schedule: HabitSchedule,
    completed_dates: set[date],
    reference_date: date,
) -> int:
    current = reference_date
    while current >= schedule.starts_on and not _is_scheduled_day(schedule, current):
        current -= timedelta(days=1)
    streak = 0
    while current >= schedule.starts_on:
        if _is_scheduled_day(schedule, current):
            if current not in completed_dates:
                break
            streak += 1
        current -= timedelta(days=1)
    return streak


def _best_run(values: list[bool]) -> int:
    best = 0
    current = 0
    for value in values:
        if value:
            current += 1
            best = max(best, current)
        else:
            current = 0
    return best


def _is_scheduled_day(schedule: HabitSchedule, value: date) -> bool:
    if value < schedule.starts_on:
        return False
    if schedule.schedule_type == HabitScheduleType.DAILY.value:
        return True
    if schedule.schedule_type == HabitScheduleType.SELECTED_WEEKDAYS.value:
        return value.weekday() in schedule.weekdays
    return True


def _scheduled_count(schedule: HabitSchedule, start: date, end: date) -> int:
    if schedule.schedule_type == HabitScheduleType.WEEKLY_TARGET.value:
        week_count = len({day - timedelta(days=day.weekday()) for day in _date_range(start, end)})
        return week_count * (schedule.weekly_target or 1)
    return sum(1 for day in _date_range(start, end) if _is_scheduled_day(schedule, day))


def _date_range(start: date, end: date) -> list[date]:
    days = (end - start).days
    if days < 0:
        return []
    return [start + timedelta(days=offset) for offset in range(days + 1)]


def _period_bounds(period: ReviewPeriod, anchor: date) -> tuple[date, date]:
    if period == ReviewPeriod.WEEK:
        start = anchor - timedelta(days=anchor.weekday())
        return start, start + timedelta(days=6)
    start = anchor.replace(day=1)
    if start.month == 12:
        next_month = start.replace(year=start.year + 1, month=1)
    else:
        next_month = start.replace(month=start.month + 1)
    return start, next_month - timedelta(days=1)
