from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from pydantic import EmailStr, Field
from app.models.common import BaseMongoModel, PyObjectId


class UserInDB(BaseMongoModel):
    id: Optional[PyObjectId] = Field(default_factory=ObjectId, alias="_id")
    # Either email or phone is set; the OTP endpoint enforces one-of.
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    full_name: Optional[str] = None
    password_hash: Optional[str] = None
    otp_verified: bool = False
    highest_qualification: Optional[str] = None
    education_category: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    leetcode_url: Optional[str] = None
    profile_photo_url: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    local_address: Optional[str] = None
    experience_level: Optional[str] = None
    resume_url: Optional[str] = None
    skills: list[str] = Field(default_factory=list)
    education: list[dict] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    is_active: bool = True
    is_superuser: bool = False
    role: str = "user"  # "user", "admin", "manager"
    location: Optional[str] = None
    linkedin: Optional[str] = None
    website: Optional[str] = None
    headline: Optional[str] = None
    avatar_url: Optional[str] = None
    company_name: Optional[str] = None
    company_website: Optional[str] = None
    company_address: Optional[str] = None
    company_tax_id: Optional[str] = None
    company_verified: Optional[bool] = None
    company_review_note: Optional[str] = None
    company_review_status: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
