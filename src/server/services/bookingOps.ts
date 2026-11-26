import type { BookingDto, ConflictInfo, QuoteResponse, SessionUser } from "@/types/api";
import { db, tx, type Exec } from "../db";
import { fail, isConflictError } from "../http";
import { nextCounter, pad, todayIST } from "../ids";
import { daysBetween, quote } from "../pricing";
import { PAY_MODES, int, obj, reqDate, reqInt, reqOneOf, str, strArray } from "../validate";
import { parseCustomer, upsertCustomer } from "./customers";
import { conflictError, findConflicts, getBookingDto } from "./bookings";
import type { Row } from "@tursodatabase/serverless/compat";

const MAX_DAYS = 30;
const MAX_GARMENTS = 20;
const NOT_BOOKABLE = ["DAMAGED_REPAIR", "UNAVAILABLE"];

export interface DatesAndCart {
  garmentIds: string[];
  pickupDate: string;
  returnDueDate: string;
  dryCleanCharge: number;
  transitCharge: number;
}

export function parseCart(b: Record<string, unknown>): DatesAndCart {
  const garmentIds = strArray(b, "garmentIds", { min: 1, max: MAX_GARMENTS }).map((s) => s.toUpperCase());
  const pickupDate = reqDate(b, "pickupDate");
  const returnDueDate = reqDate(b, "returnDueDate");
  if (returnDueDate < pickupDate) fail("VALIDATION", "returnDueDate must not be before pickupDate", { field: "returnDueDate" });
  if (daysBetween(pickupDate, returnDueDate) + 1 > MAX_DAYS) fail("VALIDATION", `Rental cannot be longer than ${MAX_DAYS} days`, { field: "returnDueDate" });
  return {
    garmentIds,
    pickupDate,
    returnDueDate,
    dryCleanCharge: int(b, "dryCleanCharge", { optional: true, max: 1_000_000 }) ?? 0,
    transitCharge: int(b, "transitCharge", { optional: true, max: 1_000_000 }) ?? 0,
  };
}

/** Load garments with prices FROM THE DB (client prices are never used) and check they can be booked. */
export async function loadBookableGarments(x: Exec, ids: string[]): Promise<Row[]> {
  const r = await x.execute({
    sql: `SELECT id,name,rental_price,security_deposit,status,active FROM garments WHERE id IN (${ids.map(() => "?").join(",")})`,
    args: ids,
  });
  const byId = new Map(r.rows.map((g) => [String(g.id), g]));
  const missing = ids.filter((id) => !byId.has(id) || !Number(byId.get(id)!.active));
  if (missing.length) fail("NOT_FOUND", `Garment not found: ${missing.join(", ")}`, { garmentIds: missing });
  const blocked = ids.filter((id) => NOT_BOOKABLE.includes(String(byId.get(id)!.status)));
  if (blocked.length)
    fail("RULE", `Cannot be booked right now: ${blocked.map((id) => `${id} (${String(byId.get(id)!.status)})`).join(", ")}`, { garmentIds: blocked });
  return ids.map((id) => byId.get(id)!);
}

export async function quoteBooking(b: Record<string, unknown>): Promise<QuoteResponse> {
  const cart = parseCart(b);
  const advance = int(b, "advance", { optional: true, max: 10_000_000 }) ?? 0;
  const garments = await loadBookableGarments(db(), cart.garmentIds);
  const q = quote({
    items: garments.map((g) => ({ rentalPrice: Number(g.rental_price), securityDeposit: Number(g.security_deposit) })),
    dryCleanCharge: cart.dryCleanCharge,
    transitCharge: cart.transitCharge,
    paymentsIn: advance,
  });
  const conflicts = await findConflicts(db(), cart.garmentIds, cart.pickupDate, cart.returnDueDate);
  return { ...q, advance, conflicts };
}

export async function createBooking(user: SessionUser, b: Record<string, unknown>): Promise<BookingDto> {
  const cart = parseCart(b);
  const customer = parseCustomer(obj(b, "customer")!);
  const eventName = str(b, "eventName", { max: 150 })!;
  const eventDate = reqDate(b, "eventDate");
  const adv = obj(b, "advance")!;
  const advAmount = reqInt(adv, "amount", { max: 10_000_000 });
  const advMode = reqOneOf(adv, "mode", PAY_MODES);
  const notes = str(b, "notes", { optional: true, max: 1000 }) ?? null;
  const today = todayIST();
  if (cart.pickupDate < today) fail("VALIDATION", "pickupDate is in the past", { field: "pickupDate" });

  let id: string;
  try {
    id = await tx(async (x) => {
      const garments = await loadBookableGarments(x, cart.garmentIds);
      const q = quote({
        items: garments.map((g) => ({ rentalPrice: Number(g.rental_price), securityDeposit: Number(g.security_deposit) })),
        dryCleanCharge: cart.dryCleanCharge,
        transitCharge: cart.transitCharge,
      });
      if (advAmount > q.grandTotal) fail("RULE", `Advance ₹${advAmount} is more than the total ₹${q.grandTotal}`, { field: "advance.amount" });
      const customerId = await upsertCustomer(x, customer);
      const year = today.slice(0, 4);
      const bookingId = `BF-BK-${year}-${pad(await nextCounter(x, `booking-${year}`), 3)}`;
      await x.execute({
        sql: `INSERT INTO bookings(id,customer_id,event_name,event_date,pickup_date,return_due_date,rental_total,deposit_total,dry_clean_charge,transit_charge,deposit_status,notes,created_by)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [bookingId, customerId, eventName, eventDate, cart.pickupDate, cart.returnDueDate, q.rentalTotal, q.depositTotal, q.dryCleanCharge, q.transitCharge,
          q.depositTotal === 0 ? "NOT_COLLECTED" : "HELD", notes, user.id],
      });
      for (const g of garments) {
        // the trigger raises GARMENT_CONFLICT here if another active booking overlaps (the real double-booking guard)
        await x.execute({
          sql: "INSERT INTO booking_items(booking_id,garment_id,rental_price,security_deposit,pickup_date,return_due_date) VALUES (?,?,?,?,?,?)",
          args: [bookingId, String(g.id), Number(g.rental_price), Number(g.security_deposit), cart.pickupDate, cart.returnDueDate],
        });
      }
      if (advAmount > 0)
        await x.execute({
          sql: "INSERT INTO payments(booking_id,kind,amount,mode,paid_on,note,recorded_by) VALUES (?,?,?,?,?,?,?)",
          args: [bookingId, "ADVANCE", advAmount, advMode, today, "Advance at booking", user.id],
        });
      return bookingId;
    });
  } catch (e) {
    if (isConflictError(e)) {
      const conflicts: ConflictInfo[] = await findConflicts(db(), cart.garmentIds, cart.pickupDate, cart.returnDueDate);
      throw conflictError(conflicts);
    }
    throw e;
  }
  return getBookingDto(id);
}
