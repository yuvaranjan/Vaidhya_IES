import { LanePlaceholder } from "@/components/LanePlaceholder";

export default async function PrescribePage({
  params,
}: {
  params: Promise<{ visitId: string }>;
}) {
  const { visitId } = await params;
  return (
    <LanePlaceholder lane="T2" task="Task 10" title={`Prescribe · ${visitId}`}>
      Medication rows (name, dosage, duration, instructions) → insert into{" "}
      <code>prescriptions</code> and move the visit to <code>completed</code>.
      The patient-side view of this prescription belongs to T3.
    </LanePlaceholder>
  );
}
