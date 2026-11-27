import React from "react";
import { cn } from "@/lib/utils";
import { GarmentStatus, BookingStatus } from "@/types";

interface StatusBadgeProps {
  status: GarmentStatus | BookingStatus | string;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  let colorStyle = "bg-gray-100 text-gray-700 border-gray-200 font-medium";
  let dotColor = "bg-gray-500";
  let displayLabel = status.replace(/_/g, " ");

  switch (status) {
    case "AVAILABLE":
    case "COMPLETED":
    case "FULLY_REFUNDED":
    case "PAID":
      colorStyle = "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold";
      dotColor = "bg-emerald-500";
      displayLabel = status === "AVAILABLE" ? "Available" : status === "COMPLETED" ? "Completed" : status.replace(/_/g, " ");
      break;

    case "BOOKED":
    case "CONFIRMED":
    case "RESERVED":
    case "PICKUP_PENDING":
    case "OUT_ON_RENT":
    case "RENTED":
    case "TRIAL":
    case "PENDING":
    case "HELD":
      colorStyle = "bg-amber-100 text-amber-800 border-amber-200 font-semibold";
      dotColor = "bg-amber-500";
      displayLabel = status === "OUT_ON_RENT" ? "Out on rent" : status === "BOOKED" ? "Booked" : status === "HELD" ? "Deposit held" : status.replace(/_/g, " ");
      break;

    case "OVERDUE":
    case "BALANCE_DUE":
    case "DAMAGED":
    case "DAMAGED_REPAIR":
    case "UNDER_REPAIR":
    case "REPAIR_PENDING":
    case "CANCELLED":
      colorStyle = "bg-rose-50 text-rose-800 border-rose-200 font-semibold";
      dotColor = "bg-rose-500";
      displayLabel = status === "DAMAGED_REPAIR" || status === "UNDER_REPAIR" ? "In repair" : status.replace(/_/g, " ");
      break;

    case "RETURNED_CLEANING":
    case "RETURN_RECEIVED":
    case "IN_LAUNDRY":
    case "INSPECTION_PENDING":
    case "IN_CARE":
    case "ALTERATION":
      colorStyle = "bg-gray-100 text-gray-700 border-gray-200 font-semibold";
      dotColor = "bg-violet-500";
      displayLabel = status === "RETURNED_CLEANING" ? "Cleaning pending" : status === "IN_CARE" ? "In Care" : status.replace(/_/g, " ");
      break;

    case "UNAVAILABLE":
    case "RETIRED":
      colorStyle = "bg-gray-100 text-gray-500 border-gray-200 font-medium";
      dotColor = "bg-gray-400";
      displayLabel = "Unavailable";
      break;

    default:
      colorStyle = "bg-gray-100 text-gray-700 border-gray-200 font-medium";
      dotColor = "bg-gray-500";
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