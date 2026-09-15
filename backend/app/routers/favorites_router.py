from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/favorites", tags=["favorites"])


@router.post("", response_model=schemas.FavoriteOut, status_code=201)
def add_favorite(
    payload: schemas.FavoriteCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(models.Favorite)
        .filter(
            models.Favorite.user_id == current_user.id,
            models.Favorite.content_id == payload.content_id,
            models.Favorite.content_type == payload.content_type,
        )
        .first()
    )
    if existing:
        return existing

    fav = models.Favorite(user_id=current_user.id, **payload.model_dump())
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return fav


@router.get("", response_model=list[schemas.FavoriteOut])
def list_favorites(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Favorite)
        .filter(models.Favorite.user_id == current_user.id)
        .order_by(models.Favorite.created_at.desc())
        .all()
    )


@router.delete("/{favorite_id}")
def remove_favorite(
    favorite_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    fav = (
        db.query(models.Favorite)
        .filter(models.Favorite.id == favorite_id, models.Favorite.user_id == current_user.id)
        .first()
    )
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found.")
    db.delete(fav)
    db.commit()
    return {"message": "Removed."}
