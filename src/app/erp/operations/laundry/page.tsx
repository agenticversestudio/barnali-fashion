"use client";

import React, { useState, useEffect } from "react";
import {
  Scissors,
  Plus,
  CheckCircle2,
  Sparkles,
  X,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { StitchingCareJob, DryCleanCareJob, GarmentUnit } from "@/types";

export default function StitchingAndDryCleanPage() {
  const [activeTab, setActiveTab] = useState<"stitching" | "dryclean">("stitching");
  const [stitchingJobs, setStitchingJobs] = useState<StitchingCareJob[]>([]);
  const [dryCleanJobs, setDryCleanJobs] = useState<DryCleanCareJob[]>([]);
  const [garments, setGarments] = useState<GarmentUnit[]>([]);

  // Add Stitching Modal
  const [showStitchingModal, setShowStitchingModal] = useState(false);
  const [stitchCostumeId, setStitchCostumeId] = useState("");
  const [stitchTailor, setStitchTailor] = useState("Master Salim (Bargarh)");
  const [stitchOutDate, setStitchOutDate] = useState("2026-11-08");
  const [stitchNotes, setStitchNotes] = useState("Blouse alteration & hem tuck");

  // Add Dry Clean Modal
  const [showDryCleanModal, setShowDryCleanModal] = useState(false);
  const [dryCostumeId, setDryCostumeId] = useState("");
  const [dryVendor, setDryVendor] = useState("Maa Samleswari Dry Cleaners");
  const [dryOutDate, setDryOutDate] = useState("2026-11-08");
  const [dryNotes, setDryNotes] = useState("Post-rental dry clean");

  // Rcv Date Action Modal
  const [rcvItem, setRcvItem] = useState<{ type: "stitching" | "dryclean"; id: string; costumeId: string } | null>(null);
  const [rcvDate, setRcvDate] = useState("2026-11-08");

  const loadData = () => {
    setStitchingJobs(DataStore.getStitchingJobs());
    setDryCleanJobs(DataStore.getDryCleanJobs());
    const gList = DataStore.getGarments();
    setGarments(gList);
    if (gList.length > 0) {
      setStitchCostumeId(gList[0].id);
      setDryCostumeId(gList[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateStitching = (e: React.FormEvent) => {
    e.preventDefault();
    const g = garments.find((item) => item.id === stitchCostumeId);
    DataStore.addStitchingJob({
      costumeId: stitchCostumeId,
      costumeName: g ? g.productName : "Costume Item",
      customerName: "Counter Walk-in",
      tailorName: stitchTailor,
      outDate: stitchOutDate,
      notes: stitchNotes,
    });
    DataStore.updateGarmentStatus(stitchCostumeId, "DAMAGED_REPAIR", `Sent to ${stitchTailor}`);
    loadData();
    setShowStitchingModal(false);
  };

  const handleCreateDryClean = (e: React.FormEvent) => {
    e.preventDefault();
    const g = garments.find((item) => item.id === dryCostumeId);
    DataStore.addDryCleanJob({
      costumeId: dryCostumeId,
      costumeName: g ? g.productName : "Costume Item",
      vendorName: dryVendor,
      outDate: dryOutDate,
      notes: dryNotes,
    });
    DataStore.updateGarmentStatus(dryCostumeId, "RETURNED_CLEANING", `Sent to ${dryVendor}`);
    loadData();
    setShowDryCleanModal(false);
  };

  const handleConfirmRcv = () => {
    if (!rcvItem) return;
    if (rcvItem.type === "stitching") {
      DataStore.markStitchingReceived(rcvItem.id, rcvDate);
    } else {
      DataStore.markDryCleanReceived(rcvItem.id, rcvDate);
    }
    loadData();
    setRcvItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Care &amp; Laundry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log dispatch and receipt dates for tailoring alterations and fabric dry cleaning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "stitching" ? (
            <button
              onClick={() => setShowStitchingModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#6B1D2F] hover:bg-[#551624] text-white text-xs font-medium rounded-lg shadow-xs transition-colors"
            >
              <Scissors className="w-4 h-4" />
              <span>Log Stitching Out</span>
            </button>
          ) : (
            <button
              onClick={() => setShowDryCleanModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#6B1D2F] hover:bg-[#551624] text-white text-xs font-medium rounded-lg shadow-xs transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Log Washing Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 max-w-xs">
        <button
          onClick={() => setActiveTab("stitching")}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
            activeTab === "stitching"
              ? "bg-white text-slate-900 shadow-xs font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Tailor Stitching ({stitchingJobs.length})
        </button>

        <button
          onClick={() => setActiveTab("dryclean")}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
            activeTab === "dryclean"
              ? "bg-white text-slate-900 shadow-xs font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Dry Cleaning ({dryCleanJobs.length})
        </button>
      </div>

      {/* --- TAB 1: STITCHING --- */}
      {activeTab === "stitching" && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-[#E2E8F0] text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Costume</th>
                  <th className="py-3 px-3">Tailor</th>
                  <th className="py-3 px-3">Out Date</th>
                  <th className="py-3 px-3">Received Date</th>
                  <th className="py-3 px-3">Fitting Notes</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stitchingJobs.map((job) => {
                  const isOut = job.status === "OUT" || !job.rcvDate;
                  return (
                    <tr key={job.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-semibold text-slate-900">
                          {job.costumeId}
                        </span>
                        <div className="font-medium text-slate-700 mt-0.5">{job.costumeName}</div>
                      </td>

                      <td className="py-3 px-3 text-slate-600 font-medium">{job.tailorName}</td>

                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {job.outDate}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {job.rcvDate ? (
                          <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{job.rcvDate}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">Pending</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-500 max-w-xs">{job.notes || "—"}</td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span>With Tailor</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Available</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isOut ? (
                          <button
                            onClick={() => {
                              setRcvItem({ type: "stitching", id: job.id, costumeId: job.costumeId });
                              setRcvDate("2026-11-08");
                            }}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs ml-auto transition-colors"
                          >
                            Mark Received
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Complete</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 2: DRY CLEANING --- */}
      {activeTab === "dryclean" && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-[#E2E8F0] text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Costume</th>
                  <th className="py-3 px-3">Dry Cleaner</th>
                  <th className="py-3 px-3">Out Date</th>
                  <th className="py-3 px-3">Received Date</th>
                  <th className="py-3 px-3">Care Notes</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dryCleanJobs.map((job) => {
                  const isOut = job.status === "OUT" || !job.rcvDate;
                  return (
                    <tr key={job.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-semibold text-slate-900">
                          {job.costumeId}
                        </span>
                        <div className="font-medium text-slate-700 mt-0.5">{job.costumeName}</div>
                      </td>

                      <td className="py-3 px-3 text-slate-600 font-medium">{job.vendorName}</td>

                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {job.outDate}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {job.rcvDate ? (
                          <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{job.rcvDate}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">Pending</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-500 max-w-xs">{job.notes || "—"}</td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                            <span>At Cleaner</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Available</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isOut ? (
                          <button
                            onClick={() => {
                              setRcvItem({ type: "dryclean", id: job.id, costumeId: job.costumeId });
                              setRcvDate("2026-11-08");
                            }}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs ml-auto transition-colors"
                          >
                            Mark Received
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Complete</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Dispatch to Stitching */}
      {showStitchingModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-900">Dispatch to Tailor</span>
              <button
                onClick={() => setShowStitchingModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStitching} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Costume Piece *
                </label>
                <select
                  value={stitchCostumeId}
                  onChange={(e) => setStitchCostumeId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  {garments.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.id} — {g.productName} ({g.size})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Tailor Name *
                </label>
                <input
                  type="text"
                  required
                  value={stitchTailor}
                  onChange={(e) => setStitchTailor(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Out Date *
                </label>
                <input
                  type="date"
                  required
                  value={stitchOutDate}
                  onChange={(e) => setStitchOutDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Alteration Instructions
                </label>
                <input
                  type="text"
                  value={stitchNotes}
                  onChange={(e) => setStitchNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStitchingModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#6B1D2F] hover:bg-[#551624] text-white font-medium rounded-lg text-xs"
                >
                  Save Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Dispatch to Dry Clean */}
      {showDryCleanModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-900">Dispatch to Dry Cleaning</span>
              <button
                onClick={() => setShowDryCleanModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDryClean} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Costume Piece *
                </label>
                <select
                  value={dryCostumeId}
                  onChange={(e) => setDryCostumeId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  {garments.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.id} — {g.productName} ({g.size})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Dry Clean Vendor *
                </label>
                <input
                  type="text"
                  required
                  value={dryVendor}
                  onChange={(e) => setDryVendor(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Out Date *
                </label>
                <input
                  type="date"
                  required
                  value={dryOutDate}
                  onChange={(e) => setDryOutDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Care Instructions
                </label>
                <input
                  type="text"
                  value={dryNotes}
                  onChange={(e) => setDryNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDryCleanModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#6B1D2F] hover:bg-[#551624] text-white font-medium rounded-lg text-xs"
                >
                  Save Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Received Date */}
      {rcvItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 text-xs text-center animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900">
              Confirm Received Piece
            </h3>
            <p className="text-slate-500 mt-1">
              Mark piece <strong className="font-mono text-slate-900">{rcvItem.costumeId}</strong> received back into inventory.
            </p>

            <div className="my-4 text-left">
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Received Date *
              </label>
              <input
                type="date"
                required
                value={rcvDate}
                onChange={(e) => setRcvDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRcvItem(null)}
                className="flex-1 py-1.5 border border-slate-200 rounded-lg font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRcv}
                className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg shadow-xs"
              >
                Confirm (Available)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}