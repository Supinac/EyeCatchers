from pydantic import BaseModel, Field

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
