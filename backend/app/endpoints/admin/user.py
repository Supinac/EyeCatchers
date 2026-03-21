from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import tables
from ... import db
from ...models import  UserCreate, UserResponse, UserUpdate


router = APIRouter(prefix="/user", tags=["Admin - user"])


@router.get("", status_code=200, response_model=list[UserResponse])
def get_users(session: Session = Depends(db.session)):
    user_list = session.query(tables.User).all()
    return user_list

@router.post("", status_code=201, response_model=UserResponse)
def register_user(user: UserCreate, session: Session = Depends(db.session)):
    pass

@router.patch("/{id}", status_code=200, response_model=UserResponse)
def update_user(id: int, user: UserUpdate, session: Session = Depends(db.session)):
    pass

@router.delete("/{id}", status_code=204, response_model=None)
def delete_user(id: int, session: Session = Depends(db.session)):
    pass
