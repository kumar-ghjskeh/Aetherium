from __future__ import annotations

from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.domain.learning import (
    CourseStatus,
    FlashcardReviewRating,
    FlashcardStatus,
    LearningGoalStatus,
    LearningRecordStatus,
    LearningResourceType,
    LessonStatus,
    QuestionType,
    QuizStatus,
    StudyRoadmapStatus,
    StudySessionMode,
)
from app.models.learning import (
    Attempt,
    Course,
    CourseModule,
    Flashcard,
    FlashcardReview,
    LearningGoal,
    LearningResource,
    Lesson,
    Question,
    Quiz,
    StudyRoadmap,
    StudySession,
    Subject,
    Topic,
    TopicRelation,
)
from app.services.learning import MasteryCalculation


class LearningSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class SubjectCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    name: str = Field(min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=4000)


class SubjectResponse(LearningSchema):
    id: UUID
    name: str
    description: str | None
    status: LearningRecordStatus
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_subject(cls, subject: Subject) -> SubjectResponse:
        return cls.model_validate(subject)


class SubjectPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[SubjectResponse]
    total: int
    limit: int
    offset: int


class TopicCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    name: str = Field(min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=4000)
    subject_id: UUID | None = Field(default=None, alias="subjectId")


class TopicResponse(LearningSchema):
    id: UUID
    subject_id: UUID | None = Field(alias="subjectId")
    name: str
    description: str | None
    status: LearningRecordStatus
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_topic(cls, topic: Topic) -> TopicResponse:
        return cls.model_validate(topic)


class TopicPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[TopicResponse]
    total: int
    limit: int
    offset: int


class TopicRelationCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    prerequisite_topic_id: UUID = Field(alias="prerequisiteTopicId")


class TopicRelationResponse(LearningSchema):
    id: UUID
    source_topic_id: UUID = Field(alias="sourceTopicId")
    target_topic_id: UUID = Field(alias="targetTopicId")
    relation_type: str = Field(alias="relationType")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_relation(cls, relation: TopicRelation) -> TopicRelationResponse:
        return cls.model_validate(relation)


class LearningResourceCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    title: str = Field(min_length=1, max_length=200)
    resource_type: LearningResourceType = Field(alias="resourceType")
    subject_id: UUID | None = Field(default=None, alias="subjectId")
    topic_id: UUID | None = Field(default=None, alias="topicId")
    file_id: UUID | None = Field(default=None, alias="fileId")
    url: str | None = Field(default=None, max_length=1000)
    notes: str | None = Field(default=None, max_length=4000)


class LearningResourceResponse(LearningSchema):
    id: UUID
    subject_id: UUID | None = Field(alias="subjectId")
    topic_id: UUID | None = Field(alias="topicId")
    file_id: UUID | None = Field(alias="fileId")
    title: str
    resource_type: LearningResourceType = Field(alias="resourceType")
    url: str | None
    notes: str | None
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_resource(cls, resource: LearningResource) -> LearningResourceResponse:
        return cls.model_validate(resource)


class LearningResourcePage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[LearningResourceResponse]
    total: int
    limit: int
    offset: int


class CourseCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    subject_id: UUID | None = Field(default=None, alias="subjectId")


class CourseResponse(LearningSchema):
    id: UUID
    subject_id: UUID | None = Field(alias="subjectId")
    title: str
    description: str | None
    status: CourseStatus
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_course(cls, course: Course) -> CourseResponse:
        return cls.model_validate(course)


class CoursePage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[CourseResponse]
    total: int
    limit: int
    offset: int


class CourseModuleCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    position: int = Field(default=0, ge=0)


class CourseModuleResponse(LearningSchema):
    id: UUID
    course_id: UUID = Field(alias="courseId")
    title: str
    description: str | None
    position: int
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_module(cls, module: CourseModule) -> CourseModuleResponse:
        return cls.model_validate(module)


class LessonCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    title: str = Field(min_length=1, max_length=200)
    content: str | None = Field(default=None, max_length=20000)
    topic_id: UUID | None = Field(default=None, alias="topicId")
    position: int = Field(default=0, ge=0)
    estimated_minutes: int | None = Field(default=None, alias="estimatedMinutes", gt=0, le=5000)


class LessonResponse(LearningSchema):
    id: UUID
    module_id: UUID = Field(alias="moduleId")
    topic_id: UUID | None = Field(alias="topicId")
    title: str
    content: str | None
    status: LessonStatus
    position: int
    estimated_minutes: int | None = Field(alias="estimatedMinutes")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_lesson(cls, lesson: Lesson) -> LessonResponse:
        return cls.model_validate(lesson)


class StudySessionCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    mode: StudySessionMode
    subject_id: UUID | None = Field(default=None, alias="subjectId")
    topic_id: UUID | None = Field(default=None, alias="topicId")
    course_id: UUID | None = Field(default=None, alias="courseId")
    lesson_id: UUID | None = Field(default=None, alias="lessonId")
    started_at: datetime | None = Field(default=None, alias="startedAt")
    notes: str | None = Field(default=None, max_length=4000)


class StudySessionEndRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    ended_at: datetime | None = Field(default=None, alias="endedAt")
    notes: str | None = Field(default=None, max_length=4000)


class StudySessionResponse(LearningSchema):
    id: UUID
    subject_id: UUID | None = Field(alias="subjectId")
    topic_id: UUID | None = Field(alias="topicId")
    course_id: UUID | None = Field(alias="courseId")
    lesson_id: UUID | None = Field(alias="lessonId")
    mode: StudySessionMode
    started_at: datetime = Field(alias="startedAt")
    ended_at: datetime | None = Field(alias="endedAt")
    duration_minutes: int | None = Field(alias="durationMinutes")
    notes: str | None
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_session(cls, session: StudySession) -> StudySessionResponse:
        return cls.model_validate(session)


class StudySessionPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[StudySessionResponse]
    total: int
    limit: int
    offset: int


class QuizCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    title: str = Field(min_length=1, max_length=200)
    topic_id: UUID | None = Field(default=None, alias="topicId")
    lesson_id: UUID | None = Field(default=None, alias="lessonId")


class QuizResponse(LearningSchema):
    id: UUID
    topic_id: UUID | None = Field(alias="topicId")
    lesson_id: UUID | None = Field(alias="lessonId")
    title: str
    status: QuizStatus
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_quiz(cls, quiz: Quiz) -> QuizResponse:
        return cls.model_validate(quiz)


class QuizPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[QuizResponse]
    total: int
    limit: int
    offset: int


class QuestionCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    question_type: QuestionType = Field(default=QuestionType.FREE_TEXT, alias="questionType")
    prompt: str = Field(min_length=1, max_length=12000)
    choices: list[str] = Field(default_factory=list, max_length=12)
    correct_answer: str | None = Field(default=None, alias="correctAnswer", max_length=4000)
    explanation: str | None = Field(default=None, max_length=4000)
    position: int = Field(default=0, ge=0)
    difficulty: int = Field(default=3, ge=1, le=5)

    @model_validator(mode="after")
    def validate_choices(self) -> QuestionCreateRequest:
        if self.question_type == QuestionType.MULTIPLE_CHOICE and len(self.choices) < 2:
            raise ValueError("Multiple-choice questions require at least two choices.")
        return self


class QuestionResponse(LearningSchema):
    id: UUID
    quiz_id: UUID = Field(alias="quizId")
    question_type: QuestionType = Field(alias="questionType")
    prompt: str
    choices: list[str]
    correct_answer: str | None = Field(alias="correctAnswer")
    explanation: str | None
    position: int
    difficulty: int
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_question(cls, question: Question) -> QuestionResponse:
        return cls.model_validate(question)


class AttemptCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    question_id: UUID | None = Field(default=None, alias="questionId")
    score: float = Field(ge=0)
    max_score: float = Field(alias="maxScore", gt=0)
    confidence: int | None = Field(default=None, ge=1, le=5)
    hints_used: int = Field(default=0, alias="hintsUsed", ge=0, le=100)
    submitted_answer: str | None = Field(default=None, alias="submittedAnswer", max_length=12000)
    feedback: str | None = Field(default=None, max_length=4000)

    @model_validator(mode="after")
    def score_cannot_exceed_max(self) -> AttemptCreateRequest:
        if self.score > self.max_score:
            raise ValueError("Score cannot exceed max score.")
        return self


class AttemptResponse(LearningSchema):
    id: UUID
    quiz_id: UUID = Field(alias="quizId")
    question_id: UUID | None = Field(alias="questionId")
    score: float
    max_score: float = Field(alias="maxScore")
    accuracy: float
    confidence: int | None
    hints_used: int = Field(alias="hintsUsed")
    status: str
    submitted_answer: str | None = Field(alias="submittedAnswer")
    feedback: str | None
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_attempt(cls, attempt: Attempt) -> AttemptResponse:
        return cls.model_validate(attempt)


class FlashcardCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    topic_id: UUID | None = Field(default=None, alias="topicId")
    front: str = Field(min_length=1, max_length=12000)
    back: str = Field(min_length=1, max_length=12000)


class FlashcardResponse(LearningSchema):
    id: UUID
    topic_id: UUID | None = Field(alias="topicId")
    front: str
    back: str
    status: FlashcardStatus
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_flashcard(cls, flashcard: Flashcard) -> FlashcardResponse:
        return cls.model_validate(flashcard)


class FlashcardPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[FlashcardResponse]
    total: int
    limit: int
    offset: int


class FlashcardReviewCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    rating: FlashcardReviewRating
    confidence: int | None = Field(default=None, ge=1, le=5)
    reviewed_at: datetime | None = Field(default=None, alias="reviewedAt")


class FlashcardReviewResponse(LearningSchema):
    id: UUID
    flashcard_id: UUID = Field(alias="flashcardId")
    rating: FlashcardReviewRating
    confidence: int | None
    reviewed_at: datetime = Field(alias="reviewedAt")
    next_review_at: datetime | None = Field(alias="nextReviewAt")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_review(cls, review: FlashcardReview) -> FlashcardReviewResponse:
        return cls.model_validate(review)


class MasteryResponse(LearningSchema):
    id: UUID
    topic_id: UUID = Field(alias="topicId")
    mastery_score: float = Field(alias="masteryScore")
    quiz_accuracy: float = Field(alias="quizAccuracy")
    successful_recall_score: float = Field(alias="successfulRecallScore")
    exercise_score: float = Field(alias="exerciseScore")
    confidence_score: float = Field(alias="confidenceScore")
    review_recency_score: float = Field(alias="reviewRecencyScore")
    hints_penalty: float = Field(alias="hintsPenalty")
    project_evidence_score: float = Field(alias="projectEvidenceScore")
    calculation: dict[str, Any]
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_calculation(cls, calculation: MasteryCalculation) -> MasteryResponse:
        return cls.model_validate(calculation.record)


class LearningGoalCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    subject_id: UUID | None = Field(default=None, alias="subjectId")
    topic_id: UUID | None = Field(default=None, alias="topicId")
    target_date: date | None = Field(default=None, alias="targetDate")


class LearningGoalResponse(LearningSchema):
    id: UUID
    subject_id: UUID | None = Field(alias="subjectId")
    topic_id: UUID | None = Field(alias="topicId")
    title: str
    description: str | None
    target_date: date | None = Field(alias="targetDate")
    status: LearningGoalStatus
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_goal(cls, goal: LearningGoal) -> LearningGoalResponse:
        return cls.model_validate(goal)


class LearningGoalPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[LearningGoalResponse]
    total: int
    limit: int
    offset: int


class StudyRoadmapCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    subject_id: UUID | None = Field(default=None, alias="subjectId")
    steps: list[dict[str, Any]] = Field(default_factory=list, max_length=100)


class StudyRoadmapResponse(LearningSchema):
    id: UUID
    subject_id: UUID | None = Field(alias="subjectId")
    title: str
    description: str | None
    steps: list[dict[str, Any]]
    status: StudyRoadmapStatus
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_roadmap(cls, roadmap: StudyRoadmap) -> StudyRoadmapResponse:
        return cls.model_validate(roadmap)


class StudyRoadmapPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[StudyRoadmapResponse]
    total: int
    limit: int
    offset: int
