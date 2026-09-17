from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.config import settings
from app.core.security import decode_token
from app.crud.user import crud_user
from app.db.mongodb import get_database
from app.models.user import UserInDB
from app.schemas.token import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(
    # Repointed from the old password-grant endpoint (removed) to the new
    # OTP verification endpoint. The OAuth2 password grant no longer exists,
    # but we still use OAuth2PasswordBearer as a token-extraction dependency
    # for protected routes. The `tokenUrl` here only affects the docs.
    tokenUrl=f"{settings.API_V1_STR}/auth/verify-otp",
    auto_error=True,
)
optional_oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/verify-otp",
    auto_error=False,
)


async def get_db() -> AsyncIOMotorDatabase:
    """Dependency to provide active Motor MongoDB database instance."""
    return get_database()


async def get_current_user(
    db: AsyncIOMotorDatabase = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> UserInDB:
    """
    Validate JWT access token and return current User document.
    Raises 401 Unauthorized if invalid or expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
        
    token_type = payload.get("type")
    if token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type, access token required",
        )
        
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
        
    token_data = TokenPayload(sub=user_id)
    user = await crud_user.get(db, id=token_data.sub)
    if user is None:
        raise credentials_exception
        
    return user


async def get_optional_current_user(
    db: AsyncIOMotorDatabase = Depends(get_db),
    token: str | None = Depends(optional_oauth2_scheme),
) -> UserInDB | None:
    """Return the signed-in user when a valid bearer token is available."""
    if not token:
        return None
    try:
        payload = decode_token(token)
        if not payload or payload.get("type") != "access" or not payload.get("sub"):
            return None
        return await crud_user.get(db, id=payload["sub"])
    except Exception:
        return None


async def get_current_active_user(
    current_user: UserInDB = Depends(get_current_user),
) -> UserInDB:
    """Ensure user account is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    return current_user


async def get_current_admin_user(
    current_user: UserInDB = Depends(get_current_active_user),
) -> UserInDB:
    """Ensure user has admin role."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Admin privileges required.",
        )
    return current_user
