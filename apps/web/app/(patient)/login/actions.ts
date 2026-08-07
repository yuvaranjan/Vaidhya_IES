"use server";

import { getSession, DEMO_OTP } from "@/lib/auth";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";

export async function loginPatient(prevState: any, formData: FormData) {
  const phone = formData.get("phone")?.toString()?.trim();
  const otp = formData.get("otp")?.toString()?.trim();

  if (!phone || !otp) {
    return { error: "Phone and OTP are required" };
  }

  if (otp !== DEMO_OTP) {
    return { error: "Invalid OTP. Please use the Demo OTP: 123456" };
  }

  const session = await getSession();

  // In the demo, we generate a mock visit ID and use a hardcoded patient ID
  session.role = "patient";
  session.patientId = "9000000001"; // Demo patient ID from the README/PROGRESS
  session.name = "Demo Patient";
  session.visitId = `visit_${randomUUID()}`;

  await session.save();

  redirect("/dashboard");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/");
}
