"""
Diagnostic report builder + Supabase write (T1 task 10, ~1h).

On /intake/complete, do BOTH:
  1. write the report to Supabase — the durable record, so the queue survives a
     refresh and a doctor who logs in late still sees the visit
  2. publish to vaidhya/queue/new (retained) — so the doctor's queue updates
     live without polling

Neither replaces the other. About 30 lines for both.
"""

import json
import logging
import sqlite3
import uuid

from clock import now_iso
from config import get_settings
from contracts import TOPIC_QUEUE_NEW, IntakeCompleteResponse, UrgencyFlag
from mqtt_client import mqtt
from providers.llm import get_llm
from rules.engine import tier_for
from sync.worker import enqueue, flush_outbox
from voicebot.session import Session

logger = logging.getLogger(__name__)

SUMMARY_PROMPT = """You are Vaidhya. Summarize the intake into a succinct chief complaint (1 line) and a paragraph summary. Return valid JSON."""

async def build_and_publish(session: Session) -> IntakeCompleteResponse:
    llm = get_llm()
    settings = get_settings()

    # 1. Summary from LLM
    prompt = f"Transcript:\n" + "\n".join([f"{t.speaker}: {t.text_en}" for t in session.turns])
    schema = {
        "type": "object",
        "properties": {
            "chief_complaint": {"type": "string"},
            "summary_text": {"type": "string"}
        },
        "required": ["chief_complaint", "summary_text"]
    }
    
    resp_text = await llm.complete(SUMMARY_PROMPT, prompt, json_schema=schema)
    try:
        parsed = json.loads(resp_text)
    except:
        parsed = {"chief_complaint": "Could not generate", "summary_text": "Could not generate summary."}

    chief_complaint = parsed.get("chief_complaint", "Unknown")
    summary_text = parsed.get("summary_text", "No summary.")

    # 2. Urgency
    flags = [UrgencyFlag(**f) for f in session.fired_flags] if session.fired_flags else []
    tier = tier_for(flags)

    report_id = uuid.uuid4().hex

    # 3. Local SQLite is the system of record. Supabase is downstream of the
    #    outbox — this function never waits on the network.
    transcript = [
        {"speaker": t.speaker, "text_en": t.text_en, "text_native": t.text_native}
        for t in session.turns
    ]
    generated_at = now_iso()

    report_row = {
        "report_id": report_id,
        "visit_id": session.visit_id,
        "transcript": transcript,
        "vitals_snapshot": session.vitals,
        "urgency_tier": tier.model_dump(),
        "chief_complaint": chief_complaint,
        "summary_text": summary_text,
        "generated_at": generated_at,
    }

    with sqlite3.connect(settings.edge_db_path) as conn:
        conn.execute(
            "update visits set status = 'awaiting_doctor' where visit_id = ?",
            (session.visit_id,),
        )
        conn.execute(
            "insert into diagnostic_reports (report_id, visit_id, transcript, "
            "vitals_snapshot, urgency_tier, chief_complaint, summary_text, "
            "generated_at) values (?,?,?,?,?,?,?,?)",
            (
                report_id,
                session.visit_id,
                json.dumps(transcript),
                json.dumps(session.vitals),
                tier.model_dump_json(),
                chief_complaint,
                summary_text,
                generated_at,
            ),
        )

        # The status change and the report are two separate rows in the queue so
        # the doctor's list flips to awaiting_doctor even if the report itself
        # is rejected downstream.
        enqueue(
            conn,
            "visits",
            session.visit_id,
            {"visit_id": session.visit_id, "status": "awaiting_doctor"},
        )
        enqueue(conn, "diagnostic_reports", report_id, report_row)

    session.phase = "complete"

    # 4. Best-effort immediate drain, so an online demo shows the queue update
    #    instantly instead of waiting up to a tick. Offline this fails in
    #    milliseconds and the backlog stays queued.
    try:
        await flush_outbox()
    except Exception:
        logger.info("intake/complete: immediate flush failed, left queued")

    # 5. MQTT publish for the live queue update (no-op without a broker).
    mqtt.publish(
        TOPIC_QUEUE_NEW,
        {"visit_id": session.visit_id, "status": "awaiting_doctor", "urgency": tier.tier},
        retain=True,
    )

    return IntakeCompleteResponse(
        report_id=report_id,
        chief_complaint=chief_complaint,
        summary_text=summary_text,
        urgency_tier=tier
    )
