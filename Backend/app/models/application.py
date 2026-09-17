from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from pydantic import Field

from app.models.common import BaseMongoModel, PyObjectId


class ApplicationInDB(BaseMongoModel):
    """A candidate's application to a job posting.

    `job_id` points at the items collection; `candidate_id` points at the
    users collection. We do not denormalize the candidate's name or the
    job's title here so updates to the source documents propagate without
    a backfill — the API hydrates these on read.

    `status` is the recruiter-controlled stage: one of
    "applied" | "screening" | "interview" | "offer" | "hired" | "rejected".
    The list endpoint validates against this set on updates.
    """

    id: Optional[PyObjectId] = Field(default_factory=ObjectId, alias="_id")
    job_id: PyObjectId
    candidate_id: PyObjectId
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    status: str = "applied"
    interview_date: Optional[str] = None
    interview_time: Optional[str] = None
    interview_details: Optional[dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
