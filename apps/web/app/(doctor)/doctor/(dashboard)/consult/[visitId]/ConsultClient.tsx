"use client";

import { useState, useEffect, useRef } from "react";
import { getMqttClient, subscribeJson, publishJson, disconnectMqtt } from "@/lib/mqtt";
import { topics, createDedupe } from "@vaidhya/shared";
import type { Visit as MockVisit } from "@/lib/queue";
import type { PatientToDoctorMessage, DoctorToPatientMessage } from "@vaidhya/shared";
import { 
  FileText, 
  Send, 
  ShieldCheck, 
  Pill, 
  User, 
  Clock, 
  Sparkles,
  ArrowRight,
  Activity
} from "lucide-react";

export function ConsultClient({
  visit,
  doctorId,
}: {
  visit: MockVisit;
  doctorId: string;
}) {
  const [messages, setMessages] = useState<Array<DoctorToPatientMessage | PatientToDoctorMessage>>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const client = getMqttClient(doctorId);
    if (!client) return;

    const isDuplicate = createDedupe(200);

    const unsubscribe = subscribeJson<PatientToDoctorMessage>(
      client,
      topics.patientToDoctor(visit.visitId),
      (payload) => {
        if (isDuplicate(payload.message_id)) return;
        setMessages((prev) => [...prev, payload]);
      }
    );

    return () => {
      unsubscribe();
      disconnectMqtt();
    };
  }, [doctorId, visit.visitId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const msg: DoctorToPatientMessage = {
      message_id: crypto.randomUUID(),
      sender: "doctor",
      text: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    const client = getMqttClient(doctorId);
    if (client) {
      publishJson(client, topics.doctorToPatient(visit.visitId), msg);
    } else {
      // Single-laptop fallback: hit the edge service's HTTP consult endpoint
      // directly. Same relay, same voicebot, no broker in the middle.
      const base =
        process.env.NEXT_PUBLIC_EDGE_AI_URL ?? "http://localhost:8000";
      void fetch(`${base}/consult/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visit_id: visit.visitId, question_en: msg.text }),
      }).catch((err) => console.error("[consult] HTTP fallback failed", err));
    }

    setMessages((prev) => [...prev, msg]);
    setInputValue("");
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 p-4 sm:p-6 h-[88vh]">
      {/* Left Pane: Diagnostic Report (Section 6: Card Spec) */}
      <div className="w-full lg:w-1/3 flex flex-col bg-card border border-border rounded-xl shadow-soft p-6 overflow-y-auto space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-0.5">Clinical Evaluation</p>
            <h2 className="text-xl font-bold text-foreground tracking-[-0.025em]">Diagnostic Report</h2>
          </div>
          <a 
            href={`/doctor/prescribe/${visit.visitId}`}
            className="bg-primary text-primary-foreground px-3.5 py-2 rounded-lg font-bold text-xs hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <Pill className="w-3.5 h-3.5 text-accent" />
            <span>Prescribe</span>
          </a>
        </div>

        {/* Patient Bio */}
        <div className="p-3.5 bg-background border border-border rounded-xl space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1">
            <User className="w-3 h-3 text-accent" /> Patient Record
          </p>
          <p className="text-base font-bold text-foreground">{visit.patientName}</p>
          <p className="text-xs text-muted-foreground font-mono">Visit ID: {visit.visitId}</p>
        </div>

        {/* Chief Complaint */}
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Chief Complaint</p>
          <p className="text-sm font-semibold text-foreground bg-background p-3 rounded-lg border border-border">
            {visit.chiefComplaint}
          </p>
        </div>

        {/* Diagnostic Summary */}
        <div className="space-y-1 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-accent" /> AI Diagnostic Synthesis
          </p>
          <div className="bg-background p-4 rounded-xl border border-border text-xs text-foreground font-medium leading-relaxed">
            {visit.summaryText}
          </div>
        </div>

        {/* Urgency Tier */}
        <div className="pt-2">
          <div className={`p-3.5 rounded-xl border font-bold text-xs flex items-center justify-between ${
            visit.urgency === "urgent" ? "bg-destructive/10 border-destructive/20 text-destructive" :
            visit.urgency === "elevated" ? "bg-[#EEF3FB] border-[#D1E0F5] text-[#315A94]" :
            "bg-[#E5F5F3] border-[#C2E8E4] text-[#14736A]"
          }`}>
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Triage Urgency Level
            </span>
            <span className="uppercase tracking-widest text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/80 shadow-sm">
              {visit.urgency}
            </span>
          </div>
        </div>
      </div>

      {/* Right Pane: Live Doctor-Patient Chat */}
      <div className="w-full lg:w-2/3 flex flex-col bg-card border border-border rounded-xl shadow-soft overflow-hidden">
        
        {/* Chat Header */}
        <div className="bg-card px-6 py-4 border-b border-border flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.02)] z-10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">Active Telehealth Session</p>
            <h3 className="font-bold text-foreground text-base">Direct Clinical Chat</h3>
          </div>
          <span className="text-[10px] uppercase tracking-[0.14em] bg-accent/10 text-accent border border-accent/20 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
            MQTT Real-time Sync
          </span>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs font-semibold space-y-2">
              <ShieldCheck className="w-8 h-8 text-accent opacity-50" />
              <p>Direct consultation channel open. Type a message below to begin.</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.message_id} className={`flex flex-col ${m.sender === "doctor" ? "items-end" : "items-start"}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 px-1">
                  {m.sender === "doctor" ? "Attending Doctor (You)" : visit.patientName}
                </span>
                <div className={`max-w-[76%] px-4 py-3 shadow-sm text-xs leading-relaxed ${
                  m.sender === "doctor" 
                    ? "bg-primary text-primary-foreground rounded-xl rounded-tr-sm font-semibold" 
                    : "bg-card border border-border text-foreground rounded-xl rounded-tl-sm font-medium"
                }`}>
                  <p>{m.text}</p>
                  <p className="text-[10px] mt-1.5 text-right font-mono opacity-70">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 bg-card border-t border-border flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type clinical advice or questions for the patient..."
            className="flex-1 h-11 px-4 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="bg-primary text-primary-foreground px-6 h-11 rounded-lg font-bold text-xs shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5 shrink-0"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>
    </div>
  );
}
