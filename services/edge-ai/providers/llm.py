"""
LLM provider — LM Studio (local, the offline claim) with a Groq fallback.

T1 task 2 (~1h). Behaviour that matters:
  - call LM Studio's OpenAI-compatible /chat/completions
  - if it exceeds EDGE_LLM_TIMEOUT_MS or errors, fall back to Groq and say so
  - the fallback must be visible in /health, never silent
"""

from typing import Protocol

from config import get_settings


class LLMProvider(Protocol):
    async def complete(self, system: str, user: str, *, json_schema: dict | None = None) -> str:
        """Return the assistant message content. JSON mode when a schema is given."""
        ...

    async def healthy(self) -> bool: ...


class LMStudioProvider:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def complete(self, system: str, user: str, *, json_schema: dict | None = None) -> str:
        # TODO(T1): httpx.AsyncClient POST {edge_llm_url}/chat/completions,
        # timeout=edge_llm_timeout_ms/1000, then fall back to Groq on failure.
        raise NotImplementedError("T1 task 2")

    async def healthy(self) -> bool:
        # TODO(T1): GET {edge_llm_url}/models with a 2s timeout.
        return False


def get_llm() -> LLMProvider:
    return LMStudioProvider()
