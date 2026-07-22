from __future__ import annotations

from enum import StrEnum


class AnalyticsPeriod(StrEnum):
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"


class AnalyticsMetricKey(StrEnum):
    STUDY_MINUTES = "study_minutes"
    LESSONS_COMPLETED = "lessons_completed"
    QUIZ_ACCURACY = "quiz_accuracy"
    TOPIC_MASTERY = "topic_mastery"
    HABIT_COMPLETIONS = "habit_completions"
    HABIT_COMPLETION_RATE = "habit_completion_rate"
    PROJECT_PROGRESS = "project_progress"
    FILES_PROCESSED = "files_processed"
    FILES_OPENED = "files_opened"
    AI_REQUESTS = "ai_requests"
    AI_TOKENS = "ai_tokens"
    CODING_SESSIONS = "coding_sessions"
