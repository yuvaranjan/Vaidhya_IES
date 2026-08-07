import { LanePlaceholder } from "@/components/LanePlaceholder";

export default async function DoctorConsultPage({
  params,
}: {
  params: Promise<{ visitId: string }>;
}) {
  const { visitId } = await params;
  return (
    <LanePlaceholder lane="T2" task="Task 9" title={`Consult · ${visitId}`}>
      Render the diagnostic report, then the MQTT chat: publish to{" "}
      <code>topics.doctorToPatient(visitId)</code>, subscribe to{" "}
      <code>topics.patientToDoctor(visitId)</code>. The edge service voices the
      question in the patient&apos;s language and relays the answer back as
      English text. The Specialist AI panel (T1) mounts on this page.
    </LanePlaceholder>
  );
}
