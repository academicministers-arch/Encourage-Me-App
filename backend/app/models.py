import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Boolean
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)  # nullable: Google-only accounts have no password
    google_id = Column(String, unique=True, nullable=True, index=True)
    avatar_url = Column(Text, nullable=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    entries = relationship("EmotionEntry", back_populates="user", cascade="all, delete-orphan")
    journals = relationship("JournalEntry", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    testimonials = relationship("Testimonial", back_populates="user", cascade="all, delete-orphan")
    testimonial_comments = relationship("TestimonialComment", back_populates="user", cascade="all, delete-orphan")
    testimonial_likes = relationship("TestimonialLike", back_populates="user", cascade="all, delete-orphan")
    consultation_purchases = relationship("ConsultationPurchase", back_populates="user", cascade="all, delete-orphan")
    chat_conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")


class Testimonial(Base):
    __tablename__ = "testimonials"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="testimonials")
    comments = relationship("TestimonialComment", back_populates="testimonial", cascade="all, delete-orphan")
    likes = relationship("TestimonialLike", back_populates="testimonial", cascade="all, delete-orphan")
    attachments = relationship("TestimonialAttachment", back_populates="testimonial", cascade="all, delete-orphan")


class TestimonialAttachment(Base):
    __tablename__ = "testimonial_attachments"

    id = Column(Integer, primary_key=True, index=True)
    testimonial_id = Column(Integer, ForeignKey("testimonials.id"), nullable=False)
    file_name = Column(String, nullable=True)
    content_type = Column(String, nullable=False)
    data = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    testimonial = relationship("Testimonial", back_populates="attachments")


class TestimonialComment(Base):
    __tablename__ = "testimonial_comments"

    id = Column(Integer, primary_key=True, index=True)
    testimonial_id = Column(Integer, ForeignKey("testimonials.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    testimonial = relationship("Testimonial", back_populates="comments")
    user = relationship("User", back_populates="testimonial_comments")


class TestimonialLike(Base):
    __tablename__ = "testimonial_likes"

    id = Column(Integer, primary_key=True, index=True)
    testimonial_id = Column(Integer, ForeignKey("testimonials.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    testimonial = relationship("Testimonial", back_populates="likes")
    user = relationship("User", back_populates="testimonial_likes")


class EmotionEntry(Base):
    __tablename__ = "emotion_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    emotion = Column(String, nullable=False)
    message = Column(Text, nullable=True)
    ai_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="entries")


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    entry_type = Column(String, default="reflection")  # reflection | gratitude | lesson
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="journals")
    attachments = relationship("JournalAttachment", back_populates="journal_entry", cascade="all, delete-orphan")


class JournalAttachment(Base):
    __tablename__ = "journal_attachments"

    id = Column(Integer, primary_key=True, index=True)
    journal_entry_id = Column(Integer, ForeignKey("journal_entries.id"), nullable=False)
    file_name = Column(String, nullable=True)
    content_type = Column(String, nullable=False)
    data = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    journal_entry = relationship("JournalEntry", back_populates="attachments")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content_type = Column(String, nullable=False)  # video | music | quote | meditation
    content_id = Column(String, nullable=False)
    title = Column(String, nullable=True)
    thumbnail = Column(String, nullable=True)
    channel = Column(String, nullable=True)
    extra = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="favorites")


class UserSettings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    notifications_enabled = Column(Boolean, default=True)
    reminder_time = Column(String, default="20:00")
    reminder_frequency = Column(String, default="daily")
    calendar_theme_id = Column(String, nullable=True)
    calendar_background_image = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="settings")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="reset_tokens")


class Consultant(Base):
    __tablename__ = "consultants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    title = Column(String, nullable=False)  # e.g. "Clinical Psychologist"
    bio = Column(Text, nullable=True)
    specialties = Column(String, nullable=True)  # comma-separated, e.g. "Anxiety, Grief, Relationships"
    experience_summary = Column(String, nullable=True)  # e.g. "8 years in private practice"
    plan_tier = Column(String, nullable=False, default="basic")  # "basic" | "premium"
    photo_url = Column(Text, nullable=True)
    contact_email = Column(String, nullable=True)  # also doubles as their chat login email
    contact_phone = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)  # set by admin to enable chat login
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversations = relationship("Conversation", back_populates="consultant", cascade="all, delete-orphan")


class SupportOrganization(Base):
    __tablename__ = "support_organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    country = Column(String, nullable=False, default="Uganda")
    location = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    phone_note = Column(String, nullable=True)
    email = Column(String, nullable=True)
    website = Column(String, nullable=True)
    emergency = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ConsultationPurchase(Base):
    __tablename__ = "consultation_purchases"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_tier = Column(String, nullable=False)  # "basic" | "premium"
    amount = Column(Integer, nullable=False)  # UGX, whole shillings
    currency = Column(String, default="UGX")
    tx_ref = Column(String, unique=True, index=True, nullable=False)
    flutterwave_transaction_id = Column(String, nullable=True)
    status = Column(String, default="pending")  # "pending" | "successful" | "failed"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="consultation_purchases")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    consultant_id = Column(Integer, ForeignKey("consultants.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_message_at = Column(DateTime, default=datetime.datetime.utcnow)
    # Unread tracking: the timestamp each side last read up to. A new
    # message "unread" for a side if it's newer than their *_read_at.
    user_read_at = Column(DateTime, nullable=True)
    consultant_read_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="chat_conversations")
    consultant = relationship("Consultant", back_populates="conversations")
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="ChatMessage.created_at")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender_type = Column(String, nullable=False)  # "user" | "consultant"
    content = Column(Text, nullable=True)  # nullable: a message can be attachment-only
    attachment_url = Column(Text, nullable=True)
    attachment_type = Column(String, nullable=True)  # "image" | "video" | "document"
    attachment_name = Column(String, nullable=True)  # original filename, for documents
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")
