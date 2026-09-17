from typing import List

from pydantic import BaseModel, Field


class RecruiterMetrics(BaseModel):
    """Current recruiter-pipeline totals used by the dashboard overview."""

    open_jobs: int = Field(0, ge=0)
    new_applications: int = Field(0, ge=0)
    interviews_this_week: int = Field(0, ge=0)
    hires_this_month: int = Field(0, ge=0)


class MonthlyApplicationCount(BaseModel):
    """One UTC calendar-month bucket for the recruiter applications chart."""

    month: str
    count: int = Field(0, ge=0)


class MonthlyApplicationsReport(BaseModel):
    months: List[MonthlyApplicationCount]
