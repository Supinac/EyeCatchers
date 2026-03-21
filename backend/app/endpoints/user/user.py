from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import tables
from .. import db
from ...models import User, UserRegister, UserLogin, UserResponse, ScoreSubmit


router = APIRouter(prefix="/user", tags=["user"])


@router.post("/{id}/score", status_code=201, response_model=None)
def submit_score(id: int, score: ScoreSubmit, session: Session = Depends(db.session)):
    userScore = tables.UserScore(
        user_id=id,
        game_type=score.game_type,
        success_rate=score.success_rate,
        difficulty=score.difficulty,
        settings=score.settings
    )
    session.add(userScore)
    session.commit()
    return userScore
