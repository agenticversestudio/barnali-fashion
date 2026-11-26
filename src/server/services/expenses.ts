import type { Row } from "@tursodatabase/serverless/compat";
import type { ExpenseDto, SessionUser } from "@/types/api";
import { audit } from "../audit";
import { db, tx, type Exec } from "../db";
import { fail } from "../http";
import { nextCounter, pad } from "../ids";
import { likeArg } from "../query";
import { int, reqDate, reqInt, reqOneOf, str } from "../validate";

const COLS = "id,date,category,description,amount,mode,receipt_no";
const MODES = ["CASH", "UPI", "BANK_TRANSFER"] as const;

export const expenseDto = (r: Row): ExpenseDto => ({
  id: String(r.id), date: String(r.date), category: String(r.category), description: String(r.description),
  amount: Number(r.amount), mode: r.mode as ExpenseDto["mode"], ...(r.receipt_no ? { receiptNo: String(r.receipt_no) } : {}),
});

export async function listExpenses(f: { from?: string; to?: string; category?: string; limit: number }): Promise<ExpenseDto[]> {
  const where = ["1=1"]; const args: (string | number)[] = [];
  if (f.from) { where.push("date >= ?"); args.push(f.from); }
  if (f.to) { where.push("date <= ?"); args.push(f.to); }
  if (f.category) { where.push("category LIKE ? ESCAPE '!'"); args.push(likeArg(f.category)); }
  const r = await db().execute({ sql: `SELECT ${COLS} FROM expenses WHERE ${where.join(" AND ")} ORDER BY date DESC, id DESC LIMIT ?`, args: [...args, f.limit] });
  return r.rows.map(expenseDto);
}

export async function createExpense(user: SessionUser, b: Record<string, unknown>): Promise<ExpenseDto> {
  const v = {
    date: reqDate(b, "date"), category: str(b, "category", { max: 60 })!, description: str(b, "description", { max: 300 })!,
    amount: reqInt(b, "amount", { min: 1, max: 100_000_000 }), mode: reqOneOf(b, "mode", MODES), receipt: str(b, "receiptNo", { optional: true, max: 60 }) ?? null,
  };
  return tx(async (x) => {
    const id = `EXP-${pad(await nextCounter(x, "expense"), 4)}`;
    await x.execute({
      sql: "INSERT INTO expenses(id,date,category,description,amount,mode,receipt_no,recorded_by) VALUES (?,?,?,?,?,?,?,?)",
      args: [id, v.date, v.category, v.description, v.amount, v.mode, v.receipt, user.id],
    });
    await audit(x, user.id, "expense.create", "expense", id, undefined, { amount: v.amount, mode: v.mode });
    return expenseDto((await x.execute({ sql: `SELECT ${COLS} FROM expenses WHERE id=?`, args: [id] })).rows[0]);
  });
}

export async function updateExpense(user: SessionUser, id: string, b: Record<string, unknown>): Promise<ExpenseDto> {
  const date = b.date === undefined ? undefined : reqDate(b, "date");
  const category = str(b, "category", { optional: true, max: 60 });
  const description = str(b, "description", { optional: true, max: 300 });
  const amount = int(b, "amount", { optional: true, min: 1, max: 100_000_000 });
  const mode = b.mode === undefined ? undefined : reqOneOf(b, "mode", MODES);
  const receipt = str(b, "receiptNo", { optional: true, max: 60 });
  return tx(async (x) => {
    const before = (await x.execute({ sql: `SELECT ${COLS} FROM expenses WHERE id=?`, args: [id] })).rows[0];
    if (!before) fail("NOT_FOUND", "Expense not found");
    if (await closedOn(x, String(before.date)) || (date && (await closedOn(x, date)))) fail("RULE", "That day's cash is already closed; expense cannot be changed");
    await x.execute({
      sql: "UPDATE expenses SET date=COALESCE(?,date), category=COALESCE(?,category), description=COALESCE(?,description), amount=COALESCE(?,amount), mode=COALESCE(?,mode), receipt_no=COALESCE(?,receipt_no) WHERE id=?",
      args: [date ?? null, category ?? null, description ?? null, amount ?? null, mode ?? null, receipt ?? null, id],
    });
    const after = (await x.execute({ sql: `SELECT ${COLS} FROM expenses WHERE id=?`, args: [id] })).rows[0];
    await audit(x, user.id, "expense.edit", "expense", id, { amount: before.amount, mode: before.mode, date: before.date }, { amount: after.amount, mode: after.mode, date: after.date });
    return expenseDto(after);
  });
}

export async function deleteExpense(user: SessionUser, id: string): Promise<void> {
  await tx(async (x) => {
    const before = (await x.execute({ sql: `SELECT ${COLS} FROM expenses WHERE id=?`, args: [id] })).rows[0];
    if (!before) fail("NOT_FOUND", "Expense not found");
    if (await closedOn(x, String(before.date))) fail("RULE", "That day's cash is already closed; expense cannot be deleted");
    await x.execute({ sql: "DELETE FROM expenses WHERE id=?", args: [id] });
    await audit(x, user.id, "expense.delete", "expense", id, { amount: before.amount, mode: before.mode, date: before.date, description: before.description });
  });
}

async function closedOn(x: Exec, date: string): Promise<boolean> {
  return (await x.execute({ sql: "SELECT 1 FROM cash_closings WHERE date=?", args: [date] })).rows.length > 0;
}
