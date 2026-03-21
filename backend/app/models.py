from datetime import datetime
from pydantic import BaseModel, Field
from sqlalchemy import String, func
from sqlalchemy.orm import Mapped, mapped_column
from .db import Base


# ---- User ----

class User(Base):
    __tablename__ = "user"
    id:         Mapped[int]       = mapped_column(primary_key=True, init=False)
    name:       Mapped[str]       = mapped_column(String(50), unique=True)
    password:   Mapped[str]       = mapped_column(String(255))  # stored as bcrypt hash
    top_score:  Mapped[int]       = mapped_column(default=0, init=False)
    last_score: Mapped[int]       = mapped_column(default=0, init=False)
    created_at: Mapped[datetime]  = mapped_column(server_default=func.now(), init=False)

# Request schemas
class UserRegister(BaseModel):
    name:       str               = Field(min_length=2, max_length=50)
    password:   str               = Field(min_length=4, max_length=128)

class UserLogin(BaseModel):
    name:       str
    password:   str

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
