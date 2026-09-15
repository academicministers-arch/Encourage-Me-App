"""
Optional real emotion classification via the Hugging Face Inference API.

Uses SamLowe/roberta-base-go_emotions by default — a model trained on
Reddit comments across 28 nuanced emotion labels (nervousness, excitement,
confusion, disappointment, etc.), which reads tone and phrasing rather than
just matching literal keywords.

This is entirely optional. If HUGGINGFACE_API_TOKEN isn't set, or the
request fails for any reason (network issue, model cold-starting on
Hugging Face's free tier, rate limit), the caller falls back to the local
keyword-based analysis — the app never breaks because of this.
"""

import asyncio
from typing import List, Optional, Tuple

import httpx

from app.config import settings

HF_API_URL = "https://api-inference.huggingface.co/models/{model}"


async def classify_emotion(text: str) -> Optional[List[Tuple[str, float]]]:
    """Returns a list of (label, score) sorted by score descending, or None
    if the Hugging Face call couldn't be completed for any reason.
    """
    if not settings.HUGGINGFACE_API_TOKEN or not text or not text.strip():
        return None

    url = HF_API_URL.format(model=settings.HUGGINGFACE_EMOTION_MODEL)
    headers = {"Authorization": f"Bearer {settings.HUGGINGFACE_API_TOKEN}"}
    payload = {"inputs": text, "parameters": {"top_k": None}}

    async with httpx.AsyncClient(timeout=10) as client:
        for attempt in range(2):  # one retry in case the model is cold-starting
            try:
                resp = await client.post(url, headers=headers, json=payload)
            except httpx.RequestError:
                return None

            if resp.status_code == 503:
                # Free-tier models unload when idle and take a few seconds
                # to spin back up on first use. Wait briefly, then retry once.
                try:
                    wait_for = min(resp.json().get("estimated_time", 3), 6)
                except Exception:
                    wait_for = 3
                if attempt == 0:
                    await asyncio.sleep(wait_for)
                    continue
                return None

            if resp.status_code != 200:
                return None

            try:
                data = resp.json()
                # Response can be [{"label":..,"score":..}, ...] or
                # [[{"label":..,"score":..}, ...]] depending on model config.
                if isinstance(data, list) and data and isinstance(data[0], list):
                    data = data[0]
                results = [(item["label"], float(item["score"])) for item in data]
                results.sort(key=lambda x: x[1], reverse=True)
                return results
            except Exception:
                return None

    return None


def _local_journal_fallback(prompt: str) -> str:
    base = prompt.strip()
    if not base:
        return (
            "Today I want to reflect on how I feel and the steps I can take toward growth. "
            "I am choosing kindness for myself and celebrating the small moments that matter."
        )

    return (
        f"I want to write about {base}. "
        "This experience helped me feel more connected and encouraged me to keep moving forward with hope. "
        "I am grateful for the lessons it taught me, and I am choosing to be gentle with myself as I grow. "
        "Writing this down helps me remember that every step counts."
    )


def _strip_full_prompt(prompt: str, generated: str) -> str:
    if not prompt or not generated:
        return generated or ""

    cleaned = generated.lstrip()
    if cleaned.startswith(prompt):
        cleaned = cleaned[len(prompt) :]
    return cleaned.strip()


async def generate_text(prompt: str) -> Optional[str]:
    """Generate a text completion using the Hugging Face Inference API."""
    if not prompt.strip():
        return None

    if not settings.HUGGINGFACE_API_TOKEN:
        return _local_journal_fallback(prompt)

    url = HF_API_URL.format(model=settings.HUGGINGFACE_JOURNAL_MODEL)
    headers = {
        "Authorization": f"Bearer {settings.HUGGINGFACE_API_TOKEN}",
        "Accept": "application/json",
    }
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 400,
            "temperature": 0.75,
            "top_p": 0.9,
            "repetition_penalty": 1.1,
            "return_full_text": False,
        },
    }

    async with httpx.AsyncClient(timeout=60) as client:
        for attempt in range(2):
            try:
                resp = await client.post(url, headers=headers, json=payload)
            except httpx.RequestError:
                return _local_journal_fallback(prompt)

            if resp.status_code == 503 and attempt == 0:
                await asyncio.sleep(4)
                continue

            if resp.status_code != 200:
                return _local_journal_fallback(prompt)

            try:
                data = resp.json()
                if isinstance(data, list) and data and isinstance(data[0], dict):
                    generated = data[0].get("generated_text") or str(data[0])
                    return _strip_full_prompt(prompt, generated)
                if isinstance(data, dict):
                    generated = data.get("generated_text") or data.get("text") or str(data)
                    return _strip_full_prompt(prompt, generated)
                if isinstance(data, str):
                    return _strip_full_prompt(prompt, data)
                return _local_journal_fallback(prompt)
            except Exception:
                return _local_journal_fallback(prompt)

    return _local_journal_fallback(prompt)
