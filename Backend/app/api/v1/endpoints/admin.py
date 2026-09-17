import asyncio
import csv
import hashlib
import io
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from typing import Any, Literal, Optional
from urllib.parse import quote

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from fastapi.responses import Response
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field, model_validator

from app.api import deps
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, verify_password
from app.models.user import UserInDB
from app.schemas.item import ItemUpdate
from app.schemas.user import UserOut
from app.schemas.otp import VerifyOtpResponse

router = APIRouter()


class AdminLoginRequest(BaseModel):
    # `email` remains accepted for clients deployed before the isolated modal.
    identifier: Optional[str] = Field(default=None, min_length=3, max_length=254)
    email: Optional[str] = Field(default=None, min_length=3, max_length=254)
    username: Optional[str] = Field(default=None, min_length=1, max_length=100)
    password: str = Field(..., min_length=1, max_length=128)

    @model_validator(mode="after")
    def requires_identifier(self):
        if not (self.identifier or self.email or self.username):
            raise ValueError("Email or username is required")
        return self

    @property
    def login_identifier(self) -> str:
        return (self.identifier or self.email or self.username or "").strip()


class AdminForgotPasswordRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=254)


def _configured_admin_matches(identifier: str) -> bool:
    normalized = identifier.strip().lower()
    return normalized in {
        settings.ADMIN_EMAIL.strip().lower(),
        settings.ADMIN_USERNAME.strip().lower(),
    } - {""}


def _send_reset_email(recipient: str, reset_link: str) -> None:
    """Send a reset link through the optional configured SMTP relay."""
    message = EmailMessage()
    message["Subject"] = "Reset your MyCareerPath administrator password"
    message["From"] = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
    message["To"] = recipient
    message.set_content(
        "A password reset was requested for the MyCareerPath administrator portal.\n\n"
        f"Use this link within {settings.ADMIN_RESET_TOKEN_EXPIRE_MINUTES} minutes:\n{reset_link}\n\n"
        "If you did not request this, you can ignore this email."
    )
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as client:
        if settings.SMTP_USE_TLS:
            client.starttls()
        if settings.SMTP_USERNAME:
            client.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        client.send_message(message)


@router.post("/login", response_model=VerifyOtpResponse)
async def admin_login(
    payload: AdminLoginRequest,
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
):
    """Authenticate only the configured administrator identity."""
    if not settings.ADMIN_EMAIL or not settings.ADMIN_PASSWORD_HASH:
        raise HTTPException(status_code=503, detail="Admin authentication is not configured")
    try:
        credentials_match = verify_password(payload.password, settings.ADMIN_PASSWORD_HASH)
    except Exception:
        credentials_match = False
    if not _configured_admin_matches(payload.login_identifier) or not credentials_match:
        raise HTTPException(status_code=401, detail="Invalid administrator credentials")

    user_doc = await db["users"].find_one({"email": settings.ADMIN_EMAIL.strip().lower()})
    if not user_doc or user_doc.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Administrator account is not authorized")
    user = UserInDB(**user_doc)
    return VerifyOtpResponse(
        access_token=create_access_token(subject=str(user.id)),
        refresh_token=create_refresh_token(subject=str(user.id)),
        user_id=str(user.id),
    )


@router.post("/forgot-password")
async def admin_forgot_password(
    payload: AdminForgotPasswordRequest,
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
):
    """Issue a one-time, expiring administrator password-reset link.

    The administrator password itself is environment-managed, so consuming the
    link must be handled by the secured deployment/password-management
    workflow. We store only a digest of the token and never disclose whether a
    submitted email is the configured administrator address.
    """
    generic_response = {"detail": "If that email belongs to the administrator, a reset link has been sent."}
    if not settings.ADMIN_EMAIL or not _configured_admin_matches(payload.email):
        return generic_response

    raw_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.ADMIN_RESET_TOKEN_EXPIRE_MINUTES)
    await db["admin_password_resets"].update_many(
        {"email": settings.ADMIN_EMAIL.strip().lower(), "used_at": None},
        {"$set": {"used_at": datetime.now(timezone.utc)}},
    )
    await db["admin_password_resets"].insert_one({
        "email": settings.ADMIN_EMAIL.strip().lower(),
        "token_hash": hashlib.sha256(raw_token.encode("utf-8")).hexdigest(),
        "created_at": datetime.now(timezone.utc),
        "expires_at": expires_at,
        "used_at": None,
    })
    reset_link = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/#admin-login?token={quote(raw_token)}"

    if settings.SMTP_HOST and (settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME):
        try:
            await asyncio.to_thread(_send_reset_email, settings.ADMIN_EMAIL.strip(), reset_link)
        except (OSError, smtplib.SMTPException) as exc:
            raise HTTPException(status_code=503, detail="Unable to dispatch password reset email") from exc
        return generic_response

    # Local development has no mail relay; returning the link makes the
    # workflow testable without weakening a configured production deployment.
    return {**generic_response, "reset_link": reset_link}


class AdminUserUpdate(BaseModel):
    role: Optional[Literal["candidate", "recruiter", "admin"]] = None
    is_active: Optional[bool] = None


class CompanyDecision(BaseModel):
    approved: bool
    reason: Optional[str] = Field(default=None, max_length=500)


def _object_id(value: str, label: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail=f"Invalid {label} id")
    return ObjectId(value)


def _month_buckets(months: int = 12) -> list[datetime]:
    now = datetime.now(timezone.utc)
    cursor = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    result = []
    for _ in range(months):
        result.append(cursor)
        cursor = (cursor - timedelta(days=1)).replace(day=1)
    return list(reversed(result))


async def _monthly_counts(collection, field: str, first_month: datetime, buckets: list[datetime]):
    pipeline = [
        {"$match": {field: {"$gte": first_month}}},
        {"$group": {"_id": {"$dateToString": {"format": "%Y-%m", "date": f"${field}", "timezone": "UTC"}}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    docs = await collection.aggregate(pipeline).to_list(length=len(buckets))
    counts = {doc["_id"]: doc["count"] for doc in docs}
    return [{"month": month.strftime("%Y-%m"), "count": counts.get(month.strftime("%Y-%m"), 0)} for month in buckets]


@router.get("/overview")
async def overview(
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    _: UserInDB = Depends(deps.get_current_admin_user),
):
    users = db["users"]
    items = db["items"]
    applications = db["applications"]
    pending_filter = {
        "role": "recruiter",
        "company_verified": {"$ne": True},
        "company_review_status": {"$nin": ["approved", "rejected"]},
    }
    return {
        "total_candidates": await users.count_documents({"role": "candidate"}),
        "verified_recruiters": await users.count_documents({"role": "recruiter", "company_verified": True}),
        "pending_company_approvals": await users.count_documents(pending_filter),
        "total_jobs": await items.count_documents({}),
        "active_jobs": await items.count_documents({"is_published": True}),
        "active_applications": await applications.count_documents({"status": {"$nin": ["rejected", "hired"]}}),
        "total_applications": await applications.count_documents({}),
    }


@router.get("/stats")
async def stats(
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    _: UserInDB = Depends(deps.get_current_admin_user),
):
    """Alias of /overview kept for compatibility with admin UI expectations."""
    # Reuse the same logic as overview to avoid duplication.
    return await overview(db=db, _=_)


@router.get("/users")
async def users(
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    _: UserInDB = Depends(deps.get_current_admin_user),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=500),
    role: Optional[str] = None,
    search: Optional[str] = None,
):
    # Keep administrator accounts out of this management list. Passing
    # ?role=candidate or ?role=recruiter maps directly to the corresponding
    # MongoDB role query.
    query: dict[str, Any] = {"role": role} if role in {"candidate", "recruiter"} else {"role": {"$in": ["candidate", "recruiter"]}}
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"company_name": {"$regex": search, "$options": "i"}},
        ]
    collection = db["users"]
    total = await collection.count_documents(query)
    docs = await collection.find(query).sort("created_at", -1).skip((page - 1) * size).limit(size).to_list(length=size)
    items = []
    for doc in docs:
        user_dict = UserOut.model_validate(doc).model_dump(by_alias=True)
        if doc.get("role") == "candidate":
            user_dict["applications_count"] = await db["applications"].count_documents({"candidate_id": doc["_id"]})
        elif doc.get("role") == "recruiter":
            job_ids = await db["items"].distinct("_id", {"owner_id": doc["_id"]})
            user_dict["applications_count"] = await db["applications"].count_documents({"job_id": {"$in": job_ids}}) if job_ids else 0
        else:
            user_dict["applications_count"] = 0
        # These fields are explicitly included for the Manage Users table,
        # including legacy documents that do not yet record last_login.
        user_dict["full_name"] = doc.get("full_name")
        user_dict["email"] = doc.get("email")
        user_dict["created_at"] = doc.get("created_at")
        user_dict["is_active"] = doc.get("is_active", True)
        user_dict["last_login"] = doc.get("last_login")
        items.append(user_dict)
    return {"items": items, "total": total, "page": page, "size": size}


@router.patch("/users/{user_id}")
async def update_user(user_id: str, payload: AdminUserUpdate, db: AsyncIOMotorDatabase = Depends(deps.get_db), current_user: UserInDB = Depends(deps.get_current_admin_user)):
    object_id = _object_id(user_id, "user")
    if object_id == current_user.id:
        raise HTTPException(status_code=400, detail="An administrator cannot change their own access here")
    update = payload.model_dump(exclude_none=True)
    if not update:
        raise HTTPException(status_code=400, detail="No changes supplied")
    result = await db["users"].update_one({"_id": object_id}, {"$set": {**update, "updated_at": datetime.now(timezone.utc)}})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut.model_validate(await db["users"].find_one({"_id": object_id}))


@router.patch("/users/{user_id}/status")
async def update_user_status(user_id: str, payload: dict, db: AsyncIOMotorDatabase = Depends(deps.get_db), current_user: UserInDB = Depends(deps.get_current_admin_user)):
    """Update account status: `active` / `suspended` / `verified`.

    - active: sets `is_active` = True
    - suspended: sets `is_active` = False
    - verified: for recruiters marks company_verified=True + company_review_status=approved
    """
    object_id = _object_id(user_id, "user")
    if object_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own status via this endpoint")
    status_value = payload.get("status")
    if status_value not in {"active", "suspended", "verified"}:
        raise HTTPException(status_code=400, detail="Invalid status value")
    update: dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
    if status_value == "active":
        update["is_active"] = True
    elif status_value == "suspended":
        update["is_active"] = False
    elif status_value == "verified":
        # If the user is a recruiter, mark company as verified.
        user = await db["users"].find_one({"_id": object_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.get("role") != "recruiter":
            raise HTTPException(status_code=400, detail="Verified status only applies to recruiter company verification")
        update["company_verified"] = True
        update["company_review_status"] = "approved"
    result = await db["users"].update_one({"_id": object_id}, {"$set": update})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="User not found")
    return await db["users"].find_one({"_id": object_id})


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, db: AsyncIOMotorDatabase = Depends(deps.get_db), current_user: UserInDB = Depends(deps.get_current_admin_user)):
    object_id = _object_id(user_id, "user")
    if object_id == current_user.id:
        raise HTTPException(status_code=400, detail="Use the self-delete flow for your own account")
    user = await db["users"].find_one({"_id": object_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    job_ids = await db["items"].distinct("_id", {"owner_id": object_id})
    if job_ids:
        await db["applications"].delete_many({"job_id": {"$in": job_ids}})
        await db["items"].delete_many({"_id": {"$in": job_ids}})
    await db["applications"].delete_many({"candidate_id": object_id})
    await db["users"].delete_one({"_id": object_id})


@router.get("/companies/pending")
@router.get("/recruiters/pending")
async def pending_companies(db: AsyncIOMotorDatabase = Depends(deps.get_db), _: UserInDB = Depends(deps.get_current_admin_user)):
    query = {"role": "recruiter", "company_verified": {"$ne": True}, "company_review_status": {"$nin": ["approved", "rejected"]}}
    return await db["users"].find(query).sort("created_at", 1).to_list(length=500)


@router.patch("/companies/{user_id}")
async def decide_company(user_id: str, payload: CompanyDecision, db: AsyncIOMotorDatabase = Depends(deps.get_db), _: UserInDB = Depends(deps.get_current_admin_user)):
    object_id = _object_id(user_id, "company")
    update = {"company_verified": payload.approved, "company_review_status": "approved" if payload.approved else "rejected", "updated_at": datetime.now(timezone.utc)}
    if payload.reason:
        update["company_review_note"] = payload.reason
    result = await db["users"].update_one({"_id": object_id, "role": "recruiter"}, {"$set": update})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Recruiter not found")
    return await db["users"].find_one({"_id": object_id})


@router.patch("/recruiters/{user_id}/verify")
async def verify_recruiter(user_id: str, payload: CompanyDecision, db: AsyncIOMotorDatabase = Depends(deps.get_db), _: UserInDB = Depends(deps.get_current_admin_user)):
    """Alias route for recruiter verification (company credentials).

    Keeps a friendlier, RESTy path expected by the admin UI: PATCH /recruiters/{id}/verify
    """
    # Reuse the same logic as decide_company for consistency.
    return await decide_company(user_id, payload, db=db, _=_)


@router.get("/jobs")
async def jobs(page: int = Query(1, ge=1), size: int = Query(50, ge=1, le=500), db: AsyncIOMotorDatabase = Depends(deps.get_db), _: UserInDB = Depends(deps.get_current_admin_user)):
    pipeline = [
        {"$sort": {"created_at": -1}}, {"$skip": (page - 1) * size}, {"$limit": size},
        {"$lookup": {"from": "users", "localField": "owner_id", "foreignField": "_id", "as": "owner"}},
        {"$unwind": {"path": "$owner", "preserveNullAndEmptyArrays": True}},
        {"$addFields": {
            "owner_name": "$owner.full_name",
            "owner_email": "$owner.email",
            "company_name": {"$ifNull": ["$company_name", {"$ifNull": ["$owner.company_name", "Company not provided"]}]}
        }},
        {"$project": {"owner": 0}},
    ]
    collection = db["items"]
    items = await collection.aggregate(pipeline).to_list(length=size)
    for j in items:
        if not j.get("company_name"):
            j["company_name"] = "Company not provided"
        if "applications_count" not in j:
            j["applications_count"] = await db["applications"].count_documents({"job_id": j["_id"]})
    return {"items": items, "total": await collection.count_documents({}), "page": page, "size": size}


@router.patch("/jobs/{job_id}")
async def update_job(job_id: str, payload: ItemUpdate, db: AsyncIOMotorDatabase = Depends(deps.get_db), _: UserInDB = Depends(deps.get_current_admin_user)):
    object_id = _object_id(job_id, "job")
    update = payload.model_dump(exclude_unset=True)
    if not update:
        raise HTTPException(status_code=400, detail="No changes supplied")
    update["updated_at"] = datetime.now(timezone.utc)
    result = await db["items"].update_one({"_id": object_id}, {"$set": update})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Job not found")
    return await db["items"].find_one({"_id": object_id})


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(job_id: str, db: AsyncIOMotorDatabase = Depends(deps.get_db), _: UserInDB = Depends(deps.get_current_admin_user)):
    object_id = _object_id(job_id, "job")
    result = await db["items"].delete_one({"_id": object_id})
    if not result.deleted_count:
        raise HTTPException(status_code=404, detail="Job not found")
    await db["applications"].delete_many({"job_id": object_id})


@router.get("/reports")
async def reports(db: AsyncIOMotorDatabase = Depends(deps.get_db), _: UserInDB = Depends(deps.get_current_admin_user)):
    buckets = _month_buckets()
    first_month = buckets[0]
    users = db["users"]
    applications = db["applications"]
    return {
        "registrations": await _monthly_counts(users, "created_at", first_month, buckets),
        "applications": await _monthly_counts(applications, "created_at", first_month, buckets),
        "usage": {
            "total_users": await users.count_documents({}),
            "active_users": await users.count_documents({"is_active": True}),
            "published_jobs": await db["items"].count_documents({"is_published": True}),
            "completed_applications": await applications.count_documents({"status": {"$in": ["hired", "rejected"]}}),
        },
    }


def _csv_download(filename: str, header: list[str], rows: list[list[Any]]) -> Response:
    output = io.StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(header)
    writer.writerows(rows)
    return Response(
        content="\ufeff" + output.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _csv_date(value: Any) -> str:
    return value.isoformat() if isinstance(value, datetime) else str(value or "")


@router.get("/reports/jobs/export")
async def export_job_report(
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    _: UserInDB = Depends(deps.get_current_admin_user),
):
    """Download all job listings with their live application totals."""
    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$lookup": {"from": "users", "localField": "owner_id", "foreignField": "_id", "as": "owner"}},
        {"$unwind": {"path": "$owner", "preserveNullAndEmptyArrays": True}},
        {"$lookup": {"from": "applications", "localField": "_id", "foreignField": "job_id", "as": "applications"}},
    ]
    jobs = await db["items"].aggregate(pipeline).to_list(length=None)
    rows = [[
        job.get("title", ""),
        job.get("company_name") or job.get("owner", {}).get("company_name") or "Company not provided",
        job.get("location") or job.get("address") or job.get("company_address") or "",
        _csv_date(job.get("created_at")),
        job.get("status") or ("Published" if job.get("is_published") else "Draft"),
        len(job.get("applications", [])),
    ] for job in jobs]
    return _csv_download("mycareerpath-jobs-report.csv", ["Job Title", "Company", "Location", "Date Posted", "Status", "Applicants Count"], rows)


@router.get("/reports/candidates/export")
async def export_candidate_report(
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    _: UserInDB = Depends(deps.get_current_admin_user),
):
    """Download candidate profile and application-count data as CSV."""
    pipeline = [
        {"$match": {"role": "candidate"}},
        {"$sort": {"created_at": -1}},
        {"$lookup": {"from": "applications", "localField": "_id", "foreignField": "candidate_id", "as": "applications"}},
    ]
    candidates = await db["users"].aggregate(pipeline).to_list(length=None)
    rows = [[
        candidate.get("full_name", ""),
        candidate.get("email", ""),
        candidate.get("highest_qualification") or candidate.get("education_category") or "",
        candidate.get("experience_level", ""),
        len(candidate.get("applications", [])),
    ] for candidate in candidates]
    return _csv_download("mycareerpath-candidates-report.csv", ["Candidate Name", "Email", "Qualification", "Experience", "Application Count"], rows)
