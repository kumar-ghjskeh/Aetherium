from enum import StrEnum


class SearchEntityType(StrEnum):
    FILE = "file"
    FILE_CHUNK = "file_chunk"
    COLLECTION = "collection"
    TAG = "tag"
    NOTE = "note"
    AI_CONVERSATION = "ai_conversation"
    LEARNING_TOPIC = "learning_topic"
    PROJECT = "project"
    TASK = "task"
    HABIT = "habit"
    ACHIEVEMENT = "achievement"


class SearchSort(StrEnum):
    RELEVANCE = "relevance"
    RECENT = "recent"


class SearchMode(StrEnum):
    KEYWORD = "keyword"
    HYBRID = "hybrid"


class SearchMatchReason(StrEnum):
    FILE_METADATA = "file_metadata"
    FILE_CONTENT = "file_content"
    COLLECTION_METADATA = "collection_metadata"
    TAG_METADATA = "tag_metadata"
    AI_CONVERSATION = "ai_conversation"
    HABIT_METADATA = "habit_metadata"
    LEARNING_TOPIC_METADATA = "learning_topic_metadata"
    PROJECT_METADATA = "project_metadata"
    PROJECT_TASK_METADATA = "project_task_metadata"
    ACHIEVEMENT_METADATA = "achievement_metadata"
