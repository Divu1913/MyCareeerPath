"""Schemas for the job-recommendation endpoint.

A request carries the candidate's skill set and any preferred roles; the
response is a ranked list of items from the `items` collection, each
annotated with a normalized 0-1 match score and the matched skill subset.
"""
from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.item import ItemOut


class RecommendationRequest(BaseModel):
    """Payload for `POST /recommendations/jobs`.

    Attributes:
        skills: Free-form skill tags the candidate already has. Matching is
            case-insensitive and operates against an item's `title`,
            `description`, and `tags` fields.
        preferred_roles: Optional role/title filters (e.g. "backend engineer").
            When provided, an item must mention at least one of these
            somewhere in `title` / `description` to be considered.
        limit: Maximum number of ranked jobs to return. Capped at 50 to keep
            response payloads reasonable.
    """

    skills: List[str] = Field(
        default_factory=list,
        description="Candidate's skills used to score each job.",
    )
    preferred_roles: Optional[List[str]] = Field(
        default=None,
        description="Optional role/title keywords an item must match.",
    )
    limit: int = Field(
        10,
        ge=1,
        le=50,
        description="Maximum number of jobs to return (1-50).",
    )


class ScoredJob(BaseModel):
    """A single ranked job item plus its match metadata."""

    job: ItemOut = Field(..., description="The job posting (item).")
    score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Skill-match score normalized to [0, 1].",
    )
    matched_skills: List[str] = Field(
        default_factory=list,
        description="The subset of candidate skills that matched the job.",
    )


class RecommendationResponse(BaseModel):
    """Response payload for `POST /recommendations/jobs`."""

    recommendations: List[ScoredJob] = Field(
        default_factory=list,
        description="Ranked list of jobs, highest score first.",
    )
    total: int = Field(..., ge=0, description="Number of jobs returned.")
