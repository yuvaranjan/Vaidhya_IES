"""
TTS provider — edge-tts. No API key, good Indic voices.

T1 task 4 (~1h). Writes an mp3 into AUDIO_DIR and returns the URL path that
main.py serves statically, e.g. "/audio/8f3a....mp3".
"""

import os
import uuid
from typing import Protocol

import edge_tts

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
        os.makedirs(self.settings.audio_dir, exist_ok=True)

    async def speak(self, text: str, language: str) -> str:
        voice = VOICES.get(language, VOICES["en"])
        filename = f"{uuid.uuid4().hex}.mp3"
        filepath = os.path.join(self.settings.audio_dir, filename)
        
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(filepath)
        
        return f"/audio/{filename}"

    async def healthy(self) -> bool:
        return True


def get_tts() -> TTSProvider:
    return EdgeTTSProvider()
