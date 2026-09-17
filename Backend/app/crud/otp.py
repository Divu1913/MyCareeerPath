"""OTP storage with TTL expiration and attempt limiting.

Document shape stored in the `otps` collection:
    {
        "_id": ObjectId,
        "identifier": "<email or phone, normalized>",
        "code_hash": "<bcrypt hash of the 6-digit code>",
        "attempts": 0,
        "consumed": False,
        "requested_role": "candidate" | "recruiter" | "admin" | None,
        "purpose": "auth" | "password_reset",
        "created_at": <datetime>,
        "expires_at": <datetime>   # TTL index drops docs past this point
    }

We hash the code (not the identifier) so a stolen DB dump doesn't yield
usable OTPs even if the TTL hasn't fired yet. `requested_role` is captured at
send-otp time and applied to the user document at verify-otp time, so the
chosen role stays bound to the OTP the user actually verified.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field
from pymongo import ASCENDING, DESCENDING

from app.core.security import get_password_hash, verify_password


OTP_TTL_MINUTES = 10
MAX_ATTEMPTS = 5


class OTPRecord(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    identifier: str
    code_hash: str
    attempts: int = 0
    consumed: bool = False
    requested_role: Optional[str] = None
    purpose: str = "auth"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime

    class Config:
        populate_by_name = True


def _normalize_identifier(value: str) -> str:
    stripped = (value or "").strip()
    if "@" in stripped:
        return stripped.lower()
    return stripped


class CRUDOTP:
    collection_name = "otps"

    def __init__(self) -> None:
        pass

    @staticmethod
    def generate_code() -> str:
        """Six-digit numeric OTP. Uses ``secrets`` for cryptographic randomness
        rather than ``random`` so codes aren't predictable across requests."""
        import secrets

        return f"{secrets.randbelow(1_000_000):06d}"

    def get_collection(self, db: AsyncIOMotorDatabase):
        return db[self.collection_name]

    async def create_for_identifier(
        self,
        db: AsyncIOMotorDatabase,
        *,
        identifier: str,
        code: str,
        requested_role: Optional[str] = None,
        purpose: str = "auth",
    ) -> OTPRecord:
        """Hash the code and store a new OTP document. Existing unconsumed
        OTPs for this identifier are invalidated by overwriting (the TTL
        index will sweep stragglers automatically)."""
        normalized = _normalize_identifier(identifier)
        now = datetime.now(timezone.utc)
        record = {
            "identifier": normalized,
            "code_hash": get_password_hash(code),
            "attempts": 0,
            "consumed": False,
            "requested_role": requested_role,
            "purpose": purpose,
            "created_at": now,
            "expires_at": now + timedelta(minutes=OTP_TTL_MINUTES),
        }
        result = await self.get_collection(db).insert_one(record)
        record["_id"] = str(result.inserted_id)
        return OTPRecord(**record)

    async def latest_active(
        self, db: AsyncIOMotorDatabase, *, identifier: str, purpose: str = "auth"
    ) -> Optional[OTPRecord]:
        normalized = _normalize_identifier(identifier)
        doc = await (
            self.get_collection(db)
            .find({
                "identifier": normalized,
                "consumed": False,
                # Legacy OTP records predate the purpose field and are auth OTPs.
                **({"purpose": purpose} if purpose != "auth" else {"$or": [{"purpose": "auth"}, {"purpose": {"$exists": False}}]}),
            })
            .sort("created_at", DESCENDING)
            .limit(1)
            .to_list(length=1)
        )
        if not doc:
            return None
        doc[0]["_id"] = str(doc[0]["_id"])
        return OTPRecord(**doc[0])

    async def consume(self, db: AsyncIOMotorDatabase, *, otp: OTPRecord) -> None:
        """Mark an OTP as consumed. We use this once verify-otp succeeds so the
        same code can't be replayed."""
        await self.get_collection(db).update_one(
            {"_id": ObjectId(otp.id)}, {"$set": {"consumed": True}}
        )

    async def increment_attempts(
        self, db: AsyncIOMotorDatabase, *, otp: OTPRecord
    ) -> int:
        result = await self.get_collection(db).update_one(
            {"_id": ObjectId(otp.id)}, {"$inc": {"attempts": 1}}
        )
        return otp.attempts + (1 if result.modified_count else 0)

    def verify_code(self, *, code: str, otp: OTPRecord) -> bool:
        return verify_password(code, otp.code_hash)

    def is_expired(self, otp: OTPRecord) -> bool:
        expires_at = otp.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) >= expires_at

    def is_locked_out(self, otp: OTPRecord) -> bool:
        return otp.attempts >= MAX_ATTEMPTS

    @staticmethod
    async def ensure_indexes(db: AsyncIOMotorDatabase) -> None:
        """TTL index on `expires_at` so Mongo sweeps expired OTPs without us
        running a cron. We also keep an `(identifier, created_at desc)` lookup
        index so `latest_active` is fast."""
        await db["otps"].create_index(
            [("expires_at", ASCENDING)],
            expireAfterSeconds=0,
            name="otp_ttl_idx",
        )
        await db["otps"].create_index(
            [("identifier", ASCENDING), ("created_at", DESCENDING)],
            name="otp_identifier_created_idx",
        )


crud_otp = CRUDOTP()
