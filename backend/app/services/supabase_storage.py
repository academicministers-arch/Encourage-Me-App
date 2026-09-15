from pathlib import PurePosixPath
import re
from typing import Optional

from app.config import settings


try:
    from supabase import Client, create_client
except ImportError:  # pragma: no cover - dependency is installed in deployments
    Client = object
    create_client = None


_client: Optional[Client] = None


def _get_client() -> Client:
    global _client
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("Supabase Storage is not configured.")
    if _client is None:
        if create_client is None:
            raise RuntimeError("The supabase package is not installed.")
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    return _client


def upload_media(path: str, contents: bytes, content_type: str) -> str:
    """Upload media to the configured public bucket and return its public URL."""
    safe_path = "/".join(
        re.sub(r"[^A-Za-z0-9._-]", "_", part)
        for part in PurePosixPath(path).parts
        if part not in {"", ".", ".."}
    )
    bucket = _get_client().storage.from_(settings.SUPABASE_STORAGE_BUCKET)
    bucket.upload(safe_path, contents, {"content-type": content_type, "upsert": "true"})
    return bucket.get_public_url(safe_path)


def delete_media(path: str) -> None:
    if not path or not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        return
    _get_client().storage.from_(settings.SUPABASE_STORAGE_BUCKET).remove([path])