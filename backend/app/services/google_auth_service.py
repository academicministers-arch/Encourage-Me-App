"""
Verifies Google Sign-In ID tokens sent from the frontend. Uses Google's
own auth library, which checks the token's signature against Google's
public keys and confirms it was issued for this app's specific client ID
— so a token can't be forged or reused across apps.
"""

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.config import settings


class GoogleAuthError(Exception):
    pass


def verify_google_token(credential: str) -> dict:
    """Returns {"email": ..., "name": ..., "google_id": ...} if valid.
    Raises GoogleAuthError if the token is invalid, expired, or wasn't
    issued for this app.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise GoogleAuthError(
            "Google sign-in isn't configured on this server. Set GOOGLE_CLIENT_ID in .env."
        )

    try:
        idinfo = id_token.verify_oauth2_token(
            credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except ValueError as e:
        raise GoogleAuthError(f"Invalid Google token: {e}")

    if idinfo.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        raise GoogleAuthError("Invalid token issuer.")

    if not idinfo.get("email_verified", False):
        raise GoogleAuthError("Google account email is not verified.")

    return {
        "email": idinfo["email"],
        "name": idinfo.get("name") or idinfo["email"].split("@")[0],
        "google_id": idinfo["sub"],
    }