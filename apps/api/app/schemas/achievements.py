from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domain.achievements import AchievementCategory, AchievementRarity, RewardType


class AchievementSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class RewardDefinitionResponse(AchievementSchema):
    id: UUID
    reward_type: RewardType = Field(alias="rewardType")
    title: str
    description: str
    metadata_json: dict[str, Any] = Field(
        validation_alias="metadata_json",
        serialization_alias="metadata",
    )


class WorldUnlockResponse(AchievementSchema):
    id: UUID
    achievement_definition_id: UUID = Field(alias="achievementDefinitionId")
    reward_definition_id: UUID = Field(alias="rewardDefinitionId")
    location_id: str = Field(alias="locationId")
    unlock_source: str = Field(alias="unlockSource")
    unlocked_at: datetime = Field(alias="unlockedAt")


class AchievementProgressResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    definition_id: UUID = Field(alias="definitionId")
    slug: str
    title: str
    description: str
    category: AchievementCategory
    rarity: AchievementRarity
    points: int
    progress_count: int = Field(alias="progressCount")
    target_count: int = Field(alias="targetCount")
    unlocked_at: datetime | None = Field(alias="unlockedAt")
    rewards: list[RewardDefinitionResponse]
    world_unlocks: list[WorldUnlockResponse] = Field(alias="worldUnlocks")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class AchievementPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[AchievementProgressResponse]
    total: int
    limit: int
    offset: int


class AchievementSummaryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    total_achievements: int = Field(alias="totalAchievements")
    unlocked_count: int = Field(alias="unlockedCount")
    locked_count: int = Field(alias="lockedCount")
    total_points: int = Field(alias="totalPoints")
    unlocked_points: int = Field(alias="unlockedPoints")
    recent_unlocks: list[AchievementProgressResponse] = Field(alias="recentUnlocks")
    world_unlocks: list[WorldUnlockResponse] = Field(alias="worldUnlocks")


class AchievementProcessResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    processed_event_count: int = Field(alias="processedEventCount")
    new_unlock_count: int = Field(alias="newUnlockCount")
    unlocked: list[AchievementProgressResponse]
