import asyncio

from app.db.mongodb import connect_to_mongo, get_database
from app.core.security import get_password_hash


async def set_admin():
    await connect_to_mongo()
    db = get_database()
    await db['users'].update_one(
        {'email': 'admin@gmail.com'},
        {'$set': {
            'email': 'admin@gmail.com',
            'password_hash': get_password_hash('Admin1234@Pass'),
            'role': 'admin',
            'is_verified': True
        }},
        upsert=True
    )
    print('✅ Admin account admin@gmail.com configured with password Admin1234@Pass!')


if __name__ == '__main__':
    asyncio.run(set_admin())
