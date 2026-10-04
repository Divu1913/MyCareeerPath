"""Tests for the public recruiter callback endpoint."""

import pytest
from bson import ObjectId
from httpx import ASGITransport, AsyncClient

from app.db.mongodb import get_database
from app.main import app
from app.api import deps


@pytest.mark.asyncio
async def test_sales_enquiry_is_persisted_with_pending_status():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/recruiter/sales-enquiry",
            json={
                "full_name": "John Doe",
                "mobile_number": "9876543210",
                "work_email": "john@company.com",
                "hiring_for": "company",
            },
        )

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["success"] is True
    assert body["enquiry_id"]
    saved = await get_database()["sales_enquiries"].find_one({"_id": ObjectId(body["enquiry_id"])})
    assert saved["status"] == "pending"
    assert saved["hiring_for"] == "company"


@pytest.mark.asyncio
async def test_sales_enquiry_rejects_unknown_hiring_type():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/recruiter/sales-enquiry",
            json={
                "full_name": "John Doe",
                "mobile_number": "9876543210",
                "work_email": "john@company.com",
                "hiring_for": "agency",
            },
        )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_admin_can_filter_and_update_sales_enquiries():
    async def admin_user_override():
        return object()

    app.dependency_overrides[deps.get_current_admin_user] = admin_user_override
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            created = await client.post(
                "/api/v1/recruiter/sales-enquiry",
                json={
                    "full_name": "Jane Doe",
                    "mobile_number": "9876543211",
                    "work_email": "jane@company.com",
                    "hiring_for": "consultancy",
                },
            )
            enquiry_id = created.json()["enquiry_id"]

            pending = await client.get("/api/v1/admin/sales-enquiries?status=pending")
            assert pending.status_code == 200, pending.text
            assert pending.json()["count"] == 1
            assert pending.json()["enquiries"][0]["_id"] == enquiry_id

            updated = await client.patch(
                f"/api/v1/admin/sales-enquiries/{enquiry_id}/status",
                json={"status": "contacted"},
            )
            assert updated.status_code == 200, updated.text

            contacted = await client.get("/api/v1/admin/sales-enquiries?status=contacted")
            assert contacted.json()["count"] == 1
            assert contacted.json()["enquiries"][0]["status"] == "contacted"
    finally:
        app.dependency_overrides.pop(deps.get_current_admin_user, None)
