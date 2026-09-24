"""
Login for consultants — separate from regular user auth entirely.
Consultants log in with the contact_email + password an admin set for
them, and get a distinctly-tagged token (see auth.create_consultant_access_token)
that only works on consultant-side endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth
from app.rate_limit import limiter

router = APIRouter(prefix="/api/consultant-auth", tags=["consultant-auth"])


@router.post("/login", response_model=schemas.ConsultantToken)
@limiter.limit("10/minute")
def consultant_login(
    request: Request,
    payload: schemas.ConsultantLoginRequest,
    db: Session = Depends(get_db),
):
    consultant = (
        db.query(models.Consultant)
        .filter(models.Consultant.contact_email == payload.email)
        .first()
    )
    if (
        not consultant
        or not consultant.is_active
        or not auth.verify_password(payload.password, consultant.password_hash)
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = auth.create_consultant_access_token(consultant.id)
    out = schemas.ConsultantOut.model_validate(consultant)
    out.can_chat = True
    return schemas.ConsultantToken(access_token=token, consultant=out)


@router.get("/me", response_model=schemas.ConsultantOut)
def consultant_me(current_consultant: models.Consultant = Depends(auth.get_current_consultant)):
    out = schemas.ConsultantOut.model_validate(current_consultant)
    out.can_chat = True
    return out
