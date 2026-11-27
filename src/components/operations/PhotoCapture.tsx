"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, X, Loader2, Image as ImageIcon, AlertCircle } from "lucide-react";
import { photosApi } from "@/lib/api";
import { compressImage } from "@/lib/imageCompression";
import type { PresignRequest } from "@/types/api";

interface CapturedPhotoItem {
  id: string;
  previewUrl: string;
  sizeKb: number;
}

interface PhotoCaptureProps {
  kind: PresignRequest["kind"];
  bookingId?: string;
  garmentId?: string;
  photoIds: string[];
  onChangePhotoIds: (ids: string[]) => void;
  label?: string;
  sublabel?: string;
  maxPhotos?: number;
  disabled?: boolean;
}

export function PhotoCapture({
  kind,
  bookingId,
  garmentId,
  photoIds,
  onChangePhotoIds,
  label = "Inspection Photos",
  sublabel = "Take photo or upload; automatically compressed to <400 KB",
  maxPhotos = 6,
  disabled = false,
}: PhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<CapturedPhotoItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photoIds.length >= maxPhotos) {
      setError(`Maximum ${maxPhotos} photos allowed.`);
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgressText("Compressing image...");

    try {
      // 1. Compress image in browser to fit < 400 KB limit
      const compressed = await compressImage(file, 1600, 380 * 1024);
      setUploadProgressText(`Uploading (${Math.round(compressed.bytes / 1024)} KB)...`);

      // 2. Presign URL from server
      const presign = await photosApi.presign({
        kind,
        contentType: compressed.contentType,
        bytes: compressed.bytes,
        garmentId,
      });

      // 3. Binary PUT directly to storage / local endpoint
      await photosApi.uploadBinary(presign.uploadUrl, compressed.blob);

      // 4. Register photo in database
      setUploadProgressText("Registering photo...");
      const registered = await photosApi.register({
        objectKey: presign.objectKey,
        kind,
        bookingId,
        garmentId,
        note: kind === "DAMAGE" ? "Damage / defect evidence" : "Handover verification photo",
      });

      const photoId = registered.photo.id;
      const previewUrl = registered.photo.url || URL.createObjectURL(compressed.blob);

      const newItem: CapturedPhotoItem = {
        id: photoId,
        previewUrl,
        sizeKb: Math.round(compressed.bytes / 1024),
      };

      const updatedList = [...photos, newItem];
      setPhotos(updatedList);
      onChangePhotoIds([...photoIds, photoId]);
    } catch (err: any) {
      console.error("Photo capture failed:", err);
      setError(err?.message || "Failed to capture and upload photo");
    } finally {
      setUploading(false);
      setUploadProgressText("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = (idToRemove: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== idToRemove));
    onChangePhotoIds(photoIds.filter((id) => id !== idToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-wide">
            {label}
          </label>
          <p className="text-[10px] text-gray-500">{sublabel}</p>
        </div>
        <span className="text-[10px] font-mono font-bold text-gray-400">
          {photoIds.length} / {maxPhotos}
        </span>
      </div>

      {error && (
        <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Thumbnails list */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {photos.map((item) => (
          <div
            key={item.id}
            className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-300 bg-gray-100 shadow-xs"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.previewUrl}
              alt="Evidence photo"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleRemovePhoto(item.id)}
                disabled={disabled}
                className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors cursor-pointer"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="absolute bottom-0.5 right-1 text-[8px] bg-black/60 text-white px-1 rounded font-mono">
              {item.sizeKb}K
            </span>
          </div>
        ))}

        {/* Upload / Camera Button */}
        {photoIds.length < maxPhotos && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-gold/50 hover:border-gold bg-gold-soft/60 hover:bg-gold-soft transition-colors flex flex-col items-center justify-center text-center p-1.5 cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-gold-dark mb-1" />
                <span className="text-[9px] font-semibold text-gray-600 leading-tight">
                  {uploadProgressText || "Uploading..."}
                </span>
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 text-gold-dark mb-1" />
                <span className="text-[9px] font-bold text-gold-dark leading-tight">
                  Take Photo
                </span>
                <span className="text-[8px] text-gray-400">or upload</span>
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || uploading}
        />
      </div>
    </div>
  );
}
