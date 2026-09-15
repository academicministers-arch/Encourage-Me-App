import datetime
import calendar
from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth
from app.services.streak_service import compute_streaks

router = APIRouter(prefix="/api/journey", tags=["journey"])

POSITIVE_LABELS = {"happy", "motivated", "excited", "calm"}


def _months_ago(d: datetime.date, months: int) -> datetime.date:
    """Subtracts calendar months from a date, clamping the day if the
    target month is shorter (e.g. Mar 31 minus 1 month -> Feb 28/29)."""
    month = d.month - months
    year = d.year
    while month <= 0:
        month += 12
        year -= 1
    last_day = calendar.monthrange(year, month)[1]
    day = min(d.day, last_day)
    return datetime.date(year, month, day)


@router.get("/correlations")
def get_correlations(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Surfaces simple, genuinely data-backed patterns: which day of the
    week tends to be hardest/easiest, and whether journaling correlates
    with more positive check-ins. Only returns an insight when there's
    enough data to say something meaningful — no invented patterns from
    a handful of check-ins.
    """
    entries = (
        db.query(models.EmotionEntry)
        .filter(models.EmotionEntry.user_id == current_user.id)
        .all()
    )
    insights = []

    if len(entries) >= 5:
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        by_day = {d: [] for d in day_names}
        for e in entries:
            by_day[day_names[e.created_at.weekday()]].append(e.emotion.lower() in POSITIVE_LABELS)

        day_stats = {
            d: (sum(vals) / len(vals), len(vals))
            for d, vals in by_day.items() if len(vals) >= 2
        }
        if day_stats:
            hardest_day = min(day_stats, key=lambda d: day_stats[d][0])
            easiest_day = max(day_stats, key=lambda d: day_stats[d][0])
            if day_stats[hardest_day][0] < 0.4:
                insights.append({
                    "type": "day_pattern",
                    "text": f"You tend to have a harder time on {hardest_day}s — worth planning something gentle for yourself that day.",
                })
            if day_stats[easiest_day][0] > 0.6 and easiest_day != hardest_day:
                insights.append({
                    "type": "day_pattern",
                    "text": f"{easiest_day}s tend to be your best days — notice what's different about them.",
                })

    # Journaling correlation: compare positive-emotion rate on days with a
    # journal entry vs days without, among days that have at least one check-in.
    journal_entries = (
        db.query(models.JournalEntry)
        .filter(models.JournalEntry.user_id == current_user.id)
        .all()
    )
    if len(entries) >= 5 and journal_entries:
        journaled_dates = {j.created_at.date() for j in journal_entries}
        with_journal = [e for e in entries if e.created_at.date() in journaled_dates]
        without_journal = [e for e in entries if e.created_at.date() not in journaled_dates]
        if len(with_journal) >= 2 and len(without_journal) >= 2:
            pos_with = sum(1 for e in with_journal if e.emotion.lower() in POSITIVE_LABELS) / len(with_journal)
            pos_without = sum(1 for e in without_journal if e.emotion.lower() in POSITIVE_LABELS) / len(without_journal)
            if pos_with - pos_without >= 0.15:
                insights.append({
                    "type": "journaling",
                    "text": "Your mood tends to be more positive on days you journal — it might be worth making it a regular habit.",
                })

    return {"insights": insights, "has_enough_data": len(entries) >= 5}


@router.get("/on-this-day")
def get_on_this_day(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Surfaces a check-in from exactly a week ago, a month ago, and a year
    ago (whichever exist) — a small nudge showing how far you've come.
    """
    today = datetime.datetime.utcnow().date()
    periods = [
        ("1 week ago", today - datetime.timedelta(days=7)),
        ("1 month ago", _months_ago(today, 1)),
        ("1 year ago", _months_ago(today, 12)),
    ]

    results = []
    for label, target_date in periods:
        start = datetime.datetime.combine(target_date, datetime.time.min)
        end = start + datetime.timedelta(days=1)
        matches = (
            db.query(models.EmotionEntry)
            .filter(
                models.EmotionEntry.user_id == current_user.id,
                models.EmotionEntry.created_at >= start,
                models.EmotionEntry.created_at < end,
            )
            .order_by(models.EmotionEntry.created_at.desc())
            .all()
        )
        # Prefer an entry that has a written message over a card-only
        # check-in, since it makes for a more meaningful reflection.
        entry = next((e for e in matches if e.message), matches[0] if matches else None)
        if entry:
            results.append({
                "label": label,
                "emotion": entry.emotion,
                "message": entry.message,
                "ai_response": entry.ai_response,
                "created_at": entry.created_at.isoformat(),
            })

    return results


@router.get("/today-mood")
def get_today_mood(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the dominant emotion from today's check-ins, if any — used
    to gently tint the dashboard background to match the day's overall mood.
    """
    today = datetime.datetime.utcnow().date()
    tomorrow = today + datetime.timedelta(days=1)
    entries = (
        db.query(models.EmotionEntry)
        .filter(
            models.EmotionEntry.user_id == current_user.id,
            models.EmotionEntry.created_at >= today,
            models.EmotionEntry.created_at < tomorrow,
        )
        .all()
    )
    if not entries:
        return {"emotion": None}
    dominant = Counter(e.emotion for e in entries).most_common(1)[0][0]
    return {"emotion": dominant}


@router.get("/stats", response_model=schemas.StatsOut)
def get_stats(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    entries = (
        db.query(models.EmotionEntry)
        .filter(models.EmotionEntry.user_id == current_user.id)
        .order_by(models.EmotionEntry.created_at.desc())
        .all()
    )
    journal_count = (
        db.query(models.JournalEntry).filter(models.JournalEntry.user_id == current_user.id).count()
    )
    favorites_count = (
        db.query(models.Favorite).filter(models.Favorite.user_id == current_user.id).count()
    )

    total = len(entries)
    most_common = None
    if entries:
        counts = Counter(e.emotion for e in entries)
        most_common = counts.most_common(1)[0][0]

    # streak calculation: consecutive days (by date) with at least one check-in,
    # counting backwards from today.
    current_streak, longest_streak = compute_streaks(e.created_at.date() for e in entries)

    return schemas.StatsOut(
        total_checkins=total,
        current_streak=current_streak,
        longest_streak=longest_streak,
        most_common_emotion=most_common,
        total_journal_entries=journal_count,
        resources_viewed=favorites_count,
    )


@router.get("/timeline", response_model=list[schemas.CheckinOut])
def get_timeline(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.EmotionEntry)
        .filter(models.EmotionEntry.user_id == current_user.id)
        .order_by(models.EmotionEntry.created_at.asc())
        .all()
    )


@router.get("/analytics")
def get_analytics(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    entries = (
        db.query(models.EmotionEntry)
        .filter(models.EmotionEntry.user_id == current_user.id)
        .order_by(models.EmotionEntry.created_at.asc())
        .all()
    )

    emotion_counts = Counter(e.emotion for e in entries)

    # weekly summary: last 7 days, count of checkins per day
    today = datetime.datetime.utcnow().date()
    last_7_days = [today - datetime.timedelta(days=i) for i in range(6, -1, -1)]
    daily_counts = {d.isoformat(): 0 for d in last_7_days}
    daily_positive = {d.isoformat(): 0 for d in last_7_days}
    for e in entries:
        d = e.created_at.date()
        if d.isoformat() in daily_counts:
            daily_counts[d.isoformat()] += 1
            if e.emotion.lower() in POSITIVE_LABELS:
                daily_positive[d.isoformat()] += 1

    weekly_trend = [
        {"date": d, "checkins": daily_counts[d], "positive": daily_positive[d]}
        for d in daily_counts
    ]

    # monthly summary: last 30 days grouped by week
    monthly_emotion_counts = Counter(
        e.emotion for e in entries
        if e.created_at.date() >= today - datetime.timedelta(days=30)
    )

    return {
        "emotion_breakdown": [{"emotion": k, "count": v} for k, v in emotion_counts.most_common()],
        "weekly_trend": weekly_trend,
        "monthly_emotion_breakdown": [{"emotion": k, "count": v} for k, v in monthly_emotion_counts.most_common()],
    }
