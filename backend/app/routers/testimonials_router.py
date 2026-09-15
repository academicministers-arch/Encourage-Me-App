from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app import auth, models, schemas
from app.database import get_db
from app.config import settings
from app.services.supabase_storage import upload_media

router = APIRouter(prefix="/api/testimonials", tags=["testimonials"])


def _upload_attachment(file: UploadFile, user_id: int, testimonial_id: int) -> str:
    contents = file.file.read()
    file.file.close()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Each attachment must be smaller than 10MB.")
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=503, detail="Media storage is not configured.")
    return upload_media(
        f"testimonials/{user_id}/{testimonial_id}/{file.filename or 'attachment'}",
        contents,
        file.content_type,
    )


@router.get("", response_model=List[schemas.TestimonialOut])
def list_testimonials(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    testimonials = db.query(models.Testimonial).order_by(models.Testimonial.created_at.desc()).all()
    result = []
    for testimonial in testimonials:
        comments = [
            schemas.TestimonialCommentOut(
                id=comment.id,
                content=comment.content,
                created_at=comment.created_at,
                user_name=comment.user.name,
                user_avatar=comment.user.avatar_url,
            )
            for comment in sorted(testimonial.comments, key=lambda item: item.created_at)
        ]
        likes = [
            schemas.TestimonialLikeOut(
                id=like.id,
                user_name=like.user.name,
                user_avatar=like.user.avatar_url,
            )
            for like in testimonial.likes
        ]
        attachments = [
            schemas.TestimonialAttachmentOut(
                id=attachment.id,
                file_name=attachment.file_name,
                content_type=attachment.content_type,
                data=attachment.data,
            )
            for attachment in testimonial.attachments
        ]
        result.append(
            schemas.TestimonialOut(
                id=testimonial.id,
                text=testimonial.text,
                created_at=testimonial.created_at,
                user_id=testimonial.user_id,
                user_name=testimonial.user.name,
                user_avatar=testimonial.user.avatar_url,
                attachments=attachments,
                comments=comments,
                likes=likes,
                like_count=len(testimonial.likes),
                liked_by_me=any(like.user_id == current_user.id for like in testimonial.likes),
            )
        )
    return result


@router.post("", response_model=schemas.TestimonialOut)
def create_testimonial(
    text: str = Form(default=""),
    files: List[UploadFile] = File(default_factory=list),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if not text.strip() and not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please add a message or at least one attachment.")

    testimonial = models.Testimonial(user_id=current_user.id, text=text.strip())
    db.add(testimonial)
    db.commit()
    db.refresh(testimonial)

    for file in files:
        if not file.content_type:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Each attachment needs a valid file type.")
        attachment = models.TestimonialAttachment(
            testimonial_id=testimonial.id,
            file_name=file.filename,
            content_type=file.content_type,
            data=_upload_attachment(file, current_user.id, testimonial.id),
        )
        db.add(attachment)

    db.commit()
    db.refresh(testimonial)
    return list_testimonials(current_user=current_user, db=db)[0] if testimonial.id else testimonial


@router.post("/{testimonial_id}/comments", response_model=schemas.TestimonialCommentOut)
def add_comment(
    testimonial_id: int,
    payload: schemas.TestimonialCommentCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    testimonial = db.query(models.Testimonial).filter(models.Testimonial.id == testimonial_id).first()
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")

    comment = models.TestimonialComment(
        testimonial_id=testimonial.id,
        user_id=current_user.id,
        content=payload.content.strip(),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return schemas.TestimonialCommentOut(
        id=comment.id,
        content=comment.content,
        created_at=comment.created_at,
        user_name=current_user.name,
        user_avatar=current_user.avatar_url,
    )


@router.post("/{testimonial_id}/like")
def toggle_like(
    testimonial_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    testimonial = db.query(models.Testimonial).filter(models.Testimonial.id == testimonial_id).first()
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")

    existing = (
        db.query(models.TestimonialLike)
        .filter(models.TestimonialLike.testimonial_id == testimonial.id)
        .filter(models.TestimonialLike.user_id == current_user.id)
        .first()
    )
    if existing:
        db.delete(existing)
        liked = False
    else:
        db.add(models.TestimonialLike(testimonial_id=testimonial.id, user_id=current_user.id))
        liked = True

    db.commit()
    like_count = db.query(models.TestimonialLike).filter(models.TestimonialLike.testimonial_id == testimonial.id).count()
    return {"liked_by_me": liked, "like_count": like_count}
