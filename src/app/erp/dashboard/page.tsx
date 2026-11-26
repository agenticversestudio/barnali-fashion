"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Sparkles,
  Shirt,
  DollarSign,
  PackageCheck,
  RotateCcw,
  Bell,
  MapPin,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
  Check,
} from "lucide-react";
import { alertsApi, bookingsApi, garmentsApi, syncApi } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AlertDto, BookingDto, GarmentDto, SyncStatus } from "@/types/api";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();

  const [garments, setGarments] = useState<GarmentDto[]>([]);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [alerts, setAlerts] = useState<AlertDto[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, bRes, aRes] = await Promise.all([
        garmentsApi.list({ limit: 100 }),
        bookingsApi.list({ limit: 50 }),
        alertsApi.list(),
      ]);
      setGarments(gRes.items || []);
      setBookings(bRes.items || []);
      setAlerts(aRes.alerts || []);

      if (isAdmin) {
        syncApi.getStatus().then(setSyncStatus).catch(() => {});
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const res = await syncApi.syncNow();
      alert(`Google Sheet synced successfully! (${res.rows} rows exported across ${res.tabs} tabs).`);
      const status = await syncApi.getStatus();
      setSyncStatus(status);
    } catch (err: any) {
      alert(err?.message || "Google Sheets sync failed. Please check service account configuration.");
    } finally {
      setSyncing(false);
    }
  };

  const [todayStr, setTodayStr] = useState("");

  useEffect(() => {
    setTodayStr(new Date().toISOString().split("T")[0]);
  }, []);

  // Stock status counts
  const countAvailable = garments.filter((g) => g.status === "AVAILABLE").length;
  const countOutOnRent = garments.filter((g) => g.status === "OUT_ON_RENT").length;
  const countCleaning = garments.filter((g) => g.status === "RETURNED_CLEANING").length;
  const countCare = garments.filter((g) => g.status === "IN_CARE").length;
  const countDamaged = garments.filter((g) => g.status === "DAMAGED_REPAIR").length;
  const countUnavailable = garments.filter((g) => g.status === "UNAVAILABLE").length;

  const upcomingPickups = todayStr
    ? bookings.filter((b) => b.status === "CONFIRMED" && b.pickupDate <= todayStr)
    : [];
  const dueReturns = todayStr
    ? bookings.filter((b) => b.status === "OUT_ON_RENT" && b.returnDueDate <= todayStr)
    : [];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Google Sheets Sync Banner (Admin) */}
      {isAdmin && syncStatus && (
        <div className="p-3 bg-white rounded-2xl border border-[#E6E4DF] shadow-2xs flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-slate-800">
                Automated Google Sheet Mirror
              </span>
              <span className="text-slate-400 text-[11px] block">
                {syncStatus.configured
                  ? syncStatus.lastSyncAt
                    ? `Last synced: ${formatDate(syncStatus.lastSyncAt)} (${syncStatus.lastStatus})`
                    : "Configured (awaiting first sync)"
                  : "Google Sheets service account not configured yet (Docs: SHEETS_SETUP.md)"}
              </span>
            </div>
          </div>

          {syncStatus.configured && (
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-[#6B1D2F]" : ""}`} />
              <span>{syncing ? "Syncing..." : "Sync Now"}</span>
            </button>
          )}
        </div>
      )}

      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 md:p-6 rounded-2xl border border-[#E6E4DF] shadow-2xs">
        <div>
          <span className="text-xs font-mono text-[#6B1D2F] font-bold">
            Barnali Fashion Studio · Bargarh
          </span>
          <h1 className="font-serif font-bold text-xl md:text-2xl text-slate-900 tracking-tight mt-0.5">
            Today&apos;s Store Operations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, {user?.name || "Operator"} ({user?.role?.toUpperCase()}). Real-time live status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/erp/bookings/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#6B1D2F] hover:bg-[#521624] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Booking</span>
          </Link>
        </div>
      </div>

      {/* 4 Counter Operations KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link
          href="/erp/bookings?filter=today"
          className="bg-white p-4 rounded-2xl border border-[#E6E4DF] shadow-2xs hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pickups Due</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-2xl text-slate-900 mt-2">
            {upcomingPickups.length}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">ready for handover</span>
        </Link>

        <Link
          href="/erp/bookings?filter=overdue"
          className="bg-white p-4 rounded-2xl border border-[#E6E4DF] shadow-2xs hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Returns Due</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-2xl text-rose-800 mt-2">
            {dueReturns.length}
          </div>
          <span className="text-[10px] text-rose-600 font-medium mt-0.5 block">settlement pending</span>
        </Link>

        <Link
          href="/erp/operations/laundry"
          className="bg-white p-4 rounded-2xl border border-[#E6E4DF] shadow-2xs hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">At Care / Laundry</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-2xl text-purple-900 mt-2">
            {countCare + countCleaning}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">dry clean &amp; tailoring</span>
        </Link>

        <Link
          href="/erp/inventory"
          className="bg-white p-4 rounded-2xl border border-[#E6E4DF] shadow-2xs hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Available Stock</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-2xl text-emerald-800 mt-2">
            {countAvailable}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">ready on godown racks</span>
        </Link>
      </div>

      {/* Stock Breakdown Strip (6 Exact States) */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-[#E6E4DF] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Total Inventory Stock Breakdown ({garments.length} Pieces)
          </span>
          <Link href="/erp/inventory" className="text-xs font-semibold text-[#6B1D2F] hover:underline flex items-center gap-1">
            <span>View All Assets</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center text-xs">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Available</span>
            <span className="font-mono font-bold text-lg text-emerald-950 mt-0.5 block">{countAvailable}</span>
          </div>
          <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl">
            <span className="text-[10px] font-bold text-blue-800 uppercase block">Out on Rent</span>
            <span className="font-mono font-bold text-lg text-blue-950 mt-0.5 block">{countOutOnRent}</span>
          </div>
          <div className="p-3 bg-purple-50/70 border border-purple-200/60 rounded-xl">
            <span className="text-[10px] font-bold text-purple-800 uppercase block">Cleaning</span>
            <span className="font-mono font-bold text-lg text-purple-950 mt-0.5 block">{countCleaning}</span>
          </div>
          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl">
            <span className="text-[10px] font-bold text-amber-800 uppercase block">In Care</span>
            <span className="font-mono font-bold text-lg text-amber-950 mt-0.5 block">{countCare}</span>
          </div>
          <div className="p-3 bg-rose-50/70 border border-rose-200/60 rounded-xl">
            <span className="text-[10px] font-bold text-rose-800 uppercase block">Repair</span>
            <span className="font-mono font-bold text-lg text-rose-950 mt-0.5 block">{countDamaged}</span>
          </div>
          <div className="p-3 bg-slate-100/70 border border-slate-200/60 rounded-xl">
            <span className="text-[10px] font-bold text-slate-600 uppercase block">Unavailable</span>
            <span className="font-mono font-bold text-lg text-slate-800 mt-0.5 block">{countUnavailable}</span>
          </div>
        </div>
      </div>

      {/* Live Operational Alerts Section */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#E6E4DF] shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#6B1D2F]" />
            <h2 className="font-serif font-bold text-base text-slate-900">
              Live Operational Alerts &amp; Schedule Alarms
            </h2>
          </div>
          <span className="text-xs font-mono font-bold bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200">
            {alerts.length} Pending Actions
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            All customer handovers, returns and care jobs are up to date!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((a, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-[#FAF9F6] border border-[#E6E4DF] rounded-xl flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  {a.type.includes("OVERDUE") ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-900 block">{a.title}</span>
                    <p className="text-slate-600 text-[11px] mt-0.5 leading-snug">{a.message}</p>
                    {a.date && <span className="font-mono text-[10px] text-slate-400 mt-1 block">Due: {a.date}</span>}
                  </div>
                </div>

                <Link
                  href={
                    a.type.includes("CARE")
                      ? "/erp/operations/laundry"
                      : `/erp/bookings?orderId=${a.refId}`
                  }
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-200 text-[11px] shrink-0"
                >
                  Inspect
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
