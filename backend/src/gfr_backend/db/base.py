from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import model modules so SQLAlchemy metadata is populated before create_all.
from gfr_backend.db import models  # noqa: E402,F401
