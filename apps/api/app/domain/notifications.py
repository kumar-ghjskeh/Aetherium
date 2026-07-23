from __future__ import annotations

from enum import StrEnum


class NotificationWorkflowType(StrEnum):
    WEEKLY_REVIEW = "weekly_review"
    MONTHLY_REVIEW = "monthly_review"
    LEARNING_REVIEW = "learning_review"
    HABIT_REMINDER = "habit_reminder"
    PROCESSING_FAILURE = "processing_failure"
    AI_PROVIDER_FAILURE = "ai_provider_failure"
    PROJECT_DEADLINE = "project_deadline"


class NotificationWorkflowStatus(StrEnum):
    GENERATED = "generated"
    SKIPPED = "skipped"


class NotificationReviewPeriod(StrEnum):
    MONTH = "month"
