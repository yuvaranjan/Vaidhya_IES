import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AssistantClient } from "./AssistantClient";

export default async function AiAssistantPage() {
  const session = await getSession();

  if (!session.visitId || !session.patientId) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <AssistantClient visitId={session.visitId} patientId={session.patientId} />
    </div>
  );
}

