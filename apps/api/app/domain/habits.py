from __future__ import annotations

from enum import StrEnum


class HabitStatus(StrEnum):
    ACTIVE = "active"
    ARCHIVED = "archived"


class HabitValueType(StrEnum):
    BOOLEAN = "boolean"
    DURATION = "duration"
    COUNT = "count"
    QUANTITY = "quantity"


class HabitScheduleType(StrEnum):
    DAILY = "daily"
    SELECTED_WEEKDAYS = "selected_weekdays"
    WEEKLY_TARGET = "weekly_target"


class HabitTargetPeriod(StrEnum):
    DAY = "day"
    WEEK = "week"


class HabitLogStatus(StrEnum):
    COMPLETED = "completed"


class ReviewPeriod(StrEnum):
    WEEK = "week"
    MONTH = "month"
