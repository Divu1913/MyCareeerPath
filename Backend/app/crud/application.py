"""CRUD for the `applications` collection.

Adds three helpers on top of `CRUDBase`:
- `get_for_job` — applications for a specific job.
- `get_for_candidate` — applications submitted by a specific candidate.
- `get_for_recruiter` — applications for any job owned by a given user,
  with optional status / job filters.

The recruiter helper is the one the dashboard hits. We pass an
`owner_id` (recruiter's user id) and a status filter; the implementation
joins the items collection to scope the result set, which the endpoint
hydrates into `ApplicationOut` with denormalized candidate + job fields.
"""
from typing import Any, Dict, List, Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.crud.base import CRUDBase
from app.models.application import ApplicationInDB
from app.schemas.application import ApplicationCreate, ApplicationStatusUpdate


class CRUDApplication(CRUDBase[ApplicationInDB, ApplicationCreate, ApplicationStatusUpdate]):
    async def get_for_job(
        self,
        db: AsyncIOMotorDatabase,
        *,
        job_id: ObjectId,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ApplicationInDB]:
        """List applications for a single job, newest first."""
        return await self.get_multi(
            db,
            skip=skip,
            limit=limit,
            filter_query={"job_id": job_id},
        )

    async def get_for_candidate(
        self,
        db: AsyncIOMotorDatabase,
        *,
        candidate_id: ObjectId,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ApplicationInDB]:
        """List applications submitted by a single candidate."""
        return await self.get_multi(
            db,
            skip=skip,
            limit=limit,
            filter_query={"candidate_id": candidate_id},
        )

    async def get_for_recruiter(
        self,
        db: AsyncIOMotorDatabase,
        *,
        owner_id: ObjectId,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        job_id: Optional[ObjectId] = None,
    ) -> List[Dict[str, Any]]:
        """Join applications with the items collection so the result is
        scoped to jobs owned by `owner_id`. Returns raw dicts (not
        `ApplicationInDB`) because we want the joined fields too — the
        endpoint re-shapes them into `ApplicationOut`.

        `status` and `job_id` are optional narrowing filters applied on
        top of the owner scope.
        """
        match_app: Dict[str, Any] = {}
        if status:
            match_app["status"] = status
        if job_id:
            match_app["job_id"] = job_id

        pipeline: List[Dict[str, Any]] = [
            # applications → items (job)
            {
                "$lookup": {
                    "from": "items",
                    "localField": "job_id",
                    "foreignField": "_id",
                    "as": "job",
                }
            },
            {"$unwind": "$job"},
            # scope to jobs this recruiter owns
            {"$match": {"job.owner_id": owner_id, **match_app}},
            # hydrate candidate display fields
            {
                "$lookup": {
                    "from": "users",
                    "localField": "candidate_id",
                    "foreignField": "_id",
                    "as": "candidate",
                }
            },
            {"$unwind": {"path": "$candidate", "preserveNullAndEmptyArrays": True}},
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": limit},
        ]

        cursor = self.get_collection(db).aggregate(pipeline)
        return await cursor.to_list(length=limit)


crud_application = CRUDApplication("applications", ApplicationInDB)
