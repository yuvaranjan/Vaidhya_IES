"use server";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginDoctor(prevState: any, formData: FormData) {
  const phone = formData.get("phone")?.toString()?.trim();
  const password = formData.get("password")?.toString()?.trim();

  if (!phone || !password) return { error: "Required fields missing" };
  // Mock validation (no DB yet)
  if (password !== "doctor123") return { error: "Invalid password (use doctor123)" };

  const session = await getSession();
  session.role = "doctor";
  session.doctorId = "doctor_mock_001";
  session.name = "Dr. Mock";
  await session.save();

  redirect("/doctor/queue");
}

export async function logoutDoctor() {
  const session = await getSession();
  session.destroy();
  redirect("/doctor/login");
}
