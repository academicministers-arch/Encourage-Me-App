import datetime
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: Optional[str]) -> bool:
    if not hashed:
        return False  # Google-only account has no password to check against
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None or not user_id.isdigit():
            # Rejects consultant tokens too (their sub is "consultant:<id>",
            # not a plain digit) — a consultant token must never be usable
            # as a regular user token.
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    """Use as a dependency on any endpoint that should only be usable by
    admins (e.g. managing consultants). Returns 403 for non-admin users.
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")
    return current_user


def is_bootstrap_admin_email(email: str) -> bool:
    """Checks whether an email is in the ADMIN_EMAILS bootstrap list from
    .env — used to automatically grant admin on register/login so there's
    always a way to get into the admin panel without touching the database
    directly.
    """
    configured = [e.strip().lower() for e in settings.ADMIN_EMAILS.split(",") if e.strip()]
    return email.strip().lower() in configured


# ---------- Consultant authentication ----------
# Consultants log in separately from regular users (they're not a "user"
# of the wellness app — they're a professional replying to chats). Their
# tokens are tagged with a "consultant:" prefix on the sub claim so a
# consultant token can never be mistaken for, or reused as, a regular
# user token, even if someone tried to hand one to the wrong endpoint.

def create_consultant_access_token(consultant_id: int) -> str:
    return create_access_token({"sub": f"consultant:{consultant_id}"})


def get_current_consultant(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> "models.Consultant":
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate consultant credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub: Optional[str] = payload.get("sub")
        if not sub or not sub.startswith("consultant:"):
            raise credentials_exception
        consultant_id = int(sub.split(":", 1)[1])
    except (JWTError, ValueError):
        raise credentials_exception

    consultant = db.query(models.Consultant).filter(models.Consultant.id == consultant_id).first()
    if consultant is None or not consultant.is_active:
        raise credentials_exception
    return consultant
