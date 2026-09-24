import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPassword(BaseModel):
    email: EmailStr


class ResetPassword(BaseModel):
    token: str
    new_password: str = Field(min_length=6)


class GoogleAuthRequest(BaseModel):
    credential: str  # the ID token from Google Identity Services


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    avatar_url: Optional[str] = None
    is_admin: bool = False
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class TestimonialCommentCreate(BaseModel):
    content: str


class TestimonialAttachmentOut(BaseModel):
    id: int
    file_name: Optional[str] = None
    content_type: str
    data: str

    class Config:
        from_attributes = True


class TestimonialCommentOut(BaseModel):
    id: int
    content: str
    created_at: datetime.datetime
    user_name: str
    user_avatar: Optional[str] = None

    class Config:
        from_attributes = True


class TestimonialLikeOut(BaseModel):
    id: int
    user_name: str
    user_avatar: Optional[str] = None

    class Config:
        from_attributes = True


class TestimonialOut(BaseModel):
    id: int
    text: str
    created_at: datetime.datetime
    user_id: int
    user_name: str
    user_avatar: Optional[str] = None
    attachments: List["TestimonialAttachmentOut"] = []
    comments: List["TestimonialCommentOut"] = []
    likes: List["TestimonialLikeOut"] = []
    like_count: int
    liked_by_me: bool

    class Config:
        from_attributes = True


# ---------- Emotion Check-in ----------
class CheckinCreate(BaseModel):
    emotion: Optional[str] = None
    message: Optional[str] = None


class CheckinOut(BaseModel):
    id: int
    emotion: str
    message: Optional[str]
    ai_response: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class CheckinResponse(BaseModel):
    entry: CheckinOut
    recommendations: dict
    analysis: Optional[dict] = None
    crisis_support: Optional[dict] = None
    current_streak: int = 0


# ---------- Journal ----------
class JournalCreate(BaseModel):
    content: str
    entry_type: str = "reflection"


class JournalDraftRequest(BaseModel):
    prompt: str
    media_names: List[str] = []


class JournalDraftOut(BaseModel):
    draft: str

    class Config:
        from_attributes = True


class JournalAttachmentOut(BaseModel):
    id: int
    file_name: Optional[str] = None
    content_type: str
    data: str

    class Config:
        from_attributes = True


class JournalOut(BaseModel):
    id: int
    content: str
    entry_type: str
    created_at: datetime.datetime
    attachments: List[JournalAttachmentOut] = []

    class Config:
        from_attributes = True


# ---------- Favorites ----------
class FavoriteCreate(BaseModel):
    content_type: str
    content_id: str
    title: Optional[str] = None
    thumbnail: Optional[str] = None
    channel: Optional[str] = None
    extra: Optional[str] = None


class FavoriteOut(BaseModel):
    id: int
    content_type: str
    content_id: str
    title: Optional[str]
    thumbnail: Optional[str]
    channel: Optional[str]
    extra: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ---------- Settings ----------
class SettingsUpdate(BaseModel):
    notifications_enabled: Optional[bool] = None
    reminder_time: Optional[str] = None
    reminder_frequency: Optional[str] = None
    calendar_theme_id: Optional[str] = None
    calendar_background_image: Optional[str] = None


class SettingsOut(BaseModel):
    notifications_enabled: bool
    reminder_time: str
    reminder_frequency: str
    calendar_theme_id: Optional[str] = None
    calendar_background_image: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Journey / Stats ----------
class StatsOut(BaseModel):
    total_checkins: int
    current_streak: int
    longest_streak: int
    most_common_emotion: Optional[str]
    total_journal_entries: int
    resources_viewed: int


# ---------- Consultation / Consultants ----------
class ConsultantCreate(BaseModel):
    name: str
    title: str
    bio: Optional[str] = None
    specialties: Optional[str] = None
    experience_summary: Optional[str] = None
    plan_tier: str = Field(pattern="^(basic|premium)$")
    photo_url: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    is_active: bool = True
    password: Optional[str] = Field(default=None, min_length=6)  # set to enable chat login


class ConsultantUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    specialties: Optional[str] = None
    experience_summary: Optional[str] = None
    plan_tier: Optional[str] = Field(default=None, pattern="^(basic|premium)$")
    photo_url: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(default=None, min_length=6)  # leave blank to keep current password


class ConsultantOut(BaseModel):
    id: int
    name: str
    title: str
    bio: Optional[str]
    specialties: Optional[str]
    experience_summary: Optional[str]
    plan_tier: str
    photo_url: Optional[str]
    contact_email: Optional[str]
    contact_phone: Optional[str]
    is_active: bool
    created_at: datetime.datetime
    can_chat: bool = False  # true if a password is set (login enabled), computed by the endpoint

    class Config:
        from_attributes = True


# ---------- Consultant Chat Login ----------
class ConsultantLoginRequest(BaseModel):
    email: EmailStr
    password: str


class ConsultantToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    consultant: ConsultantOut


# ---------- Chat ----------
class ChatMessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_type: str
    content: Optional[str]
    attachment_url: Optional[str]
    attachment_type: Optional[str]
    attachment_name: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    id: int
    consultant_id: int
    consultant_name: str
    consultant_photo_url: Optional[str] = None
    user_id: int
    user_name: str
    last_message_at: datetime.datetime
    last_message_preview: Optional[str] = None
    unread_count: int = 0

    class Config:
        from_attributes = True


# ---------- Support Organizations ----------
class SupportOrganizationCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    country: str = "Uganda"
    location: Optional[str] = None
    phone: Optional[str] = None
    phone_note: Optional[str] = None
    email: Optional[EmailStr] = None
    website: Optional[str] = None
    emergency: bool = False


class SupportOrganizationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    country: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    phone_note: Optional[str] = None
    email: Optional[EmailStr] = None
    website: Optional[str] = None
    emergency: Optional[bool] = None


class SupportOrganizationOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: Optional[str]
    country: str
    location: Optional[str]
    phone: Optional[str]
    phone_note: Optional[str]
    email: Optional[str]
    website: Optional[str]
    emergency: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class TierGroupOut(BaseModel):
    tier: str
    locked: bool
    price: Optional[int] = None  # only present when locked, so frontend can show "Unlock for X UGX"
    count: int
    consultants: List[ConsultantOut] = []


class AccessStatusOut(BaseModel):
    has_basic: bool
    has_premium: bool


class PurchaseInitiate(BaseModel):
    plan_tier: str = Field(pattern="^(basic|premium)$")


class PurchaseInitiateOut(BaseModel):
    payment_link: str
    tx_ref: str


class PurchaseVerifyOut(BaseModel):
    status: str  # "successful" | "failed" | "pending"
    plan_tier: Optional[str] = None
    access: AccessStatusOut


class PurchaseHistoryOut(BaseModel):
    id: int
    plan_tier: str
    amount: int
    currency: str
    status: str
    created_at: datetime.datetime
    verified_at: Optional[datetime.datetime]
    user_name: Optional[str] = None
    user_email: Optional[str] = None

    class Config:
        from_attributes = True
