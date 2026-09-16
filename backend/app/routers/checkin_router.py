from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
import random

from app.database import get_db
from app import models, schemas, auth
from app.services import dailymotion_service, emotion_analysis, listennotes_service, youtube_service, crisis_detection, quotes_service
from app.services.streak_service import compute_streaks
from app.rate_limit import limiter

router = APIRouter(prefix="/api/checkin", tags=["checkin"])


@router.post("", response_model=schemas.CheckinResponse)
@limiter.limit("20/minute")
async def create_checkin(
    request: Request,
    payload: schemas.CheckinCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if payload.message and payload.message.strip():
        result = await emotion_analysis.analyze_text_smart(payload.message)
    elif payload.emotion:
        result = emotion_analysis.analyze_from_card(payload.emotion)
    else:
        result = await emotion_analysis.analyze_text_smart(None)

    entry = models.EmotionEntry(
        user_id=current_user.id,
        emotion=result.display_label,
        message=payload.message,
        ai_response=result.ai_response,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    music_topic = result.personalized_topic
    video_topic = result.video_topic or result.personalized_topic
    meditation_topic = result.meditation_topic
    podcast_topic = result.podcast_topic

    # The user's own words are passed alongside each derived topic so every
    # provider can rerank its results by semantic fit to what they actually
    # wrote (see relevance_service), not just the topic keywords used to
    # search. Falls back to unranked provider order if no message was given
    # or embeddings aren't available.
    relevance_query = payload.message if payload.message and payload.message.strip() else None

    music = await youtube_service.search_youtube(music_topic, 6, category="music", relevance_query=relevance_query)
    videos = await youtube_service.search_youtube(video_topic, 6, category="motivation", relevance_query=relevance_query)
    meditation = await youtube_service.search_youtube(meditation_topic, 6, category="meditation", relevance_query=relevance_query)

    # Podcasts now pull from two providers and are combined: Listen Notes
    # for actual podcast episodes, Dailymotion for podcast-style talk/story
    # video content. Each provider still reranks its own half by relevance
    # to the user's message before the two halves are combined.
    podcast_videos = await dailymotion_service.search_videos(podcast_topic, 3, relevance_query=relevance_query)
    podcast_episodes = await listennotes_service.search_podcasts(podcast_topic, 3, relevance_query=relevance_query)
    podcasts = podcast_episodes + podcast_videos

    quotes = await quotes_service.get_quotes(6)

    recommendations = {
        "music": music,
        "videos": videos,
        "meditation": meditation,
        "podcasts": podcasts,
        "quotes": quotes,
        "affirmation": random.choice(youtube_service.AFFIRMATIONS),
        # Topics are echoed back so the frontend's "Load more" buttons can
        # request additional results for the same category/topic without
        # the client needing to reconstruct the search query itself.
        "topics": {
            "music": music_topic,
            "videos": video_topic,
            "meditation": meditation_topic,
            "podcasts": podcast_topic,
        },
    }

    crisis_support = None
    if payload.message and crisis_detection.detect_crisis(payload.message):
        crisis_support = crisis_detection.CRISIS_RESOURCES

    all_dates = (
        db.query(models.EmotionEntry.created_at)
        .filter(models.EmotionEntry.user_id == current_user.id)
        .all()
    )
    current_streak, _ = compute_streaks(d.date() for (d,) in all_dates)

    return schemas.CheckinResponse(
        entry=schemas.CheckinOut.model_validate(entry),
        recommendations=recommendations,
        analysis={
            "feeling": result.feeling or result.display_label,
            "need": result.need or "support and a little patience",
            "next_step": result.next_step or "Take one small, kind step for yourself today.",
            "content_focus": result.content_focus or result.search_topic,
        },
        crisis_support=crisis_support,
        current_streak=current_streak,
    )


@router.get("/history", response_model=list[schemas.CheckinOut])
def get_history(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
    limit: int = 100,
):
    entries = (
        db.query(models.EmotionEntry)
        .filter(models.EmotionEntry.user_id == current_user.id)
        .order_by(models.EmotionEntry.created_at.desc())
        .limit(limit)
        .all()
    )
    return entries


@router.get("/more-recommendations")
@limiter.limit("30/minute")
async def more_recommendations(
    request: Request,
    category: str,
    topic: str = "",
    exclude: str = "",
    count: int = 6,
    current_user: models.User = Depends(auth.get_current_user),
):
    """Loads additional content for a single category (music, motivation,
    meditation, or quotes), powering each category's "Load more" button.
    Never returns an item already shown (via `exclude`), and the frontend
    caps total items per category at 30.
    """
    exclude_ids = {v for v in exclude.split(",") if v}
    count = max(1, min(count, 12))

    if category == "quotes":
        items = await quotes_service.get_quotes(count, exclude_ids=exclude_ids)
        has_more = len(items) >= count
        return {"items": items, "has_more": has_more}

    if category not in ("music", "motivation", "meditation", "podcasts"):
        return {"items": [], "has_more": False}

    if category == "podcasts":
        half = max(1, count // 2)
        podcast_videos = await dailymotion_service.search_videos(topic, half, exclude_ids=exclude_ids)
        podcast_episodes = await listennotes_service.search_podcasts(topic, count - half, exclude_ids=exclude_ids)
        items = podcast_episodes + podcast_videos
    else:
        # "motivation" and "meditation" both draw from YouTube's curated
        # categories; "music" too.
        items = await youtube_service.search_youtube(topic, count, category=category, exclude_ids=exclude_ids)

    # has_more is a best-effort signal: if we got a full batch back, more
    # is probably available; if we got fewer than requested, the pool
    # (live search + curated fallback) is likely exhausted.
    has_more = len(items) >= count

    return {"items": items, "has_more": has_more}
