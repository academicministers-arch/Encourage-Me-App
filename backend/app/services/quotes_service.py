"""
Pulls real quotes from ZenQuotes.io — a free, no-API-key-required quotes
service — with a graceful fallback to the app's local curated quote list
if the request fails for any reason (rate limit, network issue, etc.).

Supports both a single quote (used for the daily check-in response) and
a full "Quotes" category with many results and duplicate-safe pagination
for a "Load more" button, same pattern as the video categories.
"""

import hashlib
import random
import httpx
from app.services.youtube_service import QUOTES as LOCAL_QUOTES

ZENQUOTES_RANDOM_URL = "https://zenquotes.io/api/random"
ZENQUOTES_BULK_URL = "https://zenquotes.io/api/quotes"  # returns up to 50 quotes in one call, no key needed

MAX_QUOTES = 50


def _quote_id(text: str) -> str:
    """Stable short ID for a quote, derived from its text — lets the
    frontend track which quotes have already been shown, the same way
    video_id is used to avoid showing duplicate videos on "Load more".
    """
    return hashlib.md5(text.strip().lower().encode()).hexdigest()[:12]


def _build_quote(text: str, author: str) -> dict:
    return {"quote_id": _quote_id(text), "text": text.strip(), "author": (author or "Unknown").strip()}


def _local_quotes(count: int, exclude_ids: set) -> list:
    pool = [q for q in LOCAL_QUOTES if _quote_id(q) not in exclude_ids]
    random.shuffle(pool)
    return [_build_quote(text, "Encourage Me") for text in pool[:count]]


async def get_quote() -> dict:
    """Returns a single {"quote_id", "text", "author"}. Tries ZenQuotes.io
    first, falls back to a random local quote on any failure. Used for
    the one quote shown alongside each daily check-in response.
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(ZENQUOTES_RANDOM_URL)
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, list) and data:
                item = data[0]
                text = item.get("q", "").strip()
                author = item.get("a", "").strip()
                if text:
                    return _build_quote(text, author)
    except Exception:
        pass

    return _build_quote(random.choice(LOCAL_QUOTES), "Encourage Me")


async def get_quotes(count: int = 6, exclude_ids: set = None) -> list:
    """Returns a batch of real quotes for the "Quotes" category, powering
    both the initial list and the "Load more" button. Pulls from
    ZenQuotes.io's bulk endpoint (up to 50 quotes per call), filters out
    anything already shown (via exclude_ids), and tops up with local
    curated quotes if ZenQuotes doesn't return enough new ones.
    """
    exclude_ids = set(exclude_ids) if exclude_ids else set()
    count = max(1, min(count, MAX_QUOTES))
    quotes = []

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(ZENQUOTES_BULK_URL)
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, list):
                random.shuffle(data)
                for item in data:
                    text = item.get("q", "").strip()
                    author = item.get("a", "").strip()
                    if not text:
                        continue
                    qid = _quote_id(text)
                    if qid in exclude_ids:
                        continue
                    quotes.append(_build_quote(text, author))
                    exclude_ids.add(qid)
                    if len(quotes) >= count:
                        break
    except Exception:
        pass

    if len(quotes) < count:
        needed = count - len(quotes)
        quotes += _local_quotes(needed, exclude_ids)

    return quotes[:count]
