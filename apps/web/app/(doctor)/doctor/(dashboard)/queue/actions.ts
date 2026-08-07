"use server";

import { getSession } from "@/lib/auth";
import { getMockQueue, claimVisitCAS } from "@/lib/mockQueue";
import { redirect } from "next/navigation";

export async function fetchQueue() {
  const session = await getSession();
  if (session.role !== "doctor") {
    throw new Error("Unauthorized");
  }
  
  // Return only awaiting visits
  return getMockQueue().filter(v => v.status === "awaiting_doctor");
}

export async function claimVisit(visitId: string) {
  const session = await getSession();
  if (session.role !== "doctor" || !session.doctorId) {
    return { error: "Unauthorized" };
  }

  const visit = claimVisitCAS(visitId, session.doctorId);
  
  if (!visit) {
    // Simulated 409 error (Compare-and-Swap failure)
    return { error: "409: Already claimed by another doctor." };
  }

  // Update doctor's session with the active visit
  session.visitId = visitId;
  await session.save();

  // Redirect to the consultation screen for this visit
  redirect(`/doctor/consult/${visitId}`);
}
