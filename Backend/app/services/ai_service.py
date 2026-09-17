"""Gemini client with ordered API-key failover."""

import os
from typing import Iterable

from google import genai
from google.genai import types

from app.core.config import settings


class AIServiceError(Exception):
    """Raised when Gemini cannot produce a response with any configured key."""


class AIService:
    def __init__(self, keys: Iterable[str] | None = None) -> None:
        self.keys = list(keys) if keys is not None else self._configured_keys()

    @staticmethod
    def _configured_keys() -> list[str]:
        numbered = []
        for index in range(1, 51):
            value = os.getenv(f"GEMINI_API_KEY_{index}") or getattr(settings, f"GEMINI_API_KEY_{index}", "")
            if value:
                numbered.append(value.strip())

        legacy = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        if legacy:
            numbered.append(legacy.strip())

        return list(dict.fromkeys(key for key in numbered if key))

    @staticmethod
    def is_quota_error(error: Exception) -> bool:
        status_code = getattr(error, "status_code", None) or getattr(error, "code", None)
        message = str(error).lower()
        return status_code == 429 or "429" in message or "quota" in message or "resource exhausted" in message or "rate limit" in message

    def generate(
        self,
        *,
        model: str,
        contents: list[types.Content],
        system_instruction: str,
        temperature: float = 0.7,
        max_output_tokens: int = 2048,
    ) -> str:
        if not self.keys:
            raise AIServiceError("No Gemini API keys are configured.")

        last_error: Exception | None = None
        for key in self.keys:
            try:
                client = genai.Client(api_key=key)
                response = client.models.generate_content(
                    model=model,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=temperature,
                        max_output_tokens=max_output_tokens,
                    ),
                )
                if not response.text:
                    raise AIServiceError("Empty response received from AI model.")
                return response.text
            except Exception as error:
                last_error = error
                if not self.is_quota_error(error):
                    raise AIServiceError(f"Gemini request failed: {error}") from error

        raise AIServiceError("All configured Gemini API keys are currently over quota or rate limited.") from last_error


ai_service = AIService()
