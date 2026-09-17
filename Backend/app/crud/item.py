from typing import List, Optional, Dict, Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.crud.base import CRUDBase
from app.models.item import ItemInDB
from app.schemas.item import ItemCreate, ItemUpdate


class CRUDItem(CRUDBase[ItemInDB, ItemCreate, ItemUpdate]):
    async def get_multi_by_owner(
        self,
        db: AsyncIOMotorDatabase,
        *,
        owner_id: ObjectId,
        skip: int = 0,
        limit: int = 100,
        tag: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[ItemInDB]:
        """Fetch items owned by a specific user with optional search & tag filter."""
        filter_query: Dict[str, Any] = {"owner_id": owner_id}
        
        if tag:
            filter_query["tags"] = tag
            
        if search:
            filter_query["$text"] = {"$search": search}
            
        return await self.get_multi(
            db, skip=skip, limit=limit, filter_query=filter_query
        )

    async def get_stats(self, db: AsyncIOMotorDatabase, *, owner_id: ObjectId) -> dict:
        """
        MongoDB Motor Aggregation Pipeline to compute item analytics.
        Uses $match, $facet, $group, and $avg.
        """
        pipeline = [
            {"$match": {"owner_id": owner_id}},
            {
                "$facet": {
                    "overview": [
                        {
                            "$group": {
                                "_id": None,
                                "total_items": {"$sum": 1},
                                "avg_price": {"$avg": "$price"},
                                "max_price": {"$max": "$price"},
                                "min_price": {"$min": "$price"},
                            }
                        }
                    ],
                    "by_tags": [
                        {"$unwind": "$tags"},
                        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
                        {"$sort": {"count": -1}},
                        {"$limit": 5}
                    ]
                }
            }
        ]
        
        cursor = self.get_collection(db).aggregate(pipeline)
        results = await cursor.to_list(length=1)
        if results:
            return results[0]
        return {"overview": [], "by_tags": []}


crud_item = CRUDItem("items", ItemInDB)
