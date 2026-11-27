"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Receipt,
  Printer,
  ArrowLeft,
  Calendar,
  Building2,
  Phone,
  ShieldCheck,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { bookingsApi, settingsApi } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";
import type { BookingDto, SettingsDto } from "@/types/api";

function InvoiceContent() {
  const searchParams = useSearchParams();
  const queryBookingId = searchParams.get("bookingId");

  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingDto | null>(null);
  const [settings, setSettings] = useState<SettingsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [printLayout, setPrintLayout] = useState<"A4" | "thermal">("A4");

  useEffect(() => {
    async function initData() {
      setLoading(true);
      try {
        const [bookingsRes, stg] = await Promise.all([
          bookingsApi.list({ limit: 50 }),
          settingsApi.get().catch(() => null),
        ]);
        const list = bookingsRes.items || [];
        setBookings(list);
        setSettings(stg);

        if (queryBookingId) {
          const match = list.find((b) => b.id === queryBookingId);
          if (match) {
            setSelectedBooking(match);
          } else {
            try {
              const direct = await bookingsApi.getById(queryBookingId);
              setSelectedBooking(direct);
            } catch {
              if (list.length > 0) setSelectedBooking(list[0]);
            }
          }
        } else if (list.length > 0) {
          setSelectedBooking(list[0]);
        }
      } catch (err) {
        console.error("Failed to load invoice booking data:", err);
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, [queryBookingId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-line-soft p-12 text-center text-xs text-[#5B5566]">
        <Loader2 className="w-6 h-6 animate-spin text-plum mx-auto mb-2" />
        Loading booking invoice &amp; voucher...
      </div>
    );
  }

  if (!selectedBooking) {
    return (
      <div className="bg-white rounded-2xl border border-line-soft p-12 text-center text-xs text-[#5B5566]">
        No bookings found. Create a booking first to generate an invoice.
      </div>
    );
  }

  const shopName = settings?.shopName || "BARNALI FASHION";
  const shopPhone = settings?.shopPhone || "+91 7978256488";
  const shopAddress =
    settings?.shopAddress ||
    "In front of LIC Office, Near Keshariya Restaurant, Bargarh Road, Bargarh, Odisha — 768028";

  const advancePayment =
    selectedBooking.payments?.find((p) => p.kind === "ADVANCE")?.amount ??
    selectedBooking.amountPaid;

  return (
    <div className="space-y-6">
      {/* Header controls (Hidden during print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gold-dark font-semibold uppercase tracking-wider mb-1">
            <Receipt className="w-4 h-4 text-plum" />
            <span>Official Rental Invoice &amp; Security Deposit Agreement</span>
          </div>
          <h1 className="text-2xl page-title">Invoices &amp; Receipts</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Format Toggle */}
          <div className="bg-white p-1 rounded-xl border border-line flex text-xs">
            <button
              onClick={() => setPrintLayout("A4")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                printLayout === "A4" ? "bg-plum text-white" : "text-[#5B5566] hover:text-[#18141E]"
              }`}
            >
              A4 Agreement
            </button>
            <button
              onClick={() => setPrintLayout("thermal")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                printLayout === "thermal" ? "bg-plum text-white" : "text-[#5B5566] hover:text-[#18141E]"
              }`}
            >
              80mm Thermal Receipt
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="bg-gold hover:bg-gold-dark text-ink font-bold text-xs px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Select booking dropdown (Hidden during print) */}
      <div className="no-print bg-white p-3 rounded-2xl border border-line-soft flex items-center gap-3 text-xs">
        <span className="font-bold text-[#5B5566]">Select Booking:</span>
        <select
          value={selectedBooking.id}
          onChange={(e) => {
            const b = bookings.find((item) => item.id === e.target.value);
            if (b) setSelectedBooking(b);
          }}
          className="p-1.5 bg-ivory border border-line rounded-lg font-bold text-plum flex-1 max-w-md"
        >
          {bookings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.id} — {b.customer.name} ({formatDate(b.pickupDate)} to {formatDate(b.returnDueDate)})
            </option>
          ))}
        </select>
      </div>

      {/* Printable Invoice Container */}
      {printLayout === "A4" ? (
        /* A4 Layout */
        <div className="bg-white rounded-2xl border border-line-soft p-8 max-w-4xl mx-auto shadow-sm text-xs font-sans">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-plum pb-6">
            <div>
              <div className="font-serif font-black text-2xl text-plum tracking-wider uppercase">
                {shopName}
              </div>
              <div className="text-[10px] text-gold-dark font-bold uppercase tracking-widest mt-0.5">
                Bridal &amp; Occasion Wear Rental Studio
              </div>
              <div className="text-[#5B5566] mt-2 space-y-0.5 text-[11px] max-w-md">
                <div>{shopAddress}</div>
                <div>Phone / WhatsApp: {shopPhone}</div>
              </div>
            </div>

            <div className="text-right">
              <div className="font-bold text-[#8C8499] uppercase text-[10px] tracking-wider">
                Tax Invoice / Rental Voucher
              </div>
              <div className="text-lg font-mono font-bold text-plum mt-0.5">
                {selectedBooking.id}
              </div>
              <div className="text-[#5B5566] text-[11px] mt-1">
                Date: {formatDate(selectedBooking.createdAt)}
              </div>
              <div className="mt-1">
                <span className="bg-gold-soft text-gold-dark font-bold px-2 py-0.5 rounded text-[10px] border border-line">
                  Status: {selectedBooking.status}
                </span>
              </div>
            </div>
          </div>

          {/* Customer & Event Details */}
          <div className="grid grid-cols-2 gap-6 my-6 p-4 bg-ivory rounded-xl border border-line">
            <div>
              <div className="font-bold text-[#5B5566] uppercase text-[10px] mb-1">
                Customer Information
              </div>
              <div className="font-bold text-sm text-[#18141E]">{selectedBooking.customer.name}</div>
              <div className="text-[#5B5566] mt-0.5 font-mono">Mobile: {selectedBooking.customer.phone}</div>
              {selectedBooking.customer.city && (
                <div className="text-[#5B5566] text-[11px]">Location: {selectedBooking.customer.city}</div>
              )}
            </div>

            <div>
              <div className="font-bold text-[#5B5566] uppercase text-[10px] mb-1">
                Rental Period &amp; Event
              </div>
              <div className="font-bold text-[#18141E]">{selectedBooking.eventName || "Wedding Celebration"}</div>
              <div className="text-[#5B5566] mt-0.5">
                Pickup Date: <strong>{formatDate(selectedBooking.pickupDate)}</strong>
              </div>
              <div className="text-[#5B5566]">
                Return Due Date: <strong>{formatDate(selectedBooking.returnDueDate)}</strong> (Before 7:00 PM)
              </div>
            </div>
          </div>

          {/* Garments Table */}
          <div className="border border-line-soft rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left">
              <thead className="bg-gold-soft text-gold-dark font-bold uppercase text-[10px] border-b border-line-soft">
                <tr>
                  <th className="py-2.5 px-4">Item #</th>
                  <th className="py-2.5 px-3">Garment SKU</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3 text-right">Rental Charge</th>
                  <th className="py-2.5 px-4 text-right">Security Deposit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {selectedBooking.items.map((item, idx) => (
                  <tr key={item.garmentId}>
                    <td className="py-3 px-4 text-[#8C8499] font-mono">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono font-bold text-plum">
                      {item.garmentId}
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#18141E]">{item.name}</td>
                    <td className="py-3 px-3">
                      <span className="bg-[#F5F2F8] px-2 py-0.5 rounded font-bold text-[10px]">{item.size}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-[#18141E] font-mono">
                      {formatINR(item.rentalPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gold font-mono">
                      {formatINR(item.securityDeposit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Breakdown */}
          <div className="grid grid-cols-2 gap-6 my-6">
            {/* Rental Terms & Conditions */}
            <div className="p-4 bg-gold-soft/60 rounded-xl border border-line text-[10px] text-[#5B5566] space-y-1">
              <div className="font-bold text-[#18141E] uppercase text-[11px] mb-1">
                Standard Rental Terms
              </div>
              <div>• Garment security deposit is 100% refundable upon undamaged return.</div>
              <div>• Strict return due deadline applies. Late fee: 15% of rental tariff per day.</div>
              <div>• Do not machine wash or iron directly on metallic zari or stone embroidery.</div>
              <div>• Minor food stains are covered by standard dry clean; heavy rips or burns attract deduction.</div>
            </div>

            {/* Billing Totals */}
            <div className="p-4 bg-ivory rounded-xl border border-line space-y-2">
              <div className="flex justify-between font-bold text-[#5B5566]">
                <span>Rental Service Fee:</span>
                <span className="font-mono text-[#18141E]">
                  {formatINR(selectedBooking.rentalTotal)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-gold">
                <span>Refundable Security Deposit (Held):</span>
                <span className="font-mono">
                  {formatINR(selectedBooking.depositTotal)}
                </span>
              </div>
              <div className="border-t border-line pt-2 flex justify-between font-bold text-sm text-plum">
                <span>Total Amount Initial:</span>
                <span className="font-mono">
                  {formatINR(selectedBooking.grandTotal)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                <span>Advance / Paid:</span>
                <span className="font-mono">− {formatINR(advancePayment)}</span>
              </div>
              <div className="border-t-2 border-plum pt-2 flex justify-between font-black text-sm text-[#18141E]">
                <span>Remaining Balance Due:</span>
                <span className="font-mono">
                  {formatINR(selectedBooking.balanceDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Signature Signoff */}
          <div className="pt-8 border-t border-line-soft grid grid-cols-2 gap-10 text-center text-xs">
            <div>
              <div className="h-10 border-b border-gray-400"></div>
              <div className="font-bold text-[#18141E] mt-1">Customer Signature</div>
              <div className="text-[10px] text-[#5B5566]">I agree to the rental terms &amp; deposit policy</div>
            </div>
            <div>
              <div className="h-10 border-b border-gray-400"></div>
              <div className="font-bold text-plum mt-1">Authorized Signatory — {shopName}</div>
              <div className="text-[10px] text-[#5B5566]">Bargarh, Odisha Flagship Store</div>
            </div>
          </div>
        </div>
      ) : (
        /* 80mm Thermal Receipt Layout */
        <div className="thermal-receipt bg-white p-4 rounded-xl border border-[#E8E2F0] shadow-sm max-w-[80mm] mx-auto text-black font-mono text-[11px] leading-tight space-y-2">
          <div className="text-center pb-2 border-b border-dashed border-gray-400">
            <div className="font-bold text-sm uppercase">{shopName}</div>
            <div className="text-[9px]">CLOTHING &amp; BRIDAL RENTAL</div>
            <div className="text-[9px]">{shopPhone}</div>
            <div className="mt-1 font-bold">RECEIPT: {selectedBooking.id}</div>
            <div className="text-[9px]">{formatDate(selectedBooking.createdAt)}</div>
          </div>

          <div className="py-1 border-b border-dashed border-gray-400 space-y-0.5 text-[10px]">
            <div>Cust: {selectedBooking.customer.name}</div>
            <div>Ph: {selectedBooking.customer.phone}</div>
            <div>Pickup: {formatDate(selectedBooking.pickupDate)}</div>
            <div>Return: {formatDate(selectedBooking.returnDueDate)}</div>
          </div>

          <div className="py-1 border-b border-dashed border-gray-400 space-y-1 text-[10px]">
            {selectedBooking.items.map((i) => (
              <div key={i.garmentId} className="flex justify-between">
                <span>{i.garmentId} ({i.size})</span>
                <span>{formatINR(i.rentalPrice)}</span>
              </div>
            ))}
          </div>

          <div className="py-1 border-b border-dashed border-gray-400 space-y-0.5 text-[10px]">
            <div className="flex justify-between">
              <span>Rental Total:</span>
              <span>{formatINR(selectedBooking.rentalTotal)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Security Deposit:</span>
              <span>{formatINR(selectedBooking.depositTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Advance Paid:</span>
              <span>− {formatINR(advancePayment)}</span>
            </div>
            <div className="flex justify-between font-bold text-xs pt-1 border-t border-[#E8E2F0]">
              <span>Balance Due:</span>
              <span>{formatINR(selectedBooking.balanceDue)}</span>
            </div>
          </div>

          <div className="text-center pt-2 text-[9px] text-[#5B5566]">
            <div>Keep this receipt safe for deposit refund at return check-in.</div>
            <div className="mt-1 font-bold">Dhanyabad! Visit Again.</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#8C8499]">Loading invoice data...</div>}>
      <InvoiceContent />
    </Suspense>
  );
}
