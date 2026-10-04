"""Public recruiter sales-enquiry endpoints."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api import deps
from app.schemas.recruiter import SalesEnquiryCreate

router = APIRouter()


@router.post("/sales-enquiry", status_code=status.HTTP_201_CREATED)
async def create_sales_enquiry(
    enquiry_data: SalesEnquiryCreate,
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
):
    """Store a public callback request for the sales team to process."""
    try:
        enquiry = enquiry_data.model_dump()
        enquiry.update(
            status="pending",
            created_at=datetime.now(timezone.utc),
        )
        result = await db["sales_enquiries"].insert_one(enquiry)
    except Exception as exc:
        # Do not expose database implementation details to anonymous callers.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit sales enquiry. Please try again later.",
        ) from exc

    return {
        "success": True,
        "message": "Callback request submitted successfully. Our team will contact you shortly.",
        "enquiry_id": str(result.inserted_id),
    }
