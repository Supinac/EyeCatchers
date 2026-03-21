from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import tables
from ... import db
from ...models import AdminLogin, AdminUpdate, AdminResponse
from ...admin_auth import auth_admin, verify_password, create_token, login_admin
from ...config import settings


router = APIRouter(prefix="/login", tags=["Admin - login"])


@router.post("", status_code=200, response_model=AdminResponse)
def admin_login(user: AdminLogin, response: Response, session: Session = Depends(db.session)):

    admin = login_admin(
        login=user.login,
        password=user.password,
        response=response,
        session=session,
    )
    return admin