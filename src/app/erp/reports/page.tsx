"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Shirt,
  Calendar,
  Wallet,
  Download,
  Printer,
  Sparkles,
  Award,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR } from "@/lib/utils";
import { Booking, GarmentUnit } from "@/types";

export default function ReportsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [garments, setGarments] = useState<GarmentUnit[]>([]);

  useEffect(() => {
    setBookings(DataStore.getBookings());
    setGarments(DataStore.getGarments());
  }, []);

  const totalRevenue = bookings
    .filter((b) => b.status !== "CANCELLED")
    .reduce((acc, b) => acc + b.rentalTotal, 0);

  const totalDeposits = bookings
    .filter((b) => b.depositStatus === "HELD")
    .reduce((acc, b) => acc + b.securityDepositTotal, 0);

  // Category breakdown
  const categoryStats = [
    { name: "Bridal Lehenga", count: 9, revenue: 32500, share: "42%" },
    { name: "Groom Sherwani", count: 7, revenue: 21600, share: "28%" },
    { name: "Party Gown", count: 4, revenue: 10400, share: "13%" },
    { name: "Silk Saree", count: 6, revenue: 8800, share: "11%" },
    { name: "Indo-Western & Kids", count: 9, revenue: 4500, share: "6%" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8C6F3B] font-semibold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4 text-[#4B1835]" />
            <span>Turnover, Asset Utilization &amp; Demand Insights</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#27222A]">Business Analytics &amp; Reports</h1>
        </div>

        <button
          onClick={() => window.print()}
          className="bg-[#4B1835] hover:bg-[#320F23] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all"
        >
          <Printer className="w-4 h-4 text-[#D4B67F]" />
          <span>Print Monthly Report</span>
        </button>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-5 rounded-2xl border border-[#EFE9DD] shadow-xs">
          <div className="text-gray-400 font-semibold uppercase text-[10px]">
            Total Rental Revenue (Oct - Nov 2026)
          </div>
          <div className="text-3xl font-bold text-[#4B1835] mt-1">{formatINR(totalRevenue)}</div>
          <div className="text-emerald-700 text-[11px] font-semibold mt-1">
            ↑ 24% increase compared to preceding festival season
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EFE9DD] shadow-xs">
          <div className="text-gray-400 font-semibold uppercase text-[10px]">
            Active Deposit Liability (Held)
          </div>
          <div className="text-3xl font-bold text-[#B89558] mt-1">{formatINR(totalDeposits)}</div>
          <div className="text-gray-500 text-[11px] mt-1">100% segregated in vault reserve</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EFE9DD] shadow-xs">
          <div className="text-gray-400 font-semibold uppercase text-[10px]">
            Average Rental Duration
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-1">3.4 Days</div>
          <div className="text-gray-500 text-[11px] mt-1">Optimal 24h post-event turnaround</div>
        </div>
      </div>

      {/* Category Performance Breakdown */}
      <div className="bg-white rounded-2xl border border-[#EFE9DD] p-6 shadow-xs space-y-4">
        <div className="font-bold text-gray-900 text-sm pb-2 border-b border-[#EFE9DD]">
          Category-wise Rental Turnover &amp; Volume Share
        </div>

        <div className="space-y-4">
          {categoryStats.map((c) => (
            <div key={c.name} className="space-y-1 text-xs">
              <div className="flex justify-between font-bold text-gray-800">
                <span>{c.name} ({c.count} physical units)</span>
                <span className="font-mono text-[#4B1835]">
                  {formatINR(c.revenue)} ({c.share})
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#4B1835] to-[#B89558] rounded-full"
                  style={{ width: c.share }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Highest ROI Physical Units */}
      <div className="bg-white rounded-2xl border border-[#EFE9DD] p-6 shadow-xs space-y-4 text-xs">
        <div className="font-bold text-gray-900 text-sm pb-2 border-b border-[#EFE9DD] flex items-center gap-2">
          <Award className="w-4 h-4 text-[#B89558]" />
          <span>Top Performing Physical Garment Units (Most Rented in Bargarh)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#FAF5EB] rounded-xl border border-[#E8DFD1]">
            <div className="font-mono font-bold text-[#4B1835] text-sm">BF-LH-001</div>
            <div className="font-bold text-gray-900 mt-1">Royal Zardozi Crimson Velvet Lehenga</div>
            <div className="text-[11px] text-gray-500 mt-1">Total Rentals: 6 times</div>
            <div className="text-emerald-700 font-bold mt-2">Earned: ₹27,000 (Purchase: ₹38,000)</div>
          </div>

          <div className="p-4 bg-[#FAF5EB] rounded-xl border border-[#E8DFD1]">
            <div className="font-mono font-bold text-[#4B1835] text-sm">BF-JW-001</div>
            <div className="font-bold text-gray-900 mt-1">Kundan &amp; Pearl Heritage Bridal Choker</div>
            <div className="text-[11px] text-gray-500 mt-1">Total Rentals: 9 times</div>
            <div className="text-emerald-700 font-bold mt-2">Earned: ₹13,500 (100% Breakeven Exceeded)</div>
          </div>

          <div className="p-4 bg-[#FAF5EB] rounded-xl border border-[#E8DFD1]">
            <div className="font-mono font-bold text-[#4B1835] text-sm">BF-SH-001</div>
            <div className="font-bold text-gray-900 mt-1">Maharaja Ivory Raw Silk Sherwani</div>
            <div className="text-[11px] text-gray-500 mt-1">Total Rentals: 4 times</div>
            <div className="text-emerald-700 font-bold mt-2">Earned: ₹15,200 (Purchase: ₹32,000)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
