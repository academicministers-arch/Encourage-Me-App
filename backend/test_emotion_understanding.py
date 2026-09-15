"""
Standalone test script — run this to see exactly how the app understands
different check-in messages, without going through the browser.

Usage:
    (with .venv activated, from the backend/ folder)
    python test_emotion_understanding.py
"""

import asyncio
import sys

from app.services import emotion_analysis, huggingface_service
from app.config import settings

# A mix of messages: some with obvious keywords, some that only tone/phrasing
# reveals — this is the real test of whether Hugging Face adds value beyond
# the local keyword matching.
TEST_MESSAGES = [
    "I feel stressed about my exams.",
    "I can't stop worrying about tomorrow.",
    "Work has been draining me for weeks now.",
    "I got the promotion! I still can't believe it.",
    "Nobody really checks in on me anymore.",
    "I have no idea what I'm supposed to do next.",
    "Today was fine I guess, nothing special.",
    "I'm furious that they cancelled the meeting last minute.",
]


async def main():
    has_token = bool(settings.HUGGINGFACE_API_TOKEN)
    print("=" * 70)
    print(f"Hugging Face token configured: {'YES' if has_token else 'NO — running keyword-only fallback'}")
    print(f"Model: {settings.HUGGINGFACE_EMOTION_MODEL}")
    print("=" * 70)
    print()

    for msg in TEST_MESSAGES:
        print(f"Message: {msg!r}")

        # Show the raw Hugging Face classification, if a token is set,
        # so you can see the model's actual confidence scores.
        if has_token:
            hf_raw = await huggingface_service.classify_emotion(msg)
            if hf_raw:
                top3 = hf_raw[:3]
                formatted = ", ".join(f"{label} ({score:.2f})" for label, score in top3)
                print(f"  Hugging Face top labels: {formatted}")
            else:
                print("  Hugging Face call failed or returned nothing (check token/network)")

        result = await emotion_analysis.analyze_text_smart(msg)
        print(f"  -> Final emotion: {result.display_label}")
        print(f"  -> AI response: {result.ai_response}")
        print(f"  -> YouTube search topic: {result.personalized_topic!r}")
        print()

    print("=" * 70)
    print("Done. Compare the 'Final emotion' against what you'd expect a")
    print("human to say for each message above.")


if __name__ == "__main__":
    asyncio.run(main())
