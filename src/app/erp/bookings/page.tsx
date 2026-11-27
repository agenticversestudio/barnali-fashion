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
import { EmptyState } from "@/components/ui/EmptyState";
import type { BookingDto, BookingStatus, PayMode, Settlement, NextAction } from "@/types/api";
import { useAuth } from "@/context/AuthContext";
import { PhotoCapture } from "@/components/operations/PhotoCapture";
import { AddPaymentModal } from "@/components/operations/AddPaymentModal";

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

  // Add Payment Modal State
  const [paymentModalBooking, setPaymentModalBooking] = useState<BookingDto | null>(null);
  const [paymentModalKind, setPaymentModalKind] = useState<"BALANCE" | "DEPOSIT" | "EXTRA" | "REFUND">("BALANCE");

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

  /** Same action buttons (and handlers) for the desktop table row and the mobile card. */
  const renderActions = (b: BookingDto, align: "end" | "stretch") => {
    const isConfirmed = b.status === "CONFIRMED";
    const isOut = b.status === "OUT_ON_RENT";
    const base = "px-3 min-h-10 rounded-lg text-[11px] font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.12)] transition-colors";
    return (
      <div className={align === "end" ? "flex flex-wrap items-center justify-end gap-1.5" : "grid grid-cols-2 gap-2"}>
        {isConfirmed && (
          <button
            onClick={() => {
              setHandoverBooking(b);
              setHandoverPhotoIds([]);
            }}
            className={`${base} bg-emerald-600 hover:bg-emerald-700`}
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
            className={`${base} bg-plum hover:bg-plum-dark`}
          >
            Return &amp; Settle
          </button>
        )}

        {b.status === "COMPLETED" && b.additionalDue > 0 && (
          <button
            onClick={() => {
              setPaymentModalBooking(b);
              setPaymentModalKind("EXTRA");
            }}
            className={`${base} bg-rose-700 hover:bg-rose-800`}
          >
            Add payment → Extra
          </button>
        )}

        {b.status === "COMPLETED" && b.depositStatus === "HELD" && b.refundAmount > 0 && (
          <button
            onClick={() => {
              setPaymentModalBooking(b);
              setPaymentModalKind("REFUND");
            }}
            className={`${base} bg-amber-700 hover:bg-amber-800`}
          >
            Pay deposit refund
          </button>
        )}

        {(isConfirmed || isOut) && b.balanceDue > 0 && (
          <button
            onClick={() => {
              setPaymentModalBooking(b);
              setPaymentModalKind("BALANCE");
            }}
            className={`${base} bg-amber-600 hover:bg-amber-700`}
          >
            Add Payment
          </button>
        )}

        <button
          onClick={() => setSelectedOrder(b)}
          className="px-3 min-h-10 bg-white hover:bg-ivory-deep border border-line text-ink-soft font-semibold rounded-lg text-[11px] transition-colors"
        >
          Details
        </button>
      </div>
    );
  };

  /** Payment state pill shown under the status pill. */
  const payPill = (b: BookingDto) =>
    b.status === "CANCELLED" ? null : b.balanceDue > 0 ? (
      <span className="num inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
        Due {formatINR(b.balanceDue)}
      </span>
    ) : (
      <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
        Paid in full
      </span>
    );

  return (
    <div className="space-y-5 md:space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="eyebrow text-[#B8893A]">COUNTER LEDGER</span>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h1 className="page-title text-2xl md:text-3xl text-[#1F1815]">Rental Orders</h1>
            <span className="num text-[11px] font-semibold bg-[#F9F2E4] text-[#7A1624] border border-[#E6D5B8] px-3 py-0.5 rounded-full shadow-2xs">
              {bookings.length} booking{bookings.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-xs text-[#6B5E55] mt-1.5">Selection, client, quote, handover and return settlement in one place.</p>
        </div>

        <Link
          href="/erp/bookings/new"
          className="inline-flex items-center justify-center gap-2 px-5 min-h-11 bg-[#7A1624] hover:bg-[#5C0F1A] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4 text-[#F9F2E4]" />
          <span>New Counter Booking</span>
        </Link>
      </div>

      {/* Filter & search strip */}
      <div className="surface p-3.5 md:p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by customer name, phone, SKU (e.g. LF-001) or Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-10 min-h-10 bg-[#FAF7F2] border border-[#EAE0D2] rounded-xl text-[#1F1815] placeholder-[#9C8E83] focus:outline-none focus:border-[#7A1624] focus:ring-2 focus:ring-[#7A1624]/15 transition-all"
            />
            <Search className="w-4 h-4 text-[#9C8E83] absolute left-3 top-3" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                className="absolute right-1 top-1 w-8 h-8 flex items-center justify-center text-[#9C8E83] hover:text-[#1F1815]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status tabs */}
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
                aria-pressed={statusFilter === tab.id}
                className={`px-4 min-h-10 rounded-full text-xs whitespace-nowrap transition-colors shrink-0 border ${
                  statusFilter === tab.id
                    ? "bg-[#7A1624] text-white font-semibold border-[#7A1624]"
                    : "bg-white text-[#6B5E55] font-medium hover:bg-[#F4EDE3] border-[#EAE0D2]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings display */}
      {loading ? (
        <div className="surface p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-plum mx-auto mb-2" />
          <div className="text-xs text-mute">Loading booking records...</div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={ClipboardList}
            title="No orders found"
            hint="Try clearing the search or filter, or start a new counter booking."
            action={
              <Link href="/erp/bookings/new" className="inline-flex items-center gap-1.5 px-4 min-h-10 bg-plum text-white rounded-lg text-xs font-semibold">
                <Plus className="w-3.5 h-3.5 text-gold" />
                New Counter Booking
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* Mobile / tablet: order cards */}
          <div className="lg:hidden space-y-3">
            {bookings.map((b) => {
              const cleanPhone = b.customer.phone.replace(/\D/g, "").slice(-10);
              return (
                <article key={b.id} className="surface p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="num text-[11px] font-bold text-plum">{b.id}</span>
                      <h3 className="font-display font-semibold text-ink text-base leading-tight mt-0.5 truncate">{b.customer.name}</h3>
                      <a href={`tel:${cleanPhone}`} className="num text-[11px] text-mute inline-block min-h-6">
                        +91 {cleanPhone}
                      </a>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <StatusBadge status={b.status} />
                      {payPill(b)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {b.items.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 bg-ivory border border-line rounded-md px-2 py-1 max-w-full">
                        <span className="num font-bold text-[10px] text-plum">{item.garmentId}</span>
                        <span className="text-[11px] text-ink-soft truncate">{item.name}</span>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-line-soft">
                    <div>
                      <div className="eyebrow-mute">Pickup → Return</div>
                      <div className="num text-xs font-semibold text-ink mt-0.5">
                        {b.pickupDate} → {b.returnDueDate}
                      </div>
                      {b.isOverdue && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded mt-1">
                          <AlertTriangle className="w-3 h-3" /> Overdue return
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="eyebrow-mute">Total</div>
                      <div className="num font-display font-semibold text-lg text-ink leading-tight">{formatINR(b.grandTotal)}</div>
                      {b.depositStatus === "HELD" && (
                        <div className="num text-[10px] text-amber-800 font-medium">Deposit held {formatINR(b.depositTotal)}</div>
                      )}
                    </div>
                  </div>

                  {renderActions(b, "stretch")}
                </article>
              );
            })}
          </div>

          {/* Desktop: ledger table */}
          <div className="hidden lg:block bg-white rounded-2xl border border-[#EAE0D2] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F4EDE3] border-b border-[#EAE0D2]">
                    {["Order & Customer", "Costumes", "Pickup → Return Due", "Status", "Tariff / Balance", "Actions"].map((h, i) => (
                      <th key={h} className={`py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6B5E55] ${i >= 4 ? "text-right" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E8DC]">
                  {bookings.map((b) => {
                    const cleanPhone = b.customer.phone.replace(/\D/g, "").slice(-10);
                    return (
                      <tr key={b.id} className="hover:bg-[#FAF7F2] transition-colors align-top">
                        <td className="py-4 px-4">
                          <div className="num font-bold text-xs text-[#7A1624]">{b.id}</div>
                          <div className="font-display font-semibold text-[#1F1815] text-sm mt-0.5">{b.customer.name}</div>
                          <div className="num text-[11px] text-[#9C8E83]">+91 {cleanPhone}</div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            {b.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <span className="num font-bold text-[10px] bg-gold-soft text-gold-dark px-1.5 py-0.5 rounded border border-gold/30">
                                  {item.garmentId}
                                </span>
                                <span className="font-medium text-ink-soft line-clamp-1">{item.name}</span>
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="num text-ink font-semibold">
                            {b.pickupDate} → {b.returnDueDate}
                          </div>
                          {b.isOverdue && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded mt-1">
                              <AlertTriangle className="w-3 h-3" /> Overdue return
                            </span>
                          )}
                          {b.eventName && <div className="text-[11px] text-mute mt-0.5">{b.eventName}</div>}
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex flex-col items-start gap-1.5">
                            <StatusBadge status={b.status} />
                            {b.depositStatus === "HELD" && (
                              <div className="num text-[10px] text-amber-800 font-medium">Dep held: {formatINR(b.depositTotal)}</div>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="num font-display font-semibold text-ink text-base leading-tight">{formatINR(b.grandTotal)}</div>
                          <div className="mt-1">{payPill(b)}</div>
                        </td>

                        <td className="py-4 px-4 text-right max-w-xs">{renderActions(b, "end")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* HANDOVER / PICKUP MODAL */}
      {handoverBooking && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-line shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="font-mono text-xs text-plum font-bold">
                  {handoverBooking.id}
                </span>
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  Store Handover to Customer
                </h3>
              </div>
              <button
                onClick={() => setHandoverBooking(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl space-y-1 text-stone-700">
                <div>Client: <strong className="text-stone-900">{handoverBooking.customer.name}</strong></div>
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
                    <label className="block text-[10px] uppercase font-bold text-stone-600 mb-1">
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
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Handover Condition Verification
                </label>
                <input
                  type="text"
                  value={handoverCondition}
                  onChange={(e) => setHandoverCondition(e.target.value)}
                  className="w-full p-2.5 bg-ivory border border-line rounded-xl font-medium"
                />
              </div>

              {/* Handover Photos */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
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

            <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
              <button
                onClick={() => setHandoverBooking(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-semibold text-xs"
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
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-line shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="font-mono text-xs text-plum font-bold">
                  {returnBooking.id}
                </span>
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  Return Inspection &amp; Deposit Settlement
                </h3>
              </div>
              <button
                onClick={() => setReturnBooking(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <div>Client: <strong className="text-stone-900">{returnBooking.customer.name}</strong></div>
                <div>Due Date: <span className="font-mono">{returnBooking.returnDueDate}</span></div>
                <div>Security Deposit Held: <strong className="font-mono text-emerald-800">{formatINR(returnBooking.depositTotal)}</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Actual Return Date *
                  </label>
                  <input
                    type="date"
                    value={actualReturnDate}
                    onChange={(e) => setActualReturnDate(e.target.value)}
                    className="w-full p-2.5 bg-ivory border border-line rounded-xl font-mono font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Next Garment Action
                  </label>
                  <select
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value as NextAction)}
                    className="w-full p-2.5 bg-ivory border border-line rounded-xl font-semibold"
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
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Assigned Care Vendor Name
                  </label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Bargarh Modern Dry Cleaners"
                    className="w-full p-2.5 bg-ivory border border-line rounded-xl font-medium"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Damage Deduction (₹)
                  </label>
                  <input
                    type="number"
                    value={damageCharge}
                    onChange={(e) => setDamageCharge(Number(e.target.value) || 0)}
                    className="w-full p-2.5 bg-ivory border border-line rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Extra Stain Cleaning (₹)
                  </label>
                  <input
                    type="number"
                    value={cleaningCharge}
                    onChange={(e) => setCleaningCharge(Number(e.target.value) || 0)}
                    className="w-full p-2.5 bg-ivory border border-line rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Inspection Remarks
                </label>
                <input
                  type="text"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="e.g. Returned on time, minor dupatta stain"
                  className="w-full p-2.5 bg-ivory border border-line rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Deposit Refund Payment Mode
                </label>
                <select
                  value={refundPayMode}
                  onChange={(e) => setRefundPayMode(e.target.value as any)}
                  className="w-full p-2.5 bg-ivory border border-line rounded-xl font-semibold"
                >
                  <option value="CASH">Cash Refund at Counter</option>
                  <option value="UPI">UPI Refund to Customer Phone</option>
                  <option value="BANK_TRANSFER">Bank Transfer / IMPS</option>
                </select>
              </div>

              {/* Damage & Defect Photos */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
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

            <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
              <button
                onClick={() => setReturnBooking(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReturn}
                disabled={submittingReturn}
                className="flex-1 py-2.5 bg-plum hover:bg-plum-dark text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5"
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
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-line shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-stone-900 text-sm">WhatsApp Receipt Generated</h3>
              </div>
              <button
                onClick={() => setWhatsappReceipt(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-[11px] font-mono text-stone-800 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
              {whatsappReceipt}
            </pre>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(whatsappReceipt);
                  alert("Receipt copied to clipboard!");
                }}
                className="flex-1 py-2 rounded-xl border border-stone-200 text-stone-700 font-semibold text-xs"
              >
                Copy Text
              </button>
              <button
                onClick={() => setWhatsappReceipt(null)}
                className="flex-1 py-2 bg-plum text-white font-semibold rounded-xl text-xs shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-line shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="font-mono text-xs text-plum font-bold">
                  {selectedOrder.id}
                </span>
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  Order Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <div>Client: <strong className="text-stone-900">{selectedOrder.customer.name}</strong></div>
                <div>Phone: <strong className="font-mono">+91 {selectedOrder.customer.phone}</strong></div>
                <div>Status: <StatusBadge status={selectedOrder.status} className="ml-2" /></div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1">
                  Booked Costumes ({selectedOrder.items.length})
                </span>
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl bg-ivory p-2 space-y-1">
                  {selectedOrder.items.map((i, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 text-xs">
                      <div>
                        <span className="font-mono font-bold text-plum mr-2">{i.garmentId}</span>
                        <span className="font-semibold">{i.name}</span>
                        {i.rack && <span className="text-stone-400 text-[10px] ml-1">({i.rack})</span>}
                      </div>
                      <span className="font-mono font-bold text-stone-800">{formatINR(i.rentalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-stone-50 rounded-xl">
                <div>
                  <span className="text-stone-400 text-[10px] block">Grand Total</span>
                  <span className="font-mono font-bold text-stone-900 text-sm">{formatINR(selectedOrder.grandTotal)}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] block">Amount Paid</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">{formatINR(selectedOrder.amountPaid)}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] block">Deposit Held</span>
                  <span className="font-mono font-semibold text-amber-900">{formatINR(selectedOrder.depositTotal)}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] block">Balance Due</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-rose-800">{formatINR(selectedOrder.balanceDue)}</span>
                    {(selectedOrder.status === "CONFIRMED" || selectedOrder.status === "OUT_ON_RENT") && selectedOrder.balanceDue > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentModalBooking(selectedOrder);
                          setPaymentModalKind("BALANCE");
                        }}
                        className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[10px] shadow-xs cursor-pointer"
                      >
                        Add Payment
                      </button>
                    )}
                  </div>
                </div>

                {selectedOrder.additionalDue > 0 && (
                  <div className="col-span-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between mt-1">
                    <div>
                      <span className="text-rose-900 font-bold block text-xs">Amount Client Still Owes</span>
                      <span className="font-mono font-bold text-rose-700 text-sm">
                        {formatINR(selectedOrder.additionalDue)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentModalBooking(selectedOrder);
                        setPaymentModalKind("EXTRA");
                      }}
                      className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                    >
                      Add payment → Extra
                    </button>
                  </div>
                )}

                {selectedOrder.depositStatus === "HELD" && selectedOrder.refundAmount > 0 && (
                  <div className="col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-amber-900 font-bold block text-xs">Deposit Refund Pending</span>
                      <span className="text-[11px] text-amber-800">
                        Refund of <strong className="font-mono text-sm">{formatINR(selectedOrder.refundAmount)}</strong> is held in shop vault awaiting handover to customer.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentModalBooking(selectedOrder);
                        setPaymentModalKind("REFUND");
                      }}
                      className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-xs shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Pay deposit refund</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Ledger / History */}
              {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1">
                    Payment Ledger ({selectedOrder.payments.length})
                  </span>
                  <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl bg-white p-2 text-[11px]">
                    {selectedOrder.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between py-1 font-mono">
                        <div>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold mr-2 ${
                            p.kind === "EXTRA"
                              ? "bg-rose-100 text-rose-800"
                              : p.kind === "REFUND"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {p.kind}
                          </span>
                          <span className="text-stone-600">{p.mode}</span>
                          {p.note && <span className="text-stone-400 text-[10px] ml-1">({p.note})</span>}
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-stone-900">{formatINR(p.amount)}</span>
                          <span className="text-stone-400 text-[9px] block">{p.paidOn}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-stone-100">
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
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl text-xs ml-auto"
              >
                Print Invoice
              </Link>
            </div>
          </div>
        </div>
      )}
      {/* Add Payment Modal */}
      {paymentModalBooking && (
        <AddPaymentModal
          isOpen={Boolean(paymentModalBooking)}
          onClose={() => setPaymentModalBooking(null)}
          onSuccess={(updated) => {
            loadBookings();
            if (selectedOrder?.id === updated.id) {
              setSelectedOrder(updated);
            }
          }}
          booking={paymentModalBooking}
          initialKind={paymentModalKind}
          initialAmount={
            paymentModalKind === "REFUND"
              ? paymentModalBooking.refundAmount
              : paymentModalKind === "EXTRA"
              ? paymentModalBooking.additionalDue
              : paymentModalBooking.balanceDue
          }
        />
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
