from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

from app.domain.foundation import DomainEventType


class AchievementCategory(StrEnum):
    FILES = "files"
    HABITS = "habits"
    LEARNING = "learning"
    PROJECTS = "projects"
    CODING = "coding"


class AchievementRarity(StrEnum):
    COMMON = "common"
    FOCUSED = "focused"
    MILESTONE = "milestone"


class RewardType(StrEnum):
    BADGE = "badge"
    WORLD_UNLOCK = "world_unlock"


class WorldUnlockSource(StrEnum):
    ACHIEVEMENT = "achievement"


@dataclass(frozen=True)
class DefaultAchievementRule:
    event_type: DomainEventType
    threshold: int
    counter_key: str


@dataclass(frozen=True)
class DefaultAchievement:
    slug: str
    title: str
    description: str
    category: AchievementCategory
    rarity: AchievementRarity
    points: int
    rule: DefaultAchievementRule | None
    world_unlock_id: str | None


DEFAULT_ACHIEVEMENTS: tuple[DefaultAchievement, ...] = (
    DefaultAchievement(
        slug="first-file",
        title="First File",
        description="Upload your first Personal Vault file.",
        category=AchievementCategory.FILES,
        rarity=AchievementRarity.COMMON,
        points=10,
        rule=DefaultAchievementRule(
            event_type=DomainEventType.FILE_UPLOADED,
            threshold=1,
            counter_key="file.uploaded",
        ),
        world_unlock_id="achievement_hall:first_file_display",
    ),
    DefaultAchievement(
        slug="deep-reader",
        title="Deep Reader",
        description="Complete ingestion for three vault files.",
        category=AchievementCategory.FILES,
        rarity=AchievementRarity.FOCUSED,
        points=35,
        rule=DefaultAchievementRule(
            event_type=DomainEventType.FILE_INGESTED,
            threshold=3,
            counter_key="file.ingested",
        ),
        world_unlock_id="knowledge_observatory:source_stars",
    ),
    DefaultAchievement(
        slug="seven-day-rhythm",
        title="Seven-Day Rhythm",
        description="Log seven meaningful habit completions.",
        category=AchievementCategory.HABITS,
        rarity=AchievementRarity.FOCUSED,
        points=40,
        rule=DefaultAchievementRule(
            event_type=DomainEventType.HABIT_LOGGED,
            threshold=7,
            counter_key="habit.logged",
        ),
        world_unlock_id="habit_garden:rhythm_path",
    ),
    DefaultAchievement(
        slug="project-builder",
        title="Project Builder",
        description="Complete your first project.",
        category=AchievementCategory.PROJECTS,
        rarity=AchievementRarity.MILESTONE,
        points=50,
        rule=DefaultAchievementRule(
            event_type=DomainEventType.PROJECT_COMPLETED,
            threshold=1,
            counter_key="project.completed",
        ),
        world_unlock_id="achievement_hall:project_exhibit",
    ),
    DefaultAchievement(
        slug="quiz-explorer",
        title="Quiz Explorer",
        description="Complete three quizzes.",
        category=AchievementCategory.LEARNING,
        rarity=AchievementRarity.FOCUSED,
        points=30,
        rule=DefaultAchievementRule(
            event_type=DomainEventType.QUIZ_COMPLETED,
            threshold=3,
            counter_key="quiz.completed",
        ),
        world_unlock_id="research_laboratory:quiz_table",
    ),
    DefaultAchievement(
        slug="memory-master",
        title="Memory Master",
        description="Complete five lessons and reinforce your learning path.",
        category=AchievementCategory.LEARNING,
        rarity=AchievementRarity.MILESTONE,
        points=60,
        rule=DefaultAchievementRule(
            event_type=DomainEventType.LESSON_COMPLETED,
            threshold=5,
            counter_key="lesson.completed",
        ),
        world_unlock_id="knowledge_observatory:review_constellation",
    ),
    DefaultAchievement(
        slug="coding-starter",
        title="Coding Starter",
        description="Reserved for the coding workspace foundation; no coding event exists yet.",
        category=AchievementCategory.CODING,
        rarity=AchievementRarity.COMMON,
        points=0,
        rule=None,
        world_unlock_id=None,
    ),
)
