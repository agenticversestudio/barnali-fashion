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
import { StatusBadge } from "@/components/ui/StatusBadge";
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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 md:p-6 rounded-2xl border border-[#E8DFD1] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif font-bold text-xl md:text-2xl text-stone-900 tracking-tight">
              Care &amp; Vendor Registers
            </h1>
            <span className="text-xs font-mono font-semibold bg-[#4B1835]/10 text-[#4B1835] px-2.5 py-0.5 rounded-full">
              {filteredJobs.length} Jobs
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Track external commercial dry-cleaning, tailoring alterations &amp; repair turnaround.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#4B1835] hover:bg-[#521624] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Dispatch New Job</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-3.5 md:p-4 rounded-2xl border border-[#E8DFD1] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Kind Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar w-full sm:w-auto">
          {[
            { id: "ALL", label: "All Care" },
            { id: "DRY_CLEAN", label: "Dry Cleaning" },
            { id: "STITCHING", label: "Stitching & Fitting" },
            { id: "REPAIR", label: "Repairs" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                activeTab === tab.id
                  ? "bg-[#4B1835] text-white font-semibold"
                  : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Filter: OUT vs RECEIVED */}
        <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200 text-xs">
          <button
            onClick={() => setStatusFilter("OUT")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
              statusFilter === "OUT" ? "bg-white text-stone-900 shadow-2xs" : "text-stone-500"
            }`}
          >
            Currently Out ({careJobs.filter((j) => j.status === "OUT").length})
          </button>
          <button
            onClick={() => setStatusFilter("RECEIVED")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
              statusFilter === "RECEIVED" ? "bg-white text-stone-900 shadow-2xs" : "text-stone-500"
            }`}
          >
            Past Received
          </button>
        </div>
      </div>

      {/* Main Jobs List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E8DFD1] p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#4B1835] mx-auto mb-2" />
          <div className="text-xs text-stone-500">Loading vendor care jobs...</div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8DFD1] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-stone-800">No care jobs found</div>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {statusFilter === "OUT" ? "No garments currently at vendors." : "No completed care jobs recorded."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8DFD1] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FBF8F2] border-b border-[#E8DFD1] text-[11px] font-bold uppercase text-stone-500">
                  <th className="py-3 px-4">Job ID &amp; Piece</th>
                  <th className="py-3 px-4">Kind &amp; Vendor</th>
                  <th className="py-3 px-4">Dispatched → Expected</th>
                  <th className="py-3 px-4">Cost</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE8DB]">
                {filteredJobs.map((j) => (
                  <tr key={j.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-xs text-[#4B1835]">{j.id}</span>
                      <div className="font-semibold text-stone-900 mt-0.5">{j.garmentName}</div>
                      <span className="font-mono text-[10px] text-stone-400">SKU: {j.garmentId}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] uppercase font-bold bg-stone-100 px-2 py-0.5 rounded text-stone-700">
                        {j.kind.replace("_", " ")}
                      </span>
                      <div className="font-medium text-stone-800 mt-1">{j.vendorName}</div>
                      {j.subType && <div className="text-[11px] text-stone-500">{j.subType}</div>}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-stone-700">
                      <div>Out: {j.outDate}</div>
                      {j.status === "OUT" ? (
                        <div className={j.isOverdue ? "text-rose-700 font-bold" : "text-stone-500"}>
                          Exp: {j.expectedDate || "—"} {j.isOverdue && "(Overdue)"}
                        </div>
                      ) : (
                        <div className="text-emerald-700 font-semibold">Rcv: {j.rcvDate}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-stone-800">
                      {formatINR(j.cost)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {j.status === "OUT" ? (
                        <button
                          onClick={() => {
                            setReceiveJob(j);
                            setRcvCost(String(j.cost || ""));
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-xs"
                        >
                          Mark Received
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-semibold text-xs flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Received</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DISPATCH NEW JOB MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E8DFD1] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base">Dispatch to Vendor</h3>
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
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Select Garment *
                </label>
                <select
                  value={createGarmentId}
                  onChange={(e) => setCreateGarmentId(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-medium"
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
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Care Kind *
                  </label>
                  <select
                    value={createKind}
                    onChange={(e) => setCreateKind(e.target.value as CareKind)}
                    className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-semibold"
                  >
                    <option value="DRY_CLEAN">Commercial Dry Clean</option>
                    <option value="STITCHING">Tailor Alteration</option>
                    <option value="REPAIR">Embroidery / Repair</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Vendor / Tailor *
                  </label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Salim Tailor"
                    className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Dispatch Date
                  </label>
                  <input
                    type="date"
                    value={outDate}
                    onChange={(e) => setOutDate(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Expected Return Date
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Care Instructions / Sub-type
                  </label>
                  <input
                    type="text"
                    value={subType}
                    onChange={(e) => setSubType(e.target.value)}
                    placeholder="e.g. Hemline stitch, steam iron"
                    className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Estimated Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Vendor Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Handover invoice #341"
                  className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-[#4B1835] hover:bg-[#521624] text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin text-[#D4B67F]" /> : <CheckCircle2 className="w-4 h-4" />}
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
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-[#E8DFD1] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="font-mono text-xs text-[#4B1835] font-bold">{receiveJob.id}</span>
                <h3 className="font-serif font-bold text-base text-stone-900">
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
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Received Date *
                </label>
                <input
                  type="date"
                  value={rcvDate}
                  onChange={(e) => setRcvDate(e.target.value)}
                  className="w-full p-2 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  New Garment Stock Status *
                </label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as any)}
                  className="w-full p-2 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-semibold"
                >
                  <option value="AVAILABLE">Available for Rent</option>
                  <option value="RETURNED_CLEANING">Still Needs Cleaning</option>
                  <option value="DAMAGED_REPAIR">Needs More Repair</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Actual Service Cost Paid (₹)
                </label>
                <input
                  type="number"
                  value={rcvCost}
                  onChange={(e) => setRcvCost(e.target.value)}
                  placeholder="e.g. 350"
                  className="w-full p-2 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setReceiveJob(null)}
                className="flex-1 py-2 rounded-xl border border-stone-200 text-stone-700 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReceiveJob}
                disabled={receiving}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5"
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
