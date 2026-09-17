import re
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api import deps
from app.crud.item import crud_item
from app.models.user import UserInDB
from app.schemas.item import ItemCreate, ItemOut, ItemUpdate, PaginatedItems

router = APIRouter()


@router.get("/public", response_model=PaginatedItems)
async def read_published_items(
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, max_length=200, description="Case-insensitive job search"),
):
    """Public job feed used by the candidate jobs page."""
    filter_query = {"is_published": True}
    if search and search.strip():
        # Spaces are deliberately loose to make "Full Stack" match
        # "FullStack" as well as ordinary spaced titles. Escaping keeps user
        # input literal instead of allowing arbitrary regular expressions.
        pattern = ".*".join(re.escape(part) for part in search.strip().split())
        filter_query["$or"] = [
            {"title": {"$regex": pattern, "$options": "i"}},
            {"company_name": {"$regex": pattern, "$options": "i"}},
            {"description": {"$regex": pattern, "$options": "i"}},
            {"tags": {"$regex": pattern, "$options": "i"}},
            {"skills": {"$regex": pattern, "$options": "i"}},
            {"location": {"$regex": pattern, "$options": "i"}},
        ]
    items = await crud_item.get_multi(db, skip=(page - 1) * size, limit=size, filter_query=filter_query)
    total = await crud_item.count(db, filter_query=filter_query)
    return {"items": items, "total": total, "page": page, "size": size, "pages": (total + size - 1) // size if total else 1}


@router.get("/", response_model=PaginatedItems)
async def read_items(
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    current_user: UserInDB = Depends(deps.get_current_active_user),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    search: Optional[str] = Query(None, description="Full-text search title/desc"),
):
    """
    Retrieve items belonging to the current authenticated user with pagination and filters.
    """
    skip = (page - 1) * size
    filter_query = {} if (current_user.is_superuser or current_user.role == "admin") else {"owner_id": current_user.id}
    if tag:
        filter_query["tags"] = tag
    if search:
        filter_query["$text"] = {"$search": search}

    items = await crud_item.get_multi(
        db, skip=skip, limit=size, filter_query=filter_query
    )
    total = await crud_item.count(db, filter_query=filter_query)
    pages = (total + size - 1) // size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": pages,
    }


@router.post("/", response_model=ItemOut, status_code=status.HTTP_201_CREATED)
async def create_item(
    item_in: ItemCreate,
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    current_user: UserInDB = Depends(deps.get_current_active_user),
):
    """
    Create a new item owned by the current user.
    """
    extra_data = {"owner_id": current_user.id}
    item = await crud_item.create(db, obj_in=item_in, extra_data=extra_data)
    return item


@router.get("/analytics/summary")
async def get_item_analytics(
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    current_user: UserInDB = Depends(deps.get_current_active_user),
):
    """
    Get aggregated analytics for current user's items via MongoDB aggregation pipeline.
    """
    stats = await crud_item.get_stats(db, owner_id=current_user.id)
    return stats


@router.get("/{item_id}", response_model=ItemOut)
async def read_item(
    item_id: str,
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    current_user: UserInDB = Depends(deps.get_current_active_user),
):
    """
    Get a specific item by ID.
    """
    item = await crud_item.get(db, id=item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )
    if item.owner_id != current_user.id and not (current_user.is_superuser or current_user.role == "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to view this item",
        )
    return item


@router.put("/{item_id}", response_model=ItemOut)
async def update_item(
    item_id: str,
    item_in: ItemUpdate,
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    current_user: UserInDB = Depends(deps.get_current_active_user),
):
    """
    Update an item. Only the owner can update.
    """
    item = await crud_item.get(db, id=item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )
    if item.owner_id != current_user.id and not (current_user.is_superuser or current_user.role == "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update this item",
        )
    updated_item = await crud_item.update(db, db_obj=item, obj_in=item_in)
    return updated_item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: str,
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    current_user: UserInDB = Depends(deps.get_current_active_user),
):
    """
    Delete an item by ID.
    """
    item = await crud_item.get(db, id=item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )
    if item.owner_id != current_user.id and not (current_user.is_superuser or current_user.role == "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this item",
        )
    await crud_item.remove(db, id=item_id)
    return None
