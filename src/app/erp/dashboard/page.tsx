"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shirt,
  CalendarCheck,
  AlertCircle,
  Plus,
  Phone,
  MessageCircle,
  Clock,
  Sparkles,
  RotateCcw,
  PackageCheck,
  CheckCircle2,
  CalendarDays,
  ArrowRight,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Booking, GarmentUnit } from "@/types";

export default function DashboardPage() {
  const [garments, setGarments] = useState<GarmentUnit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("November 2026");

  useEffect(() => {
    setGarments(DataStore.getGarments());
    setBookings(DataStore.getBookings());
  }, []);

  const alerts = DataStore.getDeliveryAlerts("2026-11-08");

  // Status Counts for exact 6 states
  const countAvailable = garments.filter((g) => g.status === "AVAILABLE").length;
  const countBooked = garments.filter((g) => g.status === "BOOKED" || g.status === "RESERVED" || g.status === "PREPARING").length;
  const countOutOnRent = garments.filter((g) => g.status === "OUT_ON_RENT" || g.status === "RENTED").length;
  const countCleaning = garments.filter(
    (g) => g.status === "RETURNED_CLEANING" || g.status === "RETURN_RECEIVED" || g.status === "IN_LAUNDRY"
  ).length;
  const countDamaged = garments.filter(
    (g) => g.status === "DAMAGED_REPAIR" || g.status === "UNDER_REPAIR" || g.status === "REPAIR_PENDING"
  ).length;
  const countUnavailable = garments.filter((g) => g.status === "UNAVAILABLE" || g.status === "RETIRED").length;

  // Calendar dates mock with costume codes mapped
  const calendarDays = [
    { day: 5, weekday: "Thu", bookings: [{ code: "SH-001", customer: "Rajesh M.", status: "OUT_ON_RENT" }] },
    { day: 6, weekday: "Fri", bookings: [{ code: "LF-001", customer: "Sunita P.", status: "OUT_ON_RENT" }] },
    { day: 7, weekday: "Sat", bookings: [{ code: "IW-001", customer: "Amit P.", status: "RETURNED_CLEANING" }] },
    { day: 8, weekday: "Sun", isToday: true, bookings: [{ code: "IW-001", customer: "Amit P.", status: "PICKUP" }] },
    { day: 9, weekday: "Mon", bookings: [{ code: "SH-001", customer: "Rajesh M. (Due)", status: "DUE_RETURN" }] },
    { day: 10, weekday: "Tue", bookings: [{ code: "LF-001", customer: "Sunita P. (Due)", status: "DUE_RETURN" }] },
    { day: 11, weekday: "Wed", is3DayAlert: true, bookings: [{ code: "GW-001", customer: "Priyanka D.", status: "BOOKED" }] },
    { day: 12, weekday: "Thu", is4DayAlert: true, bookings: [{ code: "LF-002", customer: "Sunita P.", status: "BOOKED" }] },
    { day: 13, weekday: "Fri", bookings: [{ code: "SR-001", customer: "Wedding Mehendi", status: "BOOKED" }] },
    { day: 14, weekday: "Sat", bookings: [{ code: "LF-002", customer: "Wedding Barat", status: "BOOKED" }] },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Store Header */}
      <div className="bg-gradient-to-r from-[#4B1835] via-[#5C1F42] to-[#3B1129] rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-[#D4B67F]/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold tracking-widest text-[#D4B67F] uppercase bg-black/30 px-2.5 py-0.5 rounded-full border border-[#D4B67F]/30">
                Barnali Fashion — Bargarh, Odisha
              </span>
              <span className="text-xs text-[#D4B67F]/90">Ph: +91 7978256488</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-white">
              Daily Counter &amp; Delivery Alarm Board
            </h1>
            <p className="text-xs md:text-sm text-[#F7F3EC]/80 mt-1 max-w-2xl">
              Automatic 4-Day &amp; 3-Day delivery notifications, booking calendar with costume codes, and 5-step rental counter.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/erp/bookings"
              className="bg-[#D4B67F] hover:bg-[#C2A166] text-[#27222A] font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-[#27222A]" />
              <span>5-Step Counter Order</span>
            </Link>
          </div>
        </div>
      </div>

      {/* --- DELIVERY DATE ALARMS SECTION (CLIENT EXACT REQUIREMENT) --- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#8C6F3B]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#27222A]">
              Delivery Date Alarms (4 Days &amp; 3 Days Before Notifications)
            </h2>
          </div>
          <span className="text-[11px] text-gray-500 font-medium">Reference: Today (08 Nov 2026)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 4-Day Before Delivery Alert */}
          {alerts.alerts4Days.map((alert) => (
            <div
              key={alert.id}
              className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 shadow-xs relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-xs">
                    4D
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                        4 Days Before Delivery Alert
                      </span>
                      <span className="text-xs text-amber-800 font-semibold">Delivery: 12 Nov 2026</span>
                    </div>
                    <h3 className="text-base font-bold text-[#27222A] mt-1">{alert.customerName}</h3>
                    <p className="text-xs text-gray-700">
                      Costume: <strong className="text-[#4B1835]">{alert.costumeCode}</strong> — {alert.items[0]?.productName}
                    </p>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      Event Date: {alert.eventDate} ({alert.eventName}) | Advance: {formatINR(alert.advancePaid)}
                    </p>
                    <div className="mt-2 text-[11px] font-medium text-amber-950 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200">
                      🎯 <strong>Action Required:</strong> Call customer for blouse &amp; waist fitting trial before final delivery!
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3.5 pt-3 border-t border-amber-200 flex items-center justify-between gap-2">
                <div className="text-xs font-mono text-gray-700 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-700" />
                  <span>+91 {alert.customerPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/91${alert.customerPhone}?text=Namaste%20${encodeURIComponent(
                      alert.customerName
                    )},%20Barnali%20Fashion%20se%20aapka%20Costume%20${alert.costumeCode}%20trial%20ready%20hai.%20Kripya%20fitting%20ke%20liye%20aayein.`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Alert</span>
                  </a>
                  <a
                    href={`tel:+91${alert.customerPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                </div>
              </div>
            </div>
          ))}

          {/* 3-Day Before Delivery Alert */}
          {alerts.alerts3Days.map((alert) => (
            <div
              key={alert.id}
              className="bg-sky-50 border-2 border-sky-300 rounded-2xl p-4 shadow-xs relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-xs">
                    3D
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider bg-sky-200 text-sky-900 px-2 py-0.5 rounded-md">
                        3 Days Before Delivery Alert
                      </span>
                      <span className="text-xs text-sky-800 font-semibold">Delivery: 11 Nov 2026</span>
                    </div>
                    <h3 className="text-base font-bold text-[#27222A] mt-1">{alert.customerName}</h3>
                    <p className="text-xs text-gray-700">
                      Costume: <strong className="text-[#4B1835]">{alert.costumeCode}</strong> — {alert.items[0]?.productName}
                    </p>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      Event Date: {alert.eventDate} ({alert.eventName}) | Advance: {formatINR(alert.advancePaid)}
                    </p>
                    <div className="mt-2 text-[11px] font-medium text-sky-950 bg-sky-100/80 px-2.5 py-1 rounded-lg border border-sky-200">
                      📦 <strong>Action Required:</strong> Final steam pressing, quality check &amp; pack in dust bag ready for dispatch!
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3.5 pt-3 border-t border-sky-200 flex items-center justify-between gap-2">
                <div className="text-xs font-mono text-gray-700 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-sky-700" />
                  <span>+91 {alert.customerPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/91${alert.customerPhone}?text=Namaste%20${encodeURIComponent(
                      alert.customerName
                    )},%20Barnali%20Fashion%20se%20aapka%20outfit%20${alert.costumeCode}%20packed%20ready%20hai%20dispatch%20ke%20liye.`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Alert</span>
                  </a>
                  <a
                    href={`tel:+91${alert.customerPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- OVERDUE RETURN WITH 15% LATE FEE PENALTY ALERT --- */}
      {alerts.overdueReturns.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-500 text-white rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-rose-200 text-rose-900 px-2 py-0.5 rounded-md">
                    Overdue Return — 15% Late Fee Applied
                  </span>
                  <span className="text-xs font-semibold text-rose-700">
                    {alerts.overdueReturns[0].calculatedLateDays} Days Late
                  </span>
                </div>
                <h4 className="text-sm font-bold text-gray-900 mt-1">
                  {alerts.overdueReturns[0].customerName} (+91 {alerts.overdueReturns[0].customerPhone})
                </h4>
                <p className="text-xs text-gray-700">
                  Costume: <strong>{alerts.overdueReturns[0].costumeCode}</strong> | Due Date: {alerts.overdueReturns[0].returnDueDate}
                </p>
                <div className="mt-1 text-xs text-rose-900 font-semibold">
                  Late Fee: {formatINR(alerts.overdueReturns[0].calculatedLateFee)} (15% per day on rental of {formatINR(alerts.overdueReturns[0].rentalTotal)})
                  — Deducted from {formatINR(alerts.overdueReturns[0].securityDepositTotal)} Security Deposit.
                </div>
              </div>
            </div>

            <Link
              href="/erp/bookings"
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0 text-center shadow-xs"
            >
              Process Return &amp; Refund
            </Link>
          </div>
        </div>
      )}

      {/* --- 6 EXACT COSTUME STATUS CARDS --- */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#8C6F3B]">
            Costumes by Exact 6 States (Total: {garments.length} Items)
          </h2>
          <Link href="/erp/inventory" className="text-xs text-[#4B1835] hover:underline font-semibold">
            View All Stock &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/erp/inventory?status=AVAILABLE"
            className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-lg font-bold text-emerald-900">{countAvailable}</span>
            </div>
            <div className="text-xs font-bold text-emerald-900 mt-1">Available</div>
            <div className="text-[10px] text-emerald-700">Ready in Godown</div>
          </Link>

          <Link
            href="/erp/inventory?status=BOOKED"
            className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-lg font-bold text-amber-900">{countBooked}</span>
            </div>
            <div className="text-xs font-bold text-amber-900 mt-1">Booked</div>
            <div className="text-[10px] text-amber-700">Reserved for wedding</div>
          </Link>

          <Link
            href="/erp/inventory?status=OUT_ON_RENT"
            className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span className="text-lg font-bold text-blue-900">{countOutOnRent}</span>
            </div>
            <div className="text-xs font-bold text-blue-900 mt-1">Out on rent</div>
            <div className="text-[10px] text-blue-700">With customer</div>
          </Link>

          <Link
            href="/erp/operations/laundry"
            className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
              <span className="text-lg font-bold text-purple-900">{countCleaning}</span>
            </div>
            <div className="text-xs font-bold text-purple-900 mt-1">Cleaning</div>
            <div className="text-[10px] text-purple-700">Washing pending</div>
          </Link>

          <Link
            href="/erp/operations/laundry"
            className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              <span className="text-lg font-bold text-rose-900">{countDamaged}</span>
            </div>
            <div className="text-xs font-bold text-rose-900 mt-1">Damaged / Repair</div>
            <div className="text-[10px] text-rose-700">With tailor</div>
          </Link>

          <Link
            href="/erp/inventory?status=UNAVAILABLE"
            className="p-3 bg-gray-50 border border-gray-200 rounded-xl hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
              <span className="text-lg font-bold text-gray-900">{countUnavailable}</span>
            </div>
            <div className="text-xs font-bold text-gray-900 mt-1">Unavailable</div>
            <div className="text-[10px] text-gray-600">Not for rent</div>
          </Link>
        </div>
      </div>

      {/* --- CALENDAR WITH COSTUME CODES (CLIENT REQUIREMENT) --- */}
      <div className="bg-white p-5 rounded-2xl border border-[#EFE9DD] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EFE9DD]">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#8C6F3B]" />
            <div>
              <h2 className="text-base font-serif font-bold text-[#27222A]">
                Costume Booking Calendar ({selectedMonth})
              </h2>
              <p className="text-xs text-gray-500">
                All booking dates mapped with Costume IDs (Anti-double-booking view)
              </p>
            </div>
          </div>

          <Link
            href="/erp/calendar"
            className="text-xs font-bold text-[#4B1835] hover:underline flex items-center gap-1"
          >
            <span>Full Month Grid</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 10-Day Strip showing Costume Codes */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {calendarDays.map((cd) => (
            <div
              key={cd.day}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                cd.isToday
                  ? "bg-[#4B1835] text-white border-[#4B1835] shadow-xs"
                  : cd.is4DayAlert
                  ? "bg-amber-50 border-amber-300"
                  : cd.is3DayAlert
                  ? "bg-sky-50 border-sky-300"
                  : "bg-[#FBF9F5] border-[#EFE9DD]"
              }`}
            >
              <div className={`text-[10px] uppercase font-bold ${cd.isToday ? "text-[#D4B67F]" : "text-gray-500"}`}>
                {cd.weekday}
              </div>
              <div className={`text-lg font-serif font-black ${cd.isToday ? "text-white" : "text-[#27222A]"}`}>
                {cd.day}
              </div>

              {/* Badges for costume codes */}
              <div className="mt-2 space-y-1">
                {cd.bookings.map((b, i) => (
                  <div
                    key={i}
                    className={`text-[9px] font-mono font-bold py-0.5 px-1 rounded-sm truncate ${
                      cd.isToday
                        ? "bg-emerald-500 text-white"
                        : b.status === "OUT_ON_RENT"
                        ? "bg-blue-100 text-blue-900 border border-blue-200"
                        : b.status === "DUE_RETURN"
                        ? "bg-rose-100 text-rose-900 border border-rose-200"
                        : "bg-amber-100 text-amber-900 border border-amber-200"
                    }`}
                    title={`${b.code} - ${b.customer}`}
                  >
                    {b.code}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}