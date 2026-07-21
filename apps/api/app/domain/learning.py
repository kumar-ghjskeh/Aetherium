from enum import StrEnum


class LearningRecordStatus(StrEnum):
    ACTIVE = "active"
    ARCHIVED = "archived"


class CourseStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class LessonStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"


class LearningResourceType(StrEnum):
    DOCUMENT = "document"
    LINK = "link"
    NOTE = "note"
    VIDEO = "video"
    FILE = "file"


class StudySessionMode(StrEnum):
    GUIDED_COURSE = "guided_course"
    FREE_EXPLORATION = "free_exploration"
    DOCUMENT_BASED = "document_based"
    PROJECT_BASED = "project_based"
    EXAM_PREPARATION = "exam_preparation"
    CODING_PRACTICE = "coding_practice"
    QUICK_REVIEW = "quick_review"


class QuizStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class QuestionType(StrEnum):
    MULTIPLE_CHOICE = "multiple_choice"
    FREE_TEXT = "free_text"
    CODE = "code"


class AttemptStatus(StrEnum):
    COMPLETED = "completed"


class FlashcardStatus(StrEnum):
    ACTIVE = "active"
    ARCHIVED = "archived"


class FlashcardReviewRating(StrEnum):
    AGAIN = "again"
    HARD = "hard"
    GOOD = "good"
    EASY = "easy"


class LearningGoalStatus(StrEnum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class StudyRoadmapStatus(StrEnum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"
