from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import tables
from ... import db
from ...models import AdminLogin, AdminUpdate, AdminResponse
from ...auth import hash_password, verify_password, create_token, get_current_user


router = APIRouter(prefix="/login", tags=["Admin - login"])


@router.post("", status_code=200, response_model=AdminResponse)
def login_admin(user: AdminLogin, session: Session = Depends(db.session)):
    admin = session.execute(select(tables.Admin).where(tables.Admin.login == user.login)).scalar_one_or_none()
    if not admin or not verify_password(user.password, admin.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Wrong username or password",
        )
    token = create_token(admin.id)
    return {"access_token": token, "token_type": "bearer"}