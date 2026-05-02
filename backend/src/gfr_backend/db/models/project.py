from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from gfr_backend.db.base import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    main_branch_id: Mapped[int | None] = mapped_column(
        ForeignKey("research_branches.id", use_alter=True, name="fk_projects_main_branch_id"),
        nullable=True,
    )

    owner = relationship("User", back_populates="owned_projects")
    branches = relationship(
        "ResearchBranch",
        back_populates="project",
        foreign_keys="ResearchBranch.project_id",
    )
    main_branch = relationship(
        "ResearchBranch",
        foreign_keys=[main_branch_id],
        post_update=True,
    )
