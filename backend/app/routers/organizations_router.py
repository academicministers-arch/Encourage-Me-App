from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import auth, models, schemas
from app.database import get_db
from app.data.organizations import ORGANIZATIONS

router = APIRouter(prefix="/api/organizations", tags=["organizations"])


@router.get("")
def list_organizations(
    country: str = "",
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the list of mental health support organizations. Optional
    ?country= filter (e.g. "Uganda", "United States", "International").
    """
    organizations = db.query(models.SupportOrganization).order_by(models.SupportOrganization.created_at.desc()).all()
    dynamic = [schemas.SupportOrganizationOut.model_validate(org).model_dump() for org in organizations]
    combined = dynamic + [org for org in ORGANIZATIONS if not any(item["name"] == org["name"] for item in dynamic)]

    if not country:
        return combined
    return [org for org in combined if org["country"].lower() == country.lower()]