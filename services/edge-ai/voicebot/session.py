"""
Session store + the nurse-finding state machine.

THE ONE RULE HERE: no asyncio timers, no background tasks. Pending-finding state
is computed from timestamps every time it is read. It cannot race, it survives a
uvicorn restart, and it cannot hang.

Reference: Docs/Project_Vaidhya_V1_Build_Plan.md §4.1
"""

from __future__ import annotations

import json
import sqlite3
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Literal

from config import get_settings
from contracts import PendingFinding, SessionPhase

Resolution = Literal["resume", "resume_without", "remind", "waiting"]


@dataclass
class Finding:
    reading_id: str
    type: str
    instruction_en: str
    requested_at: float
    entered_at: float | None = None
    value_text: str | None = None
    status: Literal["requested", "reminded"] = "requested"


@dataclass
class Turn:
    speaker: str  # patient | bot | doctor
    text_en: str
    text_native: str = ""
    timestamp: float = field(default_factory=time.time)


@dataclass
class Session:
    visit_id: str
    patient_id: str
    language: str
    phase: SessionPhase = "pass_one"
    turns: list[Turn] = field(default_factory=list)
    vitals: list[dict] = field(default_factory=list)
    pending_finding: Finding | None = None
    fired_flags: list[dict] = field(default_factory=list)

    @property
    def turn_count(self) -> int:
        return sum(1 for t in self.turns if t.speaker == "patient")

    def to_json(self) -> str:
        return json.dumps(asdict(self))


def resolve_pending(session: Session) -> Resolution | None:
    """
    Called at the top of GET /session/{visit_id}/state and POST /voice/turn.
    That is the whole mechanism.
    """
    f = session.pending_finding
    if f is None:
        return None

    timeout = get_settings().on_demand_timeout_seconds
    elapsed = time.time() - f.requested_at

    if f.entered_at:  # nurse answered
        session.pending_finding = None
        session.phase = "conversation"
        return "resume"

    if elapsed > 2 * timeout:  # gave up
        # TODO(T1): mark_reading(f.reading_id, status="not_obtained")
        session.pending_finding = None
        session.phase = "conversation"
        return "resume_without"

    if elapsed > timeout and f.status == "requested":
        f.status = "reminded"
        return "remind"  # re-voice the request, once

    return "waiting"


def as_contract(f: Finding | None) -> PendingFinding | None:
    if f is None:
        return None
    return PendingFinding(
        reading_id=f.reading_id,
        type=f.type,
        instruction_en=f.instruction_en,
        elapsed_s=int(time.time() - f.requested_at),
        status=f.status,
    )


class SessionStore:
    """In-memory dict, mirrored into SQLite so a restart mid-demo is survivable."""

    def __init__(self) -> None:
        self._sessions: dict[str, Session] = {}
        self._db_path = get_settings().edge_db_path
        self._init_db()

    def _init_db(self) -> None:
        # .../services/edge-ai/voicebot/session.py → repo root is 3 levels up
        schema = Path(__file__).resolve().parents[3] / "db" / "edge_schema.sql"
        with sqlite3.connect(self._db_path) as conn:
            if schema.exists():
                conn.executescript(schema.read_text(encoding="utf-8"))

    def get(self, visit_id: str) -> Session | None:
        return self._sessions.get(visit_id)

    def put(self, session: Session) -> None:
        self._sessions[session.visit_id] = session
        with sqlite3.connect(self._db_path) as conn:
            conn.execute(
                "insert into sessions (visit_id, payload, updated_at) values (?,?,?) "
                "on conflict(visit_id) do update set payload=excluded.payload, "
                "updated_at=excluded.updated_at",
                (session.visit_id, session.to_json(), str(time.time())),
            )

    def all(self) -> list[Session]:
        return list(self._sessions.values())


store = SessionStore()
