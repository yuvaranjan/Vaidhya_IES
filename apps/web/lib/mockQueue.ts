import "server-only";

export type MockVisit = {
  visitId: string;
  patientName: string;
  chiefComplaint: string;
  summaryText: string;
  urgency: "routine" | "elevated" | "urgent";
  status: "awaiting_doctor" | "in_consult" | "completed";
  claimedByDoctorId: string | null;
  createdAt: number;
};

// Use globalThis to persist the mock data across hot-reloads and API calls in Next.js dev
const globalAny = globalThis as any;

if (!globalAny.__mockQueue) {
  globalAny.__mockQueue = [
    {
      visitId: "visit_demo_001",
      patientName: "Demo Patient 1",
      chiefComplaint: "Stomach pain",
      summaryText: "Patient reports abdominal pain lasting 2 days. Pain is localized in the lower right quadrant and worsened after eating. No fever or vomiting reported. Rebound tenderness absent.",
      urgency: "routine",
      status: "awaiting_doctor",
      claimedByDoctorId: null,
      createdAt: Date.now() - 1000 * 60 * 5, // 5 mins ago
    },
    {
      visitId: "visit_demo_002",
      patientName: "Demo Patient 2",
      chiefComplaint: "Severe headache and blurry vision",
      summaryText: "Patient reports sudden onset of severe headache paired with blurry vision. Photophobia present. No history of migraines. Nurse checked BP: 160/100.",
      urgency: "elevated",
      status: "awaiting_doctor",
      claimedByDoctorId: null,
      createdAt: Date.now() - 1000 * 60 * 2, // 2 mins ago
    },
  ] as MockVisit[];
}

export const getMockQueue = (): MockVisit[] => {
  return globalAny.__mockQueue;
};

export const getMockVisit = (visitId: string): MockVisit | null => {
  const queue: MockVisit[] = globalAny.__mockQueue;
  return queue.find(v => v.visitId === visitId) || null;
};

export const claimVisitCAS = (visitId: string, doctorId: string): MockVisit | null => {
  const queue: MockVisit[] = globalAny.__mockQueue;
  const visitIndex = queue.findIndex(v => v.visitId === visitId);
  
  if (visitIndex === -1) return null; // Not found

  const visit = queue[visitIndex];
  
  // The Compare and Swap logic: Only update if it is currently 'awaiting_doctor'
  if (visit.status !== "awaiting_doctor") {
    return null; // Already claimed or completed! (Simulates the 409)
  }

  // Swap
  visit.status = "in_consult";
  visit.claimedByDoctorId = doctorId;
  
  return visit;
};

export const completeVisit = (visitId: string, prescriptionData: any): boolean => {
  const queue: MockVisit[] = globalAny.__mockQueue;
  const visitIndex = queue.findIndex(v => v.visitId === visitId);
  
  if (visitIndex === -1) return false;
  
  const visit = queue[visitIndex];
  if (visit.status !== "in_consult") return false;
  
  visit.status = "completed";
  // In a real app we'd save prescriptionData to the DB here.
  return true;
};

