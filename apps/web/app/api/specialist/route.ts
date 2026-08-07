import { NextResponse } from "next/server";

/**
 * Specialist AI — OWNED BY T1 (the only TypeScript file T1 touches).
 *
 * One Groq call, structured JSON out, rendered in a panel on the doctor's
 * consult page. One general button — no specialty picker in V1.
 *
 * Expected request:  { visit_id: string }
 * Expected response:
 *   {
 *     opinion: string,
 *     confidence: "high" | "moderate" | "low",
 *     evidence: [{ source: "vitals" | "transcript" | "finding", detail: string }],
 *     reasoning: string,
 *     red_flags: string[]
 *   }
 *
 * Advisory only: the prompt must state that it does not issue a prescription or
 * a final diagnosis — it gives an opinion for the treating doctor's judgment.
 */
export async function POST() {
  return NextResponse.json(
    { error: "not_implemented", owner: "T1", note: "Specialist AI slice" },
    { status: 501 },
  );
}
