import React from "react";
import Link from "next/link";
import { Clock, FileText, User, Stethoscope, ChevronRight, CheckCircle2 } from "lucide-react";
import { SEED_PATIENTS } from "@/lib/mockDb";

export const dynamic = "force-dynamic";

interface VisitHistoryItem {
  visit_id: string;
  prescription_id: string;
  doctor_name: string;
  doctor_specialty: string;
  date: string;
  chief_complaint: string;
  medications_count: number;
  status: string;
}

const SAMPLE_VISIT_HISTORY: VisitHistoryItem[] = [
  {
    visit_id: "vis_seed_001",
    prescription_id: "rx_seed_001",
    doctor_name: "Dr. Priya Varghese",
    doctor_specialty: "MBBS, General Medicine",
    date: new Date().toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }),
    chief_complaint: "Acute fever (38.9°C), productive cough, fatigue for 3 days",
    medications_count: 3,
    status: "Active Prescription",
  },
  {
    visit_id: "vis_past_042",
    prescription_id: "rx_past_042",
    doctor_name: "Dr. Arun Krishnan",
    doctor_specialty: "MBBS",
    date: "12 Jan 2026",
    chief_complaint: "Seasonal allergic rhinitis and mild dry cough",
    medications_count: 2,
    status: "Completed",
  },
  {
    visit_id: "vis_past_019",
    prescription_id: "rx_past_019",
    doctor_name: "Dr. Priya Varghese",
    doctor_specialty: "MBBS, General Medicine",
    date: "04 Oct 2025",
    chief_complaint: "Routine blood pressure check & chronic maintenance",
    medications_count: 1,
    status: "Completed",
  },
];

export default function PatientHistoryPage() {
  const patient = SEED_PATIENTS["pat_001"];

  return (
    <div className="max-w-5xl mx-auto p-5 sm:p-8 space-y-6">
      {/* Header */}
      <div className="bg-card p-5 sm:p-8 rounded-xl border border-[#DCE7EA] shadow-[0_5px_18px_rgba(15,45,64,0.045)] mb-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2B9C95] block mb-1">
            Patient Health Records · Timeline
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-[#173449]">
            Medical & Visit History
          </h1>
          <p className="text-xs sm:text-sm text-[#6D7F8C] mt-1">
            Patient: <strong className="text-[#173449]">{patient.name}</strong> ({patient.age} Y / {patient.sex}) · ABHA ID:{" "}
            <span className="font-mono text-[#173449] font-medium">{patient.abha_id}</span>
          </p>
        </div>

        <Link
          href="/prescription?id=rx_seed_001"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-[#173F59] hover:bg-[#173F59]/90 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors"
        >
          <FileText className="w-4 h-4 text-[#2B9C95]" />
          Active Prescription
        </Link>
      </div>

      {/* History Timeline */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-[#173449] flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#2B9C95]" />
          Past Telemedicine Consultations ({SAMPLE_VISIT_HISTORY.length})
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {SAMPLE_VISIT_HISTORY.map((visit) => (
            <div
              key={visit.visit_id}
              className="rounded-xl border border-[#DCE7EA] bg-card p-5 sm:p-6 shadow-[0_5px_18px_rgba(15,45,64,0.045)] hover:border-[#2B9C95]/50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#DCE7EA] pb-3.5">
                <div>
                  <span className="text-xs font-bold text-[#14736A] bg-[#E5F5F3] px-2.5 py-0.5 rounded-md border border-[#2B9C95]/30">
                    Visit #{visit.visit_id}
                  </span>
                  <span className="text-xs text-[#6D7F8C] ml-2 font-medium">Date: {visit.date}</span>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E5F5F3] text-[#14736A]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2B9C95]" />
                  {visit.status}
                </span>
              </div>

              <div className="py-3.5 space-y-2 text-xs sm:text-sm">
                <p className="text-[#173449]">
                  <strong className="text-[#6D7F8C] font-medium">Chief Complaint: </strong>
                  {visit.chief_complaint}
                </p>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-[#6D7F8C]">
                  <span className="flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-[#2B9C95]" />
                    Doctor: <strong className="text-[#173449]">{visit.doctor_name}</strong> ({visit.doctor_specialty})
                  </span>
                  <span>• Prescribed: {visit.medications_count} Medications</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#DCE7EA] flex justify-end">
                <Link
                  href={`/prescription?id=${visit.prescription_id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#2B9C95] hover:text-[#14736A] transition-colors"
                >
                  View Digital Prescription <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
