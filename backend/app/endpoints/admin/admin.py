from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from ... import db
from ...models import AdminLogin, AdminCreate, AdminUpdate, AdminResponse
from ...auth import hash_password, verify_password, create_token, get_current_user


router = APIRouter(prefix="/admin", tags=["Admin - admin"])



@router.get("/", status_code=200, response_model=List[AdminResponse])
def get_admins(session: Session = Depends(db.session)):
    return 

@router.post("/", status_code=201, response_model=AdminResponse)
def register_admin(user: AdminCreate, session: Session = Depends(db.session)):
    pass

@router.patch("/", status_code=200, response_model=AdminResponse)
def update_admin(user: AdminUpdate, session: Session = Depends(db.session)):
    pass

# @router.post("/register", status_code=201, response_model=UserResponse)
# def register(request: UserRegister, session: Session = Depends(db.session)):
#     """Create a new user account."""

#     # Check if name is already taken
#     existing = session.execute(
#         select(User).where(User.name == request.name)
#     ).scalar_one_or_none()

#     if existing:
#         raise HTTPException(
#             status_code=status.HTTP_409_CONFLICT,
#             detail="Username already taken",
#         )

#     user = User(
#         name=request.name,
#         password=hash_password(request.password),
#     )
#     session.add(user)
#     session.commit()
#     session.refresh(user)
#     return user


# @router.post("/login")
# def login(request: UserLogin, session: Session = Depends(db.session)):
#     """Log in and receive a JWT token."""

#     user = session.execute(
#         select(User).where(User.name == request.name)
#     ).scalar_one_or_none()

#     if not user or not verify_password(request.password, user.password):
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Wrong username or password",
#         )

#     token = create_token(user.id)
#     return {"access_token": token, "token_type": "bearer"}


# @router.get("/me", response_model=UserResponse)
# def get_me(current_user: User = Depends(get_current_user)):
#     """Get the currently logged-in user's profile."""
#     return current_user


# @router.post("/me/score", response_model=UserResponse)
# def submit_score(
#     request: ScoreSubmit,
#     current_user: User = Depends(get_current_user),
#     session: Session = Depends(db.session),
# ):
#     """Submit a score. Updates last_score always, top_score if it's a new high."""

#     current_user.last_score = request.score
#     if request.score > current_user.top_score:
#         current_user.top_score = request.score

#     session.add(current_user)
#     session.commit()
#     session.refresh(current_user)
#     return current_user


# @router.get("/leaderboard", response_model=list[UserResponse])
# def leaderboard(limit: int = 10, session: Session = Depends(db.session)):
#     """Get the top players by high score."""

#     users = session.execute(
#         select(User)
#         .order_by(User.top_score.desc())
#         .limit(limit)
#     ).scalars().all()

#     return users
