from datetime import datetime
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from .db import Base


# class Post(Base):
#     __tablename__ = "post"
#     id = Column(Integer, primary_key=True)
#     created_at = Column(DateTime, default=datetime.now)
#     content = Column(String(256))
    
    
class Post(Base):
    __tablename__ = "post"
    id:         Mapped[int]       = mapped_column(primary_key=True, init=False)
    created_at: Mapped[datetime]  = mapped_column(server_default=func.now(), init=False)
    content:    Mapped[str]       = mapped_column(String(256))


class PostCreate(BaseModel):
    content:    str               = Field(max_length=256)
