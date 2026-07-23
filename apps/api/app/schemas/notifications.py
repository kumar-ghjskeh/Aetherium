from __future__ import annotations

from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.domain.notifications import (
    NotificationReviewPeriod,
    NotificationWorkflowStatus,
    NotificationWorkflowType,
)
from app.models.notifications import (
    MonthlyReview,
    NotificationPreferences,
    NotificationWorkflowRecord,
)
from app.services.notifications import WorkflowRunResult


class NotificationWorkflowSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class NotificationPreferencesResponse(NotificationWorkflowSchema):
    id: UUID
    in_app_enabled: bool = Field(alias="inAppEnabled")
    weekly_review_enabled: bool = Field(alias="weeklyReviewEnabled")
    monthly_review_enabled: bool = Field(alias="monthlyReviewEnabled")
    learning_reminders_enabled: bool = Field(alias="learningRemindersEnabled")
    habit_reminders_enabled: bool = Field(alias="habitRemindersEnabled")
    processing_failure_enabled: bool = Field(alias="processingFailureEnabled")
    ai_provider_failure_enabled: bool = Field(alias="aiProviderFailureEnabled")
    project_deadline_enabled: bool = Field(alias="projectDeadlineEnabled")
    reminder_hour: int = Field(alias="reminderHour")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_preferences(
        cls, preferences: NotificationPreferences
    ) -> NotificationPreferencesResponse:
        return cls.model_validate(preferences)


class NotificationPreferencesUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    in_app_enabled: bool | None = Field(default=None, alias="inAppEnabled")
    weekly_review_enabled: bool | None = Field(default=None, alias="weeklyReviewEnabled")
    monthly_review_enabled: bool | None = Field(default=None, alias="monthlyReviewEnabled")
    learning_reminders_enabled: bool | None = Field(default=None, alias="learningRemindersEnabled")
    habit_reminders_enabled: bool | None = Field(default=None, alias="habitRemindersEnabled")
    processing_failure_enabled: bool | None = Field(default=None, alias="processingFailureEnabled")
    ai_provider_failure_enabled: bool | None = Field(default=None, alias="aiProviderFailureEnabled")
    project_deadline_enabled: bool | None = Field(default=None, alias="projectDeadlineEnabled")
    reminder_hour: int | None = Field(default=None, alias="reminderHour", ge=0, le=23)

    @model_validator(mode="after")
    def require_update(self) -> NotificationPreferencesUpdate:
        if not self.model_fields_set:
            raise ValueError("At least one notification preference field is required")
        return self


class NotificationWorkflowRunRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    reference_date: date | None = Field(default=None, alias="referenceDate")


class NotificationWorkflowRecordResponse(NotificationWorkflowSchema):
    id: UUID
    workflow_type: NotificationWorkflowType = Field(alias="workflowType")
    source_key: str = Field(alias="sourceKey")
    status: NotificationWorkflowStatus
    notification_id: UUID | None = Field(alias="notificationId")
    scheduled_for: datetime = Field(alias="scheduledFor")
    generated_at: datetime | None = Field(alias="generatedAt")
    metadata_json: dict[str, Any] = Field(
        validation_alias="metadata_json",
        serialization_alias="metadata",
    )
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_record(cls, record: NotificationWorkflowRecord) -> NotificationWorkflowRecordResponse:
        return cls.model_validate(record)


class NotificationWorkflowRecordPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[NotificationWorkflowRecordResponse]
    total: int
    limit: int
    offset: int


class NotificationWorkflowRunResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    generated_count: int = Field(alias="generatedCount")
    existing_count: int = Field(alias="existingCount")
    records: list[NotificationWorkflowRecordResponse]

    @classmethod
    def from_result(cls, result: WorkflowRunResult) -> NotificationWorkflowRunResponse:
        return cls(
            generatedCount=result.generated_count,
            existingCount=result.existing_count,
            records=[
                NotificationWorkflowRecordResponse.from_record(record) for record in result.records
            ],
        )


class MonthlyReviewUpsert(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    month_start: date = Field(alias="monthStart")
    wins: str | None = Field(default=None, max_length=4000)
    challenges: str | None = Field(default=None, max_length=4000)
    next_steps: str | None = Field(default=None, alias="nextSteps", max_length=4000)

    @field_validator("month_start")
    @classmethod
    def validate_month_start(cls, value: date) -> date:
        if value.day != 1:
            raise ValueError("Monthly review must start on the first day of the month")
        return value


class MonthlyReviewResponse(NotificationWorkflowSchema):
    id: UUID
    month_start: date = Field(alias="monthStart")
    wins: str | None
    challenges: str | None
    next_steps: str | None = Field(alias="nextSteps")
    period: NotificationReviewPeriod
    metadata_json: dict[str, Any] = Field(
        validation_alias="metadata_json",
        serialization_alias="metadata",
    )
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_review(cls, review: MonthlyReview) -> MonthlyReviewResponse:
        return cls.model_validate(review)


class MonthlyReviewPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[MonthlyReviewResponse]
    total: int
    limit: int
    offset: int
