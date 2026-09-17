"""Candidate-scoped in-app notifications."""
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api import deps
from app.models.user import UserInDB
router = APIRouter()


@router.get("")
@router.get("/")
async def list_notifications(
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    current_user: UserInDB = Depends(deps.get_current_active_user),
    limit: int = Query(30, ge=1, le=100),
):
    # The candidate drawer is intentionally an unread inbox; read alerts do
    # not reappear after a refresh. Mongo performs the date ordering.
    query = {"candidate_id": current_user.id, "read": False}
    documents = await db["notifications"].find(query).sort("created_at", -1).limit(limit).to_list(length=limit)
    unread_count = await db["notifications"].count_documents(query)
    for document in documents:
        document["id"] = str(document.pop("_id"))
        document["candidate_id"] = str(document["candidate_id"])
    return {"items": documents, "unread_count": unread_count}


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    current_user: UserInDB = Depends(deps.get_current_active_user),
):
    if not ObjectId.is_valid(notification_id):
        raise HTTPException(status_code=400, detail="Invalid notification id")
    notification = await db["notifications"].find_one({"_id": ObjectId(notification_id), "candidate_id": current_user.id})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    next_read = not bool(notification.get("read", False))
    update = {"read": next_read}
    if next_read:
        update["read_at"] = datetime.now(timezone.utc)
    else:
        update["read_at"] = None
    await db["notifications"].update_one({"_id": notification["_id"]}, {"$set": update})
    return {"id": notification_id, "read": next_read}
