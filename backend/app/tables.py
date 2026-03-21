from datetime import datetime
from pydantic import BaseModel, Field
from sqlalchemy import String, func
from sqlalchemy.orm import Mapped, mapped_column
from .db import Base


class User(Base):
    __tablename__ = "user"
    id:         Mapped[int]       = mapped_column(primary_key=True, init=False)
    name:       Mapped[str]       = mapped_column(String(50))
    user_name:  Mapped[str]       = mapped_column(String(50), unique=True)
    created_at: Mapped[datetime]  = mapped_column(server_default=func.now(), init=False)

class Admin(Base):
    __tablename__ = "admin"
    id:         Mapped[int]       = mapped_column(primary_key=True, init=False)
    user_name:  Mapped[str]       = mapped_column(String(50), unique=True)
    password:   Mapped[str]       = mapped_column(String(255))  # stored as bcrypt hash
    created_at: Mapped[datetime]  = mapped_column(server_default=func.now(), init=False)
