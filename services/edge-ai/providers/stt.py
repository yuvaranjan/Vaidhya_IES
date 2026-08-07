"""
STT provider — Groq Whisper large-v3-turbo.

T1 task 3 (~1h). Returns BOTH the native-language transcript and an English one;
the UI shows them side by side and the LLM reasons over the English.
"""

from typing import NamedTuple, Protocol

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

    async def transcribe(self, audio_bytes: bytes, language: str) -> Transcript:
        # TODO(T1): groq.audio.transcriptions.create(model=groq_stt_model,
        #   file=..., language=language) for the native text, then
        #   .translations.create(...) for the English. Two calls, both cheap.
        raise NotImplementedError("T1 task 3")

    async def healthy(self) -> bool:
        return bool(self.settings.groq_api_key)


def get_stt() -> STTProvider:
    return GroqWhisperProvider()
