import { requireAdmin } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { params, qDate, qLimit, qStr } from "@/server/query";
import { createExpense, listExpenses } from "@/server/services/expenses";

export const GET = route(async (req: Request) => {
  await requireAdmin(req);
  const p = params(req);
  return json({ expenses: await listExpenses({ from: qDate(p, "from"), to: qDate(p, "to"), category: qStr(p, "category"), limit: qLimit(p, 100, 500) }) });
});

export const POST = route(async (req: Request) => {
  const admin = await requireAdmin(req);
  return json({ expense: await createExpense(admin, await readJson(req)) }, { status: 201 });
});
