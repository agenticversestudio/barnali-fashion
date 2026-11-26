import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { addBooking, addItem, baseFixtures, cleanup } from "../helpers";

// existing hold: ZT-G1, 2026-12-10 .. 2026-12-12  → blocked window 12-09 .. 12-13 (1-day buffer each side)
beforeAll(async () => {
  await cleanup();
  await baseFixtures();
  for (const b of ["ZT-B1", "ZT-B2", "ZT-B3", "ZT-B4", "ZT-B5", "ZT-B6", "ZT-B7"]) await addBooking(b, "2026-12-01", "2026-12-02");
  await addItem("ZT-B1", "ZT-G1", "2026-12-10", "2026-12-12");
});
afterAll(cleanup);

const conflict = async (p: Promise<unknown>) => {
  await expect(p).rejects.toThrow(/GARMENT_CONFLICT/);
};

describe("double-booking trigger", () => {
  it("rejects identical dates", () => conflict(addItem("ZT-B2", "ZT-G1", "2026-12-10", "2026-12-12")));
  it("rejects partial overlap", () => conflict(addItem("ZT-B2", "ZT-G1", "2026-12-11", "2026-12-15")));
  it("rejects booking that fully contains existing", () => conflict(addItem("ZT-B2", "ZT-G1", "2026-12-05", "2026-12-20")));
  it("rejects pickup the day after return (buffer after)", () => conflict(addItem("ZT-B2", "ZT-G1", "2026-12-13", "2026-12-14")));
  it("rejects return the day before pickup (buffer before)", () => conflict(addItem("ZT-B2", "ZT-G1", "2026-12-05", "2026-12-09")));
  it("allows pickup two days after return", async () => {
    await addItem("ZT-B3", "ZT-G1", "2026-12-14", "2026-12-15");
  });
  it("allows return two days before pickup", async () => {
    await addItem("ZT-B4", "ZT-G1", "2026-12-05", "2026-12-08");
  });
  it("allows a different garment on same dates", async () => {
    await addItem("ZT-B5", "ZT-G2", "2026-12-10", "2026-12-12");
  });
  it("ignores inactive items", async () => {
    await addItem("ZT-B6", "ZT-G1", "2026-12-10", "2026-12-12", 0);
  });
  it("update: re-activating an overlapping item is rejected", async () => {
    await conflict(
      Promise.resolve(db().execute("UPDATE booking_items SET active=1 WHERE booking_id='ZT-B6' AND garment_id='ZT-G1'")),
    );
  });
  it("update: freeing the first booking (active=0) lets the dates be rebooked", async () => {
    await db().execute("UPDATE booking_items SET active=0 WHERE booking_id='ZT-B1'");
    await addItem("ZT-B7", "ZT-G1", "2026-12-10", "2026-12-12");
  });
});
