from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import tables
from app.admin_auth import auth_admin, hash_password
from ... import db
from ...models import  UserCreate, UserResponse, UserUpdate


router = APIRouter(prefix="/user", tags=["Admin - user"])


@router.get("", status_code=200, response_model=list[UserResponse])
def get_users(session: Session = Depends(db.session), current_admin: tables.Admin = Depends(auth_admin)):
    user_list = session.execute(select(tables.User)).scalars().all()
    return user_list

@router.post("", status_code=201, response_model=UserResponse)
def register_user(user: UserCreate, session: Session = Depends(db.session), current_admin: tables.Admin = Depends(auth_admin)):
    user_record = session.execute(select(tables.User).where(tables.User.login == user.login)).scalar_one_or_none()
    if user_record:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exists",
        )
    new_user = tables.User(
        name=user.name,
        login=user.login,
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

@router.patch("/{id}", status_code=200, response_model=UserResponse)
def update_user(id: int, user: UserUpdate, session: Session = Depends(db.session), current_admin: tables.Admin = Depends(auth_admin)):
    user_record = session.execute(select(tables.User).where(tables.User.id == id)).scalar_one_or_none()
    if not user_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    for key, value in user.model_dump(exclude_unset=True).items():
        setattr(user_record, key, value)
    session.add(user_record)
    session.commit()
    session.refresh(user_record)
    return user_record

@router.delete("/{id}", status_code=204, response_model=None)
def delete_user(id: int, session: Session = Depends(db.session), current_admin: tables.Admin = Depends(auth_admin)):
    user = session.execute(select(tables.User).where(tables.User.id == id)).scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    session.delete(user)
    session.commit()
    return None
