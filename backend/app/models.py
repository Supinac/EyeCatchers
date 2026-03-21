from pydantic import BaseModel, Field
from enum import Enum

# Request schemas
class AdminResponse(BaseModel):
    id:         int
    login:      str
    name:       str

class AdminCreate(BaseModel):
    name:       str                     = Field(min_length=4, max_length=40)
    login:      str                     = Field(min_length=4, max_length=40)
    password:   str                     = Field(min_length=8, max_length=255)

class AdminUpdate(BaseModel):
    name:       str | None              = Field(min_length=4, max_length=40)
    login:      str | None              = Field(min_length=4, max_length=40)
    password:   str | None              = Field(min_length=8, max_length=255)



class AdminLogin(BaseModel):
    login:      str                     = Field(min_length=4, max_length=40)
    password:   str                     = Field(min_length=8, max_length=255)



class UserResponse(BaseModel):
    id:         int
    login:      str
    name:       str

class UserCreate(BaseModel):
    name:       str                     = Field(min_length=4, max_length=40)
    login:      str                     = Field(min_length=4, max_length=40)

class UserUpdate(BaseModel):
    name:       str | None              = Field(min_length=4, max_length=40)
    login:      str | None              = Field(min_length=4, max_length=40)







class UserLogin(BaseModel):
    login:      str                     = Field(min_length=4, max_length=40)

class GameType(str, Enum):
    find_all_same = "najdi_vsechny_stejne_obrazky"
    say_what_you_see = "řekni_co_vidíš"
    mooving_shapes = "pohyblivé_tvary"

class ScoreSubmit(BaseModel):
    success_rate: float = Field(ge=0)
    game_type: GameType
    difficulty: int = Field(ge=1, le=3)
    settings: dict = Field(default_factory=dict)

# Response schema (never expose the password hash)
class UserResponse(BaseModel):
    id:         int
    login:  str
    name:       str

