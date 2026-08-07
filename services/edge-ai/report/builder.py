"""
Diagnostic report builder + Supabase write (T1 task 10, ~1h).

On /intake/complete, do BOTH:
  1. write the report to Supabase — the durable record, so the queue survives a
     refresh and a doctor who logs in late still sees the visit
  2. publish to vaidhya/queue/new (retained) — so the doctor's queue updates
     live without polling

Neither replaces the other. About 30 lines for both.
"""

from contracts import IntakeCompleteResponse
from voicebot.session import Session


async def build_and_publish(session: Session) -> IntakeCompleteResponse:
    # TODO(T1 task 10):
    #   summary = one LLM call over transcript + vitals + findings (prompts.SUMMARY_PROMPT)
    #   urgency = rules.engine.tier_for(session.fired_flags)
    #   db: insert diagnostic_reports, update visits.status = 'awaiting_doctor'
    #   mqtt: publish TOPIC_QUEUE_NEW, retain=True, qos=1
    raise NotImplementedError("T1 task 10")
