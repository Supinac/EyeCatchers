from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from . import db
from .config import settings
from .tables import Admin

# --- Password hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# --- JWT tokens ---
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = settings.TOKEN_EXPIRE_MINUTES
COOKIE_NAME = "admin_login_token"

def create_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def auth_admin(request: Request, session: Session = Depends(db.session)):
    """Dependency that extracts the current admin from JWT in cookie."""
    from .tables import Admin  # import here to avoid circular imports

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
    )

    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise credentials_exception

    user = session.execute(select(Admin).where(Admin.id == user_id)).scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


def login_admin(login: str, password: str, response: Response, session: Session):
    """Authenticate admin and set auth cookie. Callable from endpoint."""

    admin = session.execute(
        select(Admin).where(Admin.login == login)
    ).scalar_one_or_none()

    if not admin or not verify_password(password, admin.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Wrong username or password",
        )

    token = create_token(admin.id)

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,  # set True in production with HTTPS
        samesite="lax",
        max_age=60 * settings.TOKEN_EXPIRE_MINUTES,
        path="/",
    )

    return admin

def logout_admin(response: Response):
    """Clear auth cookie. Callable from endpoint."""
    response.delete_cookie(key=COOKIE_NAME)