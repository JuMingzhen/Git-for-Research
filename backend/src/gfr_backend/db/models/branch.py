import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, Table, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from gfr_backend.db.base import Base


class BranchType(enum.StrEnum):
    main = "main"
    personal = "personal"
    sub = "sub"


research_branch_parents = Table(
    "research_branch_parents",
    Base.metadata,
    Column("branch_id", ForeignKey("research_branches.id"), primary_key=True),
    Column("parent_branch_id", ForeignKey("research_branches.id"), primary_key=True),
)


class ResearchBranch(Base):
    __tablename__ = "research_branches"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
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
    parent_branches = relationship(
        "ResearchBranch",
        secondary=research_branch_parents,
        primaryjoin=id == research_branch_parents.c.branch_id,
        secondaryjoin=id == research_branch_parents.c.parent_branch_id,
        back_populates="child_branches",
    )
    child_branches = relationship(
        "ResearchBranch",
        secondary=research_branch_parents,
        primaryjoin=id == research_branch_parents.c.parent_branch_id,
        secondaryjoin=id == research_branch_parents.c.branch_id,
        back_populates="parent_branches",
    )
    updates = relationship("ProgressUpdate", back_populates="branch")

    @property
    def parent_branch_ids(self) -> list[int]:
        return sorted(parent.id for parent in self.parent_branches)

    @property
    def child_branch_ids(self) -> list[int]:
        return sorted(child.id for child in self.child_branches)
