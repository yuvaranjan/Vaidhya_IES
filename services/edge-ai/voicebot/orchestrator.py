"""
The voicebot turn loop — the core of T1's lane (task 7, ~2.5h).

One turn:
    audio in
      → STT (native + English)
      → append to transcript
      → LLM decides next_action (JSON schema, with a retry then a safe fallback)
      → translate the chosen question to the patient's language
      → TTS
      → TurnResponse out

Two things not to skip:
  - JSON parse failure must retry ONCE, then fall back to a fixed safe question.
    A crashed turn loses the whole session; a slightly worse question does not.
  - The English text goes back on every response, always. The UI shows it.

Reference: architecture §5.1-5.2, Docs/Project_Vaidhya_V1_Build_Plan.md §4
"""

from contracts import TurnResponse
from voicebot.session import Session

SAFE_FALLBACK_QUESTION = "Can you tell me a little more about how you are feeling?"


async def run_turn(session: Session, audio_bytes: bytes) -> TurnResponse:
    # TODO(T1 task 7)
    raise NotImplementedError("T1 task 7 — the voicebot turn loop")


async def voice_doctor_question(session: Session, question_en: str) -> None:
    """
    Step 9: a doctor question arrives over MQTT, gets voiced to the patient in
    their language, and the answer is relayed back to the doctor as English text.
    Same pipeline as run_turn, different entry point.
    """
    # TODO(T1 task 11)
    raise NotImplementedError("T1 task 11 — MQTT consult relay")
