"""Add coding workspace foundation.

Revision ID: 0014_coding_workspace
Revises: 0013_profile_settings
Create Date: 2026-07-22 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0014_coding_workspace"
down_revision: str | None = "0013_profile_settings"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

CODING_LANGUAGE_VALUES = (
    "'python', 'javascript', 'typescript', 'sql', 'cpp', 'systemverilog', 'text'"
)
SNIPPET_STATUS_VALUES = "'active', 'archived'"
EXERCISE_DIFFICULTY_VALUES = "'intro', 'practice', 'challenge'"
EXERCISE_STATUS_VALUES = "'active', 'archived'"
ATTEMPT_STATUS_VALUES = "'submitted', 'reviewed'"
ASSISTANT_KIND_VALUES = "'explain', 'review'"
ASSISTANT_STATUS_VALUES = "'complete', 'failed'"


def upgrade() -> None:
    op.create_table(
        "code_snippets",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("language", sa.String(length=32), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=True),
        sa.Column("file_id", sa.Uuid(), nullable=True),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"language IN ({CODING_LANGUAGE_VALUES})",
            name=op.f("ck_code_snippets_language_allowed"),
        ),
        sa.CheckConstraint(
            f"status IN ({SNIPPET_STATUS_VALUES})",
            name=op.f("ck_code_snippets_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["file_id"],
            ["files.id"],
            name=op.f("fk_code_snippets_file_id_files"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_code_snippets_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name=op.f("fk_code_snippets_project_id_projects"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_code_snippets")),
    )
    op.create_index(op.f("ix_code_snippets_owner_user_id"), "code_snippets", ["owner_user_id"])
    op.create_index(op.f("ix_code_snippets_project_id"), "code_snippets", ["project_id"])
    op.create_index(op.f("ix_code_snippets_file_id"), "code_snippets", ["file_id"])
    op.create_index(
        "ix_code_snippets_owner_status_updated",
        "code_snippets",
        ["owner_user_id", "status", "updated_at"],
    )
    op.create_index(
        "ix_code_snippets_owner_project", "code_snippets", ["owner_user_id", "project_id"]
    )
    op.create_index("ix_code_snippets_owner_file", "code_snippets", ["owner_user_id", "file_id"])

    op.create_table(
        "coding_exercises",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("language", sa.String(length=32), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("starter_code", sa.Text(), nullable=False),
        sa.Column("solution_notes", sa.Text(), nullable=True),
        sa.Column("difficulty", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("topic_id", sa.Uuid(), nullable=True),
        sa.Column("project_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"language IN ({CODING_LANGUAGE_VALUES})",
            name=op.f("ck_coding_exercises_language_allowed"),
        ),
        sa.CheckConstraint(
            f"difficulty IN ({EXERCISE_DIFFICULTY_VALUES})",
            name=op.f("ck_coding_exercises_difficulty_allowed"),
        ),
        sa.CheckConstraint(
            f"status IN ({EXERCISE_STATUS_VALUES})",
            name=op.f("ck_coding_exercises_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_coding_exercises_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name=op.f("fk_coding_exercises_project_id_projects"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["topic_id"],
            ["topics.id"],
            name=op.f("fk_coding_exercises_topic_id_topics"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_coding_exercises")),
    )
    op.create_index(
        op.f("ix_coding_exercises_owner_user_id"), "coding_exercises", ["owner_user_id"]
    )
    op.create_index(op.f("ix_coding_exercises_topic_id"), "coding_exercises", ["topic_id"])
    op.create_index(op.f("ix_coding_exercises_project_id"), "coding_exercises", ["project_id"])
    op.create_index(
        "ix_coding_exercises_owner_status_updated",
        "coding_exercises",
        ["owner_user_id", "status", "updated_at"],
    )
    op.create_index(
        "ix_coding_exercises_owner_topic", "coding_exercises", ["owner_user_id", "topic_id"]
    )
    op.create_index(
        "ix_coding_exercises_owner_project",
        "coding_exercises",
        ["owner_user_id", "project_id"],
    )

    op.create_table(
        "coding_exercise_attempts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("exercise_id", sa.Uuid(), nullable=False),
        sa.Column("snippet_id", sa.Uuid(), nullable=True),
        sa.Column("submitted_code", sa.Text(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"status IN ({ATTEMPT_STATUS_VALUES})",
            name=op.f("ck_coding_exercise_attempts_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["exercise_id"],
            ["coding_exercises.id"],
            name=op.f("fk_coding_exercise_attempts_exercise_id_coding_exercises"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_coding_exercise_attempts_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["snippet_id"],
            ["code_snippets.id"],
            name=op.f("fk_coding_exercise_attempts_snippet_id_code_snippets"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_coding_exercise_attempts")),
    )
    op.create_index(
        op.f("ix_coding_exercise_attempts_owner_user_id"),
        "coding_exercise_attempts",
        ["owner_user_id"],
    )
    op.create_index(
        op.f("ix_coding_exercise_attempts_exercise_id"),
        "coding_exercise_attempts",
        ["exercise_id"],
    )
    op.create_index(
        op.f("ix_coding_exercise_attempts_snippet_id"),
        "coding_exercise_attempts",
        ["snippet_id"],
    )
    op.create_index(
        "ix_coding_exercise_attempts_owner_exercise",
        "coding_exercise_attempts",
        ["owner_user_id", "exercise_id", "created_at"],
    )
    op.create_index(
        "ix_coding_exercise_attempts_owner_snippet",
        "coding_exercise_attempts",
        ["owner_user_id", "snippet_id"],
    )

    op.create_table(
        "code_assistant_requests",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("snippet_id", sa.Uuid(), nullable=True),
        sa.Column("project_id", sa.Uuid(), nullable=True),
        sa.Column("ai_usage_record_id", sa.Uuid(), nullable=True),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("language", sa.String(length=32), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=True),
        sa.Column("code_excerpt", sa.Text(), nullable=False),
        sa.Column("response", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("provider_name", sa.String(length=80), nullable=True),
        sa.Column("model_name", sa.String(length=120), nullable=True),
        sa.Column("error_code", sa.String(length=80), nullable=True),
        sa.Column("error_message", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"kind IN ({ASSISTANT_KIND_VALUES})",
            name=op.f("ck_code_assistant_requests_kind_allowed"),
        ),
        sa.CheckConstraint(
            f"language IN ({CODING_LANGUAGE_VALUES})",
            name=op.f("ck_code_assistant_requests_language_allowed"),
        ),
        sa.CheckConstraint(
            f"status IN ({ASSISTANT_STATUS_VALUES})",
            name=op.f("ck_code_assistant_requests_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["ai_usage_record_id"],
            ["ai_usage_records.id"],
            name=op.f("fk_code_assistant_requests_ai_usage_record_id_ai_usage_records"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_code_assistant_requests_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name=op.f("fk_code_assistant_requests_project_id_projects"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["snippet_id"],
            ["code_snippets.id"],
            name=op.f("fk_code_assistant_requests_snippet_id_code_snippets"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_code_assistant_requests")),
    )
    op.create_index(
        op.f("ix_code_assistant_requests_owner_user_id"),
        "code_assistant_requests",
        ["owner_user_id"],
    )
    op.create_index(
        op.f("ix_code_assistant_requests_snippet_id"),
        "code_assistant_requests",
        ["snippet_id"],
    )
    op.create_index(
        op.f("ix_code_assistant_requests_project_id"),
        "code_assistant_requests",
        ["project_id"],
    )
    op.create_index(
        op.f("ix_code_assistant_requests_ai_usage_record_id"),
        "code_assistant_requests",
        ["ai_usage_record_id"],
    )
    op.create_index(
        "ix_code_assistant_requests_owner_created",
        "code_assistant_requests",
        ["owner_user_id", "created_at"],
    )
    op.create_index(
        "ix_code_assistant_requests_owner_snippet",
        "code_assistant_requests",
        ["owner_user_id", "snippet_id"],
    )
    op.create_index(
        "ix_code_assistant_requests_owner_project",
        "code_assistant_requests",
        ["owner_user_id", "project_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_code_assistant_requests_owner_project", table_name="code_assistant_requests")
    op.drop_index("ix_code_assistant_requests_owner_snippet", table_name="code_assistant_requests")
    op.drop_index("ix_code_assistant_requests_owner_created", table_name="code_assistant_requests")
    op.drop_index(
        op.f("ix_code_assistant_requests_ai_usage_record_id"),
        table_name="code_assistant_requests",
    )
    op.drop_index(
        op.f("ix_code_assistant_requests_project_id"), table_name="code_assistant_requests"
    )
    op.drop_index(
        op.f("ix_code_assistant_requests_snippet_id"), table_name="code_assistant_requests"
    )
    op.drop_index(
        op.f("ix_code_assistant_requests_owner_user_id"),
        table_name="code_assistant_requests",
    )
    op.drop_table("code_assistant_requests")

    op.drop_index(
        "ix_coding_exercise_attempts_owner_snippet", table_name="coding_exercise_attempts"
    )
    op.drop_index(
        "ix_coding_exercise_attempts_owner_exercise", table_name="coding_exercise_attempts"
    )
    op.drop_index(
        op.f("ix_coding_exercise_attempts_snippet_id"), table_name="coding_exercise_attempts"
    )
    op.drop_index(
        op.f("ix_coding_exercise_attempts_exercise_id"), table_name="coding_exercise_attempts"
    )
    op.drop_index(
        op.f("ix_coding_exercise_attempts_owner_user_id"),
        table_name="coding_exercise_attempts",
    )
    op.drop_table("coding_exercise_attempts")

    op.drop_index("ix_coding_exercises_owner_project", table_name="coding_exercises")
    op.drop_index("ix_coding_exercises_owner_topic", table_name="coding_exercises")
    op.drop_index("ix_coding_exercises_owner_status_updated", table_name="coding_exercises")
    op.drop_index(op.f("ix_coding_exercises_project_id"), table_name="coding_exercises")
    op.drop_index(op.f("ix_coding_exercises_topic_id"), table_name="coding_exercises")
    op.drop_index(op.f("ix_coding_exercises_owner_user_id"), table_name="coding_exercises")
    op.drop_table("coding_exercises")

    op.drop_index("ix_code_snippets_owner_file", table_name="code_snippets")
    op.drop_index("ix_code_snippets_owner_project", table_name="code_snippets")
    op.drop_index("ix_code_snippets_owner_status_updated", table_name="code_snippets")
    op.drop_index(op.f("ix_code_snippets_file_id"), table_name="code_snippets")
    op.drop_index(op.f("ix_code_snippets_project_id"), table_name="code_snippets")
    op.drop_index(op.f("ix_code_snippets_owner_user_id"), table_name="code_snippets")
    op.drop_table("code_snippets")
