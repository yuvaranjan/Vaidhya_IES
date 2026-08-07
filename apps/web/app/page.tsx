import Link from "next/link";
import {
  ListOrdered,
  Package,
  UserCheck,
  Stethoscope,
  Building2,
  ChevronRight,
  ShieldCheck,
  Activity,
} from "lucide-react";

const NODE_ROLE = process.env.NEXT_PUBLIC_NODE_ROLE ?? "edge";

const portalSections = [
  {
    category: "Pharmacy Operations (Lane T3)",
    items: [
      {
        href: "/queue",
        title: "Incoming Dispensing Queue",
        description: "Live queue of prescriptions with one-click dispensing, GST receipt billing, and stock fulfillment.",
        icon: ListOrdered,
        badge: "Pharmacy Core",
        badgeColor: "bg-[#E5F5F3] text-[#14736A]",
      },
      {
        href: "/stock",
        title: "Pharmacy Stock & Inventory CRUD",
        description: "Live inventory management with quick +/- adjustments, restock actions, and multi-pharmacy switcher.",
        icon: Package,
        badge: "Inventory Core",
        badgeColor: "bg-[#E5F5F3] text-[#14736A]",
      },
    ],
  },
  {
    category: "Clinical Telemedicine & Intake",
    items: [
      {
        href: "/doctor/login",
        title: "Doctor Login & Telemedicine Portal",
        description: "Doctor authentication for patient queue, video consultation, and digital prescribing.",
        icon: Stethoscope,
        badge: "Doctor Portal",
        badgeColor: "bg-[#F4F0FB] text-[#7050A8]",
      },
      {
        href: "/login",
        title: "Clinic & Nurse Session Login",
        description: "Phone OTP session authentication for rural clinic intake and triage.",
        icon: UserCheck,
        badge: "Clinic Intake",
        badgeColor: "bg-[#EEF3FB] text-[#315A94]",
      },
    ],
  },
];

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto p-5 sm:p-8 space-y-8 min-h-screen">
      {/* Header */}
      <header className="bg-card rounded-xl border border-[#DCE7EA] p-6 sm:p-8 shadow-[0_5px_18px_rgba(15,45,64,0.045)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2B9C95] flex items-center gap-1.5 mb-1">
            <Activity className="w-3.5 h-3.5" /> Cure Cloud · Vaidhya Operations
          </span>
          <h1 className="text-3xl font-bold tracking-[-0.025em] text-[#173449]">
            Operational Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#6D7F8C] mt-1">
            Edge-AI telemedicine and pharmacy fulfillment network · Active Node Role:{" "}
            <span className="font-mono font-bold text-[#14736A] bg-[#E5F5F3] px-2 py-0.5 rounded-md border border-[#2B9C95]/30">
              {NODE_ROLE}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#EEF6F6] px-3.5 py-2 rounded-lg border border-[#DCE7EA] text-xs text-[#173449]">
          <ShieldCheck className="w-4 h-4 text-[#2B9C95]" />
          <span>Demo Data Seeded</span>
        </div>
      </header>

      {/* Portal Sections Grid */}
      <div className="space-y-6">
        {portalSections.map((section, idx) => (
          <div key={idx} className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#6D7F8C]">
              {section.category}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.items.map((item) => {
                const IconComponent = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group bg-card rounded-xl border border-[#DCE7EA] p-5 shadow-[0_5px_18px_rgba(15,45,64,0.045)] hover:border-[#2B9C95] transition-all flex flex-col justify-between gap-3 cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-[#EEF6F6] text-[#173F59] group-hover:bg-[#2B9C95] group-hover:text-white transition-colors">
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <h3 className="font-bold text-[#173449] group-hover:text-[#2B9C95] transition-colors text-base">
                            {item.title}
                          </h3>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>

                      <p className="text-xs text-[#6D7F8C] leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-end text-xs font-semibold text-[#2B9C95] group-hover:translate-x-0.5 transition-transform">
                      Open <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
