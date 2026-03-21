from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ... import tables
from ... import db
from ...models import AdminLogin, AdminCreate, AdminUpdate, AdminResponse
from ...admin_auth import hash_password, verify_password, create_token, auth_admin


router = APIRouter(prefix="/results", tags=["Admin - Results"])
