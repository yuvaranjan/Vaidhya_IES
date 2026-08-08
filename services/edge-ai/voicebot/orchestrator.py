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

from config import get_settings
from contracts import TurnResponse
from voicebot.session import Session, Turn, Finding, as_contract
from providers.llm import get_llm
from providers.stt import get_stt
from providers.tts import get_tts
from providers.translate import get_translate
from prompts import VOICEBOT_SYSTEM_PROMPT, VOICEBOT_SCHEMA

logger = logging.getLogger(__name__)

SAFE_FALLBACK_QUESTION = "Can you tell me a little more about how you are feeling?"

FALLBACK_QUESTIONS = [
    "Where exactly is the discomfort located, and does it spread anywhere else?",
    "On a scale of 1 to 10, how severe would you rate your pain or discomfort right now?",
    "Are you experiencing any other symptoms, such as fever, nausea, or dizziness?",
    "Can you describe how the symptoms have changed since they started?",
]


def format_vitals_context(session: Session) -> str:
    """Return baseline/exam readings in plain language for every LLM turn."""
    labels = {
        "temperature": "Temperature",
        "blood_pressure": "Blood pressure",
        "pulse": "Heart rate",
        "spo2": "SpO2",
        "respiratory_rate": "Respiratory rate",
    }
    values = []
    for reading in session.vitals:
        name = labels.get(reading.get("type", ""), reading.get("type", "Reading"))
        value = reading.get("value_text")
        if value is None:
            value = reading.get("value_numeric")
        if reading.get("type") == "temperature" and value is not None:
            values.append(f"{name}: {value} C (canonical edge value)")
        else:
            values.append(f"{name}: {value}")
    return "; ".join(values) if values else "No baseline vitals recorded yet."


def get_dynamic_fallback(session: Session, patient_text_en: str) -> str:
    text_lower = patient_text_en.lower()
    asked_questions = [t.text_en for t in session.turns if t.speaker == "bot"]

    if "pain" in text_lower or "ache" in text_lower or "hurt" in text_lower:
        if not any("scale" in q.lower() or "severe" in q.lower() for q in asked_questions):
            return "On a scale of 1 to 10, how severe would you rate the pain right now?"
        if not any("where" in q.lower() or "spread" in q.lower() for q in asked_questions):
            return "Where exactly is the pain located, and does it spread to your back or chest?"

    for q in FALLBACK_QUESTIONS:
        if q not in asked_questions:
            return q

    return SAFE_FALLBACK_QUESTION


async def run_turn(session: Session, audio_bytes: bytes) -> TurnResponse:
    stt = get_stt()

    # 1. STT
    try:
        transcript = await stt.transcribe(audio_bytes, session.language)
        return await _process_turn(session, transcript.english, transcript.native)
    except Exception as e:
        logger.error("STT failed: %s", e, exc_info=True)
        return TurnResponse(
            transcript_native="",
            transcript_en="",
            bot_text_en="I'm having trouble hearing you. Could you please type your answer instead?",
            bot_text_native="I'm having trouble hearing you. Could you please type your answer instead?",
            bot_audio_url="",
            next_action="ask_question",
            pending_finding=as_contract(session.pending_finding),
            intake_done=False
        )


async def run_text_turn(session: Session, text_en: str) -> TurnResponse:
    """
    The typed-answer fallback (architecture R7 — always visible, for when the
    mic is unavailable or STT is untrusted). Same decision loop as run_turn,
    minus STT: the typed English is both legs of the transcript, since we do
    not know what language the patient typed in without running it through
    the model first, and the point of this path is not depending on that.
    """
    return await _process_turn(session, text_en, text_en)


async def _process_turn(
    session: Session, patient_text_en: str, patient_text_native: str
) -> TurnResponse:
    llm = get_llm()
    tts = get_tts()
    translate = get_translate()

    is_doctor_reply = session.doctor_question is not None
    speaker = "patient_to_doctor" if is_doctor_reply else "patient"

    session.turns.append(Turn(
        speaker=speaker,
        text_en=patient_text_en,
        text_native=patient_text_native
    ))

    if is_doctor_reply:
        # Patient is replying directly to the attending doctor!
        # Skip LLM question generation so AI doesn't interject with unrelated questions.
        ack_en = "I have sent your reply to the doctor."
        ack_native = await translate.to_native(ack_en, session.language)
        ack_audio = await tts.speak(ack_native, session.language)

        session.turns.append(Turn(
            speaker="bot",
            text_en=ack_en,
            text_native=ack_native
        ))

        return TurnResponse(
            transcript_native=patient_text_native,
            transcript_en=patient_text_en,
            bot_text_en=ack_en,
            bot_text_native=ack_native,
            bot_audio_url=ack_audio,
            next_action="ask_question",
            pending_finding=as_contract(session.pending_finding),
            intake_done=False
        )

    # 2. LLM decision (with 1 retry)
    user_prompt = (
        f"Session Phase: {session.phase}\n"
        f"Questions asked so far (including this one): {session.turn_count}\n"
        "Baseline clinical readings captured before the conversation (use these "
        "to guide questions; do not ask the patient to repeat them): "
        f"{format_vitals_context(session)}\n"
    )

    if session.branch_tags:
        user_prompt += (
            "Vitals fired these branches — prioritise questions in these areas: "
            + ", ".join(session.branch_tags)
            + "\n"
        )
    if session.fired_flags:
        user_prompt += "Abnormal findings: " + "; ".join(
            f["description"] for f in session.fired_flags
        ) + "\n"

    user_prompt += "Turns:\n"
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
            raw = llm_resp_text.strip()
            if raw.startswith("```"):
                lines = raw.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                raw = "\n".join(lines).strip()
            parsed = json.loads(raw)
            break
        except Exception as e:
            logger.warning(f"LLM parsing failed on attempt {attempt}: {e}")
            pass

    if not parsed:
        logger.error("LLM failed twice, using safe fallback.")
        fallback_q = get_dynamic_fallback(session, patient_text_en)
        parsed = {
            "next_action": "ask_question",
            "next_question": fallback_q,
            "nurse_finding_request": None,
            "reasoning": "Fallback due to parse error"
        }

    # 3. Action extraction
    action = parsed.get("next_action", "ask_question")
    if action not in ["ask_question", "request_nurse_finding", "complete_intake"]:
        action = "ask_question"

    nurse_req = parsed.get("nurse_finding_request")
    if action == "request_nurse_finding" and not (
        isinstance(nurse_req, dict) and nurse_req.get("type") and nurse_req.get("instruction")
    ):
        logger.warning(
            "Model chose request_nurse_finding without a valid nurse_finding_request; falling back to a question."
        )
        action = "ask_question"

    # The deterministic backstop (config.max_intake_turns)
    max_turns = get_settings().max_intake_turns
    if action != "complete_intake" and session.turn_count >= max_turns:
        logger.warning(
            "Turn cap (%d) reached without model completing intake; forcing complete_intake.",
            max_turns,
        )
        action = "complete_intake"
        parsed["next_question"] = None

    next_question_en = parsed.get("next_question")

    if action == "ask_question" and not next_question_en:
        logger.warning("Model omitted next_question on ask_question; using fallback.")
        next_question_en = get_dynamic_fallback(session, patient_text_en)

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
    # action can only still be "request_nurse_finding" here if nurse_req
    # passed the validity check above, so no re-checking needed.
    pending_finding_contract = None
    if action == "request_nurse_finding":
        f = Finding(
            reading_id=uuid.uuid4().hex,
            type=nurse_req["type"],
            instruction_en=nurse_req["instruction"],
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

    The implementation lives in consult.py because the return leg is published
    from /voice/turn, not from here — keeping both halves in one module is what
    stops the question and its answer drifting apart.
    """
    from consult import ask_patient

    await ask_patient(session, question_en)
