from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from ... import db
from ...models import AdminLogin, AdminUpdate, AdminResponse
from ...auth import hash_password, verify_password, create_token, get_current_user


router = APIRouter(prefix="/login", tags=["Admin - login"])


@router.post("/", status_code=201, response_model=AdminResponse)
def login_admin(user: AdminLogin, session: Session = Depends(db.session)):
    pass