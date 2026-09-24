"""
Admin-only endpoints: managing the consultant directory, and viewing
payment history. Every endpoint here requires auth.get_current_admin,
which returns 403 for any non-admin user.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _to_consultant_out(consultant: models.Consultant) -> schemas.ConsultantOut:
    out = schemas.ConsultantOut.model_validate(consultant)
    out.can_chat = bool(consultant.password_hash)
    return out


@router.get("/consultants", response_model=list[schemas.ConsultantOut])
def list_all_consultants(
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db),
):
    """Unlike the public endpoint, this returns ALL consultants (including
    inactive ones) with full details, regardless of the admin's own
    purchase history — admins manage the directory, they don't need to
    "unlock" it.
    """
    consultants = db.query(models.Consultant).order_by(models.Consultant.created_at.desc()).all()
    return [_to_consultant_out(c) for c in consultants]


@router.post("/consultants", response_model=schemas.ConsultantOut, status_code=201)
def create_consultant(
    payload: schemas.ConsultantCreate,
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db),
):
    data = payload.model_dump()
    password = data.pop("password", None)
    consultant = models.Consultant(**data)
    if password:
        consultant.password_hash = auth.hash_password(password)
    db.add(consultant)
    db.commit()
    db.refresh(consultant)
    return _to_consultant_out(consultant)


@router.put("/consultants/{consultant_id}", response_model=schemas.ConsultantOut)
def update_consultant(
    consultant_id: int,
    payload: schemas.ConsultantUpdate,
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db),
):
    consultant = db.query(models.Consultant).filter(models.Consultant.id == consultant_id).first()
    if not consultant:
        raise HTTPException(status_code=404, detail="Consultant not found.")

    data = payload.model_dump(exclude_unset=True)
    password = data.pop("password", None)
    for field, value in data.items():
        setattr(consultant, field, value)
    if password:
        consultant.password_hash = auth.hash_password(password)

    db.commit()
    db.refresh(consultant)
    return _to_consultant_out(consultant)


@router.delete("/consultants/{consultant_id}")
def delete_consultant(
    consultant_id: int,
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db),
):
    consultant = db.query(models.Consultant).filter(models.Consultant.id == consultant_id).first()
    if not consultant:
        raise HTTPException(status_code=404, detail="Consultant not found.")
    db.delete(consultant)
    db.commit()
    return {"message": "Consultant removed."}


@router.get("/organizations", response_model=list[schemas.SupportOrganizationOut])
def list_all_organizations(
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db),
):
    return db.query(models.SupportOrganization).order_by(models.SupportOrganization.created_at.desc()).all()


@router.post("/organizations", response_model=schemas.SupportOrganizationOut, status_code=201)
def create_organization(
    payload: schemas.SupportOrganizationCreate,
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db),
):
    organization = models.SupportOrganization(**payload.model_dump())
    db.add(organization)
    db.commit()
    db.refresh(organization)
    return organization


@router.put("/organizations/{organization_id}", response_model=schemas.SupportOrganizationOut)
def update_organization(
    organization_id: int,
    payload: schemas.SupportOrganizationUpdate,
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db),
):
    organization = db.query(models.SupportOrganization).filter(models.SupportOrganization.id == organization_id).first()
    if not organization:
        raise HTTPException(status_code=404, detail="Support organization not found.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(organization, field, value)

    db.commit()
    db.refresh(organization)
    return organization


@router.delete("/organizations/{organization_id}")
def delete_organization(
    organization_id: int,
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db),
):
    organization = db.query(models.SupportOrganization).filter(models.SupportOrganization.id == organization_id).first()
    if not organization:
        raise HTTPException(status_code=404, detail="Support organization not found.")
    db.delete(organization)
    db.commit()
    return {"message": "Support organization removed."}


@router.get("/purchases", response_model=list[schemas.PurchaseHistoryOut])
def list_purchases(
    current_admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db),
):
    """Shows all consultation plan purchases, most recent first — lets an
    admin see who has paid for what without needing direct database access.
    """
    purchases = (
        db.query(models.ConsultationPurchase)
        .order_by(models.ConsultationPurchase.created_at.desc())
        .limit(200)
        .all()
    )
    results = []
    for p in purchases:
        user = db.query(models.User).filter(models.User.id == p.user_id).first()
        results.append(schemas.PurchaseHistoryOut(
            id=p.id, plan_tier=p.plan_tier, amount=p.amount, currency=p.currency,
            status=p.status, created_at=p.created_at, verified_at=p.verified_at,
            user_name=user.name if user else None,
            user_email=user.email if user else None,
        ))
    return results
