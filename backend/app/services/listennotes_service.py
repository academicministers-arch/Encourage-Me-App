"""Listen Notes podcast episode search integration."""

import httpx

from app.config import settings
from app.services import relevance_service


LISTEN_NOTES_SEARCH_URL = "https://listen-api.listennotes.com/api/v2/search"
MAX_RESULTS = 50


def _entry_text(entry: dict) -> str:
    return f"{entry.get('title', '')}. {entry.get('description', '')}"


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


async def search_podcasts(
    query: str,
    max_results: int = 6,
    exclude_ids: set[str] | None = None,
    relevance_query: str | None = None,
) -> list[dict]:
    """Search episode-level results and return only playable episodes.

    relevance_query, when given (typically the user's own check-in text),
    is used to rerank candidates by semantic similarity to what they
    actually wrote, instead of trusting Listen Notes' own ranking alone.
    Falls back to that provider order if reranking isn't available.
    """
    if not settings.LISTEN_NOTES_API_KEY:
        return []

    exclude_ids = exclude_ids or set()
    # Over-fetch so reranking has a real pool of candidates to choose from.
    fetch_limit = max(1, min(max_results * 3, MAX_RESULTS))
    params = {
        "q": query,
        "type": "episode",
        "len_min": 1,
        "offset": 0,
        "len": fetch_limit,
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

    candidates = []
    for item in data.get("results", []):
        entry = _build_entry(item)
        if entry and entry["media_id"] not in exclude_ids:
            candidates.append(entry)

    ranked = await relevance_service.rerank_by_relevance(
        relevance_query or query, candidates, _entry_text
    )
    return ranked[:max_results]
