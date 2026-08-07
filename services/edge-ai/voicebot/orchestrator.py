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

import json
import logging
import time
import uuid

from contracts import TurnResponse
from voicebot.session import Session, Turn, Finding, as_contract
from providers.llm import get_llm
from providers.stt import get_stt
from providers.tts import get_tts
from providers.translate import get_translate
from prompts import VOICEBOT_SYSTEM_PROMPT, VOICEBOT_SCHEMA

logger = logging.getLogger(__name__)

SAFE_FALLBACK_QUESTION = "Can you tell me a little more about how you are feeling?"


async def run_turn(session: Session, audio_bytes: bytes) -> TurnResponse:
    stt = get_stt()
    llm = get_llm()
    tts = get_tts()
    translate = get_translate()

    # 1. STT
    transcript = await stt.transcribe(audio_bytes, session.language)
    patient_text_en = transcript.english
    patient_text_native = transcript.native

    session.turns.append(Turn(
        speaker="patient",
        text_en=patient_text_en,
        text_native=patient_text_native
    ))

    # 2. LLM decision (with 1 retry)
    user_prompt = f"Session Phase: {session.phase}\nTurns:\n"
    for t in session.turns:
        user_prompt += f"{t.speaker}: {t.text_en}\n"

    parsed = None
    for attempt in range(2):
        try:
            llm_resp_text = await llm.complete(
                VOICEBOT_SYSTEM_PROMPT, 
                user_prompt, 
                json_schema=VOICEBOT_SCHEMA
            )
            parsed = json.loads(llm_resp_text)
            break
        except Exception as e:
            logger.warning(f"LLM parsing failed on attempt {attempt}: {e}")
            pass
            
    if not parsed:
        logger.error("LLM failed twice, using safe fallback.")
        parsed = {
            "next_action": "ask_question",
            "next_question": SAFE_FALLBACK_QUESTION,
            "nurse_finding_request": None,
            "extracted_facts": {},
            "fired_branch_tags": [],
            "reasoning": "Fallback due to parse error"
        }

    # 3. Action extraction
    action = parsed.get("next_action", "ask_question")
    if action not in ["ask_question", "request_nurse_finding", "complete_intake"]:
        action = "ask_question"

    next_question_en = parsed.get("next_question")
    
    bot_text_native = ""
    bot_audio_url = ""
    if next_question_en:
        bot_text_native = await translate.to_native(next_question_en, session.language)
        bot_audio_url = await tts.speak(bot_text_native, session.language)
        session.turns.append(Turn(
            speaker="bot",
            text_en=next_question_en,
            text_native=bot_text_native
        ))

    # 4. Nurse finding state
    pending_finding_contract = None
    if action == "request_nurse_finding":
        nurse_req = parsed.get("nurse_finding_request")
        if nurse_req:
            f = Finding(
                reading_id=uuid.uuid4().hex,
                type=nurse_req.get("type", "unknown"),
                instruction_en=nurse_req.get("instruction", ""),
                requested_at=time.time()
            )
            session.pending_finding = f
            session.phase = "awaiting_finding"
            pending_finding_contract = as_contract(f)

    if action == "complete_intake":
        session.phase = "complete"

    return TurnResponse(
        transcript_native=patient_text_native,
        transcript_en=patient_text_en,
        bot_text_en=next_question_en or "",
        bot_text_native=bot_text_native,
        bot_audio_url=bot_audio_url,
        next_action=action,
        pending_finding=pending_finding_contract,
        intake_done=(action == "complete_intake")
    )


async def voice_doctor_question(session: Session, question_en: str) -> None:
    """
    Step 9: a doctor question arrives over MQTT, gets voiced to the patient in
    their language, and the answer is relayed back to the doctor as English text.
    Same pipeline as run_turn, different entry point.
    """
    # TODO(T1 task 11)
    raise NotImplementedError("T1 task 11 — MQTT consult relay")
