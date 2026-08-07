import React, { Suspense } from "react";
import { PrescriptionView } from "@/components/PrescriptionView";

export const dynamic = "force-dynamic";

function PrescriptionContent({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto p-6 text-center text-muted">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <p>Loading prescription...</p>
        </div>
      }
    >
      <PrescriptionContentInner searchParams={searchParams} />
    </Suspense>
  );
}

async function PrescriptionContentInner({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const prescriptionId = params?.id || "rx_seed_001";

  return <PrescriptionView initialPrescriptionId={prescriptionId} />;
}

export default function PatientPrescriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  return <PrescriptionContent searchParams={searchParams} />;
}
