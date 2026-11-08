"use client";

import React, { useState } from "react";
import {
  Settings,
  Building2,
  Clock,
  ShieldCheck,
  Save,
  Database,
  Globe,
  RefreshCw,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";

export default function SettingsPage() {
  const [storeName, setStoreName] = useState("Barnali Fashion");
  const [phone, setPhone] = useState("+91 7978256488");
  const [address, setAddress] = useState(
    "In front of LIC Office, near Keshariya Restaurant, Bargarh Road, Bargarh, Odisha 768028"
  );
  const [bufferHours, setBufferHours] = useState("24");
  const [standardRentalDays, setStandardRentalDays] = useState("3");
  const [lateFeePerDay, setLateFeePerDay] = useState("300");
  const [gstEnabled, setGstEnabled] = useState(false);
  const [backendMode, setBackendMode] = useState<"DEMO" | "SUPABASE">("DEMO");

  const handleSave = () => {
    alert("Business parameters saved successfully!");
  };

  const handleResetData = () => {
    if (confirm("Reset all prototype data to initial seed state? This will clear any changes made in this browser session.")) {
      DataStore.resetAll();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-xs">
      <div>
        <div className="flex items-center gap-2 text-xs text-[#8C6F3B] font-semibold uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4 text-[#4B1835]" />
          <span>Operational Parameters &amp; Configuration</span>
        </div>
        <h1 className="text-2xl font-serif font-bold text-[#27222A]">Business Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Manage store location information, default buffer rules, fee structures, and execution modes.
        </p>
      </div>

      {/* Store Location Profile */}
      <div className="bg-white rounded-2xl border border-[#EFE9DD] p-6 shadow-xs space-y-4">
        <div className="font-bold text-gray-900 text-sm pb-2 border-b border-[#EFE9DD] flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#B89558]" />
          <span>Store Information &amp; Official Receipts Header</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
              Store Legal / Trade Name
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
              Official Contact Mobile / WhatsApp
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-mono font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
            Store Physical Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl"
          />
        </div>
      </div>

      {/* Rental Business Policy Parameters */}
      <div className="bg-white rounded-2xl border border-[#EFE9DD] p-6 shadow-xs space-y-4">
        <div className="font-bold text-gray-900 text-sm pb-2 border-b border-[#EFE9DD] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#B89558]" />
          <span>Rental Rules &amp; Automated Buffers</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
              Standard Rental Duration
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={standardRentalDays}
                onChange={(e) => setStandardRentalDays(e.target.value)}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold font-mono"
              />
              <span className="text-gray-500 font-semibold">Days</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">Pickup + Event + Return Day</div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
              Post-Return Cleaning Buffer
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={bufferHours}
                onChange={(e) => setBufferHours(e.target.value)}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold font-mono"
              />
              <span className="text-gray-500 font-semibold">Hours</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">Quarantine window for laundry</div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
              Default Late Fee / Day (₹)
            </label>
            <input
              type="number"
              value={lateFeePerDay}
              onChange={(e) => setLateFeePerDay(e.target.value)}
              className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold font-mono text-rose-700"
            />
            <div className="text-[10px] text-gray-400 mt-1">Calculated past 7:00 PM cutoff</div>
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={gstEnabled}
              onChange={(e) => setGstEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-[#4B1835]"
            />
            <span className="font-semibold text-gray-800">
              Enable GST Billing Computation (Requires owner GSTIN verification; default disabled)
            </span>
          </label>
        </div>
      </div>

      {/* Execution Architecture Mode */}
      <div className="bg-white rounded-2xl border border-[#EFE9DD] p-6 shadow-xs space-y-4">
        <div className="font-bold text-gray-900 text-sm pb-2 border-b border-[#EFE9DD] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#B89558]" />
            <span>Dual Execution Architecture Mode</span>
          </div>
          <span className="bg-[#FAF5EB] text-[#8C6F3B] font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-[#E8DFD1]">
            Active: {backendMode} MODE
          </span>
        </div>

        <p className="text-gray-600 leading-relaxed">
          The platform features a clean repository abstraction layer supporting two operational execution environments:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => setBackendMode("DEMO")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              backendMode === "DEMO"
                ? "bg-[#FAF5EB] border-[#B89558] shadow-xs"
                : "bg-[#FBF9F5] border-[#E8DFD1]"
            }`}
          >
            <div className="font-bold text-[#4B1835] text-sm">Demo Mode (Local Offline)</div>
            <p className="text-gray-600 text-[11px] mt-1">
              Works instantly without external database credentials. Seeded with 35+ realistic Indian wedding garments, 12 customers, active rentals, and cash closings.
            </p>
          </div>

          <div
            onClick={() => setBackendMode("SUPABASE")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              backendMode === "SUPABASE"
                ? "bg-[#FAF5EB] border-[#B89558] shadow-xs"
                : "bg-[#FBF9F5] border-[#E8DFD1]"
            }`}
          >
            <div className="font-bold text-[#4B1835] text-sm">Backend Mode (Supabase / Postgres)</div>
            <p className="text-gray-600 text-[11px] mt-1">
              Connects to managed PostgreSQL with Row-Level Security, multi-user authentication, and Cloud Storage for garment photography.
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={handleResetData}
            className="flex items-center gap-1.5 text-rose-700 hover:text-rose-800 font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Data to Factory Seed</span>
          </button>

          <button
            onClick={handleSave}
            className="bg-[#4B1835] hover:bg-[#320F23] text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-[#D4B67F]" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
}
