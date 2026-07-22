from enum import StrEnum


class ProjectStatus(StrEnum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class ProjectMilestoneStatus(StrEnum):
    PLANNED = "planned"
    ACTIVE = "active"
    COMPLETED = "completed"
    BLOCKED = "blocked"


class ProjectTaskStatus(StrEnum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    BLOCKED = "blocked"


class ProjectPriority(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ProjectBlockerStatus(StrEnum):
    OPEN = "open"
    RESOLVED = "resolved"


class ProjectActivityType(StrEnum):
    PROJECT_CREATED = "project.created"
    PROJECT_UPDATED = "project.updated"
    PROJECT_ARCHIVED = "project.archived"
    PROJECT_COMPLETED = "project.completed"
    MILESTONE_CREATED = "project.milestone_created"
    TASK_CREATED = "project.task_created"
    TASK_UPDATED = "project.task_updated"
    NOTE_CREATED = "project.note_created"
    LINK_CREATED = "project.link_created"
    FILE_ATTACHED = "project.file_attached"
    TOPIC_LINKED = "project.topic_linked"
    TECHNOLOGY_ADDED = "project.technology_added"
    BLOCKER_CREATED = "project.blocker_created"
    BLOCKER_UPDATED = "project.blocker_updated"
