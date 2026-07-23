from __future__ import annotations

from enum import StrEnum


class KnowledgeNodeType(StrEnum):
    TOPIC = "topic"
    FILE = "file"
    LESSON = "lesson"
    PROJECT = "project"
    SKILL = "skill"
    QUESTION = "question"
    ACHIEVEMENT = "achievement"


class KnowledgeRelationType(StrEnum):
    REQUIRES = "requires"
    EXPLAINS = "explains"
    REFERENCES = "references"
    PRACTICES = "practices"
    USED_IN = "used_in"
    RELATED_TO = "related_to"
    MASTERED_THROUGH = "mastered_through"
    DERIVED_FROM = "derived_from"


class KnowledgeNodeStatus(StrEnum):
    ACTIVE = "active"
    ARCHIVED = "archived"


class KnowledgeRelationshipSource(StrEnum):
    USER = "user"
    SYSTEM = "system"
    SYNC = "sync"
    LEARNING = "learning"
    PROJECT = "project"
    ACHIEVEMENT = "achievement"


class KnowledgeRecommendationPriority(StrEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class KnowledgeRelationshipDirection(StrEnum):
    INCOMING = "incoming"
    OUTGOING = "outgoing"
    BOTH = "both"
