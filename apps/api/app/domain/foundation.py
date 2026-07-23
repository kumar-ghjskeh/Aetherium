from enum import StrEnum

from app.domain.world import (
    DEFAULT_SPAWN_LOCATION_ID,
    DEFAULT_UNLOCKED_LOCATION_IDS,
    DEFAULT_VISITED_LOCATION_IDS,
    WORLD_LOCATION_IDS,
    WorldLocationId,
)

__all__ = [
    "DEFAULT_SPAWN_LOCATION_ID",
    "DEFAULT_UNLOCKED_LOCATION_IDS",
    "DEFAULT_VISITED_LOCATION_IDS",
    "WORLD_LOCATION_IDS",
    "DefaultInterfaceMode",
    "DomainEventType",
    "NavigationMethod",
    "NotificationSeverity",
    "NotificationType",
    "PerformancePreset",
    "Theme",
    "WorldLocationId",
]


class Theme(StrEnum):
    SYSTEM = "system"
    LIGHT = "light"
    DARK = "dark"


class DefaultInterfaceMode(StrEnum):
    COMMAND = "command"
    WORLD = "world"


class PerformancePreset(StrEnum):
    AUTOMATIC = "automatic"
    LOW = "low"
    BALANCED = "balanced"
    HIGH = "high"


class NavigationMethod(StrEnum):
    COMMAND_PALETTE = "command_palette"
    FAST_TRAVEL = "fast_travel"
    GUIDED = "guided"
    DIRECT = "direct"


class DomainEventType(StrEnum):
    USER_REGISTERED = "user.registered"
    USER_PREFERENCE_UPDATED = "user.preference_updated"
    FILE_UPLOADED = "file.uploaded"
    FILE_INGESTED = "file.ingested"
    HABIT_LOGGED = "habit.logged"
    LESSON_COMPLETED = "lesson.completed"
    QUIZ_COMPLETED = "quiz.completed"
    PROJECT_COMPLETED = "project.completed"
    ACHIEVEMENT_UNLOCKED = "achievement.unlocked"
    WORLD_LOCATION_VISITED = "world.location_visited"


class NotificationType(StrEnum):
    SYSTEM = "system"
    SECURITY = "security"
    PROCESSING = "processing"
    REVIEW = "review"
    AI = "ai"
    PROJECT = "project"


class NotificationSeverity(StrEnum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
