"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Shirt,
  MapPin,
  Calendar,
  Sparkles,
  Clock,
  History,
  TrendingUp,
  ShieldCheck,
  Check,
  AlertCircle,
  Loader2,
  Camera,
  Upload,
  Trash2,
  Edit2,
  CalendarDays,
} from "lucide-react";
import { garmentsApi, photosApi } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { GarmentDetailDto, GarmentStatus } from "@/types/api";
import { useAuth } from "@/context/AuthContext";

function GarmentDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { isAdmin } = useAuth();

  const [garment, setGarment] = useState<GarmentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "photos">("overview");

  // Status Change
  const [newStatus, setNewStatus] = useState<GarmentStatus>("AVAILABLE");
  const [statusNote, setStatusNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Rack & Shelf Edit
  const [isEditingRack, setIsEditingRack] = useState(false);
  const [rack, setRack] = useState("");
  const [shelf, setShelf] = useState("");
  const [savingRack, setSavingRack] = useState(false);

  // Photo Upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const loadGarment = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await garmentsApi.getById(id);
      setGarment(data);
      setNewStatus(data.status);
      setRack(data.rack);
      setShelf(data.shelf || "");
    } catch (err: any) {
      setError(err?.message || "Failed to load garment");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadGarment();
  }, [loadGarment]);

  const handleUpdateStatus = async () => {
    if (!garment) return;
    setUpdatingStatus(true);
    try {
      await garmentsApi.updateStatus(garment.id, {
        status: newStatus,
        note: statusNote.trim() || undefined,
      });
      await loadGarment();
      alert(`Status updated to ${newStatus}`);
    } catch (err: any) {
      alert(err?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveRack = async () => {
    if (!garment || !rack.trim()) return;
    setSavingRack(true);
    try {
      await garmentsApi.updateLocation(garment.id, {
        rack: rack.trim(),
        shelf: shelf.trim() || undefined,
      });
      setIsEditingRack(false);
      await loadGarment();
    } catch (err: any) {
      alert(err?.message || "Failed to update rack");
    } finally {
      setSavingRack(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !garment) return;

    if (file.size > 400 * 1024) {
      setPhotoError("Photo must be smaller than 400 KB. Please compress before uploading.");
      return;
    }

    setUploadingPhoto(true);
    setPhotoError(null);

    try {
      // 1. Presign
      const presign = await photosApi.presign({
        garmentId: garment.id,
        kind: garment.photos?.length === 0 ? "MAIN" : "DETAIL",
        contentType: file.type === "image/jpeg" ? "image/jpeg" : "image/webp",
        bytes: file.size,
      });

      // 2. Upload binary
      await photosApi.uploadBinary(presign.uploadUrl, file);

      // 3. Register in database
      await photosApi.register({
        objectKey: presign.objectKey,
        kind: garment.photos?.length === 0 ? "MAIN" : "DETAIL",
        garmentId: garment.id,
      });

      await loadGarment();
    } catch (err: any) {
      setPhotoError(err?.message || "Upload failed");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;
    try {
      await photosApi.delete(photoId);
      await loadGarment();
    } catch (err: any) {
      alert(err?.message || "Failed to delete photo");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E8DFD1] p-16 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#4B1835] mx-auto mb-2" />
        <div className="text-xs text-stone-500">Loading garment details...</div>
      </div>
    );
  }

  if (error || !garment) {
    return (
      <div className="bg-white rounded-2xl border border-[#E8DFD1] p-16 text-center space-y-3">
        <div className="text-rose-600 font-bold text-sm">Garment SKU not found</div>
        <p className="text-xs text-stone-500">{error || "Please verify the costume SKU ID."}</p>
        <Link
          href="/erp/inventory"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg min-h-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Inventory</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & SKU Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E8DFD1] shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/erp/inventory"
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors min-h-10"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-[#4B1835]/10 text-[#4B1835] px-2.5 py-0.5 rounded-full">
                {garment.id}
              </span>
              <StatusBadge status={garment.status} />
            </div>
            <h1 className="font-serif font-bold text-lg md:text-xl text-stone-900 mt-1">
              {garment.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/erp/bookings/new?sku=${garment.id}`}
            className="px-4 py-2 bg-[#4B1835] hover:bg-[#521624] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Create Booking</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Details & Photos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Image & Media Gallery */}
        <div className="bg-white rounded-2xl border border-[#E8DFD1] p-5 shadow-2xs space-y-4">
          <div className="h-80 bg-stone-100 rounded-xl overflow-hidden relative border border-stone-200">
            <img
              src={
                garment.mainPhotoUrl ||
                garment.photos?.[0]?.url ||
                "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600"
              }
              alt={garment.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2.5 right-2.5">
              <StatusBadge status={garment.status} />
            </div>
          </div>

          {/* Photo Gallery Thumbnails */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 uppercase mb-2">
              <span>Costume Photos ({garment.photos?.length || 0}/8)</span>
              <label className="flex items-center gap-1 text-[11px] text-[#4B1835] hover:underline cursor-pointer">
                <Upload className="w-3 h-3" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/webp,image/jpeg"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                />
              </label>
            </div>

            {photoError && (
              <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[11px] mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{photoError}</span>
              </div>
            )}

            {uploadingPhoto && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2 mb-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span>Uploading garment photo...</span>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {garment.photos?.map((p) => (
                <div
                  key={p.id}
                  className="h-16 rounded-lg overflow-hidden border border-stone-200 relative group bg-stone-50"
                >
                  <img src={p.url} alt={p.kind} className="w-full h-full object-cover" />
                  {isAdmin && (
                    <button
                      onClick={() => handleDeletePhoto(p.id)}
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Location & Godown Rack info */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-700 uppercase text-[10px] tracking-wider">
                Godown Warehouse Location
              </span>
              <button
                onClick={() => setIsEditingRack(!isEditingRack)}
                className="text-[11px] text-[#4B1835] font-semibold flex items-center gap-1 hover:underline"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditingRack ? "Cancel" : "Change"}</span>
              </button>
            </div>

            {isEditingRack ? (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  value={rack}
                  onChange={(e) => setRack(e.target.value)}
                  placeholder="Rack name (e.g. Rack A-01)"
                  className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs"
                />
                <input
                  type="text"
                  value={shelf}
                  onChange={(e) => setShelf(e.target.value)}
                  placeholder="Shelf (e.g. Shelf 2)"
                  className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs"
                />
                <button
                  onClick={handleSaveRack}
                  disabled={savingRack}
                  className="w-full py-1.5 bg-[#4B1835] text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1 min-h-10"
                >
                  {savingRack ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Location</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-stone-800 font-semibold">
                <MapPin className="w-4 h-4 text-[#4B1835] shrink-0" />
                <span>
                  {garment.rack} {garment.shelf ? `· ${garment.shelf}` : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Columns (2 cols): Details, Financials, History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tariffs & Key Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-[#E8DFD1] shadow-2xs">
              <span className="text-[11px] text-stone-500 font-medium">Rental Tariff</span>
              <div className="font-mono font-bold text-lg text-[#4B1835] mt-0.5">
                {formatINR(garment.rentalPrice)}
              </div>
              <span className="text-[10px] text-stone-400">per 3-day booking</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E8DFD1] shadow-2xs">
              <span className="text-[11px] text-stone-500 font-medium">Refundable Deposit</span>
              <div className="font-mono font-bold text-lg text-stone-900 mt-0.5">
                {formatINR(garment.securityDeposit)}
              </div>
              <span className="text-[10px] text-stone-400">returned on inspection</span>
            </div>

            {isAdmin && garment.purchaseCost !== undefined && (
              <div className="bg-white p-4 rounded-2xl border border-[#E8DFD1] shadow-2xs">
                <span className="text-[11px] text-stone-500 font-medium">Purchase Cost</span>
                <div className="font-mono font-bold text-lg text-stone-600 mt-0.5">
                  {formatINR(garment.purchaseCost)}
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">Asset Value</span>
              </div>
            )}
          </div>

          {/* Specifications Card */}
          <div className="bg-white rounded-2xl border border-[#E8DFD1] p-5 shadow-2xs space-y-4">
            <h3 className="font-bold text-stone-900 text-sm border-b border-stone-100 pb-2">
              Garment Specifications &amp; Sizing
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold">Category</span>
                <div className="font-semibold text-stone-800 mt-0.5">{garment.category}</div>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold">Size</span>
                <div className="font-semibold text-stone-800 mt-0.5">{garment.size}</div>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold">Colour</span>
                <div className="font-semibold text-stone-800 mt-0.5">{garment.colour || "—"}</div>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold">Fabric</span>
                <div className="font-semibold text-stone-800 mt-0.5">{garment.fabric || "—"}</div>
              </div>
            </div>

            {garment.description && (
              <div className="pt-2 border-t border-stone-100 text-xs">
                <span className="text-stone-400 text-[10px] uppercase font-bold block mb-1">
                  Design &amp; Fitting Description
                </span>
                <p className="text-stone-700 leading-relaxed bg-[#FBF8F2] p-3 rounded-xl border border-stone-200/60">
                  {garment.description}
                </p>
              </div>
            )}
          </div>

          {/* Status Update Card */}
          <div className="bg-white rounded-2xl border border-[#E8DFD1] p-5 shadow-2xs space-y-3">
            <h3 className="font-bold text-stone-900 text-sm">Update Asset Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as GarmentStatus)}
                  className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-semibold text-stone-800"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="OUT_ON_RENT">Out on Rent</option>
                  <option value="RETURNED_CLEANING">Cleaning Pending</option>
                  <option value="IN_CARE">In Care / Alteration</option>
                  <option value="DAMAGED_REPAIR">Damaged / Repair</option>
                  <option value="UNAVAILABLE">Unavailable / Retired</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Status Note (Optional)
                </label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Sent for minor zari repair"
                  className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                onClick={handleUpdateStatus}
                disabled={updatingStatus}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5"
              >
                {updatingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Status Change</span>
              </button>
            </div>
          </div>

          {/* Booking History & Lifetime Utilization */}
          <div className="bg-white rounded-2xl border border-[#E8DFD1] p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-stone-500" />
                <span>Booking History ({garment.history?.length || 0})</span>
              </h3>

              {isAdmin && garment.stats && (
                <div className="text-xs text-stone-600 font-mono">
                  Earned: <span className="font-bold text-emerald-700">{formatINR(garment.stats.revenue)}</span>
                </div>
              )}
            </div>

            {garment.history && garment.history.length > 0 ? (
              <div className="divide-y divide-stone-100 text-xs">
                {garment.history.map((h, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-stone-800">
                        {h.customerName}
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        {h.from} → {h.to}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-stone-400">{h.bookingId}</span>
                      <StatusBadge status={h.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-stone-400">
                No past bookings recorded for this garment yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GarmentDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading garment unit...</div>}>
      <GarmentDetailContent />
    </Suspense>
  );
}
