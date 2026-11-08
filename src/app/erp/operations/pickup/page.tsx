"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PackageCheck,
  Search,
  CheckCircle2,
  Phone,
  Calendar,
  Wallet,
  Printer,
  ShieldCheck,
  AlertCircle,
  Clock,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Booking } from "@/types";

export default function PickupOperationsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [accessoriesChecked, setAccessoriesChecked] = useState(true);
  const [conditionChecked, setConditionChecked] = useState(true);
  const [staffName, setStaffName] = useState("Rahul Sahu (Counter Staff)");

  useEffect(() => {
    const list = DataStore.getBookings();
    setBookings(list);
    const pending = list.find((b) => b.status === "CONFIRMED" || b.status === "PICKUP_PENDING");
    if (pending) setSelectedBooking(pending);
  }, []);

  const pendingPickups = bookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "PICKUP_PENDING"
  );

  const handleIssueGarments = () => {
    if (!selectedBooking) return;
    if (!accessoriesChecked || !conditionChecked) {
      alert("Please confirm the accessories checklist and condition check before handing over the garment.");
      return;
    }

    const success = DataStore.issueBooking(selectedBooking.id, staffName);
    if (success) {
      alert(`Handover completed! Garment items are now OUT ON RENT to ${selectedBooking.customerName}.`);
      setBookings(DataStore.getBookings());
      setSelectedBooking(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-[#8C6F3B] font-semibold uppercase tracking-wider mb-1">
          <PackageCheck className="w-4 h-4 text-[#4B1835]" />
          <span>Dispatch &amp; Client Handover Desk</span>
        </div>
        <h1 className="text-2xl font-serif font-bold text-[#27222A]">Pickup / Issue Management</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Execute physical garment handovers, verify accompanying accessories, and log balance settlements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Queue of Bookings Awaiting Handover */}
        <div className="bg-white rounded-2xl border border-[#EFE9DD] p-4 shadow-xs space-y-3">
          <div className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center justify-between pb-2 border-b border-[#EFE9DD]">
            <span>Pending Pickups ({pendingPickups.length})</span>
            <span className="text-[10px] text-gray-400">Chronological</span>
          </div>

          {pendingPickups.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-400">
              No pending pickups in queue right now.
            </div>
          ) : (
            <div className="space-y-2">
              {pendingPickups.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBooking(b)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                    selectedBooking?.id === b.id
                      ? "bg-[#FAF5EB] border-[#B89558] shadow-xs"
                      : "bg-[#FBF9F5] border-[#E8DFD1] hover:border-[#B89558]"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-gray-900">
                    <span>{b.customerName}</span>
                    <span className="font-mono text-[#4B1835] text-[11px]">{b.id}</span>
                  </div>
                  <div className="text-gray-500 text-[11px] mt-0.5">
                    {b.items.map((i) => i.productName).join(", ")}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-[#8C6F3B] font-semibold">
                      Pickup: {formatDate(b.pickupDate)}
                    </span>
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Operational Handover Verification Panel */}
        <div className="lg:col-span-2">
          {selectedBooking ? (
            <div className="bg-white rounded-2xl border border-[#EFE9DD] p-6 shadow-xs space-y-5 text-xs">
              <div className="flex items-start justify-between pb-3 border-b border-[#EFE9DD]">
                <div>
                  <div className="text-[10px] text-[#8C6F3B] font-bold uppercase">
                    Handover Checklist for Booking
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mt-0.5">
                    {selectedBooking.customerName} ({selectedBooking.customerPhone})
                  </h2>
                  <div className="text-gray-500 text-[11px]">
                    Event: <strong>{selectedBooking.eventName}</strong> • Return Due:{" "}
                    <strong>{formatDate(selectedBooking.returnDueDate)}</strong>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-[#4B1835]">
                    {selectedBooking.id}
                  </div>
                  <StatusBadge status={selectedBooking.status} className="mt-1" />
                </div>
              </div>

              {/* Items in this booking */}
              <div>
                <div className="font-bold text-gray-800 uppercase text-[11px] mb-2">
                  Garment Physical Units to Inspect &amp; Handover
                </div>
                <div className="space-y-2">
                  {selectedBooking.items.map((item) => (
                    <div
                      key={item.garmentUnitId}
                      className="p-3 bg-[#FBF9F5] rounded-xl border border-[#E8DFD1] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[#4B1835] bg-white px-2 py-1 rounded border border-[#E8DFD1]">
                          {item.garmentUnitId}
                        </span>
                        <div>
                          <div className="font-bold text-gray-900">{item.productName}</div>
                          <div className="text-gray-500 text-[11px]">Size: {item.size}</div>
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-gray-700">
                        {formatINR(item.rentalPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Verification */}
              <div className="p-4 bg-[#FAF5EB] rounded-xl border border-[#E8DFD1] space-y-2">
                <div className="font-bold text-[#4B1835] text-xs">Payment &amp; Deposit Verification</div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 bg-white rounded-lg border border-[#E8DFD1]">
                    <div className="text-[10px] text-gray-400">Total Rental</div>
                    <div className="font-bold text-gray-900 mt-0.5">
                      {formatINR(selectedBooking.rentalTotal)}
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-[#E8DFD1]">
                    <div className="text-[10px] text-gray-400">Advance Paid</div>
                    <div className="font-bold text-emerald-700 mt-0.5">
                      {formatINR(selectedBooking.advancePaid)}
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-[#B89558]">
                    <div className="text-[10px] text-[#8C6F3B] font-bold">Security Deposit</div>
                    <div className="font-bold text-[#B89558] mt-0.5">
                      {formatINR(selectedBooking.securityDepositTotal)}
                    </div>
                  </div>
                </div>
                {selectedBooking.remainingRentalDue > 0 && (
                  <div className="p-2 bg-amber-100/70 rounded-lg text-amber-900 font-bold text-center mt-2">
                    Remaining Rental to Collect at Counter: {formatINR(selectedBooking.remainingRentalDue)}
                  </div>
                )}
              </div>

              {/* Physical Checks */}
              <div className="space-y-2 border-t border-[#EFE9DD] pt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accessoriesChecked}
                    onChange={(e) => setAccessoriesChecked(e.target.checked)}
                    className="w-4 h-4 rounded text-[#4B1835]"
                  />
                  <span className="text-gray-800 font-semibold">
                    All accessories verified (Dupatta, latkans, safa brooch, wooden hanger &amp; garment dust cover bag)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={conditionChecked}
                    onChange={(e) => setConditionChecked(e.target.checked)}
                    className="w-4 h-4 rounded text-[#4B1835]"
                  />
                  <span className="text-gray-800 font-semibold">
                    Client inspected garment condition &amp; confirmed pristine state before leaving store
                  </span>
                </label>
              </div>

              {/* Dispatch Action */}
              <div className="pt-3 border-t border-[#EFE9DD] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 font-mono">Counter Staff:</span>
                  <div className="font-semibold text-gray-800">{staffName}</div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/erp/billing/invoices?bookingId=${selectedBooking.id}`}
                    className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Issue Slip</span>
                  </Link>
                  <button
                    onClick={handleIssueGarments}
                    className="bg-[#4B1835] hover:bg-[#320F23] text-white font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#D4B67F]" />
                    <span>Confirm Handover &amp; Issue</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#EFE9DD] p-12 text-center text-xs text-gray-400 shadow-xs">
              Select a pending booking from the left queue to conduct the handover inspection.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
