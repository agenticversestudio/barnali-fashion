import React from "react";
import { cn } from "@/lib/utils";
import { GarmentStatus, BookingStatus } from "@/types";

interface StatusBadgeProps {
  status: GarmentStatus | BookingStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  let colorStyle = "bg-gray-100 text-gray-800 border-gray-200";

  switch (status) {
    case "AVAILABLE":
      colorStyle = "bg-emerald-50 text-emerald-800 border-emerald-300";
      break;
    case "RESERVED":
    case "PICKUP_PENDING":
      colorStyle = "bg-amber-50 text-amber-800 border-amber-300";
      break;
    case "PREPARING":
      colorStyle = "bg-sky-50 text-sky-800 border-sky-300";
      break;
    case "RENTED":
    case "OUT_ON_RENT":
      colorStyle = "bg-purple-50 text-purple-800 border-purple-300";
      break;
    case "RETURN_RECEIVED":
    case "INSPECTION_PENDING":
      colorStyle = "bg-indigo-50 text-indigo-800 border-indigo-300";
      break;
    case "IN_LAUNDRY":
      colorStyle = "bg-cyan-50 text-cyan-800 border-cyan-300";
      break;
    case "UNDER_REPAIR":
    case "REPAIR_PENDING":
      colorStyle = "bg-orange-50 text-orange-800 border-orange-300";
      break;
    case "QUALITY_CHECK":
      colorStyle = "bg-teal-50 text-teal-800 border-teal-300";
      break;
    case "DAMAGED":
    case "CANCELLED":
      colorStyle = "bg-rose-50 text-rose-800 border-rose-300";
      break;
    case "COMPLETED":
    case "FULLY_REFUNDED":
      colorStyle = "bg-emerald-50 text-emerald-800 border-emerald-300";
      break;
    case "HELD":
      colorStyle = "bg-yellow-50 text-yellow-800 border-yellow-300";
      break;
    default:
      colorStyle = "bg-gray-50 text-gray-700 border-gray-300";
  }

  // Format label nicely
  const label = status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide",
        colorStyle,
        className
      )}
    >
      {label}
    </span>
  );
}
