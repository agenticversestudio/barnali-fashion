"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Shirt,
  CalendarCheck,
  AlertCircle,
  Sparkles,
  Wrench,
  Wallet,
  Clock,
  ArrowUpRight,
  PackageCheck,
  RotateCcw,
  Plus,
  Phone,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Booking, GarmentUnit } from "@/types";

export default function DashboardPage() {
  const [garments, setGarments] = useState<GarmentUnit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    setGarments(DataStore.getGarments());
    setBookings(DataStore.getBookings());
  }, []);

  // Compute metrics
  const totalGarments = garments.length;
  const availableGarments = garments.filter((g) => g.status === "AVAILABLE").length;
  const rentedGarments = garments.filter((g) => g.status === "RENTED").length;
  const laundryGarments = garments.filter((g) => g.status === "IN_LAUNDRY").length;
  const repairGarments = garments.filter((g) => g.status === "UNDER_REPAIR" || g.status === "REPAIR_PENDING").length;
  const reservedGarments = garments.filter((g) => g.status === "RESERVED" || g.status === "PREPARING").length;

  const activeRentals = bookings.filter((b) => b.status === "OUT_ON_RENT");
  const upcomingPickups = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "PICKUP_PENDING");
  const pendingReturns = bookings.filter((b) => b.status === "RETURN_RECEIVED");

  // Overdue returns: returnDueDate < today and not completed
  const todayStr = "2026-11-08";
  const overdueBookings = bookings.filter(
    (b) => b.status === "OUT_ON_RENT" && b.returnDueDate < todayStr
  );

  // Financial aggregates
  const totalDepositsHeld = bookings
    .filter((b) => b.depositStatus === "HELD")
    .reduce((acc, b) => acc + b.securityDepositTotal, 0);

  const totalRentalRevenue = bookings
    .filter((b) => b.status !== "CANCELLED")
    .reduce((acc, b) => acc + b.rentalTotal, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-[#4B1835] via-[#5C1F42] to-[#3B1129] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#B89558_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold tracking-widest text-[#D4B67F] uppercase">
                Operations Command Center
              </span>
              <span className="bg-[#D4B67F]/20 text-[#D4B67F] text-[10px] px-2 py-0.5 rounded-full font-semibold border border-[#D4B67F]/30">
                Bargarh Flagship Store
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-white">
              Barnali Fashion Rental ERP
            </h1>
            <p className="text-sm text-[#F7F3EC]/80 mt-1 max-w-xl">
              Live operational monitoring of wedding wear inventory, customer bookings, rental issue &amp; return cycles, laundry, and security deposits.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/erp/bookings/new"
              className="bg-[#B89558] hover:bg-[#A38248] text-[#27222A] font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-[#27222A]" />
              <span>Create New Booking</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Critical Overdue Banner if any */}
      {overdueBookings.length > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <div className="font-bold text-rose-900 text-sm">
                Attention: {overdueBookings.length} Rental Return Overdue!
              </div>
              <div className="text-xs text-rose-700">
                {overdueBookings.map((b) => (
                  <span key={b.id} className="mr-3">
                    <strong>{b.customerName}</strong> ({b.items[0]?.productName}) was due on {formatDate(b.returnDueDate)}.
                  </span>
                ))}
              </div>
            </div>
          </div>
          <Link
            href="/erp/operations/returns"
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-xs transition-colors shrink-0"
          >
            Review Overdue &amp; Follow Up →
          </Link>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Out on Rent */}
        <div className="bg-white p-4 rounded-xl border border-[#EFE9DD] shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Out on Rent</span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#27222A]">{rentedGarments} <span className="text-xs text-gray-400 font-normal">garments</span></div>
          <div className="text-[11px] text-purple-700 font-medium mt-1">
            Across {activeRentals.length} active customer bookings
          </div>
        </div>

        {/* Ready Available Stock */}
        <div className="bg-white p-4 rounded-xl border border-[#EFE9DD] shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Ready in Store</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700">{availableGarments} <span className="text-xs text-gray-400 font-normal">/ {totalGarments} units</span></div>
          <div className="text-[11px] text-gray-500 font-medium mt-1">
            {reservedGarments} reserved for upcoming events
          </div>
        </div>

        {/* Laundry & Repairs */}
        <div className="bg-white p-4 rounded-xl border border-[#EFE9DD] shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">In Process (Wash/Tailor)</span>
            <div className="p-2 bg-cyan-50 text-cyan-700 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#27222A]">{laundryGarments + repairGarments} <span className="text-xs text-gray-400 font-normal">units</span></div>
          <div className="text-[11px] text-cyan-700 font-medium mt-1">
            {laundryGarments} at Dry Cleaners • {repairGarments} with Tailor
          </div>
        </div>

        {/* Security Deposits Held */}
        <div className="bg-white p-4 rounded-xl border border-[#EFE9DD] shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Deposits Held (Vault)</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#B89558]">{formatINR(totalDepositsHeld)}</div>
          <div className="text-[11px] text-gray-500 font-medium mt-1">
            Strictly refundable liability (separate from revenue)
          </div>
        </div>
      </div>

      {/* Main Operational Split: Upcoming Pickups & Returns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upcoming Pickups & Deliveries */}
        <div className="bg-white rounded-2xl border border-[#EFE9DD] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DD]">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-[#4B1835]" />
              <h2 className="font-bold text-gray-900 text-sm">Upcoming Pickups &amp; Issues</h2>
            </div>
            <Link href="/erp/operations/pickup" className="text-xs text-[#B89558] hover:underline font-semibold">
              Issue Counter →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {upcomingPickups.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400">No scheduled pickups pending.</div>
            ) : (
              upcomingPickups.map((b) => (
                <div
                  key={b.id}
                  className="p-3 bg-[#FBF9F5] rounded-xl border border-[#E8DFD1] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                      <span>{b.customerName}</span>
                      <span className="text-[10px] text-gray-400 font-mono">({b.customerPhone})</span>
                    </div>
                    <div className="text-gray-600 mt-0.5">
                      {b.items.map((i) => i.productName).join(", ")}
                    </div>
                    <div className="text-[11px] text-[#4B1835] font-semibold mt-1 flex items-center gap-2">
                      <Clock className="w-3 h-3 text-[#B89558]" />
                      Pickup Date: {formatDate(b.pickupDate)} • Event: {b.eventName}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <StatusBadge status={b.status} />
                    <div className="text-[11px] text-gray-500 mt-1 font-mono">
                      Rem. Due: {formatINR(b.remainingRentalDue)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Active Rentals & Expected Returns */}
        <div className="bg-white rounded-2xl border border-[#EFE9DD] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DD]">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#4B1835]" />
              <h2 className="font-bold text-gray-900 text-sm">Current Active Rentals (Return Due Tracking)</h2>
            </div>
            <Link href="/erp/operations/returns" className="text-xs text-[#B89558] hover:underline font-semibold">
              Return Desk →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {activeRentals.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400">No active garments currently out.</div>
            ) : (
              activeRentals.map((b) => {
                const isOverdue = b.returnDueDate < todayStr;
                return (
                  <div
                    key={b.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      isOverdue
                        ? "bg-rose-50/70 border-rose-200"
                        : "bg-[#FBF9F5] border-[#E8DFD1]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 font-bold text-gray-900">
                        <span>{b.customerName}</span>
                        {isOverdue && (
                          <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase">
                            Overdue
                          </span>
                        )}
                      </div>
                      <div className="text-gray-600 mt-0.5">
                        {b.items.map((i) => `${i.productName} (${i.garmentUnitId})`).join(", ")}
                      </div>
                      <div className="text-[11px] mt-1 flex items-center gap-2">
                        <span className={isOverdue ? "text-rose-700 font-bold" : "text-gray-600 font-medium"}>
                          Return Due: {formatDate(b.returnDueDate)}
                        </span>
                        <span>• Deposit Held: {formatINR(b.securityDepositTotal)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/91${b.customerWhatsApp}?text=Namaste%20${encodeURIComponent(
                          b.customerName
                        )},%20this%20is%20a%20gentle%20reminder%20from%20Barnali%20Fashion%20Bargarh%20regarding%20the%20scheduled%20return%20of%20your%20rental%20garment.`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors"
                        title="Send WhatsApp Reminder"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                      <Link
                        href={`/erp/operations/returns?bookingId=${b.id}`}
                        className="bg-[#4B1835] hover:bg-[#320F23] text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xs"
                      >
                        Check-in
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Stock Health & Operational Workflows Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Category Distribution */}
        <div className="bg-white rounded-2xl border border-[#EFE9DD] p-5 shadow-xs">
          <h3 className="font-bold text-gray-900 text-sm mb-3">Inventory Status Breakdown</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-emerald-800 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available / Pristine
              </span>
              <span className="font-bold">{availableGarments} units</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-purple-800 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Out on Rent
              </span>
              <span className="font-bold">{rentedGarments} units</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-cyan-800 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> In Dry Clean / Laundry
              </span>
              <span className="font-bold">{laundryGarments} units</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-amber-800 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Reserved for Bookings
              </span>
              <span className="font-bold">{reservedGarments} units</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-orange-800 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Under Tailor Repair
              </span>
              <span className="font-bold">{repairGarments} units</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#EFE9DD]">
            <Link
              href="/erp/inventory"
              className="text-xs text-[#4B1835] hover:text-[#B89558] font-bold flex items-center justify-between"
            >
              <span>Explore All Garments &amp; SKUs</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Laundry & Care Summary */}
        <div className="bg-white rounded-2xl border border-[#EFE9DD] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 text-sm">Laundry &amp; Sanitization</h3>
            <Link href="/erp/operations/laundry" className="text-xs text-[#B89558] hover:underline font-semibold">
              Manage →
            </Link>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed mb-4">
            Garments are automatically quarantined after return and routed through partner vendors like Maa Samleswari Dry Cleaners before returning to available status.
          </p>
          <div className="bg-[#FAF5EB] p-3 rounded-xl border border-[#E8DFD1] text-xs">
            <div className="flex justify-between font-bold text-gray-800">
              <span>Next Expected Return:</span>
              <span className="text-[#4B1835]">09 Nov (Tomorrow)</span>
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              Unit BF-LH-003 (Royal Zardozi Crimson Lehenga)
            </div>
          </div>
        </div>

        {/* Financial Snapshot */}
        <div className="bg-white rounded-2xl border border-[#EFE9DD] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 text-sm">Financial Snapshot</h3>
            <Link href="/erp/billing/cash-closing" className="text-xs text-[#B89558] hover:underline font-semibold">
              Cash Closing →
            </Link>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Rental Turnover:</span>
              <span className="font-bold text-gray-900">{formatINR(totalRentalRevenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active Deposit Liability:</span>
              <span className="font-bold text-[#B89558]">{formatINR(totalDepositsHeld)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Completed Bookings:</span>
              <span className="font-bold text-emerald-700">
                {bookings.filter((b) => b.status === "COMPLETED").length}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#EFE9DD] flex items-center justify-between text-xs">
            <span className="text-gray-500">Shop Daily Closing:</span>
            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px] border border-emerald-200">
              Yesterday Balanced
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
