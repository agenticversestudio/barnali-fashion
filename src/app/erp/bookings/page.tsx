"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ClipboardList,
  Search,
  Plus,
  Calendar,
  Phone,
  MessageCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  FileText,
  RotateCcw,
  Sparkles,
  MapPin,
  ChevronRight,
  Loader2,
  Wallet,
  ShieldCheck,
  Ban,
} from "lucide-react";
import { bookingsApi } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { BookingDto, BookingStatus, PayMode, Settlement, NextAction } from "@/types/api";
import { useAuth } from "@/context/AuthContext";
import { PhotoCapture } from "@/components/operations/PhotoCapture";

function BookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin } = useAuth();

  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Selected Booking for Details Modal
  const [selectedOrder, setSelectedOrder] = useState<BookingDto | null>(null);

  // --- HANDOVER / PICKUP MODAL STATE ---
  const [handoverBooking, setHandoverBooking] = useState<BookingDto | null>(null);
  const [handoverCondition, setHandoverCondition] = useState("Excellent condition, fitting verified");
  const [handoverPayMode, setHandoverPayMode] = useState<PayMode>("CASH");
  const [submittingHandover, setSubmittingHandover] = useState(false);
  const [handoverPhotoIds, setHandoverPhotoIds] = useState<string[]>([]);

  // --- RETURN & SETTLEMENT MODAL STATE ---
  const [returnBooking, setReturnBooking] = useState<BookingDto | null>(null);
  const [actualReturnDate, setActualReturnDate] = useState("");
  const [damageCharge, setDamageCharge] = useState<number>(0);

  useEffect(() => {
    setActualReturnDate(new Date().toISOString().split("T")[0]);
  }, []);
  const [cleaningCharge, setCleaningCharge] = useState<number>(0);
  const [returnNotes, setReturnNotes] = useState("");
  const [nextAction, setNextAction] = useState<NextAction>("AVAILABLE");
  const [vendorName, setVendorName] = useState("Bargarh Modern Dry Cleaners");
  const [refundPayMode, setRefundPayMode] = useState<"CASH" | "UPI" | "BANK_TRANSFER">("CASH");
  const [settlementResult, setSettlementResult] = useState<Settlement | null>(null);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnPhotoIds, setReturnPhotoIds] = useState<string[]>([]);

  // WhatsApp Slip Preview Modal
  const [whatsappReceipt, setWhatsappReceipt] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingsApi.list({
        status: statusFilter !== "ALL" ? (statusFilter as BookingStatus) : undefined,
        q: searchTerm.trim() || undefined,
      });
      setBookings(res.items || []);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBookings();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadBookings]);

  // Deep link checks (e.g. orderId query param)
  useEffect(() => {
    const orderIdParam = searchParams.get("orderId");
    const filterParam = searchParams.get("filter");
    if (filterParam === "overdue") {
      setStatusFilter("OUT_ON_RENT");
    } else if (filterParam === "today") {
      setStatusFilter("CONFIRMED");
    }
    if (orderIdParam) {
      bookingsApi.getById(orderIdParam).then((b) => setSelectedOrder(b)).catch(() => { });
    }
  }, [searchParams]);

  // Execute Handover Pickup
  const handleExecuteHandover = async () => {
    if (!handoverBooking) return;
    setSubmittingHandover(true);

    try {
      const payments =
        handoverBooking.balanceDue > 0
          ? [
            {
              kind: "BALANCE" as const,
              amount: handoverBooking.balanceDue,
              mode: handoverPayMode,
              note: "Balance collected at store handover",
            },
          ]
          : undefined;

      const updated = await bookingsApi.pickup(handoverBooking.id, {
        handoverCondition,
        photoIds: handoverPhotoIds.length > 0 ? handoverPhotoIds : undefined,
        payments,
      });

      setHandoverPhotoIds([]);
      setHandoverBooking(null);
      await loadBookings();

      // Trigger WhatsApp handover message
      const cleanPhone = updated.customer.phone.replace(/\D/g, "").slice(-10);
      const msg =
        `*BARNALI FASHION — HANDOVER RECEIPT*\n` +
        `Order ID: ${updated.id}\n` +
        `Customer: ${updated.customer.name}\n` +
        `Costumes: ${updated.items.map((i) => `${i.name} (${i.garmentId})`).join(", ")}\n` +
        `Condition: ${handoverCondition}\n` +
        `Return Due Date: ${updated.returnDueDate}\n` +
        `-------------------------\n` +
        `Deposit Held: ₹${updated.depositTotal}\n` +
        `Balance Paid: ₹${handoverBooking.balanceDue} (${handoverPayMode})\n` +
        `-------------------------\n` +
        `Note: Late return incurs 15% daily fee. Thank you!`;

      setWhatsappReceipt(msg);
    } catch (err: any) {
      alert(err?.message || "Failed to complete pickup handover");
    } finally {
      setSubmittingHandover(false);
    }
  };

  // Execute Return Settlement
  const handleExecuteReturn = async () => {
    if (!returnBooking) return;
    setSubmittingReturn(true);

    try {
      const itemsPayload = returnBooking.items.map((i) => ({
        garmentId: i.garmentId,
        nextAction,
        vendorName: nextAction === "DRY_CLEAN" || nextAction === "REPAIR" ? vendorName : undefined,
      }));

      const res = await bookingsApi.return(returnBooking.id, {
        actualReturnDate,
        damageCharge: Number(damageCharge) || 0,
        cleaningCharge: Number(cleaningCharge) || 0,
        notes: returnNotes.trim() || undefined,
        items: itemsPayload,
        refund: {
          pay: true,
          mode: refundPayMode,
        },
        photoIds: returnPhotoIds.length > 0 ? returnPhotoIds : undefined,
      });

      setReturnPhotoIds([]);
      setSettlementResult(res.settlement);
      setReturnBooking(null);
      await loadBookings();

      const bCustomer = res.booking.customer.name;
      const bDeposit = res.booking.depositTotal;
      const s = res.settlement;

      const msg =
        `*BARNALI FASHION — RETURN RECEIPT*\n` +
        `Customer: ${bCustomer}\n` +
        `Order ID: ${res.booking.id}\n` +
        `Return Date: ${actualReturnDate}\n` +
        `Late Days: ${s.lateDays} days (Late Fee: ₹${s.lateFee})\n` +
        `Damage / Cleaning: ₹${s.deductions - s.lateFee}\n` +
        `-------------------------\n` +
        `Security Deposit: ₹${bDeposit}\n` +
        `*Net Refund Paid: ₹${s.refund}* (${refundPayMode})\n` +
        (s.additionalDue > 0 ? `*Additional Due Owed: ₹${s.additionalDue}*\n` : "") +
        `Thank you for renting with Barnali Fashion, Bargarh!`;

      setWhatsappReceipt(msg);
    } catch (err: any) {
      alert(err?.message || "Failed to settle return");
    } finally {
      setSubmittingReturn(false);
    }
  };

  // Cancel Booking (Admin Only)
  const handleCancelBooking = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking? This will immediately free garment dates.")) return;
    try {
      await bookingsApi.cancel(id, { reason: "Cancelled by store admin" });
      setSelectedOrder(null);
      await loadBookings();
    } catch (err: any) {
      alert(err?.message || "Failed to cancel booking");
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 md:p-6 rounded-2xl border border-[#E6E4DF] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif font-bold text-xl md:text-2xl text-slate-900 tracking-tight">
              Rental Orders &amp; Counter Ledger
            </h1>
            <span className="text-xs font-mono font-semibold bg-[#6B1D2F]/10 text-[#6B1D2F] px-2.5 py-0.5 rounded-full">
              {bookings.length} Bookings
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            5-Step counter workflow: Selection, Client, Pricing Quote, Handover &amp; Return Settlement.
          </p>
        </div>

        {/* New Order Button routes to 5-Step Wizard */}
        <Link
          href="/erp/bookings/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#6B1D2F] hover:bg-[#521624] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Counter Booking</span>
        </Link>
      </div>

      {/* Filter & Search Strip */}
      <div className="bg-white p-3.5 md:p-4 rounded-2xl border border-[#E6E4DF] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by customer name, phone, SKU (e.g. LF-001) or Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2.5 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#6B1D2F]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
            {[
              { id: "ALL", label: "All Orders" },
              { id: "CONFIRMED", label: "Confirmed" },
              { id: "OUT_ON_RENT", label: "Out on Rent" },
              { id: "COMPLETED", label: "Completed" },
              { id: "CANCELLED", label: "Cancelled" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${statusFilter === tab.id
                  ? "bg-[#6B1D2F] text-white font-semibold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings Display */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E6E4DF] p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#6B1D2F] mx-auto mb-2" />
          <div className="text-xs text-slate-500">Loading booking records from database...</div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E6E4DF] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-slate-800">No orders found</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try clearing search filters or create a new counter booking.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E6E4DF] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#E6E4DF] text-[11px] font-bold uppercase text-slate-500">
                  <th className="py-3 px-4">Order ID &amp; Customer</th>
                  <th className="py-3 px-4">Costumes Booked</th>
                  <th className="py-3 px-4">Pickup → Return Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Tariff / Balance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6]">
                {bookings.map((b) => {
                  const cleanPhone = b.customer.phone.replace(/\D/g, "").slice(-10);
                  const isConfirmed = b.status === "CONFIRMED";
                  const isOut = b.status === "OUT_ON_RENT";

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-xs text-[#6B1D2F]">
                          {b.id}
                        </div>
                        <div className="font-serif font-semibold text-slate-900 mt-0.5">
                          {b.customer.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          +91 {cleanPhone}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {b.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-[10px] bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded border border-rose-200">
                                {item.garmentId}
                              </span>
                              <span className="font-medium text-slate-800 line-clamp-1">
                                {item.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-800 font-semibold">
                          {b.pickupDate} → {b.returnDueDate}
                        </div>
                        {b.isOverdue && (
                          <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded inline-block mt-1">
                            ⚠️ Overdue Return
                          </span>
                        )}
                        {b.eventName && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{b.eventName}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={b.status} />
                        {b.depositStatus === "HELD" && (
                          <div className="text-[10px] text-amber-800 font-medium mt-1">
                            Dep Held: {formatINR(b.depositTotal)}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-bold text-slate-900 text-xs">
                          {formatINR(b.grandTotal)}
                        </div>
                        {b.balanceDue > 0 ? (
                          <div className="text-[11px] font-bold text-amber-800">
                            Due: {formatINR(b.balanceDue)}
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-700 font-semibold">
                            Full Paid
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isConfirmed && (
                            <button
                              onClick={() => {
                                setHandoverBooking(b);
                                setHandoverPhotoIds([]);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-[11px] shadow-xs"
                            >
                              Handover
                            </button>
                          )}

                          {isOut && (
                            <button
                              onClick={() => {
                                setReturnBooking(b);
                                setReturnPhotoIds([]);
                                setActualReturnDate(new Date().toISOString().split("T")[0]);
                              }}
                              className="px-2.5 py-1.5 bg-[#6B1D2F] hover:bg-[#521624] text-white font-semibold rounded-lg text-[11px] shadow-xs"
                            >
                              Return &amp; Settle
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedOrder(b)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px]"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HANDOVER / PICKUP MODAL */}
      {handoverBooking && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6E4DF] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs text-[#6B1D2F] font-bold">
                  {handoverBooking.id}
                </span>
                <h3 className="font-serif font-bold text-lg text-slate-900">
                  Store Handover to Customer
                </h3>
              </div>
              <button
                onClick={() => setHandoverBooking(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-slate-700">
                <div>Client: <strong className="text-slate-900">{handoverBooking.customer.name}</strong></div>
                <div>Pieces: <strong>{handoverBooking.items.map((i) => i.name).join(", ")}</strong></div>
                <div>Return Due Date: <strong className="font-mono text-rose-800">{handoverBooking.returnDueDate}</strong></div>
              </div>

              {/* Balance Collection */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl space-y-2">
                <div className="flex items-center justify-between font-bold text-amber-950">
                  <span>Balance Due Now:</span>
                  <span className="font-mono text-sm">{formatINR(handoverBooking.balanceDue)}</span>
                </div>
                {handoverBooking.balanceDue > 0 && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                      Payment Mode Received
                    </label>
                    <select
                      value={handoverPayMode}
                      onChange={(e) => setHandoverPayMode(e.target.value as PayMode)}
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg font-semibold"
                    >
                      <option value="CASH">Cash at Counter</option>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="CARD">Card Swiped</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Handover Condition Verification
                </label>
                <input
                  type="text"
                  value={handoverCondition}
                  onChange={(e) => setHandoverCondition(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-medium"
                />
              </div>

              {/* Handover Photos */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <PhotoCapture
                  kind="HANDOVER"
                  bookingId={handoverBooking.id}
                  photoIds={handoverPhotoIds}
                  onChangePhotoIds={setHandoverPhotoIds}
                  label="Handover Photos (Optional)"
                  sublabel="Document any pre-existing marks or accessories before client leaves (auto-compressed <400KB)"
                  disabled={submittingHandover}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setHandoverBooking(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteHandover}
                disabled={submittingHandover}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5"
              >
                {submittingHandover ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Confirm Pickup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RETURN & SETTLEMENT MODAL */}
      {returnBooking && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E6E4DF] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs text-[#6B1D2F] font-bold">
                  {returnBooking.id}
                </span>
                <h3 className="font-serif font-bold text-lg text-slate-900">
                  Return Inspection &amp; Deposit Settlement
                </h3>
              </div>
              <button
                onClick={() => setReturnBooking(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div>Client: <strong className="text-slate-900">{returnBooking.customer.name}</strong></div>
                <div>Due Date: <span className="font-mono">{returnBooking.returnDueDate}</span></div>
                <div>Security Deposit Held: <strong className="font-mono text-emerald-800">{formatINR(returnBooking.depositTotal)}</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Actual Return Date *
                  </label>
                  <input
                    type="date"
                    value={actualReturnDate}
                    onChange={(e) => setActualReturnDate(e.target.value)}
                    className="w-full p-2.5 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-mono font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Next Garment Action
                  </label>
                  <select
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value as NextAction)}
                    className="w-full p-2.5 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-semibold"
                  >
                    <option value="AVAILABLE">Good Condition (Make Available)</option>
                    <option value="DRY_CLEAN">Send to Dry Clean</option>
                    <option value="REPAIR">Needs Minor Repair / Stitching</option>
                    <option value="DAMAGED">Heavy Damage / Hold</option>
                  </select>
                </div>
              </div>

              {(nextAction === "DRY_CLEAN" || nextAction === "REPAIR") && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Assigned Care Vendor Name
                  </label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Bargarh Modern Dry Cleaners"
                    className="w-full p-2.5 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-medium"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Damage Deduction (₹)
                  </label>
                  <input
                    type="number"
                    value={damageCharge}
                    onChange={(e) => setDamageCharge(Number(e.target.value) || 0)}
                    className="w-full p-2.5 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Extra Stain Cleaning (₹)
                  </label>
                  <input
                    type="number"
                    value={cleaningCharge}
                    onChange={(e) => setCleaningCharge(Number(e.target.value) || 0)}
                    className="w-full p-2.5 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Inspection Remarks
                </label>
                <input
                  type="text"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="e.g. Returned on time, minor dupatta stain"
                  className="w-full p-2.5 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Deposit Refund Payment Mode
                </label>
                <select
                  value={refundPayMode}
                  onChange={(e) => setRefundPayMode(e.target.value as any)}
                  className="w-full p-2.5 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-semibold"
                >
                  <option value="CASH">Cash Refund at Counter</option>
                  <option value="UPI">UPI Refund to Customer Phone</option>
                  <option value="BANK_TRANSFER">Bank Transfer / IMPS</option>
                </select>
              </div>

              {/* Damage & Defect Photos */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <PhotoCapture
                  kind="DAMAGE"
                  bookingId={returnBooking.id}
                  photoIds={returnPhotoIds}
                  onChangePhotoIds={setReturnPhotoIds}
                  label="Damage / Defect Evidence Photos (Optional)"
                  sublabel="Photograph stains, tears or missing accessories for settlement record (auto-compressed <400KB)"
                  disabled={submittingReturn}
                />
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-amber-900 text-[11px] space-y-1">
                <div className="font-bold">Automated Server Settlement Engine:</div>
                <div>• Late fees are calculated at 15% of rental per day by server.</div>
                <div>• Net refund = Security Deposit − (Late fee + Damage + Cleaning).</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setReturnBooking(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReturn}
                disabled={submittingReturn}
                className="flex-1 py-2.5 bg-[#6B1D2F] hover:bg-[#521624] text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5"
              >
                {submittingReturn ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Settle Deposit &amp; Complete Return</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP RECEIPT MODAL */}
      {whatsappReceipt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6E4DF] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">WhatsApp Receipt Generated</h3>
              </div>
              <button
                onClick={() => setWhatsappReceipt(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
              {whatsappReceipt}
            </pre>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(whatsappReceipt);
                  alert("Receipt copied to clipboard!");
                }}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs"
              >
                Copy Text
              </button>
              <button
                onClick={() => setWhatsappReceipt(null)}
                className="flex-1 py-2 bg-[#6B1D2F] text-white font-semibold rounded-xl text-xs shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E6E4DF] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs text-[#6B1D2F] font-bold">
                  {selectedOrder.id}
                </span>
                <h3 className="font-serif font-bold text-lg text-slate-900">
                  Order Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div>Client: <strong className="text-slate-900">{selectedOrder.customer.name}</strong></div>
                <div>Phone: <strong className="font-mono">+91 {selectedOrder.customer.phone}</strong></div>
                <div>Status: <StatusBadge status={selectedOrder.status} className="ml-2" /></div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Booked Costumes ({selectedOrder.items.length})
                </span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-[#FAF9F6] p-2 space-y-1">
                  {selectedOrder.items.map((i, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 text-xs">
                      <div>
                        <span className="font-mono font-bold text-[#6B1D2F] mr-2">{i.garmentId}</span>
                        <span className="font-semibold">{i.name}</span>
                        {i.rack && <span className="text-slate-400 text-[10px] ml-1">({i.rack})</span>}
                      </div>
                      <span className="font-mono font-bold text-slate-800">{formatINR(i.rentalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 text-[10px] block">Grand Total</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{formatINR(selectedOrder.grandTotal)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Amount Paid</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">{formatINR(selectedOrder.amountPaid)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Deposit Held</span>
                  <span className="font-mono font-semibold text-amber-900">{formatINR(selectedOrder.depositTotal)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Balance Due</span>
                  <span className="font-mono font-bold text-rose-800">{formatINR(selectedOrder.balanceDue)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {isAdmin && selectedOrder.status === "CONFIRMED" && (
                <button
                  onClick={() => handleCancelBooking(selectedOrder.id)}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancel Booking</span>
                </button>
              )}

              <Link
                href={`/erp/billing/invoices?orderId=${selectedOrder.id}`}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs ml-auto"
              >
                Print Invoice
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading bookings...</div>}>
      <BookingsContent />
    </Suspense>
  );
}
