export type CaseRow = {
  region_id: string;
  disease_category: string;
  week_start_date: string;
  case_count: number;
  rolling_baseline: number | null;
  is_anomaly: boolean | null;
};

export const REGION_LABELS: Record<string, string> = {
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

export const DISEASE_LABELS: Record<string, string> = {
  dengue: "Dengue Fever",
  respiratory_infection: "Respiratory Infection",
  diarrheal_disease: "Diarrheal Disease",
  hypertension_related: "Hypertension-Related",
};

const REGIONS = [
  { id: "reg_thrissur", mult: 1.0 },
  { id: "reg_palakkad", mult: 0.9 },
  { id: "reg_ernakulam", mult: 1.3 },
  { id: "reg_kozhikode", mult: 1.1 },
  { id: "reg_malappuram", mult: 1.2 },
  { id: "reg_kannur", mult: 0.8 },
  { id: "reg_kollam", mult: 0.95 },
  { id: "reg_alappuzha", mult: 1.05 },
  { id: "reg_kottayam", mult: 0.85 },
  { id: "reg_wayanad", mult: 0.6 },
];

const DISEASES = [
  { id: "dengue", base: 8, amp: 2 },
  { id: "respiratory_infection", base: 20, amp: 4 },
  { id: "diarrheal_disease", base: 12, amp: 3 },
  { id: "hypertension_related", base: 15, amp: 2 },
];

export function generateMockAnalyticsRows(): CaseRow[] {
  const rows: CaseRow[] = [];
  const anchorDate = new Date("2026-08-03");

  for (let w = 1; w <= 26; w++) {
    const d = new Date(anchorDate);
    d.setDate(d.getDate() - (26 - w) * 7);
    const dateStr = d.toISOString().split("T")[0];

    for (const r of REGIONS) {
      for (const dis of DISEASES) {
        // Deterministic pseudo-random variation
        const pseudoWave = Math.sin((w + r.id.length + dis.id.length) * 0.5);
        let caseCount = Math.round((dis.base + pseudoWave * dis.amp) * r.mult);

        // Specific anomaly: Dengue outbreak in Ernakulam on Week 24
        let isAnomaly = false;
        if (r.id === "reg_ernakulam" && dis.id === "dengue" && w === 24) {
          caseCount = 38; // 3.2x baseline spike
          isAnomaly = true;
        }

        // Rolling baseline (average of trailing 4 weeks)
        let baseline: number | null = null;
        if (w >= 4) {
          const pastCounts = rows
            .filter(row => row.region_id === r.id && row.disease_category === dis.id)
            .slice(-4)
            .map(row => row.case_count);
          if (pastCounts.length > 0) {
            const sum = pastCounts.reduce((a, b) => a + b, 0);
            baseline = Math.round((sum / pastCounts.length) * 10) / 10;
          }
        }

        if (baseline && caseCount >= baseline * 2 && w > 4) {
          isAnomaly = true;
        }

        rows.push({
          region_id: r.id,
          disease_category: dis.id,
          week_start_date: dateStr,
          case_count: caseCount,
          rolling_baseline: baseline,
          is_anomaly: isAnomaly,
        });
      }
    }
  }

  return rows;
}
