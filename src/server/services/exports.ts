import { db } from "../db";

export type Dataset = { name: string; header: string[]; rows: (string | number)[][] };
export const DATASETS = ["bookings", "payments", "cashclosings", "expenses", "garments", "customers"] as const;
export type DatasetName = (typeof DATASETS)[number];

const q = async (sql: string) => (await db().execute(sql)).rows;
const v = (x: unknown): string | number => (x === null || x === undefined ? "" : typeof x === "number" ? x : String(x));

/** Same data feeds the CSV download and the Google Sheet tabs (admin only; includes purchase cost). */
export async function dataset(name: DatasetName): Promise<Dataset> {
  switch (name) {
    case "bookings": {
      const r = await q(`SELECT b.id,b.status,c.name customer,c.phone,b.event_name,b.event_date,b.pickup_date,b.return_due_date,b.actual_return_date,b.rental_total,b.deposit_total,
          b.dry_clean_charge,b.transit_charge,b.damage_charge,b.cleaning_charge,b.late_days,b.late_fee,b.refund_amount,b.additional_due,b.deposit_status,
          (SELECT group_concat(garment_id,' ') FROM booking_items WHERE booking_id=b.id) garments,b.created_at
          FROM bookings b JOIN customers c ON c.id=b.customer_id ORDER BY b.created_at`);
      return { name: "Bookings", header: ["id", "status", "customer", "phone", "event", "event_date", "pickup", "return_due", "returned", "rental", "deposit", "dry_clean", "transit", "damage", "cleaning", "late_days", "late_fee", "refund", "additional_due", "deposit_status", "garments", "created_at"], rows: r.map((x) => ["id", "status", "customer", "phone", "event_name", "event_date", "pickup_date", "return_due_date", "actual_return_date", "rental_total", "deposit_total", "dry_clean_charge", "transit_charge", "damage_charge", "cleaning_charge", "late_days", "late_fee", "refund_amount", "additional_due", "deposit_status", "garments", "created_at"].map((k) => v(x[k]))) };
    }
    case "payments": {
      const r = await q("SELECT id,booking_id,kind,amount,mode,paid_on,note,recorded_by,created_at FROM payments ORDER BY id");
      return { name: "Payments", header: ["id", "booking", "kind", "amount", "mode", "paid_on", "note", "recorded_by", "created_at"], rows: r.map((x) => [v(x.id), v(x.booking_id), v(x.kind), v(x.amount), v(x.mode), v(x.paid_on), v(x.note), v(x.recorded_by), v(x.created_at)]) };
    }
    case "cashclosings": {
      const r = await q("SELECT id,date,opening_cash,cash_in,cash_refunds,cash_expenses,expected_cash,actual_cash,variance,notes,verified_by FROM cash_closings ORDER BY date");
      return { name: "CashClosings", header: ["id", "date", "opening", "cash_in", "refunds", "expenses", "expected", "actual", "variance", "notes", "verified_by"], rows: r.map((x) => ["id", "date", "opening_cash", "cash_in", "cash_refunds", "cash_expenses", "expected_cash", "actual_cash", "variance", "notes", "verified_by"].map((k) => v(x[k]))) };
    }
    case "expenses": {
      const r = await q("SELECT id,date,category,description,amount,mode,receipt_no,recorded_by FROM expenses ORDER BY date,id");
      return { name: "Expenses", header: ["id", "date", "category", "description", "amount", "mode", "receipt_no", "recorded_by"], rows: r.map((x) => ["id", "date", "category", "description", "amount", "mode", "receipt_no", "recorded_by"].map((k) => v(x[k]))) };
    }
    case "garments": {
      const r = await q("SELECT id,name,category,colour,size,rack,shelf,status,condition,purchase_cost,rental_price,security_deposit,active FROM garments ORDER BY id");
      return { name: "Garments", header: ["id", "name", "category", "colour", "size", "rack", "shelf", "status", "condition", "purchase_cost", "rental_price", "deposit", "active"], rows: r.map((x) => ["id", "name", "category", "colour", "size", "rack", "shelf", "status", "condition", "purchase_cost", "rental_price", "security_deposit", "active"].map((k) => v(x[k]))) };
    }
    case "customers": {
      const r = await q("SELECT id,name,phone,whatsapp,city,address,pincode,notes,created_at FROM customers ORDER BY id");
      return { name: "Customers", header: ["id", "name", "phone", "whatsapp", "city", "address", "pincode", "notes", "created_at"], rows: r.map((x) => ["id", "name", "phone", "whatsapp", "city", "address", "pincode", "notes", "created_at"].map((k) => v(x[k]))) };
    }
  }
}

/** CSV with spreadsheet-formula injection guard (cells starting = + - @ get a leading apostrophe) and UTF-8 BOM for Excel. */
export function toCsv(d: Dataset): string {
  const cell = (c: string | number) => {
    let s = String(c);
    if (typeof c === "string" && /^[=+\-@]/.test(s)) s = `'${s}`;
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [d.header, ...d.rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
