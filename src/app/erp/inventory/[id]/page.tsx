"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Shirt,
  MapPin,
  QrCode,
  Calendar,
  Sparkles,
  Wrench,
  Clock,
  History,
  TrendingUp,
  ShieldCheck,
  Check,
  AlertCircle,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GarmentUnit, GarmentStatus, Booking } from "@/types";

function GarmentDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [garment, setGarment] = useState<GarmentUnit | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "maintenance">("overview");
  const [newStatus, setNewStatus] = useState<GarmentStatus>("AVAILABLE");
  const [statusNote, setStatusNote] = useState("");

  useEffect(() => {
    if (id) {
      const g = DataStore.getGarmentById(id);
      if (g) {
        setGarment(g);
        setNewStatus(g.status);
      }
      const bList = DataStore.getBookings().filter((b) =>
        b.items.some((item) => item.garmentUnitId === id)
      );
      setBookings(bList);
    }
  }, [id]);

  if (!garment) {
    return (
      <div className="text-center py-20 text-gray-500">
        <div className="font-bold text-base">Garment SKU not found.</div>
        <Link href="/erp/inventory" className="text-xs text-[#4B1835] underline mt-2 inline-block">
          Return to Inventory
        </Link>
      </div>
    );
  }

  const handleUpdateStatus = () => {
    DataStore.updateGarmentStatus(garment.id, newStatus, statusNote || undefined);
    const updated = DataStore.getGarmentById(garment.id);
    if (updated) setGarment(updated);
    alert(`Status for ${garment.id} successfully updated to ${newStatus}`);
  };

  const totalEarned = bookings
    .filter((b) => b.status === "COMPLETED")
    .reduce((acc, b) => {
      const item = b.items.find((i) => i.garmentUnitId === garment.id);
      return acc + (item ? item.rentalPrice : 0);
    }, 0);

  return (
    <div className="space-y-6">
      {/* Back button & SKU */}
      <div className="flex items-center justify-between">
        <Link
          href="/erp/inventory"
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#4B1835] font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Inventory</span>
        </Link>
        <div className="flex items-center gap-2">
          <StatusBadge status={garment.status} />
        </div>
      </div>

      {/* Main Garment Profile Card */}
      <div className="bg-white rounded-2xl border border-[#EFE9DD] p-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Garment Image */}
          <div className="space-y-2">
            <img
              src={garment.image}
              alt={garment.productName}
              className="w-full h-80 object-cover rounded-xl border border-[#EFE9DD]"
            />
            <div className="p-3 bg-[#FAF5EB] rounded-xl border border-[#E8DFD1] text-xs flex items-center justify-between">
              <span className="text-gray-500 font-mono">Barcode:</span>
              <span className="font-mono font-bold text-gray-900">{garment.barcode}</span>
            </div>
          </div>

          {/* Core Info */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <div className="text-[11px] font-bold text-[#8C6F3B] uppercase tracking-wider">
                {garment.category}
              </div>
              <h1 className="text-xl md:text-2xl font-serif font-bold text-gray-900 mt-1">
                {garment.productName}
              </h1>
              <div className="text-xs font-mono font-bold text-[#4B1835] mt-1">
                SKU: {garment.id}
              </div>
            </div>

            {/* Spec pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-[#FBF9F5] rounded-xl border border-[#E8DFD1]">
                <div className="text-[10px] text-gray-400 font-semibold uppercase">Size</div>
                <div className="font-bold text-gray-900 text-sm mt-0.5">{garment.size}</div>
              </div>
              <div className="p-3 bg-[#FBF9F5] rounded-xl border border-[#E8DFD1]">
                <div className="text-[10px] text-gray-400 font-semibold uppercase">Rental Rate</div>
                <div className="font-bold text-[#4B1835] text-sm mt-0.5">
                  {formatINR(garment.rentalPrice)}
                </div>
              </div>
              <div className="p-3 bg-[#FBF9F5] rounded-xl border border-[#E8DFD1]">
                <div className="text-[10px] text-gray-400 font-semibold uppercase">Security Deposit</div>
                <div className="font-bold text-[#B89558] text-sm mt-0.5">
                  {formatINR(garment.securityDeposit)}
                </div>
              </div>
              <div className="p-3 bg-[#FBF9F5] rounded-xl border border-[#E8DFD1]">
                <div className="text-[10px] text-gray-400 font-semibold uppercase">Rack Location</div>
                <div className="font-bold text-gray-900 text-xs mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#B89558]" />
                  <span>{garment.storageLocation}</span>
                </div>
              </div>
            </div>

            {/* Condition & Operational Notes */}
            <div className="p-3 bg-[#FAF5EB]/60 rounded-xl border border-[#E8DFD1] text-xs">
              <div className="font-bold text-gray-800">Operational Log / Condition:</div>
              <p className="text-gray-600 mt-1">
                {garment.notes || "No special notes recorded. Unit verified clean."}
              </p>
            </div>

            {/* Status Transition Control Drawer */}
            <div className="p-4 bg-white rounded-xl border-2 border-[#B89558]/30 shadow-xs space-y-3">
              <div className="font-bold text-xs text-[#4B1835] uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#B89558]" />
                <span>Authorized Status Transition</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Select Valid New Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as GarmentStatus)}
                    className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-bold text-gray-800"
                  >
                    <option value="AVAILABLE">AVAILABLE (Store Ready)</option>
                    <option value="RESERVED">RESERVED (Upcoming Booking)</option>
                    <option value="PREPARING">PREPARING (Ironing/Packaging)</option>
                    <option value="RENTED">RENTED (With Client)</option>
                    <option value="RETURN_RECEIVED">RETURN_RECEIVED (Counter Check-in)</option>
                    <option value="IN_LAUNDRY">IN_LAUNDRY (Dry Cleaning)</option>
                    <option value="UNDER_REPAIR">UNDER_REPAIR (Tailoring / Zari)</option>
                    <option value="QUALITY_CHECK">QUALITY_CHECK (Final Inspection)</option>
                    <option value="DAMAGED">DAMAGED (Quarantined)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Transition Reason / Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ironed and returned to Rack A-01"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleUpdateStatus}
                  className="bg-[#4B1835] hover:bg-[#320F23] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors"
                >
                  Confirm Status Change
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Rental History / Maintenance */}
      <div className="bg-white rounded-2xl border border-[#EFE9DD] p-5 shadow-xs">
        <div className="flex border-b border-[#EFE9DD] gap-6 text-xs font-bold mb-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-[#4B1835] text-[#4B1835]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            Rental Lifecycle History ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("maintenance")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "maintenance"
                ? "border-[#4B1835] text-[#4B1835]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            Care &amp; Laundry Records
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400">
                No rental bookings recorded yet for this physical unit.
              </div>
            ) : (
              bookings.map((b) => (
                <div
                  key={b.id}
                  className="p-3 bg-[#FBF9F5] rounded-xl border border-[#E8DFD1] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                      <span className="text-[#4B1835] font-mono">{b.id}</span>
                      <span>— {b.customerName} ({b.customerCity})</span>
                    </div>
                    <div className="text-gray-500 text-[11px] mt-0.5">
                      Event: {b.eventName} • Dates: {formatDate(b.pickupDate)} to {formatDate(b.returnDueDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={b.status} />
                    <div className="text-[11px] text-gray-500 mt-1 font-mono">
                      Rental: {formatINR(garment.rentalPrice)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "maintenance" && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#FAF5EB] rounded-xl border border-[#E8DFD1]">
              <div className="font-bold text-gray-900 flex items-center justify-between">
                <span>Maa Samleswari Dry Cleaners Batch #041</span>
                <span className="text-emerald-700 font-bold">Standard Steam Clean</span>
              </div>
              <p className="text-gray-600 text-[11px] mt-1">
                Hydrocarbon delicate washing with zari protection sheet. Cost: ₹450.
              </p>
            </div>
            <div className="p-3 bg-[#FBF9F5] rounded-xl border border-[#E8DFD1]">
              <div className="font-bold text-gray-900 flex items-center justify-between">
                <span>Master Salim Tailoring Service</span>
                <span className="text-gray-600">Waist Hook Re-enforcement</span>
              </div>
              <p className="text-gray-600 text-[11px] mt-1">
                Reinforced heavy metal hook and eye. Cost: ₹120.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GarmentDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading garment unit...</div>}>
      <GarmentDetailContent />
    </Suspense>
  );
}
