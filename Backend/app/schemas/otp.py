"""Schemas for the OTP-based authentication flow.

Identifier is a single string that may be either an email address or a phone
number. We accept either at the API surface and let the endpoint decide how
to deliver the code (the dev build just returns it in the response).
"""
from typing import Literal, Optional
from pydantic import BaseModel, Field


# User-facing role choices at signup time. "admin" is accepted so the initial
# superuser can be created via the OTP flow, but in production that path should
# be locked down (e.g. only allow "admin" when an env flag is set or a current
# admin issues the request). The stored User.role field also still accepts the
# legacy values "user" / "manager" for backward compatibility with documents
# created before this schema existed.
UserRole = Literal["candidate", "recruiter", "admin"]


class SendOtpRequest(BaseModel):
    identifier: str = Field(
        ...,
        min_length=3,
        max_length=254,
        description="Email address or phone number to send the OTP to.",
    )
    full_name: Optional[str] = Field(
        None,
        max_length=120,
        description="Optional display name captured the first time we see this identifier.",
    )
    role: Optional[UserRole] = Field(
        default="candidate",
        description="Role to assign to the user.",
    )
    is_signup: bool = Field(
        default=False,
        description="Whether this is a registration/signup request.",
    )


class SendOtpResponse(BaseModel):
    identifier: str
    channel: Literal["email", "phone"]
    expires_in_seconds: int
    is_new_user: bool
    dev_code: str


class VerifyOtpRequest(BaseModel):
    identifier: str = Field(..., min_length=3, max_length=254)
    code: str = Field(
        ...,
        min_length=6,
        max_length=6,
        pattern=r"^\d{6}$",
        description="Six-digit numeric OTP delivered to the identifier.",
    )
    role: UserRole = Field(
        default="candidate",
        description="The active role corresponding to the tab verified on.",
    )
    is_signup: bool = Field(
        default=False,
        description="Whether this is a registration/signup verification.",
    )


class VerifyOtpResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
