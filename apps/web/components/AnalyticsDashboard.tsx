"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CaseRow = {
  region_id: string;
  disease_category: string;
  week_start_date: string;
  case_count: number;
  rolling_baseline: number | null;
  is_anomaly: boolean | null;
};

const REGION_LABELS: Record<string, string> = {
  reg_thrissur: "Thrissur",
  reg_palakkad: "Palakkad",
  reg_ernakulam: "Ernakulam",
  reg_kozhikode: "Kozhikode",
  reg_malappuram: "Malappuram",
  reg_kannur: "Kannur",
  reg_kollam: "Kollam",
  reg_alappuzha: "Alappuzha",
  reg_kottayam: "Kottayam",
  reg_wayanad: "Wayanad",
};

const DISEASE_LABELS: Record<string, string> = {
  respiratory_infection: "Respiratory infection",
  diarrheal_disease: "Diarrheal disease",
  dengue: "Dengue",
  hypertension_related: "Hypertension-related",
};

export function AnalyticsDashboard({ rows }: { rows: CaseRow[] }) {
  const regions = useMemo(() => Object.keys(REGION_LABELS).filter((id) => rows.some((r) => r.region_id === id)), [rows]);
  const diseases = useMemo(() => Object.keys(DISEASE_LABELS).filter((id) => rows.some((r) => r.disease_category === id)), [rows]);

  const anomaly = useMemo(() => rows.find((r) => r.is_anomaly), [rows]);

  const [region, setRegion] = useState(anomaly?.region_id ?? regions[0]);
  const [disease, setDisease] = useState(anomaly?.disease_category ?? diseases[0]);

  const regionTotals = useMemo(() => {
    const last4 = new Map<string, { total: number; anomaly: boolean }>();
    for (const id of regions) {
      const regionRows = rows
        .filter((r) => r.region_id === id)
        .sort((a, b) => a.week_start_date.localeCompare(b.week_start_date))
        .slice(-4);
      last4.set(id, {
        total: regionRows.reduce((sum, r) => sum + r.case_count, 0),
        anomaly: regionRows.some((r) => r.is_anomaly),
      });
    }
    return last4;
  }, [rows, regions]);

  const maxTotal = Math.max(1, ...Array.from(regionTotals.values()).map((v) => v.total));

  const series = useMemo(
    () =>
      rows
        .filter((r) => r.region_id === region && r.disease_category === disease)
        .sort((a, b) => a.week_start_date.localeCompare(b.week_start_date))
        .map((r) => ({
          week: r.week_start_date,
          case_count: r.case_count,
          baseline: r.rolling_baseline,
          is_anomaly: r.is_anomaly,
        })),
    [rows, region, disease],
  );

  const anomalyPoints = series.filter((p) => p.is_anomaly);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-6">
        <p className="text-sm font-medium text-primary-600">Public health analytics</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Regional disease surveillance
        </h1>
        <p className="mt-1 text-muted">
          Last 26 weeks · {regions.length} regions · {diseases.length} disease categories.
          Anomalies are cases exceeding 2x the trailing 4-week baseline.
        </p>
      </header>

      {anomaly && (
        <div className="mb-6 rounded-xl border border-danger bg-surface p-4">
          <p className="text-sm font-semibold text-danger">Anomaly detected</p>
          <p className="mt-1 text-text">
            {DISEASE_LABELS[anomaly.disease_category] ?? anomaly.disease_category} cases in{" "}
            {REGION_LABELS[anomaly.region_id] ?? anomaly.region_id} reached{" "}
            {anomaly.case_count} in the week of{" "}
            {new Date(anomaly.week_start_date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
            {anomaly.rolling_baseline
              ? ` — ${(anomaly.case_count / anomaly.rolling_baseline).toFixed(1)}x the ${anomaly.rolling_baseline.toFixed(1)}-case baseline.`
              : "."}
          </p>
        </div>
      )}

      <section className="mb-6 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Case load by region</h2>
        <p className="mt-1 text-sm text-muted">Total cases across all diseases, trailing 4 weeks</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {regions.map((id) => {
            const stat = regionTotals.get(id)!;
            const intensity = stat.total / maxTotal;
            const isSelected = id === region;
            return (
              <button
                key={id}
                onClick={() => setRegion(id)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  stat.anomaly
                    ? "border-danger bg-danger/10"
                    : isSelected
                      ? "border-primary-500 bg-primary-50"
                      : "border-border bg-bg hover:border-primary-300"
                }`}
                style={
                  !stat.anomaly
                    ? { backgroundColor: `color-mix(in srgb, var(--color-primary-500) ${Math.round(intensity * 35)}%, var(--color-surface))` }
                    : undefined
                }
              >
                <p className="text-sm font-medium">{REGION_LABELS[id] ?? id}</p>
                <p className="mt-1 text-xl font-semibold">{stat.total}</p>
                {stat.anomaly && (
                  <p className="mt-1 text-xs font-semibold text-danger">Anomaly</p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {DISEASE_LABELS[disease] ?? disease} in {REGION_LABELS[region] ?? region}
          </h2>
          <div className="flex gap-2">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm"
            >
              {regions.map((id) => (
                <option key={id} value={id}>
                  {REGION_LABELS[id] ?? id}
                </option>
              ))}
            </select>
            <select
              value={disease}
              onChange={(e) => setDisease(e.target.value)}
              className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm"
            >
              {diseases.map((id) => (
                <option key={id} value={id}>
                  {DISEASE_LABELS[id] ?? id}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="week"
                tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                stroke="var(--color-muted)"
                fontSize={12}
                minTickGap={20}
              />
              <YAxis stroke="var(--color-muted)" fontSize={12} allowDecimals={false} />
              <Tooltip
                labelFormatter={(d) =>
                  typeof d === "string"
                    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : d
                }
                contentStyle={{ borderRadius: 8, borderColor: "var(--color-border)" }}
              />
              <Line
                type="monotone"
                dataKey="case_count"
                name="Cases"
                stroke="var(--color-primary-600)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="baseline"
                name="4-week baseline"
                stroke="var(--color-muted)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
              {anomalyPoints.map((p) => (
                <ReferenceDot
                  key={p.week}
                  x={p.week}
                  y={p.case_count}
                  r={6}
                  fill="var(--color-danger)"
                  stroke="var(--color-surface)"
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </main>
  );
}
