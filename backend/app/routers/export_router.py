"""
Lets a user download all of their own data — check-ins, journal entries,
and favorites — as CSV or JSON. Basic data portability/ownership, no
external dependencies required.
"""

import csv
import io
import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, auth

router = APIRouter(prefix="/api/export", tags=["export"])


def _gather_user_data(user_id: int, db: Session) -> dict:
    entries = (
        db.query(models.EmotionEntry)
        .filter(models.EmotionEntry.user_id == user_id)
        .order_by(models.EmotionEntry.created_at.asc())
        .all()
    )
    journal = (
        db.query(models.JournalEntry)
        .filter(models.JournalEntry.user_id == user_id)
        .order_by(models.JournalEntry.created_at.asc())
        .all()
    )
    favorites = (
        db.query(models.Favorite)
        .filter(models.Favorite.user_id == user_id)
        .order_by(models.Favorite.created_at.asc())
        .all()
    )

    return {
        "checkins": [
            {
                "date": e.created_at.isoformat(),
                "emotion": e.emotion,
                "message": e.message or "",
                "ai_response": e.ai_response or "",
            }
            for e in entries
        ],
        "journal": [
            {
                "date": j.created_at.isoformat(),
                "type": j.entry_type,
                "content": j.content,
            }
            for j in journal
        ],
        "favorites": [
            {
                "date": f.created_at.isoformat(),
                "type": f.content_type,
                "title": f.title or "",
                "channel": f.channel or "",
            }
            for f in favorites
        ],
    }


@router.get("/json")
def export_json(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    data = _gather_user_data(current_user.id, db)
    data["exported_for"] = current_user.email
    buffer = io.StringIO(json.dumps(data, indent=2))
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=encourage-me-data.json"},
    )


@router.get("/csv")
def export_csv(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    data = _gather_user_data(current_user.id, db)
    buffer = io.StringIO()

    buffer.write("=== CHECK-INS ===\n")
    writer = csv.writer(buffer)
    writer.writerow(["date", "emotion", "message", "ai_response"])
    for row in data["checkins"]:
        writer.writerow([row["date"], row["emotion"], row["message"], row["ai_response"]])

    buffer.write("\n=== JOURNAL ===\n")
    writer.writerow(["date", "type", "content"])
    for row in data["journal"]:
        writer.writerow([row["date"], row["type"], row["content"]])

    buffer.write("\n=== FAVORITES ===\n")
    writer.writerow(["date", "type", "title", "channel"])
    for row in data["favorites"]:
        writer.writerow([row["date"], row["type"], row["title"], row["channel"]])

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=encourage-me-data.csv"},
    )
