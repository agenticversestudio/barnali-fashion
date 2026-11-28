"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Download,
  Printer,
  Award,
  Calendar,
  Loader2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { reportsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatINR } from "@/lib/utils";
import type { ReportSummary } from "@/types/api";
import { EmptyState } from "@/components/ui/EmptyState";

type CsvType = Parameters<typeof reportsApi.getExportUrl>[0];
const CSV_EXPORTS: { type: CsvType; label: string }[] = [
  { type: "bookings", label: "Bookings" },
  { type: "payments", label: "Payments" },
  { type: "expenses", label: "Expenses" },
  { type: "garments", label: "Garments" },
  { type: "customers", label: "Customers" },
  { type: "cashclosings", label: "Cash Closings" },
];

/** Local calendar date as YYYY-MM-DD (toISOString would shift it by the UTC offset around midnight). */
function localISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function ReportsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<CsvType | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Date filters (defaults to start of current month to today, set in useEffect)
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const loadSummary = useCallback(async (from: string, to: string) => {
    if (!from || !to) {
      setError("Pick both a start and an end date.");
      return;
    }
    if (from > to) {
      setError("The start date must not be after the end date.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setSummary(await reportsApi.getSummary(from, to));
    } catch (err: any) {
      setSummary(null);
      setError(err?.message || "Failed to load the report.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    const now = new Date();
    const start = localISO(new Date(now.getFullYear(), now.getMonth(), 1));
    const today = localISO(now);
    setFromDate(start);
    setToDate(today);
    loadSummary(start, today);
  }, [authLoading, isAdmin, loadSummary]);

  // fetch (not a bare link) so a failed/expired session shows a message instead of saving an error page as .csv
  const downloadCsv = async (type: CsvType) => {
    setExporting(type);
    setExportError(null);
    try {
      const res = await fetch(reportsApi.getExportUrl(type), { credentials: "same-origin" });
      if (!res.ok) {
        let msg = `Export failed (${res.status}).`;
        try {
          const j = await res.json();
          if (j?.error?.message) msg = j.error.message;
        } catch {
          /* not JSON */
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `barnali-${type}-${localISO(new Date())}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err?.message || "Export failed.");
    } finally {
      setExporting(null);
    }
  };

  if (!authLoading && !isAdmin) {
    return (
      <div className="bg-white rounded-2xl border border-line p-12 text-center">
        <Lock className="w-6 h-6 text-stone-400 mx-auto mb-2" />
        <div className="text-sm font-semibold text-stone-800">Owner access only</div>
        <div className="text-xs text-stone-500 mt-1">Financial reports can only be viewed by an admin account.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gold-dark font-semibold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4 text-plum" />
            <span>Turnover, Asset Utilization &amp; Demand Insights</span>
          </div>
          <h1 className="text-2xl page-title">Business Analytics &amp; Reports</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="bg-gold-soft hover:bg-gold-soft text-plum border border-line text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-gold" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector & CSV Export Links */}
      <div className="no-print bg-white p-4 rounded-2xl border border-line-soft shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="w-4 h-4 text-plum" />
          <span className="font-bold text-[#5B5566]">Period:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            max={toDate || undefined}
            className="p-1.5 min-h-10 bg-ivory border border-line rounded-lg font-mono text-xs"
          />
          <span className="text-[#8C8499]">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            min={fromDate || undefined}
            className="p-1.5 min-h-10 bg-ivory border border-line rounded-lg font-mono text-xs"
          />
          <button
            onClick={() => loadSummary(fromDate, toDate)}
            className="px-3 min-h-10 bg-plum text-white rounded-lg font-bold hover:bg-plum-dark cursor-pointer"
          >
            Apply
          </button>
        </div>

        {/* CSV Export Links */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#8C8499] font-semibold text-[11px]">Download Raw CSV (all dates):</span>
          {CSV_EXPORTS.map((c) => (
            <button
              key={c.type}
              type="button"
              onClick={() => downloadCsv(c.type)}
              disabled={exporting !== null}
              className="bg-ivory hover:bg-gold-soft disabled:opacity-60 text-[#5B5566] border border-line px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 min-h-10 cursor-pointer"
            >
              {exporting === c.type ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3 text-gold" />}
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {exportError && (
        <div role="alert" className="no-print p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

      {error && summary && (
        <div role="alert" className="no-print p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-line-soft p-12 text-center text-xs text-[#5B5566]">
          <Loader2 className="w-6 h-6 animate-spin text-plum mx-auto mb-2" />
          Aggregating financial and asset utilization analytics...
        </div>
      ) : !summary ? (
        <div role="alert" className="bg-white rounded-2xl border border-rose-200 p-10 text-center text-xs text-rose-800 space-y-2">
          <AlertTriangle className="w-5 h-5 text-rose-500 mx-auto" />
          <div>{error || "Failed to load summary."}</div>
        </div>
      ) : (
        <>
          {/* Top 3 Primary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-5 rounded-2xl border border-line-soft shadow-xs">
              <div className="text-[#8C8499] font-semibold uppercase text-[10px]">
                Total Turnover Revenue
              </div>
              <div className="text-3xl font-bold text-plum mt-1 font-mono">
                {formatINR(summary.revenue.total)}
              </div>
              <div className="text-[#5B5566] text-[11px] mt-1">
                Net Profit: <strong className="text-emerald-700">{formatINR(summary.profit)}</strong>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-line-soft shadow-xs">
              <div className="text-[#8C8499] font-semibold uppercase text-[10px]">
                Store Expenses
              </div>
              <div className="text-3xl font-bold text-rose-700 mt-1 font-mono">
                {formatINR(summary.expenses.total)}
              </div>
              <div className="text-[#5B5566] text-[11px] mt-1">
                Across {summary.expenses.byCategory.length} categories
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-line-soft shadow-xs">
              <div className="text-[#8C8499] font-semibold uppercase text-[10px]">
                Active Deposit Liability
              </div>
              <div className="text-3xl font-bold text-gold mt-1 font-mono">
                {formatINR(summary.depositsHeld)}
              </div>
              <div className="text-[#5B5566] text-[11px] mt-1">Held in vault against rented items</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-line-soft shadow-xs">
              <div className="text-[#8C8499] font-semibold uppercase text-[10px]">
                Garment Fleet Utilisation
              </div>
              <div className="text-3xl font-bold text-[#18141E] mt-1 font-mono">
                {summary.utilisation.percent}%
              </div>
              <div className="text-[#5B5566] text-[11px] mt-1">
                {summary.utilisation.bookedDays} booked / {summary.utilisation.availableDays} active days
              </div>
            </div>
          </div>

          {/* Revenue Breakdown by Head */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-line-soft p-5 shadow-xs space-y-3 text-xs">
              <div className="font-bold text-[#18141E] text-sm pb-2 border-b border-line-soft flex items-center justify-between">
                <span>Revenue Breakdown by Stream</span>
                <span className="font-mono text-plum font-bold">{formatINR(summary.revenue.total)}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-[#E8E2F0]">
                  <span className="text-[#5B5566]">Base Garment Rental:</span>
                  <span className="font-mono font-bold text-[#18141E]">{formatINR(summary.revenue.rental)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E8E2F0]">
                  <span className="text-[#5B5566]">Dry Cleaning Charges:</span>
                  <span className="font-mono font-bold text-[#18141E]">{formatINR(summary.revenue.dryClean)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E8E2F0]">
                  <span className="text-[#5B5566]">Transit &amp; Delivery:</span>
                  <span className="font-mono font-bold text-[#18141E]">{formatINR(summary.revenue.transit)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E8E2F0]">
                  <span className="text-[#5B5566]">Late Fees Collected:</span>
                  <span className="font-mono font-bold text-amber-700">{formatINR(summary.revenue.lateFees)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E8E2F0]">
                  <span className="text-[#5B5566]">Damage &amp; Deep-Stain Deductions:</span>
                  <span className="font-mono font-bold text-rose-700">{formatINR(summary.revenue.damageAndCleaning)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#5B5566]">Cancellation Retentions:</span>
                  <span className="font-mono font-bold text-[#5B5566]">{formatINR(summary.revenue.cancellationIncome)}</span>
                </div>
              </div>
            </div>

            {/* Expenses by Category */}
            <div className="bg-white rounded-2xl border border-line-soft p-5 shadow-xs space-y-3 text-xs">
              <div className="font-bold text-[#18141E] text-sm pb-2 border-b border-line-soft flex items-center justify-between">
                <span>Expenses by Category</span>
                <span className="font-mono text-rose-700 font-bold">{formatINR(summary.expenses.total)}</span>
              </div>

              {summary.expenses.byCategory.length === 0 ? (
                <EmptyState title="No expenses recorded for this period." className="py-8" />
              ) : (
                <div className="space-y-2">
                  {summary.expenses.byCategory.map((cat) => (
                    <div key={cat.category} className="flex justify-between py-1 border-b border-[#E8E2F0]">
                      <span className="text-[#5B5566] font-medium">{cat.category}</span>
                      <span className="font-mono font-bold text-[#18141E]">{formatINR(cat.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Highest Earning Physical Garments */}
          <div className="bg-white rounded-2xl border border-line-soft p-6 shadow-xs space-y-4 text-xs">
            <div className="font-bold text-[#18141E] text-sm pb-2 border-b border-line-soft flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-gold" />
                <span>Top Performing Physical Garment Assets</span>
              </div>
              <span className="text-[#8C8499] text-xs font-normal">Ranked by rental turnover</span>
            </div>

            {summary.topGarments.length === 0 ? (
              <EmptyState title="No garment rental data recorded for this period." className="py-8" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {summary.topGarments.map((g, idx) => (
                  <div key={g.garmentId} className="p-4 bg-gold-soft rounded-xl border border-line space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-plum text-sm">{g.garmentId}</span>
                      <span className="bg-plum text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="font-bold text-[#18141E]">{g.name}</div>
                    <div className="text-[11px] text-[#5B5566]">Rented: {g.timesRented} times</div>
                    <div className="text-emerald-700 font-bold font-mono text-sm pt-1">
                      Turnover: {formatINR(g.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
