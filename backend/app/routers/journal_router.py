from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth
from app.config import settings
from app.services.huggingface_service import generate_text
from app.services.supabase_storage import upload_media

router = APIRouter(prefix="/api/journal", tags=["journal"])


@router.post("", response_model=schemas.JournalOut, status_code=201)
def create_entry(
    payload: schemas.JournalCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    entry = models.JournalEntry(
        user_id=current_user.id, content=payload.content, entry_type=payload.entry_type
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.post("/with-attachments", response_model=schemas.JournalOut, status_code=201)
def create_entry_with_attachments(
    content: str = Form(...),
    entry_type: str = Form("reflection"),
    files: list[UploadFile] = File(default_factory=list),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    entry = models.JournalEntry(
        user_id=current_user.id, content=content, entry_type=entry_type
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    for file in files:
        if not file.content_type:
            raise HTTPException(status_code=400, detail="Each attachment needs a valid file type.")
        contents = file.file.read()
        file.file.close()
        if len(contents) > 15 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Each attachment must be smaller than 15MB.")
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise HTTPException(status_code=503, detail="Media storage is not configured.")
        attachment = models.JournalAttachment(
            journal_entry_id=entry.id,
            file_name=file.filename,
            content_type=file.content_type,
            data=upload_media(
                f"journals/{current_user.id}/{entry.id}/{file.filename or 'attachment'}",
                contents,
                file.content_type,
            ),
        )
        db.add(attachment)

    db.commit()
    db.refresh(entry)
    return entry


@router.post("/generate", response_model=schemas.JournalDraftOut)
async def generate_journal_draft(
    payload: schemas.JournalDraftRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    if not payload.prompt.strip():
        raise HTTPException(status_code=400, detail="Please describe what you want your journal to say.")

    attachments = payload.media_names or []
    media_text = ""
    if attachments:
        media_text = "\nThe journal will also include these attached files: " + ", ".join(attachments) + "."

    prompt = (
        "You are a writing assistant helping a user complete their journal entry. "
        "Your job is to continue and improve the user's writing so it flows smoothly and looks polished. "
        "Write only the continuation in first person, maintaining the user's voice and tone. "
        "Do not provide writing advice, suggestions, or meta-commentary about the writing process. "
        "Do not mention that this is AI-generated, and do not repeat any instructions. "
        "Make the continuation feel natural and seamless, as if the user wrote it themselves. "
        "Improve clarity, emotional depth, and reflective quality while staying true to the user's intent. "
        "Use warm, thoughtful, and supportive language that feels personal and authentic. "
        "If helpful, add gentle transitions or headings (e.g., What I Learned, My Reflection, Moving Forward) to structure thoughts. "
        "If media attachments are present, integrate them naturally into the narrative.\n\n"
        "User's journal entry so far:\n"
        f"{payload.prompt.strip()}\n\n"
        f"{media_text}\n\n"
        "Now continue and complete this journal entry with improved writing. Output only the continuation text."
    )

    draft = await generate_text(prompt)
    if draft is None:
        raise HTTPException(status_code=502, detail="Unable to reach the AI service. Please try again later.")

    return schemas.JournalDraftOut(draft=draft.strip())


@router.get("", response_model=list[schemas.JournalOut])
def list_entries(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.JournalEntry)
        .filter(models.JournalEntry.user_id == current_user.id)
        .order_by(models.JournalEntry.created_at.desc())
        .all()
    )


@router.delete("/{entry_id}")
def delete_entry(
    entry_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(models.JournalEntry)
        .filter(models.JournalEntry.id == entry_id, models.JournalEntry.user_id == current_user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found.")
    db.delete(entry)
    db.commit()
    return {"message": "Deleted."}
