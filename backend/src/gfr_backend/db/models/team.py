from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from gfr_backend.db.base import Base


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    users = relationship("User", back_populates="team")
