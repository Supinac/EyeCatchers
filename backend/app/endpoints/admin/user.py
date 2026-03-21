from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from ... import db
from ...models import User, UserRegister, UserLogin, UserResponse, UserUpdate
from ...auth import hash_password, verify_password, create_token, get_current_user


router = APIRouter(prefix="/user", tags=["Admin - user"])


@router.get("/", status_code=200, response_model=UserResponse)
def user_login(user: UserLogin, session: Session = Depends(db.session)):
    pass

@router.post("/", status_code=201, response_model=UserResponse)
def user_register(user: UserRegister, session: Session = Depends(db.session)):
    pass

@router.patch("/", status_code=200, response_model=UserResponse)
def user_update(user: UserUpdate, session: Session = Depends(db.session)):
    pass
