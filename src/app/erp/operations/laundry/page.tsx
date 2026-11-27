"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Scissors,
  Plus,
  CheckCircle2,
  Sparkles,
  X,
  ChevronRight,
  Clock,
  Shirt,
  MapPin,
  Calendar,
  RotateCcw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { careApi, garmentsApi } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { daysBetween, localISO } from "@/lib/dates";
import type { CareJobDto, CareKind, GarmentDto } from "@/types/api";

export default function StitchingAndDryCleanPage() {
  const [activeTab, setActiveTab] = useState<"ALL" | "STITCHING" | "DRY_CLEAN" | "REPAIR">("ALL");
  const [statusFilter, setStatusFilter] = useState<"OUT" | "RECEIVED">("OUT");
  const [careJobs, setCareJobs] = useState<CareJobDto[]>([]);
  const [garments, setGarments] = useState<GarmentDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Care Job for details bottom sheet
  const [selectedCareJob, setSelectedCareJob] = useState<CareJobDto | null>(null);

  // Create Care Job Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createKind, setCreateKind] = useState<CareKind>("DRY_CLEAN");
  const [createGarmentId, setCreateGarmentId] = useState("");
  const [vendorName, setVendorName] = useState("Bargarh Modern Dry Cleaners");
  const [subType, setSubType] = useState("Steam Wash & Press");
  const [outDate, setOutDate] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [cost, setCost] = useState("350");
  const [notes, setNotes] = useState("");

  // Receive Modal
  const [receiveJob, setReceiveJob] = useState<CareJobDto | null>(null);
  const [receiving, setReceiving] = useState(false);
  const [rcvDate, setRcvDate] = useState("");

  useEffect(() => {
    const nowStr = new Date().toISOString().split("T")[0];
    const inThreeDays = new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0];
    setOutDate(nowStr);
    setRcvDate(nowStr);
    setExpectedDate(inThreeDays);
  }, []);
  const [nextStatus, setNextStatus] = useState<"AVAILABLE" | "RETURNED_CLEANING" | "DAMAGED_REPAIR">(
    "AVAILABLE"
  );
  const [rcvCost, setRcvCost] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [careRes, gRes] = await Promise.all([
        careApi.list(statusFilter),
        garmentsApi.list({ limit: 100 }),
      ]);
      setCareJobs(careRes.items || []);
      setGarments(gRes.items || []);
      if (gRes.items?.length && !createGarmentId) {
        setCreateGarmentId(gRes.items[0].id);
      }
    } catch (err) {
      console.error("Failed to load care jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, createGarmentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createGarmentId || !vendorName.trim()) {
      alert("Please select garment and provide vendor name");
      return;
    }

    setCreating(true);
    try {
      await careApi.create({
        garmentId: createGarmentId,
        kind: createKind,
        vendorName: vendorName.trim(),
        subType: subType.trim() || undefined,
        outDate,
        expectedDate: expectedDate || undefined,
        cost: cost ? Number(cost) : undefined,
        notes: notes.trim() || undefined,
      });

      setShowCreateModal(false);
      setNotes("");
      await loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to dispatch care job");
    } finally {
      setCreating(false);
    }
  };

  const handleReceiveJob = async () => {
    if (!receiveJob) return;
    setReceiving(true);
    try {
      await careApi.receive(receiveJob.id, {
        rcvDate,
        nextStatus,
        cost: rcvCost ? Number(rcvCost) : undefined,
      });

      setReceiveJob(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to mark care job as received");
    } finally {
      setReceiving(false);
    }
  };

  const filteredJobs = careJobs.filter((j) => {
    if (activeTab === "ALL") return true;
    return j.kind === activeTab;
  });

  const [todayStr, setTodayStr] = useState("");
  useEffect(() => {
    setTodayStr(localISO());
  }, []);
  const outJobs = careJobs.filter((j) => j.status === "OUT");
  const overdueCount = outJobs.filter((j) => j.isOverdue).length;
  const outCost = outJobs.reduce((sum, j) => sum + (j.cost || 0), 0);

  const KIND_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; chip: string }> = {
    DRY_CLEAN: { label: "Dry clean", icon: Sparkles, chip: "bg-violet-50 text-violet-900 border-violet-200" },
    STITCHING: { label: "Stitching", icon: Scissors, chip: "bg-gold-soft text-gold-dark border-gold/40" },
    REPAIR: { label: "Repair", icon: Shirt, chip: "bg-rose-50 text-rose-900 border-rose-200" },
  };

  /** Countdown pill: days left to the expected return, or days overdue. */
  const countdown = (j: CareJobDto) => {
    if (!j.expectedDate) return <span className="text-[11px] text-mute">No expected date</span>;
    if (!todayStr) return <span className="text-[11px] text-mute">—</span>;
    const n = daysBetween(todayStr, j.expectedDate);
    const late = j.isOverdue || n < 0;
    return (
      <span
        className={`num inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
          late
            ? "bg-rose-50 text-rose-800 border-rose-200"
            : n <= 1
              ? "bg-amber-50 text-amber-900 border-amber-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
        }`}
      >
        <Clock className="w-3 h-3" />
        {late ? `${Math.abs(n)}d overdue` : n === 0 ? "due today" : `${n}d left`}
      </span>
    );
  };

  return (
    <div className="space-y-5 md:space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="eyebrow text-[#B8893A]">VENDOR DISPATCH</span>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h1 className="page-title text-2xl md:text-3xl text-[#1F1815]">Care &amp; Laundry</h1>
            <span className="num text-[11px] font-semibold bg-[#F9F2E4] text-[#7A1624] border border-[#E6D5B8] px-3 py-0.5 rounded-full shadow-2xs">
              {filteredJobs.length} job{filteredJobs.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-xs text-[#6B5E55] mt-1.5">Dry cleaning, tailoring alterations and repair turnaround at outside vendors.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 min-h-11 bg-[#7A1624] hover:bg-[#5C0F1A] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4 text-[#F9F2E4]" />
          <span>Dispatch New Job</span>
        </button>
      </div>

      {/* Summary tiles (currently-out jobs) */}
      {statusFilter === "OUT" && !loading && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="At vendors" value={outJobs.length} hint="pieces out" icon={Sparkles} tone="violet" />
          <StatCard label="Overdue" value={overdueCount} hint="past expected date" icon={AlertTriangle} tone="rose" />
          <StatCard label="Pending cost" value={formatINR(outCost)} hint="estimated" icon={Scissors} tone="amber" className="[&_.font-display]:text-2xl" />
        </div>
      )}

      {/* Filter tabs */}
      <div className="surface p-3.5 md:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
          {[
            { id: "ALL", label: "All Care" },
            { id: "DRY_CLEAN", label: "Dry Cleaning" },
            { id: "STITCHING", label: "Stitching & Fitting" },
            { id: "REPAIR", label: "Repairs" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              aria-pressed={activeTab === tab.id}
              className={`px-4 min-h-10 rounded-full text-xs whitespace-nowrap transition-colors shrink-0 border ${
                activeTab === tab.id
                  ? "bg-[#7A1624] text-white font-semibold border-[#7A1624]"
                  : "bg-white text-[#6B5E55] font-medium hover:bg-[#F4EDE3] border-[#EAE0D2]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-[#F4EDE3] p-1 rounded-xl border border-[#EAE0D2] text-xs shrink-0" role="group" aria-label="Job status">
          <button
            onClick={() => setStatusFilter("OUT")}
            aria-pressed={statusFilter === "OUT"}
            className={`px-4 min-h-9 rounded-lg font-semibold transition-colors ${
              statusFilter === "OUT" ? "bg-white text-[#7A1624] shadow-2xs" : "text-[#9C8E83] hover:text-[#1F1815]"
            }`}
          >
            Currently Out ({careJobs.filter((j) => j.status === "OUT").length})
          </button>
          <button
            onClick={() => setStatusFilter("RECEIVED")}
            aria-pressed={statusFilter === "RECEIVED"}
            className={`px-4 min-h-9 rounded-lg font-semibold transition-colors ${
              statusFilter === "RECEIVED" ? "bg-white text-[#7A1624] shadow-2xs" : "text-[#9C8E83] hover:text-[#1F1815]"
            }`}
          >
            Past Received
          </button>
        </div>
      </div>

      {/* Vendor dispatch cards */}
      {loading ? (
        <div className="surface p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-plum mx-auto mb-2" />
          <div className="text-xs text-mute">Loading vendor care jobs...</div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={Sparkles}
            title={statusFilter === "OUT" ? "Nothing at the vendors" : "No completed care jobs yet"}
            hint={
              statusFilter === "OUT"
                ? "Every costume is back in the studio. Dispatch a piece when it needs cleaning, fitting or repair."
                : "Jobs you mark received will be recorded here."
            }
            action={
              statusFilter === "OUT" ? (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 min-h-10 bg-plum text-white rounded-lg text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 text-gold" />
                  Dispatch New Job
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredJobs.map((j) => {
            const meta = KIND_META[j.kind] || KIND_META.DRY_CLEAN;
            const KindIcon = meta.icon;
            return (
              <article key={j.id} className={`surface p-4 flex flex-col gap-3 ${j.status === "OUT" && j.isOverdue ? "border-rose-300" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${meta.chip}`}>
                      <KindIcon className="w-3 h-3" />
                      {meta.label}
                    </span>
                    <h3 className="font-display font-semibold text-ink text-base mt-2 leading-tight truncate">{j.garmentName}</h3>
                    <div className="num text-[11px] text-mute mt-0.5">
                      {j.garmentId} · <span className="text-plum font-semibold">{j.id}</span>
                    </div>
                  </div>
                  {j.status === "OUT" ? (
                    countdown(j)
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Received
                    </span>
                  )}
                </div>

                <div className="bg-ivory border border-line-soft rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="eyebrow-mute">Vendor</span>
                    <span className="text-xs font-semibold text-ink text-right truncate">{j.vendorName}</span>
                  </div>
                  {j.subType && <div className="text-[11px] text-ink-soft">{j.subType}</div>}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line-soft">
                    <div>
                      <div className="eyebrow-mute">Dispatched</div>
                      <div className="num text-xs font-semibold text-ink mt-0.5">{formatDate(j.outDate)}</div>
                    </div>
                    <div className="text-right">
                      <div className="eyebrow-mute">{j.status === "OUT" ? "Expected" : "Received"}</div>
                      <div className={`num text-xs font-semibold mt-0.5 ${j.status === "OUT" && j.isOverdue ? "text-rose-700" : "text-ink"}`}>
                        {j.status === "OUT" ? (j.expectedDate ? formatDate(j.expectedDate) : "—") : j.rcvDate ? formatDate(j.rcvDate) : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 mt-auto">
                  <span className="num inline-flex items-center text-xs font-semibold bg-gold-soft text-gold-dark border border-gold/30 px-2.5 py-1 rounded-full">
                    {formatINR(j.cost)}
                  </span>
                  {j.status === "OUT" && (
                    <button
                      onClick={() => {
                        setReceiveJob(j);
                        setRcvCost(String(j.cost || ""));
                      }}
                      className="px-4 min-h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-[0_1px_1px_rgba(0,0,0,0.12)] transition-colors"
                    >
                      Mark Received
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* DISPATCH NEW JOB MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-line shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line-soft">
              <div>
                <h3 className="font-display font-semibold text-stone-900 text-base">Dispatch to Vendor</h3>
                <p className="text-[11px] text-stone-500">Record garment dispatch for care/alteration</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3.5 text-xs">
              <div>
                <label className="block eyebrow-mute mb-1">
                  Select Garment *
                </label>
                <select
                  value={createGarmentId}
                  onChange={(e) => setCreateGarmentId(e.target.value)}
                  className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum font-medium"
                  required
                >
                  {garments.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.id} — {g.name} ({g.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block eyebrow-mute mb-1">
                    Care Kind *
                  </label>
                  <select
                    value={createKind}
                    onChange={(e) => setCreateKind(e.target.value as CareKind)}
                    className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum font-semibold"
                  >
                    <option value="DRY_CLEAN">Commercial Dry Clean</option>
                    <option value="STITCHING">Tailor Alteration</option>
                    <option value="REPAIR">Embroidery / Repair</option>
                  </select>
                </div>

                <div>
                  <label className="block eyebrow-mute mb-1">
                    Vendor / Tailor *
                  </label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Salim Tailor"
                    className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block eyebrow-mute mb-1">
                    Dispatch Date
                  </label>
                  <input
                    type="date"
                    value={outDate}
                    onChange={(e) => setOutDate(e.target.value)}
                    className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block eyebrow-mute mb-1">
                    Expected Return Date
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block eyebrow-mute mb-1">
                    Care Instructions / Sub-type
                  </label>
                  <input
                    type="text"
                    value={subType}
                    onChange={(e) => setSubType(e.target.value)}
                    placeholder="e.g. Hemline stitch, steam iron"
                    className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum font-medium"
                  />
                </div>

                <div>
                  <label className="block eyebrow-mute mb-1">
                    Estimated Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block eyebrow-mute mb-1">
                  Vendor Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Handover invoice #341"
                  className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-line-soft">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 min-h-11 rounded-xl border border-line text-stone-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 min-h-11 bg-plum hover:bg-plum-dark text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin text-gold-light" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Confirm Dispatch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIVE CARE MODAL */}
      {receiveJob && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-line shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line-soft">
              <div>
                <span className="font-mono text-xs text-plum font-bold">{receiveJob.id}</span>
                <h3 className="font-display font-semibold text-base text-stone-900">
                  Receive Piece from Vendor
                </h3>
              </div>
              <button
                onClick={() => setReceiveJob(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 bg-stone-50 rounded-xl space-y-1">
                <div>Piece: <strong>{receiveJob.garmentName}</strong></div>
                <div>Vendor: <strong>{receiveJob.vendorName}</strong></div>
              </div>

              <div>
                <label className="block eyebrow-mute mb-1">
                  Received Date *
                </label>
                <input
                  type="date"
                  value={rcvDate}
                  onChange={(e) => setRcvDate(e.target.value)}
                  className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum font-mono font-medium"
                />
              </div>

              <div>
                <label className="block eyebrow-mute mb-1">
                  New Garment Stock Status *
                </label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as any)}
                  className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum font-semibold"
                >
                  <option value="AVAILABLE">Available for Rent</option>
                  <option value="RETURNED_CLEANING">Still Needs Cleaning</option>
                  <option value="DAMAGED_REPAIR">Needs More Repair</option>
                </select>
              </div>

              <div>
                <label className="block eyebrow-mute mb-1">
                  Actual Service Cost Paid (₹)
                </label>
                <input
                  type="number"
                  value={rcvCost}
                  onChange={(e) => setRcvCost(e.target.value)}
                  placeholder="e.g. 350"
                  className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-line-soft">
              <button
                onClick={() => setReceiveJob(null)}
                className="flex-1 min-h-11 rounded-xl border border-line text-stone-700 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReceiveJob}
                disabled={receiving}
                className="flex-1 min-h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5"
              >
                {receiving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Save to Stock</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
