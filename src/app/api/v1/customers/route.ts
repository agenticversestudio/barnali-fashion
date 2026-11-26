import { requireUser } from "@/server/auth";
import { tx } from "@/server/db";
import { json, readJson, route } from "@/server/http";
import { params, qLimit, qStr } from "@/server/query";
import { CUSTOMER_COLS, customerDtos, parseCustomer, searchCustomers, upsertCustomer } from "@/server/services/customers";

export const GET = route(async (req: Request) => {
  const user = await requireUser(req);
  const p = params(req);
  return json({ customers: await searchCustomers(qStr(p, "q"), qLimit(p, 30, 100), user.role) });
});

/** Create, or update-by-phone if the number already exists (counter staff don't need to search first). */
export const POST = route(async (req: Request) => {
  const user = await requireUser(req);
  const f = parseCustomer(await readJson(req));
  const row = await tx(async (x) => {
    const id = await upsertCustomer(x, f);
    return (await x.execute({ sql: `SELECT ${CUSTOMER_COLS} FROM customers WHERE id=?`, args: [id] })).rows[0];
  });
  const [customer] = await customerDtos([row], user.role);
  return json({ customer }, { status: 201 });
});
