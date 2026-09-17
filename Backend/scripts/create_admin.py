"""Create or promote an admin account by canonical Indian mobile number.

Usage from the repository root:
    python Backend/scripts/create_admin.py
    python Backend/scripts/create_admin.py --phone "+91 98503 39411"

The script is idempotent. It sets both ``role=admin`` and ``is_superuser`` so
the seeded account works with the backend and the admin frontend guard.
"""
import argparse
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from bson import ObjectId
from pymongo import MongoClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.core.config import settings


def normalize_indian_phone(value: str) -> str:
    digits = re.sub(r"\D", "", value or "")
    if len(digits) == 13 and digits.startswith("910"):
        digits = digits[3:]
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    if not re.fullmatch(r"[6-9]\d{9}", digits):
        raise ValueError("phone must be a valid 10-digit Indian mobile number")
    return digits


def main() -> None:
    parser = argparse.ArgumentParser(description="Create or promote a MyCareerPath admin account")
    parser.add_argument("--phone", default="9850339411", help="Indian mobile number to promote")
    parser.add_argument("--name", default="Platform Administrator", help="Name for a newly created account")
    args = parser.parse_args()
    phone = normalize_indian_phone(args.phone)
    now = datetime.now(timezone.utc)

    client = MongoClient(settings.MONGODB_URL, serverSelectionTimeoutMS=10000)
    try:
        client.admin.command("ping")
        users = client[settings.DATABASE_NAME]["users"]
        existing = users.find_one({"phone": phone})
        if existing:
            result = users.update_one(
                {"_id": existing["_id"]},
                {"$set": {"role": "admin", "is_superuser": True, "is_active": True, "updated_at": now}},
            )
            action = "promoted" if result.modified_count else "already configured"
            user_id = existing["_id"]
        else:
            user_id = ObjectId()
            users.insert_one({
                "_id": user_id,
                "phone": phone,
                "full_name": args.name,
                "role": "admin",
                "is_superuser": True,
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            })
            action = "created"
        print(f"Admin account {action}: phone={phone}, user_id={user_id}")
    finally:
        client.close()


if __name__ == "__main__":
    main()