import React from "react";
import { cn } from "@/lib/utils";
import { GarmentStatus, BookingStatus } from "@/types";

interface StatusBadgeProps {
  status: GarmentStatus | BookingStatus | string;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  let colorStyle = "bg-stone-50 text-stone-800 border-stone-200 font-semibold";
  let dotColor = "bg-stone-500";
  let displayLabel = status.replace(/_/g, " ");

  switch (status) {
    case "AVAILABLE":
      colorStyle = "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold";
      dotColor = "bg-emerald-500";
      displayLabel = "Available";
      break;

    case "BOOKED":
    case "RESERVED":
    case "PICKUP_PENDING":
      colorStyle = "bg-amber-50 text-amber-900 border-amber-200 font-semibold";
      dotColor = "bg-amber-500";
      displayLabel = status === "BOOKED" ? "Booked" : status.replace(/_/g, " ");
      break;

    case "OUT_ON_RENT":
    case "RENTED":
      colorStyle = "bg-sky-50 text-sky-900 border-sky-200 font-semibold";
      dotColor = "bg-sky-500";
      displayLabel = "Out on rent";
      break;

    case "RETURNED_CLEANING":
    case "RETURN_RECEIVED":
    case "IN_LAUNDRY":
    case "INSPECTION_PENDING":
      colorStyle = "bg-violet-50 text-violet-900 border-violet-200 font-semibold";
      dotColor = "bg-violet-500";
      displayLabel = "Cleaning pending";
      break;

    case "IN_CARE":
      colorStyle = "bg-amber-50 text-amber-900 border-amber-200 font-semibold";
      dotColor = "bg-amber-500";
      displayLabel = "In Care";
      break;

    case "DAMAGED_REPAIR":
    case "DAMAGED":
    case "UNDER_REPAIR":
    case "REPAIR_PENDING":
      colorStyle = "bg-rose-50 text-rose-900 border-rose-200 font-semibold";
      dotColor = "bg-rose-500";
      displayLabel = "In repair";
      break;

    case "UNAVAILABLE":
    case "RETIRED":
      colorStyle = "bg-stone-100 text-stone-700 border-stone-200 font-semibold";
      dotColor = "bg-stone-500";
      displayLabel = "Unavailable";
      break;

    case "CONFIRMED":
      colorStyle = "bg-amber-50 text-amber-900 border-amber-200 font-semibold";
      dotColor = "bg-amber-500";
      displayLabel = "Confirmed";
      break;

    case "COMPLETED":
    case "FULLY_REFUNDED":
      colorStyle = "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold";
      dotColor = "bg-emerald-500";
      displayLabel = "Completed";
      break;

    case "CANCELLED":
      colorStyle = "bg-rose-50 text-rose-900 border-rose-200 font-semibold";
      dotColor = "bg-rose-500";
      displayLabel = "Cancelled";
      break;

    case "HELD":
      colorStyle = "bg-amber-50 text-amber-900 border-amber-200 font-semibold";
      dotColor = "bg-amber-500";
      displayLabel = "Deposit held";
      break;

    default:
      colorStyle = "bg-stone-50 text-stone-800 border-stone-200 font-semibold";
      dotColor = "bg-stone-500";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-tight whitespace-nowrap leading-5",
        colorStyle,
        className
      )}
    >
      {showDot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 ring-2 ring-white/80", dotColor)} />}
      <span>{displayLabel}</span>
    </span>
  );
}