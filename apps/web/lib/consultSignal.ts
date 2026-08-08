"use client";

export type ConsultSignal = {
  type: "doctor_joined";
  visitId: string;
  doctorId?: string;
  timestamp: string;
};

const CHANNEL_NAME = "vaidhya-consult";
const STORAGE_KEY = "vaidhya:consult:last-signal";

function isConsultSignal(value: unknown): value is ConsultSignal {
  const signal = value as Partial<ConsultSignal>;
  return signal?.type === "doctor_joined" && typeof signal.visitId === "string";
}

export function broadcastDoctorJoined(visitId: string, doctorId?: string) {
  if (typeof window === "undefined") return;

  const signal: ConsultSignal = {
    type: "doctor_joined",
    visitId,
    doctorId,
    timestamp: new Date().toISOString(),
  };

  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(signal);
    channel.close();
  } catch {
    // BroadcastChannel is best-effort; localStorage below covers older browsers.
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(signal));
  } catch {
    // Private browsing or disabled storage should not break the consult flow.
  }
}

export function subscribeConsultSignals(
  visitId: string,
  onSignal: (signal: ConsultSignal) => void,
) {
  if (typeof window === "undefined") return () => {};

  const accept = (value: unknown) => {
    if (isConsultSignal(value) && value.visitId === visitId) {
      onSignal(value);
    }
  };

  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => accept(event.data);
  } catch {
    channel = null;
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      accept(JSON.parse(event.newValue));
    } catch {
      // Ignore malformed cross-tab payloads.
    }
  };
  window.addEventListener("storage", onStorage);

  try {
    const last = localStorage.getItem(STORAGE_KEY);
    if (last) accept(JSON.parse(last));
  } catch {
    // Ignore unavailable localStorage.
  }

  return () => {
    channel?.close();
    window.removeEventListener("storage", onStorage);
  };
}
