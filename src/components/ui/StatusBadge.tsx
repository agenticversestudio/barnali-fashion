import React from "react";
import { cn } from "@/lib/utils";
import { GarmentStatus, BookingStatus } from "@/types";

interface StatusBadgeProps {
  status: GarmentStatus | BookingStatus | string;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  let colorStyle = "bg-[#F3F0F7] text-[#5B5566] border-[#E8E2F0] font-medium";
  let dotColor = "bg-[#8C8499]";
  let displayLabel = status.replace(/_/g, " ");

  switch (status) {
    case "AVAILABLE":
    case "COMPLETED":
    case "FULLY_REFUNDED":
    case "PAID":
      colorStyle = "bg-[#D1FAE5]/80 text-[#065F46] border-[#A7F3D0] font-semibold";
      dotColor = "bg-[#059669]";
      displayLabel = status === "AVAILABLE" ? "Available" : status === "COMPLETED" ? "Completed" : status.replace(/_/g, " ");
      break;

    case "BOOKED":
    case "CONFIRMED":
    case "RESERVED":
    case "PICKUP_PENDING":
    case "TRIAL":
    case "PENDING":
    case "HELD":
      colorStyle = "bg-[#FEF3C7]/80 text-[#92400E] border-[#FDE68A] font-semibold";
      dotColor = "bg-[#D97706]";
      displayLabel = status === "BOOKED" ? "Booked" : status === "HELD" ? "Deposit held" : status.replace(/_/g, " ");
      break;

    case "OUT_ON_RENT":
    case "RENTED":
      colorStyle = "bg-[#E0E7FF]/80 text-[#3730A3] border-[#C7D2FE] font-semibold";
      dotColor = "bg-[#4F46E5]";
      displayLabel = "Out on rent";
      break;

    case "OVERDUE":
    case "BALANCE_DUE":
    case "DAMAGED":
    case "DAMAGED_REPAIR":
    case "UNDER_REPAIR":
    case "REPAIR_PENDING":
    case "CANCELLED":
      colorStyle = "bg-[#FFE4E6]/80 text-[#9F1239] border-[#FECDD3] font-semibold";
      dotColor = "bg-[#E11D48]";
      displayLabel = status === "DAMAGED_REPAIR" || status === "UNDER_REPAIR" ? "In repair" : status.replace(/_/g, " ");
      break;

    case "RETURNED_CLEANING":
    case "RETURN_RECEIVED":
    case "IN_LAUNDRY":
    case "INSPECTION_PENDING":
    case "IN_CARE":
    case "ALTERATION":
      colorStyle = "bg-[#E0F2FE]/80 text-[#075985] border-[#BAE6FD] font-semibold";
      dotColor = "bg-[#0284C7]";
      displayLabel = status === "RETURNED_CLEANING" ? "Cleaning pending" : status === "IN_CARE" ? "In Care" : status.replace(/_/g, " ");
      break;

    case "UNAVAILABLE":
    case "RETIRED":
      colorStyle = "bg-[#F3F0F7] text-[#5B5566] border-[#E8E2F0] font-medium";
      dotColor = "bg-[#8C8499]";
      displayLabel = "Unavailable";
      break;

    default:
      colorStyle = "bg-[#F3F0F7] text-[#5B5566] border-[#E8E2F0] font-medium";
      dotColor = "bg-[#8C8499]";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border tracking-tight whitespace-nowrap leading-none shadow-2xs",
        colorStyle,
        className
      )}
    >
      {showDot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />}
      <span>{displayLabel}</span>
    </span>
  );
}