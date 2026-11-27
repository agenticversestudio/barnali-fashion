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

  const loadInspections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingsApi.list({ status: "COMPLETED", limit: 30 });
      setCompletedBookings(res.items || []);
    } catch (err) {
      console.error("Failed to load completed return inspections:", err);
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
        <p className="text-xs text-gray-500 mt-0.5">
          Detailed condition logs of returned garments, stain assessments, and before/after verification history.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-line-soft p-5 shadow-xs space-y-4">
        <div className="font-bold text-gray-900 text-sm pb-2 border-b border-line-soft flex items-center justify-between">
          <span>Inspection &amp; Return Logs ({completedBookings.length})</span>
          <span className="text-xs text-gray-400 font-normal">Recent Settled Orders</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin text-plum mx-auto mb-2" />
            Loading inspection history...
          </div>
        ) : completedBookings.length === 0 ? (
          <EmptyState title="No completed return inspections on record yet." className="py-12" />
        ) : (
          <div className="space-y-3">
            {completedBookings.map((b) => {
              const totalDeductions = (b.damageCharge || 0) + (b.cleaningCharge || 0);
              const hasDefects = totalDeductions > 0;

              return (
                <div
                  key={b.id}
                  className="p-4 bg-ivory rounded-xl border border-line flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-plum text-sm">{b.id}</span>
                      <span className="font-bold text-gray-900">{b.customer?.name}</span>
                      <span className="text-gray-400 text-[11px] font-mono">{b.customer?.phone}</span>
                    </div>

                    <div className="text-gray-600">
                      Returned: <strong>{b.actualReturnDate ? formatDate(b.actualReturnDate) : "Returned"}</strong> •{" "}
                      Items: {b.items.map((i) => `${i.name} (${i.garmentId})`).join(", ")}
                    </div>

                    {b.returnNotes && (
                      <div className="text-[11px] text-gray-500 italic mt-1">
                        &quot;{b.returnNotes}&quot;
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div>
                      <div className="text-[10px] text-gray-400">Deposit Settlement</div>
                      <div
                        className={`font-mono font-bold ${
                          hasDefects ? "text-rose-700" : "text-emerald-700"
                        }`}
                      >
                        {hasDefects ? `Deducted: ${formatINR(totalDeductions)}` : "Refunded in Full"}
                      </div>
                    </div>

                    <Link
                      href={`/erp/billing/invoices?bookingId=${b.id}`}
                      className="px-3 py-1.5 bg-white border border-line rounded-lg font-bold text-plum hover:bg-gold-soft min-h-10"
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading inspection bay...</div>}>
      <InspectionBayContent />
    </Suspense>
  );
}
