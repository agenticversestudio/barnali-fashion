"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Building2,
  Clock,
  ShieldCheck,
  Save,
  Database,
  FileSpreadsheet,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { settingsApi, syncApi } from "@/lib/api";
import type { SettingsDto, SyncStatus } from "@/types/api";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/utils";

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const [settings, setSettings] = useState<SettingsDto | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Form State
  const [shopName, setShopName] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [bufferDays, setBufferDays] = useState("1");
  const [lateFeePercent, setLateFeePercent] = useState("15");
  const [defaultCareVendor, setDefaultCareVendor] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [stg, sync] = await Promise.all([
        settingsApi.get(),
        syncApi.getStatus().catch(() => null),
      ]);
      setSettings(stg);
      setSyncStatus(sync);

      setShopName(stg.shopName || "Barnali Fashion");
      setShopPhone(stg.shopPhone || "+91 7978256488");
      setShopAddress(
        stg.shopAddress ||
          "In front of LIC Office, near Keshariya Restaurant, Bargarh Road, Bargarh, Odisha 768028"
      );
      setBufferDays(String(stg.bufferDays ?? 1));
      setLateFeePercent(String(stg.lateFeePercent ?? 15));
      setDefaultCareVendor(stg.defaultCareVendor || "Royal Dry Cleaners, Bargarh");
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await settingsApi.update({
        shopName: shopName.trim(),
        shopPhone: shopPhone.trim(),
        shopAddress: shopAddress.trim(),
        bufferDays: Number(bufferDays) || 1,
        lateFeePercent: Number(lateFeePercent) || 15,
        defaultCareVendor: defaultCareVendor.trim(),
      });
      setSettings(updated);
      alert("Business parameters and store configuration saved successfully!");
    } catch (err: any) {
      alert(err?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await syncApi.syncNow();
      alert(`Google Sheets sync finished! ${res.tabs} tabs updated (${res.rows} rows).`);
      const sync = await syncApi.getStatus();
      setSyncStatus(sync);
    } catch (err: any) {
      alert(err?.message || "Google Sheets sync failed. Check server logs or Google credentials.");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#EFE9DD] p-12 text-center text-xs text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin text-[#4B1835] mx-auto mb-2" />
        Loading system configuration &amp; sync status...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-xs">
      <div>
        <div className="flex items-center gap-2 text-xs text-[#8C6F3B] font-semibold uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4 text-[#4B1835]" />
          <span>Operational Parameters &amp; Configuration</span>
        </div>
        <h1 className="text-2xl font-serif font-bold text-[#27222A]">Business Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Manage store location profile, buffer turnaround days, late fee policies, and Google Sheets sync.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Location Profile */}
        <div className="bg-white rounded-2xl border border-[#EFE9DD] p-6 shadow-xs space-y-4">
          <div className="font-bold text-gray-900 text-sm pb-2 border-b border-[#EFE9DD] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#B89558]" />
            <span>Store Profile &amp; Invoice Header</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Store Trade Name *
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Official Phone / WhatsApp *
              </label>
              <input
                type="tel" inputMode="tel"
                required
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
              Store Physical Address *
            </label>
            <input
              type="text"
              required
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl"
            />
          </div>
        </div>

        {/* Rental Business Policy Parameters */}
        <div className="bg-white rounded-2xl border border-[#EFE9DD] p-6 shadow-xs space-y-4">
          <div className="font-bold text-gray-900 text-sm pb-2 border-b border-[#EFE9DD] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#B89558]" />
            <span>Rental Policies &amp; Cleaning Quarantine Buffers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Post-Return Cleaning Buffer
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={bufferDays}
                  onChange={(e) => setBufferDays(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold font-mono"
                />
                <span className="text-gray-500 font-semibold">Days</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-1">Automatic conflict protection window</div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Late Fee Rate (% / day)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={lateFeePercent}
                  onChange={(e) => setLateFeePercent(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold font-mono text-rose-700"
                />
                <span className="text-gray-500 font-semibold">%</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-1">% of rental tariff charged per overdue day</div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Default Care Vendor
              </label>
              <input
                type="text"
                value={defaultCareVendor}
                onChange={(e) => setDefaultCareVendor(e.target.value)}
                placeholder="e.g. Royal Dry Cleaners"
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-medium"
              />
              <div className="text-[10px] text-gray-400 mt-1">Primary dry cleaning partner</div>
            </div>
          </div>

          {isAdmin && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#4B1835] hover:bg-[#320F23] disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 text-[#D4B67F]" />
                )}
                <span>Save Configuration</span>
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Google Sheets Sync & Disaster Recovery */}
      <div className="bg-white rounded-2xl border border-[#EFE9DD] p-6 shadow-xs space-y-4">
        <div className="font-bold text-gray-900 text-sm pb-2 border-b border-[#EFE9DD] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Google Sheets Live Mirror &amp; Backup Sync</span>
          </div>
          <span
            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              syncStatus?.configured
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {syncStatus?.configured ? "CONFIGURED (Nightly 23:30 IST)" : "NOT CONFIGURED"}
          </span>
        </div>

        <p className="text-gray-600 leading-relaxed">
          The ERP automatically maintains an off-site readable replica of all business records in Google Sheets across 6 dedicated tabs (Garments, Customers, Bookings, Care, Cash, Expenses).
        </p>

        {syncStatus && (
          <div className="p-3 bg-[#FAF5EB] rounded-xl border border-[#E8DFD1] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[11px] text-gray-700">
                Last Sync: <strong>{syncStatus.lastSyncAt ? formatDate(syncStatus.lastSyncAt) : "Never"}</strong>
              </div>
              {syncStatus.lastMessage && (
                <div className="text-[10px] text-gray-500 mt-0.5">{syncStatus.lastMessage}</div>
              )}
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncing}
                className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                {syncing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Sync to Google Sheets Now</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Database & Infrastructure Specifications */}
      <div className="bg-white rounded-2xl border border-[#EFE9DD] p-6 shadow-xs space-y-3">
        <div className="font-bold text-gray-900 text-sm pb-2 border-b border-[#EFE9DD] flex items-center gap-2">
          <Database className="w-4 h-4 text-[#B89558]" />
          <span>Database Architecture &amp; Zero-Cost Hosting</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
          <div className="p-3 bg-[#FBF9F5] rounded-xl border border-[#E8DFD1]">
            <div className="text-gray-400 font-semibold uppercase text-[9px]">Primary Database</div>
            <div className="font-bold text-gray-900 mt-0.5">Turso Edge SQLite</div>
            <div className="text-gray-500 text-[10px]">Region: AWS Mumbai (bom1)</div>
          </div>

          <div className="p-3 bg-[#FBF9F5] rounded-xl border border-[#E8DFD1]">
            <div className="text-gray-400 font-semibold uppercase text-[9px]">Application Runtime</div>
            <div className="font-bold text-gray-900 mt-0.5">Next.js 16 (Node.js)</div>
            <div className="text-gray-500 text-[10px]">Zero server cost tier</div>
          </div>

          <div className="p-3 bg-[#FBF9F5] rounded-xl border border-[#E8DFD1]">
            <div className="text-gray-400 font-semibold uppercase text-[9px]">Concurrency Protection</div>
            <div className="font-bold text-gray-900 mt-0.5">SQL Trigger Locks</div>
            <div className="text-gray-500 text-[10px]">Zero double booking guarantee</div>
          </div>
        </div>
      </div>
    </div>
  );
}
