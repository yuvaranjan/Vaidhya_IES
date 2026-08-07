import { LanePlaceholder } from "@/components/LanePlaceholder";

export default function DoctorLoginPage() {
  return (
    <LanePlaceholder lane="T2" task="Task 4" title="Doctor login">
      Phone + password, bcrypt-compared against the seeded{" "}
      <code>doctors.password_hash</code>. Seed credentials are in the repo README.
    </LanePlaceholder>
  );
}
