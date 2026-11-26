import type { ReportSummary } from "@/types/api";
import { db, readAll } from "../db";
import { fail } from "../http";
import { todayIST } from "../ids";
import { daysBetween } from "../pricing";

const n = (v: unknown) => Number(v ?? 0);

/**
 * Admin summary. Revenue is by booking pickup date (accrual): rental + dry clean + transit + late fees + damage/cleaning charges
 * of non-cancelled bookings, plus advance money kept from cancelled ones. Deposits are a liability, never revenue.
 * All nine reads are independent, so they go out as one batch (one network round trip instead of nine).
 */
export async function reportSummary(from?: string, to?: string): Promise<ReportSummary> {
  const today = todayIST();
  const f = from ?? `${today.slice(0, 8)}01`;
  const t = to ?? today;
  if (t < f) fail("VALIDATION", "to must not be before from");
  const days = daysBetween(f, t) + 1;
  if (days > 366) fail("VALIDATION", "Range too large (max 366 days)");
  const q = (sql: string, args: (string | number)[]) => ({ sql, args });

  const [revR, cancR, byCat, cashR, heldR, cnt, top, gcountR, bookedR] = await readAll(db(), [
    q(
      `SELECT COALESCE(SUM(rental_total),0) rental, COALESCE(SUM(dry_clean_charge),0) dry, COALESCE(SUM(transit_charge),0) transit,
              COALESCE(SUM(late_fee),0) late, COALESCE(SUM(damage_charge+cleaning_charge),0) dc
       FROM bookings WHERE status <> 'CANCELLED' AND pickup_date BETWEEN ? AND ?`, [f, t]),
    q(
      `SELECT COALESCE(SUM(CASE WHEN p.kind='REFUND' THEN -p.amount ELSE p.amount END),0) s
       FROM payments p JOIN bookings b ON b.id=p.booking_id WHERE b.status='CANCELLED' AND b.pickup_date BETWEEN ? AND ?`, [f, t]),
    q("SELECT category, SUM(amount) s FROM expenses WHERE date BETWEEN ? AND ? GROUP BY category ORDER BY s DESC", [f, t]),
    q("SELECT COALESCE(SUM(CASE WHEN kind='REFUND' THEN -amount ELSE amount END),0) s FROM payments WHERE paid_on BETWEEN ? AND ?", [f, t]),
    q(
      `SELECT (SELECT COALESCE(SUM(deposit_total),0) FROM bookings WHERE status='OUT_ON_RENT')
            + (SELECT COALESCE(SUM(refund_amount),0) FROM bookings WHERE status='COMPLETED' AND deposit_status='HELD' AND refund_amount > 0) AS s`, []),
    q("SELECT status, COUNT(*) c FROM bookings WHERE pickup_date BETWEEN ? AND ? GROUP BY status", [f, t]),
    q(
      `SELECT bi.garment_id, g.name, COUNT(*) times, SUM(bi.rental_price) rev FROM booking_items bi
       JOIN bookings b ON b.id=bi.booking_id JOIN garments g ON g.id=bi.garment_id
       WHERE b.status <> 'CANCELLED' AND b.pickup_date BETWEEN ? AND ? GROUP BY bi.garment_id ORDER BY rev DESC, times DESC LIMIT 10`, [f, t]),
    q("SELECT COUNT(*) c FROM garments WHERE active=1 AND status <> 'UNAVAILABLE'", []),
    q(
      `SELECT COALESCE(SUM(julianday(MIN(bi.return_due_date, ?)) - julianday(MAX(bi.pickup_date, ?)) + 1),0) d
       FROM booking_items bi JOIN bookings b ON b.id=bi.booking_id
       WHERE b.status <> 'CANCELLED' AND bi.pickup_date <= ? AND bi.return_due_date >= ?`, [t, f, t, f]),
  ]);

  const rev = revR.rows[0];
  const revenue = {
    rental: n(rev.rental), dryClean: n(rev.dry), transit: n(rev.transit), lateFees: n(rev.late), damageAndCleaning: n(rev.dc), cancellationIncome: n(cancR.rows[0].s), total: 0,
  };
  revenue.total = revenue.rental + revenue.dryClean + revenue.transit + revenue.lateFees + revenue.damageAndCleaning + revenue.cancellationIncome;

  const expenses = { total: byCat.rows.reduce((s, r) => s + n(r.s), 0), byCategory: byCat.rows.map((r) => ({ category: String(r.category), amount: n(r.s) })) };

  const by = (s: string) => n(cnt.rows.find((r) => r.status === s)?.c);
  const bookings = { total: cnt.rows.reduce((s, r) => s + n(r.c), 0), confirmed: by("CONFIRMED"), outOnRent: by("OUT_ON_RENT"), completed: by("COMPLETED"), cancelled: by("CANCELLED") };

  const gcount = n(gcountR.rows[0].c);
  const booked = n(bookedR.rows[0].d);
  const available = gcount * days;

  return {
    from: f, to: t, revenue, expenses, profit: revenue.total - expenses.total, cashCollected: n(cashR.rows[0].s), depositsHeld: n(heldR.rows[0].s), bookings,
    topGarments: top.rows.map((r) => ({ garmentId: String(r.garment_id), name: String(r.name), timesRented: n(r.times), revenue: n(r.rev) })),
    utilisation: { garments: gcount, bookedDays: booked, availableDays: available, percent: available ? Math.round((booked / available) * 1000) / 10 : 0 },
  };
}
