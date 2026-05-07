"""line node graph initial schema

Revision ID: 20260507_01
Revises:
Create Date: 2026-05-07
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260507_01"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


line_type_enum = sa.Enum("main", "personal", "sub", name="linetype")
node_kind_enum = sa.Enum("initial", "update", "merge", name="nodekind")
user_role_enum = sa.Enum("advisor", "student", name="userrole")


def upgrade() -> None:
    op.create_table(
        "teams",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
    )
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("role", user_role_enum, nullable=False),
        sa.Column("team_id", sa.Integer(), sa.ForeignKey("teams.id"), nullable=True),
    )
    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="active"),
        sa.Column("main_line_id", sa.Integer(), nullable=True),
    )
    op.create_table(
        "research_lines",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("goal", sa.Text(), nullable=True),
        sa.Column("line_type", line_type_enum, nullable=False),
        sa.Column("parent_line_id", sa.Integer(), sa.ForeignKey("research_lines.id"), nullable=True),
        sa.Column("base_node_id", sa.Integer(), nullable=True),
        sa.Column("head_node_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "progress_nodes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("line_id", sa.Integer(), sa.ForeignKey("research_lines.id"), nullable=False),
        sa.Column("author_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("blockers", sa.Text(), nullable=True),
        sa.Column("next_step", sa.Text(), nullable=True),
        sa.Column("node_kind", node_kind_enum, nullable=False),
        sa.Column("ai_summary", sa.Text(), nullable=True),
        sa.Column("ai_suggested_subbranches", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("ai_status", sa.String(length=50), nullable=False, server_default="pending"),
        sa.Column("ai_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "progress_node_parents",
        sa.Column("node_id", sa.Integer(), sa.ForeignKey("progress_nodes.id"), primary_key=True),
        sa.Column("parent_node_id", sa.Integer(), sa.ForeignKey("progress_nodes.id"), primary_key=True),
    )
    op.create_table(
        "meetings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("raw_notes", sa.Text(), nullable=True),
        sa.Column("ai_briefing", sa.Text(), nullable=True),
        sa.Column("briefing_status", sa.String(length=50), nullable=False, server_default="pending"),
        sa.Column("briefing_error", sa.Text(), nullable=True),
        sa.Column("ai_summary", sa.Text(), nullable=True),
        sa.Column("summary_status", sa.String(length=50), nullable=False, server_default="pending"),
        sa.Column("summary_error", sa.Text(), nullable=True),
        sa.Column("task_split_status", sa.String(length=50), nullable=False, server_default="pending"),
        sa.Column("task_split_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "meeting_tasks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("meeting_id", sa.Integer(), sa.ForeignKey("meetings.id"), nullable=False),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("assignee_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("assignee_name_snapshot", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("due_hint", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="todo"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

def downgrade() -> None:
    op.drop_table("meeting_tasks")
    op.drop_table("meetings")
    op.drop_table("progress_node_parents")
    op.drop_table("progress_nodes")
    op.drop_table("research_lines")
    op.drop_table("projects")
    op.drop_table("users")
    op.drop_table("teams")
    node_kind_enum.drop(op.get_bind(), checkfirst=False)
    line_type_enum.drop(op.get_bind(), checkfirst=False)
    user_role_enum.drop(op.get_bind(), checkfirst=False)
