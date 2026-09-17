from fastapi import APIRouter
from app.api.v1.endpoints import (
    applications,
    admin,
    auth,
    chatbot,
    items,
    notifications,
    recommendations,
    reports,
    users,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(chatbot.router, tags=["AI Support Chatbot"])
api_router.include_router(
    recommendations.router, prefix="/recommendations", tags=["Recommendations"]
)
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(items.router, prefix="/items", tags=["Items"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(
    applications.router, prefix="/applications", tags=["Applications"]
)
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
