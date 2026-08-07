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
import time
import uuid

from config import get_settings
from contracts import IntakeCompleteResponse, UrgencyFlag
from mqtt_client import mqtt
from contracts import TOPIC_QUEUE_NEW
from providers.llm import get_llm
from rules.engine import tier_for
from voicebot.session import Session

logger = logging.getLogger(__name__)

SUMMARY_PROMPT = """You are Vaidhya. Summarize the intake into a succinct chief complaint (1 line) and a paragraph summary."""

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

    # 3. DB Insert to local SQLite
    transcript_json = json.dumps([{"speaker": t.speaker, "text_en": t.text_en} for t in session.turns])
    vitals_json = json.dumps(session.vitals)
    tier_json = tier.model_dump_json()

    with sqlite3.connect(settings.edge_db_path) as conn:
        conn.execute("UPDATE visits SET status = 'awaiting_doctor' WHERE visit_id = ?", (session.visit_id,))
        conn.execute(
            "INSERT INTO diagnostic_reports (report_id, visit_id, transcript, vitals_snapshot, urgency_tier, chief_complaint, summary_text, generated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (report_id, session.visit_id, transcript_json, vitals_json, tier_json, chief_complaint, summary_text, str(time.time()))
        )
        
        # Write to outbox
        payload = json.dumps({
            "report_id": report_id,
            "visit_id": session.visit_id,
            "chief_complaint": chief_complaint,
            "summary_text": summary_text,
            "urgency_tier": json.loads(tier_json)
        })
        conn.execute(
            "INSERT INTO outbox (entity, entity_id, payload, created_at) VALUES (?, ?, ?, ?)",
            ("diagnostic_reports", report_id, payload, str(time.time()))
        )

    # 4. MQTT Publish (will silently drop or queue if disconnected)
    mqtt.publish(TOPIC_QUEUE_NEW, {"visit_id": session.visit_id, "status": "awaiting_doctor", "urgency": tier.tier}, retain=True)

    return IntakeCompleteResponse(
        report_id=report_id,
        chief_complaint=chief_complaint,
        summary_text=summary_text,
        urgency_tier=tier
    )
