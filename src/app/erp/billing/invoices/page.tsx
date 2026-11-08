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
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR, formatDate } from "@/lib/utils";
import { Booking } from "@/types";

function InvoiceContent() {
  const searchParams = useSearchParams();
  const queryBookingId = searchParams.get("bookingId");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [printLayout, setPrintLayout] = useState<"A4" | "thermal">("A4");

  useEffect(() => {
    const list = DataStore.getBookings();
    setBookings(list);
    if (queryBookingId) {
      const b = list.find((item) => item.id === queryBookingId);
      if (b) setSelectedBooking(b);
    } else if (list.length > 0) {
      setSelectedBooking(list[0]);
    }
  }, [queryBookingId]);

  if (!selectedBooking) {
    return (
      <div className="text-center py-20 text-xs text-gray-500">
        Loading booking invoice...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header controls (Hidden during print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8C6F3B] font-semibold uppercase tracking-wider mb-1">
            <Receipt className="w-4 h-4 text-[#4B1835]" />
            <span>Official Rental Invoice &amp; Security Deposit Agreement</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#27222A]">Invoices &amp; Receipts</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Format Toggle */}
          <div className="bg-white p-1 rounded-xl border border-[#E8DFD1] flex text-xs">
            <button
              onClick={() => setPrintLayout("A4")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                printLayout === "A4" ? "bg-[#4B1835] text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              A4 Agreement
            </button>
            <button
              onClick={() => setPrintLayout("thermal")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                printLayout === "thermal" ? "bg-[#4B1835] text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              80mm Thermal Receipt
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="bg-[#B89558] hover:bg-[#A38248] text-[#27222A] font-bold text-xs px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice / Receipt</span>
          </button>
        </div>
      </div>

      {/* Select booking dropdown (Hidden during print) */}
      <div className="no-print bg-white p-3 rounded-2xl border border-[#EFE9DD] flex items-center gap-3 text-xs">
        <span className="font-bold text-gray-700">Select Booking:</span>
        <select
          value={selectedBooking.id}
          onChange={(e) => {
            const b = bookings.find((item) => item.id === e.target.value);
            if (b) setSelectedBooking(b);
          }}
          className="p-1.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-bold text-[#4B1835] flex-1 max-w-md"
        >
          {bookings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.id} — {b.customerName} ({formatDate(b.pickupDate)} to {formatDate(b.returnDueDate)})
            </option>
          ))}
        </select>
      </div>

      {/* Printable Invoice Container */}
      {printLayout === "A4" ? (
        /* A4 Layout */
        <div className="bg-white rounded-2xl border border-[#EFE9DD] p-8 max-w-4xl mx-auto shadow-sm text-xs font-sans">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-[#4B1835] pb-6">
            <div>
              <div className="font-serif font-black text-2xl text-[#4B1835] tracking-wider">
                BARNALI FASHION
              </div>
              <div className="text-[10px] text-[#8C6F3B] font-bold uppercase tracking-widest mt-0.5">
                Bridal &amp; Occasion Wear Rental Studio
              </div>
              <div className="text-gray-600 mt-2 space-y-0.5 text-[11px]">
                <div>In front of LIC Office, Near Keshariya Restaurant</div>
                <div>Bargarh Road, Bargarh, Odisha — 768028</div>
                <div>Phone / WhatsApp: +91 7978256488</div>
              </div>
            </div>

            <div className="text-right">
              <div className="font-bold text-gray-400 uppercase text-[10px] tracking-wider">
                Tax Invoice / Rental Voucher
              </div>
              <div className="text-lg font-mono font-bold text-[#4B1835] mt-0.5">
                {selectedBooking.id}
              </div>
              <div className="text-gray-500 text-[11px] mt-1">
                Date: {formatDate(selectedBooking.createdAt)}
              </div>
              <div className="mt-1">
                <span className="bg-[#FAF5EB] text-[#8C6F3B] font-bold px-2 py-0.5 rounded text-[10px] border border-[#E8DFD1]">
                  Status: {selectedBooking.status}
                </span>
              </div>
            </div>
          </div>

          {/* Customer & Event Details */}
          <div className="grid grid-cols-2 gap-6 my-6 p-4 bg-[#FBF9F5] rounded-xl border border-[#E8DFD1]">
            <div>
              <div className="font-bold text-gray-500 uppercase text-[10px] mb-1">
                Customer Information
              </div>
              <div className="font-bold text-sm text-gray-900">{selectedBooking.customerName}</div>
              <div className="text-gray-600 mt-0.5">Mobile: {selectedBooking.customerPhone}</div>
              <div className="text-gray-600">Location: {selectedBooking.customerCity}, Odisha</div>
            </div>

            <div>
              <div className="font-bold text-gray-500 uppercase text-[10px] mb-1">
                Rental Period &amp; Event
              </div>
              <div className="font-bold text-gray-900">{selectedBooking.eventName}</div>
              <div className="text-gray-700 mt-0.5">
                Pickup Date: <strong>{formatDate(selectedBooking.pickupDate)}</strong>
              </div>
              <div className="text-gray-700">
                Return Due Date: <strong>{formatDate(selectedBooking.returnDueDate)}</strong> (Before 7:00 PM)
              </div>
            </div>
          </div>

          {/* Garments Table */}
          <div className="border border-[#EFE9DD] rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left">
              <thead className="bg-[#FAF5EB] text-[#8C6F3B] font-bold uppercase text-[10px] border-b border-[#EFE9DD]">
                <tr>
                  <th className="py-2.5 px-4">Item #</th>
                  <th className="py-2.5 px-3">Garment Unit SKU</th>
                  <th className="py-2.5 px-3">Description &amp; Embellishment</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3 text-right">Rental Charge</th>
                  <th className="py-2.5 px-4 text-right">Refundable Deposit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1ECE3]">
                {selectedBooking.items.map((item, idx) => (
                  <tr key={item.garmentUnitId}>
                    <td className="py-3 px-4 text-gray-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono font-bold text-[#4B1835]">
                      {item.garmentUnitId}
                    </td>
                    <td className="py-3 px-3 font-semibold text-gray-900">{item.productName}</td>
                    <td className="py-3 px-3">
                      <span className="bg-gray-100 px-2 py-0.5 rounded font-bold">{item.size}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-gray-900">
                      {formatINR(item.rentalPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[#B89558]">
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
            <div className="p-4 bg-[#FAF5EB]/60 rounded-xl border border-[#E8DFD1] text-[10px] text-gray-600 space-y-1">
              <div className="font-bold text-gray-800 uppercase text-[11px] mb-1">
                Standard Rental Terms
              </div>
              <div>• Garment security deposit is 100% refundable upon undamaged return.</div>
              <div>• Strict return due deadline applies. Late fees: ₹300 per day.</div>
              <div>• Do not machine wash or iron directly on metallic zari or stone embroidery.</div>
              <div>• Minor food stains are covered by standard dry clean; heavy rips or burns attract deduction.</div>
            </div>

            {/* Billing Totals */}
            <div className="p-4 bg-[#FBF9F5] rounded-xl border border-[#E8DFD1] space-y-2">
              <div className="flex justify-between font-bold text-gray-700">
                <span>Rental Service Fee:</span>
                <span className="font-mono text-gray-900">
                  {formatINR(selectedBooking.rentalTotal)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-[#B89558]">
                <span>Refundable Security Deposit (Held):</span>
                <span className="font-mono">
                  {formatINR(selectedBooking.securityDepositTotal)}
                </span>
              </div>
              <div className="border-t border-[#E8DFD1] pt-2 flex justify-between font-bold text-sm text-[#4B1835]">
                <span>Total Amount Initial:</span>
                <span className="font-mono">
                  {formatINR(selectedBooking.rentalTotal + selectedBooking.securityDepositTotal)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                <span>Advance Received ({selectedBooking.paymentMethod}):</span>
                <span className="font-mono">− {formatINR(selectedBooking.advancePaid)}</span>
              </div>
              <div className="border-t-2 border-[#4B1835] pt-2 flex justify-between font-black text-sm text-gray-900">
                <span>Remaining Balance at Handover:</span>
                <span className="font-mono">
                  {formatINR(selectedBooking.remainingRentalDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Signature Signoff */}
          <div className="pt-8 border-t border-[#EFE9DD] grid grid-cols-2 gap-10 text-center text-xs">
            <div>
              <div className="h-10 border-b border-gray-400"></div>
              <div className="font-bold text-gray-800 mt-1">Customer Signature</div>
              <div className="text-[10px] text-gray-500">I agree to the rental terms &amp; deposit policy</div>
            </div>
            <div>
              <div className="h-10 border-b border-gray-400"></div>
              <div className="font-bold text-[#4B1835] mt-1">Authorized Signatory — Barnali Fashion</div>
              <div className="text-[10px] text-gray-500">Bargarh, Odisha Flagship Store</div>
            </div>
          </div>
        </div>
      ) : (
        /* 80mm Thermal Receipt Layout */
        <div className="thermal-receipt bg-white p-4 rounded-xl border border-gray-300 shadow-sm max-w-[80mm] mx-auto text-black font-mono text-[11px] leading-tight space-y-2">
          <div className="text-center pb-2 border-b border-dashed border-gray-400">
            <div className="font-bold text-sm">BARNALI FASHION</div>
            <div className="text-[9px]">CLOTHING &amp; BRIDAL RENTAL</div>
            <div className="text-[9px]">Bargarh, Odisha • 7978256488</div>
            <div className="mt-1 font-bold">RECEIPT: {selectedBooking.id}</div>
            <div className="text-[9px]">{formatDate(selectedBooking.createdAt)}</div>
          </div>

          <div className="py-1 border-b border-dashed border-gray-400 space-y-0.5 text-[10px]">
            <div>Cust: {selectedBooking.customerName}</div>
            <div>Ph: {selectedBooking.customerPhone}</div>
            <div>Pickup: {formatDate(selectedBooking.pickupDate)}</div>
            <div>Return: {formatDate(selectedBooking.returnDueDate)}</div>
          </div>

          <div className="py-1 border-b border-dashed border-gray-400 space-y-1 text-[10px]">
            {selectedBooking.items.map((i) => (
              <div key={i.garmentUnitId} className="flex justify-between">
                <span>{i.garmentUnitId}</span>
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
              <span>{formatINR(selectedBooking.securityDepositTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Advance Paid:</span>
              <span>− {formatINR(selectedBooking.advancePaid)}</span>
            </div>
            <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-300">
              <span>Balance Due:</span>
              <span>{formatINR(selectedBooking.remainingRentalDue)}</span>
            </div>
          </div>

          <div className="text-center pt-2 text-[9px] text-gray-600">
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading invoice data...</div>}>
      <InvoiceContent />
    </Suspense>
  );
}
