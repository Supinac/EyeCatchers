from typing_extensions import Self

from pydantic import BaseModel, Field, field_serializer, field_validator
from enum import Enum
import json

MAX_STRING_LENGTH: int = 40


# Request schemas
class AdminResponse(BaseModel):
    id:         int
    login:      str
    name:       str

class AdminCreate(BaseModel):
    name:       str                     = Field(min_length=4, max_length=MAX_STRING_LENGTH)
    login:      str                     = Field(min_length=4, max_length=MAX_STRING_LENGTH)
    password:   str                     = Field(min_length=8, max_length=255)

class AdminUpdate(BaseModel):
    name:       str | None              = Field(min_length=4, max_length=MAX_STRING_LENGTH)
    login:      str | None              = Field(min_length=4, max_length=MAX_STRING_LENGTH)
    password:   str | None              = Field(min_length=8, max_length=255)



class AdminLogin(BaseModel):
    login:      str                     = Field(min_length=4, max_length=MAX_STRING_LENGTH)
    password:   str                     = Field(min_length=8, max_length=255)



class UserResponse(BaseModel):
    id:         int
    login:      str
    name:       str

class UserCreate(BaseModel):
    name:       str                     = Field(min_length=4, max_length=MAX_STRING_LENGTH)
    login:      str                     = Field(min_length=4, max_length=MAX_STRING_LENGTH)

class UserUpdate(BaseModel):
    name:       str | None              = Field(min_length=4, max_length=MAX_STRING_LENGTH)
    login:      str | None              = Field(min_length=4, max_length=MAX_STRING_LENGTH)

class UserLogin(BaseModel):
    login:      str                     = Field(min_length=4, max_length=MAX_STRING_LENGTH)

class GameType(str, Enum):
    find_all_same = "najdi_vsechny_stejne_obrazky"
    say_what_you_see = "řekni_co_vidíš"
    mooving_shapes = "pohyblivé_tvary"

class ScoreSubmit(BaseModel):
    success_rate: float = Field(ge=0)
    game_type: GameType
    difficulty: int = Field(ge=1, le=3)
    settings: dict = Field(default_factory=dict)

    @field_serializer("settings")
    def serialize_settings(self, settings: dict) -> str:
        return json.dumps(settings)
    
    @field_validator("settings", mode="before")
    @classmethod
    def validate_settings(cls, value) -> dict:
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON string for settings")
        elif isinstance(value, dict):
            return value
        else:
            raise ValueError("Settings must be a JSON string or a dictionary")

