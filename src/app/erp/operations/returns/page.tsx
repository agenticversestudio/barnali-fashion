"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
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
  Loader2,
} from "lucide-react";
import { bookingsApi } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { BookingDto, NextAction, Settlement } from "@/types/api";
import { useAuth } from "@/context/AuthContext";
import { PhotoCapture } from "@/components/operations/PhotoCapture";
import { AddPaymentModal } from "@/components/operations/AddPaymentModal";
import { EmptyState } from "@/components/ui/EmptyState";

function localISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const NEXT_LABEL: Record<NextAction, string> = {
  AVAILABLE: "Back to rack",
  DRY_CLEAN: "Dry clean",
  REPAIR: "Repair",
  DAMAGED: "Damaged",
};

function ReturnsCounterContent() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [today, setToday] = useState("");

  // Return Inspection Inputs
  const [actualReturnDate, setActualReturnDate] = useState("");
  const [hasStains, setHasStains] = useState(false);
  const [hasTears, setHasTears] = useState(false);
  const [missingAccessories, setMissingAccessories] = useState(false);
  const [zipperFunctional, setZipperFunctional] = useState(true);
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [damageDeduction, setDamageDeduction] = useState<number>(0);
  const [cleaningCharge, setCleaningCharge] = useState<number>(0);
  const [nextAction, setNextAction] = useState<NextAction>("AVAILABLE");
  const [itemActions, setItemActions] = useState<Record<string, NextAction>>({});
  const [vendorName, setVendorName] = useState("Royal Dry Cleaners, Bargarh");
  const [refundPayMode, setRefundPayMode] = useState<"CASH" | "UPI" | "BANK_TRANSFER">("CASH");
  const [settlementResult, setSettlementResult] = useState<Settlement | null>(null);
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [extraPaymentBooking, setExtraPaymentBooking] = useState<BookingDto | null>(null);
  const [extraPaymentKind, setExtraPaymentKind] = useState<"EXTRA" | "REFUND">("EXTRA");
  const [extraPaymentAmount, setExtraPaymentAmount] = useState<number>(0);

  useEffect(() => {
    const d = localISO(new Date());
    setToday(d);
    setActualReturnDate(d);
  }, []);

  // every return starts from a clean form so one order's inspection never leaks into the next
  const resetForm = useCallback(() => {
    setHasStains(false);
    setHasTears(false);
    setMissingAccessories(false);
    setZipperFunctional(true);
    setInspectionNotes("");
    setDamageDeduction(0);
    setCleaningCharge(0);
    setNextAction("AVAILABLE");
    setItemActions({});
    setRefundPayMode("CASH");
    setPhotoIds([]);
    setActionError(null);
    setActualReturnDate(localISO(new Date()));
  }, []);

  const selectBooking = (b: BookingDto | null) => {
    setSelectedBooking(b);
    setSettlementResult(null);
    resetForm();
  };

  const loadRentals = useCallback(async (autoSelect = true) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await bookingsApi.list({ status: "OUT_ON_RENT" });
      const items = res.items || [];
      setBookings(items);
      // after a settlement we keep the finished booking on screen (its result + pending payments)
      if (autoSelect) setSelectedBooking(items[0] ?? null);
    } catch (err: any) {
      setLoadError(err?.message || "Could not load the active rentals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRentals();
  }, [loadRentals]);

  const actionFor = (garmentId: string): NextAction => itemActions[garmentId] ?? nextAction;

  const chooseAll = (a: NextAction, defaultVendor?: string) => {
    setNextAction(a);
    setItemActions({});
    if (defaultVendor && !vendorName) setVendorName(defaultVendor);
  };

  const handleProcessReturn = async () => {
    if (!selectedBooking) return;
    setActionError(null);

    if (!actualReturnDate) return setActionError("Enter the actual return date.");
    if (actualReturnDate > today) return setActionError("Return date cannot be in the future.");
    if (actualReturnDate < selectedBooking.pickupDate) return setActionError("Return date cannot be before the pickup date.");
    const damage = Math.round(Number(damageDeduction) || 0);
    const cleaning = Math.round(Number(cleaningCharge) || 0);
    if (damage < 0 || cleaning < 0) return setActionError("Deductions cannot be negative.");
    const needsVendor = selectedBooking.items.some((i) => ["DRY_CLEAN", "REPAIR"].includes(actionFor(i.garmentId)));
    if (needsVendor && !vendorName.trim()) return setActionError("Enter the vendor name for the dry-clean / repair routing.");

    setSubmitting(true);
    try {
      const itemsPayload = selectedBooking.items.map((item) => {
        const act = actionFor(item.garmentId);
        return {
          garmentId: item.garmentId,
          nextAction: act,
          vendorName: act === "DRY_CLEAN" || act === "REPAIR" ? vendorName.trim() : undefined,
        };
      });

      // the physical checklist is part of the record: prepend what was flagged to the staff remarks
      const flags = [
        hasStains && "stains/spills",
        hasTears && "tears/rips",
        missingAccessories && "missing parts",
        !zipperFunctional && "zip/hooks faulty",
      ].filter(Boolean) as string[];
      const notes = [flags.length ? `Flagged: ${flags.join(", ")}.` : "", inspectionNotes.trim()].filter(Boolean).join(" ");

      const res = await bookingsApi.return(selectedBooking.id, {
        actualReturnDate,
        damageCharge: damage,
        cleaningCharge: cleaning,
        notes: notes || undefined,
        items: itemsPayload,
        refund: {
          pay: true,
          mode: refundPayMode,
        },
        photoIds: photoIds.length > 0 ? photoIds : undefined,
      });

      setSettlementResult(res.settlement);
      setPhotoIds([]);
      setSelectedBooking(res.booking);
      await loadRentals(false);
    } catch (err: any) {
      setActionError(err?.message || "Failed to process return settlement");
    } finally {
      setSubmitting(false);
    }
  };

  const depositHeld = selectedBooking ? selectedBooking.depositTotal : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-gold-dark font-semibold uppercase tracking-wider mb-1">
          <RotateCcw className="w-4 h-4 text-plum" />
          <span>Intake, Damage Check &amp; Deposit Settlement</span>
        </div>
        <h1 className="text-2xl page-title">Return Counter &amp; Inspection</h1>
        <p className="text-xs text-[#5B5566] mt-0.5">
          Process customer garment returns, execute multi-point condition checks, calculate damage deductions, and settle refundable deposits.
        </p>
      </div>

      {loadError && (
        <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{loadError}</span>
          <button onClick={() => loadRentals()} className="ml-auto font-bold underline cursor-pointer">Retry</button>
        </div>
      )}

      {loading && !settlementResult ? (
        <div className="bg-white rounded-2xl border border-line-soft p-12 text-center text-xs text-[#5B5566]">
          <Loader2 className="w-6 h-6 animate-spin text-plum mx-auto mb-2" />
          Loading active rentals queue...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Active Rentals Queue */}
          <div className="bg-white rounded-2xl border border-line-soft p-4 shadow-xs space-y-3">
            <div className="font-bold text-[#18141E] text-xs uppercase tracking-wider flex items-center justify-between pb-2 border-b border-line-soft">
              <span>Active Out on Rent ({bookings.length})</span>
              <span className="text-[10px] text-[#8C8499]">Due / Overdue</span>
            </div>

            {bookings.length === 0 ? (
              <EmptyState title="No active rentals out on rent right now." className="py-8" />
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectBooking(b);
                      }
                    }}
                    onClick={() => selectBooking(b)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                      selectedBooking?.id === b.id
                        ? "bg-gold-soft border-gold shadow-xs"
                        : b.isOverdue
                        ? "bg-rose-50/70 border-rose-200"
                        : "bg-ivory border-line hover:border-gold"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[#18141E]">
                      <span>{b.customer?.name}</span>
                      {b.isOverdue && (
                        <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <div className="text-[#5B5566] text-[11px] mt-0.5 truncate">
                      {b.items.map((i) => i.name).join(", ")}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className={b.isOverdue ? "text-rose-700 font-bold" : "text-gold-dark font-semibold"}>
                        Due: {formatDate(b.returnDueDate)}
                      </span>
                      <span className="font-mono text-[#5B5566]">Dep: {formatINR(b.depositTotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Inspection & Settlement Card */}
          <div className="lg:col-span-2">
            {selectedBooking ? (
              <div className="bg-white rounded-2xl border border-line-soft p-6 shadow-xs space-y-5 text-xs">
                <div className="flex items-start justify-between pb-3 border-b border-line-soft">
                  <div>
                    <div className="text-[10px] text-gold-dark font-bold uppercase">
                      Return Check-in &amp; Quality Inspection
                    </div>
                    <h2 className="text-lg font-bold text-[#18141E] mt-0.5">
                      {selectedBooking.customer?.name} ({selectedBooking.customer?.phone})
                    </h2>
                    <div className="text-[#5B5566] text-[11px]">
                      Booking: <strong>{selectedBooking.id}</strong> • Return Due:{" "}
                      <strong>{formatDate(selectedBooking.returnDueDate)}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#8C8499]">Deposit In Vault</div>
                    <div className="text-lg font-bold text-gold font-mono">
                      {formatINR(depositHeld)}
                    </div>
                  </div>
                </div>

                {/* Items to verify */}
                <div className="space-y-2">
                  <div className="font-bold text-[#18141E] uppercase text-[11px]">
                    Garment Physical Units Handed Back
                  </div>
                  {selectedBooking.items.map((item) => (
                    <div
                      key={item.garmentId}
                      className="p-3 bg-ivory rounded-xl border border-line flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-plum">{item.garmentId}</span>
                        <span className="font-bold text-[#18141E]">{item.name}</span>
                        <span className="text-[#8C8499] text-[11px]">({item.size})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#5B5566] font-mono hidden sm:inline">Deposit: {formatINR(item.securityDeposit)}</span>
                        {selectedBooking.items.length > 1 && (
                          <select
                            aria-label={`Next step for ${item.garmentId}`}
                            value={actionFor(item.garmentId)}
                            onChange={(e) => setItemActions({ ...itemActions, [item.garmentId]: e.target.value as NextAction })}
                            className="p-1.5 min-h-10 bg-white border border-line rounded-lg font-semibold text-[11px]"
                          >
                            {(Object.keys(NEXT_LABEL) as NextAction[]).map((k) => (
                              <option key={k} value={k}>{NEXT_LABEL[k]}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {!settlementResult && (
                <>
                {/* Inspection Multi-point Checklist */}
                <div className="p-4 bg-gold-soft rounded-xl border border-line space-y-3">
                  <div className="font-bold text-[#18141E] uppercase text-[11px]">
                    Physical Condition Checklist
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-line cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasStains}
                        onChange={(e) => setHasStains(e.target.checked)}
                        className="rounded text-plum"
                      />
                      <span className="font-semibold text-[#18141E]">Stains / Spills</span>
                    </label>

                    <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-line cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasTears}
                        onChange={(e) => setHasTears(e.target.checked)}
                        className="rounded text-plum"
                      />
                      <span className="font-semibold text-[#18141E]">Tears / Rips</span>
                    </label>

                    <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-line cursor-pointer">
                      <input
                        type="checkbox"
                        checked={missingAccessories}
                        onChange={(e) => setMissingAccessories(e.target.checked)}
                        className="rounded text-plum"
                      />
                      <span className="font-semibold text-[#18141E]">Missing Parts</span>
                    </label>

                    <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-line cursor-pointer">
                      <input
                        type="checkbox"
                        checked={zipperFunctional}
                        onChange={(e) => setZipperFunctional(e.target.checked)}
                        className="rounded text-plum"
                      />
                      <span className="font-semibold text-[#18141E]">Zip / Hooks OK</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#5B5566] uppercase mb-1">
                        Actual Return Date
                      </label>
                      <input
                        type="date"
                        value={actualReturnDate}
                        min={selectedBooking.pickupDate}
                        max={today || undefined}
                        onChange={(e) => setActualReturnDate(e.target.value)}
                        className="w-full p-2 bg-white border border-line rounded-lg font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#5B5566] uppercase mb-1">
                        Inspection Remarks &amp; Notes
                      </label>
                      <input
                        type="text"
                        value={inspectionNotes}
                        placeholder="Optional: condition on return, anything to tell the next shift"
                        onChange={(e) => setInspectionNotes(e.target.value)}
                        className="w-full p-2 bg-white border border-line rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Damage & Defect Evidence Photos */}
                  <div className="p-3 bg-white rounded-xl border border-line mt-2">
                    <PhotoCapture
                      kind="DAMAGE"
                      bookingId={selectedBooking.id}
                      photoIds={photoIds}
                      onChangePhotoIds={setPhotoIds}
                      label="Damage / Defect Evidence Photos"
                      sublabel="Take photos of stains, tears, missing latkans, or zip damage before settling deposit (auto-compressed <400KB)"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Deductions Input & Late Fee Notice */}
                <div className="p-4 bg-white rounded-xl border-2 border-gold/30 space-y-3">
                  <div className="font-bold text-[#18141E] text-xs uppercase flex items-center justify-between">
                    <span>Refundable Deposit Settlement Inputs</span>
                    <span className="text-[10px] text-[#8C8499] font-normal">
                      Late fee &amp; final refund are computed by the server
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#5B5566] uppercase mb-1">
                        Damage Deduction (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={damageDeduction}
                        onChange={(e) => setDamageDeduction(Number(e.target.value) || 0)}
                        className="w-full p-2 bg-ivory border border-line rounded-lg font-bold text-rose-700 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#5B5566] uppercase mb-1">
                        Special Cleaning Charge (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={cleaningCharge}
                        onChange={(e) => setCleaningCharge(Number(e.target.value) || 0)}
                        className="w-full p-2 bg-ivory border border-line rounded-lg font-bold text-amber-700 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#5B5566] uppercase mb-1">
                        Refund Payment Mode
                      </label>
                      <select
                        value={refundPayMode}
                        onChange={(e) => setRefundPayMode(e.target.value as any)}
                        className="w-full p-2 bg-ivory border border-line rounded-lg font-bold"
                      >
                        <option value="CASH">Cash in Drawer</option>
                        <option value="UPI">UPI Transfer</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                      </select>
                    </div>
                  </div>

                </div>

                {/* Next Routing Step */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#5B5566] uppercase">
                    Route Garment to Next Operational State *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => chooseAll("AVAILABLE")}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        nextAction === "AVAILABLE"
                          ? "bg-plum text-white border-plum font-bold shadow-xs"
                          : "bg-ivory text-[#5B5566] border-line"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-gold-light" />
                      <span className="block text-xs font-bold leading-tight">Back to rack</span>
                      <span className="text-[10px] opacity-80">(Available)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => chooseAll("DRY_CLEAN", "Royal Dry Cleaners, Bargarh")}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        nextAction === "DRY_CLEAN"
                          ? "bg-plum text-white border-plum font-bold shadow-xs"
                          : "bg-ivory text-[#5B5566] border-line"
                      }`}
                    >
                      <Sparkles className="w-4 h-4 mx-auto mb-1 text-gold-light" />
                      <span className="block text-xs font-bold leading-tight">Dry clean</span>
                      <span className="text-[10px] opacity-80">(In care job)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => chooseAll("REPAIR", "Master Tailor, Bargarh")}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        nextAction === "REPAIR"
                          ? "bg-plum text-white border-plum font-bold shadow-xs"
                          : "bg-ivory text-[#5B5566] border-line"
                      }`}
                    >
                      <Wrench className="w-4 h-4 mx-auto mb-1 text-gold-light" />
                      <span className="block text-xs font-bold leading-tight">Repair</span>
                      <span className="text-[10px] opacity-80">(Tailor / Stitch)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => chooseAll("DAMAGED")}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        nextAction === "DAMAGED"
                          ? "bg-rose-800 text-white border-rose-800 font-bold shadow-xs"
                          : "bg-rose-50/50 text-rose-800 border-rose-200"
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-rose-300" />
                      <span className="block text-xs font-bold leading-tight">Damaged</span>
                      <span className="text-[10px] opacity-80">(Block / Repair)</span>
                    </button>
                  </div>

                  {selectedBooking.items.some((i) => ["DRY_CLEAN", "REPAIR"].includes(actionFor(i.garmentId))) && (
                    <div className="pt-2">
                      <label className="block text-[10px] font-bold text-[#5B5566] uppercase mb-1">
                        Assigned Vendor Name (Dry Cleaner / Master Tailor) *
                      </label>
                      <input
                        type="text"
                        value={vendorName}
                        onChange={(e) => setVendorName(e.target.value)}
                        placeholder="e.g. Royal Dry Cleaners, Bargarh"
                        className="w-full p-2 bg-white border border-line rounded-lg font-medium text-xs"
                        required
                      />
                    </div>
                  )}
                </div>

                {actionError && (
                  <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 border-t border-line-soft flex items-center justify-between">
                  <div className="text-[11px] text-[#5B5566]">
                    Inspected By: <strong>{user?.name || "Counter Manager"}</strong>
                  </div>

                  <button
                    onClick={handleProcessReturn}
                    disabled={submitting}
                    className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold px-6 min-h-10 rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    )}
                    <span>Settle Deposit &amp; Complete Return</span>
                  </button>
                </div>
                </>
                )}

                {settlementResult && (
                <div className="space-y-3">
                  {/* Settlement Result Banner (from server response) */}
                  {settlementResult && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                      <div className="font-bold text-emerald-900 text-xs">Settlement Finalized:</div>
                      <div className="flex justify-between text-[11px]">
                        <span>Late Fee Charged ({settlementResult.lateDays} days):</span>
                        <strong className="text-amber-800 font-mono">{formatINR(settlementResult.lateFee)}</strong>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span>Total Deductions:</span>
                        <strong className="text-rose-700 font-mono">{formatINR(settlementResult.deductions)}</strong>
                      </div>
                      <div className="flex justify-between text-xs pt-1 border-t border-emerald-200 font-bold">
                        <span>Net Refund Paid:</span>
                        <strong className="text-emerald-700 font-mono text-sm">{formatINR(settlementResult.refund)}</strong>
                      </div>
                      {settlementResult.additionalDue > 0 && (
                        <div className="pt-2 border-t border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="text-xs text-rose-800 font-bold">
                              Amount Client Still Owes: <span className="font-mono text-sm">{formatINR(settlementResult.additionalDue)}</span>
                            </div>
                            <p className="text-[10px] text-[#5B5566]">Collect difference from client and record immediately</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedBooking) {
                                setExtraPaymentBooking({
                                  ...selectedBooking,
                                  status: "COMPLETED",
                                  additionalDue: settlementResult.additionalDue,
                                });
                                setExtraPaymentKind("EXTRA");
                                setExtraPaymentAmount(settlementResult.additionalDue);
                              }
                            }}
                            className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Add payment → Extra</span>
                          </button>
                        </div>
                      )}

                      {settlementResult.depositStatus === "HELD" && settlementResult.refund > 0 && (
                        <div className="pt-2 border-t border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="text-xs text-amber-800 font-bold">
                              Deposit Refund Pending: <span className="font-mono text-sm">{formatINR(settlementResult.refund)}</span>
                            </div>
                            <p className="text-[10px] text-[#5B5566]">Pay deposit back to customer and record payout</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedBooking) {
                                setExtraPaymentBooking({
                                  ...selectedBooking,
                                  status: "COMPLETED",
                                  depositStatus: "HELD",
                                  refundAmount: settlementResult.refund,
                                });
                                setExtraPaymentKind("REFUND");
                                setExtraPaymentAmount(settlementResult.refund);
                              }
                            }}
                            className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Pay deposit refund</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link
                      href={`/erp/billing/invoices?bookingId=${selectedBooking.id}`}
                      className="px-4 min-h-10 inline-flex items-center gap-1.5 rounded-xl border border-line bg-white text-[#5B5566] font-bold hover:bg-ivory"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print / share receipt</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => selectBooking(bookings[0] ?? null)}
                      className="px-4 min-h-10 inline-flex items-center gap-1.5 rounded-xl bg-plum text-white font-bold hover:bg-plum-dark cursor-pointer"
                    >
                      <span>{bookings.length > 0 ? "Next return" : "Done"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                )}
              </div>
            ) : (
              <EmptyState title="Select an active rental from the left queue to conduct return check-in." className="py-12" />
            )}
          </div>
        </div>
      )}

      {/* Extra Payment Modal */}
      {extraPaymentBooking && (
        <AddPaymentModal
          isOpen={Boolean(extraPaymentBooking)}
          onClose={() => setExtraPaymentBooking(null)}
          onSuccess={(updated) => {
            if (settlementResult) {
              setSettlementResult({
                ...settlementResult,
                additionalDue: updated.additionalDue,
                depositStatus: updated.depositStatus,
                refund: updated.depositStatus === "REFUNDED" ? 0 : settlementResult.refund,
              });
            }
            // keep the finished booking on screen with its updated balances
            setSelectedBooking(updated);
            loadRentals(false);
          }}
          booking={extraPaymentBooking}
          initialKind={extraPaymentKind}
          initialAmount={extraPaymentAmount}
        />
      )}
    </div>
  );
}

export default function ReturnsCounterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#8C8499]">Loading returns counter...</div>}>
      <ReturnsCounterContent />
    </Suspense>
  );
}
