from datetime import datetime
from typing import Any
from uuid import UUID
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.domain.foundation import (
    WORLD_LOCATION_IDS,
    DefaultInterfaceMode,
    DomainEventType,
    NavigationMethod,
    NotificationSeverity,
    NotificationType,
    PerformancePreset,
    Theme,
)


class FoundationSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class UserPreferencesResponse(FoundationSchema):
    id: UUID
    theme: Theme
    default_interface_mode: DefaultInterfaceMode = Field(alias="defaultInterfaceMode")
    reduced_motion: bool = Field(alias="reducedMotion")
    background_music_enabled: bool = Field(alias="backgroundMusicEnabled")
    ambient_audio_enabled: bool = Field(alias="ambientAudioEnabled")
    camera_effects_enabled: bool = Field(alias="cameraEffectsEnabled")
    performance_preset: PerformancePreset = Field(alias="performancePreset")
    time_zone: str = Field(alias="timeZone")
    locale: str
    ai_memory_enabled: bool = Field(alias="aiMemoryEnabled")
    product_analytics_enabled: bool = Field(alias="productAnalyticsEnabled")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class UserPreferencesUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    theme: Theme | None = None
    default_interface_mode: DefaultInterfaceMode | None = Field(
        default=None, alias="defaultInterfaceMode"
    )
    reduced_motion: bool | None = Field(default=None, alias="reducedMotion")
    background_music_enabled: bool | None = Field(default=None, alias="backgroundMusicEnabled")
    ambient_audio_enabled: bool | None = Field(default=None, alias="ambientAudioEnabled")
    camera_effects_enabled: bool | None = Field(default=None, alias="cameraEffectsEnabled")
    performance_preset: PerformancePreset | None = Field(default=None, alias="performancePreset")
    time_zone: str | None = Field(default=None, alias="timeZone", min_length=1, max_length=64)
    locale: str | None = Field(
        default=None, min_length=2, max_length=35, pattern=r"^[A-Za-z0-9_-]+$"
    )
    ai_memory_enabled: bool | None = Field(default=None, alias="aiMemoryEnabled")
    product_analytics_enabled: bool | None = Field(default=None, alias="productAnalyticsEnabled")

    @field_validator("time_zone")
    @classmethod
    def validate_time_zone(cls, value: str | None) -> str | None:
        if value is None:
            return value
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as exc:
            raise ValueError("Unknown time zone") from exc
        return value

    @model_validator(mode="after")
    def require_update_field(self) -> "UserPreferencesUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one preference field is required")
        return self


class WorldProfileResponse(FoundationSchema):
    id: UUID
    current_location_id: str = Field(alias="currentLocationId")
    last_visited_location_id: str | None = Field(alias="lastVisitedLocationId")
    preferred_navigation_method: NavigationMethod = Field(alias="preferredNavigationMethod")
    tutorial_completed: bool = Field(alias="tutorialCompleted")
    world_state_version: int = Field(alias="worldStateVersion")
    spawn_location_id: str = Field(alias="spawnLocationId")
    visited_location_ids: list[str] = Field(alias="visitedLocationIds")
    unlocked_location_ids: list[str] = Field(alias="unlockedLocationIds")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class WorldProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    preferred_navigation_method: NavigationMethod | None = Field(
        default=None, alias="preferredNavigationMethod"
    )
    tutorial_completed: bool | None = Field(default=None, alias="tutorialCompleted")
    spawn_location_id: str | None = Field(default=None, alias="spawnLocationId")

    @field_validator("spawn_location_id")
    @classmethod
    def validate_spawn_location(cls, value: str | None) -> str | None:
        if value is not None and value not in WORLD_LOCATION_IDS:
            raise ValueError("Unknown world location")
        return value

    @model_validator(mode="after")
    def require_update_field(self) -> "WorldProfileUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one world profile field is required")
        return self


class WorldVisitRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    location_id: str = Field(alias="locationId", min_length=1, max_length=64)
    idempotency_key: str = Field(alias="idempotencyKey", min_length=8, max_length=160)

    @field_validator("location_id")
    @classmethod
    def validate_location(cls, value: str) -> str:
        if value not in WORLD_LOCATION_IDS:
            raise ValueError("Unknown world location")
        return value


class DomainEventCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    event_type: DomainEventType = Field(alias="eventType")
    idempotency_key: str = Field(alias="idempotencyKey", min_length=8, max_length=160)
    payload: dict[str, Any] = Field(default_factory=dict)


class DomainEventResponse(FoundationSchema):
    id: UUID
    event_type: DomainEventType = Field(alias="eventType")
    idempotency_key: str = Field(alias="idempotencyKey")
    payload: dict[str, Any]
    occurred_at: datetime = Field(alias="occurredAt")
    created_at: datetime = Field(alias="createdAt")


class DomainEventPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[DomainEventResponse]
    total: int
    limit: int
    offset: int


class NotificationResponse(FoundationSchema):
    id: UUID
    notification_type: NotificationType = Field(alias="notificationType")
    severity: NotificationSeverity
    title: str
    body: str
    action_url: str | None = Field(alias="actionUrl")
    read_at: datetime | None = Field(alias="readAt")
    created_at: datetime = Field(alias="createdAt")


class NotificationPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[NotificationResponse]
    total: int
    unread_count: int = Field(alias="unreadCount")
    limit: int
    offset: int


class AuditLogResponse(FoundationSchema):
    id: UUID
    action: str
    entity_type: str | None = Field(alias="entityType")
    entity_id: UUID | None = Field(alias="entityId")
    metadata_json: dict[str, Any] = Field(
        validation_alias="metadata_json",
        serialization_alias="metadata",
    )
    created_at: datetime = Field(alias="createdAt")


class AuditLogPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[AuditLogResponse]
    total: int
    limit: int
    offset: int
