from datetime import datetime, timezone
from typing import Optional, Tuple

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.crud.base import CRUDBase
from app.models.user import UserInDB
from app.schemas.user import UserCreate


def _normalize_identifier(value: str) -> str:
    """Lowercase and strip whitespace. Email-style identifiers become canonical;
    phone-style identifiers keep their digits/+ only."""
    stripped = (value or "").strip()
    if "@" in stripped:
        return stripped.lower()
    return stripped


class CRUDUser(CRUDBase[UserInDB, UserCreate, UserCreate]):
    """User CRUD scoped to the OTP auth flow.

    `authenticate` (password) is gone — verify-otp replaces it. We keep
    `get_by_email` for backwards compatibility with the admin /users endpoint
    but most callers should use `get_by_identifier`.
    """

    async def get_by_email(
        self, db: AsyncIOMotorDatabase, *, email: str
    ) -> Optional[UserInDB]:
        doc = await self.get_collection(db).find_one({"email": email.lower()})
        if doc:
            return self.model(**doc)
        return None

    async def get_by_identifier(
        self, db: AsyncIOMotorDatabase, *, identifier: str
    ) -> Optional[UserInDB]:
        """Look up by either email or phone, depending on identifier shape."""
        normalized = _normalize_identifier(identifier)
        if "@" in normalized:
            doc = await self.get_collection(db).find_one({"email": normalized})
        else:
            doc = await self.get_collection(db).find_one({"phone": normalized})
        if doc:
            return self.model(**doc)
        return None

    async def upsert_by_identifier(
        self,
        db: AsyncIOMotorDatabase,
        *,
        identifier: str,
        full_name: Optional[str] = None,
        role: Optional[str] = None,
    ) -> Tuple[UserInDB, bool]:
        """Create the user on first sight; otherwise refresh full_name if the
        caller supplied one. Returns (user, is_new_user)."""
        normalized = _normalize_identifier(identifier)
        is_email = "@" in normalized
        field = "email" if is_email else "phone"

        existing = await self.get_by_identifier(db, identifier=identifier)
        if existing:
            update = {"updated_at": datetime.now(timezone.utc)}
            if full_name and not existing.full_name:
                update["full_name"] = full_name
            if update:
                await self.get_collection(db).update_one(
                    {"_id": existing.id}, {"$set": update}
                )
            refreshed = await self.get(db, id=existing.id)
            return refreshed, False

        payload_data = {field: normalized, "full_name": full_name or None}
        if role:
            payload_data["role"] = role
        payload = UserCreate(**payload_data)
        user_dict = payload.model_dump(exclude_unset=True)
        created = await super().create(db, obj_in=payload, extra_data=user_dict)
        return created, True

    # NOTE: `create` and `authenticate` from CRUDBase have been overridden
    # implicitly — we don't hash passwords here anymore. Callers go through
    # `upsert_by_identifier` for the OTP flow.


crud_user = CRUDUser("users", UserInDB)
