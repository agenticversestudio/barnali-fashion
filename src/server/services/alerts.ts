import type { AlertDto } from "@/types/api";
import { db, readAll } from "../db";
import { todayIST } from "../ids";
import { addDays } from "../pricing";

/** In-app alerts for the dashboard bell. Staff and admin see the same list (no financial totals inside). */
export async function getAlerts(): Promise<AlertDto[]> {
  const today = todayIST();
  const soon = addDays(today, 2);
  const out: AlertDto[] = [];
  const q = (sql: string, args: (string | number)[]) => ({ sql, args });

  // four independent reads in one network round trip
  const [pickups, returns, care, refunds] = await readAll(db(), [
    q(
      `SELECT b.id, b.pickup_date, c.name FROM bookings b JOIN customers c ON c.id=b.customer_id
       WHERE b.status='CONFIRMED' AND b.pickup_date BETWEEN ? AND ? ORDER BY b.pickup_date`,
      [today, soon],
    ),
    q(
      `SELECT b.id, b.return_due_date, c.name FROM bookings b JOIN customers c ON c.id=b.customer_id
       WHERE b.status='OUT_ON_RENT' AND b.return_due_date <= ? ORDER BY b.return_due_date`,
      [addDays(today, 1)],
    ),
    q(
      `SELECT c.id, c.expected_date, c.vendor_name, g.name FROM care_jobs c JOIN garments g ON g.id=c.garment_id
       WHERE c.status='OUT' AND c.expected_date IS NOT NULL AND c.expected_date < ? ORDER BY c.expected_date`,
      [today],
    ),
    q(
      `SELECT b.id, b.refund_amount, c.name FROM bookings b JOIN customers c ON c.id=b.customer_id
       WHERE b.status='COMPLETED' AND b.deposit_status='HELD' AND b.refund_amount > 0 ORDER BY b.actual_return_date`,
      [],
    ),
  ]);

  for (const r of pickups.rows)
    out.push({ type: "PICKUP_SOON", title: "Pickup coming up", message: `${r.name} picks up on ${r.pickup_date} (${r.id})`, refId: String(r.id), date: String(r.pickup_date) });

  for (const r of returns.rows) {
    const due = String(r.return_due_date);
    if (due < today) out.push({ type: "RETURN_OVERDUE", title: "Return overdue", message: `${r.name} should have returned on ${due} (${r.id}). Late fee is running.`, refId: String(r.id), date: due });
    else out.push({ type: "RETURN_DUE", title: due === today ? "Return due today" : "Return due tomorrow", message: `${r.name} (${r.id}) returns on ${due}`, refId: String(r.id), date: due });
  }

  for (const r of care.rows)
    out.push({ type: "CARE_OVERDUE", title: "Care job overdue", message: `${r.name} was due back from ${r.vendor_name} on ${r.expected_date} (${r.id})`, refId: String(r.id), date: String(r.expected_date) });

  for (const r of refunds.rows)
    out.push({ type: "REFUND_PENDING", title: "Deposit refund pending", message: `Return ₹${r.refund_amount} deposit to ${r.name} (${r.id})`, refId: String(r.id) });
  return out;
}
