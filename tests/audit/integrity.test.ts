// Regression: a column named `length` used to be read as the row's own .length (its column count): the API returned the column
// count instead of the measurement and backups silently stored that number. Also: backup -> restore is a true row-for-row copy.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { GET as listG, POST as createG } from "@/app/api/v1/garments/route";
import { GET as getG, PATCH as patchG } from "@/app/api/v1/garments/[id]/route";
import { dump, restore } from "../../scripts/lib/backup-core";
import { applyMigrations, sqliteConn, tursoConn } from "../../scripts/lib/target";
import { call, cleanup, cookieOf, mkUser } from "../helpers";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const H = (m: string, h: unknown, path: string, o: Parameters<typeof call>[3] = {}) => call(h as never, m, path, o);
let A = "";

beforeAll(async () => {
  await cleanup();
  await mkUser("ZT-A1", "zt_admin", "admin");
  A = cookieOf(await H("POST", login, "/api/v1/auth/login", { body: { username: "zt_admin", password: "TestPass#1" } }));
});
afterAll(cleanup);

describe("garment measurements round-trip (the `length` column)", () => {
  it("create -> detail -> list -> patch returns the real chest/waist/length/blouseSize, never a column count", async () => {
    const c = await H("POST", createG, "/api/v1/garments", {
      cookie: A,
      body: { id: "ZT-LEN-1", name: "Meas", category: "Lehenga", size: "M", rack: "R-1", rentalPrice: 1000, securityDeposit: 500, chest: "38 in", waist: "30 in", length: "41 in", blouseSize: "36" },
    });
    expect(c.status).toBe(201);
    expect(c.data.garment).toMatchObject({ chest: "38 in", waist: "30 in", length: "41 in", blouseSize: "36" });
    const d = await H("GET", getG, "/api/v1/garments/ZT-LEN-1", { cookie: A, params: { id: "ZT-LEN-1" } });
    expect(d.data.garment.length).toBe("41 in");
    const l = await H("GET", listG, "/api/v1/garments?limit=200", { cookie: A });
    expect(l.data.garments.find((g: any) => g.id === "ZT-LEN-1").length).toBe("41 in");
    const p = await H("PATCH", patchG, "/api/v1/garments/ZT-LEN-1", { cookie: A, params: { id: "ZT-LEN-1" }, body: { length: "44 in" } });
    expect(p.data.garment.length).toBe("44 in");
  });

  it("a garment with no length does not get one invented (previously: the column count)", async () => {
    await H("POST", createG, "/api/v1/garments", { cookie: A, body: { id: "ZT-LEN-2", name: "NoMeas", category: "Saree", size: "M", rack: "R-1", rentalPrice: 1000, securityDeposit: 500 } });
    const d = await H("GET", getG, "/api/v1/garments/ZT-LEN-2", { cookie: A, params: { id: "ZT-LEN-2" } });
    expect(d.data.garment.length).toBeUndefined();
  });
});

describe("backup -> restore: row-for-row parity (Turso source, scratch SQLite target)", () => {
  it("every table is identical after a restore, and the `length` values survive", async () => {
    const src = tursoConn(process.env.TURSO_DATABASE_URL!, process.env.TURSO_AUTH_TOKEN!);
    const b = await dump(src);
    const g = b.tables.garments;
    const li = g.columns.indexOf("length");
    expect(g.rows.find((r) => r[0] === "ZT-LEN-1")![li]).toBe("44 in"); // not 22 / 20
    const dir = mkdtempSync(join(tmpdir(), "bf-"));
    try {
      const dst = sqliteConn(join(dir, "r.db"));
      await applyMigrations(dst);
      await dst.run([{ sql: "DELETE FROM users" }]);
      await restore(dst, b, {});
      const b2 = await dump(dst);
      for (const t of Object.keys(b.tables)) {
        if (t === "sessions") continue;
        // compare as text so node:sqlite REAL/INTEGER binding of whole numbers can't hide a real difference
        expect(JSON.stringify(b2.tables[t].rows), `table ${t}`).toBe(JSON.stringify(b.tables[t].rows));
      }
      dst.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
