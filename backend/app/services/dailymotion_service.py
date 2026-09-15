"""Dailymotion video search integration."""

import httpx

from app.config import settings


DAILYMOTION_SEARCH_URL = "https://api.dailymotion.com/videos"
MAX_RESULTS = 30


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


async def search_videos(query: str, max_results: int = 6, exclude_ids: set[str] | None = None) -> list[dict]:
    """Search Dailymotion's public video catalog."""
    exclude_ids = exclude_ids or set()
    limit = max(1, min(max_results * 2, MAX_RESULTS))
    params = {
        "search": query,
        "limit": limit,
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

    entries = []
    for item in data.get("list", []):
        entry = _build_entry(item)
        if entry and entry["media_id"] not in exclude_ids:
            entries.append(entry)
        if len(entries) >= max_results:
            break
    return entries