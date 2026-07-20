from enum import StrEnum


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


class WorldLocationId(StrEnum):
    CENTRAL_PLAZA = "central_plaza"
    LIBRARY = "library"
    AI_HALL = "ai_hall"
    PROGRAMMING_TOWER = "programming_tower"
    RESEARCH_LABORATORY = "research_laboratory"
    HABIT_GARDEN = "habit_garden"
    COMMAND_CENTER = "command_center"
    PERSONAL_HOME = "personal_home"
    ACHIEVEMENT_HALL = "achievement_hall"
    KNOWLEDGE_OBSERVATORY = "knowledge_observatory"
    PROJECT_WORKSHOP = "project_workshop"
    MEDIA_THEATER = "media_theater"


WORLD_LOCATION_IDS = frozenset(location.value for location in WorldLocationId)
DEFAULT_SPAWN_LOCATION_ID = WorldLocationId.CENTRAL_PLAZA.value
DEFAULT_VISITED_LOCATION_IDS = (WorldLocationId.CENTRAL_PLAZA.value,)
DEFAULT_UNLOCKED_LOCATION_IDS = (
    WorldLocationId.CENTRAL_PLAZA.value,
    WorldLocationId.LIBRARY.value,
    WorldLocationId.HABIT_GARDEN.value,
    WorldLocationId.COMMAND_CENTER.value,
)


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
