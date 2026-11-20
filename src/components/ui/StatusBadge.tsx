import React from "react";
import { cn } from "@/lib/utils";
import { GarmentStatus, BookingStatus } from "@/types";

interface StatusBadgeProps {
  status: GarmentStatus | BookingStatus | string;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  let colorStyle = "bg-slate-50 text-slate-700 border-slate-200";
  let dotColor = "bg-slate-400";
  let displayLabel = status.replace(/_/g, " ");

  switch (status) {
    case "AVAILABLE":
      colorStyle = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      dotColor = "bg-emerald-500";
      displayLabel = "Available";
      break;

    case "BOOKED":
    case "RESERVED":
    case "PICKUP_PENDING":
      colorStyle = "bg-amber-50 text-amber-700 border-amber-200/80";
      dotColor = "bg-amber-500";
      displayLabel = status === "BOOKED" ? "Booked" : status.replace(/_/g, " ");
      break;

    case "OUT_ON_RENT":
    case "RENTED":
      colorStyle = "bg-blue-50 text-blue-700 border-blue-200/80";
      dotColor = "bg-blue-500";
      displayLabel = "Out on rent";
      break;

    case "RETURNED_CLEANING":
    case "RETURN_RECEIVED":
    case "IN_LAUNDRY":
    case "INSPECTION_PENDING":
      colorStyle = "bg-purple-50 text-purple-700 border-purple-200/80";
      dotColor = "bg-purple-500";
      displayLabel = "Cleaning pending";
      break;

    case "DAMAGED_REPAIR":
    case "DAMAGED":
    case "UNDER_REPAIR":
    case "REPAIR_PENDING":
      colorStyle = "bg-rose-50 text-rose-700 border-rose-200/80";
      dotColor = "bg-rose-500";
      displayLabel = "In repair";
      break;

    case "UNAVAILABLE":
    case "RETIRED":
      colorStyle = "bg-slate-100 text-slate-600 border-slate-200";
      dotColor = "bg-slate-400";
      displayLabel = "Unavailable";
      break;

    case "CONFIRMED":
      colorStyle = "bg-amber-50 text-amber-700 border-amber-200/80";
      dotColor = "bg-amber-500";
      displayLabel = "Confirmed";
      break;

    case "COMPLETED":
    case "FULLY_REFUNDED":
      colorStyle = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      dotColor = "bg-emerald-500";
      displayLabel = "Completed";
      break;

    case "CANCELLED":
      colorStyle = "bg-rose-50 text-rose-700 border-rose-200/80";
      dotColor = "bg-rose-500";
      displayLabel = "Cancelled";
      break;

    case "HELD":
      colorStyle = "bg-amber-50 text-amber-700 border-amber-200/80";
      dotColor = "bg-amber-500";
      displayLabel = "Deposit held";
      break;

    default:
      colorStyle = "bg-slate-50 text-slate-700 border-slate-200";
      dotColor = "bg-slate-400";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border tracking-tight",
        colorStyle,
        className
      )}
    >
      {showDot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />}
      <span>{displayLabel}</span>
    </span>
  );
}