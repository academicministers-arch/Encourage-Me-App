import secrets
import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth
from app.rate_limit import limiter
from app.services import email_service
from app.services.google_auth_service import verify_google_token, GoogleAuthError
from app.config import settings
from app.services.supabase_storage import upload_media

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, payload: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user = models.User(
        name=payload.name,
        email=payload.email,
        password_hash=auth.hash_password(payload.password),
        is_admin=auth.is_bootstrap_admin_email(payload.email),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # create default settings row
    settings_row = models.UserSettings(user_id=user.id)
    db.add(settings_row)
    db.commit()

    token = auth.create_access_token({"sub": str(user.id)})
    return schemas.Token(access_token=token, user=schemas.UserOut.model_validate(user))


@router.post("/login", response_model=schemas.Token)
@limiter.limit("10/minute")
def login(request: Request, payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # If this email was added to ADMIN_EMAILS after the account was
    # created, promote it now rather than requiring a database edit.
    if auth.is_bootstrap_admin_email(user.email) and not user.is_admin:
        user.is_admin = True
        db.commit()
        db.refresh(user)

    token = auth.create_access_token({"sub": str(user.id)})
    return schemas.Token(access_token=token, user=schemas.UserOut.model_validate(user))


@router.get("/me", response_model=schemas.UserOut)
def me(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if auth.is_bootstrap_admin_email(current_user.email) and not current_user.is_admin:
        current_user.is_admin = True
        db.commit()
        db.refresh(current_user)
    return current_user


@router.put("/avatar", response_model=schemas.UserOut)
def update_avatar(
    avatar: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if not avatar.content_type or not avatar.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only image files are supported.")

    contents = avatar.file.read()
    avatar.file.close()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Avatar must be smaller than 5MB.")

    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=503, detail="Media storage is not configured.")
    current_user.avatar_url = upload_media(
        f"avatars/{current_user.id}/avatar",
        contents,
        avatar.content_type,
    )
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(request: Request, payload: schemas.ForgotPassword, db: Session = Depends(get_db)):
    # Always return the same generic message regardless of whether the
    # account exists — this prevents attackers from using this endpoint
    # to discover which emails have accounts (a real security concern).
    generic_response = {"message": "If an account with that email exists, a password reset link has been sent."}

    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        return generic_response

    # Google-only accounts have no password to reset — direct them to
    # sign in with Google instead, but only reveal this via email (not
    # in the API response, to avoid leaking account existence/type).
    token = secrets.token_urlsafe(32)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    reset_row = models.PasswordResetToken(user_id=user.id, token=token, expires_at=expires_at)
    db.add(reset_row)
    db.commit()

    reset_link = f"{settings.FRONTEND_ORIGIN}/reset-password?token={token}"
    email_service.send_password_reset_email(user.email, reset_link)

    return generic_response


@router.post("/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, payload: schemas.ResetPassword, db: Session = Depends(get_db)):
    reset_row = (
        db.query(models.PasswordResetToken)
        .filter(models.PasswordResetToken.token == payload.token)
        .first()
    )
    if not reset_row or reset_row.used or reset_row.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired. Please request a new one.")

    user = db.query(models.User).filter(models.User.id == reset_row.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="This reset link is invalid.")

    user.password_hash = auth.hash_password(payload.new_password)
    reset_row.used = True
    db.commit()

    return {"message": "Password updated successfully. You can now log in with your new password."}


@router.post("/google", response_model=schemas.Token)
@limiter.limit("10/minute")
def google_auth(request: Request, payload: schemas.GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        google_user = verify_google_token(payload.credential)
    except GoogleAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    user = db.query(models.User).filter(models.User.google_id == google_user["google_id"]).first()

    if not user:
        # If someone already registered with this email using a password,
        # link the Google account to that existing user instead of
        # creating a duplicate.
        user = db.query(models.User).filter(models.User.email == google_user["email"]).first()
        if user:
            user.google_id = google_user["google_id"]
        else:
            user = models.User(
                name=google_user["name"],
                email=google_user["email"],
                password_hash=None,
                google_id=google_user["google_id"],
                is_admin=auth.is_bootstrap_admin_email(google_user["email"]),
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        if not db.query(models.UserSettings).filter(models.UserSettings.user_id == user.id).first():
            db.add(models.UserSettings(user_id=user.id))
        db.commit()
        db.refresh(user)

    token = auth.create_access_token({"sub": str(user.id)})
    return schemas.Token(access_token=token, user=schemas.UserOut.model_validate(user))


@router.post("/change-password")
def change_password(
    payload: schemas.ChangePassword,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if not auth.verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    current_user.password_hash = auth.hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully."}


@router.delete("/account")
def delete_account(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted successfully."}