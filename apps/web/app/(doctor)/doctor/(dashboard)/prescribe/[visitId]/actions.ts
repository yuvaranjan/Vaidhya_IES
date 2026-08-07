"use server";

import { getSession } from "@/lib/auth";
import { completeVisit } from "@/lib/mockQueue";
import { redirect } from "next/navigation";

export async function submitPrescription(visitId: string, formData: FormData) {
  const session = await getSession();
  if (session.role !== "doctor" || !session.doctorId) {
    throw new Error("Unauthorized");
  }

  // In a real app we'd parse the dynamic arrays of medications from formData.
  // For the mock, we'll just gather it into an object.
  const rawMeds = formData.get("medications")?.toString() || "[]";
  const medications = JSON.parse(rawMeds);

  const success = completeVisit(visitId, {
    doctorId: session.doctorId,
    medications,
    submittedAt: new Date().toISOString()
  });

  if (!success) {
    throw new Error("Failed to complete visit. It may have already been closed.");
  }

  // Clear the active visit from the session
  session.visitId = undefined;
  await session.save();

  // Route back to the queue
  redirect("/doctor/queue");
}
