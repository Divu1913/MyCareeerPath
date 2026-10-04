import asyncio
from app.db.mongodb import connect_to_mongo, get_database
from app.core.security import get_password_hash

async def seed():
    await connect_to_mongo()
    db = get_database()
    email = "admin@mycareerpath.com"
    
    await db["users"].update_one(
        {"email": email},
        {"$set": {
            "full_name": "System Admin",
            "email": email,
            "hashed_password": get_password_hash("AdminPassword123!"),
            "role": "admin",
            "is_active": True,
            "is_superuser": True
        }},
        upsert=True
    )
    print("Admin account successfully configured!")

if __name__ == "__main__":
    asyncio.run(seed())
