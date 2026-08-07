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
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  MapPin, 
  ShieldAlert, 
  Filter, 
  Calendar, 
  Sparkles, 
  Layers, 
  Download,
  Building2,
  CheckCircle2,
  ArrowUpRight
} from "lucide-react";
import { REGION_LABELS, DISEASE_LABELS, CaseRow } from "@/lib/mockAnalytics";

export function AnalyticsDashboard({ rows, isMock = false }: { rows: CaseRow[]; isMock?: boolean }) {
  const regions = useMemo(
    () => Object.keys(REGION_LABELS).filter((id) => rows.some((r) => r.region_id === id)),
    [rows]
  );
  const diseases = useMemo(
    () => Object.keys(DISEASE_LABELS).filter((id) => rows.some((r) => r.disease_category === id)),
    [rows]
  );

  const anomaly = useMemo(() => rows.find((r) => r.is_anomaly), [rows]);

  const [region, setRegion] = useState(anomaly?.region_id ?? regions[0]);
  const [disease, setDisease] = useState(anomaly?.disease_category ?? diseases[0]);

  // Trailing 4-week totals per region
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
  const grandTotalCases = useMemo(() => rows.reduce((sum, r) => sum + r.case_count, 0), [rows]);
  const anomalyCount = useMemo(() => rows.filter((r) => r.is_anomaly).length, [rows]);

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
    [rows, region, disease]
  );

  const anomalyPoints = series.filter((p) => p.is_anomaly);

  return (
    <main className="w-full max-w-7xl mx-auto py-8 px-5 sm:px-8 space-y-8">
      {/* Header Pattern (Section 8: Page Header Spec) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-1 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-accent" /> Public Health & Epidemiology Surveillance
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-[-0.025em]">
            Regional Disease Surveillance Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full border shadow-sm flex items-center gap-1.5 ${
            isMock 
              ? "bg-[#EEF3FB] text-[#315A94] border-[#D1E0F5]" 
              : "bg-[#E5F5F3] text-[#14736A] border-[#C2E8E4]"
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            {isMock ? "26-Wk Seed Dataset" : "Live Supabase Feed"}
          </span>
          <button 
            onClick={() => window.print()}
            className="px-4 h-10 rounded-lg bg-card border border-border text-foreground font-bold text-xs hover:bg-secondary transition-colors shadow-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-accent" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-card border border-border rounded-xl p-5 shadow-soft flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Total Cases (26W)</span>
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-accent">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground tracking-[-0.04em]">{grandTotalCases.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-accent" /> Across 10 Districts
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-soft flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Monitored Regions</span>
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-primary">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground tracking-[-0.04em]">{regions.length}</p>
            <p className="text-xs text-muted-foreground font-medium mt-1">Kerala State Health Nodes</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-soft flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Outbreak Anomalies</span>
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-destructive tracking-[-0.04em]">{anomalyCount}</p>
            <p className="text-xs text-destructive font-semibold mt-1">Exceeding 2x Trailing Baseline</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-soft flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Peak Spike Rate</span>
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-accent">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground tracking-[-0.04em]">3.2x</p>
            <p className="text-xs text-muted-foreground font-medium mt-1">Ernakulam Dengue Spike</p>
          </div>
        </div>
      </div>

      {/* Outbreak Anomaly Alert Card */}
      {anomaly && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 shadow-soft space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-destructive/20 pb-3">
            <div className="flex items-center gap-2 text-destructive">
              <div className="relative flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-ping absolute"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-destructive relative"></span>
              </div>
              <h3 className="font-bold text-base tracking-tight">Active Outbreak Anomaly Detected</h3>
            </div>
            <button 
              onClick={() => {
                setRegion(anomaly.region_id);
                setDisease(anomaly.disease_category);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-destructive text-white font-bold text-xs shadow-sm hover:opacity-90 transition-opacity self-start sm:self-auto"
            >
              Focus Outbreak Vector ({REGION_LABELS[anomaly.region_id] ?? anomaly.region_id})
            </button>
          </div>

          <p className="text-sm font-medium text-foreground leading-relaxed">
            <strong className="text-destructive font-bold">
              {DISEASE_LABELS[anomaly.disease_category] ?? anomaly.disease_category}
            </strong> cases in <strong className="text-foreground font-bold">{REGION_LABELS[anomaly.region_id] ?? anomaly.region_id}</strong> reached{" "}
            <strong className="text-foreground font-bold">{anomaly.case_count} cases</strong> in the week of{" "}
            <strong className="text-foreground font-bold">
              {new Date(anomaly.week_start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </strong>
            {anomaly.rolling_baseline
              ? ` — resulting in a ${(anomaly.case_count / anomaly.rolling_baseline).toFixed(1)}x surge over the ${anomaly.rolling_baseline.toFixed(1)}-case baseline.`
              : "."}
          </p>
        </div>
      )}

      {/* Regional Case Load Grid (Section 6: Heatmap Spec) */}
      <section className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-soft space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-1">District Heatmap</p>
          <h2 className="text-xl font-bold text-foreground">Trailing 4-Week Case Load by Region</h2>
          <p className="text-xs text-muted-foreground font-medium">Click any district to view its specific 26-week disease timeline.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 pt-2">
          {regions.map((id) => {
            const stat = regionTotals.get(id)!;
            const intensity = stat.total / maxTotal;
            const isSelected = id === region;
            return (
              <button
                key={id}
                onClick={() => setRegion(id)}
                className={`rounded-xl border p-4 text-left transition-all relative overflow-hidden shadow-sm ${
                  stat.anomaly
                    ? "border-destructive/40 bg-destructive/10 text-destructive ring-2 ring-destructive/30"
                    : isSelected
                    ? "border-accent bg-accent/10 text-primary ring-2 ring-accent/40"
                    : "border-border bg-background hover:bg-secondary/60 text-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold truncate">{REGION_LABELS[id] ?? id}</p>
                  {stat.anomaly && (
                    <span className="w-2 h-2 rounded-full bg-destructive animate-ping"></span>
                  )}
                </div>
                <p className="text-2xl font-bold tracking-tight">{stat.total}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider mt-1 opacity-80">
                  {stat.anomaly ? "Anomaly Alert" : "4-Wk Total"}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Interactive Line Chart & Category Filters */}
      <section className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-soft space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-1">Trend Analysis</p>
            <h2 className="text-xl font-bold text-foreground">
              {DISEASE_LABELS[disease] ?? disease} in {REGION_LABELS[region] ?? region}
            </h2>
          </div>

          {/* Segmented Controls for Category Selection */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-lg bg-secondary p-1 border border-border">
              {diseases.map((d) => (
                <button
                  key={d}
                  onClick={() => setDisease(d)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    disease === d 
                      ? "bg-card text-primary shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {DISEASE_LABELS[d] ?? d}
                </button>
              ))}
            </div>

            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {regions.map((id) => (
                <option key={id} value={id}>
                  {REGION_LABELS[id] ?? id}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Recharts Canvas */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 15, right: 25, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DCE7EA" vertical={false} />
              <XAxis
                dataKey="week"
                tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                stroke="#6D7F8C"
                fontSize={11}
                tickLine={false}
                minTickGap={25}
              />
              <YAxis stroke="#6D7F8C" fontSize={11} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip
                labelFormatter={(d) =>
                  typeof d === "string"
                    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : d
                }
                contentStyle={{ 
                  borderRadius: 12, 
                  backgroundColor: "#FFFFFF", 
                  borderColor: "#DCE7EA", 
                  boxShadow: "0 5px 18px rgba(15, 45, 64, 0.08)",
                  fontSize: 12,
                  fontWeight: 600
                }}
              />
              <Line
                type="monotone"
                dataKey="case_count"
                name="Actual Cases"
                stroke="#2B9C95"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#2B9C95" }}
                activeDot={{ r: 6, fill: "#173F59" }}
              />
              <Line
                type="monotone"
                dataKey="baseline"
                name="4-Wk Baseline"
                stroke="#6D7F8C"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
              {anomalyPoints.map((p) => (
                <ReferenceDot
                  key={p.week}
                  x={p.week}
                  y={p.case_count}
                  r={7}
                  fill="#DC4D57"
                  stroke="#FFFFFF"
                  strokeWidth={2.5}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              <span className="w-3 h-0.5 bg-accent"></span> Actual Weekly Cases
            </span>
            <span className="flex items-center gap-1.5 font-bold text-muted-foreground">
              <span className="w-3 h-0.5 bg-muted-foreground border-t border-dashed"></span> 4-Week Trailing Baseline
            </span>
            <span className="flex items-center gap-1.5 font-bold text-destructive">
              <span className="w-2.5 h-2.5 rounded-full bg-destructive"></span> Anomaly (&gt;2x Baseline)
            </span>
          </div>
          <span>Updated: Weekly Epidemiological Bulletin</span>
        </div>
      </section>
    </main>
  );
}
