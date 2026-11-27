import React from "react";
import { Shirt } from "lucide-react";
import { cn } from "@/lib/utils";

interface CostumeThumbProps {
  src?: string;
  alt: string;
  /** SKU shown on the fallback placeholder */
  code?: string;
  className?: string;
  imgClassName?: string;
}

/** Costume photo, or an ivory medallion placeholder (no external image is fetched for the fallback). */
export function CostumeThumb({ src, alt, code, className, imgClassName }: CostumeThumbProps) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-ivory-deep", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" className={cn("w-full h-full object-cover", imgClassName)} />
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={`${alt} (no photo yet)`}
      className={cn("relative overflow-hidden bg-gradient-to-br from-gold-soft to-ivory-deep flex flex-col items-center justify-center gap-1", className)}
    >
      <span className="w-9 h-9 rounded-full border border-dashed border-gold/60 flex items-center justify-center bg-white/60">
        <Shirt className="w-4 h-4 text-gold-dark" />
      </span>
      {code && <span className="num text-[10px] font-semibold text-gold-dark tracking-wide">{code}</span>}
    </div>
  );
}
