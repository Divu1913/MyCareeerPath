"""Schemas for the application endpoints.

A candidate posts an `ApplicationCreate`; the API returns the same shape
plus identity / timestamps as `ApplicationOut`. The recruiter view adds
the candidate's display name + the job title as denormalized read-only
fields, populated server-side via a $lookup-style join in the endpoint.
"""
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.common import PyObjectId


class ApplicationCreate(BaseModel):
    """Payload for `POST /api/v1/applications/`.

    `job_id` is required; `cover_letter` and `resume_url` are optional
    but `resume_url` is recommended. We don't reject empty bodies — a
    candidate might want to express interest with just a job id.
    """

    job_id: str = Field(..., description="ObjectId of the job (item) being applied to.")
    cover_letter: Optional[str] = Field(
        default=None,
        max_length=5000,
        description="Free-form cover letter text (max 5000 chars).",
    )
    resume_url: Optional[str] = Field(
        default=None,
        max_length=10_000_000,
        description="Public resume URL or browser-uploaded resume data URL.",
    )


class ApplicationOut(BaseModel):
    """Response shape for an application record.

    `candidate_name` and `job_title` are denormalized for the recruiter
    view; they're optional so the candidate-facing flow can omit them.
    """

    id: PyObjectId = Field(alias="_id")
    job_id: PyObjectId
    candidate_id: PyObjectId
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    status: str = "applied"
    interview_date: Optional[str] = None
    interview_time: Optional[str] = None
    interview_details: Optional[Dict[str, Any]] = None
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    candidate_phone: Optional[str] = None
    candidate_location: Optional[str] = None
    candidate_headline: Optional[str] = None
    candidate_skills: list[str] = Field(default_factory=list)
    candidate_experience_level: Optional[str] = None
    candidate_education: Optional[str] = None
    candidate_portfolio_url: Optional[str] = None
    candidate_certificates_url: Optional[str] = None
    candidate_profile_photo_url: Optional[str] = None
    candidate_linkedin_url: Optional[str] = None
    candidate_github_url: Optional[str] = None
    candidate_leetcode_url: Optional[str] = None
    required_skills: list[str] = Field(default_factory=list)
    job_title: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )


class ApplicationStatusUpdate(BaseModel):
    """Payload for `PATCH /api/v1/applications/{id}/status`."""

    status: str = Field(
        ...,
        description=(
            "New status. One of: applied, screening/shortlisted, interview/"
            "scheduled, hired, or rejected."
        ),
    )
    details: Optional[Dict[str, Any]] = Field(default=None)


class InterviewScheduleRequest(BaseModel):
    date: str = Field(..., min_length=1, max_length=40)
    time: str = Field(..., min_length=1, max_length=40)
    mode: Optional[str] = Field(default=None, max_length=100)
    meeting_link: Optional[str] = Field(default=None, max_length=2000)
    location: Optional[str] = Field(default=None, max_length=500)
    notes: Optional[str] = Field(default=None, max_length=2000)
