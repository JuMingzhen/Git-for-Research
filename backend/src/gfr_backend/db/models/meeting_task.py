from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from gfr_backend.db.base import Base


class MeetingTask(Base):
    __tablename__ = "meeting_tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"), nullable=False)
    assignee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    branch_id: Mapped[int] = mapped_column(ForeignKey("research_branches.id"), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    due_hint: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="todo", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    meeting = relationship("Meeting", back_populates="tasks")
    assignee = relationship("User")
    branch = relationship("ResearchBranch")
