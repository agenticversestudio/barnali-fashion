"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Booking, GarmentUnit } from "@/types";

export default function DashboardPage() {
  const [garments, setGarments] = useState<GarmentUnit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Booking | null>(null);

  useEffect(() => {
    setGarments(DataStore.getGarments());
    setBookings(DataStore.getBookings());
  }, []);

  const alerts = DataStore.getDeliveryAlerts("2026-11-08");

  // Status Counts for 6 exact states
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of upcoming handovers, delivery reminders, and studio availability.
          </p>
        </div>

        <Link
          href="/erp/bookings"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#6B1D2F] hover:bg-[#551624] text-white text-xs font-medium rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Order</span>
        </Link>
      </div>

      {/* --- UNIFIED STOCK KPI STRIP (SLIP & CLEAN SAAS STYLE) --- */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 md:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="text-xs font-semibold text-slate-900">Stock Summary</div>
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

      {/* --- OVERDUE RETURN ROW (IF ANY) --- */}
      {alerts.overdueReturns.length > 0 && (
        <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900">
                    {alerts.overdueReturns[0].customerName}
                  </span>
                  <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                    {alerts.overdueReturns[0].calculatedLateDays} days overdue
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Costume <span className="font-mono text-slate-700 font-medium">{alerts.overdueReturns[0].costumeCode}</span> · 15% late fee: {formatINR(alerts.overdueReturns[0].calculatedLateFee)}
                </div>
              </div>
            </div>

            <Link
              href="/erp/bookings"
              className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg transition-colors border border-rose-200"
            >
              <span>Process return</span>
            </Link>
          </div>
        </div>
      )}

      {/* --- DECLUTTERED DELIVERY ALERTS SECTION --- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">
            Upcoming Deliveries &amp; Trials
          </div>
          <span className="text-[11px] text-slate-500">
            {alerts.alerts4Days.length + alerts.alerts3Days.length} reminders pending
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* 4-Day Alert */}
          {alerts.alerts4Days.map((alert) => (
            <div
              key={alert.id}
              className="bg-white border border-[#E2E8F0] hover:border-slate-300 rounded-xl p-4 shadow-xs transition-colors flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center font-semibold text-xs shrink-0">
                    4D
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {alert.customerName}
                      </span>
                      <span className="text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                        Trial Due
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 truncate mt-0.5">
                      <span className="font-mono text-slate-800 font-medium">{alert.costumeCode}</span> · {alert.items[0]?.productName}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Delivery Date: <span className="text-slate-600 font-medium">{alert.pickupDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedAlert(alert)}
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <span>Details</span>
                  <ChevronRight className="w-3 h-3" />
                </button>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/91${alert.customerPhone}?text=Namaste%20${encodeURIComponent(
                      alert.customerName
                    )},%20Barnali%20Fashion%20se%20aapka%20costume%20${alert.costumeCode}%20trial%20ready%20hai.`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors"
                    title="Send WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                  <a
                    href={`tel:+91${alert.customerPhone}`}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
                    title="Call Customer"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}

          {/* 3-Day Alert */}
          {alerts.alerts3Days.map((alert) => (
            <div
              key={alert.id}
              className="bg-white border border-[#E2E8F0] hover:border-slate-300 rounded-xl p-4 shadow-xs transition-colors flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center font-semibold text-xs shrink-0">
                    3D
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {alert.customerName}
                      </span>
                      <span className="text-[10px] font-medium text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                        Dispatch Check
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 truncate mt-0.5">
                      <span className="font-mono text-slate-800 font-medium">{alert.costumeCode}</span> · {alert.items[0]?.productName}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Delivery Date: <span className="text-slate-600 font-medium">{alert.pickupDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedAlert(alert)}
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <span>Details</span>
                  <ChevronRight className="w-3 h-3" />
                </button>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/91${alert.customerPhone}?text=Namaste%20${encodeURIComponent(
                      alert.customerName
                    )},%20Barnali%20Fashion%20se%20aapka%20costume%20${alert.costumeCode}%20packing%20ready%20hai.`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors"
                    title="Send WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                  <a
                    href={`tel:+91${alert.customerPhone}`}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
                    title="Call Customer"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- CALENDAR HORIZON WIDGET --- */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 md:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">Booking Calendar</h2>
          </div>
          <Link
            href="/erp/calendar"
            className="text-xs font-medium text-[#6B1D2F] hover:underline flex items-center gap-1"
          >
            <span>Full schedule</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Minimalist 10-Day Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {calendarDays.map((cd) => (
            <div
              key={cd.day}
              className={`p-3 rounded-lg border text-center transition-colors ${
                cd.isToday
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : cd.alert === "4d"
                  ? "bg-amber-50/50 border-amber-200"
                  : cd.alert === "3d"
                  ? "bg-blue-50/50 border-blue-200"
                  : "bg-slate-50/60 border-slate-200"
              }`}
            >
              <div className={`text-[10px] font-medium ${cd.isToday ? "text-slate-300" : "text-slate-400"}`}>
                {cd.weekday}
              </div>
              <div className={`text-base font-semibold mt-0.5 ${cd.isToday ? "text-white" : "text-slate-900"}`}>
                {cd.day}
              </div>

              <div className="mt-2 space-y-1">
                {cd.bookings.map((b, i) => (
                  <div
                    key={i}
                    className={`text-[9px] font-mono font-medium py-0.5 px-1 rounded truncate ${
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

      {/* --- EXPANDABLE ALERT DETAILS MODAL --- */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95">
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

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
                <div className="text-[11px] text-slate-500">Customer</div>
                <div className="text-sm font-semibold text-slate-900">{selectedAlert.customerName}</div>
                <div className="text-xs text-slate-600 font-mono">+91 {selectedAlert.customerPhone}</div>
                {selectedAlert.customerAddress && (
                  <div className="text-xs text-slate-500 mt-1">{selectedAlert.customerAddress}</div>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
                <div className="text-[11px] text-slate-500">Costume Item</div>
                <div className="font-semibold text-slate-900">
                  <span className="font-mono text-[#6B1D2F] font-bold">{selectedAlert.costumeCode}</span> — {selectedAlert.items[0]?.productName}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Delivery: <strong>{selectedAlert.pickupDate}</strong> · Return: <strong>{selectedAlert.returnDueDate}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <div className="text-[10px] text-slate-400">Advance Paid</div>
                  <div className="font-semibold text-emerald-700">{formatINR(selectedAlert.advancePaid)}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <div className="text-[10px] text-slate-400">Balance Due</div>
                  <div className="font-semibold text-slate-900">{formatINR(selectedAlert.remainingRentalDue || 0)}</div>
                </div>
              </div>

              {selectedAlert.notes && (
                <div className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-200 text-amber-900 text-xs">
                  {selectedAlert.notes}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <a
                  href={`https://wa.me/91${selectedAlert.customerPhone}?text=Namaste%20${encodeURIComponent(
                    selectedAlert.customerName
                  )},%20Barnali%20Fashion%20se%20aapka%20costume%20${selectedAlert.costumeCode}%20ready%20hai.`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-1.5 bg-[#6B1D2F] hover:bg-[#551624] text-white font-medium rounded-lg shadow-xs flex items-center gap-1.5"
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