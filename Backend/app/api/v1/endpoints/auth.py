"""OTP-based authentication endpoints.

`POST /api/v1/auth/send-otp`
    Upserts a user by email/phone, generates a 6-digit code, hashes it, and
    stores it in the `otps` collection with a 10-minute TTL. While no real
    delivery channel is wired up the code is returned in the response so the
    frontend can render it in a dev banner.

`POST /api/v1/auth/verify-otp`
    Looks up the latest unconsumed OTP for the identifier, verifies the
    submitted code against the bcrypt hash, and returns the same JWT pair
    the old password flow did.

`GET /api/v1/auth/me`
    Unchanged — still requires an access JWT.
"""
import logging
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from app.api import deps
from app.crud.otp import crud_otp, OTP_TTL_MINUTES, MAX_ATTEMPTS
from app.crud.user import crud_user
from app.core.security import create_access_token, create_refresh_token, get_password_hash, verify_password
from app.models.user import UserInDB
from app.services.notification_service import dispatch_notification
from app.schemas.otp import (
    SendOtpRequest,
    SendOtpResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
)
from app.schemas.user import PasswordLoginRequest, PasswordRegisterRequest, UserOut

logger = logging.getLogger(__name__)

router = APIRouter()


class ForgotPasswordSendOtpRequest(BaseModel):
    identifier: str = Field(..., min_length=3, max_length=254)


class ForgotPasswordResetRequest(ForgotPasswordSendOtpRequest):
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")
    password: str = Field(..., min_length=8, max_length=128)


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
# E.164-style phone (very loose — accepts +, digits, dashes, spaces, parens).
PHONE_RE = re.compile(r"^\+?[\d\-\s()]{6,20}$")

# Indian 10-digit mobile, starting with 6-9 (the only valid prefixes for
# post-2010 Indian mobile numbers — see TRAI numbering plan).
INDIAN_MOBILE_RE = re.compile(r"^[6-9]\d{9}$")


def _normalize_indian_phone(digits: str) -> str | None:
    """Strip a leading +91 / 91 / 0 from a digit-only string and return the
    resulting 10-digit Indian mobile number, or None if the result isn't a
    valid 10-digit number starting with 6-9.

    Accepted inputs (digit-only, after we've stripped non-digits):
      - "9876543210"       -> "9876543210"  (already clean)
      - "09876543210"      -> "9876543210"  (leading 0)
      - "919876543210"     -> "9876543210"  (country code 91)
      - "+919876543210"    -> "9876543210"  (the `+` is stripped by re.sub above)
    Anything else (e.g. "987654321" / "1234567890" / "5678901234") returns None.
    """
    if len(digits) == 13 and digits.startswith("910"):
        # Defensive: someone pasted "9109876543210" by mistake.
        digits = digits[3:]
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]

    if INDIAN_MOBILE_RE.match(digits):
        return digits
    return None


def _classify_identifier(identifier: str) -> tuple[str, str]:
    """Return (channel, cleaned_identifier) based on the identifier shape. Raise 422
    via HTTPException if neither matches."""
    normalized = identifier.strip()
    if "@" in normalized:
        if EMAIL_RE.match(normalized):
            return "email", normalized.lower()
    else:
        # Clean phone number: drop +, spaces, dashes, parens, etc.
        digits = re.sub(r"\D", "", normalized)
        cleaned = _normalize_indian_phone(digits)
        if cleaned:
            return "phone", cleaned

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Identifier must be a valid email address or 10-digit Indian mobile number starting with 6-9 (e.g. 9876543210).",
    )


async def _find_existing_user(
    db: AsyncIOMotorDatabase, *, channel: str, identifier: str
) -> UserInDB | None:
    lookup_value = identifier.lower() if channel == "email" else identifier
    doc = await db["users"].find_one(
        {"$or": [{"email": lookup_value}, {"phone": identifier}]}
    )
    return UserInDB(**doc) if doc else None


def _existing_account_error(existing_user: UserInDB, requested_role: str | None = None) -> str:
    role = existing_user.role or "user"
    if requested_role == "admin" and role != "admin":
        return (
            f"This email/phone is already registered as a {role}. "
            "Admin access is not available for this account. Run the local "
            "admin seed script for the approved admin phone, or sign in using "
            "the existing role account."
        )
    return (
        f"This email/phone is already registered as a {role}. "
        "Please sign in using your existing role account."
    )


@router.post(
    "/send-otp",
    response_model=SendOtpResponse,
    status_code=status.HTTP_200_OK,
)
async def send_otp(
    payload: SendOtpRequest,
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
):
    """Generate and (dev-mode) return a 6-digit OTP for the identifier."""
    channel, cleaned_id = _classify_identifier(payload.identifier)

    # Check both email and phone fields before generating an OTP or creating a user.
    existing_user = await _find_existing_user(
        db, channel=channel, identifier=cleaned_id
    )
    if existing_user and payload.role != existing_user.role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=_existing_account_error(existing_user, payload.role),
        )
    if payload.is_signup and existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=_existing_account_error(existing_user, payload.role),
        )

    # For sign in: reject if account not found
    if not payload.is_signup and not existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account not found. Please register first.",
        )

    user, is_new_user = await crud_user.upsert_by_identifier(
        db,
        identifier=cleaned_id,
        full_name=payload.full_name,
        role=payload.role if payload.is_signup else None,
    )

    code = crud_otp.generate_code()
    await crud_otp.create_for_identifier(
        db,
        identifier=cleaned_id,
        code=code,
        requested_role=payload.role,
    )

    delivery = await dispatch_notification(
        db, user.id, "Your MyCareerPath verification code",
        f"Your verification code is {code}. It expires in {OTP_TTL_MINUTES} minutes.",
    )
    # Retain this local-development fallback. The OTP is never logged in a
    # real deployment where a delivery channel is configured.
    logger.warning(
        "[DEV OTP] %s -> %s (channel=%s, user_id=%s, delivery=%s)",
        cleaned_id,
        code,
        channel,
        user.id,
        delivery,
    )

    return SendOtpResponse(
        identifier=cleaned_id,
        channel=channel,
        expires_in_seconds=OTP_TTL_MINUTES * 60,
        is_new_user=is_new_user,
        dev_code=code,
    )


@router.post(
    "/verify-otp",
    response_model=VerifyOtpResponse,
    status_code=status.HTTP_200_OK,
)
async def verify_otp(
    payload: VerifyOtpRequest,
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
):
    """Validate the OTP and issue an access + refresh JWT pair."""
    channel, cleaned_id = _classify_identifier(payload.identifier)  # 422 on garbage shape

    otp = await crud_otp.latest_active(db, identifier=cleaned_id)
    if not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP for this identifier. Request a new one.",
        )
    if crud_otp.is_expired(otp):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Request a new one.",
        )
    if crud_otp.is_locked_out(otp):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many attempts. Request a new OTP.",
        )

    if not crud_otp.verify_code(code=payload.code, otp=otp):
        new_attempts = await crud_otp.increment_attempts(db, otp=otp)
        remaining = max(0, MAX_ATTEMPTS - new_attempts)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP. {remaining} attempt(s) remaining.",
        )

    user = await crud_user.get_by_identifier(db, identifier=cleaned_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive or missing.",
        )

    requested_role = otp.requested_role or payload.role
    if requested_role != payload.role or (
        not payload.is_signup and user.role not in {requested_role, "user", "manager"}
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=_existing_account_error(user, payload.role),
        )

    await crud_otp.consume(db, otp=otp)

    if payload.is_signup:
        await db["users"].update_one(
            {"_id": user.id},
            {"$set": {"role": requested_role, "otp_verified": True}},
        )
        user = await crud_user.get(db, id=user.id)

    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))
    return VerifyOtpResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=str(user.id),
    )


@router.post("/register", response_model=VerifyOtpResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: PasswordRegisterRequest,
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
):
    """Set a password after the identifier has completed signup OTP verification."""
    _, cleaned_id = _classify_identifier(payload.identifier)
    user = await crud_user.get_by_identifier(db, identifier=cleaned_id)
    if not user or not user.otp_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verify the mobile number or email with OTP before registering.",
        )
    if user.role != payload.role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration role does not match OTP verification.")
    if user.password_hash:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account already registered. Please log in.")

    result = await db["users"].update_one(
        {"_id": user.id, "otp_verified": True, "password_hash": {"$exists": False}},
        {"$set": {
            "password_hash": get_password_hash(payload.password),
            "otp_verified": False,
            "updated_at": datetime.now(timezone.utc),
            **({"full_name": payload.full_name} if payload.full_name else {}),
        }},
    )
    if not result.modified_count:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account registration could not be completed.")

    return VerifyOtpResponse(
        access_token=create_access_token(subject=str(user.id)),
        refresh_token=create_refresh_token(subject=str(user.id)),
        user_id=str(user.id),
    )


@router.post("/login", response_model=VerifyOtpResponse)
async def login(
    payload: PasswordLoginRequest,
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
):
    """Authenticate a candidate or recruiter using a password."""
    _, cleaned_id = _classify_identifier(payload.identifier)
    user = await crud_user.get_by_identifier(db, identifier=cleaned_id)
    try:
        password_match = bool(user and user.password_hash and verify_password(payload.password, user.password_hash))
    except Exception:
        password_match = False
    if (
        not user
        or user.role == "admin"
        or not user.is_active
        or not password_match
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid identifier or password")

    await db["users"].update_one(
        {"_id": user.id},
        {"$set": {"last_login": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)}},
    )

    return VerifyOtpResponse(
        access_token=create_access_token(subject=str(user.id)),
        refresh_token=create_refresh_token(subject=str(user.id)),
        user_id=str(user.id),
    )


@router.post("/forgot-password/send-otp", response_model=SendOtpResponse)
async def send_password_reset_otp(
    payload: ForgotPasswordSendOtpRequest,
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
):
    """Create a reset-only OTP for an existing candidate or recruiter."""
    channel, cleaned_id = _classify_identifier(payload.identifier)
    user = await crud_user.get_by_identifier(db, identifier=cleaned_id)
    if not user or user.role not in {"candidate", "recruiter"} or not user.is_active:
        # Keep the response generic to avoid disclosing registered accounts.
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unable to send a password reset code for this account")
    code = crud_otp.generate_code()
    await crud_otp.create_for_identifier(
        db, identifier=cleaned_id, code=code, requested_role=user.role, purpose="password_reset"
    )
    delivery = await dispatch_notification(
        db, user.id, "Your MyCareerPath password reset code",
        f"Your password reset code is {code}. It expires in {OTP_TTL_MINUTES} minutes.",
    )
    logger.warning("[DEV PASSWORD RESET OTP] %s -> %s (delivery=%s)", cleaned_id, code, delivery)
    return SendOtpResponse(
        identifier=cleaned_id, channel=channel, expires_in_seconds=OTP_TTL_MINUTES * 60,
        is_new_user=False, dev_code=code,
    )


@router.post("/forgot-password/reset")
async def reset_password(
    payload: ForgotPasswordResetRequest,
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
):
    """Verify a reset OTP once and replace the candidate/recruiter password."""
    _, cleaned_id = _classify_identifier(payload.identifier)
    otp = await crud_otp.latest_active(db, identifier=cleaned_id, purpose="password_reset")
    if not otp or crud_otp.is_expired(otp):
        raise HTTPException(status_code=400, detail="No active password reset code. Request a new one.")
    if crud_otp.is_locked_out(otp):
        raise HTTPException(status_code=429, detail="Too many attempts. Request a new password reset code.")
    if not crud_otp.verify_code(code=payload.code, otp=otp):
        attempts = await crud_otp.increment_attempts(db, otp=otp)
        raise HTTPException(status_code=400, detail=f"Invalid reset code. {max(0, MAX_ATTEMPTS - attempts)} attempt(s) remaining.")
    user = await crud_user.get_by_identifier(db, identifier=cleaned_id)
    if not user or user.role not in {"candidate", "recruiter"} or not user.is_active:
        raise HTTPException(status_code=400, detail="Password reset is not available for this account")
    await crud_otp.consume(db, otp=otp)
    await db["users"].update_one(
        {"_id": user.id},
        {"$set": {"password_hash": get_password_hash(payload.password), "updated_at": datetime.now(timezone.utc)}},
    )
    return {"detail": "Password reset successfully. Please sign in."}


@router.get("/me", response_model=UserOut)
async def read_users_me(
    current_user: UserInDB = Depends(deps.get_current_active_user),
):
    """Get profile information of the currently authenticated user."""
    return current_user
