"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { StitchingCareJob, DryCleanCareJob, GarmentUnit } from "@/types";

export default function StitchingAndDryCleanPage() {
  const [activeTab, setActiveTab] = useState<"stitching" | "dryclean">("stitching");
  const [stitchingJobs, setStitchingJobs] = useState<StitchingCareJob[]>([]);
  const [dryCleanJobs, setDryCleanJobs] = useState<DryCleanCareJob[]>([]);
  const [garments, setGarments] = useState<GarmentUnit[]>([]);

  // Selected Care Job for Full Details Bottom Sheet
  const [selectedCareJob, setSelectedCareJob] = useState<{
    type: "stitching" | "dryclean";
    job: StitchingCareJob | DryCleanCareJob;
  } | null>(null);

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
  const [dryNotes, setDryNotes] = useState("Post-rental steam clean & dry clean");

  // Rcv Date Action Modal
  const [rcvItem, setRcvItem] = useState<{
    type: "stitching" | "dryclean";
    id: string;
    costumeId: string;
  } | null>(null);
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
    <div className="space-y-3.5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
            Return &amp; Care
          </h1>
          <p className="text-[11px] md:text-xs text-slate-500 mt-0.5">
            After-return Stitching &amp; Washing tracker with Out Date and Rcv Date.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/erp/bookings?action=return"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Customer Return</span>
          </Link>

          {activeTab === "stitching" ? (
            <button
              onClick={() => setShowStitchingModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 bg-[#6B1D2F] hover:bg-[#551624] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Scissors className="w-4 h-4" />
              <span>Log Stitching Out</span>
            </button>
          ) : (
            <button
              onClick={() => setShowDryCleanModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 bg-[#6B1D2F] hover:bg-[#551624] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Log Washing Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Segmented Control Toggle */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E6E4DF] w-full sm:max-w-xs shadow-2xs">
        <button
          onClick={() => setActiveTab("stitching")}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "stitching"
              ? "bg-[#6B1D2F] text-white font-semibold shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Tailor Stitching ({stitchingJobs.length})
        </button>

        <button
          onClick={() => setActiveTab("dryclean")}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "dryclean"
              ? "bg-[#6B1D2F] text-white font-semibold shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Dry Cleaning ({dryCleanJobs.length})
        </button>
      </div>

      {/* ========================================================= */}
      {/* MOBILE CARE CARDS (< 768px): 4-ROW ZERO-SCROLL LAYOUT     */}
      {/* ========================================================= */}
      <div className="block md:hidden space-y-3">
        {activeTab === "stitching" ? (
          stitchingJobs.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-[#E6E4DF] text-center text-xs text-slate-500 shadow-2xs">
              No tailoring jobs in register.
            </div>
          ) : (
            stitchingJobs.map((job) => {
              const isOut = job.status === "OUT" || !job.rcvDate;
              return (
                <div
                  key={job.id}
                  className="bg-white rounded-xl border border-[#E6E4DF] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-2.5"
                >
                  {/* Row 1: Header (Costume ID left, Status Badge right) */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#6B1D2F] bg-rose-50/60 px-2 py-0.5 rounded border border-rose-200/60">
                      {job.costumeId}
                    </span>
                    {isOut ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-300">
                        With Tailor
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        Available
                      </span>
                    )}
                  </div>

                  {/* Row 2: Body Block (Title on own line, vendor below, Out/Rcv date pairs) */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-slate-900 leading-snug">
                      {job.costumeName}
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.tailorName}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-[#FAF9F6] border border-[#EFECE6] p-2.5 rounded-lg text-xs mt-1">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Out Date</span>
                        <span className="font-mono font-semibold text-slate-800">{job.outDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Rcv Date</span>
                        {job.rcvDate ? (
                          <span className="font-mono font-semibold text-emerald-800">{job.rcvDate}</span>
                        ) : (
                          <span className="font-medium text-amber-800">Pending</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Notes Box */}
                  {job.notes && (
                    <div className="bg-[#FAF9F6] border border-[#EFECE6] p-2.5 rounded-lg text-[11px] text-slate-700 italic">
                      &ldquo;{job.notes}&rdquo;
                    </div>
                  )}

                  {/* Row 4: Footer (Details left, Primary Action right) */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#EFECE6] gap-2">
                    <button
                      onClick={() => setSelectedCareJob({ type: "stitching", job })}
                      className="h-8 px-3 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-[#E6E4DF] hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      Details
                    </button>

                    {isOut && (
                      <button
                        onClick={() => {
                          setRcvItem({
                            type: "stitching",
                            id: job.id,
                            costumeId: job.costumeId,
                          });
                          setRcvDate("2026-11-08");
                        }}
                        className="h-8 px-3.5 bg-[#6B1D2F] hover:bg-[#551624] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                      >
                        Mark Received
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )
        ) : dryCleanJobs.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-[#E6E4DF] text-center text-xs text-slate-500 shadow-2xs">
            No dry cleaning jobs in register.
          </div>
        ) : (
          dryCleanJobs.map((job) => {
            const isOut = job.status === "OUT" || !job.rcvDate;
            return (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-[#E6E4DF] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-2.5"
              >
                {/* Row 1: Header (Costume ID left, Status Badge right) */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#6B1D2F] bg-rose-50/60 px-2 py-0.5 rounded border border-rose-200/60">
                    {job.costumeId}
                  </span>
                  {isOut ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-300">
                      At Cleaner
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                      Available
                    </span>
                  )}
                </div>

                {/* Row 2: Body Block (Title on own line, vendor below, Out/Rcv date pairs) */}
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-900 leading-snug">
                    {job.costumeName}
                  </div>
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.vendorName}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#FAF9F6] border border-[#EFECE6] p-2.5 rounded-lg text-xs mt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Out Date</span>
                      <span className="font-mono font-semibold text-slate-800">{job.outDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Rcv Date</span>
                      {job.rcvDate ? (
                        <span className="font-mono font-semibold text-emerald-800">{job.rcvDate}</span>
                      ) : (
                        <span className="font-medium text-amber-800">Pending</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Row 3: Notes Box */}
                {job.notes && (
                  <div className="bg-[#FAF9F6] border border-[#EFECE6] p-2.5 rounded-lg text-[11px] text-slate-700 italic">
                    &ldquo;{job.notes}&rdquo;
                  </div>
                )}

                {/* Row 4: Footer (Details left, Primary Action right) */}
                <div className="flex items-center justify-between pt-2 border-t border-[#EFECE6] gap-2">
                  <button
                    onClick={() => setSelectedCareJob({ type: "dryclean", job })}
                    className="h-8 px-3 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-[#E6E4DF] hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    Details
                  </button>

                  {isOut && (
                    <button
                      onClick={() => {
                        setRcvItem({
                          type: "dryclean",
                          id: job.id,
                          costumeId: job.costumeId,
                        });
                        setRcvDate("2026-11-08");
                      }}
                      className="h-8 px-3.5 bg-[#6B1D2F] hover:bg-[#551624] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    >
                      Mark Received
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================= */}
      {/* DESKTOP PRESENTATION (>= 768px): FULL TABLES              */}
      {/* ========================================================= */}
      <div className="hidden md:block">
        {activeTab === "stitching" && (
          <div className="bg-white rounded-xl border border-[#E6E4DF] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F6] border-b border-[#E6E4DF] text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
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
                <tbody className="divide-y divide-[#EFECE6]">
                  {stitchingJobs.map((job) => {
                    const isOut = job.status === "OUT" || !job.rcvDate;
                    return (
                      <tr key={job.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs font-bold text-[#6B1D2F]">
                            {job.costumeId}
                          </span>
                          <div className="font-medium text-slate-900 mt-0.5">{job.costumeName}</div>
                        </td>

                        <td className="py-3 px-3 text-slate-700 font-medium">{job.tailorName}</td>

                        <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                          {job.outDate}
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                          {job.rcvDate ? (
                            <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{job.rcvDate}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">Pending</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-slate-600 max-w-xs">{job.notes || "—"}</td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                              <span>With Tailor</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              <span>Available</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedCareJob({ type: "stitching", job })}
                              className="px-2.5 py-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-[#E6E4DF] rounded-lg text-[11px] font-medium transition-colors"
                            >
                              Details
                            </button>
                            {isOut ? (
                              <button
                                onClick={() => {
                                  setRcvItem({
                                    type: "stitching",
                                    id: job.id,
                                    costumeId: job.costumeId,
                                  });
                                  setRcvDate("2026-11-08");
                                }}
                                className="px-3 py-1 bg-[#6B1D2F] hover:bg-[#551624] text-white font-semibold rounded-lg text-xs transition-colors"
                              >
                                Mark Received
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400">Complete</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "dryclean" && (
          <div className="bg-white rounded-xl border border-[#E6E4DF] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F6] border-b border-[#E6E4DF] text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
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
                <tbody className="divide-y divide-[#EFECE6]">
                  {dryCleanJobs.map((job) => {
                    const isOut = job.status === "OUT" || !job.rcvDate;
                    return (
                      <tr key={job.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs font-bold text-[#6B1D2F]">
                            {job.costumeId}
                          </span>
                          <div className="font-medium text-slate-900 mt-0.5">{job.costumeName}</div>
                        </td>

                        <td className="py-3 px-3 text-slate-700 font-medium">{job.vendorName}</td>

                        <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                          {job.outDate}
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                          {job.rcvDate ? (
                            <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{job.rcvDate}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">Pending</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-slate-600 max-w-xs">{job.notes || "—"}</td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                              <span>At Cleaner</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              <span>Available</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedCareJob({ type: "dryclean", job })}
                              className="px-2.5 py-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-[#E6E4DF] rounded-lg text-[11px] font-medium transition-colors"
                            >
                              Details
                            </button>
                            {isOut ? (
                              <button
                                onClick={() => {
                                  setRcvItem({
                                    type: "dryclean",
                                    id: job.id,
                                    costumeId: job.costumeId,
                                  });
                                  setRcvDate("2026-11-08");
                                }}
                                className="px-3 py-1 bg-[#6B1D2F] hover:bg-[#551624] text-white font-semibold rounded-lg text-xs transition-colors"
                              >
                                Mark Received
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400">Complete</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* CARE DETAILS BOTTOM SHEET                                 */}
      {/* ========================================================= */}
      {selectedCareJob && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-4 sm:p-6 text-xs max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-[#6B1D2F]">
                  {selectedCareJob.job.costumeId}
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {selectedCareJob.type === "stitching" ? "Tailor Alteration" : "Dry Cleaning"}
                </span>
              </div>
              <button
                onClick={() => setSelectedCareJob(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                <div className="text-sm font-semibold text-slate-900">
                  {selectedCareJob.job.costumeName}
                </div>
                <div className="text-[11px] text-slate-500">
                  Assigned Vendor:{" "}
                  <strong className="text-slate-800">
                    {"tailorName" in selectedCareJob.job
                      ? selectedCareJob.job.tailorName
                      : selectedCareJob.job.vendorName}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block">Out Date (Dispatched)</span>
                  <span className="font-bold text-slate-800">{selectedCareJob.job.outDate}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block">Rcv Date (Received)</span>
                  <span className="font-bold text-slate-800">
                    {selectedCareJob.job.rcvDate ? (
                      <span className="text-emerald-700">{selectedCareJob.job.rcvDate}</span>
                    ) : (
                      <span className="text-amber-700">Pending Return</span>
                    )}
                  </span>
                </div>
              </div>

              {selectedCareJob.job.notes && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                    Care &amp; Fitting Notes
                  </span>
                  <p className="text-slate-700 mt-0.5">{selectedCareJob.job.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCareJob(null)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Close
                </button>
                {(!selectedCareJob.job.rcvDate || selectedCareJob.job.status === "OUT") && (
                  <button
                    type="button"
                    onClick={() => {
                      setRcvItem({
                        type: selectedCareJob.type,
                        id: selectedCareJob.job.id,
                        costumeId: selectedCareJob.job.costumeId,
                      });
                      setRcvDate("2026-11-08");
                      setSelectedCareJob(null);
                    }}
                    className="px-4 py-1.5 bg-[#6B1D2F] hover:bg-[#551624] text-white rounded-lg font-semibold shadow-xs"
                  >
                    Mark Received
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD STITCHING MODAL --- */}
      {showStitchingModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-4 sm:p-6 text-xs animate-in slide-in-from-bottom sm:zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-900">Log Tailor Stitching Out</span>
              <button
                onClick={() => setShowStitchingModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStitching} className="mt-3 space-y-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                  Select Costume Piece *
                </label>
                <select
                  value={stitchCostumeId}
                  onChange={(e) => setStitchCostumeId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  {garments.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.id} — {g.productName} ({g.size})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                  Tailor Name *
                </label>
                <input
                  type="text"
                  required
                  value={stitchTailor}
                  onChange={(e) => setStitchTailor(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                  Out Date (Dispatched to Tailor) *
                </label>
                <input
                  type="date"
                  required
                  value={stitchOutDate}
                  onChange={(e) => setStitchOutDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                  Fitting / Alteration Notes *
                </label>
                <textarea
                  rows={2}
                  required
                  value={stitchNotes}
                  onChange={(e) => setStitchNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStitchingModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#6B1D2F] hover:bg-[#551624] text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD DRY CLEAN MODAL --- */}
      {showDryCleanModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-4 sm:p-6 text-xs animate-in slide-in-from-bottom sm:zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-900">Log Washing / Dry Clean Out</span>
              <button
                onClick={() => setShowDryCleanModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDryClean} className="mt-3 space-y-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                  Select Costume Piece *
                </label>
                <select
                  value={dryCostumeId}
                  onChange={(e) => setDryCostumeId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  {garments.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.id} — {g.productName} ({g.size})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                  Dry Cleaner Vendor *
                </label>
                <input
                  type="text"
                  required
                  value={dryVendor}
                  onChange={(e) => setDryVendor(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                  Out Date (Dispatched to Cleaner) *
                </label>
                <input
                  type="date"
                  required
                  value={dryOutDate}
                  onChange={(e) => setDryOutDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                  Care &amp; Stain Notes
                </label>
                <textarea
                  rows={2}
                  value={dryNotes}
                  onChange={(e) => setDryNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDryCleanModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#6B1D2F] hover:bg-[#551624] text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RCV DATE CONFIRMATION MODAL --- */}
      {rcvItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-4 sm:p-6 text-xs animate-in slide-in-from-bottom sm:zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-900">
                Record Received (Rcv Date)
              </span>
              <button
                onClick={() => setRcvItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <p className="text-slate-600 text-xs">
                Mark piece <strong className="text-[#6B1D2F]">{rcvItem.costumeId}</strong> as
                received back in studio. It will automatically return to <strong>Available</strong>{" "}
                state.
              </p>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                  Received Date (Rcv Date) *
                </label>
                <input
                  type="date"
                  required
                  value={rcvDate}
                  onChange={(e) => setRcvDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-medium"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRcvItem(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRcv}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-xs"
                >
                  Confirm Received
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
