"""Recruiter reporting endpoints."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api import deps
from app.models.user import UserInDB
from app.schemas.report import MonthlyApplicationsReport, RecruiterMetrics

router = APIRouter()


@router.get("/monthly-applications", response_model=MonthlyApplicationsReport)
async def get_monthly_applications(
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    current_user: UserInDB = Depends(deps.get_current_active_user),
):
    """Return the authenticated recruiter's application volume for 7 months.

    The aggregation starts from owned job documents, looks up their linked
    applications, and groups each application by UTC month. Empty months are
    filled in Python so chart clients always receive exactly seven buckets.
    """
    if not (current_user.is_superuser or current_user.role in {"recruiter", "admin"}):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Recruiter access is required to view reports.")

    now = datetime.now(timezone.utc)
    current_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_starts = []
    cursor_month = current_month
    for _ in range(7):
        month_starts.append(cursor_month)
        cursor_month = (cursor_month - timedelta(days=1)).replace(day=1)
    month_starts.reverse()
    first_month = month_starts[0]

    pipeline = [
        {"$match": {"owner_id": current_user.id}},
        {"$lookup": {"from": "applications", "localField": "_id", "foreignField": "job_id", "as": "applications"}},
        {"$unwind": "$applications"},
        {"$match": {"applications.created_at": {"$gte": first_month}}},
        {"$group": {"_id": {"$dateToString": {"format": "%Y-%m", "date": "$applications.created_at", "timezone": "UTC"}}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    docs = await db["items"].aggregate(pipeline).to_list(length=7)
    counts = {doc["_id"]: doc["count"] for doc in docs}
    return MonthlyApplicationsReport(months=[
        {"month": month.strftime("%Y-%m"), "count": counts.get(month.strftime("%Y-%m"), 0)}
        for month in month_starts
    ])


@router.get("/metrics", response_model=RecruiterMetrics)
async def get_recruiter_metrics(
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    current_user: UserInDB = Depends(deps.get_current_active_user),
):
    """Return metrics for jobs owned by the authenticated recruiter.

    ``new_applications`` counts applications created since the start of the
    current UTC week. Interview and hire metrics use ``updated_at`` because
    application records do not retain a separate stage-history timestamp.
    """
    if not (current_user.is_superuser or current_user.role in {"recruiter", "admin"}):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recruiter access is required to view report metrics.",
        )

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)

    items = db["items"]
    applications = db["applications"]
    owned_jobs_filter = {"owner_id": current_user.id}
    open_jobs = await items.count_documents({**owned_jobs_filter, "is_published": True})
    job_ids = await items.distinct("_id", owned_jobs_filter)
    if not job_ids:
        return RecruiterMetrics(open_jobs=open_jobs)

    application_scope = {"job_id": {"$in": job_ids}}
    new_applications = await applications.count_documents(
        {**application_scope, "created_at": {"$gte": week_start}}
    )
    interviews_this_week = await applications.count_documents(
        {**application_scope, "status": "interview", "updated_at": {"$gte": week_start}}
    )
    hires_this_month = await applications.count_documents(
        {**application_scope, "status": "hired", "updated_at": {"$gte": month_start}}
    )
    return RecruiterMetrics(
        open_jobs=open_jobs,
        new_applications=new_applications,
        interviews_this_week=interviews_this_week,
        hires_this_month=hires_this_month,
    )
