from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=schemas.SettingsOut)
def get_settings(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    row = db.query(models.UserSettings).filter(models.UserSettings.user_id == current_user.id).first()
    if not row:
        row = models.UserSettings(user_id=current_user.id)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


@router.put("", response_model=schemas.SettingsOut)
def update_settings(
    payload: schemas.SettingsUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    row = db.query(models.UserSettings).filter(models.UserSettings.user_id == current_user.id).first()
    if not row:
        row = models.UserSettings(user_id=current_user.id)
        db.add(row)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, field, value)

    db.commit()
    db.refresh(row)
    return row
