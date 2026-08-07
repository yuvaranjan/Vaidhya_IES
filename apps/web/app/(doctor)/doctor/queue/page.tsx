import { LanePlaceholder } from "@/components/LanePlaceholder";

export default function DoctorQueuePage() {
  return (
    <LanePlaceholder lane="T2" task="Task 8" title="Doctor queue">
      Read the queue from Supabase (durable — survives a refresh and a doctor who
      logs in late), then subscribe to the retained{" "}
      <code>vaidhya/queue/new</code> topic for live updates without polling.
      Claim is a compare-and-swap update guarded by{" "}
      <code>status = &apos;awaiting_doctor&apos;</code>; zero rows back means 409 →
      toast &ldquo;already claimed&rdquo; and drop the row.
    </LanePlaceholder>
  );
}
