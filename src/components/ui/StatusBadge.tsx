import React from "react";
import { cn } from "@/lib/utils";
import { GarmentStatus, BookingStatus } from "@/types";

interface StatusBadgeProps {
  status: GarmentStatus | BookingStatus | string;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  let colorStyle = "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB] font-medium";
  let dotColor = "bg-[#6B7280]";
  let displayLabel = status.replace(/_/g, " ");

  switch (status) {
    case "AVAILABLE":
    case "COMPLETED":
    case "FULLY_REFUNDED":
    case "PAID":
      colorStyle = "bg-[#ECFDF3] text-[#065F46] border-[#A7F3D0] font-semibold";
      dotColor = "bg-[#10B981]";
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
      colorStyle = "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] font-semibold";
      dotColor = "bg-[#F59E0B]";
      displayLabel = status === "OUT_ON_RENT" ? "Out on rent" : status === "BOOKED" ? "Booked" : status === "HELD" ? "Deposit held" : status.replace(/_/g, " ");
      break;

    case "OVERDUE":
    case "BALANCE_DUE":
    case "DAMAGED":
    case "DAMAGED_REPAIR":
    case "UNDER_REPAIR":
    case "REPAIR_PENDING":
    case "CANCELLED":
      colorStyle = "bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3] font-semibold";
      dotColor = "bg-[#F43F5E]";
      displayLabel = status === "DAMAGED_REPAIR" || status === "UNDER_REPAIR" ? "In repair" : status.replace(/_/g, " ");
      break;

    case "RETURNED_CLEANING":
    case "RETURN_RECEIVED":
    case "IN_LAUNDRY":
    case "INSPECTION_PENDING":
    case "IN_CARE":
    case "ALTERATION":
      colorStyle = "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB] font-semibold";
      dotColor = "bg-[#8B5CF6]";
      displayLabel = status === "RETURNED_CLEANING" ? "Cleaning pending" : status === "IN_CARE" ? "In Care" : status.replace(/_/g, " ");
      break;

    case "UNAVAILABLE":
    case "RETIRED":
      colorStyle = "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB] font-medium";
      dotColor = "bg-[#9CA3AF]";
      displayLabel = "Unavailable";
      break;

    default:
      colorStyle = "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB] font-medium";
      dotColor = "bg-[#6B7280]";
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