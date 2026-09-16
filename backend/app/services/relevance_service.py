"""
Semantic relevance reranking using Hugging Face sentence embeddings.

Search-provider APIs (YouTube, Dailymotion, Listen Notes) rank results by
keyword match, publish date, or popularity — none of them know what the
user actually typed in their check-in. This module re-sorts a batch of
already-fetched candidates by cosine similarity between their title/
description and the user's own words, so a modestly-viewed but genuinely
on-topic result can outrank a hugely popular but only loosely-related one.

Entirely optional and fails soft: without HUGGINGFACE_API_TOKEN configured,
or if the embedding call fails for any reason (cold start, rate limit,
network error, unexpected response shape), callers get their candidates
back in original order — this never blocks or breaks a recommendation
request.
"""

import math
from typing import Callable, List, Optional

import httpx

from app.config import settings

HF_API_URL = "https://api-inference.huggingface.co/models/{model}"


def _cosine(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if not norm_a or not norm_b:
        return 0.0
    return dot / (norm_a * norm_b)


async def _embed(texts: List[str]) -> Optional[List[List[float]]]:
    """Returns one embedding vector per input text, in the same order, or
    None on any failure. Uses a sentence-transformers feature-extraction
    model, which returns a single fixed-length vector per input string.
    """
    if not settings.HUGGINGFACE_API_TOKEN or not texts:
        return None

    try:
        url = HF_API_URL.format(model=settings.HUGGINGFACE_EMBEDDING_MODEL)
        headers = {"Authorization": f"Bearer {settings.HUGGINGFACE_API_TOKEN}"}
        payload = {"inputs": texts, "options": {"wait_for_model": True}}
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, headers=headers, json=payload)
        if resp.status_code != 200:
            return None
        data = resp.json()
    except Exception:
        return None

    try:
        vectors = [list(map(float, vec)) for vec in data]
        if len(vectors) != len(texts):
            return None
        return vectors
    except Exception:
        return None


async def relevance_scores(
    query_text: str,
    items: List[dict],
    text_fn: Callable[[dict], str],
) -> Optional[List[float]]:
    """Returns a list of cosine-similarity scores (0-1, higher = more
    relevant), one per item, aligned to `items`' order. Returns None if
    scoring wasn't possible for any reason, so callers can fall back
    cleanly instead of getting a partial/misaligned result.
    """
    if not query_text or not query_text.strip() or not items:
        return None

    texts = [query_text] + [text_fn(item) or "" for item in items]
    vectors = await _embed(texts)
    if not vectors:
        return None

    query_vec, item_vecs = vectors[0], vectors[1:]
    return [_cosine(query_vec, vec) for vec in item_vecs]


async def rerank_by_relevance(
    query_text: str,
    items: List[dict],
    text_fn: Callable[[dict], str],
) -> List[dict]:
    """Reorders items by semantic similarity between query_text and each
    item's text (as produced by text_fn), most relevant first. Falls back
    to the original order on any failure — see relevance_scores.
    """
    if len(items) < 2:
        return items

    scores = await relevance_scores(query_text, items, text_fn)
    if scores is None:
        return items

    scored = sorted(zip(items, scores), key=lambda pair: pair[1], reverse=True)
    return [item for item, _ in scored]
