# API Changelog (backend → frontend)

Contract types: `src/types/api.ts` (Claude owns). Base path `/api/v1`. All bodies JSON. Errors: `{ "error": { "code", "message", "details?" } }`.
Auth: HttpOnly cookie `bf_session` set by `POST /auth/login`; browser sends it automatically (`fetch(..., { credentials: "same-origin" })`). On `401` redirect to `/erp/login`.

## 2026-11-26 — v1 contract published (Phase 1)

### How to integrate (Gemini)
1. Build `src/lib/api/client.ts`: thin `fetch` wrapper that throws a typed `ApiError` from the error body; on `UNAUTHENTICATED` navigates to `/erp/login`.
2. Import types ONLY from `@/types/api`. Legacy `@/types` (prototype) stays until each screen is migrated; do not mix the two in one screen.
3. Do **not** compute money in the UI. Use `POST /bookings/quote` for live totals and show server numbers for settlement.

### Differences from the prototype data model (breaking when you migrate a screen)
| Prototype | New API |
|-----------|---------|
| 8 roles | `admin` \| `staff` only. Role comes from `GET /auth/me`; no role dropdown. |
| `GarmentUnit` + `Product` | one `GarmentDto` (each costume = one row). `productName`→`name`, `storageLocation`→`rack`(+`shelf`), `purchasePrice`→`purchaseCost` (admin only), `image`→`mainPhotoUrl`. No `barcode`, `rentalCount`, `totalUnits`. |
| Garment status incl. `BOOKED`, `RENTED`, `RESERVED`… | exactly 6: `AVAILABLE, OUT_ON_RENT, RETURNED_CLEANING, IN_CARE, DAMAGED_REPAIR, UNAVAILABLE`. "Booked" badge = `AVAILABLE` + `nextBooking.from` within 3 days. |
| Booking `DRAFT/PICKUP_PENDING/RETURN_RECEIVED` | `CONFIRMED → OUT_ON_RENT → COMPLETED`, or `CANCELLED`. |
| `Booking.items[].garmentUnitId` | `items[].garmentId` |
| `securityDepositTotal` | `depositTotal` |
| `advancePaid`, `remainingRentalDue` | derived `amountPaid`, `balanceDue`; `grandTotal = rental + dryClean + transit + deposit` |
| `deliveryCharges` | `transitCharge` (+ `dryCleanCharge`) |
| `damageDeduction`, `cleaningDeduction` | `damageCharge`, `cleaningCharge` |
| `lateFee`, `refundAmount` typed by client | **server-computed**; request has no such fields |
| (new) | `additionalDue`: customer owes this when deductions > deposit |
| Customer totals stored | derived: `totalBookings`, `activeRentals`, `depositsHeld`, `totalSpent` (admin only) |
| `LaundryJob`, `MaintenanceJob`, `StitchingCareJob`, `DryCleanCareJob` | single `CareJobDto` (`kind` STITCHING\|DRY_CLEAN\|REPAIR) |
| Late fee `₹300/day` | `15 % of rental total × late days` (setting `lateFeePercent`) |
| IDs `BF-BK-2026-${n}` made in browser | server-generated; garment ids = SKU you type (`LF-001`), customers `CUST-0001`, care `CARE-0001` |

### Endpoint status
Legend: ✅ live · ⏳ planned (phase). Staff = `S`, admin = `A`.

| Endpoint | Role | Status |
|----------|------|--------|
| `GET /health` | public | ✅ |
| `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | public/S | ✅ |
| `GET/POST /users`, `PATCH /users/:id`, `POST /users/:id/reset-password`, `DELETE /users/:id/sessions` | A | ✅ |
| garments: `GET /garments` (q, category, status, rack, availableFrom/To, limit, cursor), `GET /garments/:id`, `GET /garments/availability?from&to`, `PATCH /garments/:id/location`, `PATCH /garments/:id/status` (S); `POST /garments`, `PATCH /garments/:id` (A) | S/A | ✅ |
| customers: `GET /customers?q`, `POST /customers` (upsert by phone), `GET/PATCH /customers/:id` | S | ✅ |
| `POST /bookings/quote`, `POST /bookings`, `GET /bookings`, `GET/PATCH /bookings/:id`, `POST /bookings/:id/pickup`, `/return`, `/payments` (S); `POST /bookings/:id/cancel` (A) | S/A | ✅ |
| care, alerts, expenses, cash, reports | S/A | ⏳ P4 |
| photos | S | ⏳ P5 |

This file is updated whenever an endpoint goes live or a DTO changes. Check the top entry before each integration session.

## 2026-11-26 — Phase 3 live: rental core (what the UI must know)

**Booking wizard**
- Step 4 live totals: `POST /bookings/quote` (body: `garmentIds, pickupDate, returnDueDate, dryCleanCharge?, transitCharge?, advance?`). Show `conflicts[]` inline (`garmentName`, `heldBy`, `from`, `to`) and block Save while non-empty.
- Save: `POST /bookings`. `409 GARMENT_CONFLICT` has a ready-to-show `error.message` ("Zt Red Lehenga (LF-001) is already reserved by BF-BK-2026-081 for 10 Jun 2027 – 12 Jun 2027") and `error.details.conflicts[]`. Phone is normalised to 10 digits (accepts `+91`, spaces). Same phone = same customer (updated, not duplicated).
- Rules (422 `RULE` / 400 `VALIDATION`, messages are user-readable): pickup not in the past, max 30-day rental, advance ≤ grand total, garment not `DAMAGED_REPAIR`/`UNAVAILABLE`.

**Pickup** `POST /bookings/:id/pickup` — body `{ handoverCondition?, payments?: [{kind:"BALANCE"|"DEPOSIT", amount, mode}], photoIds? }`. Whole balance + deposit must be collected in this call or earlier, else `422` "Collect ₹X more…" with `details.balanceDue`. Garment must be physically `AVAILABLE`.

**Extra payment** `POST /bookings/:id/payments` — `BALANCE`/`DEPOSIT` before return (≤ still due); `EXTRA` only after return, ≤ `additionalDue`.

**Return** `POST /bookings/:id/return` → `{ booking, settlement }`. Send only inputs: `actualReturnDate` (≤ today), `damageCharge`, `cleaningCharge`, `items[]` (every garment once, `nextAction` = `AVAILABLE|DRY_CLEAN|REPAIR|DAMAGED`; DRY_CLEAN/REPAIR need `vendorName`), `refund?: {pay, mode}`. **Any `lateFee`/`refund` number you send is ignored.** Display `settlement` as-is; do not recalculate. `settlement.additionalDue > 0` → show "Customer owes ₹X" and offer `POST /payments {kind:"EXTRA"}`. `refund > 0` with `depositStatus:"HELD"` → refund still owed to the customer.

**Cancel** `POST /bookings/:id/cancel` (admin): only `CONFIRMED`; optional `{reason, refundAdvance:{amount,mode}}`; frees the dates.
**Edit** `PATCH /bookings/:id`: staff may change `eventName`, `eventDate`, `notes`; money fields (`dryCleanCharge`, `transitCharge`, `damageCharge`, `cleaningCharge`) admin only, audited.

**Derived fields on `BookingDto`** (never compute client-side): `grandTotal`, `amountPaid` (money in, refunds excluded), `balanceDue` (0 once COMPLETED/CANCELLED), `additionalDue` (owed minus EXTRA already paid), `isOverdue`.
**Garment list** also returns `nextBooking` (for the BOOKED badge) and, for admin only, `purchaseCost`; `GET /garments/:id` adds `history[]` and (admin) `stats`.
**Pagination**: lists return `nextCursor`; pass it back as `?cursor=`.
**Error codes → HTTP**: VALIDATION 400 · UNAUTHENTICATED 401 · FORBIDDEN 403 · NOT_FOUND 404 · GARMENT_CONFLICT 409 · RULE 422 · LOCKED 423.
