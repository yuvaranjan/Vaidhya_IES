/**
 * The ONE place the patient UI talks to T1's edge-ai service.
 *
 * Every component calls edgeApi.*; nothing calls fetch("http://localhost:8000")
 * directly. That is what makes the hour-8 flag flip a one-line change instead of
 * a grep across the app.
 *
 *   NEXT_PUBLIC_USE_MOCK_AI=true   → canned responses from lib/mockAi.ts
 *   NEXT_PUBLIC_USE_MOCK_AI=false  → real HTTP to NEXT_PUBLIC_EDGE_AI_URL
 */

import type {
  HealthResponse,
  IntakeCompleteResponse,
  SessionStartRequest,
  SessionStartResponse,
  SessionState,
  TurnResponse,
  VitalsRequest,
  VitalsResponse,
} from "@vaidhya/shared";
import { mockAi } from "./mockAi";

export const USE_MOCK_AI = process.env.NEXT_PUBLIC_USE_MOCK_AI === "true";

const BASE = process.env.NEXT_PUBLIC_EDGE_AI_URL ?? "http://localhost:8000";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const edgeApi = {
  /** Absolute URL for an audio path returned by the service (e.g. /audio/x.mp3). */
  audioUrl(url: string): string {
    if (!url) return "";
    return url.startsWith("http") ? url : `${BASE}${url}`;
  },

  sessionStart(req: SessionStartRequest): Promise<SessionStartResponse> {
    return USE_MOCK_AI ? mockAi.sessionStart(req) : post("/session/start", req);
  },

  vitals(req: VitalsRequest): Promise<VitalsResponse> {
    return USE_MOCK_AI ? mockAi.vitals(req) : post("/vitals", req);
  },

  /** multipart: audio=<webm blob from MediaRecorder>, visit_id=<string> */
  voiceTurn(visitId: string, audio: Blob): Promise<TurnResponse> {
    if (USE_MOCK_AI) return mockAi.voiceTurn(visitId, audio);
    const fd = new FormData();
    fd.append("audio", audio, "turn.webm");
    fd.append("visit_id", visitId);
    return fetch(`${BASE}/voice/turn`, { method: "POST", body: fd }).then((r) => {
      if (!r.ok) throw new Error(`/voice/turn → ${r.status}`);
      return r.json() as Promise<TurnResponse>;
    });
  },

  /** Poll this every 2s while the assistant page is open. */
  sessionState(visitId: string): Promise<SessionState> {
    return USE_MOCK_AI
      ? mockAi.sessionState(visitId)
      : get(`/session/${visitId}/state`);
  },

  /** Nurse submits the finding the bot paused for — same /vitals endpoint, on_demand phase. */
  submitFinding(req: VitalsRequest): Promise<VitalsResponse> {
    return USE_MOCK_AI ? mockAi.submitFinding(req.visit_id) : post("/vitals", req);
  },

  intakeComplete(visitId: string): Promise<IntakeCompleteResponse> {
    return USE_MOCK_AI
      ? mockAi.intakeComplete(visitId)
      : post("/intake/complete", { visit_id: visitId });
  },

  health(): Promise<HealthResponse> {
    return USE_MOCK_AI ? mockAi.health() : get("/health");
  },
};
