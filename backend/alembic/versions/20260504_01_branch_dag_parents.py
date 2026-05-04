"""Support multi-parent branch lineage.

Revision ID: 20260504_01
Revises: 20260502_02
Create Date: 2026-05-04 11:50:00
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260504_01"
down_revision = "20260502_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "research_branch_parents",
        sa.Column("branch_id", sa.Integer(), nullable=False),
        sa.Column("parent_branch_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["branch_id"], ["research_branches.id"]),
        sa.ForeignKeyConstraint(["parent_branch_id"], ["research_branches.id"]),
        sa.PrimaryKeyConstraint("branch_id", "parent_branch_id"),
    )

    op.execute(
        sa.text(
            """
            INSERT INTO research_branch_parents (branch_id, parent_branch_id)
            SELECT id, parent_branch_id
            FROM research_branches
            WHERE parent_branch_id IS NOT NULL
            """,
        ),
    )

    with op.batch_alter_table("research_branches") as batch_op:
        batch_op.drop_column("parent_branch_id")


def downgrade() -> None:
    with op.batch_alter_table("research_branches") as batch_op:
        batch_op.add_column(sa.Column("parent_branch_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            None,
            "research_branches",
            ["parent_branch_id"],
            ["id"],
        )

    op.execute(
        sa.text(
            """
            UPDATE research_branches
            SET parent_branch_id = (
                SELECT MIN(parent_branch_id)
                FROM research_branch_parents
                WHERE research_branch_parents.branch_id = research_branches.id
            )
            """,
        ),
    )

    op.drop_table("research_branch_parents")
