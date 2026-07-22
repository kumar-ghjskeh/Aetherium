from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import PaginationParams
from app.domain.achievements import DEFAULT_ACHIEVEMENTS, RewardType, WorldUnlockSource
from app.domain.foundation import DomainEventType, NotificationSeverity, NotificationType
from app.models.achievements import (
    AchievementDefinition,
    AchievementProcessedEvent,
    AchievementProgressCounter,
    AchievementRule,
    RewardDefinition,
    UserAchievement,
    WorldUnlockRecord,
)
from app.models.auth import User
from app.models.foundation import DomainEvent
from app.services.foundation import PageResult, UserDataService


@dataclass(frozen=True)
class AchievementProgressItem:
    definition: AchievementDefinition
    progress_count: int
    target_count: int
    unlocked_at: datetime | None
    rewards: list[RewardDefinition]
    world_unlocks: list[WorldUnlockRecord]


@dataclass(frozen=True)
class AchievementSummary:
    total_achievements: int
    unlocked_count: int
    locked_count: int
    total_points: int
    unlocked_points: int
    recent_unlocks: list[AchievementProgressItem]
    world_unlocks: list[WorldUnlockRecord]


@dataclass(frozen=True)
class AchievementProcessResult:
    processed_event_count: int
    new_unlock_count: int
    unlocked: list[AchievementProgressItem]


class AchievementService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_data = UserDataService(db)

    async def ensure_default_definitions(self) -> None:
        existing_result = await self.db.execute(select(AchievementDefinition))
        definitions_by_slug = {
            definition.slug: definition for definition in existing_result.scalars().all()
        }

        for default in DEFAULT_ACHIEVEMENTS:
            definition = definitions_by_slug.get(default.slug)
            if definition is None:
                definition = AchievementDefinition(
                    slug=default.slug,
                    title=default.title,
                    description=default.description,
                    category=default.category.value,
                    rarity=default.rarity.value,
                    points=default.points,
                    is_active=True,
                )
                self.db.add(definition)
                await self.db.flush()
                definitions_by_slug[default.slug] = definition
            else:
                definition.title = default.title
                definition.description = default.description
                definition.category = default.category.value
                definition.rarity = default.rarity.value
                definition.points = default.points
                definition.is_active = True

            if default.rule is not None:
                rule = await self._get_rule(
                    definition.id,
                    event_type=default.rule.event_type.value,
                    counter_key=default.rule.counter_key,
                )
                if rule is None:
                    self.db.add(
                        AchievementRule(
                            achievement_definition_id=definition.id,
                            event_type=default.rule.event_type.value,
                            counter_key=default.rule.counter_key,
                            threshold_count=default.rule.threshold,
                            payload_filters={},
                            is_active=True,
                        )
                    )
                else:
                    rule.threshold_count = default.rule.threshold
                    rule.payload_filters = {}
                    rule.is_active = True

            badge = await self._get_reward(definition.id, RewardType.BADGE.value)
            if badge is None:
                self.db.add(
                    RewardDefinition(
                        achievement_definition_id=definition.id,
                        reward_type=RewardType.BADGE.value,
                        title=f"{default.title} badge",
                        description=(
                            "Permanent achievement marker in the non-visual progression record."
                        ),
                        metadata_json={"slug": default.slug},
                    )
                )
            else:
                badge.title = f"{default.title} badge"
                badge.description = (
                    "Permanent achievement marker in the non-visual progression record."
                )
                badge.metadata_json = {"slug": default.slug}

            if default.world_unlock_id is not None:
                reward = await self._get_reward(definition.id, RewardType.WORLD_UNLOCK.value)
                metadata = {"locationId": default.world_unlock_id}
                if reward is None:
                    self.db.add(
                        RewardDefinition(
                            achievement_definition_id=definition.id,
                            reward_type=RewardType.WORLD_UNLOCK.value,
                            title=f"{default.title} future world unlock",
                            description=(
                                "Stores a future world destination identifier without rendering it."
                            ),
                            metadata_json=metadata,
                        )
                    )
                else:
                    reward.title = f"{default.title} future world unlock"
                    reward.description = (
                        "Stores a future world destination identifier without rendering it."
                    )
                    reward.metadata_json = metadata

        await self.db.flush()

    async def list_achievements(
        self,
        user: User,
        pagination: PaginationParams,
        *,
        unlocked_only: bool = False,
    ) -> PageResult[AchievementProgressItem]:
        await self.ensure_default_definitions()
        predicates = [AchievementDefinition.is_active.is_(True)]
        if unlocked_only:
            predicates.append(UserAchievement.id.is_not(None))

        total = await self._count(
            select(func.count(AchievementDefinition.id))
            .select_from(AchievementDefinition)
            .outerjoin(
                UserAchievement,
                (UserAchievement.achievement_definition_id == AchievementDefinition.id)
                & (UserAchievement.owner_user_id == user.id),
            )
            .where(*predicates)
        )
        result = await self.db.execute(
            select(AchievementDefinition, UserAchievement)
            .outerjoin(
                UserAchievement,
                (UserAchievement.achievement_definition_id == AchievementDefinition.id)
                & (UserAchievement.owner_user_id == user.id),
            )
            .where(*predicates)
            .order_by(
                UserAchievement.unlocked_at.desc().nullslast(),
                AchievementDefinition.category.asc(),
                AchievementDefinition.title.asc(),
            )
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        items = [
            await self._progress_item(user, definition, user_achievement)
            for definition, user_achievement in result.all()
        ]
        return PageResult(
            items=items, total=total, limit=pagination.limit, offset=pagination.offset
        )

    async def get_summary(self, user: User) -> AchievementSummary:
        await self.ensure_default_definitions()
        all_items_page = await self.list_achievements(
            user, PaginationParams(limit=100, offset=0), unlocked_only=False
        )
        all_items = all_items_page.items
        unlocked_items = [item for item in all_items if item.unlocked_at is not None]
        world_unlocks = await self._list_world_unlocks(user, limit=100)
        return AchievementSummary(
            total_achievements=all_items_page.total,
            unlocked_count=len(unlocked_items),
            locked_count=max(0, all_items_page.total - len(unlocked_items)),
            total_points=sum(item.definition.points for item in all_items),
            unlocked_points=sum(item.definition.points for item in unlocked_items),
            recent_unlocks=sorted(
                unlocked_items,
                key=lambda item: item.unlocked_at or datetime.min.replace(tzinfo=UTC),
                reverse=True,
            )[:5],
            world_unlocks=world_unlocks,
        )

    async def process_pending_events(
        self, user: User, *, limit: int = 100
    ) -> AchievementProcessResult:
        await self.ensure_default_definitions()
        rules = await self._active_rules()
        if not rules:
            return AchievementProcessResult(
                processed_event_count=0,
                new_unlock_count=0,
                unlocked=[],
            )

        event_types = sorted({rule.event_type for rule, _definition in rules})
        result = await self.db.execute(
            select(DomainEvent)
            .where(
                DomainEvent.owner_user_id == user.id,
                DomainEvent.event_type.in_(event_types),
            )
            .order_by(DomainEvent.occurred_at.asc(), DomainEvent.id.asc())
            .limit(limit)
        )

        processed_count = 0
        unlocked: list[AchievementProgressItem] = []
        for event in result.scalars().all():
            for rule, definition in rules:
                if rule.event_type != event.event_type:
                    continue
                if not _payload_matches(event.payload, rule.payload_filters):
                    continue
                was_processed = await self._processed_event_exists(user, event.id, rule.id)
                if was_processed:
                    continue
                await self._mark_processed(user, event.id, rule.id)
                processed_count += 1
                counter = await self._increment_counter(user, rule, event)
                if counter.count >= rule.threshold_count:
                    unlocked_item = await self._unlock_achievement(
                        user,
                        definition,
                        source_event=event,
                        progress_count=counter.count,
                        target_count=rule.threshold_count,
                    )
                    if unlocked_item is not None:
                        unlocked.append(unlocked_item)

        await self.db.flush()
        return AchievementProcessResult(
            processed_event_count=processed_count,
            new_unlock_count=len(unlocked),
            unlocked=unlocked,
        )

    async def _unlock_achievement(
        self,
        user: User,
        definition: AchievementDefinition,
        *,
        source_event: DomainEvent,
        progress_count: int,
        target_count: int,
    ) -> AchievementProgressItem | None:
        existing = await self._get_user_achievement(user, definition.id)
        if existing is not None:
            return None

        now = datetime.now(UTC)
        user_achievement = UserAchievement(
            owner_user_id=user.id,
            achievement_definition_id=definition.id,
            source_event_id=source_event.id,
            progress_count=progress_count,
            target_count=target_count,
            unlocked_at=now,
        )
        self.db.add(user_achievement)
        await self.db.flush()

        rewards = await self._list_rewards(definition.id)
        for reward in rewards:
            if reward.reward_type != RewardType.WORLD_UNLOCK.value:
                continue
            location_id = reward.metadata_json.get("locationId")
            if isinstance(location_id, str) and location_id:
                await self._create_world_unlock(
                    user,
                    definition,
                    reward,
                    location_id=location_id,
                    unlocked_at=now,
                )

        event = await self.user_data.create_domain_event(
            user,
            event_type=DomainEventType.ACHIEVEMENT_UNLOCKED,
            idempotency_key=f"achievement.unlocked:{definition.slug}:{user.id}",
            payload={
                "achievementId": str(definition.id),
                "achievementSlug": definition.slug,
                "sourceEventId": str(source_event.id),
            },
        )
        if event.created:
            await self.user_data.create_notification(
                user,
                title="Achievement unlocked",
                body=f"{definition.title} is now part of your progression record.",
                notification_type=NotificationType.SYSTEM,
                severity=NotificationSeverity.SUCCESS,
                source_event_id=event.event.id,
                action_url=f"/app/achievements?achievement={definition.slug}",
            )
        await self.user_data.record_audit_log(
            user,
            action="achievement.unlocked",
            entity_type="achievement",
            entity_id=definition.id,
            metadata={"achievementSlug": definition.slug, "sourceEventId": str(source_event.id)},
        )
        return await self._progress_item(user, definition, user_achievement)

    async def _create_world_unlock(
        self,
        user: User,
        definition: AchievementDefinition,
        reward: RewardDefinition,
        *,
        location_id: str,
        unlocked_at: datetime,
    ) -> WorldUnlockRecord:
        result = await self.db.execute(
            select(WorldUnlockRecord).where(
                WorldUnlockRecord.owner_user_id == user.id,
                WorldUnlockRecord.location_id == location_id,
            )
        )
        existing = result.scalar_one_or_none()
        if existing is not None:
            return existing

        unlock = WorldUnlockRecord(
            owner_user_id=user.id,
            achievement_definition_id=definition.id,
            reward_definition_id=reward.id,
            location_id=location_id,
            unlock_source=WorldUnlockSource.ACHIEVEMENT.value,
            unlocked_at=unlocked_at,
        )
        self.db.add(unlock)
        await self.db.flush()
        return unlock

    async def _progress_item(
        self,
        user: User,
        definition: AchievementDefinition,
        user_achievement: UserAchievement | None,
    ) -> AchievementProgressItem:
        rewards = await self._list_rewards(definition.id)
        world_unlocks = await self._list_world_unlocks(user, definition_id=definition.id, limit=20)
        if user_achievement is not None:
            return AchievementProgressItem(
                definition=definition,
                progress_count=user_achievement.progress_count,
                target_count=user_achievement.target_count,
                unlocked_at=user_achievement.unlocked_at,
                rewards=rewards,
                world_unlocks=world_unlocks,
            )

        rule = await self._first_rule(definition.id)
        progress_count = 0
        target_count = 1
        if rule is not None:
            target_count = rule.threshold_count
            counter = await self._get_counter(user, rule.id)
            progress_count = counter.count if counter is not None else 0

        return AchievementProgressItem(
            definition=definition,
            progress_count=progress_count,
            target_count=target_count,
            unlocked_at=None,
            rewards=rewards,
            world_unlocks=world_unlocks,
        )

    async def search_achievements(
        self,
        user: User,
        *,
        query: str,
        limit: int,
    ) -> tuple[list[AchievementProgressItem], int]:
        await self.ensure_default_definitions()
        predicates = [
            AchievementDefinition.is_active.is_(True),
            or_(
                func.lower(AchievementDefinition.title).like(f"%{query.casefold()}%"),
                func.lower(AchievementDefinition.description).like(f"%{query.casefold()}%"),
                func.lower(AchievementDefinition.category).like(f"%{query.casefold()}%"),
            ),
        ]
        total = await self._count(select(func.count(AchievementDefinition.id)).where(*predicates))
        result = await self.db.execute(
            select(AchievementDefinition, UserAchievement)
            .outerjoin(
                UserAchievement,
                (UserAchievement.achievement_definition_id == AchievementDefinition.id)
                & (UserAchievement.owner_user_id == user.id),
            )
            .where(*predicates)
            .order_by(AchievementDefinition.title.asc())
            .limit(limit)
        )
        items = [
            await self._progress_item(user, definition, user_achievement)
            for definition, user_achievement in result.all()
        ]
        return items, total

    async def _active_rules(self) -> list[tuple[AchievementRule, AchievementDefinition]]:
        result = await self.db.execute(
            select(AchievementRule, AchievementDefinition)
            .join(
                AchievementDefinition,
                AchievementDefinition.id == AchievementRule.achievement_definition_id,
            )
            .where(AchievementRule.is_active.is_(True), AchievementDefinition.is_active.is_(True))
            .order_by(AchievementRule.created_at.asc(), AchievementRule.id.asc())
        )
        return [(rule, definition) for rule, definition in result.all()]

    async def _increment_counter(
        self,
        user: User,
        rule: AchievementRule,
        event: DomainEvent,
    ) -> AchievementProgressCounter:
        counter = await self._get_counter(user, rule.id)
        if counter is None:
            counter = AchievementProgressCounter(
                owner_user_id=user.id,
                achievement_rule_id=rule.id,
                counter_key=rule.counter_key,
                count=0,
            )
            self.db.add(counter)
            await self.db.flush()

        counter.count += 1
        counter.last_event_id = event.id
        counter.updated_at = datetime.now(UTC)
        await self.db.flush()
        return counter

    async def _mark_processed(self, user: User, event_id: UUID, rule_id: UUID) -> None:
        self.db.add(
            AchievementProcessedEvent(
                owner_user_id=user.id,
                domain_event_id=event_id,
                achievement_rule_id=rule_id,
            )
        )
        await self.db.flush()

    async def _processed_event_exists(self, user: User, event_id: UUID, rule_id: UUID) -> bool:
        result = await self.db.execute(
            select(AchievementProcessedEvent.id).where(
                AchievementProcessedEvent.owner_user_id == user.id,
                AchievementProcessedEvent.domain_event_id == event_id,
                AchievementProcessedEvent.achievement_rule_id == rule_id,
            )
        )
        return result.scalar_one_or_none() is not None

    async def _get_user_achievement(
        self, user: User, definition_id: UUID
    ) -> UserAchievement | None:
        result = await self.db.execute(
            select(UserAchievement).where(
                UserAchievement.owner_user_id == user.id,
                UserAchievement.achievement_definition_id == definition_id,
            )
        )
        return result.scalar_one_or_none()

    async def _get_counter(self, user: User, rule_id: UUID) -> AchievementProgressCounter | None:
        result = await self.db.execute(
            select(AchievementProgressCounter).where(
                AchievementProgressCounter.owner_user_id == user.id,
                AchievementProgressCounter.achievement_rule_id == rule_id,
            )
        )
        return result.scalar_one_or_none()

    async def _first_rule(self, definition_id: UUID) -> AchievementRule | None:
        result = await self.db.execute(
            select(AchievementRule)
            .where(
                AchievementRule.achievement_definition_id == definition_id,
                AchievementRule.is_active.is_(True),
            )
            .order_by(AchievementRule.threshold_count.asc(), AchievementRule.created_at.asc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def _get_rule(
        self,
        definition_id: UUID,
        *,
        event_type: str,
        counter_key: str,
    ) -> AchievementRule | None:
        result = await self.db.execute(
            select(AchievementRule).where(
                AchievementRule.achievement_definition_id == definition_id,
                AchievementRule.event_type == event_type,
                AchievementRule.counter_key == counter_key,
            )
        )
        return result.scalar_one_or_none()

    async def _get_reward(self, definition_id: UUID, reward_type: str) -> RewardDefinition | None:
        result = await self.db.execute(
            select(RewardDefinition).where(
                RewardDefinition.achievement_definition_id == definition_id,
                RewardDefinition.reward_type == reward_type,
            )
        )
        return result.scalar_one_or_none()

    async def _list_rewards(self, definition_id: UUID) -> list[RewardDefinition]:
        result = await self.db.execute(
            select(RewardDefinition)
            .where(RewardDefinition.achievement_definition_id == definition_id)
            .order_by(RewardDefinition.reward_type.asc())
        )
        return list(result.scalars().all())

    async def _list_world_unlocks(
        self,
        user: User,
        *,
        definition_id: UUID | None = None,
        limit: int,
    ) -> list[WorldUnlockRecord]:
        predicates = [WorldUnlockRecord.owner_user_id == user.id]
        if definition_id is not None:
            predicates.append(WorldUnlockRecord.achievement_definition_id == definition_id)
        result = await self.db.execute(
            select(WorldUnlockRecord)
            .where(*predicates)
            .order_by(WorldUnlockRecord.unlocked_at.desc(), WorldUnlockRecord.id.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def _count(self, query: Select[tuple[int]]) -> int:
        value = await self.db.scalar(query)
        return int(value or 0)


def _payload_matches(payload: dict[str, object], filters: dict[str, object]) -> bool:
    return all(payload.get(key) == expected_value for key, expected_value in filters.items())
