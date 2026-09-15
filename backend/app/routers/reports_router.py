import datetime
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, auth
from app.services.report_service import generate_report_pdf

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/emotional-health")
def get_emotional_health_report(
    period: str = Query("weekly", pattern="^(weekly|monthly)$"),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    days = 7 if period == "weekly" else 30
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=days)

    entries = (
        db.query(models.EmotionEntry)
        .filter(
            models.EmotionEntry.user_id == current_user.id,
            models.EmotionEntry.created_at >= cutoff,
        )
        .order_by(models.EmotionEntry.created_at.desc())
        .all()
    )

    pdf_bytes = generate_report_pdf(current_user.name, period, entries)

    filename = f"encourage-me-{period}-report-{datetime.date.today().isoformat()}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
