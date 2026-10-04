"""Request schemas for public recruiter enquiries."""

from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class SalesEnquiryCreate(BaseModel):
    """Details supplied by an employer requesting a sales callback."""

    full_name: str = Field(..., min_length=1, max_length=200, examples=["John Doe"])
    mobile_number: str = Field(..., min_length=7, max_length=30, examples=["9876543210"])
    work_email: EmailStr = Field(..., examples=["john@company.com"])
    hiring_for: Literal["company", "consultancy"] = Field(..., examples=["company"])


class SalesEnquiryStatusUpdate(BaseModel):
    """Allowed workflow transitions for a sales callback request."""

    status: Literal["pending", "contacted", "resolved", "approved"]
