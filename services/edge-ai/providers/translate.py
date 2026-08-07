"""
Translate provider — question_bank cache lookup, then IndicTrans2 (or the LLM).

T1 task 5 (~1.5h). The cache is an optimisation, not a source of truth:
A CACHE MISS IS NORMAL, NOT AN ERROR. The system runs correctly with the
question_bank table completely empty.
"""

import re
from typing import Protocol

from config import get_settings


def cache_key(text_en: str) -> str:
    """Normalisation used as question_bank.cache_key: lowercased, punctuation stripped."""
    return re.sub(r"[^a-z0-9 ]", "", text_en.lower()).strip()


class TranslateProvider(Protocol):
    async def to_native(self, text_en: str, language: str) -> str: ...
    async def to_english(self, text_native: str, language: str) -> str: ...
    async def healthy(self) -> bool: ...


class BankThenModelProvider:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def to_native(self, text_en: str, language: str) -> str:
        # TODO(T1): 1) look up question_bank[cache_key(text_en)][f"text_{language}"]
        #           2) on miss, translate and (optionally) write the row back
        raise NotImplementedError("T1 task 5")

    async def to_english(self, text_native: str, language: str) -> str:
        raise NotImplementedError("T1 task 5")

    async def healthy(self) -> bool:
        return True  # the cache path always works, even when empty


def get_translate() -> TranslateProvider:
    return BankThenModelProvider()
