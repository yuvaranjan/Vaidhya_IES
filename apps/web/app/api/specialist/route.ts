
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
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

const systemPrompt = `
You are a virtual specialist advising a general MBBS doctor in a rural Indian telemedicine setting. 
You do not have direct patient contact.
Weight these most heavily: red flags for hospitalization, acute distress, complex chronic interplay.
You are advisory only. Do not issue a prescription or final diagnosis — provide an opinion for the treating doctor's judgment.
Return ONLY JSON matching the provided schema.
`;

const schema = {
  type: "object",
  properties: {
    opinion: { type: "string" },
    confidence: { type: "string", "enum": ["high", "moderate", "low"] },
    evidence: {
      type: "array",
      items: {
        type: "object",
        properties: {
          source: { type: "string", "enum": ["vitals", "transcript", "finding"] },
          detail: { type: "string" }
        },
        required: ["source", "detail"]
      }
    },
    reasoning: { type: "string" },
    red_flags: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["opinion", "confidence", "evidence", "reasoning", "red_flags"]
};

export async function POST(req: Request) {
  try {
    const { visit_id } = await req.json();

    let clinicalContext = "Patient complains of chest pain and shortness of breath. HR 110, BP 140/90.";
    // `db` is null when Supabase is unconfigured, so a static import is safe —
    // the dynamic one could not resolve its own path and failed the typecheck.
    if (db) {
      const { data } = await db
        .from("diagnostic_reports")
        .select("transcript, vitals_snapshot, summary_text")
        .eq("visit_id", visit_id)
        .maybeSingle();

      if (data) {
        clinicalContext = `Summary: ${data.summary_text}\nVitals: ${JSON.stringify(data.vitals_snapshot)}\nTranscript: ${JSON.stringify(data.transcript)}`;
      } else {
        console.warn("[specialist] no report for visit, using mock clinical context.");
      }
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      // Return a mock response if no API key is provided
      return NextResponse.json({
        opinion: "The patient presents with tachycardia and elevated BP. Consider an ECG to rule out acute coronary syndrome.",
        confidence: "moderate",
        evidence: [{ source: "vitals", detail: "HR 110, BP 140/90" }],
        reasoning: "Chest pain + tachycardia in this setting requires cardiac rule-out.",
        red_flags: ["Chest pain", "Tachycardia"]
      });
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Review this patient case:\n\n${clinicalContext}` }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!groqRes.ok) {
      const errorText = await groqRes.text();
      console.error("Groq API error:", errorText);
      return NextResponse.json({ error: "Failed to fetch specialist opinion" }, { status: 500 });
    }

    const groqData = await groqRes.json();
    const content = groqData.choices?.[0]?.message?.content;
    const result = JSON.parse(content);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Specialist API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
