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
  Bell,
  MapPin,
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

  // Calendar dates mock with costume codes mapped
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
    <div className="space-y-3.5 md:space-y-6">
      {/* Desktop Header */}
      <div className="hidden md:flex sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Alerts &amp; Today&apos;s Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Delivery alarms 4 days &amp; 3 days before delivery + today&apos;s pending handovers.
          </p>
        </div>

        <Link
          href="/erp/bookings?new=1"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#6B1D2F] hover:bg-[#551624] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Booking</span>
        </Link>
      </div>

      {/* ========================================================= */}
      {/* 1. TOP PRIORITY: DELIVERY ALERTS (4D & 3D BEFORE DELIVERY) */}
      {/* ========================================================= */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-[#6B1D2F]" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Delivery Date Alerts ({alerts.alerts4Days.length + alerts.alerts3Days.length})
            </h2>
          </div>
          <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full font-semibold">
            Action: Call / WhatsApp Customer
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {/* 4-Day Before Delivery Alert */}
          {alerts.alerts4Days.map((alert) => (
            <div
              key={alert.id}
              className="bg-white border-2 border-amber-200/80 hover:border-amber-300 rounded-xl p-3.5 shadow-2xs transition-colors flex flex-col justify-between gap-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="w-7 h-7 rounded-lg bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      4D
                    </span>
                    <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                      {alert.costumeCode}
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                      Trial Due: 4 Days Before
                    </span>
                  </div>

                  <div className="text-sm font-bold text-slate-900 mt-1.5">
                    {alert.customerName}
                  </div>
                  <div className="text-xs text-slate-600 font-medium truncate mt-0.5">
                    {alert.items[0]?.productName} ({alert.items[0]?.size || "Standard"})
                  </div>

                  {/* Customer Address & Delivery Date */}
                  <div className="mt-2 space-y-1 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-[#6B1D2F] shrink-0" />
                      <span>
                        Delivery Date:{" "}
                        <strong className="text-slate-900">{alert.pickupDate}</strong>
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">
                        {alert.customerAddress || "Near LIC Office Road, Bargarh"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2">
                <button
                  onClick={() => setSelectedAlert(alert)}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg transition-colors"
                >
                  Full Details
                </button>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/91${alert.customerPhone}?text=Namaste%20${encodeURIComponent(
                      alert.customerName
                    )},%20Barnali%20Fashion%20Bargarh%20se%20aapka%20costume%20${alert.costumeCode}%20trial%20ready%20hai.%20Delivery%20date:%20${alert.pickupDate}.`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={`tel:+91${alert.customerPhone}`}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}

          {/* 3-Day Before Delivery Alert */}
          {alerts.alerts3Days.map((alert) => (
            <div
              key={alert.id}
              className="bg-white border-2 border-blue-200/80 hover:border-blue-300 rounded-xl p-3.5 shadow-2xs transition-colors flex flex-col justify-between gap-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      3D
                    </span>
                    <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                      {alert.costumeCode}
                    </span>
                    <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                      Packing Ready: 3 Days Before
                    </span>
                  </div>

                  <div className="text-sm font-bold text-slate-900 mt-1.5">
                    {alert.customerName}
                  </div>
                  <div className="text-xs text-slate-600 font-medium truncate mt-0.5">
                    {alert.items[0]?.productName} ({alert.items[0]?.size || "Standard"})
                  </div>

                  {/* Customer Address & Delivery Date */}
                  <div className="mt-2 space-y-1 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-[#6B1D2F] shrink-0" />
                      <span>
                        Delivery Date:{" "}
                        <strong className="text-slate-900">{alert.pickupDate}</strong>
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">
                        {alert.customerAddress || "Bargarh Road, Bargarh"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2">
                <button
                  onClick={() => setSelectedAlert(alert)}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg transition-colors"
                >
                  Full Details
                </button>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/91${alert.customerPhone}?text=Namaste%20${encodeURIComponent(
                      alert.customerName
                    )},%20Barnali%20Fashion%20se%20aapka%20costume%20${alert.costumeCode}%20packing%20ready%20hai.%20Delivery%20date:%20${alert.pickupDate}.`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={`tel:+91${alert.customerPhone}`}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. TODAY'S PENDING WORK (OVERDUE RETURNS & HANDOVERS)      */}
      {/* ========================================================= */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 md:p-5 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Today&apos;s Pending Actions (Bargarh Studio)
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Sun, 08 Nov</span>
        </div>

        <div className="space-y-2">
          {/* Overdue Return Action Row */}
          {alerts.overdueReturns.length > 0 && (
            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-900">
                    {alerts.overdueReturns[0].customerName}
                  </span>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                    {alerts.overdueReturns[0].calculatedLateDays}d overdue
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 truncate mt-0.5">
                  Costume ID:{" "}
                  <strong className="font-mono text-[#6B1D2F]">
                    {alerts.overdueReturns[0].costumeCode}
                  </strong>{" "}
                  · 15% Late Fee:{" "}
                  <strong className="text-rose-700">
                    {formatINR(alerts.overdueReturns[0].calculatedLateFee)}
                  </strong>
                </div>
              </div>

              <button
                onClick={() => handleAction("return", alerts.overdueReturns[0].id)}
                className="shrink-0 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-2xs text-[11px] transition-colors"
              >
                Return &amp; Refund
              </button>
            </div>
          )}

          {/* Handover Ready Action Row */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-900">Amit Patel</span>
                <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded">
                  Handover Due
                </span>
              </div>
              <div className="text-[11px] text-slate-600 truncate mt-0.5">
                Costume ID: <strong className="font-mono text-[#6B1D2F]">IW-001</strong> ·
                Indo-Western Royal Navy · Balance to Collect: <strong>₹2,500</strong>
              </div>
            </div>

            <button
              onClick={() => handleAction("handover", "BF-BK-2026-084")}
              className="shrink-0 px-3 py-1.5 bg-[#6B1D2F] hover:bg-[#551624] text-white font-bold rounded-lg shadow-2xs text-[11px] transition-colors"
            >
              Handover
            </button>
          </div>

          {/* Care / Tailoring Follow-up Action Row */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-900">Master Salim (Tailor)</span>
                <span className="text-[10px] font-medium text-purple-800 bg-purple-50 border border-purple-200/60 px-1.5 py-0.2 rounded">
                  Fitting Ready
                </span>
              </div>
              <div className="text-[11px] text-slate-600 truncate mt-0.5">
                Costume ID: <strong className="font-mono text-[#6B1D2F]">SH-001</strong> · Groom
                Sherwani Chest Alteration · Out: 08 Nov
              </div>
            </div>

            <button
              onClick={() => handleAction("care")}
              className="shrink-0 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-[11px] transition-colors"
            >
              Mark Rcv
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. CALENDAR VIEW OF BOOKED DATES WITH COSTUME CODES       */}
      {/* ========================================================= */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 md:p-5 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-slate-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Costume Code Calendar Strip
            </h2>
          </div>
          <Link
            href="/erp/calendar"
            className="text-[11px] font-semibold text-[#6B1D2F] hover:underline flex items-center gap-0.5"
          >
            <span>Full Month &rarr;</span>
          </Link>
        </div>

        {/* 10-Day Strip showing Costume Codes */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {calendarDays.map((cd) => (
            <div
              key={cd.day}
              className={`p-2 rounded-lg border text-center transition-colors ${
                cd.isToday
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : cd.alert === "4d"
                  ? "bg-amber-50/70 border-amber-300"
                  : cd.alert === "3d"
                  ? "bg-blue-50/70 border-blue-300"
                  : "bg-slate-50/70 border-slate-200"
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
                    className={`text-[8px] font-mono font-bold py-0.5 px-0.5 rounded truncate ${
                      cd.isToday
                        ? "bg-white/20 text-white"
                        : "bg-white border border-slate-200 text-[#6B1D2F]"
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
      {/* 4. STOCK SUMMARY (6 EXACT STATES WITH COLOUR DOTS)        */}
      {/* ========================================================= */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 md:p-5 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <Shirt className="w-4 h-4 text-[#6B1D2F]" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Costume Statuses (6 States)
            </span>
          </div>
          <Link
            href="/erp/inventory"
            className="text-[11px] font-semibold text-[#6B1D2F] hover:underline"
          >
            All {garments.length} Pieces &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <Link
            href="/erp/inventory?status=AVAILABLE"
            className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/60"
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Available</span>
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">{countAvailable}</div>
          </Link>

          <Link
            href="/erp/inventory?status=BOOKED"
            className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/60"
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Booked</span>
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">{countBooked}</div>
          </Link>

          <Link
            href="/erp/inventory?status=OUT_ON_RENT"
            className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/60"
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Out on rent</span>
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">{countOutOnRent}</div>
          </Link>

          <Link
            href="/erp/operations/laundry"
            className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/60"
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Cleaning</span>
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">{countCleaning}</div>
          </Link>

          <Link
            href="/erp/operations/laundry"
            className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/60"
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Damaged/Repair</span>
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">{countDamaged}</div>
          </Link>

          <Link
            href="/erp/inventory?status=UNAVAILABLE"
            className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/60"
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Unavailable</span>
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">{countUnavailable}</div>
          </Link>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FULL DETAILS BOTTOM SHEET / MODAL                         */}
      {/* ========================================================= */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-4 sm:p-6 text-xs animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-900">
                  Delivery Alert Details
                </span>
                <span className="text-[10px] font-mono font-bold bg-[#6B1D2F] text-white px-2 py-0.5 rounded">
                  {selectedAlert.costumeCode}
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
                  Mobile: +91 {selectedAlert.customerPhone}
                </div>
                {selectedAlert.customerAddress && (
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Address: {selectedAlert.customerAddress}
                  </div>
                )}
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Costume</div>
                <div className="font-medium text-slate-900">
                  <span className="font-mono text-[#6B1D2F] font-bold">
                    {selectedAlert.costumeCode}
                  </span>{" "}
                  — {selectedAlert.items[0]?.productName}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Delivery Date: <strong>{selectedAlert.pickupDate}</strong> · Return Due:{" "}
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
