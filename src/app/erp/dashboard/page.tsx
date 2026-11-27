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
} from "lucide-react";
import { alertsApi, bookingsApi, garmentsApi, syncApi } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import { addDaysISO, daysBetween, localISO, relativeDays, waLink } from "@/lib/dates";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import type { AlertDto, BookingDto, GarmentDto, SyncStatus } from "@/types/api";
import { useAuth } from "@/context/AuthContext";

/** The 6 costume states: bar segment colour + label (same palette as <StatusBadge> and the sidebar legend). */
const STATE_META = [
  { key: "AVAILABLE", label: "Available", bar: "bg-emerald-500", dot: "bg-emerald-500" },
  { key: "OUT_ON_RENT", label: "Out on rent", bar: "bg-sky-500", dot: "bg-sky-500" },
  { key: "RETURNED_CLEANING", label: "Cleaning", bar: "bg-violet-500", dot: "bg-violet-500" },
  { key: "IN_CARE", label: "In care", bar: "bg-amber-500", dot: "bg-amber-500" },
  { key: "DAMAGED_REPAIR", label: "Repair", bar: "bg-rose-500", dot: "bg-rose-500" },
  { key: "UNAVAILABLE", label: "Unavailable", bar: "bg-stone-400", dot: "bg-stone-400" },
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
          <span className="eyebrow text-gold">BARNALI FASHION STUDIO · BARGARH</span>
          <h1 className="page-title text-2xl md:text-3xl text-ink mt-1">Today&apos;s Studio</h1>
          <p className="text-xs text-ink-soft mt-1.5">
            Welcome back, {user?.name || "Operator"}. {todayStr && <span className="num font-semibold text-ink">{formatDate(todayStr)}</span>}
          </p>
        </div>
        <Link
          href="/erp/bookings/new"
          className="inline-flex items-center justify-center gap-2 px-5 min-h-11 bg-plum hover:bg-plum-dark text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4 text-gold-soft" />
          <span>New Booking</span>
        </Link>
      </div>

      {/* Today's pending actions */}
      <section
        className={cn(
          "rounded-2xl border p-4 md:p-5 shadow-2xs transition-all",
          pendingTotal > 0 ? "bg-gold-soft border-line" : "bg-white border-line"
        )}
        aria-label="Today's pending actions"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white border border-line flex items-center justify-center shadow-2xs">
              <Bell className="w-4 h-4 text-gold" />
            </div>
            <h2 className="section-title text-base text-ink">Today&apos;s Pending Actions</h2>
          </div>
          <span
            className={cn(
              "num text-[11px] font-semibold px-3 py-0.5 rounded-full border shadow-2xs",
              pendingTotal > 0 ? "bg-white text-rose-800 border-rose-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"
            )}
          >
            {loading ? "Loading..." : pendingTotal > 0 ? `${pendingTotal} to do` : "All clear"}
          </span>
        </div>

        <div className="mt-3.5 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            { label: "Pickups due", n: upcomingPickups.length, icon: PackageCheck, href: "/erp/bookings?filter=today", hot: false },
            { label: "Overdue returns", n: dueReturns.length, icon: RotateCcw, href: "/erp/bookings?filter=overdue", hot: true },
            { label: "Deposit refunds", n: refundsPending, icon: Wallet, href: "/erp/bookings", hot: false },
            { label: "Care overdue", n: careOverdue, icon: Scissors, href: "/erp/operations/laundry", hot: true },
          ].map((x) => (
            <Link
              key={x.label}
              href={x.href}
              className="bg-white hover:bg-ivory border border-line rounded-xl px-3.5 min-h-14 py-2.5 flex items-center justify-between gap-2 shadow-2xs transition-all hover:border-line-strong"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <x.icon className="w-4 h-4 text-mute shrink-0" />
                <span className="text-xs font-medium text-ink-soft truncate">{x.label}</span>
              </span>
              <span className={cn("num font-display font-semibold text-xl", x.n > 0 && x.hot ? "text-rose-800" : "text-ink")}>
                {x.n}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Delivery date alerts: 4D trial due, 3D packing ready */}
      <section className="surface p-4 md:p-5" aria-label="Delivery date alerts">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="eyebrow text-gold">COUNTDOWN TO PICKUP</span>
            <h2 className="section-title text-lg text-ink mt-0.5">Delivery Date Alerts</h2>
          </div>
          <span className="num text-[11px] text-ink-soft bg-ivory px-2.5 py-0.5 rounded-full border border-line">
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
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {milestones.map(({ booking: b, days }) => {
              const trial = days === 4;
              const wa = b.customer.whatsapp || b.customer.phone;
              const msg = trial
                ? `Namaste ${b.customer.name}, this is Barnali Fashion. Your trial for ${b.items.map((i) => i.name).join(", ")} is due. Please visit the studio before your pickup on ${formatDate(b.pickupDate)}.`
                : `Namaste ${b.customer.name}, this is Barnali Fashion. Your costume is being packed and will be ready for pickup on ${formatDate(b.pickupDate)}.`;
              return (
                <article key={b.id} className="bg-ivory border border-line rounded-2xl p-4 flex flex-col gap-3 surface-interactive">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span
                        className={cn(
                          "num inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border shadow-2xs",
                          trial ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-plum-soft text-plum border-rose-200"
                        )}
                      >
                        {days}D · {trial ? "Trial due" : "Packing ready"}
                      </span>
                      <h3 className="font-display font-semibold text-ink text-base mt-2 truncate">{b.customer.name}</h3>
                      <p className="text-[11px] text-ink-soft truncate">
                        {b.eventName} · <span className="num font-semibold text-ink">{b.id}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="num text-xs font-semibold text-ink">{formatDate(b.pickupDate)}</div>
                      <div className="text-[10px] text-mute">{relativeDays(todayStr, b.pickupDate)}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {b.items.map((it) => (
                      <span key={it.garmentId} className="num text-[10px] font-medium bg-white border border-line text-ink-soft px-2 py-0.5 rounded-md shadow-2xs">
                        {it.garmentId}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <a
                      href={waLink(wa, msg)}
                      target="_blank"
                      rel="noreferrer"
                      className="min-h-10 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-semibold transition-colors shadow-2xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href={`tel:${b.customer.phone}`}
                      className="min-h-10 flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-ivory-deep border border-line text-ink-soft text-[11px] font-semibold transition-colors shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                    <Link
                      href={`/erp/bookings?orderId=${b.id}`}
                      className="min-h-10 flex items-center justify-center gap-1 rounded-xl bg-plum hover:bg-plum-dark text-white text-[11px] font-semibold transition-colors shadow-2xs"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gold-soft" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Pickups due" value={upcomingPickups.length} hint="ready for handover" icon={Clock} tone="amber" href="/erp/bookings?filter=today" />
        <StatCard label="Returns due" value={dueReturns.length} hint="settlement pending" icon={AlertTriangle} tone="rose" href="/erp/bookings?filter=overdue" />
        <StatCard label="At care" value={counts.IN_CARE + counts.RETURNED_CLEANING} hint="dry clean & tailoring" icon={Sparkles} tone="violet" href="/erp/operations/laundry" />
        <StatCard label="Available" value={counts.AVAILABLE} hint="ready on racks" icon={Shirt} tone="emerald" href="/erp/inventory" />
      </div>

      {/* Costume calendar strip */}
      <section className="surface p-4 md:p-5" aria-label="Costume calendar, next 7 days">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="eyebrow text-gold">NEXT 7 DAYS</span>
            <h2 className="section-title text-lg text-ink mt-0.5">Costume Calendar</h2>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-ink-soft">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />Pickup</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500" />Return due</span>
          </div>
        </div>

        <div className="mt-4 -mx-1 overflow-x-auto pb-1">
          <div className="grid grid-flow-col auto-cols-[minmax(7.5rem,1fr)] gap-2 px-1 min-w-max md:min-w-0 md:grid-flow-row md:grid-cols-7 md:auto-cols-auto">
            {week.map((d, i) => {
              const dt = new Date(+d.date.slice(0, 4), +d.date.slice(5, 7) - 1, +d.date.slice(8, 10));
              return (
                <div
                  key={d.date}
                  className={cn(
                    "rounded-xl border p-2.5 min-h-24 flex flex-col gap-1.5 shadow-2xs transition-all",
                    i === 0 ? "bg-gold-soft border-line" : "bg-ivory border-line"
                  )}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="eyebrow-mute text-[9.5px]">{i === 0 ? "Today" : dt.toLocaleDateString("en-IN", { weekday: "short" })}</span>
                    <span className="num text-xs font-semibold text-ink">{dt.getDate()}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {d.chips.slice(0, 6).map((c, k) => (
                      <Link
                        key={`${c.bookingId}-${c.code}-${k}`}
                        href={`/erp/bookings?orderId=${c.bookingId}`}
                        title={c.kind === "pickup" ? "Pickup" : "Return due"}
                        className={cn(
                          "num text-[10px] font-semibold px-1.5 py-0.5 rounded-md border shadow-2xs",
                          c.kind === "pickup"
                            ? "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100"
                            : "bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100"
                        )}
                      >
                        {c.code}
                      </Link>
                    ))}
                    {d.chips.length > 6 && <span className="num text-[10px] text-mute self-center">+{d.chips.length - 6}</span>}
                    {d.chips.length === 0 && <span className="text-[10px] text-mute/60">free</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {!weekHasAny && !loading && (
          <p className="text-[11px] text-mute mt-3">No pickups or returns scheduled this week.</p>
        )}
      </section>

      {/* 6-state stock bar */}
      <section className="surface p-4 md:p-5" aria-label="Inventory by state">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="eyebrow text-gold">WARDROBE LEDGER</span>
            <h2 className="section-title text-lg text-ink mt-0.5">
              Stock by State <span className="num text-sm text-ink-soft font-sans font-normal">({totalStock} pieces)</span>
            </h2>
          </div>
          <Link href="/erp/inventory" className="text-xs font-semibold text-plum hover:underline flex items-center gap-1 min-h-10">
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5 text-gold" />
          </Link>
        </div>

        {totalStock > 0 ? (
          <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-ivory-deep border border-line" role="img" aria-label="Proportion of costumes in each state">
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

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {STATE_META.map((m) => (
            <div key={m.key} className="rounded-xl border border-line bg-ivory px-3 py-2.5 shadow-2xs">
              <span className="flex items-center gap-1.5 text-[11px] text-ink-soft">
                <span className={cn("w-1.5 h-1.5 rounded-full", m.dot)} />
                {m.label}
              </span>
              <span className="num font-display font-semibold text-xl text-ink block mt-1 leading-none">{counts[m.key]}</span>
            </div>
          ))}
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
