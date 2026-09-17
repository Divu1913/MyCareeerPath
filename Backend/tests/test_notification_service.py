from bson import ObjectId
import pytest

from app.services import notification_service


def test_send_email_uses_configured_smtp(monkeypatch):
    sent = {}

    class FakeSMTP:
        def __init__(self, host, port, timeout):
            sent.update(host=host, port=port, timeout=timeout)
        def __enter__(self): return self
        def __exit__(self, *_): pass
        def starttls(self): sent["tls"] = True
        def login(self, user, password): sent.update(user=user, password=password)
        def send_message(self, message): sent["message"] = message

    monkeypatch.setattr(notification_service.smtplib, "SMTP", FakeSMTP)
    monkeypatch.setattr(notification_service.settings, "SMTP_HOST", "smtp.example.test")
    monkeypatch.setattr(notification_service.settings, "SMTP_PORT", 587)
    monkeypatch.setattr(notification_service.settings, "SMTP_USER", "mailer@example.test")
    monkeypatch.setattr(notification_service.settings, "SMTP_PASSWORD", "secret")
    monkeypatch.setattr(notification_service.settings, "SMTP_FROM_EMAIL", "")
    notification_service.send_email("candidate@example.test", "Welcome", "<p>Hello</p>")
    assert sent["host"] == "smtp.example.test"
    assert sent["tls"] is True
    assert sent["message"]["To"] == "candidate@example.test"
    assert sent["message"].get_body(preferencelist=("html",)).get_content().strip() == "<p>Hello</p>"


@pytest.mark.asyncio
async def test_dispatch_rechecks_preferences_before_delivery(monkeypatch):
    recipient_id = ObjectId()

    class Users:
        async def find_one(self, query):
            assert query == {"_id": recipient_id}
            return {"_id": recipient_id, "email": "candidate@example.test", "phone": "9876543210",
                    "notification_preferences": {"email_notifications": False, "sms_alerts": False}}
    class Database:
        def __getitem__(self, name):
            assert name == "users"
            return Users()

    monkeypatch.setattr(notification_service, "send_email", lambda *_: (_ for _ in ()).throw(AssertionError()))
    monkeypatch.setattr(notification_service, "send_sms", lambda *_: (_ for _ in ()).throw(AssertionError()))
    delivery = await notification_service.dispatch_notification(Database(), recipient_id, "Subject", "Message")
    assert delivery == {"email": "disabled", "sms": "disabled"}
