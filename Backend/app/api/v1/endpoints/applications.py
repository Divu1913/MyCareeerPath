"""Application endpoints.

POST /api/v1/applications/
    A candidate applies to a job. The job must exist, must be
    `is_published=True`, and the candidate must not have an existing
    application for the same job. We don't gate by role here — any
    active user can apply; recruiters who apply to their own jobs is
    unusual but harmless and lets the same flow work for the
    superuser smoke test.

GET /api/v1/applications/
    Role-aware list:
    - If the caller has role "recruiter" or "admin" (or is_superuser),
      return applications for jobs they own (joined with job title +
      candidate display name).
    - Otherwise, return the caller's own applications (candidate view).

    Both branches return `ApplicationOut`; the candidate branch leaves
    `candidate_*` / `job_title` populated when present.

GET /api/v1/applications/{id}
    Single application. Visible to the candidate who applied and to the
    recruiter who owns the job. Admin / superuser bypass.

PATCH /api/v1/applications/{id}/status
    Recruiter-only. Updates the stage on an application for one of
    their jobs. The new status must be in the allowlist.
"""
import logging
from datetime import datetime, timezone
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api import deps
from app.crud.application import crud_application
from app.models.user import UserInDB
from app.services.notification_service import dispatch_notification
from app.schemas.application import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationStatusUpdate,
    InterviewScheduleRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Allowed status transitions. Kept small + explicit so a typo in the
# frontend doesn't silently land an application in an unknown state.
ALLOWED_STATUSES = {
    "applied",
    "screening",
    "shortlisted",
    "interview",
    "scheduled",
    "interview_scheduled",
    "offer",
    "hired",
    "rejected",
}

STATUS_LABELS = {
    "screening": "Shortlisted",
    "shortlisted": "Shortlisted",
    "interview": "Scheduled for Interview",
    "scheduled": "Scheduled for Interview",
    "interview_scheduled": "Scheduled for Interview",
    "offer": "Offer Received",
    "hired": "Hired",
    "rejected": "Rejected",
}


async def _record_candidate_notification(db, application, title: str, message: str, kind: str) -> dict:
    """Persist in-app notification and attach central email/SMS delivery state."""
    notification = {
        "candidate_id": application.candidate_id,
        "application_id": application.id,
        "title": title,
        "message": message,
        "type": kind,
        "read": False,
        "created_at": datetime.now(timezone.utc),
    }
    inserted = await db["notifications"].insert_one(notification)
    delivery = await dispatch_notification(
        db, application.candidate_id, title, message, application_update=True
    )
    await db["notifications"].update_one(
        {"_id": inserted.inserted_id}, {"$set": {"delivery": delivery}}
    )
    return delivery


def _to_application_out(doc: dict) -> ApplicationOut:
    """Reshape a raw aggregation dict into ApplicationOut, including
    the denormalized candidate / job fields."""
    candidate = doc.get("candidate") or {}
    job = doc.get("job") or {}
    return ApplicationOut(
        id=doc["_id"],
        job_id=doc["job_id"],
        candidate_id=doc["candidate_id"],
        cover_letter=doc.get("cover_letter"),
        resume_url=doc.get("resume_url"),
        status=doc.get("status", "applied"),
        interview_date=doc.get("interview_date"),
        interview_time=doc.get("interview_time"),
        interview_details=doc.get("interview_details"),
        candidate_name=candidate.get("full_name"),
        candidate_email=candidate.get("email"),
        candidate_phone=candidate.get("phone"),
        candidate_location=candidate.get("location"),
        candidate_headline=candidate.get("headline"),
        candidate_skills=candidate.get("skills") or [],
        candidate_experience_level=candidate.get("experience_level"),
        candidate_education=(candidate.get("highest_education") or {}).get("degree") if isinstance(candidate.get("highest_education"), dict) else candidate.get("education"),
        candidate_portfolio_url=candidate.get("portfolio_url") or candidate.get("website"),
        candidate_certificates_url=candidate.get("certificates_url"),
        candidate_profile_photo_url=candidate.get("profile_photo_url") or candidate.get("avatar_url"),
        candidate_linkedin_url=candidate.get("linkedin_url") or candidate.get("linkedin"),
        candidate_github_url=candidate.get("github_url"),
        candidate_leetcode_url=candidate.get("leetcode_url"),
        required_skills=job.get("tags") or [],
        job_title=job.get("title"),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


@router.post("/", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
async def create_application(
    payload: ApplicationCreate,
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    current_user: UserInDB = Depends(deps.get_current_active_user),
):
    """Apply to a job. Returns the new application."""
    if not ObjectId.is_valid(payload.job_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="job_id is not a valid ObjectId",
        )
    job_oid = ObjectId(payload.job_id)

    # 1. The job must exist and be published.
    job = await db["items"].find_one({"_id": job_oid})
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )
    if not job.get("is_published", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This job is not accepting applications.",
        )

    # 2. Prevent duplicate applications from the same candidate to the
    # same job. The (job_id, candidate_id) unique index in
    # init_db_indexes is the source of truth — this is a friendlier
    # error message than letting it bubble up as a 500.
    existing = await crud_application.get_collection(db).find_one(
        {"job_id": job_oid, "candidate_id": current_user.id}
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied to this job.",
        )

    # 3. Persist. `resume_url` is an HttpUrl on the schema; we coerce
    # back to str so PyObjectId-friendly dict storage works.
    extra_data = {
        "job_id": job_oid,
        "candidate_id": current_user.id,
    }
    if payload.cover_letter is not None:
        extra_data["cover_letter"] = payload.cover_letter
    if payload.resume_url is not None:
        extra_data["resume_url"] = str(payload.resume_url)

    created = await crud_application.create(
        db, obj_in=payload, extra_data=extra_data
    )

    # Alert the job owner without letting a mail/SMS provider failure reject
    # the candidate's application.
    owner_id = job.get("owner_id")
    if owner_id:
        candidate_name = current_user.full_name or "A candidate"
        await dispatch_notification(
            db, owner_id,
            f"New application for {job.get('title') or 'your job'}",
            f"{candidate_name} has applied for {job.get('title') or 'your job posting'}.",
            application_update=True,
        )

    # Hydrate with candidate / job for the response shape.
    return _to_application_out(
        {
            **created.model_dump(by_alias=True),
            "job": job,
            "candidate": current_user.model_dump(by_alias=True),
        }
    )


@router.get("/", response_model=List[ApplicationOut])
async def list_applications(
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    current_user: UserInDB = Depends(deps.get_current_active_user),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(50, ge=1, le=100, description="Items per page"),
    status_filter: Optional[str] = Query(
        None,
        alias="status",
        description="Optional status filter (e.g. 'applied', 'interview').",
    ),
    job_id: Optional[str] = Query(
        None,
        description="Optional job ObjectId filter.",
    ),
):
    """Role-aware list of applications.

    Recruiters / admins see applications for jobs they own; candidates
    see their own applications. The recruiter branch joins items and
    users; the candidate branch returns the raw records (no joins
    needed since the caller's id is on the doc).
    """
    skip = (page - 1) * size

    is_recruiter = (
        current_user.is_superuser
        or current_user.role in {"recruiter", "admin"}
    )

    if is_recruiter:
        job_oid = None
        if job_id:
            if not ObjectId.is_valid(job_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="job_id is not a valid ObjectId",
                )
            job_oid = ObjectId(job_id)

        docs = await crud_application.get_for_recruiter(
            db,
            owner_id=current_user.id,
            skip=skip,
            limit=size,
            status=status_filter,
            job_id=job_oid,
        )
        return [_to_application_out(doc) for doc in docs]

    # Candidate branch — return this user's applications, newest first.
    raw = await crud_application.get_for_candidate(
        db,
        candidate_id=current_user.id,
        skip=skip,
        limit=size,
    )

    # Light hydration: pull job titles so the candidate sees which
    # posting they applied to. One $in query is cheaper than a per-row
    # find_one.
    job_ids = list({a.job_id for a in raw if a.job_id is not None})
    job_map: dict = {}
    if job_ids:
        async for job in db["items"].find({"_id": {"$in": job_ids}}):
            job_map[job["_id"]] = job

    out: List[ApplicationOut] = []
    for app in raw:
        job = job_map.get(app.job_id) or {}
        out.append(
            _to_application_out(
                {
                    **app.model_dump(by_alias=True),
                    "job": job,
                    "candidate": current_user.model_dump(by_alias=True),
                }
            )
        )
    return out


@router.get("/{application_id}", response_model=ApplicationOut)
async def read_application(
    application_id: str,
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    current_user: UserInDB = Depends(deps.get_current_active_user),
):
    """Fetch a single application. Visible to its candidate and the
    recruiter who owns the job."""
    if not ObjectId.is_valid(application_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="application_id is not a valid ObjectId",
        )
    app_oid = ObjectId(application_id)

    app = await crud_application.get(db, id=app_oid)
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    # Authorization: the candidate who applied, the recruiter who owns
    # the job, or any admin / superuser can read.
    is_candidate = app.candidate_id == current_user.id
    is_admin = current_user.is_superuser or current_user.role == "admin"
    is_owner = False
    if not (is_candidate or is_admin):
        job = await db["items"].find_one({"_id": app.job_id})
        if job and job.get("owner_id") == current_user.id:
            is_owner = True
    if not (is_candidate or is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to view this application",
        )

    # Hydrate for response.
    job = await db["items"].find_one({"_id": app.job_id})
    candidate = await db["users"].find_one({"_id": app.candidate_id})
    return _to_application_out(
        {
            **app.model_dump(by_alias=True),
            "job": job or {},
            "candidate": candidate or {},
        }
    )


@router.patch("/{application_id}/status", response_model=ApplicationOut)
async def update_application_status(
    application_id: str,
    payload: ApplicationStatusUpdate,
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    current_user: UserInDB = Depends(deps.get_current_active_user),
):
    """Recruiter updates the stage of an application for one of their jobs."""
    if not ObjectId.is_valid(application_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="application_id is not a valid ObjectId",
        )
    app_oid = ObjectId(application_id)

    new_status = (payload.status or "").strip().lower()
    if new_status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"status must be one of: {sorted(ALLOWED_STATUSES)}",
        )

    app = await crud_application.get(db, id=app_oid)
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    # Authorize: the recruiter who owns the job, or an admin.
    is_admin = current_user.is_superuser or current_user.role == "admin"
    job = await db["items"].find_one({"_id": app.job_id})
    is_owner = bool(job and job.get("owner_id") == current_user.id)
    if not (is_admin or is_owner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to update this application",
        )

    candidate = await db["users"].find_one({"_id": app.candidate_id}) or {}
    update_data = {"status": new_status}
    if new_status == "interview" and payload.details:
        update_data["interview_details"] = payload.details
        update_data["notification"] = {
            "channels": [channel for channel, enabled in {
                "email": bool(candidate.get("email")),
                "sms": bool(candidate.get("phone")),
            }.items() if enabled],
            "recipient_email": candidate.get("email"),
            "recipient_phone": candidate.get("phone"),
            "status": "queued",
        }

    updated = await crud_application.update(db, db_obj=app, obj_in=update_data)
    if new_status in STATUS_LABELS:
        job_title = (job or {}).get("title") or "your application"
        status_label = STATUS_LABELS[new_status]
        details_suffix = f" Details: {payload.details}." if payload.details else ""
        await _record_candidate_notification(
            db, updated,
            f"Application {status_label}",
            f"Your application for {job_title} has been {status_label.lower()}.{details_suffix}",
            "application_status",
        )
    candidate = await db["users"].find_one({"_id": updated.candidate_id})
    return _to_application_out(
        {
            **updated.model_dump(by_alias=True),
            "job": job or {},
            "candidate": candidate or {},
        }
    )


@router.post("/{application_id}/schedule-interview", response_model=ApplicationOut)
async def schedule_interview(
    application_id: str,
    payload: InterviewScheduleRequest,
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    current_user: UserInDB = Depends(deps.get_current_active_user),
):
    """Schedule an owned application interview and notify its candidate."""
    if not ObjectId.is_valid(application_id):
        raise HTTPException(status_code=400, detail="application_id is not a valid ObjectId")
    app = await crud_application.get(db, id=ObjectId(application_id))
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    job = await db["items"].find_one({"_id": app.job_id})
    is_admin = current_user.is_superuser or current_user.role == "admin"
    if not (is_admin or (job and job.get("owner_id") == current_user.id)):
        raise HTTPException(status_code=403, detail="Not allowed to schedule this interview")

    details = payload.model_dump(exclude_none=True)
    updated = await crud_application.update(
        db,
        db_obj=app,
        obj_in={
            "status": "interview",
            "interview_date": payload.date,
            "interview_time": payload.time,
            "interview_details": details,
        },
    )
    candidate = await db["users"].find_one({"_id": app.candidate_id}) or {}
    job_title = (job or {}).get("title") or "your application"
    title = "Interview Scheduled"
    message = f"Interview scheduled for {job_title} on {payload.date} at {payload.time}."
    meeting_details = ", ".join(str(value) for value in (payload.mode, payload.meeting_link, payload.location, payload.notes) if value)
    if meeting_details:
        message = f"{message} Details: {meeting_details}"
    await _record_candidate_notification(db, updated, title, message, "interview")
    return _to_application_out({**updated.model_dump(by_alias=True), "job": job or {}, "candidate": candidate})
