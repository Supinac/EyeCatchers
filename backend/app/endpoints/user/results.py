from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ... import tables
from ... import db
from ...models import  ScoreSubmit
from ...user_auth import auth_user


router = APIRouter(prefix="/results", tags=["User - Results"])


@router.post("", status_code=201, response_model=None)
def submit_score( score: ScoreSubmit, session: Session = Depends(db.session), user: tables.User = Depends(auth_user)):
    userScore = tables.UserScore(
        user_id=user.id,
        game_type=score.game_type,
        # success_rate=score.success_rate,
        # difficulty=score.difficulty,
        settings=score.settings,
        results=score.results
    )
    session.add(userScore)
    session.commit()
    return userScore