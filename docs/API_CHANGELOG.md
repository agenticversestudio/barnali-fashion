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
| `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | public/S | ⏳ P2 |
| `GET/POST /users`, `PATCH /users/:id`, `POST /users/:id/reset-password`, `DELETE /users/:id/sessions` | A | ⏳ P2 |
| garments (list/detail/create/edit/location/status/availability) | S/A | ⏳ P3 |
| customers | S | ⏳ P3 |
| `POST /bookings/quote`, `POST /bookings`, list/detail, `pickup`, `return`, `payments`, `cancel`, `PATCH` | S/A | ⏳ P3 |
| care, alerts, expenses, cash, reports | S/A | ⏳ P4 |
| photos | S | ⏳ P5 |

This file is updated whenever an endpoint goes live or a DTO changes. Check the top entry before each integration session.
