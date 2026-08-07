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
from model_settings import get_active

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

        active = get_active()
        if active.provider == "groq":
            # Chosen explicitly from the settings page — this is primary, not
            # a fallback, so a Groq failure here is a real error, not a
            # reason to fall further back to anything.
            return await self._complete_groq(messages, active.model, json_schema)

        return await self._complete_lmstudio(messages, active.model, json_schema)

    async def _complete_lmstudio(
        self, messages: list[dict], model: str, json_schema: dict | None
    ) -> str:
        payload = {
            "model": model,
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
            return await self._complete_groq(messages, self.settings.groq_fallback_model, json_schema)

    async def _complete_groq(
        self, messages: list[dict], model: str, json_schema: dict | None
    ) -> str:
        if not self.groq_client:
            raise RuntimeError("GROQ_API_KEY is not set")
        try:
            completion_kwargs = {
                "model": model,
                "messages": messages,
                "temperature": 0.0,
            }
            if json_schema:
                # Groq's chat endpoint only supports the loose json_object
                # mode, not a schema — the field names in the prompt are
                # doing the enforcing here, not the API.
                completion_kwargs["response_format"] = {"type": "json_object"}

            groq_resp = await self.groq_client.chat.completions.create(**completion_kwargs)
            return groq_resp.choices[0].message.content or ""
        except Exception as groq_e:
            logger.error(f"Groq call failed: {groq_e}")
            raise

    async def healthy(self) -> bool:
        active = get_active()
        if active.provider == "groq":
            return bool(self.settings.groq_api_key)
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(f"{self.settings.edge_llm_url}/models")
                return resp.status_code == 200
        except Exception:
            return False


def get_llm() -> LLMProvider:
    return LMStudioProvider()
