"""Optional Groq-powered interpretation of a user's check-in."""

import json
from typing import Any, Dict, Optional

import httpx

from app.config import settings


ALLOWED_EMOTIONS = {
    "stress", "anxiety", "sadness", "loneliness", "anger", "fear",
    "burnout", "motivation", "excitement", "happiness", "calm", "confusion", "neutral",
}


def _normalise_result(value: Any) -> Optional[Dict[str, Any]]:
    if not isinstance(value, dict):
        return None

    emotion_key = str(value.get("emotion_key", "neutral")).strip().lower()
    if emotion_key not in ALLOWED_EMOTIONS:
        emotion_key = "neutral"

    raw_topics = value.get("search_topics")
    if not isinstance(raw_topics, dict):
        return None
    search_topics = {
        key: str(raw_topics.get(key, "")).strip()[:180]
        for key in ("music", "videos", "meditation", "podcasts")
    }
    if any(not topic for topic in search_topics.values()):
        return None

    fields = {
        "emotion_key": emotion_key,
        "feeling": str(value.get("feeling", "You are checking in with yourself.")).strip(),
        "need": str(value.get("need", "a little patience and support")).strip(),
        "next_step": str(value.get("next_step", "Take one small, kind step for yourself today.")).strip(),
        "content_focus": str(value.get("content_focus", "gentle encouragement")).strip(),
        "response": str(value.get("response", "Whatever you are feeling matters, and you do not have to handle it all at once.")).strip(),
    }
    if any(not fields[key] for key in fields):
        return None
    return {**fields, "search_topics": search_topics}


async def interpret_checkin(text: str) -> Optional[Dict[str, str]]:
    """Return a safe, structured interpretation, or None when unavailable."""
    if not settings.GROQ_API_KEY or not text or not text.strip():
        return None

    system_prompt = (
        "You are a compassionate wellbeing check-in assistant. Interpret the user's words, "
        "without diagnosing or judging them. Return ONLY valid JSON with exactly these string "
        "keys: emotion_key, feeling, need, next_step, content_focus, response, search_topics. "
        "search_topics must be an object with exactly these concise string keys: music, videos, meditation, podcasts. "
        "Each search topic must describe the user's situation and the kind of content needed, not just a generic mood. "
        "emotion_key must be one of: stress, anxiety, sadness, loneliness, anger, fear, "
        "burnout, motivation, excitement, happiness, calm, confusion, neutral. "
        "Keep each value concise and practical. response should be 1-2 warm sentences. "
        "If the message suggests immediate danger, encourage contacting local emergency or crisis support."
    )
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                json={
                    "model": settings.GROQ_EMOTION_MODEL,
                    "temperature": 0.2,
                    "max_tokens": 300,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": text[:4000]},
                    ],
                },
            )
        if response.status_code != 200:
            return None
        content = response.json().get("choices", [{}])[0].get("message", {}).get("content", "")
        return _normalise_result(json.loads(content or "{}"))
    except (httpx.HTTPError, ValueError, KeyError, IndexError, TypeError):
        return None