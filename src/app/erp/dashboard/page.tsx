"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Plus,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
  ChevronRight,
  Info,
  Sparkles,
  Shirt,
  DollarSign,
  PackageCheck,
  RotateCcw,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Booking, GarmentUnit } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [garments, setGarments] = useState<GarmentUnit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Booking | null>(null);

  useEffect(() => {
    setGarments(DataStore.getGarments());
    setBookings(DataStore.getBookings());
  }, []);

  const alerts = DataStore.getDeliveryAlerts("2026-11-08");

  // Stock KPI counts for 6 exact states
  const countAvailable = garments.filter((g) => g.status === "AVAILABLE").length;
  const countBooked = garments.filter(
    (g) => g.status === "BOOKED" || g.status === "RESERVED" || g.status === "PREPARING"
  ).length;
  const countOutOnRent = garments.filter(
    (g) => g.status === "OUT_ON_RENT" || g.status === "RENTED"
  ).length;
  const countCleaning = garments.filter(
    (g) =>
      g.status === "RETURNED_CLEANING" ||
      g.status === "RETURN_RECEIVED" ||
      g.status === "IN_LAUNDRY"
  ).length;
  const countDamaged = garments.filter(
    (g) =>
      g.status === "DAMAGED_REPAIR" ||
      g.status === "UNDER_REPAIR" ||
      g.status === "REPAIR_PENDING"
  ).length;
  const countUnavailable = garments.filter(
    (g) => g.status === "UNAVAILABLE" || g.status === "RETIRED"
  ).length;

  // 4 Top Mobile Action KPIs
  const todaysPickupsCount = bookings.filter(
    (b) =>
      b.pickupDate === "2026-11-08" ||
      b.status === "PICKUP_PENDING" ||
      (b.status === "CONFIRMED" && b.pickupDate <= "2026-11-08")
  ).length;

  const overdueReturnsCount = alerts.overdueReturns.length;
  const activeRentalsCount = countOutOnRent;
  const pendingDepositsSum = bookings
    .filter((b) => b.status === "OUT_ON_RENT" || b.status === "CONFIRMED")
    .reduce((sum, b) => sum + (b.securityDepositTotal || 3000), 0);

  // Calendar strip dates
  const calendarDays = [
    { day: 5, weekday: "Thu", bookings: [{ code: "SH-001", customer: "Rajesh M." }] },
    { day: 6, weekday: "Fri", bookings: [{ code: "LF-001", customer: "Sunita P." }] },
    { day: 7, weekday: "Sat", bookings: [{ code: "IW-001", customer: "Amit P." }] },
    { day: 8, weekday: "Sun", isToday: true, bookings: [{ code: "IW-001", customer: "Amit P." }] },
    { day: 9, weekday: "Mon", bookings: [{ code: "SH-001", customer: "Rajesh M." }] },
    { day: 10, weekday: "Tue", bookings: [{ code: "LF-001", customer: "Sunita P." }] },
    { day: 11, weekday: "Wed", alert: "3d", bookings: [{ code: "GW-001", customer: "Priyanka D." }] },
    { day: 12, weekday: "Thu", alert: "4d", bookings: [{ code: "LF-002", customer: "Sunita P." }] },
    { day: 13, weekday: "Fri", bookings: [{ code: "SR-001", customer: "Mehendi" }] },
    { day: 14, weekday: "Sat", bookings: [{ code: "LF-002", customer: "Reception" }] },
  ];

  // Quick 1-tap action handler
  const handleAction = (type: "handover" | "return" | "care", id?: string) => {
    if (type === "handover") {
      router.push(`/erp/bookings?tab=active&orderId=${id || ""}`);
    } else if (type === "return") {
      router.push(`/erp/bookings?action=return&orderId=${id || ""}`);
    } else {
      router.push(`/erp/operations/laundry`);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* ========================================================= */}
      {/* DESKTOP HEADER (hidden on mobile)                         */}
      {/* ========================================================= */}
      <div className="hidden md:flex sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Action-first overview of upcoming handovers, overdue returns, and studio alerts.
          </p>
        </div>

        <Link
          href="/erp/bookings?new=1"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#6B1D2F] hover:bg-[#551624] text-white text-xs font-medium rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Order</span>
        </Link>
      </div>

      {/* ========================================================= */}
      {/* MOBILE 2x2 COMPACT KPI GRID (< 768px)                     */}
      {/* ========================================================= */}
      <div className="block md:hidden">
        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Today's Pickups */}
          <Link
            href="/erp/bookings?filter=today"
            className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs active:bg-slate-50 transition-colors"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-medium tracking-tight">Today&apos;s Pickups</span>
              <PackageCheck className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">{todaysPickupsCount}</div>
            <div className="text-[10px] text-blue-600 font-medium mt-0.5 flex items-center gap-0.5">
              <span>Ready for delivery</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </div>
          </Link>

          {/* Card 2: Overdue Returns (Alert Red) */}
          <Link
            href="/erp/bookings?filter=overdue"
            className={`p-3 rounded-xl border shadow-2xs active:opacity-90 transition-colors ${
              overdueReturnsCount > 0
                ? "bg-rose-50/70 border-rose-200 text-rose-900"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-rose-700">Overdue Returns</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-xl font-bold text-rose-700 mt-1">{overdueReturnsCount}</div>
            <div className="text-[10px] text-rose-600 font-medium mt-0.5 flex items-center gap-0.5">
              <span>15% late fee active</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </div>
          </Link>

          {/* Card 3: Active Rentals */}
          <Link
            href="/erp/inventory?status=OUT_ON_RENT"
            className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs active:bg-slate-50 transition-colors"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-medium tracking-tight">Active Rentals</span>
              <Shirt className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">{activeRentalsCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Out with clients</div>
          </Link>

          {/* Card 4: Pending Deposits */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-medium tracking-tight">Pending Deposits</span>
              <DollarSign className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {formatINR(pendingDepositsSum)}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
              Held in security pool
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DESKTOP STOCK KPI SUMMARY STRIP (>= 768px)                */}
      {/* ========================================================= */}
      <div className="hidden md:block bg-white border border-[#E2E8F0] rounded-xl p-4 md:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="text-xs font-semibold text-slate-900">Costume Stock Summary</div>
          <Link
            href="/erp/inventory"
            className="text-[11px] font-medium text-[#6B1D2F] hover:underline flex items-center gap-1"
          >
            <span>View all {garments.length} pieces</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/erp/inventory?status=AVAILABLE"
            className="p-3 rounded-lg bg-slate-50/70 hover:bg-slate-100/70 transition-colors group"
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Available</span>
            </div>
            <div className="text-xl font-semibold text-slate-900 mt-1">{countAvailable}</div>
          </Link>

          <Link
            href="/erp/inventory?status=BOOKED"
            className="p-3 rounded-lg bg-slate-50/70 hover:bg-slate-100/70 transition-colors group"
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Booked</span>
            </div>
            <div className="text-xl font-semibold text-slate-900 mt-1">{countBooked}</div>
          </Link>

          <Link
            href="/erp/inventory?status=OUT_ON_RENT"
            className="p-3 rounded-lg bg-slate-50/70 hover:bg-slate-100/70 transition-colors group"
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Out on rent</span>
            </div>
            <div className="text-xl font-semibold text-slate-900 mt-1">{countOutOnRent}</div>
          </Link>

          <Link
            href="/erp/operations/laundry"
            className="p-3 rounded-lg bg-slate-50/70 hover:bg-slate-100/70 transition-colors group"
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span>Cleaning</span>
            </div>
            <div className="text-xl font-semibold text-slate-900 mt-1">{countCleaning}</div>
          </Link>

          <Link
            href="/erp/operations/laundry"
            className="p-3 rounded-lg bg-slate-50/70 hover:bg-slate-100/70 transition-colors group"
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>In repair</span>
            </div>
            <div className="text-xl font-semibold text-slate-900 mt-1">{countDamaged}</div>
          </Link>

          <Link
            href="/erp/inventory?status=UNAVAILABLE"
            className="p-3 rounded-lg bg-slate-50/70 hover:bg-slate-100/70 transition-colors group"
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>Unavailable</span>
            </div>
            <div className="text-xl font-semibold text-slate-900 mt-1">{countUnavailable}</div>
          </Link>
        </div>
      </div>

      {/* ========================================================= */}
      {/* "ACTION REQUIRED TODAY" LIST                              */}
      {/* ========================================================= */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 md:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
              Action Required Today (Bargarh Studio)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Sun, 08 Nov</span>
        </div>

        <div className="space-y-2">
          {/* Overdue Return Action Row */}
          {alerts.overdueReturns.length > 0 && (
            <div className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-slate-900">
                    {alerts.overdueReturns[0].customerName}
                  </span>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                    {alerts.overdueReturns[0].calculatedLateDays}d overdue
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 truncate mt-0.5">
                  Costume <span className="font-mono font-bold text-[#6B1D2F]">{alerts.overdueReturns[0].costumeCode}</span> · 15% Late Fee: {formatINR(alerts.overdueReturns[0].calculatedLateFee)}
                </div>
              </div>

              <button
                onClick={() => handleAction("return", alerts.overdueReturns[0].id)}
                className="shrink-0 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg shadow-2xs text-[11px] transition-colors"
              >
                Return
              </button>
            </div>
          )}

          {/* Handover Ready Action Row */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-900">Amit Patel</span>
                <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded">
                  Handover Due
                </span>
              </div>
              <div className="text-[11px] text-slate-600 truncate mt-0.5">
                Piece <span className="font-mono font-bold text-[#6B1D2F]">IW-001</span> · Indo-Western Royal Navy · Bal: ₹2,500
              </div>
            </div>

            <button
              onClick={() => handleAction("handover", "BF-BK-2026-084")}
              className="shrink-0 px-3 py-1.5 bg-[#6B1D2F] hover:bg-[#551624] text-white font-medium rounded-lg shadow-2xs text-[11px] transition-colors"
            >
              Handover
            </button>
          </div>

          {/* Care / Tailoring Follow-up Action Row */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-900">Master Salim Tailoring</span>
                <span className="text-[10px] font-medium text-purple-800 bg-purple-50 border border-purple-200/60 px-1.5 py-0.2 rounded">
                  Fitting Ready
                </span>
              </div>
              <div className="text-[11px] text-slate-600 truncate mt-0.5">
                Piece <span className="font-mono font-bold text-[#6B1D2F]">SH-001</span> · Sherwani Chest Alteration · Due: 09 Nov
              </div>
            </div>

            <button
              onClick={() => handleAction("care")}
              className="shrink-0 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg text-[11px] transition-colors"
            >
              Mark Rcv
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4-DAY & 3-DAY DELIVERY ALERTS                             */}
      {/* ========================================================= */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <div className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
            Delivery Alarms ({alerts.alerts4Days.length + alerts.alerts3Days.length})
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Bargarh Studio dispatch</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {/* 4-Day Alarm Row */}
          {alerts.alerts4Days.map((alert) => (
            <div
              key={alert.id}
              className="bg-white border border-[#E2E8F0] hover:border-slate-300 rounded-xl p-3 shadow-2xs transition-colors flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-xs shrink-0">
                  4D
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-900 truncate">
                      {alert.customerName}
                    </span>
                    <span className="text-[9px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                      Trial
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    SKU <span className="font-mono font-medium text-slate-700">{alert.costumeCode}</span> · Due {alert.pickupDate}
                  </div>
                </div>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setSelectedAlert(alert)}
                  className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                >
                  Details
                </button>
                <a
                  href={`https://wa.me/91${alert.customerPhone}?text=Namaste%20${encodeURIComponent(
                    alert.customerName
                  )},%20Barnali%20Fashion%20se%20aapka%20costume%20${alert.costumeCode}%20trial%20ready%20hai.`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-emerald-200/60 transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
                <a
                  href={`tel:+91${alert.customerPhone}`}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                  title="Call"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}

          {/* 3-Day Alarm Row */}
          {alerts.alerts3Days.map((alert) => (
            <div
              key={alert.id}
              className="bg-white border border-[#E2E8F0] hover:border-slate-300 rounded-xl p-3 shadow-2xs transition-colors flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                  3D
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-900 truncate">
                      {alert.customerName}
                    </span>
                    <span className="text-[9px] font-medium text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60">
                      Packing
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    SKU <span className="font-mono font-medium text-slate-700">{alert.costumeCode}</span> · Due {alert.pickupDate}
                  </div>
                </div>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setSelectedAlert(alert)}
                  className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                >
                  Details
                </button>
                <a
                  href={`https://wa.me/91${alert.customerPhone}?text=Namaste%20${encodeURIComponent(
                    alert.customerName
                  )},%20Barnali%20Fashion%20se%20aapka%20costume%20${alert.costumeCode}%20packing%20ready%20hai.`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-emerald-200/60 transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
                <a
                  href={`tel:+91${alert.customerPhone}`}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                  title="Call"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 10-DAY BOOKING HORIZON (COMPACT STRIP)                    */}
      {/* ========================================================= */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 md:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
              10-Day Booking Horizon
            </span>
          </div>
          <Link
            href="/erp/calendar"
            className="text-[11px] font-medium text-[#6B1D2F] hover:underline flex items-center gap-0.5"
          >
            <span>Full Calendar</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {calendarDays.map((cd) => (
            <div
              key={cd.day}
              className={`p-2 rounded-lg border text-center transition-colors ${
                cd.isToday
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : cd.alert === "4d"
                  ? "bg-amber-50/60 border-amber-200"
                  : cd.alert === "3d"
                  ? "bg-blue-50/60 border-blue-200"
                  : "bg-slate-50/60 border-slate-200"
              }`}
            >
              <div
                className={`text-[9px] font-medium ${
                  cd.isToday ? "text-slate-300" : "text-slate-400"
                }`}
              >
                {cd.weekday}
              </div>
              <div
                className={`text-sm font-bold mt-0.5 ${
                  cd.isToday ? "text-white" : "text-slate-900"
                }`}
              >
                {cd.day}
              </div>

              <div className="mt-1 space-y-0.5">
                {cd.bookings.map((b, i) => (
                  <div
                    key={i}
                    className={`text-[8px] font-mono font-medium py-0.5 px-0.5 rounded truncate ${
                      cd.isToday
                        ? "bg-white/20 text-white"
                        : "bg-white border border-slate-200 text-slate-700"
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

      {/* ========================================================= */}
      {/* FULL DETAILS BOTTOM SHEET / MODAL                         */}
      {/* ========================================================= */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-4 sm:p-6 text-xs animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Grab handle for mobile */}
            <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-900">Delivery Details</span>
                <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  {selectedAlert.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Customer</div>
                <div className="text-xs font-semibold text-slate-900">
                  {selectedAlert.customerName}
                </div>
                <div className="text-[11px] text-slate-600 font-mono">
                  +91 {selectedAlert.customerPhone}
                </div>
                {selectedAlert.customerAddress && (
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {selectedAlert.customerAddress}
                  </div>
                )}
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Costume Item</div>
                <div className="font-medium text-slate-900">
                  <span className="font-mono text-[#6B1D2F] font-bold">
                    {selectedAlert.costumeCode}
                  </span>{" "}
                  — {selectedAlert.items[0]?.productName}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Delivery: <strong>{selectedAlert.pickupDate}</strong> · Return:{" "}
                  <strong>{selectedAlert.returnDueDate}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                  <div className="text-[10px] text-slate-400">Advance Paid</div>
                  <div className="font-semibold text-emerald-700">
                    {formatINR(selectedAlert.advancePaid)}
                  </div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                  <div className="text-[10px] text-slate-400">Balance Due</div>
                  <div className="font-semibold text-slate-900">
                    {formatINR(selectedAlert.remainingRentalDue || 0)}
                  </div>
                </div>
              </div>

              {selectedAlert.notes && (
                <div className="p-2 bg-amber-50/60 rounded-lg border border-amber-200 text-amber-900 text-[11px]">
                  {selectedAlert.notes}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <a
                  href={`https://wa.me/91${selectedAlert.customerPhone}?text=Namaste%20${encodeURIComponent(
                    selectedAlert.customerName
                  )},%20Barnali%20Fashion%20se%20aapka%20costume%20${selectedAlert.costumeCode}%20ready%20hai.`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-[#6B1D2F] hover:bg-[#551624] text-white font-medium rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Send WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
