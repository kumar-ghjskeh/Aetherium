from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.pagination import PaginationParams
from app.domain.foundation import (
    DEFAULT_SPAWN_LOCATION_ID,
    DEFAULT_UNLOCKED_LOCATION_IDS,
    DEFAULT_VISITED_LOCATION_IDS,
    WORLD_LOCATION_IDS,
    DefaultInterfaceMode,
    DomainEventType,
    NavigationMethod,
    NotificationSeverity,
    NotificationType,
    PerformancePreset,
    Theme,
)
from app.domain.world import (
    WORLD_LOCATION_DEFINITIONS,
    WorldLocationDefinition,
    get_world_location_definition,
)
from app.models.auth import User
from app.models.foundation import AuditLog, DomainEvent, Notification, UserPreferences, WorldProfile

SENSITIVE_METADATA_KEY_PARTS = (
    "authorization",
    "cookie",
    "password",
    "secret",
    "session",
    "token",
    "api_key",
    "apikey",
)
MAX_AUDIT_STRING_LENGTH = 512


@dataclass(frozen=True)
class PageResult[T]:
    items: list[T]
    total: int
    limit: int
    offset: int


@dataclass(frozen=True)
class DomainEventResult:
    event: DomainEvent
    created: bool


def _enum_value(value: object) -> object:
    if isinstance(value, str):
        return value
    enum_value = getattr(value, "value", None)
    return enum_value if isinstance(enum_value, str) else value


def _ensure_aware_utc(value: datetime | None) -> datetime | None:
    if value is None or value.tzinfo is not None:
        return value
    return value.replace(tzinfo=UTC)


def sanitize_audit_metadata(value: object) -> object:
    if isinstance(value, dict):
        sanitized: dict[str, object] = {}
        for raw_key, raw_value in value.items():
            key = str(raw_key)
            lowered_key = key.lower()
            if any(part in lowered_key for part in SENSITIVE_METADATA_KEY_PARTS):
                sanitized[key] = "[redacted]"
            else:
                sanitized[key] = sanitize_audit_metadata(raw_value)
        return sanitized

    if isinstance(value, list):
        return [sanitize_audit_metadata(item) for item in value[:50]]

    if isinstance(value, str):
        if len(value) > MAX_AUDIT_STRING_LENGTH:
            return f"{value[:MAX_AUDIT_STRING_LENGTH]}..."
        return value

    if value is None or isinstance(value, bool | int | float):
        return value

    return str(value)


class UserDataService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def initialize_user_defaults(self, user: User) -> None:
        await self.get_or_create_preferences(user)
        await self.get_or_create_world_profile(user)
        event_result = await self.create_domain_event(
            user,
            event_type=DomainEventType.USER_REGISTERED,
            idempotency_key=f"user.registered:{user.id}",
            payload={"source": "auth"},
        )
        if event_result.created:
            await self.create_notification(
                user,
                title="Welcome to Aetherium",
                body="Your standalone Aetherium account is ready.",
                notification_type=NotificationType.SYSTEM,
                severity=NotificationSeverity.SUCCESS,
                source_event_id=event_result.event.id,
            )
            await self.record_audit_log(
                user,
                action="user.registered",
                entity_type="user",
                entity_id=user.id,
                metadata={"source": "auth"},
            )

    async def get_or_create_preferences(self, user: User) -> UserPreferences:
        result = await self.db.execute(
            select(UserPreferences).where(UserPreferences.owner_user_id == user.id)
        )
        preferences = result.scalar_one_or_none()
        if preferences is not None:
            return preferences

        preferences = UserPreferences(
            owner_user_id=user.id,
            theme=Theme.SYSTEM.value,
            default_interface_mode=DefaultInterfaceMode.COMMAND.value,
            reduced_motion=False,
            background_music_enabled=False,
            ambient_audio_enabled=False,
            camera_effects_enabled=False,
            performance_preset=PerformancePreset.AUTOMATIC.value,
            time_zone="UTC",
            locale="en-US",
            ai_memory_enabled=False,
            product_analytics_enabled=False,
        )
        self.db.add(preferences)
        await self.db.flush()
        return preferences

    async def update_preferences(self, user: User, updates: dict[str, object]) -> UserPreferences:
        preferences = await self.get_or_create_preferences(user)
        for field_name, value in updates.items():
            setattr(preferences, field_name, _enum_value(value))

        now = datetime.now(UTC)
        preferences.updated_at = now
        await self.create_domain_event(
            user,
            event_type=DomainEventType.USER_PREFERENCE_UPDATED,
            idempotency_key=f"user.preference_updated:{user.id}:{uuid4()}",
            payload={"updatedFields": sorted(updates.keys())},
        )
        await self.record_audit_log(
            user,
            action="user.preference_updated",
            entity_type="user_preferences",
            entity_id=preferences.id,
            metadata={"updatedFields": sorted(updates.keys())},
        )
        await self.db.flush()
        return preferences

    async def get_or_create_world_profile(self, user: User) -> WorldProfile:
        result = await self.db.execute(
            select(WorldProfile).where(WorldProfile.owner_user_id == user.id)
        )
        profile = result.scalar_one_or_none()
        if profile is not None:
            return profile

        profile = WorldProfile(
            owner_user_id=user.id,
            current_location_id=DEFAULT_SPAWN_LOCATION_ID,
            last_visited_location_id=None,
            preferred_navigation_method=NavigationMethod.COMMAND_PALETTE.value,
            tutorial_completed=False,
            world_state_version=1,
            spawn_location_id=DEFAULT_SPAWN_LOCATION_ID,
            visited_location_ids=list(DEFAULT_VISITED_LOCATION_IDS),
            unlocked_location_ids=list(DEFAULT_UNLOCKED_LOCATION_IDS),
        )
        self.db.add(profile)
        await self.db.flush()
        return profile

    async def update_world_profile(self, user: User, updates: dict[str, object]) -> WorldProfile:
        profile = await self.get_or_create_world_profile(user)
        if "spawn_location_id" in updates:
            spawn_location = str(updates["spawn_location_id"])
            if spawn_location not in profile.unlocked_location_ids:
                raise AppError(
                    422,
                    "location_locked",
                    "Spawn location must already be unlocked.",
                )

        for field_name, value in updates.items():
            setattr(profile, field_name, _enum_value(value))

        profile.updated_at = datetime.now(UTC)
        await self.record_audit_log(
            user,
            action="world.profile_updated",
            entity_type="world_profile",
            entity_id=profile.id,
            metadata={"updatedFields": sorted(updates.keys())},
        )
        await self.db.flush()
        return profile

    async def visit_world_location(
        self,
        user: User,
        *,
        location_id: str,
        idempotency_key: str,
    ) -> WorldProfile:
        if location_id not in WORLD_LOCATION_IDS:
            raise AppError(422, "unknown_location", "Unknown world location.")

        profile = await self.get_or_create_world_profile(user)
        if location_id not in profile.unlocked_location_ids:
            raise AppError(403, "location_locked", "That world location is not unlocked.")

        event_result = await self.create_domain_event(
            user,
            event_type=DomainEventType.WORLD_LOCATION_VISITED,
            idempotency_key=idempotency_key,
            payload={"locationId": location_id},
        )
        if event_result.created:
            previous_location = profile.current_location_id
            profile.last_visited_location_id = previous_location
            profile.current_location_id = location_id
            if location_id not in profile.visited_location_ids:
                profile.visited_location_ids = [*profile.visited_location_ids, location_id]
            profile.updated_at = datetime.now(UTC)
            await self.record_audit_log(
                user,
                action="world.location_visited",
                entity_type="world_profile",
                entity_id=profile.id,
                metadata={"locationId": location_id},
            )
            await self.db.flush()

        return profile

    async def list_world_locations(
        self, user: User, *, state_filter: str | None = None
    ) -> list[dict[str, object]]:
        profile = await self.get_or_create_world_profile(user)
        locations = [
            self._world_location_payload(definition, profile)
            for definition in WORLD_LOCATION_DEFINITIONS
        ]
        if state_filter == "unlocked":
            return [location for location in locations if bool(location["unlocked"])]
        if state_filter == "visited":
            return [location for location in locations if bool(location["visited"])]
        return locations

    async def get_world_location(self, user: User, location_id: str) -> dict[str, object]:
        definition = get_world_location_definition(location_id)
        if definition is None:
            raise AppError(404, "not_found", "World location was not found.")
        profile = await self.get_or_create_world_profile(user)
        return self._world_location_payload(definition, profile)

    async def list_world_deep_links(self, user: User) -> list[dict[str, object]]:
        await self.get_or_create_world_profile(user)
        return [
            {
                "locationId": definition.id.value,
                "label": definition.title,
                "commandRoute": definition.command_route,
                "routePattern": f"{definition.command_route}{{?entityId,sourceId}}",
                "entityTypes": list(definition.deep_link_entity_types),
                "notes": (
                    "Command Mode route used by future World Mode deep links. Entity IDs are "
                    "resolved by owner-scoped APIs before navigation."
                ),
            }
            for definition in WORLD_LOCATION_DEFINITIONS
        ]

    async def get_world_scene_manifest(self, user: User) -> dict[str, object]:
        await self.get_or_create_world_profile(user)
        return {
            "manifestVersion": 1,
            "implementationStatus": "data_contract_only",
            "visualRuntimeAvailable": False,
            "locations": [
                {
                    "locationId": definition.id.value,
                    "title": definition.title,
                    "futureSceneKey": definition.future_scene_key,
                    "commandRoute": definition.command_route,
                    "implementationStatus": definition.visual_status.value,
                    "assetBundleKey": None,
                    "allowedToRender": False,
                    "disabledReason": (
                        "Visual World Mode is intentionally not implemented in this phase."
                    ),
                }
                for definition in WORLD_LOCATION_DEFINITIONS
            ],
        }

    def get_world_feature_flags(self) -> dict[str, object]:
        return {
            "dataContractsEnabled": True,
            "visualWorldEnabled": False,
            "sceneManifestEnabled": True,
            "commandModeFallbackRequired": True,
            "reason": (
                "Phase 18 exposes only non-visual world data contracts. Command Mode remains the "
                "active interface until the visual 3D phase begins."
            ),
        }

    async def create_domain_event(
        self,
        user: User,
        *,
        event_type: DomainEventType,
        idempotency_key: str,
        payload: dict[str, Any],
    ) -> DomainEventResult:
        existing = await self.get_domain_event_by_idempotency_key(user, idempotency_key)
        if existing is not None:
            return DomainEventResult(event=existing, created=False)

        event = DomainEvent(
            owner_user_id=user.id,
            event_type=event_type.value,
            idempotency_key=idempotency_key,
            payload=payload,
            occurred_at=datetime.now(UTC),
        )
        self.db.add(event)
        await self.db.flush()
        return DomainEventResult(event=event, created=True)

    async def get_domain_event_by_idempotency_key(
        self, user: User, idempotency_key: str
    ) -> DomainEvent | None:
        result = await self.db.execute(
            select(DomainEvent).where(
                DomainEvent.owner_user_id == user.id,
                DomainEvent.idempotency_key == idempotency_key,
            )
        )
        return result.scalar_one_or_none()

    async def list_domain_events(
        self,
        user: User,
        pagination: PaginationParams,
        event_type: DomainEventType | None = None,
    ) -> PageResult[DomainEvent]:
        predicates = [DomainEvent.owner_user_id == user.id]
        if event_type is not None:
            predicates.append(DomainEvent.event_type == event_type.value)

        total = await self._count(select(func.count(DomainEvent.id)).where(*predicates))
        result = await self.db.execute(
            select(DomainEvent)
            .where(*predicates)
            .order_by(DomainEvent.occurred_at.desc(), DomainEvent.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def create_notification(
        self,
        user: User,
        *,
        title: str,
        body: str,
        notification_type: NotificationType,
        severity: NotificationSeverity,
        source_event_id: UUID | None = None,
        action_url: str | None = None,
    ) -> Notification:
        notification = Notification(
            owner_user_id=user.id,
            source_event_id=source_event_id,
            notification_type=notification_type.value,
            severity=severity.value,
            title=title,
            body=body,
            action_url=action_url,
        )
        self.db.add(notification)
        await self.db.flush()
        return notification

    async def list_notifications(
        self,
        user: User,
        pagination: PaginationParams,
        unread_only: bool = False,
    ) -> tuple[PageResult[Notification], int]:
        predicates = [Notification.owner_user_id == user.id]
        if unread_only:
            predicates.append(Notification.read_at.is_(None))

        total = await self._count(select(func.count(Notification.id)).where(*predicates))
        unread_count = await self._count(
            select(func.count(Notification.id)).where(
                Notification.owner_user_id == user.id,
                Notification.read_at.is_(None),
            )
        )
        result = await self.db.execute(
            select(Notification)
            .where(*predicates)
            .order_by(Notification.created_at.desc(), Notification.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return (
            PageResult(
                items=list(result.scalars().all()),
                total=total,
                limit=pagination.limit,
                offset=pagination.offset,
            ),
            unread_count,
        )

    async def mark_notification_read(self, user: User, notification_id: UUID) -> Notification:
        result = await self.db.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.owner_user_id == user.id,
            )
        )
        notification = result.scalar_one_or_none()
        if notification is None:
            raise AppError(404, "not_found", "Notification was not found.")

        if notification.read_at is None:
            now = datetime.now(UTC)
            notification.read_at = now
            notification.updated_at = now
            await self.record_audit_log(
                user,
                action="notification.read",
                entity_type="notification",
                entity_id=notification.id,
                metadata={"notificationType": notification.notification_type},
            )
            await self.db.flush()

        notification.read_at = _ensure_aware_utc(notification.read_at)
        return notification

    async def mark_all_notifications_read(self, user: User) -> int:
        result = await self.db.execute(
            select(Notification).where(
                Notification.owner_user_id == user.id,
                Notification.read_at.is_(None),
            )
        )
        notifications = list(result.scalars().all())
        if not notifications:
            return 0

        now = datetime.now(UTC)
        for notification in notifications:
            notification.read_at = now
            notification.updated_at = now

        await self.record_audit_log(
            user,
            action="notification.read_all",
            entity_type="notification",
            metadata={"count": len(notifications)},
        )
        await self.db.flush()
        return len(notifications)

    async def record_audit_log(
        self,
        user: User,
        *,
        action: str,
        entity_type: str | None = None,
        entity_id: UUID | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> AuditLog:
        sanitized = sanitize_audit_metadata(metadata or {})
        audit_log = AuditLog(
            owner_user_id=user.id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata_json=sanitized if isinstance(sanitized, dict) else {},
        )
        self.db.add(audit_log)
        await self.db.flush()
        return audit_log

    async def list_audit_logs(
        self, user: User, pagination: PaginationParams
    ) -> PageResult[AuditLog]:
        total = await self._count(
            select(func.count(AuditLog.id)).where(AuditLog.owner_user_id == user.id)
        )
        result = await self.db.execute(
            select(AuditLog)
            .where(AuditLog.owner_user_id == user.id)
            .order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def _count(self, query: Select[tuple[int]]) -> int:
        value = await self.db.scalar(query)
        return int(value or 0)

    def _world_location_payload(
        self, definition: WorldLocationDefinition, profile: WorldProfile
    ) -> dict[str, object]:
        unlocked_ids = set(profile.unlocked_location_ids)
        visited_ids = set(profile.visited_location_ids)
        location_id = definition.id.value
        return {
            "id": location_id,
            "title": definition.title,
            "subtitle": definition.subtitle,
            "description": definition.description,
            "category": definition.category.value,
            "commandRoute": definition.command_route,
            "futureSceneKey": definition.future_scene_key,
            "visualStatus": definition.visual_status.value,
            "defaultUnlocked": definition.default_unlocked,
            "unlocked": location_id in unlocked_ids,
            "visited": location_id in visited_ids,
            "current": profile.current_location_id == location_id,
            "spawn": profile.spawn_location_id == location_id,
            "deepLinkEntityTypes": list(definition.deep_link_entity_types),
            "unlockDependencyIds": [
                dependency_id.value for dependency_id in definition.unlock_dependency_ids
            ],
        }
