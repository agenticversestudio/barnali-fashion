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
| care, alerts, expenses, cash, reports | S/A | ✅ P4 |
| photos | S | ✅ P5 (backend; needs R2 keys, see docs/R2_SETUP.md) |

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

## 2026-11-26 — Phase 4 live: care, alerts, money-admin (what the UI must know)

**Care jobs** (staff + admin)
- `GET /care?status=OUT|RECEIVED&garmentId=` → `{ items: CareJobDto[] }`; `isOverdue` is server-derived (OUT and `expectedDate` < today).
- `POST /care` body `CreateCareRequest` → 201 `CareJobDto` (id `CARE-NNNN`). Garment becomes `IN_CARE`. 422 if garment is `OUT_ON_RENT`.
- `POST /care/:id/receive` body `ReceiveCareRequest` (`rcvDate` ≤ today, `nextStatus`). Garment gets `nextStatus` only when no other OUT job remains for it.

**Alerts** `GET /alerts` (staff + admin) → `AlertDto[]`: `PICKUP_SOON` (confirmed, pickup today..+2), `RETURN_DUE`, `RETURN_OVERDUE`, `CARE_OVERDUE`, `REFUND_PENDING`. `refId` = booking/care id to deep-link.

**Admin only (staff gets 403)**
- Expenses: `GET /expenses?from&to&category`, `POST /expenses`, `PATCH|DELETE /expenses/:id` (`ExpenseDto`, id `EXP-NNNN`). Edits/deletes are audited; an expense dated on a closed cash day is refused (422).
- Cash: `GET /cash/today?date=` → `CashTodayDto`; `POST /cash/closing` body `CloseCashRequest` → `CashClosingDto` (server recomputes expected/variance, ignores any client `expectedCash`; one closing per day, future day 400, duplicate 422); `GET /cash/closings`. `expectedCash = openingCash + cashIn − cashRefunds − cashExpenses`; opening = previous day's actual cash. A closed day returns frozen numbers + `closing`.
- Reports: `GET /reports/summary?from&to` → `ReportSummary` (default = month to date; max 366 days). Revenue is accrual by pickup date; deposits are never revenue.
- CSV: `GET /reports/export.csv?type=bookings|payments|cashclosings|expenses|garments|customers` (UTF-8 BOM, spreadsheet-formula guard).

**New DTOs in `@/types/api`**: `CashClosingDto`, `CashTodayDto`, `CloseCashRequest`, `ReportSummary`, `SyncStatus`.
**Security**: `tests/api/staff-fuzz.test.ts` enumerates every route file; a route added without classification fails CI.
## 2026-11-26 — Phase 5 live: photos (what the UI must know)

Upload flow (browser compresses to WebP ≤ 400 KB first, T5.3):
1. `POST /photos/presign` body `PresignRequest` `{garmentId?, kind, contentType: "image/webp"|"image/jpeg", bytes}` → `{ uploadUrl, objectKey }`. `garmentId` required for kinds MAIN/FRONT/BACK/DETAIL. 400 if `bytes` > 409 600; 422 if the garment already has 8 photos; 404 unknown garment.
2. Browser `PUT`s the file body straight to `uploadUrl` (valid 5 min; no cookie, no extra headers needed).
3. `POST /photos` body `RegisterPhotoRequest` `{objectKey, kind, garmentId?, bookingId?, careJobId?, note?}` → 201 `{ photo: PhotoDto }`. Server HEADs the object: missing → 422, > 400 KB → 400 (object deleted), already registered → 422.
4. `DELETE /photos/:id` — **admin only**.
5. Pass the returned photo `id`s as `photoIds` to `POST /bookings/:id/pickup` and `/return` to attach handover / damage photos to the booking.

Reads: `GarmentDto.mainPhotoUrl` (list + detail) and `BookingItemDto.mainPhotoUrl` are present only when a MAIN (else FRONT) photo exists. `GarmentDetailDto.photos[]` (MAIN first). URLs are signed for 1 h — do not store them; refetch.
Staff may upload; only admin may delete. Env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.
## 2026-11-26 — Phase 7 live: Google Sheets sync (admin)

- `POST /sync/sheets` — admin "Sync now". Returns `{ ok, tabs, rows, startedAt, finishedAt }` (takes a few seconds). 422 if not configured or a sync is already running; 500 `INTERNAL` with a short reason if Google rejects it (also recorded in the log).
- `GET /sync/status` — admin → `SyncStatus { configured, lastSyncAt?, lastStatus?: "OK"|"FAILED", lastMessage? }`. Use for the dashboard "Last synced …" label / failure banner (show banner when `lastStatus === "FAILED"` or `configured === false`).
- `GET /cron/sheets` — scheduler only (`Authorization: Bearer CRON_SECRET`, no session). Runs nightly at 23:30 IST via `vercel.json`. UI must not call it.
- Sheet is a one-way mirror (Bookings, Payments, CashClosings, Expenses, Garments, Customers, `_SyncLog`), fully rewritten on each run. Setup: `docs/SHEETS_SETUP.md`.
- New table `sync_log` (migration `002_sync_log.sql`); run `npm run db:migrate`.
## 2026-11-26 — Settings API + ops tooling (what the UI must know)

- `GET /settings` (staff + admin) → `{ settings: SettingsDto }` = `{ lateFeePercent, bufferDays, shopName, shopAddress, shopPhone, defaultCareVendor }`. Use `shopName/shopPhone/shopAddress` for receipts and WhatsApp text; show `lateFeePercent` in the pickup reminder ("late fee = X % of rental per day") instead of hard-coding 15.
- `PATCH /settings` (admin) — any of `lateFeePercent` (integer 0–100), `shopName` (required if sent), `shopAddress`, `shopPhone`, `defaultCareVendor`. `bufferDays` is read-only (400 if sent: the database trigger uses a fixed 1-day buffer). Changes are audited (`settings.edit`). Returns the full updated `SettingsDto`. The new late-fee % applies to returns settled from then on.
- Responses of garment list/detail, booking list/detail, alerts, cash/today and reports/summary are unchanged in shape; they now cost ~1 database round trip (`docs/PERF.md`). New indexes `003`/`004` — run `npm run db:migrate`.
- Operator scripts (not API): `db:backup`, `db:restore`, `db:import` (catalogue CSV), `db:wipe` (go-live reset), `perf:audit`.