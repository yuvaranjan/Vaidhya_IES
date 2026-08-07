import { LanePlaceholder } from "@/components/LanePlaceholder";

export default function PatientLoginPage() {
  return (
    <LanePlaceholder lane="T2" task="Task 3" title="Patient login">
      Phone number + OTP. The OTP is always <code>123456</code> and is shown on
      screen labelled &ldquo;Demo OTP&rdquo;. Look the phone number up against
      seeded <code>patients</code>, then set the iron-session cookie
      (<code>lib/auth.ts</code>) and create the visit.
    </LanePlaceholder>
  );
}
