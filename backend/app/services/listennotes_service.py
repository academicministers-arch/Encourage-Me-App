"""Listen Notes podcast episode search integration."""

import httpx

from app.config import settings


LISTEN_NOTES_SEARCH_URL = "https://listen-api.listennotes.com/api/v2/search"
MAX_RESULTS = 30


def _build_entry(item: dict) -> dict | None:
    episode_id = item.get("id")
    audio_url = item.get("audio")
    if not episode_id or not audio_url:
        return None

    return {
        "media_id": f"listennotes:{episode_id}",
        "source_id": episode_id,
        "provider": "listennotes",
        "media_type": "audio",
        "title": item.get("title_original") or item.get("title") or "Podcast episode",
        "channel": item.get("podcast_title_original") or item.get("podcast_title") or "Podcast",
        "thumbnail": item.get("thumbnail") or item.get("image"),
        "audio_url": audio_url,
        "embed_url": item.get("link") or f"https://www.listennotes.com/e/{episode_id}/",
        "url": item.get("link") or f"https://www.listennotes.com/e/{episode_id}/",
        "description": item.get("description_original") or item.get("description") or "",
        "duration": item.get("audio_length_sec") or 0,
        "published_at": item.get("pub_date_ms"),
    }


async def search_podcasts(query: str, max_results: int = 6, exclude_ids: set[str] | None = None) -> list[dict]:
    """Search episode-level results and return only playable episodes."""
    if not settings.LISTEN_NOTES_API_KEY:
        return []

    exclude_ids = exclude_ids or set()
    limit = max(1, min(max_results * 2, MAX_RESULTS))
    params = {
        "q": query,
        "type": "episode",
        "len_min": 1,
        "offset": 0,
        "len": limit,
        "sort_by_date": 0,
    }
    headers = {"X-ListenAPI-Key": settings.LISTEN_NOTES_API_KEY}

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(LISTEN_NOTES_SEARCH_URL, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
    except Exception:
        return []

    entries = []
    for item in data.get("results", []):
        entry = _build_entry(item)
        if entry and entry["media_id"] not in exclude_ids:
            entries.append(entry)
        if len(entries) >= max_results:
            break
    return entries