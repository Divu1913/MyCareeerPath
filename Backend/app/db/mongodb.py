import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import pymongo
from app.core.config import settings
from app.crud.otp import crud_otp

logger = logging.getLogger(__name__)


class MongoDB:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None


db_instance = MongoDB()


async def connect_to_mongo():
    """Create asynchronous Motor client connection pool to MongoDB."""
    logger.info("Connecting to MongoDB at %s...", settings.MONGODB_URL)
    db_instance.client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        minPoolSize=settings.MIN_POOL_SIZE,
        maxPoolSize=settings.MAX_POOL_SIZE,
    )
    db_instance.db = db_instance.client[settings.DATABASE_NAME]

    # Ping database to verify connection
    try:
        await db_instance.client.admin.command("ping")
        logger.info("Successfully connected to MongoDB database: %s", settings.DATABASE_NAME)
    except Exception as e:
        logger.error("Failed to connect to MongoDB: %s", e)
        raise e


async def close_mongo_connection():
    """Close MongoDB connection pool gracefully."""
    logger.info("Closing MongoDB connection...")
    if db_instance.client is not None:
        db_instance.client.close()
        logger.info("MongoDB connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    """Dependency / Helper to retrieve current active AsyncIOMotorDatabase instance."""
    if db_instance.db is None:
        raise RuntimeError("Database is not initialized. Please ensure lifespan is executed.")
    return db_instance.db


async def init_db_indexes():
    """Initialize necessary unique and query indexes on startup."""
    db = get_database()

    # User Collection Indexes
    #
    # Defensive cleanup: drop the unique email/phone indexes if they exist so
    # we can recreate them with `sparse=True`. Before the CRUDBase fix that
    # strips `None` values before insert, users were written with explicit
    # `phone: null` / `email: null` fields, which defeats `sparse` (sparse
    # only skips docs where the field is *absent*, not where it's `null`).
    # That left multiple docs sharing `phone: null` in the collection, which
    # would make a fresh `unique` index refuse to build. So before recreating
    # each index we also de-duplicate the orphaned `null`-keyed docs by
    # keeping the oldest (by `created_at`) per field and `$unset`-ing the
    # field on the rest. The de-dupe is a no-op when there are 0 or 1 docs
    # with a `null` field, so it's safe to run on every boot.
    for index_name in ("unique_user_email_idx", "unique_user_phone_idx"):
        try:
            await db["users"].drop_index(index_name)
        except Exception:
            # Index didn't exist (fresh collection, never created, or
            # already dropped). That's fine — we'll create it below.
            pass

    # De-dupe docs that have `phone: null` / `email: null`. Keep the oldest,
    # unset on the rest. This is idempotent and only fires when there's
    # actually more than one such doc.
    for field in ("phone", "email"):
        null_docs = await db["users"].find({field: None}).sort("created_at", 1).to_list(length=None)
        if len(null_docs) > 1:
            keeper_id = null_docs[0]["_id"]
            loser_ids = [d["_id"] for d in null_docs[1:]]
            await db["users"].update_many(
                {"_id": {"$in": loser_ids}},
                {"$unset": {field: ""}},
            )
            logger.warning(
                "De-duped %d user doc(s) sharing null %s; kept oldest _id=%s, unset on the rest.",
                len(loser_ids),
                field,
                keeper_id,
            )

    await db["users"].create_index(
        [("email", pymongo.ASCENDING)],
        unique=True,
        sparse=True,
        name="unique_user_email_idx",
    )
    await db["users"].create_index(
        [("phone", pymongo.ASCENDING)],
        unique=True,
        sparse=True,
        name="unique_user_phone_idx",
    )
    await db["users"].create_index(
        [("role", pymongo.ASCENDING)],
        name="user_role_idx",
    )

    # Items / Products Indexes
    await db["items"].create_index(
        [("owner_id", pymongo.ASCENDING), ("created_at", pymongo.DESCENDING)],
        name="item_owner_created_idx"
    )
    await db["items"].create_index(
        [("title", pymongo.TEXT), ("description", pymongo.TEXT)],
        name="item_text_search_idx"
    )

    # Applications: enforce one application per (job, candidate) and
    # support the recruiter's "applications for my jobs" lookup. The
    # (job_id, candidate_id) pair is also what the endpoint reads in
    # the duplicate-check path, so the index doubles as a quick
    # existence probe.
    await db["applications"].create_index(
        [("job_id", pymongo.ASCENDING), ("candidate_id", pymongo.ASCENDING)],
        unique=True,
        name="unique_application_job_candidate_idx",
    )
    await db["applications"].create_index(
        [("candidate_id", pymongo.ASCENDING), ("created_at", pymongo.DESCENDING)],
        name="application_candidate_created_idx",
    )
    await db["applications"].create_index(
        [("status", pymongo.ASCENDING)],
        name="application_status_idx",
    )

    # OTP collection: TTL + lookup index
    await crud_otp.ensure_indexes(db)

    logger.info("MongoDB indexes verified and created.")
