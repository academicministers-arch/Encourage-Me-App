"""
User-facing endpoints for browsing consultants and paying for tier
access. Admin management of consultants lives in admin_router.py instead.

Pricing is defined here, server-side, and is NEVER taken from the client
— this prevents someone from tampering with the amount in a request to
pay less than the real price.
"""

import uuid
import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth
from app.rate_limit import limiter
from app.services import flutterwave_service
from app.config import settings

router = APIRouter(prefix="/api/consultants", tags=["consultants"])

PLAN_PRICING = {"basic": 50000, "premium": 100000}  # UGX


def _to_consultant_out(consultant: models.Consultant) -> schemas.ConsultantOut:
    out = schemas.ConsultantOut.model_validate(consultant)
    out.can_chat = bool(consultant.password_hash)
    return out


def _get_access(user_id: int, db: Session) -> schemas.AccessStatusOut:
    successful = (
        db.query(models.ConsultationPurchase)
        .filter(
            models.ConsultationPurchase.user_id == user_id,
            models.ConsultationPurchase.status == "successful",
        )
        .all()
    )
    tiers = {p.plan_tier for p in successful}
    has_premium = "premium" in tiers
    # Premium includes basic-tier access too, standard tiering.
    has_basic = "basic" in tiers or has_premium
    return schemas.AccessStatusOut(has_basic=has_basic, has_premium=has_premium)


def user_has_access_to_consultant(user_id: int, consultant: "models.Consultant", db: Session) -> bool:
    """Used by the chat endpoints to confirm a user is actually allowed to
    message a given consultant — i.e. they've paid for that consultant's
    tier (or a higher one). Never trust the frontend's own locked/unlocked
    display state for this; always re-check server-side.
    """
    access = _get_access(user_id, db)
    if consultant.plan_tier == "premium":
        return access.has_premium
    return access.has_basic


@router.get("/access", response_model=schemas.AccessStatusOut)
def get_access(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return _get_access(current_user.id, db)


@router.get("", response_model=list[schemas.TierGroupOut])
def list_consultants(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Returns consultants grouped by tier. Locked tiers show only a count
    and the price to unlock — not the consultants' details — until the
    user has a successful purchase for that tier.
    """
    access = _get_access(current_user.id, db)
    groups = []

    for tier, unlocked in [("basic", access.has_basic), ("premium", access.has_premium)]:
        consultants = (
            db.query(models.Consultant)
            .filter(models.Consultant.plan_tier == tier, models.Consultant.is_active == True)  # noqa: E712
            .order_by(models.Consultant.created_at.desc())
            .all()
        )
        if unlocked:
            groups.append(schemas.TierGroupOut(
                tier=tier, locked=False, price=None,
                count=len(consultants),
                consultants=[_to_consultant_out(c) for c in consultants],
            ))
        else:
            groups.append(schemas.TierGroupOut(
                tier=tier, locked=True, price=PLAN_PRICING[tier],
                count=len(consultants), consultants=[],
            ))

    return groups


@router.post("/purchase", response_model=schemas.PurchaseInitiateOut)
@limiter.limit("10/minute")
async def initiate_purchase(
    request: Request,
    payload: schemas.PurchaseInitiate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    amount = PLAN_PRICING[payload.plan_tier]
    tx_ref = f"em-{payload.plan_tier}-{current_user.id}-{uuid.uuid4().hex[:10]}"

    purchase = models.ConsultationPurchase(
        user_id=current_user.id,
        plan_tier=payload.plan_tier,
        amount=amount,
        currency="UGX",
        tx_ref=tx_ref,
        status="pending",
    )
    db.add(purchase)
    db.commit()

    redirect_url = f"{settings.FRONTEND_ORIGIN}/consultation/callback"

    try:
        link = await flutterwave_service.initiate_payment(
            tx_ref=tx_ref,
            amount=amount,
            currency="UGX",
            customer_email=current_user.email,
            customer_name=current_user.name,
            redirect_url=redirect_url,
            plan_tier=payload.plan_tier,
        )
    except flutterwave_service.FlutterwaveError as e:
        purchase.status = "failed"
        db.commit()
        raise HTTPException(status_code=502, detail=str(e))

    return schemas.PurchaseInitiateOut(payment_link=link, tx_ref=tx_ref)


@router.get("/verify", response_model=schemas.PurchaseVerifyOut)
async def verify_purchase(
    tx_ref: str,
    transaction_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Called by the frontend after Flutterwave redirects the user back.
    Independently re-verifies the transaction with Flutterwave before
    trusting it — the redirect URL's own query params are never trusted
    on their own, since they could be tampered with by the user.
    """
    purchase = (
        db.query(models.ConsultationPurchase)
        .filter(
            models.ConsultationPurchase.tx_ref == tx_ref,
            models.ConsultationPurchase.user_id == current_user.id,
        )
        .first()
    )
    if not purchase:
        raise HTTPException(status_code=404, detail="No matching purchase found.")

    if purchase.status == "successful":
        # Already verified (e.g. webhook beat the redirect, or user
        # refreshed this page) — just report current access.
        return schemas.PurchaseVerifyOut(
            status="successful", plan_tier=purchase.plan_tier,
            access=_get_access(current_user.id, db),
        )

    try:
        tx_data = await flutterwave_service.verify_transaction(transaction_id)
    except flutterwave_service.FlutterwaveError as e:
        purchase.status = "failed"
        db.commit()
        raise HTTPException(status_code=402, detail=str(e))

    # Confirm the verified transaction actually matches what we expect —
    # right amount, right currency, right reference. This is what stops
    # someone from paying for a cheaper item and claiming premium access.
    if (
        tx_data.get("tx_ref") != purchase.tx_ref
        or int(tx_data.get("amount", 0)) < purchase.amount
        or tx_data.get("currency") != purchase.currency
    ):
        purchase.status = "failed"
        db.commit()
        raise HTTPException(status_code=402, detail="Payment details did not match the expected purchase.")

    purchase.status = "successful"
    purchase.flutterwave_transaction_id = str(transaction_id)
    purchase.verified_at = datetime.datetime.utcnow()
    db.commit()

    return schemas.PurchaseVerifyOut(
        status="successful", plan_tier=purchase.plan_tier,
        access=_get_access(current_user.id, db),
    )
