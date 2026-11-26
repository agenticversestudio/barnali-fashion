import type { Exec } from "./db";

/** Record a money / price / user change. Pass the caller's transaction so it commits atomically with the change. */
export async function audit(
  x: Exec,
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  before?: unknown,
  after?: unknown,
): Promise<void> {
  await x.execute({
    sql: "INSERT INTO audit_log(user_id,action,entity,entity_id,before,after) VALUES (?,?,?,?,?,?)",
    args: [
      userId,
      action,
      entity,
      entityId,
      before === undefined ? null : JSON.stringify(before),
      after === undefined ? null : JSON.stringify(after),
    ],
  });
}
