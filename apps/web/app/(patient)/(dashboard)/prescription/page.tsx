import { getSession } from "@/lib/auth";
import { getMockQueue } from "@/lib/mockQueue";
import { PrescriptionFulfillmentClient, Medication } from "./PrescriptionFulfillmentClient";

export const dynamic = "force-dynamic";

export default async function PatientPrescriptionPage() {
  const session = await getSession();
  const userName = session.name || "Demo Patient";

  // Check if there is a completed visit with prescription in the queue
  const queue = getMockQueue();
  const completedVisit = queue.find(
    (v) => v.status === "completed" && v.prescription && v.prescription.length > 0
  );

  const medications: Medication[] = completedVisit?.prescription || [
    {
      id: "m_1",
      name: "Amoxicillin 500mg",
      dosage: "1 Capsule Twice Daily",
      duration: "5 Days",
      instructions: "Take with food morning and evening.",
    },
    {
      id: "m_2",
      name: "Paracetamol 500mg",
      dosage: "1 Tablet As Needed",
      duration: "3 Days",
      instructions: "Take every 6 hours for fever or pain relief.",
    },
  ];

  return (
    <PrescriptionFulfillmentClient
      patientName={userName}
      medications={medications}
    />
  );
}
