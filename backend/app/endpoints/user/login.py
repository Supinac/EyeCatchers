from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import tables
from app.user_auth import login_user, logout_user
from ... import db
from ...models import UserLogin, UserResponse
from ...config import settings


router = APIRouter(prefix="", tags=["User - login"])


@router.post("/login", status_code=200, response_model=UserResponse)
def user_login(user: UserLogin, response: Response, session: Session = Depends(db.session)):

    user = login_user(
        login=user.login,
        response=response,
        session=session,
    )
    return user

@router.post("/logout", status_code=204, response_model=None)
def user_logout(response: Response):
    logout_user(response=response)
    return None