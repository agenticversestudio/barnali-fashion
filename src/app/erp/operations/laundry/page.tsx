"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  CheckCircle2,
  Calendar,
  Building2,
  AlertCircle,
  Shirt,
  X,
  ShieldCheck,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR, formatDate } from "@/lib/utils";
import { LaundryJob, GarmentUnit } from "@/types";

export default function LaundryPage() {
  const [jobs, setJobs] = useState<LaundryJob[]>([]);
  const [garments, setGarments] = useState<GarmentUnit[]>([]);
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  // Dispatch Form
  const [selectedGarmentId, setSelectedGarmentId] = useState("");
  const [vendorName, setVendorName] = useState("Maa Samleswari Dry Cleaners, Bargarh");
  const [washingType, setWashingType] = useState<LaundryJob["washingType"]>("Delicate Zari Handwash");
  const [expectedDate, setExpectedDate] = useState("2026-11-12");
  const [cost, setCost] = useState("450");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setJobs(DataStore.getLaundryJobs());
    const gList = DataStore.getGarments();
    setGarments(gList);
    if (gList.length > 0) setSelectedGarmentId(gList[0].id);
  }, []);

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const garment = garments.find((g) => g.id === selectedGarmentId);
    if (!garment) return;

    DataStore.addLaundryJob({
      garmentUnitId: garment.id,
      productName: garment.productName,
      vendorName,
      washingType,
      sentDate: new Date().toISOString().split("T")[0],
      expectedDate,
      cost: Number(cost) || 400,
      notes,
    });

    // Mark garment unit status as IN_LAUNDRY
    DataStore.updateGarmentStatus(garment.id, "IN_LAUNDRY", `Dispatched to ${vendorName}`);

    setJobs(DataStore.getLaundryJobs());
    setGarments(DataStore.getGarments());
    setShowDispatchModal(false);
    alert(`Garment ${garment.id} dispatched to ${vendorName} successfully!`);
  };

  const handleApprove = (jobId: string) => {
    const success = DataStore.approveLaundryJob(jobId);
    if (success) {
      alert("Quality check passed! Garment unit is now marked AVAILABLE in showroom stock.");
      setJobs(DataStore.getLaundryJobs());
      setGarments(DataStore.getGarments());
    }
  };

  const inProgressJobs = jobs.filter((j) => j.status === "IN_PROGRESS" || j.status === "SENT");
  const completedJobs = jobs.filter((j) => j.status === "QUALITY_APPROVED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8C6F3B] font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-[#4B1835]" />
            <span>Fabric Sanitization &amp; Zari Care</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#27222A]">Laundry &amp; Dry Cleaning</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Track garment hygiene cycles with Bargarh partner cleaners, turnaround deadlines, and post-wash quality approvals.
          </p>
        </div>

        <button
          onClick={() => setShowDispatchModal(true)}
          className="bg-[#4B1835] hover:bg-[#320F23] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4 text-[#D4B67F]" />
          <span>Dispatch Unit to Laundry</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-[#EFE9DD] shadow-xs">
          <div className="text-gray-400 font-semibold uppercase text-[10px]">Currently at Cleaners</div>
          <div className="text-2xl font-bold text-cyan-700 mt-1">{inProgressJobs.length} units</div>
          <div className="text-gray-500 text-[11px] mt-0.5">Awaiting return &amp; steam press</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#EFE9DD] shadow-xs">
          <div className="text-gray-400 font-semibold uppercase text-[10px]">Partner Vendors</div>
          <div className="text-lg font-bold text-gray-900 mt-1">2 Specialized Cleaners</div>
          <div className="text-gray-500 text-[11px] mt-0.5">Maa Samleswari &amp; Shree Ganesh</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#EFE9DD] shadow-xs">
          <div className="text-gray-400 font-semibold uppercase text-[10px]">Quality Approved This Month</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{completedJobs.length} pieces</div>
          <div className="text-gray-500 text-[11px] mt-0.5">Restocked to showroom racks</div>
        </div>
      </div>

      {/* In-Progress Batches */}
      <div className="bg-white rounded-2xl border border-[#EFE9DD] p-5 shadow-xs space-y-4">
        <div className="font-bold text-gray-900 text-sm pb-2 border-b border-[#EFE9DD] flex items-center justify-between">
          <span>Active Laundry Jobs In Process ({inProgressJobs.length})</span>
          <span className="text-xs text-gray-400 font-normal">Quarantined from booking inventory</span>
        </div>

        {inProgressJobs.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">
            No garments currently at the dry cleaners.
          </div>
        ) : (
          <div className="space-y-3">
            {inProgressJobs.map((j) => (
              <div
                key={j.id}
                className="p-4 bg-[#FBF9F5] rounded-xl border border-[#E8DFD1] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#4B1835] bg-white px-2 py-0.5 rounded border border-[#E8DFD1]">
                      {j.garmentUnitId}
                    </span>
                    <span className="font-bold text-gray-900 text-sm">{j.productName}</span>
                  </div>
                  <div className="text-gray-600 mt-1 flex flex-wrap items-center gap-4 text-[11px]">
                    <span className="flex items-center gap-1 font-medium text-gray-800">
                      <Building2 className="w-3.5 h-3.5 text-[#B89558]" />
                      {j.vendorName}
                    </span>
                    <span>Washing: <strong>{j.washingType}</strong></span>
                    <span>Sent: {formatDate(j.sentDate)}</span>
                    <span className="text-[#4B1835] font-bold">
                      Expected Return: {formatDate(j.expectedDate)}
                    </span>
                  </div>
                  {j.notes && (
                    <div className="text-[11px] text-gray-500 mt-1 italic">Note: {j.notes}</div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="font-bold text-gray-900 font-mono">{formatINR(j.cost)}</div>
                    <span className="text-[10px] text-cyan-700 font-bold uppercase bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                      In Laundry
                    </span>
                  </div>

                  <button
                    onClick={() => handleApprove(j.id)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Approve &amp; Restock</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EFE9DD] max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DD]">
              <div className="flex items-center gap-2 font-bold text-sm text-[#4B1835]">
                <Sparkles className="w-4 h-4 text-[#B89558]" />
                <span>Dispatch Garment to Laundry</span>
              </div>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDispatch} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Select Garment Unit *
                </label>
                <select
                  value={selectedGarmentId}
                  onChange={(e) => setSelectedGarmentId(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-mono font-bold"
                >
                  {garments.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.id} — {g.productName} ({g.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Dry Clean Vendor *
                </label>
                <select
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-semibold"
                >
                  <option value="Maa Samleswari Dry Cleaners, Bargarh">
                    Maa Samleswari Dry Cleaners, Bargarh
                  </option>
                  <option value="Shree Ganesh Steam Cleaners, Bargarh Road">
                    Shree Ganesh Steam Cleaners, Bargarh Road
                  </option>
                  <option value="Poshaak Care Studio, Sambalpur">
                    Poshaak Care Studio, Sambalpur
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Care Treatment *
                  </label>
                  <select
                    value={washingType}
                    onChange={(e) => setWashingType(e.target.value as any)}
                    className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-semibold"
                  >
                    <option value="Delicate Zari Handwash">Delicate Zari Handwash</option>
                    <option value="Standard Dry Clean">Standard Dry Clean</option>
                    <option value="Steam Pressing & Sanitization">Steam Pressing</option>
                    <option value="Spot Stain Removal">Spot Stain Removal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Expected Return Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Cleaning Cost (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Special Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Do not machine spin; wrap heavy stone beads"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-[#EFE9DD] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4B1835] hover:bg-[#320F23] text-white font-bold rounded-xl shadow-xs"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
