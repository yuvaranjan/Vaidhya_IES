import { 
  Search, 
  FileText, 
  Activity, 
  Calendar, 
  UserCheck, 
  Download, 
  Filter, 
  Eye,
  Clock,
  Sparkles
} from "lucide-react";

export default function MedicalHistoryPage() {
  const mockHistory = [
    {
      id: "v_101",
      type: "medical",
      typeLabel: "Medical Visit",
      date: "2026-07-28",
      doctor: "Dr. Eleanor Vance, MD",
      complaint: "Persistent dry cough and mild evening fever.",
      status: "Completed",
      diagnosis: "Upper Respiratory Infection (Mild)",
      medsCount: 2,
      badgeBg: "bg-[#E5F5F3]",
      badgeText: "text-[#14736A]",
      badgeBorder: "border-[#C2E8E4]",
    },
    {
      id: "v_092",
      type: "lab",
      typeLabel: "Lab Result",
      date: "2026-02-14",
      doctor: "Central Diagnostics Lab",
      complaint: "Comprehensive Annual Metabolic & Blood Panel.",
      status: "Verified",
      diagnosis: "All lipid & glucose markers optimal",
      medsCount: 0,
      badgeBg: "bg-[#EEF3FB]",
      badgeText: "text-[#315A94]",
      badgeBorder: "border-[#D1E0F5]",
    },
    {
      id: "v_085",
      type: "care_plan",
      typeLabel: "Care Plan",
      date: "2026-01-10",
      doctor: "Dr. Marcus Brody",
      complaint: "Post-consultation hypertension management plan.",
      status: "Active",
      diagnosis: "Stage 1 Essential Hypertension (Monitored)",
      medsCount: 1,
      badgeBg: "bg-[#F4F0FB]",
      badgeText: "text-[#7050A8]",
      badgeBorder: "border-[#E4D9F5]",
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-5 sm:px-8 space-y-7">
      {/* Header Pattern */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-1">Health Records</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-[-0.025em]">Medical History</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 h-10 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>Export Health Summary</span>
          </button>
        </div>
      </div>

      {/* Filter Bar & Search (Section 6: Segmented Control Spec) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Segmented Control Filter */}
        <div className="inline-flex rounded-lg bg-secondary p-1 border border-border">
          <button className="px-3.5 py-1.5 rounded-md bg-card text-primary font-bold text-xs shadow-sm">
            All Records (3)
          </button>
          <button className="px-3.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground font-semibold text-xs transition-colors">
            Medical Visits
          </button>
          <button className="px-3.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground font-semibold text-xs transition-colors">
            Lab Results
          </button>
          <button className="px-3.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground font-semibold text-xs transition-colors">
            Care Plans
          </button>
        </div>

        {/* Search Input (Section 6: Search Specs) */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records or doctors..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Records List Container */}
      <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 bg-secondary/80 border-b border-border px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-secondary-foreground">
          <div className="col-span-3 sm:col-span-2">Type & Date</div>
          <div className="col-span-6 sm:col-span-7">Clinical Summary & Diagnosis</div>
          <div className="col-span-3 sm:col-span-3 text-right">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {mockHistory.map((record) => (
            <div 
              key={record.id} 
              className="grid grid-cols-12 p-5 px-6 items-center hover:bg-secondary/30 transition-colors group"
            >
              {/* Type & Date */}
              <div className="col-span-3 sm:col-span-2 space-y-1.5">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${record.badgeBg} ${record.badgeText} ${record.badgeBorder}`}>
                  {record.typeLabel}
                </span>
                <p className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  {new Date(record.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>

              {/* Summary */}
              <div className="col-span-6 sm:col-span-7 pr-4 space-y-1">
                <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {record.complaint}
                </h4>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <UserCheck className="w-3.5 h-3.5 text-accent" /> {record.doctor}
                  </span>
                  <span>&bull;</span>
                  <span>Diagnosis: <strong className="text-foreground font-semibold">{record.diagnosis}</strong></span>
                </div>
              </div>

              {/* Actions */}
              <div className="col-span-3 sm:col-span-3 flex items-center justify-end gap-2">
                <button className="px-3 h-8 rounded-lg bg-background border border-border text-foreground text-xs font-bold hover:bg-secondary transition-colors flex items-center gap-1.5 shadow-sm">
                  <Eye className="w-3.5 h-3.5 text-accent" />
                  <span>Report</span>
                </button>
                <button className="p-2 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shadow-sm" title="Download Record">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
