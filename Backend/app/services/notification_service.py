"""Central transactional email and SMS delivery.

Providers are deliberately implemented with the standard library so the API can
start without an optional provider SDK.  Delivery is best-effort: callers get a
per-channel result and business workflows are never rolled back by a provider
outage.
"""
import asyncio
import base64
import html
import json
import logging
import re
import smtplib
from email.message import EmailMessage
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, html_content: str) -> None:
    """Send one HTML email through the configured SMTP relay."""
    if not settings.SMTP_HOST:
        raise RuntimeError("SMTP_HOST is not configured")
    sender = settings.SMTP_FROM_EMAIL or settings.SMTP_USER or settings.SMTP_USERNAME
    if not sender:
        raise RuntimeError("SMTP_FROM_EMAIL or SMTP_USER is not configured")
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"{settings.SMTP_FROM_NAME} <{sender}>"
    message["To"] = to_email
    message.set_content("This message is best viewed in an HTML-capable email client.")
    message.add_alternative(html_content, subtype="html")
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as client:
        if settings.SMTP_USE_TLS:
            client.starttls()
        username = settings.SMTP_USER or settings.SMTP_USERNAME
        if username:
            client.login(username, settings.SMTP_PASSWORD)
        client.send_message(message)


def _send_twilio(phone_number: str, message: str) -> None:
    sender = settings.TWILIO_PHONE_NUMBER or settings.TWILIO_FROM_NUMBER
    if not (settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and sender):
        raise RuntimeError("Twilio credentials are not configured")
    endpoint = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
    # The app stores Indian mobile identifiers as ten digits for Fast2SMS.
    # Twilio requires E.164, so normalize that local representation here.
    digits = re.sub(r"\D", "", phone_number)
    destination = f"+91{digits}" if not phone_number.startswith("+") and len(digits) == 10 else phone_number
    request = Request(endpoint, data=urlencode({"To": destination, "From": sender, "Body": message}).encode(), method="POST")
    token = base64.b64encode(f"{settings.TWILIO_ACCOUNT_SID}:{settings.TWILIO_AUTH_TOKEN}".encode()).decode()
    request.add_header("Authorization", f"Basic {token}")
    with urlopen(request, timeout=15) as response:
        if response.status >= 300:
            raise RuntimeError("Twilio rejected the message")


def _send_fast2sms(phone_number: str, message: str) -> None:
    if not settings.FAST2SMS_API_KEY:
        raise RuntimeError("No SMS provider is configured")
    body = {"route": "q", "message": message, "language": "english", "numbers": phone_number}
    if settings.FAST2SMS_SENDER_ID:
        body["sender_id"] = settings.FAST2SMS_SENDER_ID
    request = Request("https://www.fast2sms.com/dev/bulkV2", data=json.dumps(body).encode(), headers={"authorization": settings.FAST2SMS_API_KEY, "content-type": "application/json"}, method="POST")
    with urlopen(request, timeout=15) as response:
        if response.status >= 300:
            raise RuntimeError("Fast2SMS rejected the message")


def send_sms(phone_number: str, message: str) -> None:
    """Send via Twilio when configured, otherwise Fast2SMS."""
    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
        _send_twilio(phone_number, message)
    else:
        _send_fast2sms(phone_number, message)


def html_message(title: str, message: str) -> str:
    return f"<h2>{html.escape(title)}</h2><p>{html.escape(message).replace(chr(10), '<br>')}</p>"


async def dispatch_notification(
    db: AsyncIOMotorDatabase,
    recipient_id: ObjectId,
    subject: str,
    message: str,
    *,
    application_update: bool = False,
) -> dict:
    """Re-read recipient preferences from MongoDB immediately before sending."""
    recipient = await db["users"].find_one({"_id": recipient_id})
    results = {"email": "not_configured", "sms": "not_configured"}
    if not recipient:
        return {"email": "recipient_missing", "sms": "recipient_missing"}
    prefs = recipient.get("notification_preferences") or {}
    if application_update and not prefs.get("application_updates", True):
        return {"email": "disabled", "sms": "disabled"}
    if recipient.get("email") and prefs.get("email_notifications", True):
        if settings.SMTP_HOST and (settings.SMTP_FROM_EMAIL or settings.SMTP_USER or settings.SMTP_USERNAME):
            try:
                await asyncio.to_thread(send_email, recipient["email"], subject, html_message(subject, message))
                results["email"] = "sent"
            except Exception as exc:
                logger.warning("Email notification failed for user %s: %s", recipient_id, exc)
                results["email"] = "failed"
        else:
            results["email"] = "not_configured"
    elif not prefs.get("email_notifications", True):
        results["email"] = "disabled"
    else:
        results["email"] = "no_email"
    if recipient.get("phone") and prefs.get("sms_alerts", True):
        try:
            await asyncio.to_thread(send_sms, recipient["phone"], message)
            results["sms"] = "sent"
        except RuntimeError as exc:
            results["sms"] = "not_configured" if "configured" in str(exc) or "credentials" in str(exc) else "failed"
            if results["sms"] == "failed":
                logger.warning("SMS notification failed for user %s: %s", recipient_id, exc)
        except Exception as exc:
            logger.warning("SMS notification failed for user %s: %s", recipient_id, exc)
            results["sms"] = "failed"
    elif not prefs.get("sms_alerts", True):
        results["sms"] = "disabled"
    else:
        results["sms"] = "no_phone"
    return results
