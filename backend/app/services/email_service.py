"""
Sends real emails via standard SMTP — works with Gmail (using an App
Password), Outlook, or any SMTP provider (SendGrid, Mailgun, etc.), since
it doesn't depend on any specific vendor's API.

If SMTP isn't configured (no SMTP_HOST/SMTP_USER/SMTP_PASSWORD in .env),
emails are printed to the console instead of sent — this means local
development and testing never breaks just because email isn't set up yet,
and you can see exactly what would have been sent.
"""

import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings


def _smtp_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)


def send_email(to_email: str, subject: str, html_body: str, text_body: str = "") -> bool:
    """Sends an email. Returns True if actually sent, False if it was only
    logged to console (SMTP not configured) — callers should NOT treat a
    False return as an error; the user-facing flow should behave the same
    either way (never reveal to the caller whether email delivery is live).
    """
    if not _smtp_configured():
        print("=" * 60)
        print("EMAIL NOT SENT — SMTP not configured in .env")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print("-" * 60)
        print(text_body or html_body)
        print("=" * 60)
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.FROM_EMAIL or settings.SMTP_USER
    msg["To"] = to_email

    if text_body:
        msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls(context=context)
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(msg["From"], to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        return False


def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    subject = "Reset your Encourage Me password"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0B1F3A;">Reset your password</h2>
      <p style="color: #1F2937;">We received a request to reset your Encourage Me password.
      This link is valid for 1 hour.</p>
      <p style="margin: 24px 0;">
        <a href="{reset_link}" style="background: #2E8B57; color: white; padding: 12px 24px;
           text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
      </p>
      <p style="color: #6B7280; font-size: 13px;">If you didn't request this, you can safely
      ignore this email — your password will not be changed.</p>
      <p style="color: #6B7280; font-size: 12px; margin-top: 32px;">Built and Powered by Emtrixz Technology</p>
    </div>
    """
    text = f"Reset your Encourage Me password: {reset_link}\n\nThis link is valid for 1 hour. If you didn't request this, ignore this email."
    return send_email(to_email, subject, html, text)