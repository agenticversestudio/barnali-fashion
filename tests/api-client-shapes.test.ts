// Contract test: the browser API client must hand pages the bare DTO / array the pages expect,
// even though the server wraps single objects ({ booking }, { garment }, { job }, ...) and names list keys.
import { afterEach, describe, expect, it, vi } from "vitest";
import { bookingsApi, careApi, cashApi, customersApi, expensesApi, garmentsApi, settingsApi } from "@/lib/api";

function serve(body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("api client unwraps server responses", () => {
  it("bookings: create / getById / pickup / addPayment / cancel / update return the booking", async () => {
    serve({ booking: { id: "BF-BK-1" } });
    expect((await bookingsApi.create({} as never)).id).toBe("BF-BK-1");
    expect((await bookingsApi.getById("x")).id).toBe("BF-BK-1");
    expect((await bookingsApi.pickup("x", {})).id).toBe("BF-BK-1");
    expect((await bookingsApi.addPayment("x", {} as never)).id).toBe("BF-BK-1");
    expect((await bookingsApi.cancel("x", {})).id).toBe("BF-BK-1");
    expect((await bookingsApi.update("x", {})).id).toBe("BF-BK-1");
  });

  it("bookings.return keeps { booking, settlement }", async () => {
    serve({ booking: { id: "B" }, settlement: { refund: 1 } });
    const r = await bookingsApi.return("x", {} as never);
    expect(r.booking.id).toBe("B");
    expect(r.settlement.refund).toBe(1);
  });

  it("lists accept the server's named keys", async () => {
    serve({ bookings: [{ id: "a" }] });
    expect((await bookingsApi.list()).items).toHaveLength(1);
    serve({ garments: [{ id: "g" }] });
    expect((await garmentsApi.list()).items).toHaveLength(1);
    serve({ customers: [{ id: "c" }] });
    expect((await customersApi.list()).items).toHaveLength(1);
    serve({ jobs: [{ id: "j" }] });
    expect((await careApi.list()).items).toHaveLength(1);
    serve({ expenses: [{ id: "e" }] });
    expect((await expensesApi.list()).items).toHaveLength(1);
    serve({ from: "a", to: "b", rows: [{ garmentId: "g" }] });
    expect((await garmentsApi.getAvailability("a", "b")).items).toHaveLength(1);
  });

  it("garments / customers / care / expenses / cash / settings unwrap their single objects", async () => {
    serve({ garment: { id: "G" } });
    expect((await garmentsApi.getById("G")).id).toBe("G");
    expect((await garmentsApi.create({} as never)).id).toBe("G");
    expect((await garmentsApi.updateLocation("G", {} as never)).id).toBe("G");
    serve({ customer: { id: "C" } });
    expect((await customersApi.createOrUpdate({} as never)).id).toBe("C");
    serve({ job: { id: "J" } });
    expect((await careApi.create({} as never)).id).toBe("J");
    expect((await careApi.receive("J", {} as never)).id).toBe("J");
    serve({ expense: { id: "E" } });
    expect((await expensesApi.create({} as never)).id).toBe("E");
    serve({ closing: { id: "CC" } });
    expect((await cashApi.close({} as never)).id).toBe("CC");
    serve({ settings: { lateFeePercent: 15 } });
    expect((await settingsApi.get()).lateFeePercent).toBe(15);
  });

  it("passes an already-bare object through", async () => {
    serve({ id: "BARE" });
    expect((await bookingsApi.getById("x")).id).toBe("BARE");
  });
});
