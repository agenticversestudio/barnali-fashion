"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Download,
  Printer,
  Award,
  Wallet,
  Calendar,
  Layers,
  Percent,
  Coins,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { reportsApi } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import type { ReportSummary } from "@/types/api";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Date filters (defaults to start of current month to today, set in useEffect)
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const loadSummary = useCallback(async (from?: string, to?: string) => {
    setLoading(true);
    try {
      const f = from || fromDate;
      const t = to || toDate;
      if (!f || !t) return;
      const data = await reportsApi.getSummary(f, t);
      setSummary(data);
    } catch (err) {
      console.error("Failed to load report summary:", err);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const today = now.toISOString().split("T")[0];
    setFromDate(startOfMonth);
    setToDate(today);
    loadSummary(startOfMonth, today);
  }, []);

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
            className="p-1.5 bg-ivory border border-line rounded-lg font-mono text-xs"
          />
          <span className="text-[#8C8499]">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="p-1.5 bg-ivory border border-line rounded-lg font-mono text-xs"
          />
          <button
            onClick={() => loadSummary()}
            className="px-3 py-1.5 bg-plum text-white rounded-lg font-bold hover:bg-plum-dark cursor-pointer"
          >
            Apply
          </button>
        </div>

        {/* CSV Export Links */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#8C8499] font-semibold text-[11px]">Download Raw CSV:</span>
          <a
            href={reportsApi.getExportUrl("bookings")}
            download
            className="bg-ivory hover:bg-gold-soft text-[#5B5566] border border-line px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 min-h-10"
          >
            <Download className="w-3 h-3 text-gold" />
            <span>Bookings</span>
          </a>
          <a
            href={reportsApi.getExportUrl("payments")}
            download
            className="bg-ivory hover:bg-gold-soft text-[#5B5566] border border-line px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 min-h-10"
          >
            <Download className="w-3 h-3 text-gold" />
            <span>Payments</span>
          </a>
          <a
            href={reportsApi.getExportUrl("expenses")}
            download
            className="bg-ivory hover:bg-gold-soft text-[#5B5566] border border-line px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 min-h-10"
          >
            <Download className="w-3 h-3 text-gold" />
            <span>Expenses</span>
          </a>
          <a
            href={reportsApi.getExportUrl("garments")}
            download
            className="bg-ivory hover:bg-gold-soft text-[#5B5566] border border-line px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 min-h-10"
          >
            <Download className="w-3 h-3 text-gold" />
            <span>Garments</span>
          </a>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-line-soft p-12 text-center text-xs text-[#5B5566]">
          <Loader2 className="w-6 h-6 animate-spin text-plum mx-auto mb-2" />
          Aggregating financial and asset utilization analytics...
        </div>
      ) : !summary ? (
        <EmptyState title="Failed to load summary." className="py-12" />
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
                  <span className="text-[#5B5566]">Late Fees Collected (15%/day):</span>
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
