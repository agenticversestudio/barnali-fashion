"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Wallet,
  Search,
  ShieldCheck,
  AlertCircle,
  Receipt,
  CheckCircle2,
  Loader2,
  Clock,
} from "lucide-react";
import { bookingsApi } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";
import type { BookingDto, DepositStatus } from "@/types/api";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DepositsLedgerPage() {
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingsApi.list({ limit: 100 });
      setBookings(res.items || []);
    } catch (err) {
      console.error("Failed to load bookings for deposits ledger:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus =
      statusFilter === "ALL" || b.depositStatus === statusFilter;
    const matchesSearch =
      !searchQuery ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customer.phone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const totalDepositsHeld = bookings
    .filter((b) => b.depositStatus === "HELD")
    .reduce((acc, b) => acc + b.depositTotal, 0);

  const totalRefunded = bookings
    .filter((b) => b.depositStatus === "REFUNDED" || b.depositStatus === "PARTIALLY_REFUNDED")
    .reduce((acc, b) => acc + (b.refundAmount || 0), 0);

  const totalDamageCleaningRetained = bookings.reduce(
    (acc, b) => acc + (b.damageCharge || 0) + (b.cleaningCharge || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-gold-dark font-semibold uppercase tracking-wider mb-1">
          <Wallet className="w-4 h-4 text-plum" />
          <span>Refundable Deposit Escrow &amp; Reconciliation</span>
        </div>
        <h1 className="text-2xl page-title">Security Deposit Ledger</h1>
        <p className="text-xs text-[#5B5566] mt-0.5">
          Strict separation of client security deposits from rental income, tracking active liabilities, damage deductions, and refunds.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-line-soft shadow-xs">
          <div className="text-[#8C8499] font-semibold uppercase text-[10px]">
            Active Deposit Liability (In Vault)
          </div>
          <div className="text-2xl font-bold text-gold mt-1 font-mono">
            {formatINR(totalDepositsHeld)}
          </div>
          <div className="text-[#5B5566] text-[11px] mt-0.5">
            Held against {bookings.filter((b) => b.depositStatus === "HELD").length} active bookings
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-line-soft shadow-xs">
          <div className="text-[#8C8499] font-semibold uppercase text-[10px]">
            Total Deposits Refunded
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
            {formatINR(totalRefunded > 0 ? totalRefunded : 0)}
          </div>
          <div className="text-[#5B5566] text-[11px] mt-0.5">
            Returned upon verified undamaged check-in
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-line-soft shadow-xs">
          <div className="text-[#8C8499] font-semibold uppercase text-[10px]">
            Damage Deductions Retained
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-1 font-mono">
            {formatINR(totalDamageCleaningRetained)}
          </div>
          <div className="text-[#5B5566] text-[11px] mt-0.5">
            Transferred to maintenance repair fund
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-line-soft p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#8C8499] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search booking ref, customer name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-ivory border border-line rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#5B5566] font-semibold">Deposit Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-ivory border border-line rounded-xl text-xs font-semibold text-[#5B5566]"
          >
            <option value="ALL">All Statuses</option>
            <option value="HELD">HELD (Active)</option>
            <option value="REFUNDED">REFUNDED</option>
            <option value="PARTIALLY_REFUNDED">PARTIALLY_REFUNDED</option>
            <option value="FORFEITED">FORFEITED</option>
            <option value="NOT_COLLECTED">NOT_COLLECTED</option>
          </select>
        </div>
      </div>

      {/* Deposit Records Table */}
      <div className="bg-white rounded-2xl border border-line-soft shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#5B5566]">
            <Loader2 className="w-6 h-6 animate-spin text-plum mx-auto mb-2" />
            Loading deposit escrow entries...
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState title="No booking deposits found." className="py-12" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gold-soft border-b border-line-soft text-gold-dark uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Event Date</th>
                  <th className="py-3 px-3">Deposit Amount</th>
                  <th className="py-3 px-3">Deposit Status</th>
                  <th className="py-3 px-3">Damage / Repair</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-ivory transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-plum">{b.id}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#18141E]">{b.customer.name}</div>
                      <div className="text-[#8C8499] text-[10px]">{b.customer.phone}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[#5B5566]">
                      {formatDate(b.eventDate)}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-gold">
                      {formatINR(b.depositTotal)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                          b.depositStatus === "HELD"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : b.depositStatus === "REFUNDED"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : b.depositStatus === "PARTIALLY_REFUNDED"
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : "bg-[#F5F2F8] text-[#5B5566] border-[#E8E2F0]"
                        }`}
                      >
                        {b.depositStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-rose-600 font-semibold">
                      {(b.damageCharge || 0) + (b.cleaningCharge || 0) > 0
                        ? formatINR((b.damageCharge || 0) + (b.cleaningCharge || 0))
                        : "₹0"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/erp/billing/invoices?bookingId=${b.id}`}
                        className="text-plum hover:underline font-bold text-[11px]"
                      >
                        Receipt →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
