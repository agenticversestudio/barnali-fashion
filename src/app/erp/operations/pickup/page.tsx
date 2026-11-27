"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
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
  Loader2,
} from "lucide-react";
import { bookingsApi } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { BookingDto, PayMode } from "@/types/api";
import { useAuth } from "@/context/AuthContext";
import { PhotoCapture } from "@/components/operations/PhotoCapture";
import { EmptyState } from "@/components/ui/EmptyState";

function PickupOperationsContent() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Verification checks
  const [accessoriesChecked, setAccessoriesChecked] = useState(true);
  const [conditionChecked, setConditionChecked] = useState(true);
  const [balancePayMode, setBalancePayMode] = useState<PayMode>("CASH");
  const [handoverCondition, setHandoverCondition] = useState(
    "Fitting checked with client, zari intact, wooden hanger & dust cover bag verified"
  );
  const [photoIds, setPhotoIds] = useState<string[]>([]);

  const loadPickups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingsApi.list({ status: "CONFIRMED" });
      const items = res.items || [];
      setBookings(items);
      if (items.length > 0) {
        setSelectedBooking(items[0]);
      } else {
        setSelectedBooking(null);
      }
    } catch (err) {
      console.error("Failed to load confirmed bookings for pickup:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPickups();
  }, [loadPickups]);

  const handleIssueGarments = async () => {
    if (!selectedBooking) return;
    if (!accessoriesChecked || !conditionChecked) {
      alert("Please confirm the accessories checklist and condition check before handing over the garment.");
      return;
    }

    setSubmitting(true);
    try {
      const payments: { kind: "BALANCE"; amount: number; mode: PayMode }[] = [];
      if (selectedBooking.balanceDue > 0) {
        payments.push({
          kind: "BALANCE",
          amount: selectedBooking.balanceDue,
          mode: balancePayMode,
        });
      }

      await bookingsApi.pickup(selectedBooking.id, {
        handoverCondition: handoverCondition.trim() || undefined,
        photoIds: photoIds.length > 0 ? photoIds : undefined,
        payments: payments.length > 0 ? payments : undefined,
      });

      alert(`Handover completed! Garments are now OUT ON RENT to ${selectedBooking.customer?.name}.`);
      setPhotoIds([]);
      await loadPickups();
    } catch (err: any) {
      alert(err?.message || "Failed to complete pickup handover");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-gold-dark font-semibold uppercase tracking-wider mb-1">
          <PackageCheck className="w-4 h-4 text-plum" />
          <span>Dispatch &amp; Client Handover Desk</span>
        </div>
        <h1 className="text-2xl page-title">Pickup / Issue Management</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Execute physical garment handovers, verify accompanying accessories, and log balance settlements.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-line-soft p-12 text-center text-xs text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin text-plum mx-auto mb-2" />
          Loading confirmed bookings queue for pickup...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Queue of Bookings Awaiting Handover */}
          <div className="bg-white rounded-2xl border border-line-soft p-4 shadow-xs space-y-3">
            <div className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center justify-between pb-2 border-b border-line-soft">
              <span>Pending Pickups ({bookings.length})</span>
              <span className="text-[10px] text-gray-400">Confirmed</span>
            </div>

            {bookings.length === 0 ? (
              <EmptyState title="No confirmed bookings awaiting pickup right now." className="py-8" />
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBooking(b);
                      setPhotoIds([]);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                      selectedBooking?.id === b.id
                        ? "bg-gold-soft border-gold shadow-xs"
                        : "bg-ivory border-line hover:border-gold"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-gray-900">
                      <span>{b.customer?.name}</span>
                      <span className="font-mono text-plum text-[11px]">{b.id}</span>
                    </div>
                    <div className="text-gray-500 text-[11px] mt-0.5 truncate">
                      {b.items.map((i) => i.name).join(", ")}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-gold-dark font-semibold">
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
              <div className="bg-white rounded-2xl border border-line-soft p-6 shadow-xs space-y-5 text-xs">
                <div className="flex items-start justify-between pb-3 border-b border-line-soft">
                  <div>
                    <div className="text-[10px] text-gold-dark font-bold uppercase">
                      Handover Checklist for Booking
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mt-0.5">
                      {selectedBooking.customer?.name} ({selectedBooking.customer?.phone})
                    </h2>
                    <div className="text-gray-500 text-[11px]">
                      Event: <strong>{selectedBooking.eventName || "Event"}</strong> • Return Due:{" "}
                      <strong>{formatDate(selectedBooking.returnDueDate)}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-plum">
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
                        key={item.garmentId}
                        className="p-3 bg-ivory rounded-xl border border-line flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-plum bg-white px-2 py-1 rounded border border-line">
                            {item.garmentId}
                          </span>
                          <div>
                            <div className="font-bold text-gray-900">{item.name}</div>
                            <div className="text-gray-500 text-[11px]">
                              Size: {item.size} {item.rack ? `• Rack: ${item.rack}` : ""}
                            </div>
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
                <div className="p-4 bg-gold-soft rounded-xl border border-line space-y-2">
                  <div className="font-bold text-plum text-xs">Payment &amp; Deposit Verification</div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="p-2 bg-white rounded-lg border border-line">
                      <div className="text-[10px] text-gray-400">Total Rental</div>
                      <div className="font-bold text-gray-900 mt-0.5 font-mono">
                        {formatINR(selectedBooking.rentalTotal)}
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-line">
                      <div className="text-[10px] text-gray-400">Amount Paid</div>
                      <div className="font-bold text-emerald-700 mt-0.5 font-mono">
                        {formatINR(selectedBooking.amountPaid)}
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-gold">
                      <div className="text-[10px] text-gold-dark font-bold">Security Deposit</div>
                      <div className="font-bold text-gold mt-0.5 font-mono">
                        {formatINR(selectedBooking.depositTotal)}
                      </div>
                    </div>
                  </div>

                  {selectedBooking.balanceDue > 0 && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-amber-900 font-bold">
                        Collect Remaining Balance: {formatINR(selectedBooking.balanceDue)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-gray-600">Payment Mode:</span>
                        <select
                          value={balancePayMode}
                          onChange={(e) => setBalancePayMode(e.target.value as PayMode)}
                          className="p-1.5 bg-white border border-amber-300 rounded-lg font-bold text-xs"
                        >
                          <option value="CASH">Cash in Drawer</option>
                          <option value="UPI">UPI (GPay / PhonePe)</option>
                          <option value="CARD">Card POS</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Handover Condition Remarks & Evidence Photos */}
                <div className="space-y-3 border-t border-line-soft pt-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-800 uppercase mb-1">
                      Handover Condition Remarks *
                    </label>
                    <input
                      type="text"
                      value={handoverCondition}
                      onChange={(e) => setHandoverCondition(e.target.value)}
                      placeholder="e.g. Small stain on left sleeve, zari intact, hanger & bag given"
                      className="w-full p-2.5 bg-ivory border border-line rounded-xl font-medium text-xs text-gray-900 focus:outline-hidden focus:border-plum"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      Inspect garment with customer and note any pre-existing marks, loose threads, or accessories handed over.
                    </p>
                  </div>

                  <div className="p-3 bg-gold-soft rounded-xl border border-line">
                    <PhotoCapture
                      kind="HANDOVER"
                      bookingId={selectedBooking.id}
                      photoIds={photoIds}
                      onChangePhotoIds={setPhotoIds}
                      label="Handover Verification Photos"
                      sublabel="Photograph any pre-existing marks, accessories, or fitting before client leaves (auto-compressed <400KB)"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Physical Checks */}
                <div className="space-y-2 border-t border-line-soft pt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accessoriesChecked}
                      onChange={(e) => setAccessoriesChecked(e.target.checked)}
                      className="w-4 h-4 rounded text-plum"
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
                      className="w-4 h-4 rounded text-plum"
                    />
                    <span className="text-gray-800 font-semibold">
                      Client inspected garment condition &amp; confirmed pristine state before leaving store
                    </span>
                  </label>
                </div>

                {/* Dispatch Action */}
                <div className="pt-3 border-t border-line-soft flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 font-mono">Logged By:</span>
                    <div className="font-semibold text-gray-800">{user?.name || "Counter Staff"}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/erp/billing/invoices?bookingId=${selectedBooking.id}`}
                      className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Issue Slip</span>
                    </Link>
                    <button
                      onClick={handleIssueGarments}
                      disabled={submitting}
                      className="bg-plum hover:bg-plum-dark disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gold-light" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-gold-light" />
                      )}
                      <span>Confirm Pickup</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState title="Select a confirmed booking from the queue to conduct the handover inspection." className="py-12" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PickupOperationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading pickups...</div>}>
      <PickupOperationsContent />
    </Suspense>
  );
}
