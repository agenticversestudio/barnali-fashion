import { requireUser } from "@/server/auth";
import { tx } from "@/server/db";
import { json, readJson, route } from "@/server/http";
import { CUSTOMER_COLS, customerDtos, getCustomerRow, parseCustomer, upsertCustomer } from "@/server/services/customers";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (req: Request, ctx: Ctx) => {
  const user = await requireUser(req);
  const { id } = await ctx.params;
  const [customer] = await customerDtos([await getCustomerRow(id)], user.role);
  return json({ customer });
});

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const user = await requireUser(req);
  const { id } = await ctx.params;
  const f = { ...parseCustomer(await readJson(req), true), id };
  const row = await tx(async (x) => {
    await upsertCustomer(x, f);
    return (await x.execute({ sql: `SELECT ${CUSTOMER_COLS} FROM customers WHERE id=?`, args: [id] })).rows[0];
  });
  const [customer] = await customerDtos([row], user.role);
  return json({ customer });
});
