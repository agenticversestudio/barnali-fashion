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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8C6F3B] font-semibold uppercase tracking-wider mb-1">
            <CalendarDays className="w-4 h-4 text-[#4B1835]" />
            <span>Operational Schedule &amp; Buffer Management</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#27222A]">Availability Calendar</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Visualize reserved dates, active rentals, and post-event laundry buffers across physical units.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 bg-white border border-[#EFE9DD] rounded-xl hover:bg-[#F3EFE7] text-gray-700">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-xs text-[#4B1835] bg-[#FAF5EB] px-3 py-1.5 rounded-xl border border-[#E8DFD1]">
            {selectedMonth}
          </span>
          <button className="p-2 bg-white border border-[#EFE9DD] rounded-xl hover:bg-[#F3EFE7] text-gray-700">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend & Instructions */}
      <div className="bg-[#FAF5EB] p-4 rounded-2xl border border-[#E8DFD1] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-gray-700">
            <span className="w-3 h-3 rounded-sm bg-purple-600"></span> Active Out on Rent
          </span>
          <span className="flex items-center gap-1.5 font-medium text-gray-700">
            <span className="w-3 h-3 rounded-sm bg-amber-500"></span> Confirmed Reservation
          </span>
          <span className="flex items-center gap-1.5 font-medium text-gray-700">
            <span className="w-3 h-3 rounded-sm bg-cyan-400"></span> 24h Cleaning Buffer
          </span>
        </div>
        <div className="text-[11px] text-gray-500 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-[#B89558]" />
          <span>Asia/Kolkata Business Hours (9:30 AM – 8:30 PM)</span>
        </div>
      </div>

      {/* Interactive Gantt / Timeline Matrix */}
      <div className="bg-white rounded-2xl border border-[#EFE9DD] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Days Header */}
            <div className="grid grid-cols-31 bg-[#FAF5EB] border-b border-[#EFE9DD] text-[10px] font-bold text-gray-600">
              <div className="p-2 border-r border-[#EFE9DD] w-48 shrink-0 font-bold text-[#4B1835]">
                Physical SKU
              </div>
              {daysInMonth.map((d) => (
                <div
                  key={d}
                  className={`p-2 text-center border-r border-[#EFE9DD] ${
                    d === 8 ? "bg-[#4B1835] text-[#D4B67F] font-bold" : ""
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
