"use client";

import React, { useState, useEffect } from "react";
import {
  Wrench,
  Plus,
  CheckCircle2,
  Calendar,
  Shirt,
  DollarSign,
  UserCheck,
  X,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR, formatDate } from "@/lib/utils";
import { MaintenanceJob } from "@/types";

export default function MaintenancePage() {
  const [jobs, setJobs] = useState<MaintenanceJob[]>([]);

  useEffect(() => {
    setJobs(DataStore.getMaintenanceJobs());
  }, []);

  const handleComplete = (jobId: string, estimatedCost: number) => {
    const success = DataStore.completeMaintenanceJob(jobId, estimatedCost);
    if (success) {
      alert("Tailoring work completed! Garment unit restocked as AVAILABLE.");
      setJobs(DataStore.getMaintenanceJobs());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-[#8C6F3B] font-semibold uppercase tracking-wider mb-1">
          <Wrench className="w-4 h-4 text-[#4B1835]" />
          <span>Tailoring &amp; Embellishment Repairs</span>
        </div>
        <h1 className="text-2xl font-serif font-bold text-[#27222A]">Maintenance &amp; Alterations</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Manage master tailor alterations, zari re-stitching, zipper replacements, and stone bead setting.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#EFE9DD] p-5 shadow-xs space-y-4">
        <div className="font-bold text-gray-900 text-sm pb-2 border-b border-[#EFE9DD] flex justify-between">
          <span>Active &amp; Completed Tailor Jobs ({jobs.length})</span>
          <span className="text-xs text-gray-400 font-normal">In-House Master Salim</span>
        </div>

        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-4 bg-[#FBF9F5] rounded-xl border border-[#E8DFD1] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#4B1835] bg-white px-2 py-0.5 rounded border border-[#E8DFD1]">
                    {job.garmentUnitId}
                  </span>
                  <span className="font-bold text-gray-900 text-sm">{job.productName}</span>
                </div>
                <div className="text-gray-600 mt-1 flex flex-wrap items-center gap-4 text-[11px]">
                  <span>Work Type: <strong className="text-[#8C6F3B]">{job.workType}</strong></span>
                  <span>Tailor: <strong>{job.tailorName}</strong></span>
                  <span>Sent: {formatDate(job.sentDate)}</span>
                </div>
                <div className="text-[11px] text-gray-700 mt-1 p-2 bg-white rounded-lg border border-[#EFE9DD]">
                  {job.issueDescription}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="font-bold text-gray-900 font-mono">
                    Est: {formatINR(job.estimatedCost)}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      job.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-orange-50 text-orange-800 border-orange-200"
                    }`}
                  >
                    {job.status.replace(/_/g, " ")}
                  </span>
                </div>

                {job.status !== "COMPLETED" && (
                  <button
                    onClick={() => handleComplete(job.id, job.estimatedCost)}
                    className="bg-[#4B1835] hover:bg-[#320F23] text-white font-bold px-3 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D4B67F]" />
                    <span>Complete &amp; Restock</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
