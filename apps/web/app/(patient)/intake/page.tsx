import { LanePlaceholder } from "@/components/LanePlaceholder";

export default function VitalsPage() {
  return (
    <LanePlaceholder lane="T2" task="Task 5" title="Vitals dashboard">
      Five fields — temperature, blood pressure, pulse, SpO2, respiratory rate.
      The nurse fills them in on the patient&apos;s session (there is no nurse
      account). On submit:{" "}
      <code>edgeApi.vitals(&#123;phase: &quot;pass_one_baseline&quot;&#125;)</code>{" "}
      then auto-navigate to <code>/consult</code>.
    </LanePlaceholder>
  );
}
