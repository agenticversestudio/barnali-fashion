"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  Search,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR, formatDate } from "@/lib/utils";
import { Booking } from "@/types";

export default function DepositsLedgerPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    setBookings(DataStore.getBookings());
  }, []);

  const totalDepositsHeld = bookings
    .filter((b) => b.depositStatus === "HELD")
    .reduce((acc, b) => acc + b.securityDepositTotal, 0);

  const totalRefunded = bookings
    .filter((b) => b.depositStatus === "FULLY_REFUNDED" || b.depositStatus === "PARTIALLY_REFUNDED")
    .reduce((acc, b) => acc + b.refundAmount, 0);

  const totalDamageRecovered = bookings.reduce((acc, b) => acc + b.damageDeduction, 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-[#8C6F3B] font-semibold uppercase tracking-wider mb-1">
          <Wallet className="w-4 h-4 text-[#4B1835]" />
          <span>Refundable Deposit Escrow &amp; Reconciliation</span>
        </div>
        <h1 className="text-2xl font-serif font-bold text-[#27222A]">Security Deposit Ledger</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Strict separation of client security deposits from rental income, tracking active liabilities, damage deductions, and refunds.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-[#EFE9DD] shadow-xs">
          <div className="text-gray-400 font-semibold uppercase text-[10px]">
            Active Deposit Liability (In Vault)
          </div>
          <div className="text-2xl font-bold text-[#B89558] mt-1">
            {formatINR(totalDepositsHeld)}
          </div>
          <div className="text-gray-500 text-[11px] mt-0.5">
            Held against {bookings.filter((b) => b.depositStatus === "HELD").length} active bookings
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#EFE9DD] shadow-xs">
          <div className="text-gray-400 font-semibold uppercase text-[10px]">
            Total Deposits Refunded
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {formatINR(totalRefunded)}
          </div>
          <div className="text-gray-500 text-[11px] mt-0.5">
            Returned upon verified undamaged check-in
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#EFE9DD] shadow-xs">
          <div className="text-gray-400 font-semibold uppercase text-[10px]">
            Damage Deductions Retained
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-1">
            {formatINR(totalDamageRecovered)}
          </div>
          <div className="text-gray-500 text-[11px] mt-0.5">
            Transferred to maintenance repair fund
          </div>
        </div>
      </div>

      {/* Deposit Records Table */}
      <div className="bg-white rounded-2xl border border-[#EFE9DD] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5EB] border-b border-[#EFE9DD] text-[#8C6F3B] uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Deposit Amount</th>
                <th className="py-3 px-3">Payment Mode</th>
                <th className="py-3 px-3">Deposit Status</th>
                <th className="py-3 px-3">Damage Deducted</th>
                <th className="py-3 px-3">Refund Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1ECE3]">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-[#FBF9F5] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#4B1835]">{b.id}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-gray-900">{b.customerName}</div>
                    <div className="text-gray-400 text-[10px]">{b.customerPhone}</div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-[#B89558]">
                    {formatINR(b.securityDepositTotal)}
                  </td>
                  <td className="py-3 px-3 font-semibold text-gray-600">{b.paymentMethod}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                        b.depositStatus === "HELD"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {b.depositStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-rose-600 font-semibold">
                    {b.damageDeduction > 0 ? formatINR(b.damageDeduction) : "₹0"}
                  </td>
                  <td className="py-3 px-3 font-mono text-emerald-700 font-bold">
                    {b.refundAmount > 0 ? formatINR(b.refundAmount) : "Pending Return"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/erp/billing/invoices?bookingId=${b.id}`}
                      className="text-[#4B1835] hover:underline font-bold text-[11px]"
                    >
                      Receipt →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
