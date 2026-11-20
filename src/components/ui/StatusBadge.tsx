import React from "react";
import { cn } from "@/lib/utils";
import { GarmentStatus, BookingStatus } from "@/types";

interface StatusBadgeProps {
  status: GarmentStatus | BookingStatus | string;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  let colorStyle = "bg-gray-100 text-gray-800 border-gray-200";
  let dotColor = "bg-gray-400";
  let displayLabel = status.replace(/_/g, " ");

  switch (status) {
    case "AVAILABLE":
      colorStyle = "bg-emerald-50 text-emerald-800 border-emerald-300";
      dotColor = "bg-emerald-500";
      displayLabel = "Available";
      break;

    case "BOOKED":
    case "RESERVED":
    case "PICKUP_PENDING":
      colorStyle = "bg-amber-50 text-amber-800 border-amber-300";
      dotColor = "bg-amber-500";
      displayLabel = status === "BOOKED" ? "Booked" : status.replace(/_/g, " ");
      break;

    case "OUT_ON_RENT":
    case "RENTED":
      colorStyle = "bg-blue-50 text-blue-800 border-blue-300";
      dotColor = "bg-blue-600";
      displayLabel = "Out on rent";
      break;

    case "RETURNED_CLEANING":
    case "RETURN_RECEIVED":
    case "IN_LAUNDRY":
    case "INSPECTION_PENDING":
      colorStyle = "bg-purple-50 text-purple-800 border-purple-300";
      dotColor = "bg-purple-600";
      displayLabel = "Returned – cleaning pending";
      break;

    case "DAMAGED_REPAIR":
    case "DAMAGED":
    case "UNDER_REPAIR":
    case "REPAIR_PENDING":
      colorStyle = "bg-rose-50 text-rose-800 border-rose-300";
      dotColor = "bg-rose-600";
      displayLabel = "Damaged / Repair";
      break;

    case "UNAVAILABLE":
    case "RETIRED":
      colorStyle = "bg-gray-100 text-gray-700 border-gray-300";
      dotColor = "bg-gray-500";
      displayLabel = "Unavailable";
      break;

    case "CONFIRMED":
      colorStyle = "bg-amber-50 text-amber-800 border-amber-300";
      dotColor = "bg-amber-500";
      displayLabel = "Confirmed";
      break;

    case "COMPLETED":
    case "FULLY_REFUNDED":
      colorStyle = "bg-emerald-50 text-emerald-800 border-emerald-300";
      dotColor = "bg-emerald-500";
      displayLabel = "Completed";
      break;

    case "CANCELLED":
      colorStyle = "bg-rose-50 text-rose-800 border-rose-300";
      dotColor = "bg-rose-500";
      displayLabel = "Cancelled";
      break;

    case "HELD":
      colorStyle = "bg-yellow-50 text-yellow-800 border-yellow-300";
      dotColor = "bg-yellow-500";
      displayLabel = "Held";
      break;

    default:
      colorStyle = "bg-gray-50 text-gray-700 border-gray-300";
      dotColor = "bg-gray-400";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide",
        colorStyle,
        className
      )}
    >
      {showDot && <span className={cn("w-2 h-2 rounded-full shrink-0", dotColor)} />}
      <span>{displayLabel}</span>
    </span>
  );
}
