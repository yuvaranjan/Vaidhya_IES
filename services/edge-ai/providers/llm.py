"""
LLM provider — LM Studio (local, the offline claim) with a Groq fallback.

T1 task 2 (~1h). Behaviour that matters:
  - call LM Studio's OpenAI-compatible /chat/completions
  - if it exceeds EDGE_LLM_TIMEOUT_MS or errors, fall back to Groq and say so
  - the fallback must be visible in /health, never silent
"""

import logging
from typing import Protocol

import httpx
from groq import AsyncGroq

from config import get_settings

logger = logging.getLogger(__name__)


class LLMProvider(Protocol):
    async def complete(self, system: str, user: str, *, json_schema: dict | None = None) -> str:
        """Return the assistant message content. JSON mode when a schema is given."""
        ...

    async def healthy(self) -> bool: ...


class LMStudioProvider:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.groq_client = AsyncGroq(api_key=self.settings.groq_api_key) if self.settings.groq_api_key else None

    async def complete(self, system: str, user: str, *, json_schema: dict | None = None) -> str:
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]

        payload = {
            "model": self.settings.edge_llm_model,
            "messages": messages,
            "temperature": 0.0,
        }

        if json_schema:
            payload["response_format"] = {
                "type": "json_schema",
                "json_schema": {
                    "name": "response",
                    "schema": json_schema,
                    "strict": True,
                }
            }

        timeout = self.settings.edge_llm_timeout_ms / 1000.0

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(
                    f"{self.settings.edge_llm_url}/chat/completions",
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.warning(f"[FALLBACK] LM Studio failed ({e}), falling back to Groq...")
            if not self.groq_client:
                raise RuntimeError("LM Studio failed and GROQ_API_KEY is not set for fallback") from e

            try:
                completion_kwargs = {
                    "model": self.settings.groq_fallback_model,
                    "messages": messages,
                    "temperature": 0.0,
                }
                if json_schema:
                    # Groq supports simple json_object format
                    completion_kwargs["response_format"] = {"type": "json_object"}

                groq_resp = await self.groq_client.chat.completions.create(**completion_kwargs)
                return groq_resp.choices[0].message.content or ""
            except Exception as groq_e:
                logger.error(f"Groq fallback also failed: {groq_e}")
                raise

    async def healthy(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(f"{self.settings.edge_llm_url}/models")
                return resp.status_code == 200
        except Exception:
            return False


def get_llm() -> LLMProvider:
    return LMStudioProvider()
