"""
TTS provider — edge-tts. No API key, good Indic voices.

T1 task 4 (~1h). Writes an mp3 into AUDIO_DIR and returns the URL path that
main.py serves statically, e.g. "/audio/8f3a....mp3".
"""

from typing import Protocol

from config import get_settings

# edge-tts voice per language. Verify these in the hour-2.5 risk spike —
# a voice name that does not exist fails at call time, not at import time.
VOICES = {
    "ml": "ml-IN-MidhunNeural",
    "ta": "ta-IN-ValluvarNeural",
    "hi": "hi-IN-MadhurNeural",
    "en": "en-IN-PrabhatNeural",
}


class TTSProvider(Protocol):
    async def speak(self, text: str, language: str) -> str:
        """Synthesize and return a URL path under /audio/."""
        ...

    async def healthy(self) -> bool: ...


class EdgeTTSProvider:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def speak(self, text: str, language: str) -> str:
        # TODO(T1): edge_tts.Communicate(text, VOICES[language]).save(path)
        raise NotImplementedError("T1 task 4")

    async def healthy(self) -> bool:
        return False


def get_tts() -> TTSProvider:
    return EdgeTTSProvider()
