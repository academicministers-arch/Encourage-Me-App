"""Dailymotion video search integration."""

import httpx

from app.config import settings
from app.services import relevance_service


DAILYMOTION_SEARCH_URL = "https://api.dailymotion.com/videos"
MAX_RESULTS = 50


def _entry_text(entry: dict) -> str:
    return f"{entry.get('title', '')}. {entry.get('description', '')}"


def _build_entry(item: dict) -> dict | None:
    video_id = item.get("id")
    if not video_id:
        return None

    return {
        "media_id": f"dailymotion:{video_id}",
        "source_id": video_id,
        "provider": "dailymotion",
        "media_type": "video",
        "title": item.get("title") or "Dailymotion video",
        "channel": item.get("owner.screenname") or "Dailymotion",
        "thumbnail": item.get("thumbnail_360_url") or item.get("thumbnail_180_url"),
        "embed_url": f"https://www.dailymotion.com/embed/video/{video_id}",
        "url": item.get("url") or f"https://www.dailymotion.com/video/{video_id}",
        "description": item.get("description") or "",
        "duration": item.get("duration") or 0,
        "published_at": item.get("created_time"),
    }


async def search_videos(
    query: str,
    max_results: int = 6,
    exclude_ids: set[str] | None = None,
    relevance_query: str | None = None,
) -> list[dict]:
    """Search Dailymotion's public video catalog.

    relevance_query, when given (typically the user's own check-in text),
    is used to rerank candidates by semantic similarity to what they
    actually wrote, instead of trusting Dailymotion's own relevance sort
    alone. Falls back to that provider order if reranking isn't available.
    """
    exclude_ids = exclude_ids or set()
    # Over-fetch so reranking has a real pool of candidates to choose from,
    # not just whatever Dailymotion happened to put first.
    fetch_limit = max(1, min(max_results * 3, MAX_RESULTS))
    params = {
        "search": query,
        "limit": fetch_limit,
        "sort": "relevance",
        "fields": "id,title,thumbnail_360_url,thumbnail_180_url,url,description,duration,created_time,owner.screenname",
    }
    if settings.DAILYMOTION_API_KEY:
        params["api_key"] = settings.DAILYMOTION_API_KEY

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(DAILYMOTION_SEARCH_URL, params=params)
            response.raise_for_status()
            data = response.json()
    except Exception:
        return []

    candidates = []
    for item in data.get("list", []):
        entry = _build_entry(item)
        if entry and entry["media_id"] not in exclude_ids:
            candidates.append(entry)

    ranked = await relevance_service.rerank_by_relevance(
        relevance_query or query, candidates, _entry_text
    )
    return ranked[:max_results]
