from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ... import tables
from ... import db
from ...models import AdminLogin, AdminCreate, AdminUpdate, AdminResponse
from ...admin_auth import hash_password, verify_password, create_token, auth_admin


router = APIRouter(prefix="/admin", tags=["Admin - admin"])



@router.get("", status_code=200, response_model=List[AdminResponse])
def get_admins(session: Session = Depends(db.session), current_admin: tables.Admin = Depends(auth_admin)):
    admin_list = session.execute(select(tables.Admin)).scalars().all()
    return admin_list

@router.post("", status_code=201, response_model=AdminResponse)
def register_admin(user: AdminCreate, session: Session = Depends(db.session), current_admin: tables.Admin = Depends(auth_admin)):
    check_admin = session.execute(select(tables.Admin).where(tables.Admin.login == user.login)).scalar_one_or_none()
    if check_admin:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Admin already exists",
        )
    db_admin = tables.Admin(
        name=user.name,
        login=user.login,
        password=hash_password(user.password),
    )
    session.add(db_admin)
    session.commit()
    session.refresh(db_admin)
    return db_admin

@router.patch("/{id}", status_code=200, response_model=AdminResponse)
def update_admin(id: int, user: AdminUpdate, session: Session = Depends(db.session), current_admin: tables.Admin = Depends(auth_admin)):
    db_admin = session.execute(select(tables.Admin).where(tables.Admin.id == id)).scalar_one_or_none()
    if not db_admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin not found",
        )
    for key, value in user.model_dump(exclude_unset=True).items():
        setattr(db_admin, key, value)
    session.add(db_admin)
    session.commit()
    session.refresh(db_admin)
    return db_admin


@router.delete("/{id}", status_code=204, response_model=None)
def remove_admin(id: int, session: Session = Depends(db.session), current_admin: tables.Admin = Depends(auth_admin)):
    db_admin = session.execute(select(tables.Admin).where(tables.Admin.id == id)).scalar_one_or_none()
    if not db_admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin not found",
        )
    if db_admin.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete currently logged in admin",
        )
    session.delete(db_admin)
    session.commit()
    return None