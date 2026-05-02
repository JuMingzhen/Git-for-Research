from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from gfr_backend.db.base import Base


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    raw_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_briefing: Mapped[str | None] = mapped_column(Text, nullable=True)
    briefing_status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    briefing_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary_status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    summary_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    task_split_status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    task_split_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    project = relationship("Project", back_populates="meetings")
    tasks = relationship("MeetingTask", back_populates="meeting")
