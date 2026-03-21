from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ... import tables
from ... import db
from ...models import AdminLogin, AdminCreate, AdminUpdate, AdminResponse
from ...admin_auth import hash_password, verify_password, create_token, auth_admin


router = APIRouter(prefix="/results", tags=["Admin - Results"])

@router.get("", status_code=200, response_model=list[tables.UserScore])
def get_results(session: Session = Depends(db.session), current_admin: tables.Admin = Depends(auth_admin)):
    results = session.execute(select(tables.UserScore)).scalars().all()
    return results

@router.get("/user/{user_id}", status_code=200, response_model=list[tables.UserScore])
def get_user_results(user_id: int, session: Session = Depends(db.session), current_admin: tables.Admin = Depends(auth_admin)):
    results = session.execute(select(tables.UserScore).where(tables.UserScore.user_id == user_id)).scalars().all()
    return results
