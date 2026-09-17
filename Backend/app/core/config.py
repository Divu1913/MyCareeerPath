import os
from pathlib import Path
from typing import List, Union
from dotenv import load_dotenv
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


# Explicitly load .env into os.environ so any module calling os.getenv(...)
# after settings import sees the same values pydantic-settings reads.
# This makes the chatbot endpoint's os.getenv fallback behave identically to
# settings.GEMINI_API_KEY regardless of the process working directory.
_BACKEND_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(dotenv_path=_BACKEND_ROOT / ".env", override=False)


class Settings(BaseSettings):
    PROJECT_NAME: str = "FastAPI MongoDB Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Security / JWT
    SECRET_KEY: str = "super-secret-jwt-key-change-in-production-min-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # MongoDB Async Motor Configuration
    MONGODB_URL: str = "mongodb://root:example@localhost:27017"
    DATABASE_NAME: str = "fastapi_db"
    MIN_POOL_SIZE: int = 10
    MAX_POOL_SIZE: int = 100

    # Google Gemini AI Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_API_KEY_1: str = ""
    GEMINI_API_KEY_2: str = ""
    GEMINI_API_KEY_3: str = ""
    GEMINI_API_KEY_4: str = ""
    GEMINI_API_KEY_5: str = ""
    # `gemini-3.6-flash` is the active model the project targets.
    # Keep this in lockstep with the fallback in
    # `app/api/v1/endpoints/chatbot.py` and `backend/.env`.
    GEMINI_MODEL: str = "gemini-3.6-flash"

    # Isolated administrator credentials. Store a bcrypt hash, never plaintext.
    # ADMIN_USERNAME is an optional short alias (e.g. "admin") accepted at the
    # admin login endpoint alongside ADMIN_EMAIL.
    ADMIN_EMAIL: str = ""
    ADMIN_USERNAME: str = ""
    ADMIN_PASSWORD_HASH: str = ""
    ADMIN_DISPLAY_NAME: str = "Platform Administrator"
    ADMIN_RESET_TOKEN_EXPIRE_MINUTES: int = 30

    # Optional SMTP relay for transactional admin email (password reset links).
    # When SMTP_HOST / SMTP_FROM_EMAIL are blank the API returns the reset link
    # in its own response instead, mirroring the OTP dev-delivery behaviour.
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    # SMTP_USER is the canonical deployment variable; SMTP_USERNAME remains
    # supported for existing environments.
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "MyCareerPath Admin"
    SMTP_USE_TLS: bool = True

    # Optional candidate-notification SMS providers. Configure either Twilio
    # or Fast2SMS; blank credentials leave that delivery channel skipped.
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""
    # TWILIO_PHONE_NUMBER is the canonical deployment variable; retain the
    # former name for backwards compatibility.
    TWILIO_PHONE_NUMBER: str = ""
    FAST2SMS_API_KEY: str = ""
    FAST2SMS_SENDER_ID: str = ""

    # Public origin used to build the password-reset link.
    FRONTEND_BASE_URL: str = "http://localhost:5173"

    # CORS
    BACKEND_CORS_ORIGINS: List[Union[str, AnyHttpUrl]] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:5173",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    model_config = SettingsConfigDict(
        env_file=str(_BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
