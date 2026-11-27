"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Phone,
  MessageCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Shirt,
  PackageCheck,
  RotateCcw,
  Bell,
  RefreshCw,
  FileSpreadsheet,
  Wallet,
  Scissors,
  PartyPopper,
  ArrowUpRight,
  CheckCircle2,
  Wrench,
  Archive,
} from "lucide-react";
import { alertsApi, bookingsApi, garmentsApi, syncApi } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import { addDaysISO, daysBetween, localISO, relativeDays, waLink } from "@/lib/dates";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import type { AlertDto, BookingDto, GarmentDto, SyncStatus } from "@/types/api";
import { useAuth } from "@/context/AuthContext";

/** The 6 costume states: multi-color icon badge + bar segment + dot (Revive AI 6-color system). */
const STATE_META = [
  { key: "AVAILABLE", label: "Available", bar: "bg-[#10B981]", dot: "bg-[#10B981]", chip: "bg-[#D1FAE5] text-[#059669]", icon: CheckCircle2 },
  { key: "OUT_ON_RENT", label: "Out on rent", bar: "bg-[#4F46E5]", dot: "bg-[#4F46E5]", chip: "bg-[#E0E7FF] text-[#4F46E5]", icon: Shirt },
  { key: "RETURNED_CLEANING", label: "Cleaning", bar: "bg-[#0284C7]", dot: "bg-[#0284C7]", chip: "bg-[#E0F2FE] text-[#0284C7]", icon: Sparkles },
  { key: "IN_CARE", label: "In care", bar: "bg-[#D97706]", dot: "bg-[#D97706]", chip: "bg-[#FEF3C7] text-[#D97706]", icon: Scissors },
  { key: "DAMAGED_REPAIR", label: "Repair", bar: "bg-[#EA580C]", dot: "bg-[#EA580C]", chip: "bg-[#FFEDD5] text-[#EA580C]", icon: Wrench },
  { key: "UNAVAILABLE", label: "Unavailable", bar: "bg-[#8C8499]", dot: "bg-[#8C8499]", chip: "bg-[#F3F0F7] text-[#5B5566]", icon: Archive },
] as const;

type Milestone = { booking: BookingDto; days: number };

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();

  const [garments, setGarments] = useState<GarmentDto[]>([]);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [alerts, setAlerts] = useState<AlertDto[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todayStr, setTodayStr] = useState("");

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

  useEffect(() => {
    setTodayStr(localISO());
  }, []);

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

  // ---- stock counts (6 states) ----
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const m of STATE_META) c[m.key] = garments.filter((g) => g.status === m.key).length;
    return c;
  }, [garments]);
  const totalStock = garments.length;

  // ---- pending actions ----
  const upcomingPickups = todayStr ? bookings.filter((b) => b.status === "CONFIRMED" && b.pickupDate <= todayStr) : [];
  const dueReturns = todayStr ? bookings.filter((b) => b.status === "OUT_ON_RENT" && b.returnDueDate <= todayStr) : [];
  const refundsPending = alerts.filter((a) => a.type === "REFUND_PENDING").length;
  const careOverdue = alerts.filter((a) => a.type === "CARE_OVERDUE").length;
  const pendingTotal = upcomingPickups.length + dueReturns.length + refundsPending + careOverdue;

  // ---- 4D trial-due / 3D packing-ready (client side, from pickupDate) ----
  const milestones = useMemo(() => {
    const out: Milestone[] = [];
    if (!todayStr) return out;
    for (const b of bookings) {
      if (b.status !== "CONFIRMED") continue;
      const d = daysBetween(todayStr, b.pickupDate);
      if (d === 4 || d === 3) out.push({ booking: b, days: d });
    }
    return out.sort((a, b) => a.days - b.days);
  }, [bookings, todayStr]);

  // ---- 7-day costume calendar strip ----
  const week = useMemo(() => {
    if (!todayStr) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDaysISO(todayStr, i);
      const chips: { code: string; kind: "pickup" | "return"; bookingId: string }[] = [];
      for (const b of bookings) {
        if (b.status === "CONFIRMED" && b.pickupDate === date)
          b.items.forEach((it) => chips.push({ code: it.garmentId, kind: "pickup", bookingId: b.id }));
        if (b.status === "OUT_ON_RENT" && b.returnDueDate === date)
          b.items.forEach((it) => chips.push({ code: it.garmentId, kind: "return", bookingId: b.id }));
      }
      return { date, chips };
    });
  }, [bookings, todayStr]);

  const weekHasAny = week.some((d) => d.chips.length > 0);

  return (
    <div className="space-y-5 md:space-y-6 animate-in fade-in">
      {/* Google Sheets sync (admin) */}
      {isAdmin && syncStatus && (
        <div className="surface p-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-ink block">Google Sheet mirror</span>
              <span className="text-mute text-[11px] block truncate">
                {syncStatus.configured
                  ? syncStatus.lastSyncAt
                    ? `Last synced ${formatDate(syncStatus.lastSyncAt)} (${syncStatus.lastStatus})`
                    : "Configured, awaiting first sync"
                  : "Not configured yet (see SHEETS_SETUP.md)"}
              </span>
            </div>
          </div>
          {syncStatus.configured && (
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="px-3 bg-ivory hover:bg-ivory-deep border border-line text-ink-soft font-semibold rounded-lg text-xs flex items-center gap-1.5 min-h-10 shrink-0 disabled:opacity-60"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", syncing && "animate-spin text-plum")} />
              <span>{syncing ? "Syncing..." : "Sync now"}</span>
            </button>
          )}
        </div>
      )}

      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="eyebrow text-[#7C3AED]">BARNALI FASHION STUDIO · BARGARH</span>
          <h1 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] text-[#18141E] mt-1">
            Today&apos;s Studio
          </h1>
          <p className="text-xs text-[#5B5566] mt-1.5">
            Welcome back, <span className="font-semibold text-[#18141E]">{user?.name || "Operator"}</span>.{" "}
            {pendingTotal > 0 ? (
              <span>
                You have <span className="font-semibold text-[#E11D48]">{pendingTotal} pending action{pendingTotal === 1 ? "" : "s"}</span> and{" "}
                <span className="font-semibold text-[#059669]">{counts.AVAILABLE} ready costumes</span> on racks.
              </span>
            ) : (
              <span>
                All workflows clear — <span className="font-semibold text-[#059669]">{counts.AVAILABLE} costumes ready</span> on racks.
              </span>
            )}{" "}
            {todayStr && <span className="num text-[#8C8499] ml-1">({formatDate(todayStr)})</span>}
          </p>
        </div>
        <Link
          href="/erp/bookings/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-11 bg-gradient-to-r from-[#BE123C] to-[#7C3AED] hover:from-[#9F1239] hover:to-[#6D28D9] text-white rounded-full text-sm font-medium shadow-[0_6px_18px_-3px_rgba(190,18,60,0.35)] transition-all shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>New Booking</span>
        </Link>
      </div>

      {/* Top 4 Multi-Color KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          label="Pickups due"
          value={upcomingPickups.length}
          hint="Ready for handover"
          icon={PackageCheck}
          tone="plum"
          href="/erp/bookings?filter=today"
        />
        <StatCard
          label="Returns due"
          value={dueReturns.length}
          hint="Settlement pending"
          icon={AlertTriangle}
          tone="coral"
          href="/erp/bookings?filter=overdue"
        />
        <StatCard
          label="At care"
          value={counts.IN_CARE + counts.RETURNED_CLEANING}
          hint="Dry clean & tailoring"
          icon={Sparkles}
          tone="sky"
          href="/erp/operations/laundry"
        />
        <StatCard
          label="Available"
          value={counts.AVAILABLE}
          hint="Ready on racks"
          icon={Shirt}
          tone="emerald"
          href="/erp/inventory"
        />
      </div>

      {/* Pending Actions + Hero Spotlight Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2/3: Today's Pending Actions */}
        <section className="lg:col-span-2 surface p-5 flex flex-col justify-between" aria-label="Today's pending actions">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="section-title text-base text-[#18141E]">Today&apos;s Pending Actions</h2>
                <p className="text-[11px] text-[#5B5566]">Counter priorities requiring attention</p>
              </div>
            </div>
            <span
              className={cn(
                "num text-xs font-semibold px-3 py-1 rounded-full border inline-flex items-center gap-1.5",
                pendingTotal > 0 ? "bg-[#FFE4E6]/70 text-[#9F1239] border-[#FECDD3]" : "bg-[#D1FAE5]/70 text-[#065F46] border-[#A7F3D0]"
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", pendingTotal > 0 ? "bg-[#E11D48]" : "bg-[#059669]")} />
              {loading ? "Loading..." : pendingTotal > 0 ? `${pendingTotal} to do` : "All clear"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: "Pickups due", n: upcomingPickups.length, icon: PackageCheck, href: "/erp/bookings?filter=today", chip: "bg-[#FFE4E6] text-[#E11D48]", hot: false },
              { label: "Overdue returns", n: dueReturns.length, icon: RotateCcw, href: "/erp/bookings?filter=overdue", chip: "bg-[#FFEDD5] text-[#EA580C]", hot: true },
              { label: "Deposit refunds", n: refundsPending, icon: Wallet, href: "/erp/bookings", chip: "bg-[#FEF3C7] text-[#D97706]", hot: false },
              { label: "Care overdue", n: careOverdue, icon: Scissors, href: "/erp/operations/laundry", chip: "bg-[#E0F2FE] text-[#0284C7]", hot: true },
            ].map((x) => (
              <Link
                key={x.label}
                href={x.href}
                className="bg-[#F8F6FA] hover:bg-white border border-[#E8E2F0] rounded-2xl p-3.5 flex items-center justify-between gap-2 transition-all hover:shadow-sm"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", x.chip)}>
                    <x.icon className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-semibold text-[#5B5566] truncate">{x.label}</span>
                </span>
                <span className={cn("num font-bold text-xl", x.n > 0 && x.hot ? "text-[#EA580C]" : "text-[#18141E]")}>
                  {x.n}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Right 1/3: Hero Spotlight Card (Revive AI Gradient Card Style) */}
        <section
          className="rounded-[20px] bg-gradient-to-br from-[#881337] via-[#9F1239] to-[#6D28D9] text-white p-5 flex flex-col justify-between shadow-[0_12px_30px_-6px_rgba(136,19,55,0.4)] relative overflow-hidden"
          aria-label="Studio spotlight"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/75">STUDIO SPOTLIGHT</span>
              <h2 className="text-lg font-semibold tracking-tight text-white mt-0.5">Rack Readiness</h2>
            </div>
            <Link
              href="/erp/bookings"
              aria-label="Open orders"
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 flex items-center justify-center text-white transition-colors shrink-0"
            >
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-4 p-3.5 bg-white/15 backdrop-blur-md border border-white/20 rounded-xl space-y-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-white/90">Ready for rental</span>
              <span className="num text-lg font-bold text-white">
                {totalStock > 0 ? Math.round((counts.AVAILABLE / totalStock) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#34D399] to-[#FDE68A] shadow-[0_0_12px_rgba(52,211,153,0.7)]"
                style={{ width: `${totalStock > 0 ? Math.round((counts.AVAILABLE / totalStock) * 100) : 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/80">
              <span>{counts.AVAILABLE} of {totalStock} pieces</span>
              <span>{milestones.length} upcoming trials</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-white/80">Next 4D/3D deliveries</span>
            <Link href="/erp/calendar" className="font-semibold text-[#FDE68A] hover:underline flex items-center gap-1">
              <span>View Calendar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      </div>

      {/* Delivery date alerts: 4D trial due, 3D packing ready */}
      <section className="surface p-5" aria-label="Delivery date alerts">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="eyebrow text-[#4F46E5]">COUNTDOWN TO PICKUP</span>
              <h2 className="section-title text-lg text-[#18141E] mt-0.5">Delivery Date Alerts</h2>
            </div>
          </div>
          <span className="num text-xs font-semibold text-[#5B5566] bg-[#F5F2F8] px-3 py-1 rounded-full border border-[#E8E2F0]">
            {milestones.length} booking{milestones.length === 1 ? "" : "s"}
          </span>
        </div>

        {milestones.length === 0 ? (
          <EmptyState
            icon={PartyPopper}
            title="No trials or packing due"
            hint="When a confirmed booking is 4 days from pickup you will see Trial Due here, and 3 days out, Packing Ready."
            className="py-8"
          />
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {milestones.map(({ booking: b, days }) => {
              const trial = days === 4;
              const wa = b.customer.whatsapp || b.customer.phone;
              const msg = trial
                ? `Namaste ${b.customer.name}, this is Barnali Fashion. Your trial for ${b.items.map((i) => i.name).join(", ")} is due. Please visit the studio before your pickup on ${formatDate(b.pickupDate)}.`
                : `Namaste ${b.customer.name}, this is Barnali Fashion. Your costume is being packed and will be ready for pickup on ${formatDate(b.pickupDate)}.`;
              return (
                <article key={b.id} className="bg-[#F8F6FA] border border-[#E8E2F0] rounded-2xl p-4 flex flex-col gap-3 surface-interactive">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span
                        className={cn(
                          "num inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border",
                          trial ? "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]" : "bg-[#FFE4E6] text-[#9F1239] border-[#FECDD3]"
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", trial ? "bg-[#D97706]" : "bg-[#E11D48]")} />
                        {days}D · {trial ? "Trial due" : "Packing ready"}
                      </span>
                      <h3 className="font-semibold text-[#18141E] text-base mt-2 truncate">{b.customer.name}</h3>
                      <p className="text-[11px] text-[#5B5566] truncate">
                        {b.eventName} · <span className="num font-semibold text-[#18141E]">{b.id}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="num text-xs font-semibold text-[#18141E]">{formatDate(b.pickupDate)}</div>
                      <div className="text-[10px] text-[#8C8499]">{relativeDays(todayStr, b.pickupDate)}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {b.items.map((it) => (
                      <span key={it.garmentId} className="num text-[10px] font-semibold bg-white border border-[#E8E2F0] text-[#5B5566] px-2.5 py-0.5 rounded-full shadow-2xs">
                        {it.garmentId}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <a
                      href={waLink(wa, msg)}
                      target="_blank"
                      rel="noreferrer"
                      className="min-h-10 flex items-center justify-center gap-1.5 rounded-full bg-[#D1FAE5] hover:bg-emerald-200 text-[#065F46] text-[11px] font-semibold transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href={`tel:${b.customer.phone}`}
                      className="min-h-10 flex items-center justify-center gap-1.5 rounded-full bg-white hover:bg-[#F5F2F8] border border-[#E8E2F0] text-[#5B5566] text-[11px] font-semibold transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                    <Link
                      href={`/erp/bookings?orderId=${b.id}`}
                      className="min-h-10 flex items-center justify-center gap-1 rounded-full bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[11px] font-semibold transition-colors shadow-xs"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Costume calendar strip */}
      <section className="surface p-5" aria-label="Costume calendar, next 7 days">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="eyebrow text-[#7C3AED]">NEXT 7 DAYS</span>
            <h2 className="section-title text-lg text-[#18141E] mt-0.5">Costume Calendar</h2>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-[#5B5566]">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#D97706]" />Pickup</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#0284C7]" />Return due</span>
          </div>
        </div>

        <div className="mt-4 -mx-1 overflow-x-auto pb-1">
          <div className="grid grid-flow-col auto-cols-[minmax(7.5rem,1fr)] gap-2.5 px-1 min-w-max md:min-w-0 md:grid-flow-row md:grid-cols-7 md:auto-cols-auto">
            {week.map((d, i) => {
              const dt = new Date(+d.date.slice(0, 4), +d.date.slice(5, 7) - 1, +d.date.slice(8, 10));
              const isToday = i === 0;
              return (
                <div
                  key={d.date}
                  className={cn(
                    "rounded-2xl border p-3 min-h-24 flex flex-col gap-2 transition-all",
                    isToday
                      ? "bg-gradient-to-br from-[#BE123C] to-[#7C3AED] text-white border-transparent shadow-md"
                      : "bg-[#F8F6FA] border-[#E8E2F0]"
                  )}
                >
                  <div className="flex items-baseline justify-between">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", isToday ? "text-white/85" : "text-[#8C8499]")}>
                      {isToday ? "Today" : dt.toLocaleDateString("en-IN", { weekday: "short" })}
                    </span>
                    <span className={cn("num text-xs font-bold", isToday ? "text-white" : "text-[#18141E]")}>{dt.getDate()}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {d.chips.slice(0, 6).map((c, k) => (
                      <Link
                        key={`${c.bookingId}-${c.code}-${k}`}
                        href={`/erp/bookings?orderId=${c.bookingId}`}
                        title={c.kind === "pickup" ? "Pickup" : "Return due"}
                        className={cn(
                          "num text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                          isToday
                            ? "bg-white/20 text-white border-white/30 hover:bg-white/30"
                            : c.kind === "pickup"
                              ? "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]"
                              : "bg-[#E0F2FE] text-[#075985] border-[#BAE6FD]"
                        )}
                      >
                        {c.code}
                      </Link>
                    ))}
                    {d.chips.length > 6 && (
                      <span className={cn("num text-[10px] self-center", isToday ? "text-white/80" : "text-[#8C8499]")}>
                        +{d.chips.length - 6}
                      </span>
                    )}
                    {d.chips.length === 0 && (
                      <span className={cn("text-[10px]", isToday ? "text-white/60" : "text-[#8C8499]/70")}>free</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {!weekHasAny && !loading && (
          <p className="text-[11px] text-[#8C8499] mt-3">No pickups or returns scheduled this week.</p>
        )}
      </section>

      {/* Multi-color Wardrobe Ledger (6-state stock bar) */}
      <section className="surface p-5" aria-label="Inventory by state">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="eyebrow text-[#059669]">WARDROBE LEDGER</span>
            <h2 className="section-title text-lg text-[#18141E] mt-0.5">
              Stock by State <span className="num text-sm text-[#5B5566] font-normal">({totalStock} pieces)</span>
            </h2>
          </div>
          <Link href="/erp/inventory" className="text-xs font-semibold text-[#BE123C] hover:underline flex items-center gap-1 min-h-10">
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {totalStock > 0 ? (
          <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-[#F5F2F8] border border-[#E8E2F0]" role="img" aria-label="Proportion of costumes in each state">
            {STATE_META.map((m) =>
              counts[m.key] > 0 ? (
                <div
                  key={m.key}
                  className={cn("h-full first:rounded-l-full last:rounded-r-full", m.bar)}
                  style={{ width: `${(counts[m.key] / totalStock) * 100}%` }}
                  title={`${m.label}: ${counts[m.key]}`}
                />
              ) : null
            )}
          </div>
        ) : (
          !loading && <EmptyState icon={Shirt} title="No costumes yet" hint="Add your first piece in Inventory to see the wardrobe split here." className="py-6" />
        )}

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {STATE_META.map((m) => {
            const StateIcon = m.icon;
            return (
              <div key={m.key} className="rounded-2xl border border-[#E8E2F0] bg-[#F8F6FA] p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-1.5">
                  <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", m.chip)}>
                    <StateIcon className="w-3.5 h-3.5" />
                  </span>
                  <span className="num font-bold text-xl text-[#18141E] leading-none">{counts[m.key]}</span>
                </div>
                <span className="text-[11px] font-semibold text-[#5B5566] truncate">{m.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Live alerts */}
      <section className="surface p-4 md:p-5" aria-label="Operational alerts">
        <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
          <h2 className="section-title text-lg text-ink">Operational Alerts</h2>
          <span className="num text-[11px] font-semibold bg-rose-50 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-200">
            {alerts.length} pending
          </span>
        </div>

        {alerts.length === 0 ? (
          <EmptyState icon={Bell} title="All caught up" hint="Every handover, return and care job is up to date." className="py-8" />
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((a, idx) => (
              <div key={idx} className="p-3.5 bg-ivory border border-line rounded-xl flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5 min-w-0">
                  {a.type.includes("OVERDUE") ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <span className="font-semibold text-ink block">{a.title}</span>
                    <p className="text-ink-soft text-[11px] mt-0.5 leading-snug">{a.message}</p>
                    {a.date && <span className="num text-[10px] text-mute mt-1 block">Due: {a.date}</span>}
                  </div>
                </div>
                <Link
                  href={a.type.includes("CARE") ? "/erp/operations/laundry" : `/erp/bookings?orderId=${a.refId}`}
                  className="px-3 min-h-10 inline-flex items-center bg-white hover:bg-ivory-deep text-ink-soft font-semibold rounded-lg border border-line text-[11px] shrink-0"
                >
                  Inspect
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
