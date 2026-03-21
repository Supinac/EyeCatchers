from datetime import datetime
from pydantic import BaseModel, Field
from sqlalchemy import String, func
from sqlalchemy.orm import Mapped, mapped_column
from .db import Base


# ---- User ----

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

# Request schemas
class UserRegister(BaseModel):
    name:       str               = Field(min_length=4, max_length=40)
    user_name:  str               = Field(min_length=4, max_length=40)

class UserLogin(BaseModel):
    user_name:  str               = Field(min_length=4, max_length=40)

class ScoreSubmit(BaseModel):
    score:      int               = Field(ge=0)

# Response schema (never expose the password hash)
class UserResponse(BaseModel):
    id:         int
    name:       str
    top_score:  int
    last_score: int

    class Config:
        from_attributes = True
