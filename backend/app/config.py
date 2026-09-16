import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[1]


def resolve_env_file() -> Path:
    env_file = os.getenv("ENV_FILE")
    if env_file:
        return Path(env_file).expanduser().resolve()

    candidates = [BACKEND_DIR / ".env", Path.cwd() / ".env"]
    for candidate in candidates:
        if candidate.exists():
            return candidate.resolve()

    return (BACKEND_DIR / ".env").resolve()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(resolve_env_file()), extra="ignore")

    SECRET_KEY: str = "insecure-dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # Supabase PostgreSQL connection string. There is no local database fallback.
    DATABASE_URL: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_STORAGE_BUCKET: str = "media"
    AUTO_CREATE_SCHEMA: bool = False

    YOUTUBE_API_KEY: str = ""
    LISTEN_NOTES_API_KEY: str = ""
    DAILYMOTION_API_KEY: str = ""

    HUGGINGFACE_API_TOKEN: str = ""
    HUGGINGFACE_EMOTION_MODEL: str = "SamLowe/roberta-base-go_emotions"
    HUGGINGFACE_JOURNAL_MODEL: str = "tiiuae/falcon-7b-instruct"
    # Sentence-embedding model used to rerank search results by how well
    # they actually match what the user typed, not just by provider
    # popularity/keyword-match order. sentence-transformers/all-MiniLM-L6-v2
    # is small, fast, and free-tier friendly on Hugging Face's Inference API.
    HUGGINGFACE_EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"

    # Groq provides the preferred natural-language interpretation for check-ins.
    GROQ_API_KEY: str = ""
    GROQ_EMOTION_MODEL: str = "llama-3.1-8b-instant"

    PEXELS_API_KEY: str = ""

    FRONTEND_ORIGIN: str = "http://localhost:5173"

    # Email (password reset) — works with Gmail (App Password), Outlook, or
    # any SMTP provider. Leave blank to log emails to console instead of
    # sending them, which is fine for local development.
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = ""

    # Google Sign-In — get a free Client ID at
    # https://console.cloud.google.com/apis/credentials
    GOOGLE_CLIENT_ID: str = ""

    # Flutterwave — powers paid consultation access (Mobile Money: MTN &
    # Airtel Uganda, via their Standard/Hosted Payment Page). Get keys at
    # https://dashboard.flutterwave.com/settings/apis (use TEST keys while
    # developing, LIVE keys only once you've completed their business
    # verification). FLUTTERWAVE_WEBHOOK_HASH is a secret string you set
    # yourself in the Flutterwave dashboard's webhook settings, used to
    # verify that webhook calls genuinely came from Flutterwave.
    FLUTTERWAVE_SECRET_KEY: str = ""
    FLUTTERWAVE_PUBLIC_KEY: str = ""
    FLUTTERWAVE_WEBHOOK_HASH: str = ""

    # Comma-separated list of email addresses that should automatically
    # become admins (able to manage consultants) on register/login. Set
    # this to your own email before creating your account.
    ADMIN_EMAILS: str = ""


settings = Settings()
