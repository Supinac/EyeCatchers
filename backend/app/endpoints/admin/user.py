from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from ... import db
from ...models import User, UserRegister, UserLogin, UserResponse, ScoreSubmit
from ...auth import hash_password, verify_password, create_token, get_current_user


router = APIRouter(prefix="/user", tags=["Admin - user"])