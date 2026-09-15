"""
Lightweight, local detection of language that may indicate a person is in
crisis (suicidal ideation, self-harm intent, or acute hopelessness).

Deliberately keyword/phrase-based rather than relying on any external API —
this needs to work every time, instantly, with no dependency on network
access or a third-party service being up. It is intentionally conservative
in the sense of erring toward showing support resources when uncertain,
since the cost of an unnecessary banner is low and the cost of missing a
real signal is high.

This never blocks or alters the check-in itself — it only flags whether to
show a supportive resource banner alongside the normal response.
"""

import re

from app.services.crisis_resources_uganda import (
    IMMEDIATE_CRISIS_RESOURCES_UGANDA,
    SPECIALIZED_SUPPORT_RESOURCES_UGANDA,
)

# High-signal phrases. Kept as whole-phrase matches (not single words like
# "die" or "kill" alone) to avoid false positives on ordinary language
# ("this exam is killing me") while still catching real expressions of
# intent or hopelessness.
CRISIS_PATTERNS = [
    r"\bkill(ing)?\s+myself\b",
    r"\bend(ing)?\s+my\s+life\b",
    r"\bwant(ed)?\s+to\s+die\b",
    r"\bwish(ed)?\s+i\s+(was|were)\s+dead\b",
    r"\bdon'?t\s+want\s+to\s+(be\s+alive|live\s+anymore|exist)\b",
    r"\bno\s+reason\s+to\s+(live|go\s+on)\b",
    r"\bbetter\s+off\s+dead\b",
    r"\bbetter\s+off\s+without\s+me\b",
    r"\bcan'?t\s+(go\s+on|do\s+this\s+anymore|take\s+it\s+anymore)\b",
    r"\bending\s+it\s+all\b",
    r"\bsuicidal\b",
    r"\bsuicide\b",
    r"\bself[\s-]?harm(ing)?\b",
    r"\bhurt(ing)?\s+myself\b",
    r"\bcutting\s+myself\b",
    r"\bno\s+point\s+in\s+(living|life|anything)\b",
    r"\bwant(ed)?\s+it\s+(all\s+)?to\s+(all\s+)?stop\b.{0,20}\b(forever|permanently)\b",
]

_COMPILED = [re.compile(p, re.IGNORECASE) for p in CRISIS_PATTERNS]


def detect_crisis(text: str) -> bool:
    """Returns True if the text contains language that may indicate a
    mental health crisis. Local-only, no network call, always available.
    """
    if not text:
        return False
    return any(p.search(text) for p in _COMPILED)


# Only return immediate, real-time crisis support for acute crisis detection.
# Specialized, non-urgent organizations are kept in a separate resource category.
CRISIS_RESOURCES = IMMEDIATE_CRISIS_RESOURCES_UGANDA

SPECIALIZED_RESOURCES = SPECIALIZED_SUPPORT_RESOURCES_UGANDA
