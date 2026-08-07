"use client";

import { useState } from "react";
import { 
  Pill, 
  Printer, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Building2, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  FileCheck
} from "lucide-react";

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  duration: string;
  instructions: string;
};

type Pharmacy = {
  id: string;
  name: string;
  address: string;
  distance: string;
  phone: string;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  stockLabel: string;
  outOfStockItem?: string;
};

export function PrescriptionFulfillmentClient({
  patientName,
  medications,
}: {
  patientName: string;
  medications: Medication[];
}) {
  const [selectedPharmacy, setSelectedPharmacy] = useState<string | null>(null);
  const [fulfilledOrder, setFulfilledOrder] = useState<string | null>(null);

  const pharmacies: Pharmacy[] = [
    {
      id: "pharm_01",
      name: "City Medicals & Healthcare",
      address: "12 MG Road, Sector 4, Central Junction",
      distance: "0.6 km away",
      phone: "+91 98470 11223",
      stockStatus: "in_stock",
      stockLabel: "All Items In Stock",
    },
    {
      id: "pharm_02",
      name: "Devi Pharmacy",
      address: "45 Hospital Road, Near Government Clinic",
      distance: "1.2 km away",
      phone: "+91 98470 44556",
      stockStatus: "low_stock",
      stockLabel: "Limited Stock (1 item low)",
    },
    {
      id: "pharm_03",
      name: "Amala Medicals",
      address: "88 Church Street, Block B",
      distance: "2.4 km away",
      phone: "+91 98470 77889",
      stockStatus: "out_of_stock",
      stockLabel: "Out of Stock",
      outOfStockItem: "Paracetamol 500mg",
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleFulfill = (pharmacyName: string) => {
    setSelectedPharmacy(pharmacyName);
    setFulfilledOrder(pharmacyName);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-5 sm:px-8 space-y-8">
      {/* Header Pattern */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-1 flex items-center gap-1.5">
            <Pill className="w-3.5 h-3.5 text-accent" /> Electronic Prescription (eRx) & Fulfillment
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-[-0.025em]">My Prescriptions</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="px-4 h-10 rounded-lg bg-card border border-border text-foreground font-bold text-xs hover:bg-secondary transition-colors shadow-sm flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-accent" />
            <span>Print / Save eRx PDF</span>
          </button>
        </div>
      </div>

      {fulfilledOrder && (
        <div className="p-4 bg-[#E5F5F3] border border-[#C2E8E4] text-[#14736A] rounded-xl font-bold text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#14736A]" />
            <span>Prescription sent to <strong>{fulfilledOrder}</strong>! Your order is queued for pickup in 15 minutes.</span>
          </div>
          <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 bg-white/80 rounded-full">Order #RX-8841</span>
        </div>
      )}

      {/* Main Grid: eRx Details + Nearby Pharmacies */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* Left Column: eRx Prescription Slip */}
        <div className="lg:col-span-6 bg-card border border-border rounded-xl shadow-soft p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-accent flex items-center justify-center font-bold">
                <FileCheck className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Official ePrescription</h2>
                <p className="text-xs text-muted-foreground font-medium">Issued by Attending Physician</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-[#E5F5F3] text-[#14736A] border border-[#C2E8E4]">
              Verified eRx
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs bg-background p-4 rounded-xl border border-border">
            <div>
              <p className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Patient Name</p>
              <p className="font-bold text-foreground text-sm mt-0.5">{patientName}</p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Issue Date</p>
              <p className="font-bold text-foreground text-sm mt-0.5">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
            </div>
          </div>

          {/* Prescribed Items */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">Prescribed Medications ({medications.length})</p>
            <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-background">
              {medications.map((med, i) => (
                <div key={med.id || i} className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground">{med.name}</h4>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-secondary text-primary border border-border">
                      {med.dosage}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Duration: <span className="text-foreground font-semibold">{med.duration}</span></p>
                  <p className="text-xs text-foreground font-medium bg-card p-2 rounded border border-border mt-1.5">
                    Instructions: {med.instructions}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Nearby Pharmacy Stock Availability */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-card border border-border rounded-xl shadow-soft p-6 space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Real-time Stock Check
              </p>
              <h2 className="text-xl font-bold text-foreground tracking-[-0.025em]">Nearby Pharmacies</h2>
              <p className="text-xs text-muted-foreground font-medium">Per-medicine inventory status checked live against nearby nodes.</p>
            </div>

            <div className="space-y-4 pt-2">
              {pharmacies.map((pharm) => (
                <div 
                  key={pharm.id} 
                  className={`p-5 rounded-xl border transition-all space-y-3 ${
                    selectedPharmacy === pharm.name 
                      ? "bg-[#E5F5F3] border-[#14736A] shadow-sm" 
                      : "bg-background border-border hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-accent" />
                        <h3 className="font-bold text-foreground text-sm">{pharm.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-muted-foreground" /> {pharm.address} &bull; <strong className="text-foreground">{pharm.distance}</strong>
                      </p>
                    </div>

                    {/* Stock Status Badge */}
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border shrink-0 ${
                      pharm.stockStatus === "in_stock" ? "bg-[#E5F5F3] text-[#14736A] border-[#C2E8E4]" :
                      pharm.stockStatus === "low_stock" ? "bg-[#EEF3FB] text-[#315A94] border-[#D1E0F5]" :
                      "bg-destructive/10 text-destructive border-destructive/20"
                    }`}>
                      {pharm.stockLabel}
                    </span>
                  </div>

                  {pharm.stockStatus === "out_of_stock" && pharm.outOfStockItem && (
                    <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>Item out of stock: {pharm.outOfStockItem}</span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-border/60">
                    <span className="text-[11px] text-muted-foreground font-semibold">Contact: {pharm.phone}</span>
                    <button
                      disabled={pharm.stockStatus === "out_of_stock"}
                      onClick={() => handleFulfill(pharm.name)}
                      className={`px-4 h-9 rounded-lg font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 ${
                        selectedPharmacy === pharm.name
                          ? "bg-[#14736A] text-white"
                          : pharm.stockStatus === "out_of_stock"
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : "bg-primary text-primary-foreground hover:opacity-90"
                      }`}
                    >
                      <span>{selectedPharmacy === pharm.name ? "Order Sent ✓" : "Send eRx Here"}</span>
                      {selectedPharmacy !== pharm.name && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
