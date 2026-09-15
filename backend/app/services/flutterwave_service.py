"""
Flutterwave payment integration for paid consultation access.

Uses Flutterwave's Standard flow (Hosted Payment Page): we ask Flutterwave
for a payment link, redirect the user there, and they enter their MTN or
Airtel Mobile Money PIN on Flutterwave's own secure page — it never
touches our server. After payment, Flutterwave redirects back to us, and
we independently re-verify the transaction server-side before granting
any access. The redirect alone is NEVER trusted on its own, since URL
query parameters can be tampered with by the user.

Requires FLUTTERWAVE_SECRET_KEY in .env. Get one at
https://dashboard.flutterwave.com/settings/apis — use a TEST key while
developing (test payments, no real money moves), and only switch to a
LIVE key once Flutterwave has completed your business verification.
"""

import httpx
from app.config import settings

FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3"


class FlutterwaveError(Exception):
    pass


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.FLUTTERWAVE_SECRET_KEY}",
        "Content-Type": "application/json",
    }


async def initiate_payment(
    tx_ref: str,
    amount: int,
    currency: str,
    customer_email: str,
    customer_name: str,
    redirect_url: str,
    plan_tier: str,
) -> str:
    """Creates a Flutterwave hosted payment session and returns the URL to
    redirect the user's browser to. Raises FlutterwaveError if the
    Flutterwave API call itself fails (e.g. bad credentials, network issue)
    — callers should surface this as a clear error, not a silent failure,
    since this is a payment flow.
    """
    if not settings.FLUTTERWAVE_SECRET_KEY:
        raise FlutterwaveError(
            "Payments aren't configured yet on this server. Add FLUTTERWAVE_SECRET_KEY to backend/.env."
        )

    payload = {
        "tx_ref": tx_ref,
        "amount": str(amount),
        "currency": currency,
        "redirect_url": redirect_url,
        "payment_options": "mobilemoneyuganda,card",
        "customer": {
            "email": customer_email,
            "name": customer_name,
        },
        "customizations": {
            "title": "Encourage Me — Consultation Access",
            "description": f"{plan_tier.capitalize()} Plan — Direct Consultation Access",
        },
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(f"{FLUTTERWAVE_BASE_URL}/payments", json=payload, headers=_headers())
            data = resp.json()
    except Exception as e:
        raise FlutterwaveError(f"Could not reach Flutterwave: {e}")

    if data.get("status") != "success" or not data.get("data", {}).get("link"):
        raise FlutterwaveError(data.get("message", "Flutterwave did not return a payment link."))

    return data["data"]["link"]


async def verify_transaction(transaction_id: str) -> dict:
    """Independently re-verifies a transaction with Flutterwave using the
    secret key — this is the only source of truth for whether a payment
    actually succeeded. Returns the transaction data dict on success.
    Raises FlutterwaveError if verification fails or the transaction
    wasn't successful.
    """
    if not settings.FLUTTERWAVE_SECRET_KEY:
        raise FlutterwaveError("Payments aren't configured yet on this server.")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{FLUTTERWAVE_BASE_URL}/transactions/{transaction_id}/verify",
                headers=_headers(),
            )
            data = resp.json()
    except Exception as e:
        raise FlutterwaveError(f"Could not reach Flutterwave to verify payment: {e}")

    if data.get("status") != "success":
        raise FlutterwaveError(data.get("message", "Could not verify this transaction."))

    tx_data = data.get("data", {})
    if tx_data.get("status") != "successful":
        raise FlutterwaveError(f"Transaction was not successful (status: {tx_data.get('status')}).")

    return tx_data
