import React from "react";
import { cn } from "@/lib/utils";
import { GarmentStatus, BookingStatus } from "@/types";

interface StatusBadgeProps {
  status: GarmentStatus | BookingStatus | string;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  let colorStyle = "bg-slate-50 text-slate-800 border-slate-300 font-semibold";
  let dotColor = "bg-slate-500";
  let displayLabel = status.replace(/_/g, " ");

  switch (status) {
    case "AVAILABLE":
      colorStyle = "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold";
      dotColor = "bg-emerald-600";
      displayLabel = "Available";
      break;

    case "BOOKED":
    case "RESERVED":
    case "PICKUP_PENDING":
      colorStyle = "bg-amber-50 text-amber-900 border-amber-300 font-semibold";
      dotColor = "bg-amber-600";
      displayLabel = status === "BOOKED" ? "Booked" : status.replace(/_/g, " ");
      break;

    case "OUT_ON_RENT":
    case "RENTED":
      colorStyle = "bg-blue-50 text-blue-900 border-blue-300 font-semibold";
      dotColor = "bg-blue-600";
      displayLabel = "Out on rent";
      break;

    case "RETURNED_CLEANING":
    case "RETURN_RECEIVED":
    case "IN_LAUNDRY":
    case "INSPECTION_PENDING":
      colorStyle = "bg-purple-50 text-purple-900 border-purple-300 font-semibold";
      dotColor = "bg-purple-600";
      displayLabel = "Cleaning pending";
      break;

    case "IN_CARE":
      colorStyle = "bg-amber-50 text-amber-900 border-amber-300 font-semibold";
      dotColor = "bg-amber-600";
      displayLabel = "In Care";
      break;

    case "DAMAGED_REPAIR":
    case "DAMAGED":
    case "UNDER_REPAIR":
    case "REPAIR_PENDING":
      colorStyle = "bg-rose-50 text-rose-900 border-rose-300 font-semibold";
      dotColor = "bg-rose-600";
      displayLabel = "In repair";
      break;

    case "UNAVAILABLE":
    case "RETIRED":
      colorStyle = "bg-slate-100 text-slate-700 border-slate-300 font-semibold";
      dotColor = "bg-slate-500";
      displayLabel = "Unavailable";
      break;

    case "CONFIRMED":
      colorStyle = "bg-amber-50 text-amber-900 border-amber-300 font-semibold";
      dotColor = "bg-amber-600";
      displayLabel = "Confirmed";
      break;

    case "COMPLETED":
    case "FULLY_REFUNDED":
      colorStyle = "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold";
      dotColor = "bg-emerald-600";
      displayLabel = "Completed";
      break;

    case "CANCELLED":
      colorStyle = "bg-rose-50 text-rose-900 border-rose-300 font-semibold";
      dotColor = "bg-rose-600";
      displayLabel = "Cancelled";
      break;

    case "HELD":
      colorStyle = "bg-amber-50 text-amber-900 border-amber-300 font-semibold";
      dotColor = "bg-amber-600";
      displayLabel = "Deposit held";
      break;

    default:
      colorStyle = "bg-slate-50 text-slate-800 border-slate-300 font-semibold";
      dotColor = "bg-slate-500";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-tight shadow-[0_1px_1px_rgba(0,0,0,0.02)]",
        colorStyle,
        className
      )}
    >
      {showDot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />}
      <span>{displayLabel}</span>
    </span>
  );
}