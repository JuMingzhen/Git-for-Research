import enum

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from gfr_backend.db.base import Base


class UserRole(enum.StrEnum):
    advisor = "advisor"
    student = "student"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)
    team_id: Mapped[int | None] = mapped_column(ForeignKey("teams.id"), nullable=True)

    team = relationship("Team", back_populates="users")
    owned_projects = relationship("Project", back_populates="owner")
    owned_branches = relationship("ResearchBranch", back_populates="owner")
