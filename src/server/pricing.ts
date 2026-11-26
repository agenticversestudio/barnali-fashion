// All money rules live here (PRD §4). Pure functions, no DB, no Date timezone drift: dates are "YYYY-MM-DD" strings.
import type { DepositStatus } from "@/types/api";

export interface QuoteInput {
  items: { rentalPrice: number; securityDeposit: number }[];
  dryCleanCharge?: number;
  transitCharge?: number;
  /** all money received so far on the booking (ADVANCE + BALANCE + DEPOSIT + EXTRA), refunds excluded */
  paymentsIn?: number;
}
export interface Quote {
  rentalTotal: number;
  depositTotal: number;
  dryCleanCharge: number;
  transitCharge: number;
  grandTotal: number;
  balanceDue: number;
}

export function quote({ items, dryCleanCharge = 0, transitCharge = 0, paymentsIn = 0 }: QuoteInput): Quote {
  const rentalTotal = items.reduce((s, i) => s + i.rentalPrice, 0);
  const depositTotal = items.reduce((s, i) => s + i.securityDeposit, 0);
  const grandTotal = rentalTotal + dryCleanCharge + transitCharge + depositTotal;
  return {
    rentalTotal,
    depositTotal,
    dryCleanCharge,
    transitCharge,
    grandTotal,
    balanceDue: Math.max(0, grandTotal - paymentsIn),
  };
}

/** Whole days between two calendar dates (b - a). Uses UTC midnight so DST/timezones cannot shift it. */
export function daysBetween(a: string, b: string): number {
  const [ya, ma, da] = a.split("-").map(Number);
  const [yb, mb, db] = b.split("-").map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86_400_000);
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Late calendar days = max(0, actualReturn − dueDate). */
export function lateDays(dueDate: string, returnDate: string): number {
  return Math.max(0, daysBetween(dueDate, returnDate));
}

export interface SettleInput {
  depositTotal: number;
  rentalTotal: number;
  damage: number;
  cleaning: number;
  lateDays: number;
  /** e.g. 15 for 15 % of rental per late day */
  latePercent: number;
}
export interface Settle {
  lateFee: number;
  deductions: number;
  refund: number;
  additionalDue: number;
}

export function settle({ depositTotal, rentalTotal, damage, cleaning, lateDays: days, latePercent }: SettleInput): Settle {
  const lateFee = Math.round((rentalTotal * latePercent) / 100) * days;
  const deductions = damage + cleaning + lateFee;
  return {
    lateFee,
    deductions,
    refund: Math.max(0, depositTotal - deductions),
    additionalDue: Math.max(0, deductions - depositTotal),
  };
}

/** Deposit status once the return is settled. `refundPaidNow=false` keeps it HELD (refund still owed). */
export function depositStatusAfter(depositTotal: number, refund: number, refundPaidNow: boolean): DepositStatus {
  if (depositTotal === 0) return "NOT_COLLECTED";
  if (refund === 0) return "FORFEITED";
  if (!refundPaidNow) return "HELD";
  return refund >= depositTotal ? "REFUNDED" : "PARTIALLY_REFUNDED";
}
