"""OTP-based authentication flow tests.

These tests assume MongoDB is reachable at the URL configured in
``app.core.config.settings.MONGODB_URL``. They create users in the real DB
— run them against a disposable database (e.g. docker-compose) so leftover
documents don't accumulate in a production-shaped instance.
"""
import pytest
from httpx import AsyncClient

from app.main import app
from app.crud.otp import OTP_TTL_MINUTES


@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_send_otp_creates_user_and_returns_dev_code():
    identifier = "otp-tester@example.com"
    async with AsyncClient(app=app, base_url="http://test") as ac:
        res = await ac.post(
            "/api/auth/send-otp",
            json={"identifier": identifier, "full_name": "OTP Tester"},
        )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["identifier"] == identifier
    assert body["channel"] == "email"
    assert body["expires_in_seconds"] == OTP_TTL_MINUTES * 60
    assert body["is_new_user"] is True
    assert body["dev_code"].isdigit() and len(body["dev_code"]) == 6


@pytest.mark.asyncio
async def test_send_otp_phone_identifier():
    identifier = "9876543211"
    async with AsyncClient(app=app, base_url="http://test") as ac:
        res = await ac.post(
            "/api/auth/send-otp",
            json={"identifier": identifier},
        )
    assert res.status_code == 200
    body = res.json()
    assert body["channel"] == "phone"
    assert body["is_new_user"] is True


@pytest.mark.asyncio
async def test_send_otp_rejects_garbage_identifier():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        res = await ac.post(
            "/api/auth/send-otp",
            json={"identifier": "not-an-email-or-phone"},
        )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_verify_otp_returns_jwt_pair():
    identifier = "verify-tester@example.com"
    async with AsyncClient(app=app, base_url="http://test") as ac:
        send = await ac.post(
            "/api/auth/send-otp",
            json={"identifier": identifier, "full_name": "Verify Tester"},
        )
        assert send.status_code == 200
        code = send.json()["dev_code"]

        verify = await ac.post(
            "/api/auth/verify-otp",
            json={"identifier": identifier, "code": code},
        )
    assert verify.status_code == 200, verify.text
    body = verify.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["user_id"]


@pytest.mark.asyncio
async def test_verify_otp_rejects_wrong_code():
    identifier = "wrongcode@example.com"
    async with AsyncClient(app=app, base_url="http://test") as ac:
        await ac.post("/api/auth/send-otp", json={"identifier": identifier})
        res = await ac.post(
            "/api/auth/verify-otp",
            json={"identifier": identifier, "code": "000000"},
        )
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_verify_otp_rejects_replay():
    """A consumed OTP cannot be reused."""
    identifier = "replay@example.com"
    async with AsyncClient(app=app, base_url="http://test") as ac:
        send = await ac.post(
            "/api/auth/send-otp", json={"identifier": identifier}
        )
        code = send.json()["dev_code"]

        first = await ac.post(
            "/api/auth/verify-otp",
            json={"identifier": identifier, "code": code},
        )
        assert first.status_code == 200

        # Same code should fail on second attempt
        second = await ac.post(
            "/api/auth/verify-otp",
            json={"identifier": identifier, "code": code},
        )
    assert second.status_code == 400
    assert "No active OTP" in second.json()["detail"]


@pytest.mark.asyncio
async def test_register_endpoint_removed():
    """The old password-register endpoint should now 404."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        res = await ac.post(
            "/api/auth/register",
            json={"email": "x@example.com", "password": "StrongPassword123!"},
        )
    assert res.status_code == 404
