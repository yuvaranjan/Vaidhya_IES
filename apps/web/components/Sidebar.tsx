"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Stethoscope, 
  FileText, 
  User, 
  Users, 
  Activity, 
  Settings,
  HeartPulse,
  Sparkles,
  Pill
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  iconName?: string;
};

const getIcon = (name?: string, active?: boolean) => {
  const strokeWidth = active ? 2.2 : 1.8;
  const size = 18;
  switch (name) {
    case "dashboard":
      return <LayoutDashboard size={size} strokeWidth={strokeWidth} />;
    case "assistant":
    case "consult":
      return <Sparkles size={size} strokeWidth={strokeWidth} />;
    case "intake":
    case "vitals":
      return <HeartPulse size={size} strokeWidth={strokeWidth} />;
    case "prescription":
    case "pharmacy":
    case "erx":
      return <Pill size={size} strokeWidth={strokeWidth} />;
    case "history":
    case "records":
      return <FileText size={size} strokeWidth={strokeWidth} />;
    case "profile":
    case "account":
      return <User size={size} strokeWidth={strokeWidth} />;
    case "settings":
      return <Settings size={size} strokeWidth={strokeWidth} />;
    case "queue":
    case "patients":
      return <Users size={size} strokeWidth={strokeWidth} />;
    default:
      return <Stethoscope size={size} strokeWidth={strokeWidth} />;
  }
};

export function Sidebar({ 
  items, 
  userName, 
  userRole 
}: { 
  items: NavItem[]; 
  userName: string; 
  userRole: string; 
}) {
  const pathname = usePathname();

  const checkActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/doctor/queue") return pathname === "/doctor/queue";
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border flex flex-col z-20 shadow-[2px_0_12px_rgba(15,45,64,0.03)] hidden md:flex">
      {/* Brand Header */}
      <div className="h-[76px] flex items-center px-6 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
            <HeartPulse className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-[-0.02em] leading-tight">Cure Cloud</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Smart Care OS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 bg-background/40">
        <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-3">Navigation</p>
        {items.map((item, index) => {
          const isActive = checkActive(item.href);
          return (
            <Link
              key={`${item.href}-${index}`}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all group ${
                isActive 
                  ? "bg-[#E8F4F3] text-primary font-bold shadow-sm" 
                  : "text-[#607482] hover:bg-secondary/80 hover:text-foreground"
              }`}
            >
              <div className={`transition-colors ${isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground"}`}>
                {getIcon(item.iconName || item.label.toLowerCase().split(' ')[0], isActive)}
              </div>
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_rgba(43,156,149,0.6)]"></div>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Footer Card */}
      <div className="p-3 border-t border-border bg-card">
        <div className="flex items-center gap-3 p-3 bg-secondary/60 rounded-xl border border-border/80">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-accent ring-2 ring-white"></span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate leading-snug">{userName}</p>
            <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-muted-foreground">{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

