import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from gfr_backend.db.base import Base


class BranchType(str, enum.Enum):
    main = "main"
    personal = "personal"
    sub = "sub"


class ResearchBranch(Base):
    __tablename__ = "research_branches"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    parent_branch_id: Mapped[int | None] = mapped_column(
        ForeignKey("research_branches.id"),
        nullable=True,
    )
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    goal: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    branch_type: Mapped[BranchType] = mapped_column(Enum(BranchType), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    project = relationship(
        "Project",
        back_populates="branches",
        foreign_keys=[project_id],
    )
    owner = relationship("User", back_populates="owned_branches")
    parent_branch = relationship(
        "ResearchBranch",
        remote_side="ResearchBranch.id",
        back_populates="child_branches",
    )
    child_branches = relationship("ResearchBranch", back_populates="parent_branch")
