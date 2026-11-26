"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, Loader2, IndianRupee, AlertCircle } from "lucide-react";
import { bookingsApi } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import type { BookingDto, PayMode, PaymentKind } from "@/types/api";

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: BookingDto) => void;
  booking: BookingDto;
  initialKind?: "BALANCE" | "DEPOSIT" | "EXTRA";
  initialAmount?: number;
}

export function AddPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  booking,
  initialKind,
  initialAmount,
}: AddPaymentModalProps) {
  const isCompleted = booking.status === "COMPLETED";
  const defaultKind: "BALANCE" | "DEPOSIT" | "EXTRA" =
    initialKind || (isCompleted ? "EXTRA" : "BALANCE");

  const [kind, setKind] = useState<"BALANCE" | "DEPOSIT" | "EXTRA">(defaultKind);
  const [mode, setMode] = useState<PayMode>("CASH");
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Maximum allowable amount for this payment
  const maxAllowed = isCompleted ? booking.additionalDue : booking.balanceDue;

  useEffect(() => {
    if (initialAmount !== undefined && initialAmount > 0) {
      setAmount(initialAmount);
    } else {
      setAmount(maxAllowed);
    }
    setKind(initialKind || (isCompleted ? "EXTRA" : "BALANCE"));
    setNote(
      isCompleted
        ? "Extra amount collected after return settlement"
        : "Balance payment collected at counter"
    );
    setError(null);
  }, [booking, initialAmount, initialKind, isCompleted, maxAllowed]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError("Payment amount must be greater than ₹0");
      return;
    }
    if (amount > maxAllowed) {
      setError(`Amount cannot exceed the remaining due of ${formatINR(maxAllowed)}`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const updated = await bookingsApi.addPayment(booking.id, {
        kind,
        amount,
        mode,
        note: note.trim() || undefined,
      });

      alert(`Payment of ${formatINR(amount)} recorded successfully via ${mode}!`);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error("Failed to add payment:", err);
      setError(err?.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6E4DF] shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="font-mono text-xs text-[#6B1D2F] font-bold">
              {booking.id}
            </span>
            <h3 className="font-serif font-bold text-lg text-slate-900">
              {kind === "EXTRA" ? "Add payment → Extra" : "Record Customer Payment"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Booking Summary Box */}
          <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-slate-700">
            <div>
              Customer: <strong className="text-slate-900">{booking.customer.name}</strong> ({booking.customer.phone})
            </div>
            <div>
              Status: <strong className="font-mono text-[#6B1D2F]">{booking.status}</strong>
            </div>
            <div className="pt-1 flex items-center justify-between border-t border-slate-200 text-slate-900 font-semibold">
              <span>{isCompleted ? "Total Amount Client Owes:" : "Current Balance Due:"}</span>
              <span className="font-mono font-bold text-rose-700 text-sm">
                {formatINR(maxAllowed)}
              </span>
            </div>
          </div>

          {/* Payment Kind */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Payment Kind *
            </label>
            {isCompleted ? (
              <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl text-rose-900 font-bold text-xs flex items-center justify-between">
                <span>EXTRA (Amount owed after return settlement)</span>
                <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded font-mono">
                  EXTRA
                </span>
              </div>
            ) : (
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as any)}
                className="w-full p-2.5 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-semibold"
              >
                <option value="BALANCE">BALANCE (Rental balance collected)</option>
                <option value="DEPOSIT">DEPOSIT (Security deposit collected)</option>
              </select>
            )}
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Payment Mode Received *
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as PayMode)}
              className="w-full p-2.5 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-semibold"
            >
              <option value="CASH">Cash in Till / Drawer</option>
              <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
              <option value="CARD">Card POS Swiped</option>
              <option value="BANK_TRANSFER">Bank Transfer / IMPS / NEFT</option>
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase">
                Amount Received (₹) *
              </label>
              <button
                type="button"
                onClick={() => setAmount(maxAllowed)}
                className="text-[10px] text-[#8C6F3B] hover:underline font-semibold cursor-pointer"
              >
                Fill Full Amount ({formatINR(maxAllowed)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                ₹
              </span>
              <input
                type="number"
                min="1"
                max={maxAllowed}
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full pl-7 pr-3 py-2.5 bg-white border border-[#E6E4DF] rounded-xl font-mono font-bold text-sm text-gray-900 focus:outline-hidden focus:border-[#6B1D2F]"
                required
              />
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Internal Note / Remarks (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Received by counter manager, settled in full"
              className="w-full p-2.5 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-medium"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || amount <= 0}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-white" />
              )}
              <span>Record Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
