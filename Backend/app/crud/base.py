from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from bson import ObjectId
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, collection_name: str, model: Type[ModelType]):
        """
        CRUD object with default methods to Create, Read, Update, Delete (CRUD).
        :param collection_name: MongoDB collection name.
        :param model: A Pydantic model class.
        """
        self.collection_name = collection_name
        self.model = model

    def get_collection(self, db: AsyncIOMotorDatabase):
        return db[self.collection_name]

    async def get(self, db: AsyncIOMotorDatabase, id: Union[str, ObjectId]) -> Optional[ModelType]:
        """Fetch a single document by its ObjectId."""
        if isinstance(id, str):
            if not ObjectId.is_valid(id):
                return None
            id = ObjectId(id)
            
        doc = await self.get_collection(db).find_one({"_id": id})
        if doc:
            return self.model(**doc)
        return None

    async def get_multi(
        self,
        db: AsyncIOMotorDatabase,
        *,
        skip: int = 0,
        limit: int = 100,
        filter_query: Optional[Dict[str, Any]] = None,
        sort: Optional[List[tuple]] = None
    ) -> List[ModelType]:
        """Fetch multiple documents with pagination and sorting."""
        query = filter_query or {}
        cursor = self.get_collection(db).find(query)
        
        if sort:
            cursor = cursor.sort(sort)
        else:
            cursor = cursor.sort("created_at", -1)
            
        cursor = cursor.skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [self.model(**doc) for doc in docs]

    async def count(
        self, db: AsyncIOMotorDatabase, *, filter_query: Optional[Dict[str, Any]] = None
    ) -> int:
        """Count total matching documents in collection."""
        query = filter_query or {}
        return await self.get_collection(db).count_documents(query)

    async def create(
        self, db: AsyncIOMotorDatabase, *, obj_in: CreateSchemaType, extra_data: Optional[Dict[str, Any]] = None
    ) -> ModelType:
        """Insert a new document.

        `exclude_none=True` is critical: models like `UserInDB` declare
        `phone: Optional[str] = None` / `email: Optional[EmailStr] = None`,
        so a naive dump writes the field as an explicit JSON `null` into
        Mongo. That defeats `sparse=True` on the unique `email`/`phone`
        indexes (sparse only skips docs where the field is *absent*, not
        docs where it is `null`), and a second user with no phone on file
        trips `DuplicateKeyError: E11000 ... dup key: { phone: null }`.
        Stripping `None`s keeps sparse indexes behaving as documented.
        """
        obj_in_data = obj_in.model_dump(by_alias=True, exclude_none=True)
        if extra_data:
            obj_in_data.update({k: v for k, v in extra_data.items() if v is not None})

        now = datetime.now(timezone.utc)
        obj_in_data["created_at"] = now
        obj_in_data["updated_at"] = now

        result = await self.get_collection(db).insert_one(obj_in_data)
        created_doc = await self.get_collection(db).find_one({"_id": result.inserted_id})
        return self.model(**created_doc)

    async def update(
        self,
        db: AsyncIOMotorDatabase,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """Update an existing document."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        update_data["updated_at"] = datetime.now(timezone.utc)
        
        doc_id = db_obj.id if hasattr(db_obj, "id") else db_obj.get("_id")
        await self.get_collection(db).update_one(
            {"_id": doc_id},
            {"$set": update_data}
        )
        updated_doc = await self.get_collection(db).find_one({"_id": doc_id})
        return self.model(**updated_doc)

    async def remove(self, db: AsyncIOMotorDatabase, *, id: Union[str, ObjectId]) -> bool:
        """Delete a document by ID."""
        if isinstance(id, str):
            if not ObjectId.is_valid(id):
                return False
            id = ObjectId(id)
            
        result = await self.get_collection(db).delete_one({"_id": id})
        return result.deleted_count > 0
