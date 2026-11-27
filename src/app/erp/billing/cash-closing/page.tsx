"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BadgeAlert,
  Wallet,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Lock,
  Loader2,
  History,
} from "lucide-react";
import { cashApi } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";
import type { CashTodayDto, CashClosingDto } from "@/types/api";
import { useAuth } from "@/context/AuthContext";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CashClosingPage() {
  const { user, isAdmin } = useAuth();
  const [todayData, setTodayData] = useState<CashTodayDto | null>(null);
  const [closings, setClosings] = useState<CashClosingDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [actualCash, setActualCash] = useState<string>("");
  const [closingNotes, setClosingNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadCashData = useCallback(async () => {
    setLoading(true);
    try {
      const [today, history] = await Promise.all([
        cashApi.getToday(),
        cashApi.getClosings(30),
      ]);
      setTodayData(today);
      setClosings(history.closings || []);
      if (today.closed && today.closing) {
        setActualCash(String(today.closing.actualCash));
        setClosingNotes(today.closing.notes || "");
      } else {
        setActualCash(String(today.expectedCash));
      }
    } catch (err) {
      console.error("Failed to load cash data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCashData();
  }, [loadCashData]);

  const handleSaveClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualCash) {
      alert("Please enter the actual physical cash amount counted in the drawer.");
      return;
    }

    setSubmitting(true);
    try {
      await cashApi.close({
        actualCash: Number(actualCash),
        notes: closingNotes.trim() || undefined,
      });

      alert("Cash closing saved and frozen for today!");
      await loadCashData();
    } catch (err: any) {
      alert(err?.message || "Failed to save cash closing");
    } finally {
      setSubmitting(false);
    }
  };

  const countedNum = Number(actualCash) || 0;
  const variance = todayData ? countedNum - todayData.expectedCash : 0;
  const isBalanced = variance === 0;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-line p-12 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-plum mx-auto mb-2" />
        <div className="text-xs text-stone-500">Reconciling today&apos;s cash payments and drawer totals...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 md:p-6 rounded-2xl border border-line shadow-2xs">
        <div>
          <span className="text-xs font-mono text-plum font-bold">
            Daily Financial Audit
          </span>
          <h1 className="font-serif font-bold text-xl md:text-2xl text-stone-900 tracking-tight mt-0.5">
            Daily Cash Drawer Closing
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Automated reconciliation of counter cash in, security deposit refunds &amp; shop cash expenses.
          </p>
        </div>

        {todayData?.closed && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Today&apos;s Drawer Closed &amp; Frozen</span>
          </div>
        )}
      </div>

      {/* Drawer Breakdown Grid */}
      {todayData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-line shadow-2xs">
            <span className="text-[11px] text-stone-500 font-medium block">Opening Cash</span>
            <div className="font-mono font-bold text-lg text-stone-900 mt-0.5">
              {formatINR(todayData.openingCash)}
            </div>
            <span className="text-[10px] text-stone-400">from yesterday closing</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-line shadow-2xs">
            <span className="text-[11px] text-emerald-700 font-medium block">Cash Inflows</span>
            <div className="font-mono font-bold text-lg text-emerald-800 mt-0.5">
              +{formatINR(todayData.cashIn)}
            </div>
            <span className="text-[10px] text-stone-400">rentals &amp; deposits in</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-line shadow-2xs">
            <span className="text-[11px] text-rose-700 font-medium block">Cash Outflows</span>
            <div className="font-mono font-bold text-lg text-rose-800 mt-0.5">
              −{formatINR(todayData.cashRefunds + todayData.cashExpenses)}
            </div>
            <span className="text-[10px] text-stone-400">refunds + expenses</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-line shadow-2xs">
            <span className="text-[11px] text-stone-600 font-bold block">Expected in Drawer</span>
            <div className="font-mono font-bold text-lg text-plum mt-0.5">
              {formatINR(todayData.expectedCash)}
            </div>
            <span className="text-[10px] text-stone-400">system computed</span>
          </div>
        </div>
      )}

      {/* Form: Actual Cash Counted & Verification */}
      <div className="bg-white rounded-2xl border border-line p-6 shadow-2xs space-y-4">
        <h2 className="font-bold text-stone-900 text-sm border-b border-stone-100 pb-2">
          Physical Currency Count &amp; Reconciliation
        </h2>

        <form onSubmit={handleSaveClosing} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Actual Physical Cash Counted (₹) *
              </label>
              <input
                type="number"
                value={actualCash}
                disabled={todayData?.closed}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder="Count all notes in drawer..."
                className="w-full p-2.5 bg-ivory border border-line rounded-xl font-mono font-bold text-base text-stone-900 focus:outline-none focus:border-plum"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Variance / Discrepancy
              </label>
              <div
                className={`p-2.5 rounded-xl border flex items-center justify-between font-mono font-bold text-sm ${
                  isBalanced
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : variance > 0
                    ? "bg-blue-50 text-blue-900 border-blue-200"
                    : "bg-rose-50 text-rose-900 border-rose-200"
                }`}
              >
                <span>{isBalanced ? "Drawer Balanced (Exact Match)" : variance > 0 ? "Surplus Cash" : "Shortage"}</span>
                <span>{formatINR(variance)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
              Closing &amp; Currency Bundle Remarks
            </label>
            <input
              type="text"
              value={closingNotes}
              disabled={todayData?.closed}
              onChange={(e) => setClosingNotes(e.target.value)}
              placeholder="e.g. 500 x 10, 200 x 15 notes. Counted and verified by owner."
              className="w-full p-2.5 bg-ivory border border-line rounded-xl"
            />
          </div>

          {!todayData?.closed && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-plum hover:bg-plum-dark text-white font-bold rounded-xl shadow-xs text-xs flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin text-gold-light" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Freeze &amp; Save Daily Closing</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Past 30 Days Cash Closings History */}
      <div className="bg-white rounded-2xl border border-line p-6 shadow-2xs space-y-4">
        <h2 className="font-bold text-stone-900 text-sm flex items-center gap-2 border-b border-stone-100 pb-2">
          <History className="w-4 h-4 text-stone-500" />
          <span>Past Cash Drawer Closings Ledger ({closings.length})</span>
        </h2>

        {closings.length === 0 ? (
          <EmptyState title="No previous cash closings saved yet." className="py-8" />
        ) : (
          <div className="divide-y divide-stone-100 text-xs">
            {closings.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-stone-900">{formatDate(c.date)}</span>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Verified by: <strong className="text-stone-700">{c.verifiedBy}</strong>
                    {c.notes && <span> · {c.notes}</span>}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="font-bold text-stone-900">{formatINR(c.actualCash)}</div>
                  <div
                    className={`text-[10px] font-semibold ${
                      c.variance === 0
                        ? "text-emerald-700"
                        : c.variance > 0
                        ? "text-blue-700"
                        : "text-rose-700"
                    }`}
                  >
                    Var: {formatINR(c.variance)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
