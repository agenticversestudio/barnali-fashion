import { describe, expect, it } from "vitest";
import { addDays, daysBetween, depositStatusAfter, lateDays, quote, settle } from "@/server/pricing";

describe("quote", () => {
  it("owner formula: rental + deposit + dry clean + transit − advance = balance", () => {
    const q = quote({
      items: [{ rentalPrice: 5000, securityDeposit: 3000 }, { rentalPrice: 2000, securityDeposit: 1500 }],
      dryCleanCharge: 300,
      transitCharge: 200,
      paymentsIn: 2000,
    });
    expect(q).toEqual({ rentalTotal: 7000, depositTotal: 4500, dryCleanCharge: 300, transitCharge: 200, grandTotal: 12000, balanceDue: 10000 });
  });
  it("single garment, no extras, no payment", () => {
    expect(quote({ items: [{ rentalPrice: 3500, securityDeposit: 4000 }] })).toMatchObject({ grandTotal: 7500, balanceDue: 7500 });
  });
  it("zero deposit garment", () => {
    expect(quote({ items: [{ rentalPrice: 1000, securityDeposit: 0 }] })).toMatchObject({ depositTotal: 0, grandTotal: 1000 });
  });
  it("fully paid → balance 0; overpaid never negative", () => {
    const items = [{ rentalPrice: 1000, securityDeposit: 500 }];
    expect(quote({ items, paymentsIn: 1500 }).balanceDue).toBe(0);
    expect(quote({ items, paymentsIn: 9999 }).balanceDue).toBe(0);
  });
  it("empty cart is all zeros", () => {
    expect(quote({ items: [] })).toMatchObject({ rentalTotal: 0, grandTotal: 0, balanceDue: 0 });
  });
});

describe("dates", () => {
  it("daysBetween across month end and year end", () => {
    expect(daysBetween("2026-01-31", "2026-02-01")).toBe(1);
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
  });
  it("leap day", () => {
    expect(daysBetween("2028-02-28", "2028-03-01")).toBe(2);
    expect(daysBetween("2026-02-28", "2026-03-01")).toBe(1);
  });
  it("addDays crosses month/year and negative", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("lateDays: on time, early, 1 late, 3 late", () => {
    expect(lateDays("2026-12-12", "2026-12-12")).toBe(0);
    expect(lateDays("2026-12-12", "2026-12-10")).toBe(0);
    expect(lateDays("2026-12-12", "2026-12-13")).toBe(1);
    expect(lateDays("2026-12-30", "2027-01-02")).toBe(3);
  });
});

describe("settle (late fee 15 % of rental per day)", () => {
  const base = { depositTotal: 3000, rentalTotal: 5000, damage: 0, cleaning: 0, lateDays: 0, latePercent: 15 };
  it("clean on-time return: full deposit back", () => {
    expect(settle(base)).toEqual({ lateFee: 0, deductions: 0, refund: 3000, additionalDue: 0 });
  });
  it("1 day late: 750 fee", () => {
    expect(settle({ ...base, lateDays: 1 })).toEqual({ lateFee: 750, deductions: 750, refund: 2250, additionalDue: 0 });
  });
  it("3 days late: 2250 fee", () => {
    expect(settle({ ...base, lateDays: 3 })).toEqual({ lateFee: 2250, deductions: 2250, refund: 750, additionalDue: 0 });
  });
  it("late + damage + cleaning, partial refund", () => {
    expect(settle({ ...base, lateDays: 1, damage: 500, cleaning: 300 })).toEqual({ lateFee: 750, deductions: 1550, refund: 1450, additionalDue: 0 });
  });
  it("deductions exactly equal deposit → refund 0, nothing due", () => {
    expect(settle({ ...base, damage: 3000 })).toEqual({ lateFee: 0, deductions: 3000, refund: 0, additionalDue: 0 });
  });
  it("damage > deposit → customer owes the excess (fixes A7)", () => {
    expect(settle({ ...base, damage: 4500 })).toEqual({ lateFee: 0, deductions: 4500, refund: 0, additionalDue: 1500 });
  });
  it("zero deposit with damage → all of it is additional due", () => {
    expect(settle({ ...base, depositTotal: 0, damage: 400 })).toEqual({ lateFee: 0, deductions: 400, refund: 0, additionalDue: 400 });
  });
  it("late fee rounds per day (15 % of 3333 = 499.95 → 500/day)", () => {
    expect(settle({ ...base, rentalTotal: 3333, lateDays: 2 }).lateFee).toBe(1000);
  });
  it("custom late percent 10 %", () => {
    expect(settle({ ...base, latePercent: 10, lateDays: 2 }).lateFee).toBe(1000);
  });
  it("0 % late fee disables it", () => {
    expect(settle({ ...base, latePercent: 0, lateDays: 5 }).lateFee).toBe(0);
  });
  it("end-to-end: dates feed settle (due Dec 30, back Jan 2 → 3 days)", () => {
    const d = lateDays("2026-12-30", "2027-01-02");
    expect(settle({ ...base, lateDays: d }).lateFee).toBe(2250);
  });
});

describe("depositStatusAfter", () => {
  it("full refund paid", () => expect(depositStatusAfter(3000, 3000, true)).toBe("REFUNDED"));
  it("partial refund paid", () => expect(depositStatusAfter(3000, 1000, true)).toBe("PARTIALLY_REFUNDED"));
  it("nothing to refund → forfeited", () => expect(depositStatusAfter(3000, 0, true)).toBe("FORFEITED"));
  it("refund not paid yet → stays HELD", () => expect(depositStatusAfter(3000, 1000, false)).toBe("HELD"));
  it("no deposit → NOT_COLLECTED", () => expect(depositStatusAfter(0, 0, true)).toBe("NOT_COLLECTED"));
});
