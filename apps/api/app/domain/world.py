from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


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


class WorldLocationCategory(StrEnum):
    HUB = "hub"
    VAULT = "vault"
    AI = "ai"
    CODING = "coding"
    LEARNING = "learning"
    HABITS = "habits"
    COMMAND = "command"
    PROFILE = "profile"
    ACHIEVEMENTS = "achievements"
    KNOWLEDGE = "knowledge"
    MEDIA = "media"
    PROJECTS = "projects"


class WorldVisualStatus(StrEnum):
    DATA_CONTRACT_READY = "data_contract_ready"
    FUTURE_VISUAL_IMPLEMENTATION = "future_visual_implementation"


@dataclass(frozen=True)
class WorldLocationDefinition:
    id: WorldLocationId
    title: str
    subtitle: str
    description: str
    category: WorldLocationCategory
    command_route: str
    future_scene_key: str
    default_unlocked: bool
    visual_status: WorldVisualStatus
    deep_link_entity_types: tuple[str, ...]
    unlock_dependency_ids: tuple[WorldLocationId, ...] = ()


WORLD_LOCATION_DEFINITIONS: tuple[WorldLocationDefinition, ...] = (
    WorldLocationDefinition(
        id=WorldLocationId.CENTRAL_PLAZA,
        title="Central Plaza",
        subtitle="Daily command hub",
        description=(
            "Spawn and overview location for daily status, continuation, notifications, "
            "and navigation."
        ),
        category=WorldLocationCategory.HUB,
        command_route="/app",
        future_scene_key="central-plaza",
        default_unlocked=True,
        visual_status=WorldVisualStatus.DATA_CONTRACT_READY,
        deep_link_entity_types=("dashboard", "notification", "domain_event"),
    ),
    WorldLocationDefinition(
        id=WorldLocationId.LIBRARY,
        title="Knowledge Library",
        subtitle="Personal Vault and sources",
        description=(
            "Destination for files, collections, tags, chunks, and citation-backed "
            "document workflows."
        ),
        category=WorldLocationCategory.VAULT,
        command_route="/app/library",
        future_scene_key="knowledge-library",
        default_unlocked=True,
        visual_status=WorldVisualStatus.DATA_CONTRACT_READY,
        deep_link_entity_types=("file", "file_chunk", "collection", "tag"),
    ),
    WorldLocationDefinition(
        id=WorldLocationId.AI_HALL,
        title="AI Observatory",
        subtitle="Mentors and conversations",
        description=(
            "Destination for fictional AI mentors, conversations, consent controls, "
            "and document Q&A."
        ),
        category=WorldLocationCategory.AI,
        command_route="/app/ai",
        future_scene_key="ai-observatory",
        default_unlocked=False,
        visual_status=WorldVisualStatus.DATA_CONTRACT_READY,
        deep_link_entity_types=("ai_conversation", "mentor", "ai_usage"),
    ),
    WorldLocationDefinition(
        id=WorldLocationId.PROGRAMMING_TOWER,
        title="Coding Arena",
        subtitle="Safe coding workspace",
        description=(
            "Destination for snippets, exercises, code assistant records, and the "
            "unavailable code-runner contract."
        ),
        category=WorldLocationCategory.CODING,
        command_route="/app/coding",
        future_scene_key="coding-arena",
        default_unlocked=False,
        visual_status=WorldVisualStatus.DATA_CONTRACT_READY,
        deep_link_entity_types=("code_snippet", "coding_exercise", "project_file"),
    ),
    WorldLocationDefinition(
        id=WorldLocationId.RESEARCH_LABORATORY,
        title="Learning Academy",
        subtitle="Subjects and mastery",
        description=(
            "Destination for topics, courses, quizzes, flashcards, study sessions, and "
            "transparent mastery records."
        ),
        category=WorldLocationCategory.LEARNING,
        command_route="/app/learning",
        future_scene_key="learning-academy",
        default_unlocked=False,
        visual_status=WorldVisualStatus.DATA_CONTRACT_READY,
        deep_link_entity_types=("learning_topic", "course", "lesson", "quiz", "flashcard"),
    ),
    WorldLocationDefinition(
        id=WorldLocationId.HABIT_GARDEN,
        title="Habit Garden",
        subtitle="Consistency and reviews",
        description="Destination for habits, logs, streaks, check-ins, and weekly reviews.",
        category=WorldLocationCategory.HABITS,
        command_route="/app/habits",
        future_scene_key="habit-garden",
        default_unlocked=True,
        visual_status=WorldVisualStatus.DATA_CONTRACT_READY,
        deep_link_entity_types=("habit", "habit_log", "weekly_review"),
    ),
    WorldLocationDefinition(
        id=WorldLocationId.COMMAND_CENTER,
        title="Progress Tower",
        subtitle="Analytics and command state",
        description=(
            "Destination for real-data analytics, settings entry points, and command "
            "workflow status."
        ),
        category=WorldLocationCategory.COMMAND,
        command_route="/app/analytics",
        future_scene_key="progress-tower",
        default_unlocked=True,
        visual_status=WorldVisualStatus.DATA_CONTRACT_READY,
        deep_link_entity_types=("analytics", "settings", "notification_workflow"),
    ),
    WorldLocationDefinition(
        id=WorldLocationId.PERSONAL_HOME,
        title="Personal Home",
        subtitle="Profile and privacy",
        description=(
            "Destination for profile metadata, privacy controls, favorite resources, "
            "and data requests."
        ),
        category=WorldLocationCategory.PROFILE,
        command_route="/app/settings",
        future_scene_key="personal-home",
        default_unlocked=False,
        visual_status=WorldVisualStatus.DATA_CONTRACT_READY,
        deep_link_entity_types=("profile", "privacy", "certificate", "data_request"),
    ),
    WorldLocationDefinition(
        id=WorldLocationId.ACHIEVEMENT_HALL,
        title="Achievement Hall",
        subtitle="Milestones and unlocks",
        description=(
            "Destination for non-visual achievements, rewards, progress counters, and "
            "future world unlock records."
        ),
        category=WorldLocationCategory.ACHIEVEMENTS,
        command_route="/app/achievements",
        future_scene_key="achievement-hall",
        default_unlocked=False,
        visual_status=WorldVisualStatus.DATA_CONTRACT_READY,
        deep_link_entity_types=("achievement", "world_unlock"),
    ),
    WorldLocationDefinition(
        id=WorldLocationId.KNOWLEDGE_OBSERVATORY,
        title="Knowledge Observatory",
        subtitle="Graph relationships",
        description=(
            "Destination for non-visual knowledge graph nodes, relationships, "
            "prerequisites, and recommendations."
        ),
        category=WorldLocationCategory.KNOWLEDGE,
        command_route="/app/learning?panel=knowledge",
        future_scene_key="knowledge-observatory",
        default_unlocked=False,
        visual_status=WorldVisualStatus.DATA_CONTRACT_READY,
        deep_link_entity_types=("knowledge_node", "knowledge_relationship", "topic_relation"),
    ),
    WorldLocationDefinition(
        id=WorldLocationId.PROJECT_WORKSHOP,
        title="Project Dock",
        subtitle="Plans and build work",
        description=(
            "Destination for projects, milestones, tasks, notes, blockers, links, and "
            "activity history."
        ),
        category=WorldLocationCategory.PROJECTS,
        command_route="/app/projects",
        future_scene_key="project-dock",
        default_unlocked=False,
        visual_status=WorldVisualStatus.DATA_CONTRACT_READY,
        deep_link_entity_types=("project", "project_task", "project_milestone", "project_blocker"),
    ),
    WorldLocationDefinition(
        id=WorldLocationId.MEDIA_THEATER,
        title="Media Theater",
        subtitle="Saved educational media",
        description=(
            "Reserved destination for future saved lectures, videos, and educational media records."
        ),
        category=WorldLocationCategory.MEDIA,
        command_route="/app/library?kind=media",
        future_scene_key="media-theater",
        default_unlocked=False,
        visual_status=WorldVisualStatus.FUTURE_VISUAL_IMPLEMENTATION,
        deep_link_entity_types=("media", "external_resource"),
    ),
)

WORLD_LOCATION_REGISTRY = {
    definition.id.value: definition for definition in WORLD_LOCATION_DEFINITIONS
}
WORLD_LOCATION_IDS = frozenset(WORLD_LOCATION_REGISTRY.keys())

DEFAULT_SPAWN_LOCATION_ID = WorldLocationId.CENTRAL_PLAZA.value
DEFAULT_VISITED_LOCATION_IDS = (WorldLocationId.CENTRAL_PLAZA.value,)
DEFAULT_UNLOCKED_LOCATION_IDS = tuple(
    definition.id.value for definition in WORLD_LOCATION_DEFINITIONS if definition.default_unlocked
)


def get_world_location_definition(location_id: str) -> WorldLocationDefinition | None:
    return WORLD_LOCATION_REGISTRY.get(location_id)
