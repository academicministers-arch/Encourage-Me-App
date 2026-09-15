import random
from fastapi import APIRouter, Depends, Query

from app import models, auth
from app.services import dailymotion_service, listennotes_service, youtube_service

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.get("/music")
async def get_music(topic: str = "encouraging motivational music", current_user: models.User = Depends(auth.get_current_user)):
    return await youtube_service.search_youtube(topic, 500)


@router.get("/videos")
async def get_videos(category: str = "motivation", current_user: models.User = Depends(auth.get_current_user)):
    topics = {
        "motivation": "daily motivation speech",
        "success": "success story motivational",
        "growth": "personal growth self improvement",
        "resilience": "mental resilience talk",
        "confidence": "confidence building video",
    }
    return await dailymotion_service.search_videos(topics.get(category, category), 30)


@router.get("/meditation")
async def get_meditation(category: str = "guided meditation", current_user: models.User = Depends(auth.get_current_user)):
    topics = {
        "guided": "guided meditation",
        "breathing": "deep breathing exercise",
        "mindfulness": "mindfulness practice",
        "sleep": "sleep relaxation meditation",
    }
    return await youtube_service.search_youtube(topics.get(category, category), 1000, category="meditation")


@router.get("/podcasts")
async def get_podcasts(topic: str = "personal stories overcoming difficult times podcast", current_user: models.User = Depends(auth.get_current_user)):
    return await listennotes_service.search_podcasts(topic, 30)


@router.get("/quotes")
def get_quotes(current_user: models.User = Depends(auth.get_current_user)):
    return {"quotes": youtube_service.QUOTES}


@router.get("/affirmations")
def get_affirmations(current_user: models.User = Depends(auth.get_current_user)):
    return {"affirmations": youtube_service.AFFIRMATIONS}


@router.get("/quote-categories")
def get_quote_categories(current_user: models.User = Depends(auth.get_current_user)):
    return {"quote_categories": youtube_service.QUOTE_CATEGORIES}


@router.get("/growth-reminders")
def get_growth_reminders(current_user: models.User = Depends(auth.get_current_user)):
    return {"growth_reminders": youtube_service.GROWTH_REMINDERS}


@router.get("/daily")
def get_daily(current_user: models.User = Depends(auth.get_current_user)):
    return {
        "quote": random.choice(youtube_service.QUOTES),
        "affirmation": random.choice(youtube_service.AFFIRMATIONS),
    }
