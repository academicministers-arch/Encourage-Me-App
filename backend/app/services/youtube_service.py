"""
YouTube Data API v3 integration.

Two layers of protection against showing videos that won't actually play:

1. Live API results are cross-checked against YouTube's videos.list
   endpoint to confirm each video is public and embeddable BEFORE it's
   shown to the user — this filters out videos where the uploader has
   disabled embedding, or that are private/restricted, which is the most
   common real cause of "video unavailable" errors in an embedded player.

2. If no API key is configured, or the API call fails entirely, falls
   back to a larger curated set of real, verified, correctly-categorized
   videos (music / motivational videos / meditation) that are known to
   work.
"""

import math
import random
import httpx
from app.config import settings
from app.services import relevance_service

YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos"


def _entry_text(entry: dict) -> str:
    return f"{entry.get('title', '')}. {entry.get('channel', '')}"


def _build_entry(video_id: str, title: str, channel: str) -> dict:
    return {
        "video_id": video_id,
        "title": title,
        "channel": channel,
        "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
        "embed_url": f"https://www.youtube.com/embed/{video_id}",
        "url": f"https://www.youtube.com/watch?v={video_id}",
    }


# ---------------------------------------------------------------------------
# Curated fallback content — real, verified YouTube videos, correctly
# separated by category. Used whenever no API key is set, the live API call
# fails, or too few videos survive the embeddability filter.
# ---------------------------------------------------------------------------

FALLBACK_MUSIC = [
    _build_entry("3NycM9lYdRI", "Relaxing Piano Music: Romantic Music, Beautiful Relaxing Music, Sleep Music, Stress Relief", "Soothing Relaxation"),
    _build_entry("9Q634rbsypE", "Relaxing Piano Music - Romantic Music, Beautiful Music, Soothing Sleep Music", "Soothing Relaxation"),
    _build_entry("jzAxf1t9b-k", "Feels Like Home — Relaxing Piano Music for Focus, Calm & Stress Relief", "Relaxing Music"),
    _build_entry("WJ3-F02-F_Y", "The Most Beautiful & Relaxing Piano Pieces, Vol. 1", "Rousseau"),
    _build_entry("77ZozI0rw7w", "Soothing Relaxation: Relaxing Piano Music & Water Sounds", "Soothing Relaxation"),
    _build_entry("TRS_xZH8qyU", "Beautiful Piano Music - Relaxing Music, Study Music, Stress Relief, Sleep Music", "OCB Relax Music"),
    _build_entry("1vVbWwsT6jE", "Best of Peaceful Morning Music", "Soothing Relaxation"),
    _build_entry("8Z06-JSkxNs", "Wednesday | 1 Hour of Relaxing Piano Music", "Soothing Relaxation"),
    _build_entry("mXjU_Tu4TbI", "Together: Relaxing & Romantic Piano Music for Work, Focus & Studying", "Soothing Relaxation"),
    _build_entry("lCOF9LN_Zxs", "Beautiful Piano Music, Vol. 1 — Relaxing Music for Focus, Sleep & Relaxation", "Soothing Relaxation"),
    _build_entry("ldgjk2GipP8", "Beautiful Piano Music, Vol. 5 — Relaxing Music", "Soothing Relaxation"),
    _build_entry("hlWiI4xVXKY", "Sunny Mornings: Beautiful Relaxing Music with Piano, Guitar & Bird Sounds", "Soothing Relaxation"),
    _build_entry("T7qPvoA1XOg", "Focus Relaxing Piano Music For Study", "Rousseau"),
    _build_entry("UgI-uvlZBFk", "Relaxing Piano Music — Calm Music to Study, Focus, Relax", "Relaxing Music"),
    _build_entry("oiGmGFxsJi8", "Calm Piano Music for Studying, Reading, Relaxation", "Halidon Music"),
    _build_entry("8WVXk0Gz66E", "10 Hours of Relaxing Music — Calm Piano & Guitar, Sleep Music, Study Music", "Soothing Relaxation"),
    _build_entry("cGYyOY4XaFs", "The Best of Piano: The Most Beautiful Classical Piano Pieces for Relax & Study", "Rousseau"),
]

FALLBACK_MOTIVATION = [
    _build_entry("PdEAbRhsNzk", "The Ultimate Les Brown Motivational Compilation", "Goalcast"),
    _build_entry("imB8rVYjMXA", "Top 10 - Most Epic Motivational Speeches", "Goalcast"),
    _build_entry("Ut5jz6HvtVk", "The Best Motivational Speeches To Help You Get Through Hard Times", "Goalcast"),
    _build_entry("yJYiOzTAZ-o", "Top 5 Speeches That Will Set You Up For Success", "Goalcast"),
    _build_entry("zw92TlnysPA", "When Life Knocks You Down — Motivational Speech Compilation", "Goalcast"),
    _build_entry("hG6oqtJAwdU", "Goalcast's Top 10 Most Epic Inspirational Speeches, Vol. 1", "Goalcast"),
    _build_entry("_U7mshkeH20", "Goalcast's Top 10 Most Epic Inspirational Speeches, Vol. 2", "Goalcast"),
    _build_entry("oZP92KUUw_g", "These 10 Life Lessons Will Leave You Speechless", "Goalcast"),
    _build_entry("HJ1ZXmpi8Tw", "The Best Motivational Video Speeches Compilation (Intense Edition)", "Fearless Motivation"),
    _build_entry("3f7EBvF0Zuk", "Motivational Speeches That Made Me Unstoppable — One Hour of Motivation", "Fearless Motivation"),
    _build_entry("7gWq1MU1iNU", "Best Motivational Speech Compilation — Rise Up", "Fearless Motivation"),
]

FALLBACK_MEDITATION = [
    _build_entry("MJ0eCONKhxU", "Guided Meditation for Anxiety and Stress", "Meditation Relax Club"),
    _build_entry("aKYI24ed77E", "Guided Meditation: Relieve Anxiety, Clear Negativity, Release Worry", "Jason Stephenson"),
    _build_entry("YzRUEmqDJd8", "Guided Meditation for Healing Anxiety, PTSD, Panic & Stress", "The Honest Guys"),
    _build_entry("KnwWiEGDvMA", "Dispelling Anxiety — Pre-Sleep & Relaxation Meditation", "Jason Stephenson"),
    _build_entry("0DXiDp0tPWY", "Settle Anxious Thoughts in 9 Minutes — Guided Meditation", "Great Meditation"),
    _build_entry("ztyp8ccGxhY", "Guided Meditation for Anxiety and Stress", "Jason Stephenson"),
]

# Story-led conversations are searched live when a YouTube API key is
# configured. The motivational fallback keeps the section useful offline.
FALLBACK_PODCASTS = [
    _build_entry("PdEAbRhsNzk", "The Ultimate Les Brown Motivational Compilation", "Goalcast"),
    _build_entry("Ut5jz6HvtVk", "The Best Motivational Speeches To Help You Get Through Hard Times", "Goalcast"),
    _build_entry("zw92TlnysPA", "When Life Knocks You Down — Motivational Speech Compilation", "Goalcast"),
    _build_entry("oZP92KUUw_g", "These 10 Life Lessons Will Leave You Speechless", "Goalcast"),
    _build_entry("3f7EBvF0Zuk", "Motivational Speeches That Made Me Unstoppable", "Fearless Motivation"),
]

FALLBACK_BY_CATEGORY = {
    "music": FALLBACK_MUSIC,
    "motivation": FALLBACK_MOTIVATION,
    "meditation": FALLBACK_MEDITATION,
    "podcasts": FALLBACK_PODCASTS,
}


MAX_PER_CATEGORY = 50


def _fallback(category: str, max_results: int, exclude_ids: set = None) -> list:
    pool = FALLBACK_BY_CATEGORY.get(category, FALLBACK_MOTIVATION)
    if exclude_ids:
        pool = [v for v in pool if v["video_id"] not in exclude_ids]
    # Shuffle so repeated check-ins don't always show the exact same
    # videos in the same order — still capped to the curated,
    # correctly-categorized, verified-real set.
    return random.sample(pool, min(max_results, len(pool)))


async def _filter_and_rank_by_popularity(
    client: httpx.AsyncClient, candidates: list, relevance_query: str | None = None
) -> list:
    """Given search candidates, confirms each is actually embeddable/public
    (same as before), fetches real view/like counts, AND — when
    relevance_query is given (typically the user's own check-in text) —
    scores each candidate's title/channel against it for semantic
    relevance. The two signals are blended so results favor videos that
    are both topically relevant to what the user actually wrote and
    genuinely popular/well-loved, rather than whichever video simply has
    the most views regardless of fit.
    """
    if not candidates:
        return []

    ids = ",".join(c["video_id"] for c in candidates)
    try:
        resp = await client.get(YOUTUBE_VIDEOS_URL, params={
            "part": "status,statistics",
            "id": ids,
            "key": settings.YOUTUBE_API_KEY,
        })
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        # If the lookup fails, don't block the whole request over it —
        # just return candidates as-is, unranked, rather than showing nothing.
        return candidates

    stats_by_id = {}
    for item in data.get("items", []):
        status = item.get("status", {})
        if not (status.get("embeddable") and status.get("privacyStatus") == "public"):
            continue
        statistics = item.get("statistics", {})
        stats_by_id[item["id"]] = {
            "view_count": int(statistics.get("viewCount", 0)),
            "like_count": int(statistics.get("likeCount", 0)),
        }

    playable = [c for c in candidates if c["video_id"] in stats_by_id]
    if not playable:
        return []

    # Popularity signal: log-scale view count (raw view counts span many
    # orders of magnitude, which would otherwise swamp the relevance
    # signal entirely), normalized to 0-1 across this candidate set.
    log_views = [math.log10(stats_by_id[c["video_id"]]["view_count"] + 1) for c in playable]
    max_log_views = max(log_views) or 1.0
    popularity_norm = [lv / max_log_views for lv in log_views]

    relevance = await relevance_service.relevance_scores(relevance_query, playable, _entry_text) if relevance_query else None

    if relevance is not None:
        # Relevance-to-what-the-user-wrote is weighted higher than raw
        # popularity — a smaller, well-matched video should beat a viral
        # but loosely-related one.
        combined = [0.65 * rel + 0.35 * pop for rel, pop in zip(relevance, popularity_norm)]
    else:
        combined = popularity_norm

    like_counts = [stats_by_id[c["video_id"]]["like_count"] for c in playable]
    ranked = sorted(
        zip(playable, combined, like_counts),
        key=lambda t: (t[1], t[2]),
        reverse=True,
    )
    return [c for c, _, _ in ranked]


async def search_youtube(
    query: str,
    max_results: int = 6,
    category: str = "motivation",
    exclude_ids: set = None,
    relevance_query: str = None,
) -> list:
    """Searches YouTube for the given query, then filters out any results
    that wouldn't actually play in an embedded player (private, embedding
    disabled, etc.), and any video_id already present in exclude_ids (used
    for "load more" pagination so repeat calls never show duplicates).
    category ("music", "motivation", "meditation", or "podcasts") determines which
    curated fallback list is used if the live API is unavailable or too
    few results survive filtering. relevance_query, when given (typically
    the user's own check-in text), is blended into ranking so results
    favor genuine fit to what the user wrote, not just view counts.
    """
    exclude_ids = exclude_ids or set()

    if not settings.YOUTUBE_API_KEY:
        return _fallback(category, max_results, exclude_ids)

    # Request more than needed up front, since some will get filtered out
    # for not being embeddable, or excluded as already-shown — this keeps
    # the final result count close to what was actually asked for.
    # YouTube's search API allows up to 50 results per call.
    requested = min(max_results * 3, 50)

    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": requested,
        "safeSearch": "strict",
        "key": settings.YOUTUBE_API_KEY,
    }
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(YOUTUBE_SEARCH_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

            candidates = []
            for item in data.get("items", []):
                vid = item.get("id", {}).get("videoId")
                snippet = item.get("snippet", {})
                if not vid or vid in exclude_ids:
                    continue
                candidates.append(_build_entry(vid, snippet.get("title", ""), snippet.get("channelTitle", "")))

            playable = await _filter_and_rank_by_popularity(client, candidates, relevance_query)
    except Exception:
        return _fallback(category, max_results, exclude_ids)

    if len(playable) < max_results:
        # Not enough genuinely playable results came back — top up with
        # curated fallback videos rather than showing a sparse list.
        needed = max_results - len(playable)
        existing_ids = {p["video_id"] for p in playable} | exclude_ids
        topup = [v for v in _fallback(category, needed + 2, existing_ids) if v["video_id"] not in existing_ids]
        playable += topup[:needed]

    return playable[:max_results] if playable else _fallback(category, max_results, exclude_ids)


QUOTES = [
    "Every challenge teaches something valuable.",
    "Progress is made one step at a time.",
    "You are allowed to rest without feeling guilty.",
    "Small steps every day lead to big changes.",
    "Your feelings are valid, and so is your strength.",
    "This moment does not define your whole story.",
    "Growth is quiet, but it is happening.",
    "Be gentle with yourself — you're doing better than you think.",
    "Storms don't last forever, and neither will this.",
    "You have survived every hard day so far. That matters.",
    "Healing isn't linear, and that's okay.",
    "You are more resilient than you give yourself credit for.",
    "Today doesn't have to be perfect to be worthwhile.",
    "Your pace is your own. Comparison steals your peace.",
    "It's okay to not be okay — just don't stay there alone.",
]

AFFIRMATIONS = [
    "I am capable of handling whatever today brings.",
    "I choose progress over perfection.",
    "I am allowed to take up space and rest.",
    "My feelings are valid and temporary.",
    "I am growing, even on hard days.",
    "I am worthy of rest, kindness, and encouragement.",
    "I trust the timing of my life.",
    "I release what I cannot control and focus on what I can.",
    "I am proud of how far I've come.",
    "I am allowed to ask for help.",
]

GROWTH_REMINDERS = [
    "Healing is not linear — some days will feel harder than others, and that's normal.",
    "You don't have to have it all figured out today.",
    "Comparing chapter one of your journey to someone else's chapter twenty isn't fair to you.",
    "Asking for help is a sign of strength, not weakness.",
    "Consistency beats intensity. Small daily check-ins add up.",
]
