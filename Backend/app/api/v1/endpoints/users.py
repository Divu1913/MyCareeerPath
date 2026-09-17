import json
from datetime import datetime, timezone
from pathlib import Path
from typing import List
from uuid import uuid4
from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from app.api import deps
from app.crud.user import crud_user
from app.models.user import UserInDB
from app.schemas.user import UserOut, UserUpdate
from app.core.config import settings
from app.services.ai_service import AIServiceError, ai_service
from google.genai import types

router = APIRouter()
MAX_FILE_SIZE = 10 * 1024 * 1024
PROFILE_PHOTOS_DIR = Path(__file__).resolve().parents[4] / "uploads" / "profile_photos"
PROFILE_PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
CERTIFICATES_DIR = Path(__file__).resolve().parents[4] / "uploads" / "certificates"
CERTIFICATES_DIR.mkdir(parents=True, exist_ok=True)
FALLBACK_SUGGESTED_SKILLS = [
    "Communication", "Problem Solving", "Team Collaboration", "Time Management",
    "JavaScript", "Python", "SQL", "Git", "REST APIs", "Data Analysis",
    "Adaptability", "Project Management",
]


class NotificationPreferencesUpdate(BaseModel):
    email_notifications: bool = True
    application_updates: bool = True
    sms_alerts: bool = True


@router.post("/certifications/upload")
async def upload_certificate(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(deps.get_current_active_user),
):
    """Store an authenticated candidate's certificate proof with a 10MB limit."""
    allowed = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
    extension = Path(file.filename or "").suffix.lower()
    if extension not in allowed:
        raise HTTPException(status_code=400, detail="Certificate must be PDF, JPG, PNG, or WebP.")
    content = bytearray()
    while chunk := await file.read(1024 * 1024):
        content.extend(chunk)
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Certificate file must be 10MB or smaller.")
    filename = f"{current_user.id}_{uuid4().hex}{extension}"
    (CERTIFICATES_DIR / filename).write_bytes(content)
    return {"certificate_file_url": f"/uploads/certificates/{filename}"}


@router.get("/suggested-skills")
async def suggested_skills(
    role: str = Query("", max_length=120),
    education: str = Query("", max_length=160),
    preferred_title: str = Query("", max_length=160),
    _: UserInDB = Depends(deps.get_current_active_user),
):
    """Return twelve AI-generated skills, with a deterministic fallback."""
    prompt = (
        "Return a JSON array of exactly 12 relevant technical and soft skills "
        f"for a candidate with role: {role or 'not specified'}, "
        f"qualification: {education or 'not specified'}, "
        f"and preferred title: {preferred_title or 'not specified'}. "
        "Return only the JSON array of concise skill names, with no markdown."
    )
    try:
        if not ai_service.keys:
            raise AIServiceError("No Gemini API keys are configured.")
        result = ai_service.generate(
            model=settings.GEMINI_MODEL or "gemini-3.6-flash",
            contents=[types.Content(role="user", parts=[types.Part.from_text(text=prompt)])],
            system_instruction="You generate concise, practical career skill suggestions as valid JSON only.",
            temperature=0.4,
            max_output_tokens=512,
        )
        parsed = json.loads(result)
        skills = [str(skill).strip() for skill in parsed if str(skill).strip()] if isinstance(parsed, list) else []
        if len(skills) >= 12:
            return {"skills": list(dict.fromkeys(skills))[:12], "source": "ai"}
    except (AIServiceError, json.JSONDecodeError, TypeError, ValueError):
        pass
    return {"skills": FALLBACK_SUGGESTED_SKILLS, "source": "fallback"}


@router.post("/profile-photo", response_model=UserOut)
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(deps.get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
):
    """Store the authenticated user's profile photo after a streamed size check."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Profile photo must be an image file.")
    extension = Path(file.filename or "").suffix.lower()
    if extension not in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
        raise HTTPException(status_code=400, detail="Supported profile photos are JPG, PNG, GIF, or WebP.")

    content = bytearray()
    while chunk := await file.read(1024 * 1024):
        content.extend(chunk)
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Profile photo must be 10MB or smaller.")

    filename = f"{current_user.id}_{uuid4().hex}{extension}"
    target = PROFILE_PHOTOS_DIR / filename
    target.write_bytes(content)
    photo_url = f"/uploads/profile_photos/{filename}"
    await db["users"].update_one(
        {"_id": current_user.id},
        {"$set": {"profile_photo_url": photo_url, "updated_at": datetime.now(timezone.utc)}},
    )
    return await crud_user.get(db, id=current_user.id)


@router.get("/", response_model=List[UserOut], dependencies=[Depends(deps.get_current_admin_user)])
async def read_users(
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    role: str = Query(None),
    search: str = Query(None),
):
    """
    Retrieve all registered users. Admin only.
    """
    filter_query = {}
    if role:
        filter_query["role"] = role
    if search:
        filter_query["$or"] = [{"full_name": {"$regex": search, "$options": "i"}}, {"email": {"$regex": search, "$options": "i"}}]
    users = await crud_user.get_multi(db, skip=skip, limit=limit, filter_query=filter_query)
    return users


@router.patch("/notification-preferences", response_model=UserOut)
async def update_notification_preferences(
    payload: NotificationPreferencesUpdate,
    current_user: UserInDB = Depends(deps.get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
):
    """Persist the caller's outbound-notification preferences."""
    preferences = payload.model_dump()
    await db["users"].update_one(
        {"_id": current_user.id},
        {"$set": {"notification_preferences": preferences, "updated_at": datetime.now(timezone.utc)}},
    )
    return await crud_user.get(db, id=current_user.id)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_my_account(
    current_user: UserInDB = Depends(deps.get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
):
    """Permanently delete the caller and records owned by that account.

    Recruiter-owned postings must be removed together with the applications
    linked to those postings. Candidate accounts remove only applications they
    submitted. The route deliberately derives every scope from the authenticated
    user rather than accepting any user identifier from the client.
    """
    users = db["users"]
    items = db["items"]
    applications = db["applications"]

    if current_user.role == "recruiter":
        job_ids = await items.distinct("_id", {"owner_id": current_user.id})
        if job_ids:
            await applications.delete_many({"job_id": {"$in": job_ids}})
        await items.delete_many({"owner_id": current_user.id})
    elif current_user.role == "candidate":
        await applications.delete_many({"candidate_id": current_user.id})

    await users.delete_one({"_id": current_user.id})
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{user_id}", response_model=UserOut)
async def read_user_by_id(
    user_id: str,
    current_user: UserInDB = Depends(deps.get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
):
    """
    Get a specific user by id. Users can view their own profile; admins can view any.
    """
    if str(current_user.id) != user_id and not current_user.is_superuser and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this user profile",
        )
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.put("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: str,
    user_in: UserUpdate,
    current_user: UserInDB = Depends(deps.get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
):
    """
    Update a user profile.
    """
    import re
    from datetime import datetime, timezone
    from bson import ObjectId

    user = await crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if str(current_user.id) != user_id and not (current_user.is_superuser or current_user.role == "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    update_data = user_in.model_dump(exclude_unset=True)

    # Clean and validate email
    if "email" in update_data and update_data["email"]:
        email_val = update_data["email"].strip().lower()
        update_data["email"] = email_val
        # Check uniqueness across all users
        existing_email = await db["users"].find_one({
            "email": email_val,
            "_id": {"$ne": ObjectId(user_id)}
        })
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email/phone is already registered on MyCareerPath.",
            )

    # Clean and validate phone
    if "phone" in update_data and update_data["phone"]:
        phone_val = update_data["phone"].strip()
        digits = re.sub(r"\D", "", phone_val)
        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]
        elif len(digits) == 11 and digits.startswith("0"):
            digits = digits[1:]
        
        if not re.match(r"^[6-9]\d{9}$", digits):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid phone number. Must be a 10-digit Indian mobile number starting with 6-9.",
            )
        update_data["phone"] = digits

        # Check uniqueness across all users
        existing_phone = await db["users"].find_one({
            "phone": digits,
            "_id": {"$ne": ObjectId(user_id)}
        })
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email/phone is already registered on MyCareerPath.",
            )

    user = await crud_user.update(db, db_obj=user, obj_in=update_data)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    current_user: UserInDB = Depends(deps.get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
):
    if str(current_user.id) == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Use the account self-delete flow for your own account.")
    if not await crud_user.remove(db, id=user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
