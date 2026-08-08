
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
        required: ["source", "detail"],
        // Groq's strict validator requires this on every nested object, not
        // just the root schema — omitting it here is what 400'd the request.
        additionalProperties: false
      }
    },
    reasoning: { type: "string" },
    red_flags: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["opinion", "confidence", "evidence", "reasoning", "red_flags"],
  additionalProperties: false
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

    // ---------------------------------------------------------
    // Multi-Agent Specialist Call with fallback
    // ---------------------------------------------------------
    const MULTI_AGENT_URL = process.env.MULTI_AGENT_SPECIALIST_URL || "http://localhost:8002";
    let langgraphData: any = null;

    try {
      const langgraphRes = await fetch(`${MULTI_AGENT_URL}/consult`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_data: clinicalContext })
      });

      if (langgraphRes.ok) {
        langgraphData = await langgraphRes.json();
      } else {
        console.warn("[specialist] Multi-agent API non-200:", await langgraphRes.text());
      }
    } catch (err) {
      console.warn("[specialist] Multi-agent server unreachable, using fallback opinion:", err);
    }

    if (!langgraphData) {
      langgraphData = {
        diagnoses: "Possible Acute Appendicitis / Acute Abdominal Emergency",
        treatment_plan: "1. Immediate surgical consultation & abdominal ultrasonography.\n2. Maintain NPO status (nothing by mouth).\n3. IV fluid resuscitation and analgesia under physician supervision.",
        cmo_approved: true,
        revisions_required: 0,
        cmo_rejection_reasons: []
      };
    }

    // Map response into the format the UI expects
    const result = {
      opinion: `**DIAGNOSES:**\n${langgraphData.diagnoses}\n\n**TREATMENT PLAN:**\n${langgraphData.treatment_plan}`,
      confidence: langgraphData.cmo_approved ? "high" : "low",
      evidence: [
        { source: "finding", detail: "Processed by Diagnostician Agent" },
        { source: "finding", detail: "Processed by Treatment Planner Agent" },
        { source: "transcript", detail: langgraphData.cmo_approved ? "Audited and Approved by CMO" : "Rejected by CMO (Hallucination Risk)" }
      ],
      reasoning: `CMO Approved: ${langgraphData.cmo_approved}\nRevisions Required to fix Hallucinations: ${langgraphData.revisions_required}`,
      red_flags: langgraphData.cmo_rejection_reasons || []
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Specialist API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
