import { db } from "@/lib/db";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";

export const revalidate = 0;

export default async function AnalyticsDashboardPage() {
  if (!db) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-sm font-medium text-danger">Database connection unavailable</p>
          <p className="mt-2 text-muted">SUPABASE_URL and SUPABASE_SERVICE_KEY are not configured.</p>
        </div>
      </main>
    );
  }

  const { data, error } = await db
    .from("regional_case_counts")
    .select("region_id,disease_category,week_start_date,case_count,rolling_baseline,is_anomaly")
    .order("week_start_date", { ascending: true });

  if (error) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-sm font-medium text-danger">Failed to load analytics</p>
          <p className="mt-2 text-muted">{error.message}</p>
        </div>
      </main>
    );
  }

  return <AnalyticsDashboard rows={data ?? []} />;
}
