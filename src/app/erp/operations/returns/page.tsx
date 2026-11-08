"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  RotateCcw,
  Search,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Calendar,
  Wallet,
  Sparkles,
  Wrench,
  Printer,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Booking } from "@/types";

export default function ReturnsCounterPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Return Inspection Inputs
  const [hasStains, setHasStains] = useState(false);
  const [hasTears, setHasTears] = useState(false);
  const [missingAccessories, setMissingAccessories] = useState(false);
  const [zipperFunctional, setZipperFunctional] = useState(true);
  const [inspectionNotes, setInspectionNotes] = useState("Garment returned in good condition.");
  const [damageDeduction, setDamageDeduction] = useState<number>(0);
  const [lateFee, setLateFee] = useState<number>(0);
  const [nextAction, setNextAction] = useState<"CLEAN_AVAILABLE" | "SEND_TO_LAUNDRY" | "SEND_TO_MAINTENANCE">("SEND_TO_LAUNDRY");
  const [staffName, setStaffName] = useState("Pooja Das (Manager)");

  useEffect(() => {
    const list = DataStore.getBookings();
    setBookings(list);
    const active = list.find((b) => b.status === "OUT_ON_RENT" || b.status === "RETURN_RECEIVED");
    if (active) {
      setSelectedBooking(active);
      if (active.returnDueDate < "2026-11-08") {
        setLateFee(300); // Sample overdue fee
      }
    }
  }, []);

  const activeRentals = bookings.filter(
    (b) => b.status === "OUT_ON_RENT" || b.status === "RETURN_RECEIVED"
  );

  const handleProcessReturn = () => {
    if (!selectedBooking) return;

    const result = DataStore.processReturnAndSettlement(
      selectedBooking.id,
      staffName,
      damageDeduction,
      lateFee,
      inspectionNotes,
      nextAction
    );

    if (result.success) {
      alert(
        `Return completed! Security deposit settled. Net refund of ${formatINR(
          result.refundAmount
        )} handed back to ${selectedBooking.customerName}. Garment routed to ${nextAction}.`
      );
      setBookings(DataStore.getBookings());
      setSelectedBooking(null);
    }
  };

  const depositHeld = selectedBooking ? selectedBooking.securityDepositTotal : 0;
  const netRefund = Math.max(0, depositHeld - damageDeduction - lateFee);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-[#8C6F3B] font-semibold uppercase tracking-wider mb-1">
          <RotateCcw className="w-4 h-4 text-[#4B1835]" />
          <span>Intake, Damage Check &amp; Deposit Settlement</span>
        </div>
        <h1 className="text-2xl font-serif font-bold text-[#27222A]">Return Counter &amp; Inspection</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Process customer garment returns, execute multi-point condition checks, calculate damage deductions, and settle refundable deposits.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Rentals Queue */}
        <div className="bg-white rounded-2xl border border-[#EFE9DD] p-4 shadow-xs space-y-3">
          <div className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center justify-between pb-2 border-b border-[#EFE9DD]">
            <span>Active Out on Rent ({activeRentals.length})</span>
            <span className="text-[10px] text-gray-400">Due Today / Overdue</span>
          </div>

          <div className="space-y-2">
            {activeRentals.map((b) => {
              const isOverdue = b.returnDueDate < "2026-11-08";
              return (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedBooking(b);
                    setLateFee(isOverdue ? 300 : 0);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                    selectedBooking?.id === b.id
                      ? "bg-[#FAF5EB] border-[#B89558] shadow-xs"
                      : isOverdue
                      ? "bg-rose-50/70 border-rose-200"
                      : "bg-[#FBF9F5] border-[#E8DFD1] hover:border-[#B89558]"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-gray-900">
                    <span>{b.customerName}</span>
                    {isOverdue && (
                      <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                        OVERDUE
                      </span>
                    )}
                  </div>
                  <div className="text-gray-500 text-[11px] mt-0.5">
                    {b.items.map((i) => i.productName).join(", ")}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className={isOverdue ? "text-rose-700 font-bold" : "text-[#8C6F3B] font-semibold"}>
                      Due: {formatDate(b.returnDueDate)}
                    </span>
                    <span className="font-mono text-gray-500">Dep: {formatINR(b.securityDepositTotal)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Inspection & Settlement Card */}
        <div className="lg:col-span-2">
          {selectedBooking ? (
            <div className="bg-white rounded-2xl border border-[#EFE9DD] p-6 shadow-xs space-y-5 text-xs">
              <div className="flex items-start justify-between pb-3 border-b border-[#EFE9DD]">
                <div>
                  <div className="text-[10px] text-[#8C6F3B] font-bold uppercase">
                    Return Check-in &amp; Quality Inspection
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mt-0.5">
                    {selectedBooking.customerName} ({selectedBooking.customerPhone})
                  </h2>
                  <div className="text-gray-500 text-[11px]">
                    Booking: <strong>{selectedBooking.id}</strong> • Return Due:{" "}
                    <strong>{formatDate(selectedBooking.returnDueDate)}</strong>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-400">Deposit In Vault</div>
                  <div className="text-lg font-bold text-[#B89558] font-mono">
                    {formatINR(depositHeld)}
                  </div>
                </div>
              </div>

              {/* Items to verify */}
              <div className="space-y-2">
                <div className="font-bold text-gray-800 uppercase text-[11px]">
                  Garment Physical Units Handed Back
                </div>
                {selectedBooking.items.map((item) => (
                  <div
                    key={item.garmentUnitId}
                    className="p-3 bg-[#FBF9F5] rounded-xl border border-[#E8DFD1] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#4B1835]">{item.garmentUnitId}</span>
                      <span className="font-bold text-gray-900">{item.productName}</span>
                    </div>
                    <span className="text-gray-500 font-mono">Deposit: {formatINR(item.securityDeposit)}</span>
                  </div>
                ))}
              </div>

              {/* Inspection Multi-point Checklist */}
              <div className="p-4 bg-[#FAF5EB] rounded-xl border border-[#E8DFD1] space-y-3">
                <div className="font-bold text-gray-900 uppercase text-[11px]">
                  Physical Condition Checklist
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-[#E8DFD1] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasStains}
                      onChange={(e) => setHasStains(e.target.checked)}
                      className="rounded text-[#4B1835]"
                    />
                    <span className="font-semibold text-gray-800">Stains / Spills</span>
                  </label>

                  <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-[#E8DFD1] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasTears}
                      onChange={(e) => setHasTears(e.target.checked)}
                      className="rounded text-[#4B1835]"
                    />
                    <span className="font-semibold text-gray-800">Tears / Rips</span>
                  </label>

                  <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-[#E8DFD1] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={missingAccessories}
                      onChange={(e) => setMissingAccessories(e.target.checked)}
                      className="rounded text-[#4B1835]"
                    />
                    <span className="font-semibold text-gray-800">Missing Parts</span>
                  </label>

                  <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-[#E8DFD1] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={zipperFunctional}
                      onChange={(e) => setZipperFunctional(e.target.checked)}
                      className="rounded text-[#4B1835]"
                    />
                    <span className="font-semibold text-gray-800">Zip / Hooks OK</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Inspection Remarks &amp; Damage Evidence Notes
                  </label>
                  <input
                    type="text"
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E8DFD1] rounded-lg"
                  />
                </div>
              </div>

              {/* Deductions & Settlement Calculation */}
              <div className="p-4 bg-white rounded-xl border-2 border-[#B89558]/30 space-y-3">
                <div className="font-bold text-gray-900 text-xs uppercase flex items-center justify-between">
                  <span>Refundable Deposit Settlement Breakdown</span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    Strict Accounting Reconciliation
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                      Damage Deduction Penalty (₹)
                    </label>
                    <input
                      type="number"
                      value={damageDeduction}
                      onChange={(e) => setDamageDeduction(Number(e.target.value) || 0)}
                      className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-bold text-rose-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                      Late Return Delay Penalty (₹)
                    </label>
                    <input
                      type="number"
                      value={lateFee}
                      onChange={(e) => setLateFee(Number(e.target.value) || 0)}
                      className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-bold text-rose-700"
                    />
                  </div>
                </div>

                {/* Final Settlement Math */}
                <div className="p-3 bg-[#FAF5EB] rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-gray-500">Security Deposit Held</div>
                    <div className="font-bold text-sm text-[#4B1835]">{formatINR(depositHeld)}</div>
                  </div>
                  <div className="text-gray-400 font-bold">−</div>
                  <div>
                    <div className="text-[10px] text-gray-500">Total Deductions</div>
                    <div className="font-bold text-sm text-rose-700">
                      {formatINR(damageDeduction + lateFee)}
                    </div>
                  </div>
                  <div className="text-gray-400 font-bold">=</div>
                  <div className="text-right">
                    <div className="text-[10px] text-emerald-800 font-bold uppercase">
                      Net Deposit Refund to Customer
                    </div>
                    <div className="font-bold text-lg text-emerald-700 font-mono">
                      {formatINR(netRefund)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Routing Step */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-700 uppercase">
                  Route Garment Physical Unit to Next Stage *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setNextAction("SEND_TO_LAUNDRY")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      nextAction === "SEND_TO_LAUNDRY"
                        ? "bg-[#4B1835] text-white border-[#4B1835] font-bold shadow-xs"
                        : "bg-[#FBF9F5] text-gray-700 border-[#E8DFD1]"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mx-auto mb-1 text-[#D4B67F]" />
                    <span>Send to Dry Cleaners</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNextAction("SEND_TO_MAINTENANCE")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      nextAction === "SEND_TO_MAINTENANCE"
                        ? "bg-[#4B1835] text-white border-[#4B1835] font-bold shadow-xs"
                        : "bg-[#FBF9F5] text-gray-700 border-[#E8DFD1]"
                    }`}
                  >
                    <Wrench className="w-4 h-4 mx-auto mb-1 text-[#D4B67F]" />
                    <span>Send to Tailor / Zari Fix</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNextAction("CLEAN_AVAILABLE")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      nextAction === "CLEAN_AVAILABLE"
                        ? "bg-[#4B1835] text-white border-[#4B1835] font-bold shadow-xs"
                        : "bg-[#FBF9F5] text-gray-700 border-[#E8DFD1]"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-[#D4B67F]" />
                    <span>Pristine (Make Available)</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#EFE9DD] flex items-center justify-between">
                <div className="text-[11px] text-gray-500">
                  Inspected By: <strong>{staffName}</strong>
                </div>

                <button
                  onClick={handleProcessReturn}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Settle Deposit &amp; Complete Return</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#EFE9DD] p-12 text-center text-xs text-gray-400 shadow-xs">
              Select an active rental from the left queue to conduct return check-in.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
