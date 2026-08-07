import { LanePlaceholder } from "@/components/LanePlaceholder";

export default function AiAssistantPage() {
  return (
    <LanePlaceholder lane="T2" task="Tasks 6 + 7" title="AI assistant">
      Mic capture (MediaRecorder → webm) → <code>edgeApi.voiceTurn</code> →
      play <code>bot_audio_url</code>. Poll{" "}
      <code>edgeApi.sessionState</code> every 2s; when{" "}
      <code>pending_finding</code> appears, show the nurse-finding panel inline —
      it must not navigate away.
      <p className="mt-3 font-medium text-text">
        Non-negotiable: the bot&apos;s English text is always on screen beside the
        native-language audio, and the transcript shows both languages. Fifteen
        minutes of work, and it is the whole mitigation for an LLM-authored,
        machine-translated clinical question that nobody proofread.
      </p>
    </LanePlaceholder>
  );
}
