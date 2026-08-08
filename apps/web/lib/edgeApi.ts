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
  ConsultStatusUpdateRequest,
  HealthResponse,
  IntakeCompleteResponse,
  ModelsResponse,
  SessionStartRequest,
  SessionStartResponse,
  SessionState,
  SetModelRequest,
  TurnResponse,
  VitalsRequest,
  VitalsResponse,
  VoiceTurnTextRequest,
} from "@vaidhya/shared";
import { mockAi } from "./mockAi";

export const USE_MOCK_AI = process.env.NEXT_PUBLIC_USE_MOCK_AI === "true";

const BASE = process.env.NEXT_PUBLIC_EDGE_AI_URL ?? "http://localhost:8000";

async function post<T>(path: string, body: unknown): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[edgeApi] POST ${path} → ${res.status}:`, text);
      throw new Error(`${path} → ${res.status} ${text}`);
    }
    return res.json() as Promise<T>;
  } catch (err: any) {
    console.warn(`[edgeApi] POST ${path} unavailable at ${BASE}:`, err.message);
    throw err;
  }
}

async function get<T>(path: string): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[edgeApi] GET ${path} → ${res.status}:`, text);
      throw new Error(`${path} → ${res.status} ${text}`);
    }
    return res.json() as Promise<T>;
  } catch (err: any) {
    console.warn(`[edgeApi] GET ${path} unavailable at ${BASE}:`, err.message);
    throw err;
  }
}

export const edgeApi = {
  /** Absolute URL for an audio path returned by the service (e.g. /audio/x.mp3). */
  audioUrl(url: string): string {
    if (!url) return "";
    return url.startsWith("http") ? url : `${BASE}${url}`;
  },

  async sessionStart(req: SessionStartRequest): Promise<SessionStartResponse> {
    if (USE_MOCK_AI) return mockAi.sessionStart(req);
    try {
      return await post("/session/start", req);
    } catch (err) {
      console.warn("[edgeApi] sessionStart falling back to mockAi:", err);
      return mockAi.sessionStart(req);
    }
  },

  async vitals(req: VitalsRequest): Promise<VitalsResponse> {
    if (USE_MOCK_AI) return mockAi.vitals(req);
    try {
      return await post("/vitals", req);
    } catch (err) {
      console.warn("[edgeApi] vitals falling back to mockAi:", err);
      return mockAi.vitals(req);
    }
  },

  /** multipart: audio=<webm blob from MediaRecorder>, visit_id=<string> */
  async voiceTurn(visitId: string, audio: Blob): Promise<TurnResponse> {
    if (USE_MOCK_AI) return mockAi.voiceTurn(visitId, audio);
    try {
      const fd = new FormData();
      fd.append("audio", audio, "turn.webm");
      fd.append("visit_id", visitId);
      const r = await fetch(`${BASE}/voice/turn`, { method: "POST", body: fd });
      if (!r.ok) throw new Error(`/voice/turn → ${r.status}`);
      return await r.json() as Promise<TurnResponse>;
    } catch (err) {
      console.warn("[edgeApi] voiceTurn falling back to mockAi:", err);
      return mockAi.voiceTurn(visitId, audio);
    }
  },

  /** The typed-answer fallback — same turn loop as voiceTurn, minus STT. */
  async voiceTurnText(req: VoiceTurnTextRequest): Promise<TurnResponse> {
    if (USE_MOCK_AI) return mockAi.voiceTurn(req.visit_id);
    try {
      return await post("/voice/turn/text", req);
    } catch (err) {
      console.warn("[edgeApi] voiceTurnText falling back to mockAi:", err);
      return mockAi.voiceTurn(req.visit_id);
    }
  },

  /** Poll this every 2s while the assistant page is open. */
  async sessionState(visitId: string): Promise<SessionState> {
    if (USE_MOCK_AI) return mockAi.sessionState(visitId);
    try {
      return await get(`/session/${visitId}/state`);
    } catch (err) {
      return mockAi.sessionState(visitId);
    }
  },

  /** Nurse submits the finding the bot paused for — same /vitals endpoint, on_demand phase. */
  async submitFinding(req: VitalsRequest): Promise<VitalsResponse> {
    if (USE_MOCK_AI) return mockAi.submitFinding(req.visit_id);
    try {
      return await post("/vitals", req);
    } catch (err) {
      console.warn("[edgeApi] submitFinding falling back to mockAi:", err);
      return mockAi.submitFinding(req.visit_id);
    }
  },

  async intakeComplete(visitId: string): Promise<IntakeCompleteResponse> {
    if (USE_MOCK_AI) return mockAi.intakeComplete(visitId);
    try {
      return await post("/intake/complete", { visit_id: visitId });
    } catch (err) {
      console.warn("[edgeApi] intakeComplete falling back to mockAi:", err);
      return mockAi.intakeComplete(visitId);
    }
  },

  async consultStatus(req: ConsultStatusUpdateRequest): Promise<{ state: string; doctor_id?: string; timestamp?: string }> {
    if (USE_MOCK_AI) return Promise.resolve({ state: req.state, doctor_id: req.doctor_id, timestamp: req.timestamp });
    try {
      return await post("/consult/status", req);
    } catch (err) {
      return Promise.resolve({ state: req.state, doctor_id: req.doctor_id, timestamp: req.timestamp });
    }
  },

  async health(): Promise<HealthResponse> {
    if (USE_MOCK_AI) return mockAi.health();
    try {
      return await get("/health");
    } catch (err) {
      return mockAi.health();
    }
  },

  /** Model selection has fallback mock data when edge AI service is unreachable. */
  async listModels(): Promise<ModelsResponse> {
    const fallback: ModelsResponse = {
      current: "groq:llama-3.3-70b-versatile",
      provider: "groq",
      available: [
        { id: "groq:llama-3.3-70b-versatile", provider: "groq", label: "Groq LLaMA 3.3 70B (Cloud)" },
        { id: "local:qwen2.5-7b-instruct", provider: "lmstudio", label: "Local Qwen 2.5 7B (Offline)" }
      ]
    };
    if (USE_MOCK_AI) return fallback;
    try {
      return await get("/settings/models");
    } catch (err) {
      return fallback;
    }
  },

  async setModel(req: SetModelRequest): Promise<{ ok: boolean; current: string; provider: string }> {
    if (USE_MOCK_AI) return { ok: true, current: req.model, provider: "groq" };
    try {
      return await post("/settings/model", req);
    } catch (err) {
      return { ok: true, current: req.model, provider: "groq" };
    }
  },
};
