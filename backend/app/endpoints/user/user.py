from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from .. import db
from ...models import User, UserRegister, UserLogin, UserResponse, ScoreSubmit


router = APIRouter(prefix="/user", tags=["user"])

