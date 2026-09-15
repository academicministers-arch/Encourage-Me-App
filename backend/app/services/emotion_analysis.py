"""
Rule/keyword based emotion analysis.

This intentionally avoids requiring a paid external AI API key so the app
runs immediately out of the box. It scores the user's free-text message
against keyword lexicons for each supported emotion, picks the strongest
match, and returns a warm, supportive response plus a search topic used to
pull relevant YouTube recommendations.
"""

from dataclasses import dataclass
from typing import Optional
import re
import random

# Words that carry no search-relevant meaning on their own — filtered out
# before building a YouTube query from the user's free text.
STOPWORDS = {
    "i", "im", "i'm", "me", "my", "mine", "myself", "we", "us", "our",
    "you", "your", "he", "she", "it", "they", "them", "their",
    "am", "is", "are", "was", "were", "be", "been", "being",
    "feel", "feeling", "feelings", "felt", "today", "right", "now",
    "a", "an", "the", "and", "or", "but", "so", "because", "of", "to",
    "in", "on", "at", "for", "with", "about", "like", "that", "this",
    "just", "really", "very", "kind", "sort", "bit", "little", "lot",
    "have", "has", "had", "do", "does", "did", "can", "could", "will",
    "would", "should", "not", "no", "yes", "up", "down", "out", "over",
    "than", "then", "too", "also", "still", "even", "get", "getting",
    "going", "go", "want", "need", "think", "know", "don't", "dont",
    "can't", "cant", "it's", "its", "all", "some", "any", "one",
}


def extract_keywords(message: str, max_words: int = 6) -> str:
    """Pull the meaningful words out of free text for use in a search query.

    Strips filler/self-referential words ("I feel", "today", etc.) and
    keeps the words that actually describe what's going on for the user —
    e.g. "I feel stressed about my exams" -> "stressed exams".
    """
    if not message:
        return ""
    words = re.findall(r"[a-zA-Z']+", message.lower())
    seen = []
    for w in words:
        if w in STOPWORDS or len(w) < 3:
            continue
        if w not in seen:
            seen.append(w)
        if len(seen) >= max_words:
            break
    return " ".join(seen)

EMOTION_KEYWORDS = {
    "stress": ["stress", "stressed", "overwhelmed", "pressure", "deadline", "exam", "exams", "too much"],
    "anxiety": ["anxious", "anxiety", "nervous", "worried", "worry", "panic", "on edge"],
    "sadness": ["sad", "down", "depressed", "unhappy", "crying", "cry", "hurt", "heartbroken"],
    "loneliness": ["lonely", "alone", "isolated", "no one", "nobody understands"],
    "anger": ["angry", "furious", "mad", "irritated", "frustrated", "annoyed"],
    "fear": ["afraid", "scared", "fear", "terrified", "frightened"],
    "burnout": ["burnt out", "burned out", "burnout", "exhausted", "drained", "tired of everything"],
    "motivation": ["motivated", "determined", "focused", "driven", "ready to", "goal"],
    "excitement": ["excited", "thrilled", "can't wait", "pumped", "stoked"],
    "happiness": ["happy", "great", "good day", "joy", "joyful", "grateful", "blessed", "content"],
    "calm": ["calm", "peaceful", "relaxed", "at ease", "serene"],
    "confusion": ["confused", "lost", "don't know", "uncertain", "unsure"],
}

RESPONSES = {
    "stress": "Your message suggests you may be experiencing stress. Remember that difficult periods are temporary and every step forward matters.",
    "anxiety": "It sounds like anxiety may be weighing on you right now. Try to take one slow breath at a time — you don't have to solve everything today.",
    "sadness": "It's okay to feel sad. Give yourself permission to feel this, and know that this feeling will soften with time and care.",
    "loneliness": "Feeling lonely is hard, but you are not as alone as it feels. Reaching out — even in small ways — can make a real difference.",
    "anger": "It's valid to feel angry. Let's channel that energy into something constructive, and give yourself space to cool down first.",
    "fear": "Fear can feel overwhelming, but naming it is already a brave first step. You're stronger than this moment.",
    "burnout": "You may be running on empty. Rest isn't a reward you have to earn — it's something you need right now.",
    "motivation": "That drive is powerful — let's keep the momentum going with content that fuels your focus.",
    "excitement": "Your excitement is contagious! Let's celebrate this energy and keep it going.",
    "happiness": "It's wonderful that you're feeling good today. Let's build on this positive momentum.",
    "calm": "That sense of calm is valuable — let's help you hold onto it a little longer.",
    "confusion": "Feeling uncertain is completely normal. Clarity often comes one small step at a time.",
    "neutral": "Thank you for checking in today. Whatever you're feeling, it matters, and tracking it is a great step toward self-awareness.",
}

# Maps internal emotion -> the 10 official UI emotion card labels
DISPLAY_LABEL = {
    "stress": "Stressed",
    "anxiety": "Anxious",
    "sadness": "Sad",
    "loneliness": "Lonely",
    "anger": "Angry",
    "fear": "Anxious",
    "burnout": "Stressed",
    "motivation": "Motivated",
    "excitement": "Excited",
    "happiness": "Happy",
    "calm": "Calm",
    "confusion": "Confused",
    "neutral": "Calm",
}

# Multiple search angles per emotion, for music/motivational video content.
# A random one is picked each time — this is what stops the app from
# searching the exact same phrase every time someone feels "stressed,"
# which was causing it to converge on the same handful of viral videos.
# Short mood descriptors — a couple of words each, not full sentences.
# These get dynamically combined with the user's own extracted keywords
# to BUILD a search query, rather than picking a whole pre-written phrase
# off a shelf. This is what makes the search genuinely reflect what
# someone typed instead of always searching one of a handful of canned
# strings for a given emotion.
EMOTION_DESCRIPTORS = {
    "stress": ["calming", "stress relief", "destress"],
    "anxiety": ["calming", "anxiety relief", "grounding"],
    "sadness": ["uplifting", "comforting", "gentle healing"],
    "loneliness": ["comforting", "connection", "you are not alone"],
    "anger": ["calming", "letting go", "cooling down"],
    "fear": ["courage", "overcoming fear", "reassuring"],
    "burnout": ["restorative", "deep rest", "recharge"],
    "motivation": ["high energy", "motivational", "discipline"],
    "excitement": ["upbeat", "energetic", "celebratory"],
    "happiness": ["feel good", "uplifting", "joyful"],
    "calm": ["peaceful", "serene", "tranquil"],
    "confusion": ["clarity", "focus", "grounding"],
    "neutral": ["mindful", "positive", "gentle"],
}

CONTENT_TEMPLATES = {
    "music": "{descriptor} music",
    "video": "{descriptor} motivational video",
    "meditation": "{descriptor} guided meditation",
    "podcast": "{descriptor} personal story podcast",
}


@dataclass
class AnalysisResult:
    emotion_key: str
    display_label: str
    ai_response: str
    search_topic: str
    personalized_topic: str = ""
    meditation_topic: str = ""
    podcast_topic: str = ""
    feeling: str = ""
    need: str = ""
    next_step: str = ""
    content_focus: str = ""
    video_topic: str = ""


def _score_keywords(text: str) -> dict:
    scores = {emo: 0 for emo in EMOTION_KEYWORDS}
    for emo, keywords in EMOTION_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                scores[emo] += 1
    return scores


# Maps the 28 GoEmotions labels the Hugging Face model returns onto our
# 10-category UI taxonomy. GoEmotions doesn't have exact "stressed" or
# "lonely" categories, so those still rely more heavily on local keywords —
# this mapping mainly strengthens general tone/mood detection.
GOEMOTIONS_TO_CATEGORY = {
    "joy": "happiness", "amusement": "happiness", "approval": "happiness",
    "gratitude": "happiness", "love": "happiness", "admiration": "happiness",
    "relief": "happiness", "pride": "happiness", "optimism": "happiness",
    "excitement": "excitement", "desire": "motivation", "curiosity": "motivation",
    "sadness": "sadness", "disappointment": "sadness", "grief": "sadness",
    "remorse": "sadness", "embarrassment": "sadness",
    "anger": "anger", "annoyance": "anger", "disapproval": "anger", "disgust": "anger",
    "fear": "fear", "nervousness": "anxiety",
    "confusion": "confusion", "realization": "confusion", "surprise": "confusion",
    "caring": "calm", "neutral": "neutral",
}


def _build_topics(emotion: str, message: Optional[str]) -> tuple:
    """Dynamically COMPOSES search queries from the user's own extracted
    keywords plus a short mood descriptor — rather than picking a whole
    pre-written sentence from a bank of canned phrases. Two people who are
    both "stressed" but wrote different things will get genuinely
    different searches, because the query is actually built from what
    they typed, not selected off a shelf.
    """
    keywords = extract_keywords(message or "")
    descriptors = EMOTION_DESCRIPTORS.get(emotion, EMOTION_DESCRIPTORS["neutral"])
    descriptor = random.choice(descriptors)

    music_phrase = CONTENT_TEMPLATES["music"].format(descriptor=descriptor)
    video_phrase = CONTENT_TEMPLATES["video"].format(descriptor=descriptor)
    meditation_phrase = CONTENT_TEMPLATES["meditation"].format(descriptor=descriptor)
    podcast_phrase = CONTENT_TEMPLATES["podcast"].format(descriptor=descriptor)

    # Lead with the user's own words when there are any — that's the part
    # that actually makes the search specific to their situation.
    base_topic = music_phrase
    personalized_topic = f"{keywords} {music_phrase}" if keywords else music_phrase
    meditation_topic = f"{keywords} {meditation_phrase}" if keywords else meditation_phrase
    podcast_topic = f"{keywords} {podcast_phrase}" if keywords else podcast_phrase

    return base_topic, personalized_topic, video_phrase if not keywords else f"{keywords} {video_phrase}", meditation_topic, podcast_topic


def analyze_text(message: Optional[str]) -> AnalysisResult:
    text = (message or "").lower()
    scores = _score_keywords(text)

    best_emotion = max(scores, key=scores.get) if text else "neutral"
    if scores.get(best_emotion, 0) == 0:
        best_emotion = "neutral"

    base_topic, personalized_topic, video_topic, meditation_topic, podcast_topic = _build_topics(best_emotion, message)

    return AnalysisResult(
        emotion_key=best_emotion,
        display_label=DISPLAY_LABEL.get(best_emotion, "Calm"),
        ai_response=RESPONSES.get(best_emotion, RESPONSES["neutral"]),
        search_topic=base_topic,
        personalized_topic=personalized_topic,
        meditation_topic=meditation_topic,
        podcast_topic=podcast_topic,
        video_topic=video_topic,
    )


async def analyze_text_smart(message: Optional[str]) -> AnalysisResult:
    """Understands the user's message using Hugging Face's emotion
    classification model (SamLowe/roberta-base-go_emotions), which reads
    the actual tone and phrasing of what was typed rather than matching
    literal keywords.

    Hugging Face is the SOLE source of truth for emotion detection when a
    token is configured — its top-predicted label is used directly,
    without a local keyword system second-guessing it. Local keyword
    matching only takes over as a fallback if no HUGGINGFACE_API_TOKEN is
    set, or if the Hugging Face API call fails for any reason (network
    issue, rate limit, etc.) — this keeps the app functional even without
    the AI model configured, but never lets local keywords override a
    real answer from the model when one is available.
    """
    from app.services import groq_service, huggingface_service
    groq_result = await groq_service.interpret_checkin(message or "")

    if groq_result:
        best_emotion = groq_result["emotion_key"]
        search_topics = groq_result["search_topics"]
        return AnalysisResult(
            emotion_key=best_emotion,
            display_label=DISPLAY_LABEL.get(best_emotion, "Calm"),
            ai_response=groq_result["response"],
            search_topic=search_topics["music"],
            personalized_topic=search_topics["music"],
            meditation_topic=search_topics["meditation"],
            podcast_topic=search_topics["podcasts"],
            video_topic=search_topics["videos"],
            feeling=groq_result["feeling"],
            need=groq_result["need"],
            next_step=groq_result["next_step"],
            content_focus=groq_result["content_focus"],
        )

    hf_results = await huggingface_service.classify_emotion(message or "")

    if hf_results:
        top_label, _top_score = hf_results[0]
        best_emotion = GOEMOTIONS_TO_CATEGORY.get(top_label, "neutral")
    else:
        # No Hugging Face token configured, or the API call failed —
        # fall back to local keyword matching so the app still works.
        text = (message or "").lower()
        scores = _score_keywords(text)
        best_emotion = max(scores, key=scores.get) if text else "neutral"
        if scores.get(best_emotion, 0) == 0:
            best_emotion = "neutral"

    base_topic, personalized_topic, video_topic, meditation_topic, podcast_topic = _build_topics(best_emotion, message)

    return AnalysisResult(
        emotion_key=best_emotion,
        display_label=DISPLAY_LABEL.get(best_emotion, "Calm"),
        ai_response=RESPONSES.get(best_emotion, RESPONSES["neutral"]),
        search_topic=base_topic,
        personalized_topic=personalized_topic,
        meditation_topic=meditation_topic,
        podcast_topic=podcast_topic,
        video_topic=video_topic,
    )


def analyze_from_card(label: str) -> AnalysisResult:
    """When user picks an SVG emotion card directly instead of typing text.
    Still varies the search angle randomly each time, so clicking the same
    card repeatedly doesn't always search the exact same phrase.
    """
    reverse = {v.lower(): k for k, v in DISPLAY_LABEL.items()}
    key = reverse.get(label.lower(), "neutral")
    base_topic, personalized_topic, video_topic, meditation_topic, podcast_topic = _build_topics(key, None)

    return AnalysisResult(
        emotion_key=key,
        display_label=label,
        ai_response=RESPONSES.get(key, RESPONSES["neutral"]),
        search_topic=base_topic,
        personalized_topic=personalized_topic,
        meditation_topic=meditation_topic,
        podcast_topic=podcast_topic,
        video_topic=video_topic,
    )