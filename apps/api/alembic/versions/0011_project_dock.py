"""Add project dock foundation.

Revision ID: 0011_project_dock
Revises: 0010_learning_engine
Create Date: 2026-07-21 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0011_project_dock"
down_revision: str | None = "0010_learning_engine"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

PROJECT_STATUS_VALUES = "'active', 'paused', 'completed', 'archived'"
MILESTONE_STATUS_VALUES = "'planned', 'active', 'completed', 'blocked'"
TASK_STATUS_VALUES = "'todo', 'in_progress', 'done', 'blocked'"
PRIORITY_VALUES = "'low', 'medium', 'high'"
BLOCKER_STATUS_VALUES = "'open', 'resolved'"
ACTIVITY_TYPE_VALUES = (
    "'project.created', 'project.updated', 'project.archived', 'project.completed', "
    "'project.milestone_created', 'project.task_created', 'project.task_updated', "
    "'project.note_created', 'project.link_created', 'project.file_attached', "
    "'project.topic_linked', 'project.technology_added', 'project.blocker_created', "
    "'project.blocker_updated'"
)


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("normalized_name", sa.String(length=200), nullable=False),
        sa.Column("objective", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("repository_url", sa.String(length=1000), nullable=True),
        sa.Column("started_on", sa.Date(), nullable=True),
        sa.Column("target_date", sa.Date(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"status IN ({PROJECT_STATUS_VALUES})",
            name=op.f("ck_projects_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_projects_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_projects")),
    )
    op.create_index(op.f("ix_projects_owner_user_id"), "projects", ["owner_user_id"])
    op.create_index(
        "ix_projects_owner_status_updated", "projects", ["owner_user_id", "status", "updated_at"]
    )
    op.execute(
        "CREATE INDEX ix_projects_search_fts ON projects USING GIN "
        "(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(objective, '') || ' ' || "
        "coalesce(description, '') || ' ' || coalesce(repository_url, '')))"
    )

    op.create_table(
        "project_milestones",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"status IN ({MILESTONE_STATUS_VALUES})",
            name=op.f("ck_project_milestones_status_allowed"),
        ),
        sa.CheckConstraint(
            "position >= 0", name=op.f("ck_project_milestones_position_nonnegative")
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_project_milestones_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name=op.f("fk_project_milestones_project_id_projects"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_project_milestones")),
        sa.UniqueConstraint(
            "project_id",
            "position",
            name="uq_project_milestones_project_position",
        ),
    )
    op.create_index(
        op.f("ix_project_milestones_owner_user_id"), "project_milestones", ["owner_user_id"]
    )
    op.create_index(op.f("ix_project_milestones_project_id"), "project_milestones", ["project_id"])
    op.create_index(
        "ix_project_milestones_owner_project",
        "project_milestones",
        ["owner_user_id", "project_id"],
    )

    op.create_table(
        "project_tasks",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("milestone_id", sa.Uuid(), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("priority", sa.String(length=24), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"status IN ({TASK_STATUS_VALUES})",
            name=op.f("ck_project_tasks_status_allowed"),
        ),
        sa.CheckConstraint(
            f"priority IN ({PRIORITY_VALUES})",
            name=op.f("ck_project_tasks_priority_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["milestone_id"],
            ["project_milestones.id"],
            name=op.f("fk_project_tasks_milestone_id_project_milestones"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_project_tasks_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name=op.f("fk_project_tasks_project_id_projects"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_project_tasks")),
    )
    op.create_index(op.f("ix_project_tasks_owner_user_id"), "project_tasks", ["owner_user_id"])
    op.create_index(op.f("ix_project_tasks_project_id"), "project_tasks", ["project_id"])
    op.create_index(op.f("ix_project_tasks_milestone_id"), "project_tasks", ["milestone_id"])
    op.create_index(
        "ix_project_tasks_owner_project_status",
        "project_tasks",
        ["owner_user_id", "project_id", "status"],
    )
    op.create_index(
        "ix_project_tasks_owner_milestone", "project_tasks", ["owner_user_id", "milestone_id"]
    )
    op.execute(
        "CREATE INDEX ix_project_tasks_search_fts ON project_tasks USING GIN "
        "(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')))"
    )

    op.create_table(
        "project_notes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_project_notes_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name=op.f("fk_project_notes_project_id_projects"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_project_notes")),
    )
    op.create_index(op.f("ix_project_notes_owner_user_id"), "project_notes", ["owner_user_id"])
    op.create_index(op.f("ix_project_notes_project_id"), "project_notes", ["project_id"])
    op.create_index(
        "ix_project_notes_owner_project", "project_notes", ["owner_user_id", "project_id"]
    )

    op.create_table(
        "project_links",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("url", sa.String(length=1000), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_project_links_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name=op.f("fk_project_links_project_id_projects"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_project_links")),
    )
    op.create_index(op.f("ix_project_links_owner_user_id"), "project_links", ["owner_user_id"])
    op.create_index(op.f("ix_project_links_project_id"), "project_links", ["project_id"])
    op.create_index(
        "ix_project_links_owner_project", "project_links", ["owner_user_id", "project_id"]
    )

    op.create_table(
        "project_files",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("file_id", sa.Uuid(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["file_id"],
            ["files.id"],
            name=op.f("fk_project_files_file_id_files"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_project_files_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name=op.f("fk_project_files_project_id_projects"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_project_files")),
        sa.UniqueConstraint(
            "owner_user_id",
            "project_id",
            "file_id",
            name="uq_project_files_owner_project_file",
        ),
    )
    op.create_index(op.f("ix_project_files_owner_user_id"), "project_files", ["owner_user_id"])
    op.create_index(op.f("ix_project_files_project_id"), "project_files", ["project_id"])
    op.create_index(op.f("ix_project_files_file_id"), "project_files", ["file_id"])
    op.create_index(
        "ix_project_files_owner_project", "project_files", ["owner_user_id", "project_id"]
    )
    op.create_index("ix_project_files_owner_file", "project_files", ["owner_user_id", "file_id"])

    op.create_table(
        "project_topics",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("topic_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_project_topics_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name=op.f("fk_project_topics_project_id_projects"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["topic_id"],
            ["topics.id"],
            name=op.f("fk_project_topics_topic_id_topics"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_project_topics")),
        sa.UniqueConstraint(
            "owner_user_id",
            "project_id",
            "topic_id",
            name="uq_project_topics_owner_project_topic",
        ),
    )
    op.create_index(op.f("ix_project_topics_owner_user_id"), "project_topics", ["owner_user_id"])
    op.create_index(op.f("ix_project_topics_project_id"), "project_topics", ["project_id"])
    op.create_index(op.f("ix_project_topics_topic_id"), "project_topics", ["topic_id"])
    op.create_index(
        "ix_project_topics_owner_project", "project_topics", ["owner_user_id", "project_id"]
    )
    op.create_index(
        "ix_project_topics_owner_topic", "project_topics", ["owner_user_id", "topic_id"]
    )

    op.create_table(
        "project_technologies",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("normalized_name", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_project_technologies_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name=op.f("fk_project_technologies_project_id_projects"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_project_technologies")),
        sa.UniqueConstraint(
            "owner_user_id",
            "project_id",
            "normalized_name",
            name="uq_project_technologies_owner_project_name",
        ),
    )
    op.create_index(
        op.f("ix_project_technologies_owner_user_id"),
        "project_technologies",
        ["owner_user_id"],
    )
    op.create_index(
        op.f("ix_project_technologies_project_id"), "project_technologies", ["project_id"]
    )
    op.create_index(
        "ix_project_technologies_owner_project",
        "project_technologies",
        ["owner_user_id", "project_id"],
    )

    op.create_table(
        "project_blockers",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"status IN ({BLOCKER_STATUS_VALUES})",
            name=op.f("ck_project_blockers_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_project_blockers_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name=op.f("fk_project_blockers_project_id_projects"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_project_blockers")),
    )
    op.create_index(
        op.f("ix_project_blockers_owner_user_id"), "project_blockers", ["owner_user_id"]
    )
    op.create_index(op.f("ix_project_blockers_project_id"), "project_blockers", ["project_id"])
    op.create_index(
        "ix_project_blockers_owner_project_status",
        "project_blockers",
        ["owner_user_id", "project_id", "status"],
    )

    op.create_table(
        "project_activity",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("activity_type", sa.String(length=64), nullable=False),
        sa.Column("description", sa.String(length=240), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            f"activity_type IN ({ACTIVITY_TYPE_VALUES})",
            name=op.f("ck_project_activity_activity_type_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.id"],
            name=op.f("fk_project_activity_owner_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name=op.f("fk_project_activity_project_id_projects"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_project_activity")),
    )
    op.create_index(
        op.f("ix_project_activity_owner_user_id"), "project_activity", ["owner_user_id"]
    )
    op.create_index(op.f("ix_project_activity_project_id"), "project_activity", ["project_id"])
    op.create_index(
        "ix_project_activity_owner_project_created",
        "project_activity",
        ["owner_user_id", "project_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_project_activity_owner_project_created", table_name="project_activity")
    op.drop_index(op.f("ix_project_activity_project_id"), table_name="project_activity")
    op.drop_index(op.f("ix_project_activity_owner_user_id"), table_name="project_activity")
    op.drop_table("project_activity")

    op.drop_index("ix_project_blockers_owner_project_status", table_name="project_blockers")
    op.drop_index(op.f("ix_project_blockers_project_id"), table_name="project_blockers")
    op.drop_index(op.f("ix_project_blockers_owner_user_id"), table_name="project_blockers")
    op.drop_table("project_blockers")

    op.drop_index("ix_project_technologies_owner_project", table_name="project_technologies")
    op.drop_index(op.f("ix_project_technologies_project_id"), table_name="project_technologies")
    op.drop_index(op.f("ix_project_technologies_owner_user_id"), table_name="project_technologies")
    op.drop_table("project_technologies")

    op.drop_index("ix_project_topics_owner_topic", table_name="project_topics")
    op.drop_index("ix_project_topics_owner_project", table_name="project_topics")
    op.drop_index(op.f("ix_project_topics_topic_id"), table_name="project_topics")
    op.drop_index(op.f("ix_project_topics_project_id"), table_name="project_topics")
    op.drop_index(op.f("ix_project_topics_owner_user_id"), table_name="project_topics")
    op.drop_table("project_topics")

    op.drop_index("ix_project_files_owner_file", table_name="project_files")
    op.drop_index("ix_project_files_owner_project", table_name="project_files")
    op.drop_index(op.f("ix_project_files_file_id"), table_name="project_files")
    op.drop_index(op.f("ix_project_files_project_id"), table_name="project_files")
    op.drop_index(op.f("ix_project_files_owner_user_id"), table_name="project_files")
    op.drop_table("project_files")

    op.drop_index("ix_project_links_owner_project", table_name="project_links")
    op.drop_index(op.f("ix_project_links_project_id"), table_name="project_links")
    op.drop_index(op.f("ix_project_links_owner_user_id"), table_name="project_links")
    op.drop_table("project_links")

    op.drop_index("ix_project_notes_owner_project", table_name="project_notes")
    op.drop_index(op.f("ix_project_notes_project_id"), table_name="project_notes")
    op.drop_index(op.f("ix_project_notes_owner_user_id"), table_name="project_notes")
    op.drop_table("project_notes")

    op.execute("DROP INDEX IF EXISTS ix_project_tasks_search_fts")
    op.drop_index("ix_project_tasks_owner_milestone", table_name="project_tasks")
    op.drop_index("ix_project_tasks_owner_project_status", table_name="project_tasks")
    op.drop_index(op.f("ix_project_tasks_milestone_id"), table_name="project_tasks")
    op.drop_index(op.f("ix_project_tasks_project_id"), table_name="project_tasks")
    op.drop_index(op.f("ix_project_tasks_owner_user_id"), table_name="project_tasks")
    op.drop_table("project_tasks")

    op.drop_index("ix_project_milestones_owner_project", table_name="project_milestones")
    op.drop_index(op.f("ix_project_milestones_project_id"), table_name="project_milestones")
    op.drop_index(op.f("ix_project_milestones_owner_user_id"), table_name="project_milestones")
    op.drop_table("project_milestones")

    op.execute("DROP INDEX IF EXISTS ix_projects_search_fts")
    op.drop_index("ix_projects_owner_status_updated", table_name="projects")
    op.drop_index(op.f("ix_projects_owner_user_id"), table_name="projects")
    op.drop_table("projects")
