from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.domain.analytics import AnalyticsMetricKey, AnalyticsPeriod


class AnalyticsMetric(BaseModel):
    key: AnalyticsMetricKey
    label: str
    value: float | None = None
    unit: str
    available: bool
    explanation: str


class AnalyticsTrendBucket(BaseModel):
    period_start: date = Field(alias="periodStart")
    period_end: date = Field(alias="periodEnd")
    label: str
    study_minutes: int = Field(alias="studyMinutes")
    lessons_completed: int = Field(alias="lessonsCompleted")
    habit_completions: int = Field(alias="habitCompletions")
    files_processed: int = Field(alias="filesProcessed")
    ai_requests: int = Field(alias="aiRequests")
    projects_completed: int = Field(alias="projectsCompleted")

    model_config = ConfigDict(populate_by_name=True)


class AnalyticsSummary(BaseModel):
    generated_at: datetime = Field(alias="generatedAt")
    period: AnalyticsPeriod
    period_start: date = Field(alias="periodStart")
    period_end: date = Field(alias="periodEnd")
    metrics: list[AnalyticsMetric]
    trend_buckets: list[AnalyticsTrendBucket] = Field(alias="trendBuckets")

    model_config = ConfigDict(populate_by_name=True)
