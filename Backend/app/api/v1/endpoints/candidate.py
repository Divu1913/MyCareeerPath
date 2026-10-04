from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api import deps
from app.models.user import UserInDB
from app.schemas.user import UserUpdate

router = APIRouter()


@router.put("/profile")
async def update_candidate_profile(
    payload: UserUpdate,
    current_user: UserInDB = Depends(deps.get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
):
    """Update profile fields belonging to the authenticated candidate."""
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Candidate account required")

    allowed_fields = {
        "full_name", "email", "phone", "location", "state", "district",
        "local_address", "headline", "education", "linkedin", "linkedin_url",
        "github", "github_url", "leetcode_url", "website", "highest_qualification",
        "education_category", "experience_level", "skills",
    }
    update_data = {
        key: value
        for key, value in payload.model_dump(exclude_unset=True).items()
        if key in allowed_fields
    }
    update_data["updated_at"] = datetime.now(timezone.utc)

    users = db["users"]
    result = await users.update_one({"_id": current_user.id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    updated_user = await users.find_one({"_id": current_user.id})
    if not updated_user:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    # Return the raw updated Mongo document in JSON-safe form. Some existing
    # user records contain legacy certification shapes that don't validate as
    # the stricter UserOut model; they must not turn a successful write into
    # an apparent failed save for the profile editor.
    return jsonable_encoder(updated_user, custom_encoder={ObjectId: str})
