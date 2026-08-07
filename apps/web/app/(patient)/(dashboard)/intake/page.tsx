import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { VitalsForm } from "./VitalsForm";

export default async function VitalsPage() {
  const session = await getSession();

  if (!session.visitId) {
    // If somehow there's no session or visitId, send them back to login
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <VitalsForm visitId={session.visitId} />
    </div>
  );
}

