from pydantic import BaseModel, Field
from enum import Enum

# Request schemas
class UserRegister(BaseModel):
    name:       str               = Field(min_length=4, max_length=40)
    user_name:  str               = Field(min_length=4, max_length=40)

class UserLogin(BaseModel):
    user_name:  str               = Field(min_length=4, max_length=40)

class GameType(str, Enum):
    find_all_same = "najdi_vsechny_stejne_obrazky"
    say_what_you_see = "řekni_co_vidíš"
    mooving_shapes = "pohyblivé_tvary"

class Difficulty(BaseModel):
    game_type: GameType
    difficulty: int = Field(ge=1, le=3)
    settings: dict = Field(default_factory=dict)


class ScoreSubmit(BaseModel):
    success_rate: float = Field(ge=0)
    game_type: GameType
    difficulty: Difficulty

# Response schema (never expose the password hash)
class UserResponse(BaseModel):
    id:         int
    name:       str
    top_score:  int
    last_score: int

    class Config:
        from_attributes = True
