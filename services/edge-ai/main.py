"""
Project Vaidhya — edge-ai service (T1 lane).

    uvicorn main:app --reload --port 8000

/health works right now. Everything else answers 501 with the task number that
owns it, so T2 can wire the real client against a live port on day one and see
exactly what is still missing.

T1 tests with curl and requests.http. T1 never opens a browser.
"""

from pathlib import Path

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from config import get_settings
from contracts import (
    ConsultAskRequest,
    HealthResponse,
    IntakeCompleteRequest,
    SessionStartRequest,
    SessionState,
    VitalsRequest,
)
from voicebot.session import as_contract, resolve_pending, store

settings = get_settings()

app = FastAPI(title="Vaidhya edge-ai", version="0.1.0")

# The patient browser is on the same laptop, on :3000.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.web_origin, "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TTS writes mp3s here; the browser plays them straight from /audio/<name>.mp3.
audio_dir = Path(settings.audio_dir)
audio_dir.mkdir(exist_ok=True)
app.mount("/audio", StaticFiles(directory=audio_dir), name="audio")


def not_implemented(task: str) -> JSONResponse:
    return JSONResponse(
        status_code=501,
        content={"error": "not_implemented", "owner": "T1", "task": task},
    )


# ---------------------------------------------------------------------------
# GET /health — build this first; T2 needs the port live.
# ---------------------------------------------------------------------------


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    from providers import get_llm, get_stt, get_translate, get_tts
    from mqtt_client import mqtt

    async def probe(fn) -> str:
        try:
            return "ok" if await fn() else "down"
        except Exception:
            return "down"

    return HealthResponse(
        llm=await probe(get_llm().healthy),
        stt=await probe(get_stt().healthy),
        tts=await probe(get_tts().healthy),
        translate=await probe(get_translate().healthy),
        mqtt="ok" if mqtt.healthy() else "down",
    )


# ---------------------------------------------------------------------------
# Seam A
# ---------------------------------------------------------------------------


@app.post("/session/start")
async def session_start(req: SessionStartRequest):
    # TODO(T1 task 6): create Session, greet in req.language, TTS the greeting.
    return not_implemented("6 — session store")


@app.post("/vitals")
async def vitals(req: VitalsRequest):
    # TODO(T1 task 9): persist readings, run the rules engine, return fired flags.
    # phase="on_demand" is also how the nurse answers a pending finding — set
    # finding.entered_at here so the next poll resumes the conversation.
    return not_implemented("9 — rules engine")


@app.post("/voice/turn")
async def voice_turn(visit_id: str = Form(...), audio: UploadFile = File(...)):
    # TODO(T1 task 7): resolve_pending(session) first, then run the turn loop.
    return not_implemented("7 — voicebot turn loop")


@app.get("/session/{visit_id}/state", response_model=SessionState)
async def session_state(visit_id: str):
    """
    The nurse-finding state machine is evaluated here, lazily, from timestamps.
    No background timers anywhere in this service.
    """
    session = store.get(visit_id)
    if session is None:
        return SessionState(visit_id=visit_id, phase="pass_one", pending_finding=None, turn_count=0)

    resolve_pending(session)
    store.put(session)

    return SessionState(
        visit_id=visit_id,
        phase=session.phase,
        pending_finding=as_contract(session.pending_finding),
        turn_count=session.turn_count,
    )


@app.post("/intake/complete")
async def intake_complete(req: IntakeCompleteRequest):
    # TODO(T1 task 10): summary → Supabase write → publish vaidhya/queue/new.
    return not_implemented("10 — report builder")


@app.post("/consult/ask")
async def consult_ask(req: ConsultAskRequest):
    """TEST CONVENIENCE ONLY. The real path is MQTT — this lets T1 exercise the
    consult relay without a broker."""
    return not_implemented("11 — MQTT consult relay")
