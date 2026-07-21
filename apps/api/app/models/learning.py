from __future__ import annotations

from datetime import date, datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import (
    JSON,
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin
from app.domain.learning import (
    AttemptStatus,
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
from app.models.foundation import enum_values_sql


class Subject(TimestampMixin, Base):
    __tablename__ = "subjects"
    __table_args__ = (
        CheckConstraint(
            f"status IN ({enum_values_sql(LearningRecordStatus)})", name="status_allowed"
        ),
        UniqueConstraint("owner_user_id", "normalized_name", name="uq_subjects_owner_name"),
        Index("ix_subjects_owner_status_updated", "owner_user_id", "status", "updated_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    normalized_name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=LearningRecordStatus.ACTIVE.value
    )


class Topic(TimestampMixin, Base):
    __tablename__ = "topics"
    __table_args__ = (
        CheckConstraint(
            f"status IN ({enum_values_sql(LearningRecordStatus)})", name="status_allowed"
        ),
        UniqueConstraint("owner_user_id", "normalized_name", name="uq_topics_owner_name"),
        Index("ix_topics_owner_subject", "owner_user_id", "subject_id"),
        Index("ix_topics_owner_status_updated", "owner_user_id", "status", "updated_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    subject_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("subjects.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    normalized_name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=LearningRecordStatus.ACTIVE.value
    )


class TopicRelation(TimestampMixin, Base):
    __tablename__ = "topic_relations"
    __table_args__ = (
        UniqueConstraint(
            "owner_user_id",
            "source_topic_id",
            "target_topic_id",
            "relation_type",
            name="uq_topic_relations_owner_source_target_type",
        ),
        Index("ix_topic_relations_owner_source", "owner_user_id", "source_topic_id"),
        Index("ix_topic_relations_owner_target", "owner_user_id", "target_topic_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_topic_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("topics.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    target_topic_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("topics.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    relation_type: Mapped[str] = mapped_column(String(48), nullable=False, default="requires")


class LearningResource(TimestampMixin, Base):
    __tablename__ = "learning_resources"
    __table_args__ = (
        CheckConstraint(
            f"resource_type IN ({enum_values_sql(LearningResourceType)})",
            name="resource_type_allowed",
        ),
        Index("ix_learning_resources_owner_subject", "owner_user_id", "subject_id"),
        Index("ix_learning_resources_owner_topic", "owner_user_id", "topic_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    subject_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("subjects.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    topic_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("topics.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    file_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("files.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(32), nullable=False)
    url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class Course(TimestampMixin, Base):
    __tablename__ = "courses"
    __table_args__ = (
        CheckConstraint(f"status IN ({enum_values_sql(CourseStatus)})", name="status_allowed"),
        Index("ix_courses_owner_status_updated", "owner_user_id", "status", "updated_at"),
        Index("ix_courses_owner_subject", "owner_user_id", "subject_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    subject_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("subjects.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=CourseStatus.ACTIVE.value
    )


class CourseModule(TimestampMixin, Base):
    __tablename__ = "course_modules"
    __table_args__ = (
        CheckConstraint("position >= 0", name="position_nonnegative"),
        UniqueConstraint("course_id", "position", name="uq_course_modules_course_position"),
        Index("ix_course_modules_owner_course", "owner_user_id", "course_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    course_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class Lesson(TimestampMixin, Base):
    __tablename__ = "lessons"
    __table_args__ = (
        CheckConstraint(f"status IN ({enum_values_sql(LessonStatus)})", name="status_allowed"),
        CheckConstraint("position >= 0", name="position_nonnegative"),
        CheckConstraint(
            "estimated_minutes IS NULL OR estimated_minutes > 0",
            name="estimated_minutes_positive",
        ),
        UniqueConstraint("module_id", "position", name="uq_lessons_module_position"),
        Index("ix_lessons_owner_module", "owner_user_id", "module_id"),
        Index("ix_lessons_owner_topic", "owner_user_id", "topic_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    module_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("course_modules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    topic_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("topics.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=LessonStatus.ACTIVE.value
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    estimated_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)


class StudySession(TimestampMixin, Base):
    __tablename__ = "study_sessions"
    __table_args__ = (
        CheckConstraint(f"mode IN ({enum_values_sql(StudySessionMode)})", name="mode_allowed"),
        CheckConstraint(
            "duration_minutes IS NULL OR duration_minutes >= 0",
            name="duration_minutes_nonnegative",
        ),
        Index("ix_study_sessions_owner_started", "owner_user_id", "started_at"),
        Index("ix_study_sessions_owner_topic", "owner_user_id", "topic_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    subject_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("subjects.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    topic_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("topics.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    course_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("courses.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    lesson_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("lessons.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    mode: Mapped[str] = mapped_column(String(48), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class Quiz(TimestampMixin, Base):
    __tablename__ = "quizzes"
    __table_args__ = (
        CheckConstraint(f"status IN ({enum_values_sql(QuizStatus)})", name="status_allowed"),
        Index("ix_quizzes_owner_topic", "owner_user_id", "topic_id"),
        Index("ix_quizzes_owner_lesson", "owner_user_id", "lesson_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    topic_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("topics.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    lesson_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("lessons.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default=QuizStatus.ACTIVE.value)


class Question(TimestampMixin, Base):
    __tablename__ = "questions"
    __table_args__ = (
        CheckConstraint(
            f"question_type IN ({enum_values_sql(QuestionType)})",
            name="question_type_allowed",
        ),
        CheckConstraint("position >= 0", name="position_nonnegative"),
        CheckConstraint("difficulty >= 1 AND difficulty <= 5", name="difficulty_range"),
        UniqueConstraint("quiz_id", "position", name="uq_questions_quiz_position"),
        Index("ix_questions_owner_quiz", "owner_user_id", "quiz_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    quiz_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_type: Mapped[str] = mapped_column(String(32), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    choices: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    correct_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    difficulty: Mapped[int] = mapped_column(Integer, nullable=False, default=3)


class Attempt(TimestampMixin, Base):
    __tablename__ = "attempts"
    __table_args__ = (
        CheckConstraint(f"status IN ({enum_values_sql(AttemptStatus)})", name="status_allowed"),
        CheckConstraint("score >= 0", name="score_nonnegative"),
        CheckConstraint("max_score > 0", name="max_score_positive"),
        CheckConstraint("accuracy >= 0 AND accuracy <= 1", name="accuracy_range"),
        CheckConstraint(
            "confidence IS NULL OR (confidence >= 1 AND confidence <= 5)",
            name="confidence_range",
        ),
        CheckConstraint("hints_used >= 0", name="hints_used_nonnegative"),
        Index("ix_attempts_owner_quiz", "owner_user_id", "quiz_id"),
        Index("ix_attempts_owner_question", "owner_user_id", "question_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    quiz_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("questions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    score: Mapped[float] = mapped_column(Float, nullable=False)
    max_score: Mapped[float] = mapped_column(Float, nullable=False)
    accuracy: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[int | None] = mapped_column(Integer, nullable=True)
    hints_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=AttemptStatus.COMPLETED.value
    )
    submitted_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)


class Flashcard(TimestampMixin, Base):
    __tablename__ = "flashcards"
    __table_args__ = (
        CheckConstraint(f"status IN ({enum_values_sql(FlashcardStatus)})", name="status_allowed"),
        Index("ix_flashcards_owner_topic", "owner_user_id", "topic_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    topic_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("topics.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    front: Mapped[str] = mapped_column(Text, nullable=False)
    back: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=FlashcardStatus.ACTIVE.value
    )


class FlashcardReview(TimestampMixin, Base):
    __tablename__ = "flashcard_reviews"
    __table_args__ = (
        CheckConstraint(
            f"rating IN ({enum_values_sql(FlashcardReviewRating)})",
            name="rating_allowed",
        ),
        CheckConstraint(
            "confidence IS NULL OR (confidence >= 1 AND confidence <= 5)",
            name="confidence_range",
        ),
        Index(
            "ix_flashcard_reviews_owner_card_reviewed",
            "owner_user_id",
            "flashcard_id",
            "reviewed_at",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    flashcard_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("flashcards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rating: Mapped[str] = mapped_column(String(24), nullable=False)
    confidence: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    next_review_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class MasteryRecord(TimestampMixin, Base):
    __tablename__ = "mastery_records"
    __table_args__ = (
        CheckConstraint("mastery_score >= 0 AND mastery_score <= 1", name="mastery_score_range"),
        CheckConstraint("quiz_accuracy >= 0 AND quiz_accuracy <= 1", name="quiz_accuracy_range"),
        CheckConstraint(
            "successful_recall_score >= 0 AND successful_recall_score <= 1",
            name="successful_recall_score_range",
        ),
        CheckConstraint("exercise_score >= 0 AND exercise_score <= 1", name="exercise_score_range"),
        CheckConstraint(
            "confidence_score >= 0 AND confidence_score <= 1", name="confidence_score_range"
        ),
        CheckConstraint(
            "review_recency_score >= 0 AND review_recency_score <= 1",
            name="review_recency_score_range",
        ),
        CheckConstraint("hints_penalty >= 0 AND hints_penalty <= 1", name="hints_penalty_range"),
        CheckConstraint(
            "project_evidence_score >= 0 AND project_evidence_score <= 1",
            name="project_evidence_score_range",
        ),
        UniqueConstraint("owner_user_id", "topic_id", name="uq_mastery_records_owner_topic"),
        Index("ix_mastery_records_owner_score", "owner_user_id", "mastery_score"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    topic_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("topics.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    mastery_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    quiz_accuracy: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    successful_recall_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    exercise_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    review_recency_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    hints_penalty: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    project_evidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    calculation: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)


class LearningGoal(TimestampMixin, Base):
    __tablename__ = "learning_goals"
    __table_args__ = (
        CheckConstraint(
            f"status IN ({enum_values_sql(LearningGoalStatus)})",
            name="status_allowed",
        ),
        Index("ix_learning_goals_owner_status", "owner_user_id", "status"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    subject_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("subjects.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    topic_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("topics.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=LearningGoalStatus.ACTIVE.value
    )


class StudyRoadmap(TimestampMixin, Base):
    __tablename__ = "study_roadmaps"
    __table_args__ = (
        CheckConstraint(
            f"status IN ({enum_values_sql(StudyRoadmapStatus)})",
            name="status_allowed",
        ),
        Index("ix_study_roadmaps_owner_status", "owner_user_id", "status"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    subject_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("subjects.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    steps: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False, default=list)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=StudyRoadmapStatus.ACTIVE.value
    )
