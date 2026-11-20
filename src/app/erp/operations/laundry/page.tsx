"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Scissors,
  Plus,
  CheckCircle2,
  Calendar,
  Building2,
  AlertCircle,
  Shirt,
  X,
  Clock,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StitchingCareJob, DryCleanCareJob, GarmentUnit } from "@/types";

export default function StitchingAndDryCleanPage() {
  const [activeTab, setActiveTab] = useState<"stitching" | "dryclean">("stitching");
  const [stitchingJobs, setStitchingJobs] = useState<StitchingCareJob[]>([]);
  const [dryCleanJobs, setDryCleanJobs] = useState<DryCleanCareJob[]>([]);
  const [garments, setGarments] = useState<GarmentUnit[]>([]);

  // Add Stitching Modal
  const [showStitchingModal, setShowStitchingModal] = useState(false);
  const [stitchCostumeId, setStitchCostumeId] = useState("");
  const [stitchTailor, setStitchTailor] = useState("Master Salim (Station Road, Bargarh)");
  const [stitchOutDate, setStitchOutDate] = useState("2026-11-08");
  const [stitchNotes, setStitchNotes] = useState("Blouse fitting & hem alteration");

  // Add Dry Clean Modal
  const [showDryCleanModal, setShowDryCleanModal] = useState(false);
  const [dryCostumeId, setDryCostumeId] = useState("");
  const [dryVendor, setDryVendor] = useState("Maa Samleswari Dry Cleaners, Bargarh");
  const [dryOutDate, setDryOutDate] = useState("2026-11-08");
  const [dryNotes, setDryNotes] = useState("Standard gentle dry clean post return");

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
      customerName: "Counter Walk-in / Fitting",
      tailorName: stitchTailor,
      outDate: stitchOutDate,
      notes: stitchNotes,
    });
    // Garment status becomes DAMAGED_REPAIR (Red)
    DataStore.updateGarmentStatus(stitchCostumeId, "DAMAGED_REPAIR", `Sent to ${stitchTailor}`);
    loadData();
    setShowStitchingModal(false);
    alert(`Costume ${stitchCostumeId} dispatched to Tailor. Status updated to "Damaged / Repair 🔴".`);
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
    // Garment status becomes RETURNED_CLEANING (Purple)
    DataStore.updateGarmentStatus(dryCostumeId, "RETURNED_CLEANING", `Sent to ${dryVendor}`);
    loadData();
    setShowDryCleanModal(false);
    alert(`Costume ${dryCostumeId} dispatched to Dry Clean. Status updated to "Cleaning pending 🟣".`);
  };

  const handleConfirmRcv = () => {
    if (!rcvItem) return;
    if (rcvItem.type === "stitching") {
      DataStore.markStitchingReceived(rcvItem.id, rcvDate);
    } else {
      DataStore.markDryCleanReceived(rcvItem.id, rcvDate);
    }
    loadData();
    const cId = rcvItem.costumeId;
    setRcvItem(null);
    alert(`Costume ${cId} Received on ${rcvDate}! Status automatically restored to "Available 🟢" on rack.`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8C6F3B] font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-[#4B1835]" />
            <span>Post-Return Care Registers</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#27222A]">
            Stitching &amp; Washing / Dry Clean
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Client Rule: After return track Out Date and Rcv Date. Once Rcv Date is logged, costume returns to 🟢 Available.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "stitching" ? (
            <button
              onClick={() => setShowStitchingModal(true)}
              className="bg-[#4B1835] hover:bg-[#320F23] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all"
            >
              <Scissors className="w-4 h-4 text-[#D4B67F]" />
              <span>Log Stitching Out Date</span>
            </button>
          ) : (
            <button
              onClick={() => setShowDryCleanModal(true)}
              className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>Log Washing Out Date</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 bg-[#F3EFE7] p-1.5 rounded-2xl border border-[#E8DFD1] max-w-md">
        <button
          onClick={() => setActiveTab("stitching")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "stitching"
              ? "bg-[#4B1835] text-white shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>1. Stitching Tracker ({stitchingJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("dryclean")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "dryclean"
              ? "bg-purple-700 text-white shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>2. Washing / Dry Clean ({dryCleanJobs.length})</span>
        </button>
      </div>

      {/* --- TAB 1: STITCHING TRACKER --- */}
      {activeTab === "stitching" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#EFE9DD] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF5EB] border-b border-[#EFE9DD] text-[#8C6F3B] uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Costume Code &amp; Item</th>
                    <th className="py-3 px-3">Tailor Name</th>
                    <th className="py-3 px-3">Out Date</th>
                    <th className="py-3 px-3">Rcv (Received) Date</th>
                    <th className="py-3 px-3">Stitching / Fitting Notes</th>
                    <th className="py-3 px-3">Current Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1ECE3]">
                  {stitchingJobs.map((job) => {
                    const isOut = job.status === "OUT" || !job.rcvDate;
                    return (
                      <tr key={job.id} className="hover:bg-[#FBF9F5] transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-xs bg-[#4B1835] text-white px-2 py-0.5 rounded">
                            {job.costumeId}
                          </span>
                          <div className="font-semibold text-gray-900 mt-1">{job.costumeName}</div>
                          {job.customerName && (
                            <div className="text-[10px] text-gray-500">For: {job.customerName}</div>
                          )}
                        </td>

                        <td className="py-3 px-3 font-medium text-gray-800">{job.tailorName}</td>

                        <td className="py-3 px-3 font-mono font-bold text-amber-800 whitespace-nowrap">
                          {job.outDate}
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-emerald-800 whitespace-nowrap">
                          {job.rcvDate ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{job.rcvDate}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400 font-normal italic">Pending</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-gray-600 max-w-xs">{job.notes || "—"}</td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
                              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                              <span>With Tailor (Repair)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                              <span>Available in Stock</span>
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
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 ml-auto shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Log Rcv Date</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-gray-400 font-medium">Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: WASHING / DRY CLEAN TRACKER --- */}
      {activeTab === "dryclean" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#EFE9DD] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF5EB] border-b border-[#EFE9DD] text-[#8C6F3B] uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Costume Code &amp; Item</th>
                    <th className="py-3 px-3">Dry Cleaner / Vendor</th>
                    <th className="py-3 px-3">Out Date</th>
                    <th className="py-3 px-3">Rcv (Received) Date</th>
                    <th className="py-3 px-3">Washing / Pressing Notes</th>
                    <th className="py-3 px-3">Current Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1ECE3]">
                  {dryCleanJobs.map((job) => {
                    const isOut = job.status === "OUT" || !job.rcvDate;
                    return (
                      <tr key={job.id} className="hover:bg-[#FBF9F5] transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-xs bg-purple-700 text-white px-2 py-0.5 rounded">
                            {job.costumeId}
                          </span>
                          <div className="font-semibold text-gray-900 mt-1">{job.costumeName}</div>
                        </td>

                        <td className="py-3 px-3 font-medium text-gray-800">{job.vendorName}</td>

                        <td className="py-3 px-3 font-mono font-bold text-amber-800 whitespace-nowrap">
                          {job.outDate}
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-emerald-800 whitespace-nowrap">
                          {job.rcvDate ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{job.rcvDate}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400 font-normal italic">At Dry Cleaner</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-gray-600 max-w-xs">{job.notes || "—"}</td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-300">
                              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                              <span>Cleaning Pending</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                              <span>Available in Stock</span>
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
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 ml-auto shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Log Rcv Date</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-gray-400 font-medium">Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: DISPATCH TO STITCHING --- */}
      {showStitchingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EFE9DD] max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DD]">
              <div className="flex items-center gap-2 font-bold text-sm text-[#4B1835]">
                <Scissors className="w-4 h-4 text-[#8C6F3B]" />
                <span>Log Costume Sent to Stitching / Tailor</span>
              </div>
              <button
                onClick={() => setShowStitchingModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStitching} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Select Costume *
                </label>
                <select
                  value={stitchCostumeId}
                  onChange={(e) => setStitchCostumeId(e.target.value)}
                  className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-bold"
                >
                  {garments.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.id} — {g.productName} ({g.size})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Tailor Name *
                </label>
                <input
                  type="text"
                  required
                  value={stitchTailor}
                  onChange={(e) => setStitchTailor(e.target.value)}
                  className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Out Date *
                </label>
                <input
                  type="date"
                  required
                  value={stitchOutDate}
                  onChange={(e) => setStitchOutDate(e.target.value)}
                  className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Fitting / Alteration Notes
                </label>
                <input
                  type="text"
                  value={stitchNotes}
                  onChange={(e) => setStitchNotes(e.target.value)}
                  className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-[#EFE9DD] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStitchingModal(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4B1835] hover:bg-[#320F23] text-white font-bold rounded-xl shadow-xs"
                >
                  Record Out Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: DISPATCH TO DRY CLEAN --- */}
      {showDryCleanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EFE9DD] max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DD]">
              <div className="flex items-center gap-2 font-bold text-sm text-purple-800">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Log Costume Sent to Washing / Dry Clean</span>
              </div>
              <button
                onClick={() => setShowDryCleanModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDryClean} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Select Costume *
                </label>
                <select
                  value={dryCostumeId}
                  onChange={(e) => setDryCostumeId(e.target.value)}
                  className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-bold"
                >
                  {garments.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.id} — {g.productName} ({g.size})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Dry Clean Vendor / Dhobi *
                </label>
                <input
                  type="text"
                  required
                  value={dryVendor}
                  onChange={(e) => setDryVendor(e.target.value)}
                  className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Out Date *
                </label>
                <input
                  type="date"
                  required
                  value={dryOutDate}
                  onChange={(e) => setDryOutDate(e.target.value)}
                  className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Washing / Sanitization Instructions
                </label>
                <input
                  type="text"
                  value={dryNotes}
                  onChange={(e) => setDryNotes(e.target.value)}
                  className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-[#EFE9DD] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDryCleanModal(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Record Out Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: CONFIRM RCV DATE --- */}
      {rcvItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EFE9DD] max-w-sm w-full p-6 text-xs text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#27222A]">
              Record Received Date (Rcv Date)
            </h3>
            <p className="text-gray-500 mt-1">
              Confirm receiving costume <strong className="text-[#4B1835] font-mono">{rcvItem.costumeId}</strong> back into showroom stock.
            </p>

            <div className="my-4 text-left">
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Rcv (Received) Date *
              </label>
              <input
                type="date"
                required
                value={rcvDate}
                onChange={(e) => setRcvDate(e.target.value)}
                className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-bold"
              />
              <p className="text-[10px] text-emerald-800 font-semibold mt-1.5">
                ⚡ Note: Logging this will instantly change costume status to 🟢 Available.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRcvItem(null)}
                className="flex-1 py-2 border rounded-xl font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRcv}
                className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
              >
                Confirm Received
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}