"use client";

import { useState, useRef, useEffect } from "react";
import { edgeApi } from "@/lib/edgeApi";
import type { Language, IntakeCompleteResponse, PendingFinding } from "@vaidhya/shared";
import { 
  Sparkles, 
  Mic, 
  Send, 
  Globe, 
  AlertCircle, 
  CheckCircle2, 
  Volume2, 
  Bot,
  User,
  Activity,
  ArrowRight
} from "lucide-react";

type Turn = {
  role: "bot" | "patient";
  textNative: string;
  textEn: string;
};

const LANG_LABELS: Record<Language, { name: string; native: string }> = {
  en: { name: "English", native: "English" },
  ml: { name: "Malayalam", native: "മലയാളം" },
  ta: { name: "Tamil", native: "தமிழ்" },
  hi: { name: "Hindi", native: "हिंदी" },
};

export function AssistantClient({ visitId, patientId }: { visitId: string; patientId: string }) {
  const [language, setLanguage] = useState<Language | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingFinding, setPendingFinding] = useState<PendingFinding | null>(null);
  const [intakeResult, setIntakeResult] = useState<IntakeCompleteResponse | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Poll session state every 2 seconds
  useEffect(() => {
    if (!language || intakeResult) return;

    const interval = setInterval(async () => {
      try {
        const state = await edgeApi.sessionState(visitId);
        if (state.pending_finding) {
          setPendingFinding(state.pending_finding);
        } else {
          setPendingFinding(null);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [language, intakeResult, visitId]);

  const startSession = async (lang: Language) => {
    setIsStarting(true);
    setLanguage(lang);
    try {
      const res = await edgeApi.sessionStart({ visit_id: visitId, patient_id: patientId, language: lang });
      setTranscript([
        { role: "bot", textNative: res.greeting_text_native, textEn: res.greeting_text_en },
      ]);
      playAudio(res.greeting_audio_url);
    } catch (err) {
      console.error(err);
      alert("Failed to start session.");
    } finally {
      setIsStarting(false);
    }
  };

  const playAudio = (url: string) => {
    if (audioRef.current && url) {
      audioRef.current.src = edgeApi.audioUrl(url);
      audioRef.current.play().catch(console.error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        await handleTurn(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing || !!pendingFinding) return;

    const userText = textInput.trim();
    setTextInput("");
    setIsProcessing(true);

    setTranscript((prev) => [
      ...prev,
      { role: "patient", textNative: userText, textEn: userText },
    ]);

    setTimeout(async () => {
      setTranscript((prev) => [
        ...prev,
        { role: "bot", textNative: "Thank you for sharing that symptom. How long have you been experiencing this?", textEn: "Thank you for sharing that symptom. How long have you been experiencing this?" },
      ]);
      setIsProcessing(false);
      
      if (userText.toLowerCase().includes("done") || userText.toLowerCase().includes("no more")) {
        await finalizeIntake();
      }
    }, 1200);
  };

  const handleTurn = async (audioBlob: Blob) => {
    try {
      const res = await edgeApi.voiceTurn(visitId, audioBlob);
      
      setTranscript((prev) => [
        ...prev,
        { role: "patient", textNative: res.transcript_native, textEn: res.transcript_en },
        { role: "bot", textNative: res.bot_text_native, textEn: res.bot_text_en },
      ]);

      if (res.bot_audio_url) {
        playAudio(res.bot_audio_url);
      }

      if (res.intake_done || res.next_action === "complete_intake") {
        await finalizeIntake();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to process voice turn.");
    } finally {
      setIsProcessing(false);
    }
  };

  const finalizeIntake = async () => {
    try {
      const res = await edgeApi.intakeComplete(visitId);
      setIntakeResult(res);
    } catch (err) {
      console.error("Failed to complete intake:", err);
    }
  };

  const handleNurseFindingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pendingFinding) return;

    const formData = new FormData(e.currentTarget);
    const val = formData.get("finding_value") as string;
    
    try {
      await edgeApi.submitFinding({
        visit_id: visitId,
        phase: "on_demand",
        readings: [{ type: pendingFinding.type, value_text: val }],
      });
      setPendingFinding(null);
    } catch (err) {
      console.error(err);
      alert("Failed to submit finding.");
    }
  };

  if (!language) {
    return (
      <div className="w-full max-w-md bg-card p-6 sm:p-8 rounded-xl shadow-soft border border-border text-center mx-auto my-10 space-y-6">
        <div>
          <div className="w-12 h-12 rounded-full bg-secondary text-accent mx-auto flex items-center justify-center mb-3">
            <Globe className="w-6 h-6" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-1">Step 2 of 2</p>
          <h2 className="text-2xl font-bold text-foreground tracking-[-0.025em]">Choose Spoken Language</h2>
          <p className="text-xs text-muted-foreground mt-1">Select your preferred language for voice evaluation.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(["ml", "ta", "hi", "en"] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => startSession(lang)}
              disabled={isStarting}
              className="p-3.5 bg-background border border-border rounded-xl hover:bg-secondary hover:border-accent/40 text-foreground font-bold transition-all shadow-sm flex flex-col items-center gap-1 group"
            >
              <span className="text-sm uppercase tracking-wider text-accent font-extrabold">{lang}</span>
              <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground">{LANG_LABELS[lang].native}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (intakeResult) {
    return (
      <div className="w-full max-w-xl bg-card p-6 sm:p-8 rounded-xl shadow-soft border border-border mx-auto my-10 space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="w-10 h-10 rounded-full bg-[#E5F5F3] text-[#14736A] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">Clinical Triage Completed</p>
            <h2 className="text-2xl font-bold text-foreground tracking-[-0.025em]">Consultation Summary</h2>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-background p-4 rounded-xl border border-border">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1">Chief Complaint</p>
            <p className="text-foreground font-bold text-sm">{intakeResult.chief_complaint}</p>
          </div>

          <div className="bg-background p-4 rounded-xl border border-border">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1">Diagnostic Summary</p>
            <p className="text-foreground text-sm leading-relaxed font-medium">{intakeResult.summary_text}</p>
          </div>

          <div className={`p-4 rounded-xl border font-bold text-sm flex items-center justify-between ${
            intakeResult.urgency_tier.tier === "urgent" ? "bg-destructive/10 border-destructive/20 text-destructive" :
            intakeResult.urgency_tier.tier === "elevated" ? "bg-[#EEF3FB] border-[#D1E0F5] text-[#315A94]" :
            "bg-[#E5F5F3] border-[#C2E8E4] text-[#14736A]"
          }`}>
            <span>Urgency Assessment Tier</span>
            <span className="uppercase tracking-widest text-xs px-2.5 py-1 rounded-full bg-white/70 shadow-sm">
              {intakeResult.urgency_tier.tier} ({intakeResult.urgency_tier.flag_count} Flags)
            </span>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground font-medium pt-2">
          Your triage summary has been transferred to the doctor queue. An attending physician will review your case shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[82vh] bg-card rounded-xl shadow-soft border border-border overflow-hidden my-4">
      
      {/* Header */}
      <div className="px-6 py-4 bg-card border-b border-border flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.02)] z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-accent">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">AI Voice Assistant</p>
            <h2 className="font-bold text-foreground text-base leading-tight">Clinical Intake Consultation</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-secondary text-primary border border-border">
            Lang: {language.toUpperCase()}
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-full border border-border">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-foreground">Active Voice Node</span>
          </div>
        </div>
      </div>

      {/* Transcript Chat Body (Section 6: Chat Bubbles Spec) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
        {transcript.map((t, i) => (
          <div key={i} className={`flex flex-col ${t.role === "patient" ? "items-end" : "items-start"}`}>
            
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t.role === "patient" ? "Patient Response" : "Clinical AI"}
              </span>
            </div>

            <div className={`max-w-[78%] px-4 py-3 leading-relaxed text-sm shadow-sm ${
              t.role === "patient" 
                ? "bg-primary text-primary-foreground rounded-xl rounded-tr-sm" 
                : "bg-card border border-border text-foreground rounded-xl rounded-tl-sm"
            }`}>
              <p className="font-semibold">{t.textNative}</p>
              {t.textEn && t.textEn !== t.textNative && (
                <p className={`text-xs mt-1.5 pt-1.5 border-t ${t.role === "patient" ? "border-white/20 text-white/80" : "border-border text-muted-foreground"}`}>
                  En: {t.textEn}
                </p>
              )}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-card p-3 rounded-xl border border-border w-fit animate-pulse">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Evaluation engine analyzing symptoms...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Nurse Prompt Banner */}
      {pendingFinding && (
        <div className="p-4 bg-[#F4F0FB] border-t border-b border-[#E4D9F5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7050A8] flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Nurse Action Required
            </h3>
            <p className="text-foreground text-xs font-semibold mt-0.5">{pendingFinding.instruction_en}</p>
          </div>
          <form onSubmit={handleNurseFindingSubmit} className="flex gap-2 w-full sm:w-auto">
            <input 
              type="text" 
              name="finding_value" 
              required 
              placeholder="Enter reading..." 
              className="h-9 px-3 border border-border rounded-lg bg-card text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring" 
            />
            <button type="submit" className="bg-primary text-primary-foreground px-4 h-9 rounded-lg text-xs font-bold shadow-sm hover:opacity-90">
              Submit
            </button>
          </form>
        </div>
      )}

      {/* Controls Footer */}
      <div className="p-4 sm:p-5 bg-card border-t border-border flex flex-col sm:flex-row items-center gap-4">
        
        {/* Text Input Fallback */}
        <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2 w-full">
          <input 
            type="text" 
            value={textInput} 
            onChange={(e) => setTextInput(e.target.value)} 
            placeholder="Type your response here..." 
            className="flex-1 h-11 px-4 border border-border rounded-lg bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring" 
            disabled={isProcessing || !!pendingFinding}
          />
          <button 
            type="submit" 
            disabled={!textInput.trim() || isProcessing || !!pendingFinding}
            className="px-5 h-11 bg-primary text-primary-foreground rounded-lg font-bold text-xs shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5 shrink-0"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        
        <div className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">OR</div>

        {/* Big Mic Button (Hero Voice Control) */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing || !!pendingFinding}
          className={`h-11 px-6 rounded-full font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 ${
            isRecording ? "bg-destructive text-white hover:bg-destructive/90 animate-pulse" : 
            isProcessing || !!pendingFinding ? "bg-muted text-muted-foreground cursor-not-allowed" : 
            "bg-secondary text-primary hover:bg-secondary/80 border border-border"
          }`}
        >
          <Mic className={`w-4 h-4 ${isRecording ? "text-white" : "text-accent"}`} />
          <span>{isRecording ? "Stop Recording" : "Hold to Speak"}</span>
        </button>

      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
