import asyncio

from app.db.mongodb import connect_to_mongo, get_database


async def promote():
    await connect_to_mongo()
    db = get_database()
    email = "dgkhodankar@gmail.com"

    result = await db["users"].update_one(
        {"email": email},
        {"$set": {
            "role": "admin",
            "is_superuser": True,
            "is_active": True,
        }},
    )

    if result.matched_count == 0:
        print(f"No user found with email: {email}")
    else:
        print(f"Successfully promoted {email} to admin!")


if __name__ == "__main__":
    asyncio.run(promote())
