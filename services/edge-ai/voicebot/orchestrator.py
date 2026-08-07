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


async def run_turn(session: Session, audio_bytes: bytes) -> TurnResponse:
    stt = get_stt()

    # 1. STT
    transcript = await stt.transcribe(audio_bytes, session.language)
    return await _process_turn(session, transcript.english, transcript.native)


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

    session.turns.append(Turn(
        speaker="patient",
        text_en=patient_text_en,
        text_native=patient_text_native
    ))

    # 2. LLM decision (with 1 retry)
    # Turn count as a concrete number, not just an instruction to "keep track" —
    # small models follow a stated fact far more reliably than an implied one.
    # This is what makes the "never exceed question 5" rule in the system
    # prompt actually bite instead of being ignored after a few turns.
    user_prompt = (
        f"Session Phase: {session.phase}\n"
        f"Questions asked so far (including this one): {session.turn_count}\n"
    )

    # The rules engine's branch, stated to the model rather than hoped for.
    # This is what makes "bot goes straight to respiratory questions" a
    # consequence of SpO2 91 instead of a coincidence.
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

    # A well-formed nurse finding request needs a type and an instruction —
    # LM Studio's strict mode only enforces that nurse_finding_request is
    # present as a key, not that it is populated (seen live: next_action
    # "request_nurse_finding" with nurse_finding_request and next_question
    # both null). Left unchecked, that turn falls all the way through with
    # no bot text, no pending_finding, and nothing appended to the
    # transcript — the patient sees a blank bubble and the session quietly
    # stalls. Downgrade to a question immediately so the fallback logic
    # below (which already knows how to produce a safe question) handles it.
    nurse_req = parsed.get("nurse_finding_request")
    if action == "request_nurse_finding" and not (
        nurse_req and nurse_req.get("type") and nurse_req.get("instruction")
    ):
        logger.warning(
            "Model chose request_nurse_finding without a valid nurse_finding_request; falling back to a question."
        )
        action = "ask_question"

    # The deterministic backstop (config.max_intake_turns): the prompt asks
    # the model to wrap up by a stated turn, but a 1.7B model does not
    # reliably comply — verified by running the same conversation twice and
    # getting a different turn count each time. Past this cap, the code
    # ends the intake itself rather than leaving convergence to the model.
    max_turns = get_settings().max_intake_turns
    if action != "complete_intake" and session.turn_count >= max_turns:
        logger.warning(
            "Turn cap (%d) reached without model completing intake; forcing complete_intake.",
            max_turns,
        )
        action = "complete_intake"
        parsed["next_question"] = None

    next_question_en = parsed.get("next_question")

    # A local 1.7B model is asked to always fill this in (prompts.py guideline
    # 4), but "asked to" is not "guaranteed to" — LM Studio's strict mode only
    # enforces that the key is present, not that its value is non-empty. An
    # ask_question turn with nothing to ask is a silently stalled
    # conversation, so it falls back rather than sending an empty turn.
    if action == "ask_question" and not next_question_en:
        logger.warning("Model omitted next_question on ask_question; using fallback.")
        next_question_en = SAFE_FALLBACK_QUESTION

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
