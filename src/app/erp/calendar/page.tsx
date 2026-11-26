"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Shirt,
  Clock,
  Sparkles,
  Info,
  X,
  Phone,
  MessageCircle,
  Loader2,
  Calendar,
} from "lucide-react";
import { garmentsApi } from "@/lib/api";
import { formatDate, formatINR } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AvailabilityRow } from "@/types/api";

export default function AvailabilityCalendarPage() {
  const [rows, setRows] = useState<AvailabilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Date range navigation: Month / Year
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(11); // 11 = November
  const [selectedCell, setSelectedCell] = useState<{
    garmentId: string;
    garmentName: string;
    date: string;
    booking?: { bookingId: string; from: string; to: string; status: string };
  } | null>(null);

  // Calculate days in the selected month
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const fromDateStr = `${year}-${String(month).padStart(2, "0")}-01`;
  const toDateStr = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const loadAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const res = await garmentsApi.getAvailability(
        fromDateStr,
        toDateStr,
        selectedCategory !== "ALL" ? selectedCategory : undefined
      );
      setRows(res.items || []);
    } catch (err) {
      console.error("Failed to load availability matrix:", err);
    } finally {
      setLoading(false);
    }
  }, [fromDateStr, toDateStr, selectedCategory]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const categories = [
    "ALL",
    "Bridal Lehenga",
    "Groom Sherwani",
    "Party Gown",
    "Silk Saree",
    "Indo-Western",
    "Kids Festive Wear",
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 md:p-6 rounded-2xl border border-[#E6E4DF] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif font-bold text-xl md:text-2xl text-slate-900 tracking-tight">
              Calendar Availability Matrix
            </h1>
            <span className="text-xs font-mono font-semibold bg-[#6B1D2F]/10 text-[#6B1D2F] px-2.5 py-0.5 rounded-full">
              {rows.length} Pieces
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visual 30-day timeline to inspect garment availability and prevent double bookings.
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors shadow-2xs"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-serif font-bold text-xs text-slate-800 px-3 min-w-[130px] text-center">
            {monthNames[month - 1]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors shadow-2xs"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Categories Filter Strip */}
      <div className="bg-white p-3 md:p-4 rounded-2xl border border-[#E6E4DF] shadow-2xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
              selectedCategory === c
                ? "bg-[#6B1D2F] text-white font-semibold"
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80"
            }`}
          >
            {c === "ALL" ? "All Categories" : c}
          </button>
        ))}
      </div>

      {/* Main Sticky Calendar Matrix */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E6E4DF] p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#6B1D2F] mx-auto mb-2" />
          <div className="text-xs text-slate-500">Computing 30-day availability matrix from database...</div>
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E6E4DF] p-12 text-center space-y-2">
          <div className="text-slate-800 font-bold text-sm">No costumes found for this category</div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E6E4DF] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#E6E4DF]">
                  <th className="sticky left-0 bg-[#FAF9F6] z-20 w-52 py-3 px-3.5 border-r border-[#E6E4DF] shadow-[2px_0_4px_rgba(0,0,0,0.03)] font-bold text-slate-700 uppercase text-[10px]">
                    Costume SKU / Piece
                  </th>
                  {dayNumbers.map((d) => {
                    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                    const isToday = dateStr === new Date().toISOString().split("T")[0];
                    return (
                      <th
                        key={d}
                        className={`min-w-[36px] max-w-[40px] py-2 text-center font-mono border-r border-slate-100 text-[10px] ${
                          isToday ? "bg-amber-100 text-amber-950 font-bold" : "text-slate-500"
                        }`}
                      >
                        {d}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.garmentId} className="hover:bg-slate-50/70 transition-colors">
                    {/* Sticky SKU & Name column */}
                    <td className="sticky left-0 bg-white z-10 py-2.5 px-3.5 border-r border-[#E6E4DF] shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/erp/inventory/${row.garmentId}`}
                          className="font-mono font-bold text-xs text-[#6B1D2F] hover:underline"
                        >
                          {row.garmentId}
                        </Link>
                        <span className="text-[10px] text-slate-400 font-mono">{row.rack}</span>
                      </div>
                      <div className="font-semibold text-slate-800 text-[11px] truncate w-44">
                        {row.name}
                      </div>
                    </td>

                    {/* Day Cells */}
                    {dayNumbers.map((d) => {
                      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                      const busyBooking = row.busy.find(
                        (b) => dateStr >= b.from && dateStr <= b.to
                      );
                      const isUnavailable = row.status === "UNAVAILABLE" || row.status === "DAMAGED_REPAIR";

                      return (
                        <td
                          key={d}
                          onClick={() => {
                            setSelectedCell({
                              garmentId: row.garmentId,
                              garmentName: row.name,
                              date: dateStr,
                              booking: busyBooking,
                            });
                          }}
                          className={`min-w-[36px] max-w-[40px] h-10 border-r border-slate-100 text-center cursor-pointer p-0.5 transition-colors ${
                            busyBooking
                              ? busyBooking.status === "OUT_ON_RENT"
                                ? "bg-blue-500/80 hover:bg-blue-600 text-white"
                                : "bg-amber-500/80 hover:bg-amber-600 text-white"
                              : isUnavailable
                              ? "bg-slate-200/60"
                              : "hover:bg-emerald-50/60"
                          }`}
                          title={
                            busyBooking
                              ? `${row.name} — Booked (${busyBooking.bookingId})`
                              : `${row.name} — Available on ${dateStr}`
                          }
                        >
                          {busyBooking && (
                            <div className="w-full h-full flex items-center justify-center font-mono text-[9px] font-bold">
                              •
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cell Detail / Booking Popover Modal */}
      {selectedCell && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-[#E6E4DF] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-[#6B1D2F]">
                  {selectedCell.garmentId}
                </span>
                <h3 className="font-serif font-bold text-base text-slate-900 line-clamp-1">
                  {selectedCell.garmentName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div>Selected Date: <strong className="font-mono">{selectedCell.date}</strong></div>
                {selectedCell.booking ? (
                  <>
                    <div className="pt-1 text-rose-800 font-bold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-rose-600" />
                      <span>Reserved / Out on Rent</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Booking: <strong className="font-mono">{selectedCell.booking.bookingId}</strong>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Dates: {selectedCell.booking.from} → {selectedCell.booking.to}
                    </div>
                  </>
                ) : (
                  <div className="pt-1 text-emerald-700 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Piece is Available for Rent!</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              {selectedCell.booking ? (
                <Link
                  href={`/erp/bookings?orderId=${selectedCell.booking.bookingId}`}
                  onClick={() => setSelectedCell(null)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-center font-semibold rounded-xl text-xs"
                >
                  View Booking
                </Link>
              ) : (
                <Link
                  href={`/erp/bookings/new?sku=${selectedCell.garmentId}`}
                  onClick={() => setSelectedCell(null)}
                  className="w-full py-2 bg-[#6B1D2F] hover:bg-[#521624] text-white text-center font-semibold rounded-xl text-xs"
                >
                  Book Costume Now
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
