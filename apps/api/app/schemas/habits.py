from __future__ import annotations

from datetime import date, datetime
from uuid import UUID
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.domain.habits import (
    HabitLogStatus,
    HabitScheduleType,
    HabitStatus,
    HabitTargetPeriod,
    HabitValueType,
    ReviewPeriod,
)
from app.models.habits import DailyCheckIn, HabitLog, WeeklyReview
from app.services.habits import HabitSummary, HabitView


def _today() -> date:
    return date.today()


class HabitSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class HabitScheduleResponse(HabitSchema):
    id: UUID
    schedule_type: HabitScheduleType = Field(alias="scheduleType")
    weekdays: list[int]
    weekly_target: int | None = Field(alias="weeklyTarget")
    starts_on: date = Field(alias="startsOn")
    time_zone: str = Field(alias="timeZone")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class HabitTargetResponse(HabitSchema):
    id: UUID
    target_value: float = Field(alias="targetValue")
    target_unit: str | None = Field(alias="targetUnit")
    target_period: HabitTargetPeriod = Field(alias="targetPeriod")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class HabitStreakResponse(HabitSchema):
    id: UUID
    current_streak: int = Field(alias="currentStreak")
    best_streak: int = Field(alias="bestStreak")
    recovery_streak: int = Field(alias="recoveryStreak")
    completion_rate_30d: float = Field(alias="completionRate30d")
    last_logged_on: date | None = Field(alias="lastLoggedOn")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class HabitResponse(HabitSchema):
    id: UUID
    name: str
    description: str | None
    status: HabitStatus
    value_type: HabitValueType = Field(alias="valueType")
    color: str | None
    archived_at: datetime | None = Field(alias="archivedAt")
    schedule: HabitScheduleResponse
    target: HabitTargetResponse
    streak: HabitStreakResponse
    completed_today: bool = Field(alias="completedToday")
    log_count_30d: int = Field(alias="logCount30d")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_view(cls, view: HabitView) -> HabitResponse:
        return cls(
            id=view.habit.id,
            name=view.habit.name,
            description=view.habit.description,
            status=HabitStatus(view.habit.status),
            valueType=HabitValueType(view.habit.value_type),
            color=view.habit.color,
            archivedAt=view.habit.archived_at,
            schedule=HabitScheduleResponse.model_validate(view.schedule),
            target=HabitTargetResponse.model_validate(view.target),
            streak=HabitStreakResponse.model_validate(view.streak),
            completedToday=view.completed_today,
            logCount30d=view.log_count_30d,
            createdAt=view.habit.created_at,
            updatedAt=view.habit.updated_at,
        )


class HabitPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[HabitResponse]
    total: int
    limit: int
    offset: int


class HabitCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=4000)
    value_type: HabitValueType = Field(default=HabitValueType.BOOLEAN, alias="valueType")
    target_value: float = Field(default=1.0, alias="targetValue", gt=0, le=1_000_000)
    target_unit: str | None = Field(default=None, alias="targetUnit", max_length=40)
    schedule_type: HabitScheduleType = Field(default=HabitScheduleType.DAILY, alias="scheduleType")
    weekdays: list[int] = Field(default_factory=list, max_length=7)
    weekly_target: int | None = Field(default=None, alias="weeklyTarget", ge=1, le=7)
    starts_on: date = Field(default_factory=_today, alias="startsOn")
    time_zone: str = Field(default="UTC", alias="timeZone", min_length=1, max_length=64)
    color: str | None = Field(default=None, max_length=32)

    @field_validator("weekdays")
    @classmethod
    def validate_weekdays(cls, value: list[int]) -> list[int]:
        cleaned = sorted(set(value))
        if any(day < 0 or day > 6 for day in cleaned):
            raise ValueError("Weekdays must use 0-6 where Monday is 0")
        return cleaned

    @field_validator("time_zone")
    @classmethod
    def validate_time_zone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as exc:
            raise ValueError("Unknown time zone") from exc
        return value

    @model_validator(mode="after")
    def validate_schedule(self) -> HabitCreateRequest:
        if self.schedule_type == HabitScheduleType.SELECTED_WEEKDAYS and not self.weekdays:
            raise ValueError("Selected weekday habits require at least one weekday")
        if self.schedule_type == HabitScheduleType.WEEKLY_TARGET and self.weekly_target is None:
            raise ValueError("Weekly target habits require a weekly target")
        return self


class HabitUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=4000)
    color: str | None = Field(default=None, max_length=32)
    target_value: float | None = Field(default=None, alias="targetValue", gt=0, le=1_000_000)
    target_unit: str | None = Field(default=None, alias="targetUnit", max_length=40)
    schedule_type: HabitScheduleType | None = Field(default=None, alias="scheduleType")
    weekdays: list[int] | None = Field(default=None, max_length=7)
    weekly_target: int | None = Field(default=None, alias="weeklyTarget", ge=1, le=7)

    @field_validator("weekdays")
    @classmethod
    def validate_weekdays(cls, value: list[int] | None) -> list[int] | None:
        if value is None:
            return value
        cleaned = sorted(set(value))
        if any(day < 0 or day > 6 for day in cleaned):
            raise ValueError("Weekdays must use 0-6 where Monday is 0")
        return cleaned

    @model_validator(mode="after")
    def require_update(self) -> HabitUpdateRequest:
        if not self.model_fields_set:
            raise ValueError("At least one habit field is required")
        return self


class HabitLogRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    log_date: date = Field(default_factory=_today, alias="logDate")
    value: float = Field(default=1.0, gt=0, le=1_000_000)
    note: str | None = Field(default=None, max_length=2000)


class HabitLogResponse(HabitSchema):
    id: UUID
    habit_id: UUID = Field(alias="habitId")
    log_date: date = Field(alias="logDate")
    value: float
    unit: str | None
    note: str | None
    status: HabitLogStatus
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_log(cls, log: HabitLog) -> HabitLogResponse:
        return cls.model_validate(log)


class HabitLogPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[HabitLogResponse]
    total: int
    limit: int
    offset: int


class HabitSummaryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    period: ReviewPeriod
    start_date: date = Field(alias="startDate")
    end_date: date = Field(alias="endDate")
    active_habit_count: int = Field(alias="activeHabitCount")
    completed_log_count: int = Field(alias="completedLogCount")
    scheduled_count: int = Field(alias="scheduledCount")
    completion_rate: float = Field(alias="completionRate")
    best_streak: int = Field(alias="bestStreak")
    current_streak_total: int = Field(alias="currentStreakTotal")
    recovery_streak_total: int = Field(alias="recoveryStreakTotal")
    garden_growth_points: int = Field(alias="gardenGrowthPoints")

    @classmethod
    def from_summary(cls, summary: HabitSummary) -> HabitSummaryResponse:
        return cls(
            period=summary.period,
            startDate=summary.start_date,
            endDate=summary.end_date,
            activeHabitCount=summary.active_habit_count,
            completedLogCount=summary.completed_log_count,
            scheduledCount=summary.scheduled_count,
            completionRate=summary.completion_rate,
            bestStreak=summary.best_streak,
            currentStreakTotal=summary.current_streak_total,
            recoveryStreakTotal=summary.recovery_streak_total,
            gardenGrowthPoints=summary.garden_growth_points,
        )


class DailyCheckInUpsert(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    mood: int | None = Field(default=None, ge=1, le=5)
    energy: int | None = Field(default=None, ge=1, le=5)
    notes: str | None = Field(default=None, max_length=2000)


class DailyCheckInResponse(HabitSchema):
    id: UUID
    check_in_date: date = Field(alias="checkInDate")
    mood: int | None
    energy: int | None
    notes: str | None
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_check_in(cls, check_in: DailyCheckIn) -> DailyCheckInResponse:
        return cls.model_validate(check_in)


class WeeklyReviewUpsert(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    week_start: date = Field(alias="weekStart")
    wins: str | None = Field(default=None, max_length=4000)
    challenges: str | None = Field(default=None, max_length=4000)
    next_steps: str | None = Field(default=None, alias="nextSteps", max_length=4000)


class WeeklyReviewResponse(HabitSchema):
    id: UUID
    week_start: date = Field(alias="weekStart")
    wins: str | None
    challenges: str | None
    next_steps: str | None = Field(alias="nextSteps")
    period: ReviewPeriod
    metadata_json: dict[str, object] = Field(
        validation_alias="metadata_json",
        serialization_alias="metadata",
    )
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_review(cls, review: WeeklyReview) -> WeeklyReviewResponse:
        return cls.model_validate(review)


class WeeklyReviewPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[WeeklyReviewResponse]
    total: int
    limit: int
    offset: int
