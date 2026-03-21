from datetime import datetime
from sqlalchemy import CheckConstraint, String, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Enum as SqlEnum
from .db import Base
from .models import GameType, MAX_STRING_LENGTH
from sqlalchemy import JSON

class User(Base):
    __tablename__ = "user"
    id:         Mapped[int]       = mapped_column(primary_key=True, init=False)
    name:       Mapped[str]       = mapped_column(String(50))
    login:  Mapped[str]       = mapped_column(String(50), unique=True)
    created_at: Mapped[datetime]  = mapped_column(server_default=func.now(), init=False)

class Admin(Base):
    __tablename__ = "admin"
    id:         Mapped[int]       = mapped_column(primary_key=True, init=False)
    name:       Mapped[str]       = mapped_column(String(50))
    login:      Mapped[str]       = mapped_column(String(50), unique=True)
    password:   Mapped[str]       = mapped_column(String(255))  # stored as bcrypt hash
    created_at: Mapped[datetime]  = mapped_column(server_default=func.now(), init=False)

# class UserScore(Base):
#     __tablename__ = "score"
#     __table_args__ = (
#         CheckConstraint("difficulty >= 1 AND difficulty <= 3", name="ck_score_difficulty_range"),
#     )

    id:             Mapped[int]         = mapped_column(primary_key=True, init=False)
    user_id:        Mapped[int]         = mapped_column()
    game_type:      Mapped[GameType]    = mapped_column(SqlEnum(GameType, name="game_type_enum"), nullable=False)
    success_rate:   Mapped[float]       = mapped_column()
    difficulty:     Mapped[int]         = mapped_column(nullable=False)
    settings:       Mapped[dict]        = mapped_column(JSON, nullable=False, default={})
    created_at:     Mapped[datetime]    = mapped_column(server_default=func.now(), init=False)
    
