"""
In-app chat between users and consultants.

Two separate sets of endpoints share the same underlying data:
- /api/chat/*             — used by regular users (auth.get_current_user)
- /api/chat/consultant/*  — used by consultants (auth.get_current_consultant)

Every endpoint re-verifies server-side that the caller actually owns (or
is a participant in) the conversation being accessed — a user can never
list or send messages in a conversation they're not part of, and access
to START a conversation is gated by the same tier-purchase check used on
the Consultation page itself (never trust the frontend's locked/unlocked
display state).

Delivery is polling-based, not WebSockets — the frontend calls the
"messages since" endpoint every few seconds while a chat is open. This is
a deliberate choice for reliability on typical free-tier hosting (like
Render), which doesn't always handle long-lived WebSocket connections
gracefully. It's not instant like a WebSocket, but it's simple and robust.
"""

import uuid
import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth
from app.services import supabase_storage
from app.routers.consultants_router import user_has_access_to_consultant

router = APIRouter(prefix="/api/chat", tags=["chat"])

MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024  # 25MB — generous for photos/short videos/docs

ATTACHMENT_TYPE_BY_CONTENT_TYPE = {
    "image/jpeg": "image", "image/png": "image", "image/webp": "image", "image/gif": "image",
    "video/mp4": "video", "video/webm": "video", "video/quicktime": "video",
    "application/pdf": "document",
    "application/msword": "document",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
    "text/plain": "document",
}


# ---------- shared helpers ----------

def _unread_count(conversation: models.Conversation, for_side: str, db: Session) -> int:
    read_at = conversation.user_read_at if for_side == "user" else conversation.consultant_read_at
    other_side = "consultant" if for_side == "user" else "user"
    query = db.query(models.ChatMessage).filter(
        models.ChatMessage.conversation_id == conversation.id,
        models.ChatMessage.sender_type == other_side,
    )
    if read_at:
        query = query.filter(models.ChatMessage.created_at > read_at)
    return query.count()


def _last_message_preview(conversation: models.Conversation, db: Session) -> str | None:
    last = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.conversation_id == conversation.id)
        .order_by(models.ChatMessage.created_at.desc())
        .first()
    )
    if not last:
        return None
    if last.content:
        return last.content[:80]
    return {"image": "📷 Photo", "video": "🎥 Video", "document": "📄 Document"}.get(last.attachment_type, "Attachment")


def _to_conversation_out(conversation: models.Conversation, for_side: str, db: Session) -> schemas.ConversationOut:
    return schemas.ConversationOut(
        id=conversation.id,
        consultant_id=conversation.consultant_id,
        consultant_name=conversation.consultant.name,
        consultant_photo_url=conversation.consultant.photo_url,
        user_id=conversation.user_id,
        user_name=conversation.user.name,
        last_message_at=conversation.last_message_at,
        last_message_preview=_last_message_preview(conversation, db),
        unread_count=_unread_count(conversation, for_side, db),
    )


async def _save_attachment(file: UploadFile, conversation_id: int) -> tuple[str, str, str]:
    """Validates and uploads an attachment. Returns (url, attachment_type, filename).
    Raises HTTPException on any validation failure.
    """
    if file.content_type not in ATTACHMENT_TYPE_BY_CONTENT_TYPE:
        raise HTTPException(
            status_code=400,
            detail="That file type isn't supported. Please send an image, video, PDF, or Word/text document.",
        )

    contents = await file.read()
    if len(contents) > MAX_ATTACHMENT_BYTES:
        raise HTTPException(status_code=400, detail="Files must be smaller than 25MB.")

    attachment_type = ATTACHMENT_TYPE_BY_CONTENT_TYPE[file.content_type]
    safe_name = (file.filename or "file").replace("/", "_").replace("\\", "_")
    path = f"chat/{conversation_id}/{uuid.uuid4().hex}_{safe_name}"

    try:
        url = supabase_storage.upload_media(path, contents, file.content_type)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=f"File storage isn't configured on this server: {e}")

    return url, attachment_type, safe_name


def _create_message(
    conversation: models.Conversation,
    sender_type: str,
    content: str | None,
    attachment_url: str | None,
    attachment_type: str | None,
    attachment_name: str | None,
    db: Session,
) -> models.ChatMessage:
    message = models.ChatMessage(
        conversation_id=conversation.id,
        sender_type=sender_type,
        content=content,
        attachment_url=attachment_url,
        attachment_type=attachment_type,
        attachment_name=attachment_name,
    )
    db.add(message)
    conversation.last_message_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(message)
    return message


# ---------- user-side ----------

@router.post("/start", response_model=schemas.ConversationOut)
def start_conversation(
    consultant_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    consultant = db.query(models.Consultant).filter(models.Consultant.id == consultant_id).first()
    if not consultant or not consultant.is_active:
        raise HTTPException(status_code=404, detail="Consultant not found.")

    if not user_has_access_to_consultant(current_user.id, consultant, db):
        raise HTTPException(status_code=403, detail="Unlock this consultant's plan before starting a chat.")

    if not consultant.password_hash:
        raise HTTPException(status_code=409, detail="This consultant hasn't set up chat yet. Please use their email or phone instead.")

    conversation = (
        db.query(models.Conversation)
        .filter(models.Conversation.user_id == current_user.id, models.Conversation.consultant_id == consultant_id)
        .first()
    )
    if not conversation:
        conversation = models.Conversation(user_id=current_user.id, consultant_id=consultant_id)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    return _to_conversation_out(conversation, "user", db)


@router.get("/conversations", response_model=list[schemas.ConversationOut])
def list_my_conversations(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    conversations = (
        db.query(models.Conversation)
        .filter(models.Conversation.user_id == current_user.id)
        .order_by(models.Conversation.last_message_at.desc())
        .all()
    )
    return [_to_conversation_out(c, "user", db) for c in conversations]


def _get_owned_conversation(conversation_id: int, user_id: int, db: Session) -> models.Conversation:
    conversation = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if not conversation or conversation.user_id != user_id:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return conversation


@router.get("/conversations/{conversation_id}/messages", response_model=list[schemas.ChatMessageOut])
def list_messages(
    conversation_id: int,
    after_id: int = 0,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    conversation = _get_owned_conversation(conversation_id, current_user.id, db)
    query = db.query(models.ChatMessage).filter(models.ChatMessage.conversation_id == conversation.id)
    if after_id:
        query = query.filter(models.ChatMessage.id > after_id)
    return query.order_by(models.ChatMessage.created_at.asc()).all()


@router.post("/conversations/{conversation_id}/messages", response_model=schemas.ChatMessageOut)
async def send_message(
    conversation_id: int,
    content: str = Form(None),
    file: UploadFile = File(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    conversation = _get_owned_conversation(conversation_id, current_user.id, db)

    if not content and not file:
        raise HTTPException(status_code=400, detail="Message can't be empty — write something or attach a file.")

    attachment_url = attachment_type = attachment_name = None
    if file:
        attachment_url, attachment_type, attachment_name = await _save_attachment(file, conversation.id)

    return _create_message(conversation, "user", content, attachment_url, attachment_type, attachment_name, db)


@router.post("/conversations/{conversation_id}/read")
def mark_read(
    conversation_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    conversation = _get_owned_conversation(conversation_id, current_user.id, db)
    conversation.user_read_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Marked as read."}


# ---------- consultant-side ----------

def _get_consultant_conversation(conversation_id: int, consultant_id: int, db: Session) -> models.Conversation:
    conversation = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if not conversation or conversation.consultant_id != consultant_id:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return conversation


@router.get("/consultant/conversations", response_model=list[schemas.ConversationOut])
def list_consultant_conversations(
    current_consultant: models.Consultant = Depends(auth.get_current_consultant),
    db: Session = Depends(get_db),
):
    conversations = (
        db.query(models.Conversation)
        .filter(models.Conversation.consultant_id == current_consultant.id)
        .order_by(models.Conversation.last_message_at.desc())
        .all()
    )
    return [_to_conversation_out(c, "consultant", db) for c in conversations]


@router.get("/consultant/conversations/{conversation_id}/messages", response_model=list[schemas.ChatMessageOut])
def list_consultant_messages(
    conversation_id: int,
    after_id: int = 0,
    current_consultant: models.Consultant = Depends(auth.get_current_consultant),
    db: Session = Depends(get_db),
):
    conversation = _get_consultant_conversation(conversation_id, current_consultant.id, db)
    query = db.query(models.ChatMessage).filter(models.ChatMessage.conversation_id == conversation.id)
    if after_id:
        query = query.filter(models.ChatMessage.id > after_id)
    return query.order_by(models.ChatMessage.created_at.asc()).all()


@router.post("/consultant/conversations/{conversation_id}/messages", response_model=schemas.ChatMessageOut)
async def send_consultant_message(
    conversation_id: int,
    content: str = Form(None),
    file: UploadFile = File(None),
    current_consultant: models.Consultant = Depends(auth.get_current_consultant),
    db: Session = Depends(get_db),
):
    conversation = _get_consultant_conversation(conversation_id, current_consultant.id, db)

    if not content and not file:
        raise HTTPException(status_code=400, detail="Message can't be empty — write something or attach a file.")

    attachment_url = attachment_type = attachment_name = None
    if file:
        attachment_url, attachment_type, attachment_name = await _save_attachment(file, conversation.id)

    return _create_message(conversation, "consultant", content, attachment_url, attachment_type, attachment_name, db)


@router.post("/consultant/conversations/{conversation_id}/read")
def mark_consultant_read(
    conversation_id: int,
    current_consultant: models.Consultant = Depends(auth.get_current_consultant),
    db: Session = Depends(get_db),
):
    conversation = _get_consultant_conversation(conversation_id, current_consultant.id, db)
    conversation.consultant_read_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Marked as read."}
