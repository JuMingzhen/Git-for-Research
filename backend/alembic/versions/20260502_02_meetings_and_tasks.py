"""Add meetings and meeting tasks.

Revision ID: 20260502_02
Revises: 20260502_01
Create Date: 2026-05-02 14:10:00
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260502_02"
down_revision = "20260502_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "meetings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("raw_notes", sa.Text(), nullable=True),
        sa.Column("ai_briefing", sa.Text(), nullable=True),
        sa.Column("briefing_status", sa.String(length=50), nullable=False),
        sa.Column("briefing_error", sa.Text(), nullable=True),
        sa.Column("ai_summary", sa.Text(), nullable=True),
        sa.Column("summary_status", sa.String(length=50), nullable=False),
        sa.Column("summary_error", sa.Text(), nullable=True),
        sa.Column("task_split_status", sa.String(length=50), nullable=False),
        sa.Column("task_split_error", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "meeting_tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("meeting_id", sa.Integer(), nullable=False),
        sa.Column("assignee_id", sa.Integer(), nullable=False),
        sa.Column("branch_id", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("due_hint", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["assignee_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["branch_id"], ["research_branches.id"]),
        sa.ForeignKeyConstraint(["meeting_id"], ["meetings.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("meeting_tasks")
    op.drop_table("meetings")
