import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, Table, Text, func
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from gfr_backend.db.base import Base


class NodeKind(enum.StrEnum):
    initial = "initial"
    update = "update"
    merge = "merge"


progress_node_parents = Table(
    "progress_node_parents",
    Base.metadata,
    Column("node_id", ForeignKey("progress_nodes.id"), primary_key=True),
    Column("parent_node_id", ForeignKey("progress_nodes.id"), primary_key=True),
)


class ProgressNode(Base):
    __tablename__ = "progress_nodes"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    line_id: Mapped[int] = mapped_column(ForeignKey("research_lines.id"), nullable=False)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    blockers: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_step: Mapped[str | None] = mapped_column(Text, nullable=True)
    node_kind: Mapped[NodeKind] = mapped_column(Enum(NodeKind), nullable=False)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_suggested_subbranches: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    ai_status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    ai_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    project = relationship("Project", back_populates="nodes")
    line = relationship(
        "ResearchLine",
        back_populates="nodes",
        foreign_keys=[line_id],
    )
    author = relationship("User")
    parent_nodes = relationship(
        "ProgressNode",
        secondary=progress_node_parents,
        primaryjoin=id == progress_node_parents.c.node_id,
        secondaryjoin=id == progress_node_parents.c.parent_node_id,
        back_populates="child_nodes",
    )
    child_nodes = relationship(
        "ProgressNode",
        secondary=progress_node_parents,
        primaryjoin=id == progress_node_parents.c.parent_node_id,
        secondaryjoin=id == progress_node_parents.c.node_id,
        back_populates="parent_nodes",
    )

    @property
    def parent_node_ids(self) -> list[int]:
        return sorted(parent.id for parent in self.parent_nodes)
