import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from gfr_backend.db.base import Base


class LineType(enum.StrEnum):
    main = "main"
    personal = "personal"
    sub = "sub"


class ResearchLine(Base):
    __tablename__ = "research_lines"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    goal: Mapped[str | None] = mapped_column(Text, nullable=True)
    line_type: Mapped[LineType] = mapped_column(Enum(LineType), nullable=False)
    parent_line_id: Mapped[int | None] = mapped_column(
        ForeignKey("research_lines.id"),
        nullable=True,
    )
    base_node_id: Mapped[int | None] = mapped_column(
        ForeignKey("progress_nodes.id", use_alter=True, name="fk_lines_base_node_id"),
        nullable=True,
    )
    head_node_id: Mapped[int | None] = mapped_column(
        ForeignKey("progress_nodes.id", use_alter=True, name="fk_lines_head_node_id"),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    project = relationship(
        "Project",
        back_populates="lines",
        foreign_keys=[project_id],
    )
    owner = relationship("User", back_populates="owned_lines")
    parent_line = relationship(
        "ResearchLine",
        remote_side=[id],
        foreign_keys=[parent_line_id],
        back_populates="child_lines",
    )
    child_lines = relationship(
        "ResearchLine",
        foreign_keys=[parent_line_id],
        back_populates="parent_line",
    )
    base_node = relationship(
        "ProgressNode",
        foreign_keys=[base_node_id],
        post_update=True,
    )
    head_node = relationship(
        "ProgressNode",
        foreign_keys=[head_node_id],
        post_update=True,
    )
    nodes = relationship(
        "ProgressNode",
        back_populates="line",
        foreign_keys="ProgressNode.line_id",
    )
