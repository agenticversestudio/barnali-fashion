import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { GET as listG, POST as createG } from "@/app/api/v1/garments/route";
import { GET as availG } from "@/app/api/v1/garments/availability/route";
import { GET as getG, PATCH as patchG } from "@/app/api/v1/garments/[id]/route";
import { PATCH as locG } from "@/app/api/v1/garments/[id]/location/route";
import { PATCH as statG } from "@/app/api/v1/garments/[id]/status/route";
import { GET as listC, POST as createC } from "@/app/api/v1/customers/route";
import { GET as getC, PATCH as patchC } from "@/app/api/v1/customers/[id]/route";
import { addBooking, addItem, call, cleanup, cookieOf, mkUser } from "../helpers";

let A = "";
let S = "";
const H = (m: string, h: unknown, path: string, o: Parameters<typeof call>[3] = {}) => call(h as never, m, path, o);

beforeAll(async () => {
  await cleanup();
  await mkUser("ZT-A1", "zt_admin", "admin");
  await mkUser("ZT-S1", "zt_staff", "staff");
  A = cookieOf(await H("POST", login, "/api/v1/auth/login", { body: { username: "zt_admin", password: "TestPass#1" } }));
  S = cookieOf(await H("POST", login, "/api/v1/auth/login", { body: { username: "zt_staff", password: "TestPass#1" } }));
  for (const [id, name, colour, cat, rent, dep, cost] of [
    ["ZT-GA", "Zt Red Lehenga", "Red", "Bridal Lehenga", 5000, 3000, 25000],
    ["ZT-GB", "Zt Blue Sherwani", "Blue", "Groom Sherwani", 3000, 2000, 12000],
    ["ZT-GC", "Zt Green Gown", "Green", "Party Gown", 2000, 1000, 6000],
  ] as const) {
    const r = await H("POST", createG, "/api/v1/garments", {
      cookie: A,
      body: { id, name, colour, category: cat, size: "M", rack: "Rack Z-1", rentalPrice: rent, securityDeposit: dep, purchaseCost: cost },
    });
    expect(r.status).toBe(201);
  }
});
afterAll(cleanup);

describe("garments: role redaction (AC4 part)", () => {
  it("staff list never contains purchaseCost; admin list does", async () => {
    const s = await H("GET", listG, "/api/v1/garments?q=Zt", { cookie: S });
    const a = await H("GET", listG, "/api/v1/garments?q=Zt", { cookie: A });
    expect(s.status).toBe(200);
    expect(s.data.garments).toHaveLength(3);
    expect(JSON.stringify(s.data)).not.toMatch(/purchaseCost|purchase_cost|25000/);
    expect(a.data.garments.find((g: any) => g.id === "ZT-GA").purchaseCost).toBe(25000);
  });
  it("detail: staff gets no stats/purchaseCost; admin gets profit", async () => {
    const s = await H("GET", getG, "/api/v1/garments/ZT-GA", { cookie: S, params: { id: "ZT-GA" } });
    const a = await H("GET", getG, "/api/v1/garments/ZT-GA", { cookie: A, params: { id: "ZT-GA" } });
    expect(s.data.garment.stats).toBeUndefined();
    expect(JSON.stringify(s.data)).not.toMatch(/purchaseCost|profit|revenue/);
    expect(a.data.garment.stats).toEqual({ timesRented: 0, revenue: 0, profit: -25000 });
  });
  it("unauthenticated → 401; unknown id → 404", async () => {
    expect((await H("GET", listG, "/api/v1/garments")).status).toBe(401);
    expect((await H("GET", getG, "/api/v1/garments/NOPE", { cookie: S, params: { id: "NOPE" } })).status).toBe(404);
  });
});

describe("garments: search, filter, paging", () => {
  it("search by colour / name / id fragment", async () => {
    expect((await H("GET", listG, "/api/v1/garments?q=blue", { cookie: S })).data.garments.map((g: any) => g.id)).toContain("ZT-GB");
    expect((await H("GET", listG, "/api/v1/garments?q=lehenga", { cookie: S })).data.garments.map((g: any) => g.id)).toContain("ZT-GA");
    expect((await H("GET", listG, "/api/v1/garments?q=ZT-GC", { cookie: S })).data.garments).toHaveLength(1);
  });
  it("LIKE wildcards in q are escaped", async () => {
    expect((await H("GET", listG, "/api/v1/garments?q=%25", { cookie: S })).data.garments).toHaveLength(0);
  });
  it("category + status filters; bad status → 400", async () => {
    const r = await H("GET", listG, "/api/v1/garments?q=Zt&category=Party%20Gown", { cookie: S });
    expect(r.data.garments.map((g: any) => g.id)).toEqual(["ZT-GC"]);
    expect((await H("GET", listG, "/api/v1/garments?status=BOOKED", { cookie: S })).status).toBe(400);
  });
  it("limit + cursor pagination", async () => {
    const p1 = await H("GET", listG, "/api/v1/garments?q=Zt&limit=2", { cookie: S });
    expect(p1.data.garments).toHaveLength(2);
    expect(p1.data.nextCursor).toBe("ZT-GB");
    const p2 = await H("GET", listG, `/api/v1/garments?q=Zt&limit=2&cursor=${p1.data.nextCursor}`, { cookie: S });
    expect(p2.data.garments.map((g: any) => g.id)).toEqual(["ZT-GC"]);
    expect(p2.data.nextCursor).toBeUndefined();
  });
});

describe("garments: admin writes", () => {
  it("staff cannot create or edit", async () => {
    expect((await H("POST", createG, "/api/v1/garments", { cookie: S, body: {} })).status).toBe(403);
    expect((await H("PATCH", patchG, "/api/v1/garments/ZT-GA", { cookie: S, params: { id: "ZT-GA" }, body: { rentalPrice: 1 } })).status).toBe(403);
  });
  it("duplicate id → 422; bad id / negative price → 400", async () => {
    const base = { name: "n", category: "c", size: "M", rack: "r", rentalPrice: 100, securityDeposit: 0 };
    expect((await H("POST", createG, "/api/v1/garments", { cookie: A, body: { ...base, id: "zt-ga" } })).status).toBe(422);
    expect((await H("POST", createG, "/api/v1/garments", { cookie: A, body: { ...base, id: "bad id!" } })).status).toBe(400);
    expect((await H("POST", createG, "/api/v1/garments", { cookie: A, body: { ...base, id: "ZT-GX", rentalPrice: -5 } })).status).toBe(400);
    expect((await H("POST", createG, "/api/v1/garments", { cookie: A, body: { ...base, id: "ZT-GX", rentalPrice: 10.5 } })).status).toBe(400);
  });
  it("price edit changes the value and writes an audit row with before/after", async () => {
    const r = await H("PATCH", patchG, "/api/v1/garments/ZT-GC", { cookie: A, params: { id: "ZT-GC" }, body: { rentalPrice: 2500 } });
    expect(r.status).toBe(200);
    expect(r.data.garment.rentalPrice).toBe(2500);
    const a = await db().execute("SELECT before, after FROM audit_log WHERE action='garment.price' AND entity_id='ZT-GC'");
    expect(JSON.parse(String(a.rows[0].before)).rental).toBe(2000);
    expect(JSON.parse(String(a.rows[0].after)).rental).toBe(2500);
  });
});

describe("garments: location + status", () => {
  it("staff can move rack/shelf", async () => {
    const r = await H("PATCH", locG, "/api/v1/garments/ZT-GB/location", { cookie: S, params: { id: "ZT-GB" }, body: { rack: "Rack B-07", shelf: "Shelf 2" } });
    expect(r.status).toBe(200);
    expect(r.data.garment).toMatchObject({ rack: "Rack B-07", shelf: "Shelf 2" });
  });
  it("transitions: AVAILABLE→OUT_ON_RENT blocked (422); →DAMAGED ok; staff cannot retire; admin can", async () => {
    const st = (cookie: string, status: string) => H("PATCH", statG, "/api/v1/garments/ZT-GB/status", { cookie, params: { id: "ZT-GB" }, body: { status } });
    expect((await st(S, "OUT_ON_RENT")).status).toBe(422);
    expect((await st(S, "DAMAGED_REPAIR")).status).toBe(200);
    expect((await st(S, "UNAVAILABLE")).status).toBe(403); // legal transition, but only admin may retire
    expect((await st(A, "UNAVAILABLE")).status).toBe(200);
    expect((await st(S, "AVAILABLE")).status).toBe(403);
    expect((await st(A, "AVAILABLE")).status).toBe(200);
  });
});

describe("garments: availability", () => {
  beforeAll(async () => {
    await mkUser("ZT-U1", "zt_u1", "admin");
    await db().execute("INSERT INTO customers(id,name,phone) VALUES ('ZT-C1','Test Cust','0000000001')");
    await addBooking("ZT-B1", "2027-03-10", "2027-03-12");
    await addItem("ZT-B1", "ZT-GA", "2027-03-10", "2027-03-12");
  });
  it("availableFrom/To hides garments held in the window incl. buffer days", async () => {
    const ids = async (from: string, to: string) =>
      (await H("GET", listG, `/api/v1/garments?q=Zt&availableFrom=${from}&availableTo=${to}`, { cookie: S })).data.garments.map((g: any) => g.id);
    expect(await ids("2027-03-11", "2027-03-11")).not.toContain("ZT-GA");
    expect(await ids("2027-03-13", "2027-03-14")).not.toContain("ZT-GA"); // buffer day
    expect(await ids("2027-03-14", "2027-03-15")).toContain("ZT-GA");
    expect(await ids("2027-03-11", "2027-03-11")).toContain("ZT-GB");
  });
  it("nextBooking appears on list + detail", async () => {
    const r = await H("GET", listG, "/api/v1/garments?q=ZT-GA", { cookie: S });
    expect(r.data.garments[0].nextBooking).toMatchObject({ bookingId: "ZT-B1", from: "2027-03-10", to: "2027-03-12", customerName: "Test Cust" });
  });
  it("matrix endpoint returns busy ranges; validates window", async () => {
    const r = await H("GET", availG, "/api/v1/garments/availability?from=2027-03-01&to=2027-03-31", { cookie: S });
    expect(r.status).toBe(200);
    expect(r.data.rows.find((x: any) => x.garmentId === "ZT-GA").busy).toEqual([{ bookingId: "ZT-B1", from: "2027-03-10", to: "2027-03-12", status: "CONFIRMED" }]);
    expect((await H("GET", availG, "/api/v1/garments/availability?from=2027-03-01", { cookie: S })).status).toBe(400);
    expect((await H("GET", availG, "/api/v1/garments/availability?from=2027-01-01&to=2027-12-31", { cookie: S })).status).toBe(400);
  });
});

describe("customers", () => {
  let id = "";
  it("create, then same phone upserts the same customer (no duplicate)", async () => {
    const a = await H("POST", createC, "/api/v1/customers", { cookie: S, body: { name: "Zt Anita", phone: "+91 90000 11111", city: "Bargarh" } });
    expect(a.status).toBe(201);
    id = a.data.customer.id;
    expect(id).toMatch(/^CUST-\d{4}$/);
    expect(a.data.customer.phone).toBe("9000011111");
    const b = await H("POST", createC, "/api/v1/customers", { cookie: S, body: { name: "Zt Anita", phone: "9000011111", address: "Main Rd" } });
    expect(b.data.customer.id).toBe(id);
    expect(b.data.customer.address).toBe("Main Rd");
    expect(b.data.customer.city).toBe("Bargarh"); // earlier field kept
    await db().execute({ sql: "UPDATE customers SET id='ZT-CA' WHERE id=?", args: [id] }); // so cleanup removes it
    id = "ZT-CA";
  });
  it("validation: bad phone → 400; new customer without name → 400", async () => {
    expect((await H("POST", createC, "/api/v1/customers", { cookie: S, body: { name: "X", phone: "12345" } })).status).toBe(400);
    expect((await H("POST", createC, "/api/v1/customers", { cookie: S, body: { phone: "9000022222" } })).status).toBe(400);
  });
  it("search by phone fragment and name", async () => {
    expect((await H("GET", listC, "/api/v1/customers?q=00011", { cookie: S })).data.customers.map((c: any) => c.id)).toContain("ZT-CA");
    expect((await H("GET", listC, "/api/v1/customers?q=anita", { cookie: S })).data.customers.map((c: any) => c.id)).toContain("ZT-CA");
  });
  it("derived totals: active rental, deposit held, spent (admin only)", async () => {
    await db().execute("INSERT INTO bookings(id,customer_id,event_name,event_date,pickup_date,return_due_date,status,rental_total,deposit_total,created_by) VALUES ('ZT-B9','ZT-CA','E','2027-05-02','2027-05-01','2027-05-03','OUT_ON_RENT',5000,3000,'ZT-A1')");
    await db().execute("INSERT INTO payments(booking_id,kind,amount,mode,paid_on,recorded_by) VALUES ('ZT-B9','ADVANCE',2000,'CASH','2027-05-01','ZT-A1'),('ZT-B9','BALANCE',6000,'UPI','2027-05-01','ZT-A1'),('ZT-B9','REFUND',500,'CASH','2027-05-02','ZT-A1')");
    const s = await H("GET", getC, "/api/v1/customers/ZT-CA", { cookie: S, params: { id } });
    const a = await H("GET", getC, "/api/v1/customers/ZT-CA", { cookie: A, params: { id } });
    expect(s.data.customer).toMatchObject({ totalBookings: 1, activeRentals: 1, depositsHeld: 3000 });
    expect(s.data.customer.totalSpent).toBeUndefined();
    expect(a.data.customer.totalSpent).toBe(7500);
  });
  it("patch updates fields; changing phone to another customer's → 422", async () => {
    await H("POST", createC, "/api/v1/customers", { cookie: S, body: { name: "Zt Other", phone: "9000033333" } });
    const r = await H("PATCH", patchC, "/api/v1/customers/ZT-CA", { cookie: S, params: { id }, body: { notes: "VIP" } });
    expect(r.data.customer.notes).toBe("VIP");
    const clash = await H("PATCH", patchC, "/api/v1/customers/ZT-CA", { cookie: S, params: { id }, body: { phone: "9000033333" } });
    expect(clash.status).toBe(422);
    await db().execute("UPDATE customers SET id='ZT-CB' WHERE phone='9000033333'");
  });
  it("unauthenticated → 401", async () => {
    expect((await H("GET", listC, "/api/v1/customers")).status).toBe(401);
  });
});
