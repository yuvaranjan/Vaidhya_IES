"""
STT provider — Groq Whisper large-v3-turbo.

T1 task 3 (~1h). Returns BOTH the native-language transcript and an English one;
the UI shows them side by side and the LLM reasons over the English.
"""

import asyncio
from typing import NamedTuple, Protocol

from groq import AsyncGroq

from config import get_settings


class Transcript(NamedTuple):
    native: str
    english: str


class STTProvider(Protocol):
    async def transcribe(self, audio_bytes: bytes, language: str) -> Transcript: ...
    async def healthy(self) -> bool: ...


class GroqWhisperProvider:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = AsyncGroq(api_key=self.settings.groq_api_key) if self.settings.groq_api_key else None

    async def transcribe(self, audio_bytes: bytes, language: str) -> Transcript:
        if not self.client:
            raise RuntimeError("GROQ_API_KEY is not set.")

        audio_file = ("audio.wav", audio_bytes)

        native_task = self.client.audio.transcriptions.create(
            file=audio_file,
            model=self.settings.groq_stt_model,
            language=language,
        )
        english_task = self.client.audio.translations.create(
            file=audio_file,
            model=self.settings.groq_stt_model,
        )

        native_resp, english_resp = await asyncio.gather(native_task, english_task)

        return Transcript(
            native=native_resp.text,
            english=english_resp.text,
        )

    async def healthy(self) -> bool:
        return bool(self.settings.groq_api_key)


def get_stt() -> STTProvider:
    return GroqWhisperProvider()
