from datetime import datetime
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator
from app.models.common import PyObjectId


class UserBase(BaseModel):
    # Email is now optional at the model level because an identifier may be a
    # phone number. At least one of email/phone is enforced at the endpoint.
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    full_name: Optional[str] = None
    highest_qualification: Optional[str] = None
    education_category: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    leetcode_url: Optional[str] = None
    profile_photo_url: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    local_address: Optional[str] = None
    is_active: Optional[bool] = True
    role: Optional[str] = "user"
    location: Optional[str] = None
    linkedin: Optional[str] = None
    website: Optional[str] = None
    headline: Optional[str] = None
    avatar_url: Optional[str] = None
    company_name: Optional[str] = Field(None, min_length=1, max_length=200)
    company_website: Optional[str] = Field(None, max_length=500)
    company_address: Optional[str] = Field(None, max_length=500)
    company_tax_id: Optional[str] = Field(None, max_length=100)
    company_verified: Optional[bool] = None
    company_review_note: Optional[str] = None
    company_review_status: Optional[str] = None
    notification_preferences: Dict[str, bool] = Field(default_factory=dict)


class UserCreate(UserBase):
    pass


class PasswordRegisterRequest(BaseModel):
    identifier: str = Field(..., min_length=3, max_length=254)
    password: str = Field(..., min_length=8, max_length=128)
    role: Literal["candidate", "recruiter"] = "candidate"
    full_name: Optional[str] = Field(default=None, max_length=120)


class PasswordLoginRequest(BaseModel):
    identifier: str = Field(..., min_length=3, max_length=254)
    password: str = Field(..., min_length=1, max_length=128)


class Certification(BaseModel):
    name: Optional[str] = None
    issuer: Optional[str] = None
    issueDate: Optional[str] = None
    expiryDate: Optional[str] = None
    credential_url: Optional[str] = None
    credential_file_url: Optional[str] = None

    @model_validator(mode="after")
    def require_proof(self):
        if not (self.credential_url and self.credential_url.strip()) and not self.credential_file_url:
            raise ValueError("Certificate file or Credential URL/ID is required.")
        return self


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    full_name: Optional[str] = None
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
    skills: Optional[List[str]] = None
    education: Optional[List[dict]] = None
    certifications: Optional[List[Certification]] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    website: Optional[str] = None
    headline: Optional[str] = None
    avatar_url: Optional[str] = None
    company_name: Optional[str] = Field(None, min_length=1, max_length=200)
    company_website: Optional[str] = Field(None, max_length=500)
    company_address: Optional[str] = Field(None, max_length=500)
    company_tax_id: Optional[str] = Field(None, max_length=100)
    company_verified: Optional[bool] = None
    company_review_note: Optional[str] = None
    company_review_status: Optional[str] = None
    notification_preferences: Optional[Dict[str, bool]] = None


class UserOut(UserBase):
    id: PyObjectId = Field(alias="_id")
    is_superuser: bool
    experience_level: Optional[str] = None
    resume_url: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    education: List[dict] = Field(default_factory=list)
    certifications: List[Certification] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )
