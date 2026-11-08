"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR, formatDate } from "@/lib/utils";
import { InspectionRecord } from "@/types";

export default function InspectionBayPage() {
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);

  useEffect(() => {
    setInspections(DataStore.getInspections());
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-[#8C6F3B] font-semibold uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4 text-[#4B1835]" />
          <span>Quality Audit &amp; Defect Classification</span>
        </div>
        <h1 className="text-2xl font-serif font-bold text-[#27222A]">Inspection Bay</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Detailed condition logs of returned garments, stain assessments, and before/after verification history.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#EFE9DD] p-5 shadow-xs space-y-4">
        <div className="font-bold text-gray-900 text-sm pb-2 border-b border-[#EFE9DD]">
          Inspection Records ({inspections.length})
        </div>

        <div className="space-y-3">
          {inspections.map((insp) => (
            <div
              key={insp.id}
              className="p-4 bg-[#FBF9F5] rounded-xl border border-[#E8DFD1] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#4B1835] bg-white px-2 py-0.5 rounded border border-[#E8DFD1]">
                    {insp.garmentUnitId}
                  </span>
                  <span className="font-bold text-gray-900 text-sm">
                    {insp.customerName} ({insp.bookingId})
                  </span>
                </div>
                <div className="text-gray-600 mt-1 flex flex-wrap items-center gap-4 text-[11px]">
                  <span>Inspected By: <strong>{insp.inspectedBy}</strong></span>
                  <span>Date: {formatDate(insp.returnDate)}</span>
                  <span>
                    Status: <strong className="text-[#4B1835]">{insp.status}</strong>
                  </span>
                </div>
                <div className="text-[11px] text-gray-700 mt-1.5 p-2 bg-white rounded-lg border border-[#EFE9DD]">
                  &ldquo;{insp.conditionNotes}&rdquo;
                </div>
              </div>

              <div className="shrink-0 text-right space-y-1">
                {insp.assessedDamageCharge > 0 ? (
                  <div className="font-bold text-rose-700">
                    Penalty: {formatINR(insp.assessedDamageCharge)}
                  </div>
                ) : (
                  <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    No Damage Penalty
                  </span>
                )}
                <div className="text-[10px] text-gray-400">
                  Special Wash: {insp.requiresSpecialDryClean ? "Yes" : "No"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
