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
  AlertTriangle,
} from "lucide-react";
import { careApi, garmentsApi } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";
import type { CareJobDto, GarmentDto } from "@/types/api";
import { EmptyState } from "@/components/ui/EmptyState";

function localISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type ReceiveNext = "AVAILABLE" | "RETURNED_CLEANING" | "DAMAGED_REPAIR";

function MaintenanceContent() {
  const [jobs, setJobs] = useState<CareJobDto[]>([]);
  const [garments, setGarments] = useState<GarmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Create form
  const [garmentId, setGarmentId] = useState("");
  const [subType, setSubType] = useState("Waist / Blouse Alteration");
  const [vendorName, setVendorName] = useState("In-House Master Salim (Boutique Tailor)");
  const [outDate, setOutDate] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [cost, setCost] = useState("200");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Complete form
  const [receiveJob, setReceiveJob] = useState<CareJobDto | null>(null);
  const [rcvCost, setRcvCost] = useState("");
  const [rcvNext, setRcvNext] = useState<ReceiveNext>("AVAILABLE");
  const [rcvError, setRcvError] = useState<string | null>(null);
  const [receiving, setReceiving] = useState(false);

  const resetCreateForm = useCallback(() => {
    const today = new Date();
    setSubType("Waist / Blouse Alteration");
    setVendorName("In-House Master Salim (Boutique Tailor)");
    setOutDate(localISO(today));
    setExpectedDate(localISO(new Date(today.getTime() + 86400000 * 2)));
    setCost("200");
    setNotes("");
    setFormError(null);
  }, []);

  useEffect(() => {
    resetCreateForm();
  }, [resetCreateForm]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
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
      // a garment that is out on rent or retired cannot be sent to the tailor
      const usable = (gRes.items || []).filter((g) => g.status !== "OUT_ON_RENT" && g.status !== "UNAVAILABLE");
      setGarments(usable);
      setGarmentId((cur) => (usable.some((g) => g.id === cur) ? cur : usable[0]?.id ?? ""));
    } catch (err: any) {
      setLoadError(err?.message || "Could not load the tailoring jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const closeAddModal = () => {
    setShowAddModal(false);
    resetCreateForm();
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!garmentId) return setFormError("Select a garment.");
    if (!vendorName.trim()) return setFormError("Enter the tailor's name.");
    const amount = Number(cost);
    if (cost.trim() === "" || !Number.isInteger(amount) || amount < 0) return setFormError("Cost must be a whole rupee amount, 0 or more.");
    if (!outDate) return setFormError("Enter the date it was sent to the tailor.");
    if (expectedDate && expectedDate < outDate) return setFormError("Expected date cannot be before the send-out date.");

    setSubmitting(true);
    try {
      await careApi.create({
        garmentId,
        kind: "STITCHING",
        vendorName: vendorName.trim(),
        subType,
        outDate,
        expectedDate: expectedDate || undefined,
        cost: amount,
        notes: notes.trim() || undefined,
      });

      closeAddModal();
      setNotice({ kind: "ok", text: "Tailoring job logged. The garment is now IN CARE." });
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || "Failed to create tailor job");
    } finally {
      setSubmitting(false);
    }
  };

  const openReceive = (job: CareJobDto) => {
    setReceiveJob(job);
    setRcvCost(String(job.cost));
    setRcvNext("AVAILABLE");
    setRcvError(null);
  };

  const handleReceiveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveJob) return;
    setRcvError(null);
    const amount = Number(rcvCost);
    if (rcvCost.trim() === "" || !Number.isInteger(amount) || amount < 0) return setRcvError("Final cost must be a whole rupee amount, 0 or more.");

    setReceiving(true);
    try {
      await careApi.receive(receiveJob.id, {
        rcvDate: localISO(new Date()),
        cost: amount,
        nextStatus: rcvNext,
      });
      setReceiveJob(null);
      setNotice({
        kind: "ok",
        text:
          rcvNext === "AVAILABLE"
            ? "Tailoring work completed. Garment is AVAILABLE again."
            : rcvNext === "RETURNED_CLEANING"
            ? "Tailoring work completed. Garment moved to cleaning."
            : "Tailoring work recorded. Garment stays in DAMAGED / REPAIR.",
      });
      await loadData();
    } catch (err: any) {
      setRcvError(err?.message || "Failed to complete care job");
    } finally {
      setReceiving(false);
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
          onClick={() => {
            resetCreateForm();
            setShowAddModal(true);
          }}
          className="bg-plum hover:bg-plum-dark text-white text-xs font-bold px-4 min-h-10 rounded-xl shadow-xs flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-gold-light" />
          <span>New Alteration Job</span>
        </button>
      </div>

      {notice && (
        <div
          role={notice.kind === "ok" ? "status" : "alert"}
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            notice.kind === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {notice.kind === "ok" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss" className="ml-auto font-bold cursor-pointer">×</button>
        </div>
      )}

      {loadError && (
        <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{loadError}</span>
          <button onClick={loadData} className="ml-auto font-bold underline cursor-pointer">Retry</button>
        </div>
      )}

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
                      onClick={() => openReceive(job)}
                      className="px-3 min-h-10 bg-plum hover:bg-plum-dark text-white font-bold rounded-lg text-xs cursor-pointer"
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
                onClick={closeAddModal}
                aria-label="Close"
                className="w-10 h-10 -mr-2 rounded-lg flex items-center justify-center text-[#8C8499] hover:text-[#5B5566] cursor-pointer"
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

              <div>
                <label className="block text-[11px] font-bold text-[#5B5566] uppercase mb-1">
                  Tailor / Vendor *
                </label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full p-2.5 bg-ivory border border-line rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#5B5566] uppercase mb-1">
                    Cost (₹) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
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
                    min={outDate || undefined}
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

              {formError && (
                <div role="alert" className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="pt-3 border-t border-line-soft flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="px-4 min-h-10 border border-[#E8E2F0] rounded-xl font-semibold text-[#5B5566] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 min-h-10 bg-plum hover:bg-plum-dark disabled:opacity-50 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Tailoring Job</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete & Restock Modal */}
      {receiveJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleReceiveJob}
            className="bg-white rounded-2xl shadow-2xl border border-line-soft max-w-sm w-full p-6 text-xs space-y-3 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-line-soft">
              <div className="font-bold text-sm text-plum">Complete tailoring job {receiveJob.id}</div>
              <button
                type="button"
                onClick={() => setReceiveJob(null)}
                aria-label="Close"
                className="w-10 h-10 -mr-2 rounded-lg flex items-center justify-center text-[#8C8499] hover:text-[#5B5566] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-[#5B5566]">
              {receiveJob.garmentName} <span className="font-mono">({receiveJob.garmentId})</span> · {receiveJob.subType || "Alteration"}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#5B5566] uppercase mb-1">Final Cost (₹)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={rcvCost}
                onChange={(e) => setRcvCost(e.target.value)}
                className="w-full p-2.5 bg-ivory border border-line rounded-xl font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#5B5566] uppercase mb-1">Garment is now</label>
              <select
                value={rcvNext}
                onChange={(e) => setRcvNext(e.target.value as ReceiveNext)}
                className="w-full p-2.5 bg-ivory border border-line rounded-xl font-semibold"
              >
                <option value="AVAILABLE">Available for Rent</option>
                <option value="RETURNED_CLEANING">Needs Cleaning</option>
                <option value="DAMAGED_REPAIR">Needs More Repair</option>
              </select>
            </div>
            {rcvError && (
              <div role="alert" className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{rcvError}</span>
              </div>
            )}
            <div className="pt-3 border-t border-line-soft flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReceiveJob(null)}
                className="px-4 min-h-10 border border-[#E8E2F0] rounded-xl font-semibold text-[#5B5566] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={receiving}
                className="px-5 min-h-10 bg-plum hover:bg-plum-dark disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                {receiving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Complete &amp; Restock</span>
              </button>
            </div>
          </form>
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
