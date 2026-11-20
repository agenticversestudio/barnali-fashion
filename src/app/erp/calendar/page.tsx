"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { Booking, GarmentUnit } from "@/types";
import { formatDate } from "@/lib/utils";

export default function AvailabilityCalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [garments, setGarments] = useState<GarmentUnit[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("November 2026");

  useEffect(() => {
    setBookings(DataStore.getBookings());
    setGarments(DataStore.getGarments());
  }, []);

  // Days in November 2026 (Nov 1 to Nov 30)
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Calendar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Availability matrix across physical items with automatic post-event buffer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-xs text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            {selectedMonth}
          </span>
          <button className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend & Instructions */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Out on Rent
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Confirmed Reservation
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span> Cleaning Buffer
          </span>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Bargarh Studio (9:30 AM – 8:30 PM IST)</span>
        </div>
      </div>

      {/* Interactive Gantt / Timeline Matrix */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Days Header */}
            <div className="grid grid-cols-31 bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500">
              <div className="p-2.5 border-r border-slate-200 w-48 shrink-0 font-semibold text-slate-800">
                Piece SKU
              </div>
              {daysInMonth.map((d) => (
                <div
                  key={d}
                  className={`p-2 text-center border-r border-slate-200 ${
                    d === 8 ? "bg-slate-900 text-white font-bold" : ""
                  }`}
                >
                  {d}
                  {d === 8 && <div className="text-[8px] uppercase tracking-tighter">Today</div>}
                </div>
              ))}
            </div>

            {/* Garment Rows */}
            <div className="divide-y divide-[#F1ECE3] text-xs">
              {garments.slice(0, 10).map((g) => {
                const gBookings = bookings.filter((b) =>
                  b.items.some((item) => item.garmentUnitId === g.id) && b.status !== "CANCELLED"
                );

                return (
                  <div key={g.id} className="grid grid-cols-31 items-center hover:bg-[#FBF9F5]/80">
                    {/* SKU Label */}
                    <div className="p-2 border-r border-[#EFE9DD] w-48 shrink-0">
                      <Link
                        href={`/erp/inventory/${g.id}`}
                        className="font-mono font-bold text-[#4B1835] hover:underline"
                      >
                        {g.id}
                      </Link>
                      <div className="text-[10px] text-gray-500 truncate">{g.productName}</div>
                    </div>

                    {/* Day cells */}
                    {daysInMonth.map((d) => {
                      // Check if day falls inside any booking for this garment
                      const dayDateStr = `2026-11-${String(d).padStart(2, "0")}`;
                      const matchBooking = gBookings.find(
                        (b) => dayDateStr >= b.pickupDate && dayDateStr <= b.returnDueDate
                      );

                      return (
                        <div
                          key={d}
                          className={`h-12 border-r border-[#EFE9DD] relative flex items-center justify-center ${
                            d === 8 ? "bg-amber-50/40" : ""
                          }`}
                        >
                          {matchBooking && (
                            <div
                              title={`${matchBooking.customerName} (${matchBooking.pickupDate} to ${matchBooking.returnDueDate})`}
                              className={`w-full h-7 mx-0.5 rounded text-[9px] font-bold text-white flex items-center justify-center shadow-xs overflow-hidden ${
                                matchBooking.status === "OUT_ON_RENT"
                                  ? "bg-purple-600"
                                  : "bg-amber-600"
                              }`}
                            >
                              {d === parseInt(matchBooking.pickupDate.split("-")[2]) ? (
                                <span className="truncate px-1">{matchBooking.customerName}</span>
                              ) : (
                                "•"
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
