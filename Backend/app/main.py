from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.mongodb import connect_to_mongo, close_mongo_connection, init_db_indexes
from app.api.v1.api import api_router
from fastapi.staticfiles import StaticFiles

UPLOADS_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for handling startup and shutdown events.
    Initializes async Motor MongoDB client connection pool and creates collection indexes.
    """
    # Startup: Connect to MongoDB & Initialize Indexes
    await connect_to_mongo()
    await init_db_indexes()
    yield
    # Shutdown: Close MongoDB connection pool
    await close_mongo_connection()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# CORS configuration: explicit allowlist merged from settings + safe dev defaults.
# This guarantees `http://localhost:5173` and `http://127.0.0.1:5173` are always
# permitted even if `BACKEND_CORS_ORIGINS` is empty, malformed, or fails to load.
CORS_ALLOWED_ORIGINS: list[str] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# Merge anything provided via settings (string or list) without dropping defaults.
try:
    configured = settings.BACKEND_CORS_ORIGINS or []
    if isinstance(configured, str):
        configured = [configured]
    for origin in configured:
        origin_str = str(origin).strip().rstrip("/")
        if origin_str and origin_str not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(origin_str)
except Exception:
    # If settings parsing ever blows up, the explicit defaults above still apply.
    pass

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# Include v1 API Router under configured prefix and explicitly under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)
if settings.API_V1_STR != "/api/v1":
    app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for container orchestrators (Kubernetes / Cloud Run)"""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }
