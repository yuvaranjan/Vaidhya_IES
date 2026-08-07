import { LanePlaceholder } from "@/components/LanePlaceholder";

export default function PatientPrescriptionPage() {
  return (
    <LanePlaceholder lane="T3" task="Tasks 3 + 4 + 5" title="Prescription & pharmacies">
      The patient portal <em>is</em> the delivery channel in V1 — no SMS. Show the
      prescription with a print/download action, then the nearby pharmacies with
      per-medicine stock status (in stock / low / out of stock). Selecting one
      inserts into <code>pharmacy_queue</code>.
    </LanePlaceholder>
  );
}
