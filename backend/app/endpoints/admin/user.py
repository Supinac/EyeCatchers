from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import tables
from ... import db
from ...models import  UserCreate, UserResponse, UserUpdate, ScoreSubmit, GameType


router = APIRouter(prefix="/user", tags=["Admin - user"])


@router.get("", status_code=200, response_model=list[UserResponse])
def get_users(session: Session = Depends(db.session)):
    user_list = session.query(tables.User).all()
    return user_list

@router.post("", status_code=201, response_model=UserResponse)
def register_user(user: UserCreate, session: Session = Depends(db.session)):
    db_user = tables.User(
        name=user.name,
        login=user.login
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.patch("/{id}", status_code=200, response_model=UserResponse)
def update_user(id: int, user: UserUpdate, session: Session = Depends(db.session)):
    db_user = session.query(tables.User).filter(tables.User.id == id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in user.dict(exclude_unset=True).items():
        setattr(db_user, key, value)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.delete("/{id}", status_code=204, response_model=None)
def delete_user(id: int, session: Session = Depends(db.session)):
    db_user = session.query(tables.User).filter(tables.User.id == id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    session.delete(db_user)
    # Delete all scores associated with the user
    session.query(tables.UserScore).filter(tables.UserScore.user_id == id).delete()
    session.commit()

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
