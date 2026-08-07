import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMockPrescription } from "@/lib/mockDb";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const prescriptionId = searchParams.get("id") || "rx_seed_001";

    if (db) {
      try {
        const { data: rx, error: rxError } = await db
          .from("prescriptions")
          .select("*, doctors(*), patients(*)")
          .eq("prescription_id", prescriptionId)
          .maybeSingle();

        if (!rxError && rx) {
          const formatted = {
            prescription_id: rx.prescription_id,
            visit_id: rx.visit_id,
            doctor_id: rx.doctor_id,
            doctor_name: rx.doctors?.name || "Dr. Priya Varghese",
            doctor_specialty: rx.doctors?.specialty_general || "MBBS",
            patient_id: rx.patient_id,
            patient_name: rx.patients?.name || "Anjali Menon",
            patient_age: rx.patients?.age || 34,
            patient_sex: rx.patients?.sex || "F",
            patient_phone: rx.patients?.phone_number || "9000000001",
            issued_at: rx.issued_at || new Date().toISOString(),
            follow_up_requested: rx.follow_up_requested ?? true,
            pharmacy_id: rx.pharmacy_id,
            medications: rx.medications || [],
          };
          return NextResponse.json(formatted);
        }
      } catch (err) {
        console.warn("Supabase query failed, falling back to mock prescription:", err);
      }
    }

    const mockRx = getMockPrescription(prescriptionId);
    if (!mockRx) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    return NextResponse.json(mockRx);
  } catch (error) {
    console.error("GET /api/pharmacies/prescription error:", error);
    return NextResponse.json(
      { error: "Failed to fetch prescription", details: (error as Error).message },
      { status: 500 },
    );
  }
}
