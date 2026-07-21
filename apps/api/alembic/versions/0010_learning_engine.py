"""Add learning and mastery engine.

Revision ID: 0010_learning_engine
Revises: 0009_habit_tracking
Create Date: 2026-07-21 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0010_learning_engine"
down_revision: str | None = "0009_habit_tracking"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

LEARNING_RECORD_STATUS_VALUES = "'active', 'archived'"
COURSE_STATUS_VALUES = "'draft', 'active', 'archived'"
LESSON_STATUS_VALUES = "'draft', 'active', 'completed'"
RESOURCE_TYPE_VALUES = "'document', 'link', 'note', 'video', 'file'"
SESSION_MODE_VALUES = (
    "'guided_course', 'free_exploration', 'document_based', 'project_based', "
    "'exam_preparation', 'coding_practice', 'quick_review'"
)
QUIZ_STATUS_VALUES = "'draft', 'active', 'archived'"
QUESTION_TYPE_VALUES = "'multiple_choice', 'free_text', 'code'"
ATTEMPT_STATUS_VALUES = "'completed'"
FLASHCARD_STATUS_VALUES = "'active', 'archived'"
FLASHCARD_REVIEW_RATING_VALUES = "'again', 'hard', 'good', 'easy'"
LEARNING_GOAL_STATUS_VALUES = "'active', 'completed', 'archived'"
STUDY_ROADMAP_STATUS_VALUES = "'active', 'completed', 'archived'"


def upgrade() -> None:
    op.create_table(
        "subjects",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("normalized_name", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"status IN ({LEARNING_RECORD_STATUS_VALUES})",
            name=op.f("ck_subjects_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_subjects_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_subjects")),
        sa.UniqueConstraint("owner_user_id", "normalized_name", name="uq_subjects_owner_name"),
    )
    op.create_index(op.f("ix_subjects_owner_user_id"), "subjects", ["owner_user_id"])
    op.create_index(
        "ix_subjects_owner_status_updated",
        "subjects",
        ["owner_user_id", "status", "updated_at"],
    )
    op.execute(
        "CREATE INDEX ix_subjects_search_fts ON subjects USING GIN "
        "(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')))"
    )

    op.create_table(
        "topics",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("subject_id", sa.Uuid(), nullable=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("normalized_name", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"status IN ({LEARNING_RECORD_STATUS_VALUES})",
            name=op.f("ck_topics_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_topics_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["subject_id"],
            ["subjects.id"],
            name=op.f("fk_topics_subject_id_subjects"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_topics")),
        sa.UniqueConstraint("owner_user_id", "normalized_name", name="uq_topics_owner_name"),
    )
    op.create_index(op.f("ix_topics_owner_user_id"), "topics", ["owner_user_id"])
    op.create_index(op.f("ix_topics_subject_id"), "topics", ["subject_id"])
    op.create_index("ix_topics_owner_subject", "topics", ["owner_user_id", "subject_id"])
    op.create_index(
        "ix_topics_owner_status_updated", "topics", ["owner_user_id", "status", "updated_at"]
    )
    op.execute(
        "CREATE INDEX ix_topics_search_fts ON topics USING GIN "
        "(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')))"
    )

    op.create_table(
        "topic_relations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("source_topic_id", sa.Uuid(), nullable=False),
        sa.Column("target_topic_id", sa.Uuid(), nullable=False),
        sa.Column("relation_type", sa.String(length=48), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_topic_relations_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["source_topic_id"],
            ["topics.id"],
            name=op.f("fk_topic_relations_source_topic_id_topics"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["target_topic_id"],
            ["topics.id"],
            name=op.f("fk_topic_relations_target_topic_id_topics"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_topic_relations")),
        sa.UniqueConstraint(
            "owner_user_id",
            "source_topic_id",
            "target_topic_id",
            "relation_type",
            name="uq_topic_relations_owner_source_target_type",
        ),
    )
    op.create_index(op.f("ix_topic_relations_owner_user_id"), "topic_relations", ["owner_user_id"])
    op.create_index(
        op.f("ix_topic_relations_source_topic_id"), "topic_relations", ["source_topic_id"]
    )
    op.create_index(
        op.f("ix_topic_relations_target_topic_id"), "topic_relations", ["target_topic_id"]
    )
    op.create_index(
        "ix_topic_relations_owner_source",
        "topic_relations",
        ["owner_user_id", "source_topic_id"],
    )
    op.create_index(
        "ix_topic_relations_owner_target",
        "topic_relations",
        ["owner_user_id", "target_topic_id"],
    )

    op.create_table(
        "learning_resources",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("subject_id", sa.Uuid(), nullable=True),
        sa.Column("topic_id", sa.Uuid(), nullable=True),
        sa.Column("file_id", sa.Uuid(), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("resource_type", sa.String(length=32), nullable=False),
        sa.Column("url", sa.String(length=1000), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"resource_type IN ({RESOURCE_TYPE_VALUES})",
            name=op.f("ck_learning_resources_resource_type_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["file_id"],
            ["files.id"],
            name=op.f("fk_learning_resources_file_id_files"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_learning_resources_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["subject_id"],
            ["subjects.id"],
            name=op.f("fk_learning_resources_subject_id_subjects"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["topic_id"],
            ["topics.id"],
            name=op.f("fk_learning_resources_topic_id_topics"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_learning_resources")),
    )
    op.create_index(
        op.f("ix_learning_resources_owner_user_id"), "learning_resources", ["owner_user_id"]
    )
    op.create_index(op.f("ix_learning_resources_subject_id"), "learning_resources", ["subject_id"])
    op.create_index(op.f("ix_learning_resources_topic_id"), "learning_resources", ["topic_id"])
    op.create_index(op.f("ix_learning_resources_file_id"), "learning_resources", ["file_id"])
    op.create_index(
        "ix_learning_resources_owner_subject",
        "learning_resources",
        ["owner_user_id", "subject_id"],
    )
    op.create_index(
        "ix_learning_resources_owner_topic",
        "learning_resources",
        ["owner_user_id", "topic_id"],
    )

    op.create_table(
        "courses",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("subject_id", sa.Uuid(), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"status IN ({COURSE_STATUS_VALUES})",
            name=op.f("ck_courses_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_courses_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["subject_id"],
            ["subjects.id"],
            name=op.f("fk_courses_subject_id_subjects"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_courses")),
    )
    op.create_index(op.f("ix_courses_owner_user_id"), "courses", ["owner_user_id"])
    op.create_index(op.f("ix_courses_subject_id"), "courses", ["subject_id"])
    op.create_index(
        "ix_courses_owner_status_updated", "courses", ["owner_user_id", "status", "updated_at"]
    )
    op.create_index("ix_courses_owner_subject", "courses", ["owner_user_id", "subject_id"])

    op.create_table(
        "course_modules",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("course_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("position >= 0", name=op.f("ck_course_modules_position_nonnegative")),
        sa.ForeignKeyConstraint(
            ["course_id"],
            ["courses.id"],
            name=op.f("fk_course_modules_course_id_courses"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_course_modules_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_course_modules")),
        sa.UniqueConstraint("course_id", "position", name="uq_course_modules_course_position"),
    )
    op.create_index(op.f("ix_course_modules_owner_user_id"), "course_modules", ["owner_user_id"])
    op.create_index(op.f("ix_course_modules_course_id"), "course_modules", ["course_id"])
    op.create_index(
        "ix_course_modules_owner_course", "course_modules", ["owner_user_id", "course_id"]
    )

    op.create_table(
        "lessons",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("module_id", sa.Uuid(), nullable=False),
        sa.Column("topic_id", sa.Uuid(), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("estimated_minutes", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"status IN ({LESSON_STATUS_VALUES})",
            name=op.f("ck_lessons_status_allowed"),
        ),
        sa.CheckConstraint("position >= 0", name=op.f("ck_lessons_position_nonnegative")),
        sa.CheckConstraint(
            "estimated_minutes IS NULL OR estimated_minutes > 0",
            name=op.f("ck_lessons_estimated_minutes_positive"),
        ),
        sa.ForeignKeyConstraint(
            ["module_id"],
            ["course_modules.id"],
            name=op.f("fk_lessons_module_id_course_modules"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_lessons_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["topic_id"],
            ["topics.id"],
            name=op.f("fk_lessons_topic_id_topics"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_lessons")),
        sa.UniqueConstraint("module_id", "position", name="uq_lessons_module_position"),
    )
    op.create_index(op.f("ix_lessons_owner_user_id"), "lessons", ["owner_user_id"])
    op.create_index(op.f("ix_lessons_module_id"), "lessons", ["module_id"])
    op.create_index(op.f("ix_lessons_topic_id"), "lessons", ["topic_id"])
    op.create_index("ix_lessons_owner_module", "lessons", ["owner_user_id", "module_id"])
    op.create_index("ix_lessons_owner_topic", "lessons", ["owner_user_id", "topic_id"])

    op.create_table(
        "study_sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("subject_id", sa.Uuid(), nullable=True),
        sa.Column("topic_id", sa.Uuid(), nullable=True),
        sa.Column("course_id", sa.Uuid(), nullable=True),
        sa.Column("lesson_id", sa.Uuid(), nullable=True),
        sa.Column("mode", sa.String(length=48), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"mode IN ({SESSION_MODE_VALUES})",
            name=op.f("ck_study_sessions_mode_allowed"),
        ),
        sa.CheckConstraint(
            "duration_minutes IS NULL OR duration_minutes >= 0",
            name=op.f("ck_study_sessions_duration_minutes_nonnegative"),
        ),
        sa.ForeignKeyConstraint(
            ["course_id"],
            ["courses.id"],
            name=op.f("fk_study_sessions_course_id_courses"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["lesson_id"],
            ["lessons.id"],
            name=op.f("fk_study_sessions_lesson_id_lessons"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_study_sessions_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["subject_id"],
            ["subjects.id"],
            name=op.f("fk_study_sessions_subject_id_subjects"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["topic_id"],
            ["topics.id"],
            name=op.f("fk_study_sessions_topic_id_topics"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_study_sessions")),
    )
    op.create_index(op.f("ix_study_sessions_owner_user_id"), "study_sessions", ["owner_user_id"])
    op.create_index(op.f("ix_study_sessions_subject_id"), "study_sessions", ["subject_id"])
    op.create_index(op.f("ix_study_sessions_topic_id"), "study_sessions", ["topic_id"])
    op.create_index(op.f("ix_study_sessions_course_id"), "study_sessions", ["course_id"])
    op.create_index(op.f("ix_study_sessions_lesson_id"), "study_sessions", ["lesson_id"])
    op.create_index(
        "ix_study_sessions_owner_started", "study_sessions", ["owner_user_id", "started_at"]
    )
    op.create_index(
        "ix_study_sessions_owner_topic", "study_sessions", ["owner_user_id", "topic_id"]
    )

    op.create_table(
        "quizzes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("topic_id", sa.Uuid(), nullable=True),
        sa.Column("lesson_id", sa.Uuid(), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"status IN ({QUIZ_STATUS_VALUES})",
            name=op.f("ck_quizzes_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["lesson_id"],
            ["lessons.id"],
            name=op.f("fk_quizzes_lesson_id_lessons"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_quizzes_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["topic_id"],
            ["topics.id"],
            name=op.f("fk_quizzes_topic_id_topics"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_quizzes")),
    )
    op.create_index(op.f("ix_quizzes_owner_user_id"), "quizzes", ["owner_user_id"])
    op.create_index(op.f("ix_quizzes_topic_id"), "quizzes", ["topic_id"])
    op.create_index(op.f("ix_quizzes_lesson_id"), "quizzes", ["lesson_id"])
    op.create_index("ix_quizzes_owner_topic", "quizzes", ["owner_user_id", "topic_id"])
    op.create_index("ix_quizzes_owner_lesson", "quizzes", ["owner_user_id", "lesson_id"])

    op.create_table(
        "questions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("quiz_id", sa.Uuid(), nullable=False),
        sa.Column("question_type", sa.String(length=32), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("choices", sa.JSON(), nullable=False),
        sa.Column("correct_answer", sa.Text(), nullable=True),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("difficulty", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"question_type IN ({QUESTION_TYPE_VALUES})",
            name=op.f("ck_questions_question_type_allowed"),
        ),
        sa.CheckConstraint("position >= 0", name=op.f("ck_questions_position_nonnegative")),
        sa.CheckConstraint(
            "difficulty >= 1 AND difficulty <= 5",
            name=op.f("ck_questions_difficulty_range"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_questions_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["quiz_id"],
            ["quizzes.id"],
            name=op.f("fk_questions_quiz_id_quizzes"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_questions")),
        sa.UniqueConstraint("quiz_id", "position", name="uq_questions_quiz_position"),
    )
    op.create_index(op.f("ix_questions_owner_user_id"), "questions", ["owner_user_id"])
    op.create_index(op.f("ix_questions_quiz_id"), "questions", ["quiz_id"])
    op.create_index("ix_questions_owner_quiz", "questions", ["owner_user_id", "quiz_id"])

    op.create_table(
        "attempts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("quiz_id", sa.Uuid(), nullable=False),
        sa.Column("question_id", sa.Uuid(), nullable=True),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("max_score", sa.Float(), nullable=False),
        sa.Column("accuracy", sa.Float(), nullable=False),
        sa.Column("confidence", sa.Integer(), nullable=True),
        sa.Column("hints_used", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("submitted_answer", sa.Text(), nullable=True),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"status IN ({ATTEMPT_STATUS_VALUES})",
            name=op.f("ck_attempts_status_allowed"),
        ),
        sa.CheckConstraint("score >= 0", name=op.f("ck_attempts_score_nonnegative")),
        sa.CheckConstraint("max_score > 0", name=op.f("ck_attempts_max_score_positive")),
        sa.CheckConstraint(
            "accuracy >= 0 AND accuracy <= 1", name=op.f("ck_attempts_accuracy_range")
        ),
        sa.CheckConstraint(
            "confidence IS NULL OR (confidence >= 1 AND confidence <= 5)",
            name=op.f("ck_attempts_confidence_range"),
        ),
        sa.CheckConstraint("hints_used >= 0", name=op.f("ck_attempts_hints_used_nonnegative")),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_attempts_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["question_id"],
            ["questions.id"],
            name=op.f("fk_attempts_question_id_questions"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["quiz_id"],
            ["quizzes.id"],
            name=op.f("fk_attempts_quiz_id_quizzes"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_attempts")),
    )
    op.create_index(op.f("ix_attempts_owner_user_id"), "attempts", ["owner_user_id"])
    op.create_index(op.f("ix_attempts_quiz_id"), "attempts", ["quiz_id"])
    op.create_index(op.f("ix_attempts_question_id"), "attempts", ["question_id"])
    op.create_index("ix_attempts_owner_quiz", "attempts", ["owner_user_id", "quiz_id"])
    op.create_index("ix_attempts_owner_question", "attempts", ["owner_user_id", "question_id"])

    op.create_table(
        "flashcards",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("topic_id", sa.Uuid(), nullable=True),
        sa.Column("front", sa.Text(), nullable=False),
        sa.Column("back", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"status IN ({FLASHCARD_STATUS_VALUES})",
            name=op.f("ck_flashcards_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_flashcards_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["topic_id"],
            ["topics.id"],
            name=op.f("fk_flashcards_topic_id_topics"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_flashcards")),
    )
    op.create_index(op.f("ix_flashcards_owner_user_id"), "flashcards", ["owner_user_id"])
    op.create_index(op.f("ix_flashcards_topic_id"), "flashcards", ["topic_id"])
    op.create_index("ix_flashcards_owner_topic", "flashcards", ["owner_user_id", "topic_id"])

    op.create_table(
        "flashcard_reviews",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("flashcard_id", sa.Uuid(), nullable=False),
        sa.Column("rating", sa.String(length=24), nullable=False),
        sa.Column("confidence", sa.Integer(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("next_review_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"rating IN ({FLASHCARD_REVIEW_RATING_VALUES})",
            name=op.f("ck_flashcard_reviews_rating_allowed"),
        ),
        sa.CheckConstraint(
            "confidence IS NULL OR (confidence >= 1 AND confidence <= 5)",
            name=op.f("ck_flashcard_reviews_confidence_range"),
        ),
        sa.ForeignKeyConstraint(
            ["flashcard_id"],
            ["flashcards.id"],
            name=op.f("fk_flashcard_reviews_flashcard_id_flashcards"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_flashcard_reviews_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_flashcard_reviews")),
    )
    op.create_index(
        op.f("ix_flashcard_reviews_owner_user_id"), "flashcard_reviews", ["owner_user_id"]
    )
    op.create_index(
        op.f("ix_flashcard_reviews_flashcard_id"), "flashcard_reviews", ["flashcard_id"]
    )
    op.create_index(
        "ix_flashcard_reviews_owner_card_reviewed",
        "flashcard_reviews",
        ["owner_user_id", "flashcard_id", "reviewed_at"],
    )

    op.create_table(
        "mastery_records",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("topic_id", sa.Uuid(), nullable=False),
        sa.Column("mastery_score", sa.Float(), nullable=False),
        sa.Column("quiz_accuracy", sa.Float(), nullable=False),
        sa.Column("successful_recall_score", sa.Float(), nullable=False),
        sa.Column("exercise_score", sa.Float(), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=False),
        sa.Column("review_recency_score", sa.Float(), nullable=False),
        sa.Column("hints_penalty", sa.Float(), nullable=False),
        sa.Column("project_evidence_score", sa.Float(), nullable=False),
        sa.Column("calculation", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "mastery_score >= 0 AND mastery_score <= 1",
            name=op.f("ck_mastery_records_mastery_score_range"),
        ),
        sa.CheckConstraint(
            "quiz_accuracy >= 0 AND quiz_accuracy <= 1",
            name=op.f("ck_mastery_records_quiz_accuracy_range"),
        ),
        sa.CheckConstraint(
            "successful_recall_score >= 0 AND successful_recall_score <= 1",
            name=op.f("ck_mastery_records_successful_recall_score_range"),
        ),
        sa.CheckConstraint(
            "exercise_score >= 0 AND exercise_score <= 1",
            name=op.f("ck_mastery_records_exercise_score_range"),
        ),
        sa.CheckConstraint(
            "confidence_score >= 0 AND confidence_score <= 1",
            name=op.f("ck_mastery_records_confidence_score_range"),
        ),
        sa.CheckConstraint(
            "review_recency_score >= 0 AND review_recency_score <= 1",
            name=op.f("ck_mastery_records_review_recency_score_range"),
        ),
        sa.CheckConstraint(
            "hints_penalty >= 0 AND hints_penalty <= 1",
            name=op.f("ck_mastery_records_hints_penalty_range"),
        ),
        sa.CheckConstraint(
            "project_evidence_score >= 0 AND project_evidence_score <= 1",
            name=op.f("ck_mastery_records_project_evidence_score_range"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_mastery_records_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["topic_id"],
            ["topics.id"],
            name=op.f("fk_mastery_records_topic_id_topics"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_mastery_records")),
        sa.UniqueConstraint("owner_user_id", "topic_id", name="uq_mastery_records_owner_topic"),
    )
    op.create_index(op.f("ix_mastery_records_owner_user_id"), "mastery_records", ["owner_user_id"])
    op.create_index(op.f("ix_mastery_records_topic_id"), "mastery_records", ["topic_id"])
    op.create_index(
        "ix_mastery_records_owner_score", "mastery_records", ["owner_user_id", "mastery_score"]
    )

    op.create_table(
        "learning_goals",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("subject_id", sa.Uuid(), nullable=True),
        sa.Column("topic_id", sa.Uuid(), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("target_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"status IN ({LEARNING_GOAL_STATUS_VALUES})",
            name=op.f("ck_learning_goals_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_learning_goals_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["subject_id"],
            ["subjects.id"],
            name=op.f("fk_learning_goals_subject_id_subjects"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["topic_id"],
            ["topics.id"],
            name=op.f("fk_learning_goals_topic_id_topics"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_learning_goals")),
    )
    op.create_index(op.f("ix_learning_goals_owner_user_id"), "learning_goals", ["owner_user_id"])
    op.create_index(op.f("ix_learning_goals_subject_id"), "learning_goals", ["subject_id"])
    op.create_index(op.f("ix_learning_goals_topic_id"), "learning_goals", ["topic_id"])
    op.create_index("ix_learning_goals_owner_status", "learning_goals", ["owner_user_id", "status"])

    op.create_table(
        "study_roadmaps",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("subject_id", sa.Uuid(), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("steps", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"status IN ({STUDY_ROADMAP_STATUS_VALUES})",
            name=op.f("ck_study_roadmaps_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_study_roadmaps_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["subject_id"],
            ["subjects.id"],
            name=op.f("fk_study_roadmaps_subject_id_subjects"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_study_roadmaps")),
    )
    op.create_index(op.f("ix_study_roadmaps_owner_user_id"), "study_roadmaps", ["owner_user_id"])
    op.create_index(op.f("ix_study_roadmaps_subject_id"), "study_roadmaps", ["subject_id"])
    op.create_index("ix_study_roadmaps_owner_status", "study_roadmaps", ["owner_user_id", "status"])


def downgrade() -> None:
    op.drop_index("ix_study_roadmaps_owner_status", table_name="study_roadmaps")
    op.drop_index(op.f("ix_study_roadmaps_subject_id"), table_name="study_roadmaps")
    op.drop_index(op.f("ix_study_roadmaps_owner_user_id"), table_name="study_roadmaps")
    op.drop_table("study_roadmaps")

    op.drop_index("ix_learning_goals_owner_status", table_name="learning_goals")
    op.drop_index(op.f("ix_learning_goals_topic_id"), table_name="learning_goals")
    op.drop_index(op.f("ix_learning_goals_subject_id"), table_name="learning_goals")
    op.drop_index(op.f("ix_learning_goals_owner_user_id"), table_name="learning_goals")
    op.drop_table("learning_goals")

    op.drop_index("ix_mastery_records_owner_score", table_name="mastery_records")
    op.drop_index(op.f("ix_mastery_records_topic_id"), table_name="mastery_records")
    op.drop_index(op.f("ix_mastery_records_owner_user_id"), table_name="mastery_records")
    op.drop_table("mastery_records")

    op.drop_index("ix_flashcard_reviews_owner_card_reviewed", table_name="flashcard_reviews")
    op.drop_index(op.f("ix_flashcard_reviews_flashcard_id"), table_name="flashcard_reviews")
    op.drop_index(op.f("ix_flashcard_reviews_owner_user_id"), table_name="flashcard_reviews")
    op.drop_table("flashcard_reviews")

    op.drop_index("ix_flashcards_owner_topic", table_name="flashcards")
    op.drop_index(op.f("ix_flashcards_topic_id"), table_name="flashcards")
    op.drop_index(op.f("ix_flashcards_owner_user_id"), table_name="flashcards")
    op.drop_table("flashcards")

    op.drop_index("ix_attempts_owner_question", table_name="attempts")
    op.drop_index("ix_attempts_owner_quiz", table_name="attempts")
    op.drop_index(op.f("ix_attempts_question_id"), table_name="attempts")
    op.drop_index(op.f("ix_attempts_quiz_id"), table_name="attempts")
    op.drop_index(op.f("ix_attempts_owner_user_id"), table_name="attempts")
    op.drop_table("attempts")

    op.drop_index("ix_questions_owner_quiz", table_name="questions")
    op.drop_index(op.f("ix_questions_quiz_id"), table_name="questions")
    op.drop_index(op.f("ix_questions_owner_user_id"), table_name="questions")
    op.drop_table("questions")

    op.drop_index("ix_quizzes_owner_lesson", table_name="quizzes")
    op.drop_index("ix_quizzes_owner_topic", table_name="quizzes")
    op.drop_index(op.f("ix_quizzes_lesson_id"), table_name="quizzes")
    op.drop_index(op.f("ix_quizzes_topic_id"), table_name="quizzes")
    op.drop_index(op.f("ix_quizzes_owner_user_id"), table_name="quizzes")
    op.drop_table("quizzes")

    op.drop_index("ix_study_sessions_owner_topic", table_name="study_sessions")
    op.drop_index("ix_study_sessions_owner_started", table_name="study_sessions")
    op.drop_index(op.f("ix_study_sessions_lesson_id"), table_name="study_sessions")
    op.drop_index(op.f("ix_study_sessions_course_id"), table_name="study_sessions")
    op.drop_index(op.f("ix_study_sessions_topic_id"), table_name="study_sessions")
    op.drop_index(op.f("ix_study_sessions_subject_id"), table_name="study_sessions")
    op.drop_index(op.f("ix_study_sessions_owner_user_id"), table_name="study_sessions")
    op.drop_table("study_sessions")

    op.drop_index("ix_lessons_owner_topic", table_name="lessons")
    op.drop_index("ix_lessons_owner_module", table_name="lessons")
    op.drop_index(op.f("ix_lessons_topic_id"), table_name="lessons")
    op.drop_index(op.f("ix_lessons_module_id"), table_name="lessons")
    op.drop_index(op.f("ix_lessons_owner_user_id"), table_name="lessons")
    op.drop_table("lessons")

    op.drop_index("ix_course_modules_owner_course", table_name="course_modules")
    op.drop_index(op.f("ix_course_modules_course_id"), table_name="course_modules")
    op.drop_index(op.f("ix_course_modules_owner_user_id"), table_name="course_modules")
    op.drop_table("course_modules")

    op.drop_index("ix_courses_owner_subject", table_name="courses")
    op.drop_index("ix_courses_owner_status_updated", table_name="courses")
    op.drop_index(op.f("ix_courses_subject_id"), table_name="courses")
    op.drop_index(op.f("ix_courses_owner_user_id"), table_name="courses")
    op.drop_table("courses")

    op.drop_index("ix_learning_resources_owner_topic", table_name="learning_resources")
    op.drop_index("ix_learning_resources_owner_subject", table_name="learning_resources")
    op.drop_index(op.f("ix_learning_resources_file_id"), table_name="learning_resources")
    op.drop_index(op.f("ix_learning_resources_topic_id"), table_name="learning_resources")
    op.drop_index(op.f("ix_learning_resources_subject_id"), table_name="learning_resources")
    op.drop_index(op.f("ix_learning_resources_owner_user_id"), table_name="learning_resources")
    op.drop_table("learning_resources")

    op.drop_index("ix_topic_relations_owner_target", table_name="topic_relations")
    op.drop_index("ix_topic_relations_owner_source", table_name="topic_relations")
    op.drop_index(op.f("ix_topic_relations_target_topic_id"), table_name="topic_relations")
    op.drop_index(op.f("ix_topic_relations_source_topic_id"), table_name="topic_relations")
    op.drop_index(op.f("ix_topic_relations_owner_user_id"), table_name="topic_relations")
    op.drop_table("topic_relations")

    op.execute("DROP INDEX IF EXISTS ix_topics_search_fts")
    op.drop_index("ix_topics_owner_status_updated", table_name="topics")
    op.drop_index("ix_topics_owner_subject", table_name="topics")
    op.drop_index(op.f("ix_topics_subject_id"), table_name="topics")
    op.drop_index(op.f("ix_topics_owner_user_id"), table_name="topics")
    op.drop_table("topics")

    op.execute("DROP INDEX IF EXISTS ix_subjects_search_fts")
    op.drop_index("ix_subjects_owner_status_updated", table_name="subjects")
    op.drop_index(op.f("ix_subjects_owner_user_id"), table_name="subjects")
    op.drop_table("subjects")
