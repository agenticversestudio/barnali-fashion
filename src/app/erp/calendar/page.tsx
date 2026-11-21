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
  X,
  Phone,
  MessageCircle,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { Booking, GarmentUnit } from "@/types";
import { formatDate, formatINR } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function AvailabilityCalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [garments, setGarments] = useState<GarmentUnit[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("November 2026");

  // Mobile Day Selector state
  const [selectedDay, setSelectedDay] = useState<number>(8);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);

  useEffect(() => {
    setBookings(DataStore.getBookings());
    setGarments(DataStore.getGarments());
  }, []);

  // Days in November 2026 (Nov 1 to Nov 30)
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  // 7-day strip around today (Nov 5 to Nov 14)
  const weekDays = [
    { day: 5, weekday: "Thu", dateStr: "2026-11-05" },
    { day: 6, weekday: "Fri", dateStr: "2026-11-06" },
    { day: 7, weekday: "Sat", dateStr: "2026-11-07" },
    { day: 8, weekday: "Sun", dateStr: "2026-11-08", isToday: true },
    { day: 9, weekday: "Mon", dateStr: "2026-11-09" },
    { day: 10, weekday: "Tue", dateStr: "2026-11-10" },
    { day: 11, weekday: "Wed", dateStr: "2026-11-11" },
    { day: 12, weekday: "Thu", dateStr: "2026-11-12" },
    { day: 13, weekday: "Fri", dateStr: "2026-11-13" },
    { day: 14, weekday: "Sat", dateStr: "2026-11-14" },
  ];

  const selectedDateStr = `2026-11-${String(selectedDay).padStart(2, "0")}`;

  // Find all bookings active on selectedDay
  const activeBookingsForSelectedDay = bookings.filter((b) => {
    return (
      selectedDateStr >= b.pickupDate &&
      selectedDateStr <= b.returnDueDate &&
      b.status !== "CANCELLED"
    );
  });

  return (
    <div className="space-y-3.5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
            Calendar
          </h1>
          <p className="text-[11px] md:text-xs text-slate-500 mt-0.5">
            Availability matrix across physical items with automatic post-event buffer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-1.5 md:p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-xs text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            {selectedMonth}
          </span>
          <button className="p-1.5 md:p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend & Instructions */}
      <div className="bg-white p-3 md:p-4 rounded-xl border border-[#E6E4DF] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-3 md:gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 font-semibold text-slate-700 text-[11px] md:text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Out on Rent
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700 text-[11px] md:text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Confirmed Reservation
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700 text-[11px] md:text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Cleaning Buffer
          </span>
        </div>
        <div className="text-[10px] md:text-[11px] text-slate-500 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Bargarh Studio (9:30 AM – 8:30 PM IST)</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE AGENDA & DAY-STRIP VIEW (< 768px)                  */}
      {/* ========================================================= */}
      <div className="block md:hidden space-y-3">
        {/* Horizontal Scrollable Day Strip */}
        <div className="bg-white p-2.5 rounded-xl border border-[#E6E4DF] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
            {weekDays.map((wd) => {
              const isSelected = selectedDay === wd.day;
              // Check if any bookings on this day
              const count = bookings.filter(
                (b) =>
                  wd.dateStr >= b.pickupDate &&
                  wd.dateStr <= b.returnDueDate &&
                  b.status !== "CANCELLED"
              ).length;

              return (
                <button
                  key={wd.day}
                  onClick={() => setSelectedDay(wd.day)}
                  className={`min-w-[52px] py-2 px-1.5 rounded-xl text-center transition-all ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : wd.isToday
                      ? "bg-[#6B1D2F]/10 text-[#6B1D2F] border border-[#6B1D2F]/30"
                      : "bg-[#FAF9F6] text-slate-700 hover:bg-slate-100 border border-[#EFECE6]"
                  }`}
                >
                  <div
                    className={`text-[9px] uppercase font-semibold ${
                      isSelected ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {wd.weekday}
                  </div>
                  <div className="text-sm font-bold mt-0.5">{wd.day}</div>
                  <div className="mt-1 flex items-center justify-center gap-0.5">
                    {count > 0 ? (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? "bg-amber-400" : "bg-[#6B1D2F]"
                        }`}
                      />
                    ) : (
                      <span className="w-1.5 h-1.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Schedule List */}
        <div className="bg-white rounded-xl border border-[#E6E4DF] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#EFECE6] text-xs">
            <span className="font-semibold text-slate-900">
              Schedule for {selectedDay} Nov 2026 {selectedDay === 8 && "(Today)"}
            </span>
            <span className="text-[11px] text-slate-500">
              {activeBookingsForSelectedDay.length} items scheduled
            </span>
          </div>

          <div className="space-y-2.5">
            {activeBookingsForSelectedDay.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No active bookings or handovers on this date. Studio inventory is fully available.
              </div>
            ) : (
              activeBookingsForSelectedDay.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBookingDetails(b)}
                  className="p-3 bg-[#FAF9F6] hover:bg-slate-100/80 rounded-xl border border-[#EFECE6] transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#6B1D2F] bg-rose-50/60 px-1.5 py-0.2 rounded border border-rose-200/60">
                        {b.costumeCode || b.items[0]?.garmentUnitId}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="text-slate-900 font-semibold mt-1">
                      {b.items[0]?.productName}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Client: <strong className="text-slate-900">{b.customerName}</strong> · Pickup: {b.pickupDate} &rarr; Return:{" "}
                      {b.returnDueDate}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 30-DAY TIMELINE MATRIX (MD+ & DESKTOP WITH STICKY SKU)     */}
      {/* ========================================================= */}
      <div className="hidden md:block bg-white rounded-xl border border-[#E6E4DF] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1400px]">
            {/* Days Header with Sticky Left Column */}
            <div className="flex bg-[#FAF9F6] border-b border-[#E6E4DF] text-[10px] font-semibold text-slate-600">
              <div className="sticky left-0 z-20 bg-[#FAF9F6] p-2.5 border-r border-[#E6E4DF] w-52 shrink-0 font-semibold text-slate-800 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                Piece SKU &amp; Garment
              </div>
              <div className="flex flex-1">
                {daysInMonth.map((d) => (
                  <div
                    key={d}
                    className={`min-w-[40px] flex-1 p-2 text-center border-r border-[#EFECE6] ${
                      d === 8 ? "bg-slate-900 text-white font-bold" : ""
                    }`}
                  >
                    {d}
                    {d === 8 && <div className="text-[8px] uppercase tracking-tighter">Today</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Garment Rows with Sticky SKU Column */}
            <div className="divide-y divide-[#EFECE6] text-xs">
              {garments.slice(0, 12).map((g) => {
                const gBookings = bookings.filter(
                  (b) =>
                    b.items.some((item) => item.garmentUnitId === g.id) && b.status !== "CANCELLED"
                );

                return (
                  <div key={g.id} className="flex items-center hover:bg-slate-50/60 transition-colors">
                    {/* Sticky SKU Label */}
                    <div className="sticky left-0 z-10 bg-white p-2.5 border-r border-[#E6E4DF] w-52 shrink-0 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                      <Link
                        href={`/erp/inventory?sku=${g.id}`}
                        className="font-mono font-bold text-xs text-[#6B1D2F] hover:underline"
                      >
                        {g.id}
                      </Link>
                      <div className="text-[11px] text-slate-700 font-medium line-clamp-1 mt-0.5">{g.productName}</div>
                    </div>

                    {/* Day cells with min-w-[40px] */}
                    <div className="flex flex-1">
                      {daysInMonth.map((d) => {
                        const dayDateStr = `2026-11-${String(d).padStart(2, "0")}`;
                        const matchBooking = gBookings.find(
                          (b) => dayDateStr >= b.pickupDate && dayDateStr <= b.returnDueDate
                        );

                        return (
                          <div
                            key={d}
                            className={`min-w-[40px] flex-1 h-12 border-r border-[#EFECE6] relative flex items-center justify-center ${
                              d === 8 ? "bg-amber-50/40" : ""
                            }`}
                          >
                            {matchBooking && (
                              <div
                                onClick={() => setSelectedBookingDetails(matchBooking)}
                                title={`${matchBooking.customerName} (${matchBooking.pickupDate} to ${matchBooking.returnDueDate})`}
                                className={`w-full h-7 mx-0.5 rounded text-[9px] font-semibold text-white flex items-center justify-center shadow-2xs overflow-hidden cursor-pointer transition-transform hover:scale-102 ${
                                  matchBooking.status === "OUT_ON_RENT"
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "bg-amber-600 hover:bg-amber-700"
                                }`}
                              >
                                {d === parseInt(matchBooking.pickupDate.split("-")[2]) ? (
                                  <span className="truncate px-1 font-bold">{matchBooking.customerName}</span>
                                ) : (
                                  "•"
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FULL DETAILS BOTTOM SHEET / MODAL                         */}
      {/* ========================================================= */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-4 sm:p-6 text-xs animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-900">
                  {selectedBookingDetails.id}
                </span>
                <StatusBadge status={selectedBookingDetails.status} />
              </div>
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Customer</span>
                <div className="text-xs font-semibold text-slate-900">
                  {selectedBookingDetails.customerName}
                </div>
                <div className="text-[11px] text-slate-600 font-mono">
                  +91 {selectedBookingDetails.customerPhone}
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Costume</span>
                <div className="font-medium text-slate-900">
                  <span className="font-mono text-[#6B1D2F] font-bold">
                    {selectedBookingDetails.costumeCode ||
                      selectedBookingDetails.items[0]?.garmentUnitId}
                  </span>{" "}
                  — {selectedBookingDetails.items[0]?.productName}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Pickup: <strong>{selectedBookingDetails.pickupDate}</strong> · Return Due:{" "}
                  <strong>{selectedBookingDetails.returnDueDate}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-[10px] text-slate-400">Advance Paid</span>
                  <div className="font-semibold text-emerald-700">
                    {formatINR(selectedBookingDetails.advancePaid)}
                  </div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-[10px] text-slate-400">Security Deposit</span>
                  <div className="font-semibold text-slate-900">
                    {formatINR(selectedBookingDetails.securityDepositTotal)}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingDetails(null)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <Link
                  href={`/erp/bookings?orderId=${selectedBookingDetails.id}`}
                  className="px-4 py-1.5 bg-[#6B1D2F] hover:bg-[#551624] text-white font-medium rounded-lg shadow-xs"
                >
                  Open in Orders
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
