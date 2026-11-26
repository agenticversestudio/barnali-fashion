import type { Row } from "@tursodatabase/serverless/compat";
import type { CashClosingDto, CashTodayDto, SessionUser } from "@/types/api";
import { audit } from "../audit";
import { db, tx, type Exec } from "../db";
import { fail } from "../http";
import { todayIST } from "../ids";
import { int, reqInt, str } from "../validate";

const CL_COLS = "c.id,c.date,c.opening_cash,c.cash_in,c.cash_refunds,c.cash_expenses,c.expected_cash,c.actual_cash,c.variance,c.notes,c.created_at,COALESCE(u.name,c.verified_by) AS by_name";
const closingDto = (r: Row): CashClosingDto => ({
  id: String(r.id), date: String(r.date), openingCash: Number(r.opening_cash), cashIn: Number(r.cash_in), cashRefunds: Number(r.cash_refunds),
  cashExpenses: Number(r.cash_expenses), expectedCash: Number(r.expected_cash), actualCash: Number(r.actual_cash), variance: Number(r.variance),
  ...(r.notes ? { notes: String(r.notes) } : {}), verifiedBy: String(r.by_name), createdAt: String(r.created_at),
});

/** expected_cash = opening + cash received − cash refunds − cash expenses, all from the ledgers (PRD §4.9). */
export async function computeCash(x: Exec, date: string, openingOverride?: number) {
  let opening = openingOverride;
  if (opening === undefined) {
    const prev = await x.execute({ sql: "SELECT actual_cash FROM cash_closings WHERE date < ? ORDER BY date DESC LIMIT 1", args: [date] });
    opening = prev.rows[0] ? Number(prev.rows[0].actual_cash) : 0;
  }
  const p = await x.execute({
    sql: `SELECT COALESCE(SUM(CASE WHEN kind <> 'REFUND' THEN amount END),0) cin, COALESCE(SUM(CASE WHEN kind = 'REFUND' THEN amount END),0) cout
          FROM payments WHERE mode='CASH' AND paid_on=?`,
    args: [date],
  });
  const e = await x.execute({ sql: "SELECT COALESCE(SUM(amount),0) s FROM expenses WHERE mode='CASH' AND date=?", args: [date] });
  const cashIn = Number(p.rows[0].cin), cashRefunds = Number(p.rows[0].cout), cashExpenses = Number(e.rows[0].s);
  return { openingCash: opening, cashIn, cashRefunds, cashExpenses, expectedCash: opening + cashIn - cashRefunds - cashExpenses };
}

async function closingOn(x: Exec, date: string): Promise<CashClosingDto | undefined> {
  const r = await x.execute({ sql: `SELECT ${CL_COLS} FROM cash_closings c LEFT JOIN users u ON u.id=c.verified_by WHERE c.date=?`, args: [date] });
  return r.rows[0] ? closingDto(r.rows[0]) : undefined;
}

export async function cashToday(date = todayIST()): Promise<CashTodayDto> {
  const closing = await closingOn(db(), date);
  // a closed day shows its frozen snapshot, an open day is live from the ledgers
  const c = closing
    ? { openingCash: closing.openingCash, cashIn: closing.cashIn, cashRefunds: closing.cashRefunds, cashExpenses: closing.cashExpenses, expectedCash: closing.expectedCash }
    : await computeCash(db(), date);
  return { date, ...c, closed: !!closing, ...(closing ? { closing } : {}) };
}

export async function closeCash(admin: SessionUser, b: Record<string, unknown>): Promise<CashClosingDto> {
  const date = b.date === undefined ? todayIST() : str(b, "date", { max: 10 })!;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail("VALIDATION", "date: must be YYYY-MM-DD", { field: "date" });
  if (date > todayIST()) fail("VALIDATION", "Cannot close a future day", { field: "date" });
  const actual = reqInt(b, "actualCash", { max: 100_000_000 });
  const openingOverride = int(b, "openingCash", { optional: true, max: 100_000_000 });
  const notes = str(b, "notes", { optional: true, max: 500 }) ?? null;
  return tx(async (x) => {
    if (await closingOn(x, date)) fail("RULE", `Cash for ${date} is already closed`);
    const c = await computeCash(x, date, openingOverride);
    const variance = actual - c.expectedCash;
    const id = `CC-${date}`;
    await x.execute({
      sql: `INSERT INTO cash_closings(id,date,opening_cash,cash_in,cash_refunds,cash_expenses,expected_cash,actual_cash,variance,notes,verified_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      args: [id, date, c.openingCash, c.cashIn, c.cashRefunds, c.cashExpenses, c.expectedCash, actual, variance, notes, admin.id],
    });
    await audit(x, admin.id, "cash.close", "cash_closing", id, undefined, { expected: c.expectedCash, actual, variance });
    return (await closingOn(x, date))!;
  });
}

export async function listClosings(f: { from?: string; to?: string; limit: number }): Promise<CashClosingDto[]> {
  const where = ["1=1"]; const args: (string | number)[] = [];
  if (f.from) { where.push("c.date >= ?"); args.push(f.from); }
  if (f.to) { where.push("c.date <= ?"); args.push(f.to); }
  const r = await db().execute({ sql: `SELECT ${CL_COLS} FROM cash_closings c LEFT JOIN users u ON u.id=c.verified_by WHERE ${where.join(" AND ")} ORDER BY c.date DESC LIMIT ?`, args: [...args, f.limit] });
  return r.rows.map(closingDto);
}
