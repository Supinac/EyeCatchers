from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ... import db
from ...models import  UserCreate, UserResponse, UserUpdate


router = APIRouter(prefix="/user", tags=["Admin - user"])


@router.get("/", status_code=200, response_model=UserResponse)
def user_login(session: Session = Depends(db.session)):
    pass

@router.post("/", status_code=201, response_model=UserResponse)
def user_register(user: UserCreate, session: Session = Depends(db.session)):
    pass

@router.patch("/", status_code=200, response_model=UserResponse)
def user_update(user: UserUpdate, session: Session = Depends(db.session)):
    pass
