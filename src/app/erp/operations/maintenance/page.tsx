"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import {
  Wrench,
  Plus,
  CheckCircle2,
  Calendar,
  Shirt,
  DollarSign,
  UserCheck,
  X,
  Loader2,
  Clock,
} from "lucide-react";
import { careApi, garmentsApi } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";
import type { CareJobDto, GarmentDto } from "@/types/api";
import { EmptyState } from "@/components/ui/EmptyState";

function MaintenanceContent() {
  const [jobs, setJobs] = useState<CareJobDto[]>([]);
  const [garments, setGarments] = useState<GarmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [garmentId, setGarmentId] = useState("");
  const [subType, setSubType] = useState("Waist / Blouse Alteration");
  const [outDate, setOutDate] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [cost, setCost] = useState("200");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const inTwoDays = new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0];
    setOutDate(today);
    setExpectedDate(inTwoDays);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [careRes, gRes] = await Promise.all([
        careApi.list(),
        garmentsApi.list({ limit: 100 }),
      ]);
      // Filter for tailoring & repair jobs
      const tailoringJobs = (careRes.items || []).filter(
        (j) => j.kind === "STITCHING" || j.kind === "REPAIR"
      );
      setJobs(tailoringJobs);
      setGarments(gRes.items || []);
      if (gRes.items && gRes.items.length > 0) {
        setGarmentId(gRes.items[0].id);
      }
    } catch (err) {
      console.error("Failed to load maintenance care jobs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!garmentId) return;

    setSubmitting(true);
    try {
      await careApi.create({
        garmentId,
        kind: "STITCHING",
        vendorName: "In-House Master Salim (Boutique Tailor)",
        subType,
        outDate: outDate || new Date().toISOString().split("T")[0],
        expectedDate: expectedDate || undefined,
        cost: Number(cost) || 0,
        notes: notes.trim() || undefined,
      });

      setShowAddModal(false);
      setNotes("");
      await loadData();
      alert("Tailoring alteration job logged successfully!");
    } catch (err: any) {
      alert(err?.message || "Failed to create tailor job");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiveJob = async (jobId: string, estimatedCost: number) => {
    if (!confirm("Confirm tailor work completion and restock garment as AVAILABLE?")) return;

    try {
      await careApi.receive(jobId, {
        rcvDate: new Date().toISOString().split("T")[0],
        cost: estimatedCost,
        nextStatus: "AVAILABLE",
      });
      alert("Tailoring work completed! Garment unit restocked as AVAILABLE.");
      await loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to complete care job");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gold-dark font-semibold uppercase tracking-wider mb-1">
            <Wrench className="w-4 h-4 text-plum" />
            <span>Tailoring &amp; Embellishment Repairs</span>
          </div>
          <h1 className="text-2xl page-title">Maintenance &amp; Alterations</h1>
          <p className="text-xs text-[#5B5566] mt-0.5">
            Manage master tailor alterations, zari re-stitching, zipper replacements, and stone bead setting.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-plum hover:bg-plum-dark text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-gold-light" />
          <span>New Alteration Job</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-line-soft p-5 shadow-xs space-y-4">
        <div className="font-bold text-[#18141E] text-sm pb-2 border-b border-line-soft flex justify-between">
          <span>Active &amp; Completed Tailor Jobs ({jobs.length})</span>
          <span className="text-xs text-[#8C8499] font-normal">Master Salim Tailor Desk</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#5B5566]">
            <Loader2 className="w-6 h-6 animate-spin text-plum mx-auto mb-2" />
            Loading tailoring &amp; alteration jobs...
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState title="No alteration or maintenance jobs in queue." className="py-12" />
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-4 bg-ivory rounded-xl border border-line flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-plum">{job.id}</span>
                    <span className="font-bold text-[#18141E]">{job.garmentName}</span>
                    <span className="font-mono text-[#8C8499] text-[11px]">({job.garmentId})</span>
                  </div>
                  <div className="text-[#5B5566] mt-0.5">
                    Service: <strong>{job.subType || "Alteration"}</strong> • Assigned: {job.vendorName}
                  </div>
                  <div className="text-[#8C8499] text-[11px] mt-0.5">
                    Dispatched: {formatDate(job.outDate)}{" "}
                    {job.expectedDate ? `• Expected: ${formatDate(job.expectedDate)}` : ""}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-mono font-bold text-[#18141E]">{formatINR(job.cost)}</span>
                    <div className="text-[10px]">
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          job.status === "OUT"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {job.status === "OUT" ? "In Progress" : "Completed"}
                      </span>
                    </div>
                  </div>

                  {job.status === "OUT" && (
                    <button
                      onClick={() => handleReceiveJob(job.id, job.cost)}
                      className="px-3 py-1.5 bg-plum hover:bg-plum-dark text-white font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Complete &amp; Restock
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Alteration Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-line-soft max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-line-soft">
              <div className="flex items-center gap-2 font-bold text-sm text-plum">
                <Wrench className="w-4 h-4 text-gold" />
                <span>Assign Alteration to Master Tailor</span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#8C8499] hover:text-[#5B5566] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5B5566] uppercase mb-1">
                  Select Garment Unit *
                </label>
                <select
                  value={garmentId}
                  onChange={(e) => setGarmentId(e.target.value)}
                  className="w-full p-2.5 bg-ivory border border-line rounded-xl font-bold font-mono"
                >
                  {garments.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.id} — {g.name} ({g.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5B5566] uppercase mb-1">
                  Alteration / Repair Type *
                </label>
                <select
                  value={subType}
                  onChange={(e) => setSubType(e.target.value)}
                  className="w-full p-2.5 bg-ivory border border-line rounded-xl font-semibold"
                >
                  <option value="Waist / Blouse Alteration">Waist / Blouse Alteration</option>
                  <option value="Zari Border Re-stitching">Zari Border Re-stitching</option>
                  <option value="Zipper & Hook Replacement">Zipper &amp; Hook Replacement</option>
                  <option value="Kundan / Stone Bead Setting">Kundan / Stone Bead Setting</option>
                  <option value="Lining Repair / Hemming">Lining Repair / Hemming</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#5B5566] uppercase mb-1">
                    Cost (₹) *
                  </label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full p-2.5 bg-ivory border border-line rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#5B5566] uppercase mb-1">
                    Expected Ready Date
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full p-2.5 bg-ivory border border-line rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5B5566] uppercase mb-1">
                  Specific Tailoring Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Tighten blouse waist by 1.5 inches, reinforce hook"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-ivory border border-line rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-line-soft flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#E8E2F0] rounded-xl font-semibold text-[#5B5566] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-plum hover:bg-plum-dark disabled:opacity-50 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Tailoring Job</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MaintenancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#8C8499]">Loading maintenance desk...</div>}>
      <MaintenanceContent />
    </Suspense>
  );
}
