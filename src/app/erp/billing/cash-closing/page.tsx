"use client";

import React, { useState, useEffect } from "react";
import {
  BadgeAlert,
  Wallet,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Lock,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR, formatDate } from "@/lib/utils";
import { CashClosingRecord } from "@/types";

export default function CashClosingPage() {
  const [closings, setClosings] = useState<CashClosingRecord[]>([]);

  // Today's Drawer Calculations
  const [openingCash, setOpeningCash] = useState<number>(5000);
  const [cashRental, setCashRental] = useState<number>(3800);
  const [cashDepositIn, setCashDepositIn] = useState<number>(5000);
  const [cashDepositOut, setCashDepositOut] = useState<number>(3000);
  const [cashExpenses, setCashExpenses] = useState<number>(1450);
  const [actualCashCounted, setActualCashCounted] = useState<number>(9350);
  const [verifiedBy, setVerifiedBy] = useState("Pooja Das (Manager)");
  const [closingNotes, setClosingNotes] = useState("All 100, 200 and 500 currency bundles verified.");

  useEffect(() => {
    setClosings(DataStore.getCashClosings());
  }, []);

  const expectedCash =
    openingCash + cashRental + cashDepositIn - cashDepositOut - cashExpenses;
  const differenceVariance = actualCashCounted - expectedCash;
  const isBalanced = differenceVariance === 0;

  const handleSaveClosing = () => {
    const newRecord = DataStore.saveCashClosing({
      date: new Date().toISOString().split("T")[0],
      openingCash,
      cashRentalReceipts: cashRental,
      cashSecurityDepositsReceived: cashDepositIn,
      cashDepositRefundsGiven: cashDepositOut,
      cashExpensesPaid: cashExpenses,
      expectedCashInDrawer: expectedCash,
      actualCashCounted,
      differenceVariance,
      closingNotes,
      verifiedBy,
      status: isBalanced ? "BALANCED" : "VARIANCE_RECORDED",
    });

    setClosings(DataStore.getCashClosings());
    alert(`Cash drawer closing for today saved! Status: ${newRecord.status}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-[#8C6F3B] font-semibold uppercase tracking-wider mb-1">
          <BadgeAlert className="w-4 h-4 text-[#4B1835]" />
          <span>Daily Till Reconciliation &amp; Vault Handover</span>
        </div>
        <h1 className="text-2xl font-serif font-bold text-[#27222A]">Daily Cash Closing</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Verify physical currency notes in the counter drawer against rentals collected, security deposits held/refunded, and cash expenses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Closing Calculator */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EFE9DD] p-6 shadow-xs space-y-5 text-xs">
          <div className="font-bold text-gray-900 text-sm pb-2 border-b border-[#EFE9DD] flex items-center justify-between">
            <span>Today&apos;s Cash Drawer Reconciliation (08 Nov 2026)</span>
            <span className="text-[11px] text-[#B89558] font-bold">Counter #1</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Opening Cash Balance (₹)
              </label>
              <input
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(Number(e.target.value) || 0)}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                (+) Cash Rental Receipts Today (₹)
              </label>
              <input
                type="number"
                value={cashRental}
                onChange={(e) => setCashRental(Number(e.target.value) || 0)}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold font-mono text-emerald-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                (+) Cash Deposits Collected (₹)
              </label>
              <input
                type="number"
                value={cashDepositIn}
                onChange={(e) => setCashDepositIn(Number(e.target.value) || 0)}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold font-mono text-[#B89558]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                (−) Cash Deposits Refunded (₹)
              </label>
              <input
                type="number"
                value={cashDepositOut}
                onChange={(e) => setCashDepositOut(Number(e.target.value) || 0)}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold font-mono text-amber-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                (−) Cash Expenses Paid Out (₹)
              </label>
              <input
                type="number"
                value={cashExpenses}
                onChange={(e) => setCashExpenses(Number(e.target.value) || 0)}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold font-mono text-rose-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Physical Cash Counted in Drawer (₹) *
              </label>
              <input
                type="number"
                value={actualCashCounted}
                onChange={(e) => setActualCashCounted(Number(e.target.value) || 0)}
                className="w-full p-2.5 bg-white border-2 border-[#4B1835] rounded-xl font-black font-mono text-base text-[#4B1835]"
              />
            </div>
          </div>

          {/* Mathematical Reconciliation Box */}
          <div className="p-4 bg-[#FAF5EB] rounded-xl border border-[#E8DFD1] space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-gray-700">
              <span>Expected Cash in Drawer:</span>
              <span className="font-mono text-sm text-gray-900">{formatINR(expectedCash)}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-gray-700">
              <span>Actual Physical Cash Counted:</span>
              <span className="font-mono text-sm text-[#4B1835]">{formatINR(actualCashCounted)}</span>
            </div>
            <div
              className={`p-3 rounded-lg border flex items-center justify-between font-bold text-xs ${
                isBalanced
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-rose-50 text-rose-800 border-rose-300"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {isBalanced ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                )}
                <span>{isBalanced ? "Drawer Exactly Balanced (Zero Variance)" : "Cash Discrepancy Detected"}</span>
              </span>
              <span className="font-mono text-sm">
                Variance: {differenceVariance >= 0 ? `+${formatINR(differenceVariance)}` : formatINR(differenceVariance)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
              Closing Signoff Notes
            </label>
            <input
              type="text"
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-[#EFE9DD] flex items-center justify-between">
            <span className="text-gray-500">
              Verified &amp; Sealed by: <strong>{verifiedBy}</strong>
            </span>
            <button
              onClick={handleSaveClosing}
              className="bg-[#4B1835] hover:bg-[#320F23] text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Lock className="w-4 h-4 text-[#D4B67F]" />
              <span>Save &amp; Lock Cash Closing</span>
            </button>
          </div>
        </div>

        {/* Right: Historical Closings Log */}
        <div className="bg-white rounded-2xl border border-[#EFE9DD] p-5 shadow-xs space-y-3 text-xs">
          <div className="font-bold text-gray-900 text-sm pb-2 border-b border-[#EFE9DD]">
            Recent Daily Closings
          </div>
          <div className="space-y-3">
            {closings.map((c) => (
              <div key={c.id} className="p-3 bg-[#FBF9F5] rounded-xl border border-[#E8DFD1]">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>{formatDate(c.date)}</span>
                  <span
                    className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                      c.status === "BALANCED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Counted: <strong>{formatINR(c.actualCashCounted)}</strong> • Expected:{" "}
                  <strong>{formatINR(c.expectedCashInDrawer)}</strong>
                </div>
                <div className="text-[10px] text-gray-400 mt-1">Verified: {c.verifiedBy}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
