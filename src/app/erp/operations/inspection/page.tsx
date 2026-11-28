"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Wrench,
  Camera,
  Loader2,
} from "lucide-react";
import { bookingsApi } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";
import type { BookingDto } from "@/types/api";
import { EmptyState } from "@/components/ui/EmptyState";

function InspectionBayContent() {
  const [completedBookings, setCompletedBookings] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadInspections = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await bookingsApi.list({ status: "COMPLETED", limit: 30 });
      setCompletedBookings(res.items || []);
    } catch (err: any) {
      setLoadError(err?.message || "Could not load return inspections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-gold-dark font-semibold uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4 text-plum" />
          <span>Quality Audit &amp; Defect Classification</span>
        </div>
        <h1 className="text-2xl page-title">Inspection Bay</h1>
        <p className="text-xs text-[#5B5566] mt-0.5">
          Detailed condition logs of returned garments, stain assessments, and before/after verification history.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-line-soft p-5 shadow-xs space-y-4">
        <div className="font-bold text-[#18141E] text-sm pb-2 border-b border-line-soft flex items-center justify-between">
          <span>Inspection &amp; Return Logs ({completedBookings.length})</span>
          <span className="text-xs text-[#8C8499] font-normal">Recent Settled Orders</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#5B5566]">
            <Loader2 className="w-6 h-6 animate-spin text-plum mx-auto mb-2" />
            Loading inspection history...
          </div>
        ) : loadError ? (
          <div role="alert" className="py-10 text-center text-xs text-rose-800 space-y-2">
            <AlertTriangle className="w-5 h-5 text-rose-500 mx-auto" />
            <div>{loadError}</div>
            <button onClick={loadInspections} className="font-bold underline cursor-pointer">Retry</button>
          </div>
        ) : completedBookings.length === 0 ? (
          <EmptyState title="No completed return inspections on record yet." className="py-12" />
        ) : (
          <div className="space-y-3">
            {completedBookings.map((b) => {
              // late fee is also a deduction from the deposit, so it counts here
              const totalDeductions = (b.damageCharge || 0) + (b.cleaningCharge || 0) + (b.lateFee || 0);
              const hasDefects = totalDeductions > 0;
              const refundPending = b.depositStatus === "HELD" && b.refundAmount > 0;

              return (
                <div
                  key={b.id}
                  className="p-4 bg-ivory rounded-xl border border-line flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-plum text-sm">{b.id}</span>
                      <span className="font-bold text-[#18141E]">{b.customer?.name}</span>
                      <span className="text-[#8C8499] text-[11px] font-mono">{b.customer?.phone}</span>
                    </div>

                    <div className="text-[#5B5566]">
                      Returned: <strong>{b.actualReturnDate ? formatDate(b.actualReturnDate) : "Returned"}</strong> •{" "}
                      Items: {b.items.map((i) => `${i.name} (${i.garmentId})`).join(", ")}
                    </div>

                    {b.returnNotes && (
                      <div className="text-[11px] text-[#5B5566] italic mt-1">
                        &quot;{b.returnNotes}&quot;
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div>
                      <div className="text-[10px] text-[#8C8499]">Deposit Settlement</div>
                      <div
                        className={`font-mono font-bold ${
                          hasDefects ? "text-rose-700" : "text-emerald-700"
                        }`}
                      >
                        {refundPending
                          ? `Refund pending: ${formatINR(b.refundAmount)}`
                          : hasDefects
                          ? `Deducted: ${formatINR(totalDeductions)}`
                          : "Refunded in Full"}
                      </div>
                      {b.additionalDue > 0 && (
                        <div className="text-[10px] font-bold text-rose-700">Extra due: {formatINR(b.additionalDue)}</div>
                      )}
                    </div>

                    <Link
                      href={`/erp/billing/invoices?bookingId=${b.id}`}
                      className="px-3 min-h-10 inline-flex items-center bg-white border border-line rounded-lg font-bold text-plum hover:bg-gold-soft"
                    >
                      Receipt →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InspectionBayPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#8C8499]">Loading inspection bay...</div>}>
      <InspectionBayContent />
    </Suspense>
  );
}
