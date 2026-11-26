# PRD — Barnali Fashion ERP: Real Backend (v1.0 Production)

Ref: Work Order `TA/BF-ERP/2026/01` · Client: Barnali Fashion, Bargarh · Status: **DRAFT — awaiting owner approval**
Supersedes the tablet-redesign spec (archived in `archive-tablet-redesign/`, all tasks done).

## 1. Problem

Prototype works but runs on browser `localStorage` + mock data. Consequences found in code audit:

| # | Finding | Where | Risk |
|---|---------|-------|------|
| A1 | Data lives in one browser. Counter tablet, owner desktop, staff phone each see different data. | `dataStore.ts` | ERP unusable multi-device |
| A2 | Double-booking check is read-then-write in JS, no lock. Two devices can book same piece. | `checkConflict`, `createBooking` | Fatal for rental |
| A3 | Booking ID = `bookings.length + 80`. Collides after deletes / on two devices. | `createBooking` | Duplicate IDs |
| A4 | Client sends `lateFee`, `damageDeduction` to settlement; no server recompute. | `processReturnAndSettlement` | Tampering / wrong refunds |
| A5 | **Two different booking-math flows.** `/erp/bookings/new`: balance = rental − advance (no delivery charge). `/erp/bookings` modal: total = rental + deposit + delivery, balance = total − advance. | both pages | Same order, two totals |
| A6 | **Late fee conflict:** 15 %/day of rental (code, settlement UI) vs ₹300/day (invoice footer, `RENTAL_BUSINESS_LOGIC.md`). | `bookings/page.tsx:237`, `invoices/page.tsx:216` | Wrong fee printed on slip |
| A7 | Settlement clamps refund at ₹0 and drops excess: deductions > deposit = customer owes money, system forgets it. | `Math.max(0, …)` | Lost revenue |
| A8 | Cleaning deduction and dry-clean charge exist only at return, never in booking quote. Transit/delivery charge missing in 5-step flow. | `new/page.tsx` | Owner formula not implemented |
| A9 | Customer totals (`totalBookings`, `totalSpent`, `depositsHeld`) mutated by hand. Drift guaranteed. | `createBooking` | Wrong numbers |
| A10 | Role = a dropdown in localStorage. 8 roles in types. No real login. Anyone can pick "owner". | `login/page.tsx`, `ErpSidebar` | No access control |
| A11 | Two overlapping care models: `LaundryJob`/`MaintenanceJob` and `StitchingCareJob`/`DryCleanCareJob`. Two status sets for garments (`BOOKED`… vs `RESERVED`…). | `types/index.ts` | Confusion, double work |
| A12 | Garment photos are static URLs. No upload. | mock data | Cannot onboard real stock |
| A13 | No payment ledger. Cash closing cannot be derived; typed by hand. | `cash-closing` | Cash mismatch undetectable |

Device parity (desktop / tablet / mobile): tablet layout was fixed in the previous phase. **Not re-audited in this spec** — verified per screen during integration (Phase 6 checklist, §6).

## 2. Users & Devices

| Role | Who | Devices | Access |
|------|-----|---------|--------|
| **Admin** | Owner | Desktop, tablet | Everything: financials, profit, expenses, cash closing, staff accounts, prices, purchase cost, edit/delete, settings |
| **Staff** | 2–3 counter/floor staff | Android/iOS phone (also tablet) | Create booking, search stock, rack location, pickup handover, return inspection, care dispatch/receive, upload photos, add customer |

Staff **cannot**: see purchase cost, profit, revenue totals, expenses, cash closing, reports; change prices/settings; delete or edit past financial records; manage users.
Staff **can see** amounts on a booking they handle (rental, deposit, balance) — needed at the counter.

Scale: 1 shop, ≤4 concurrent users, ≤100 entries/day, 300–1,000 garments, <20 MB/yr.

## 3. MVP Features & User Stories

### Admin
- AD1 Log in on any device; stay logged in on shop tablet; log out remotely (revoke staff session).
- AD2 Create / disable staff accounts, reset staff password.
- AD3 Add/edit garment with category, size, colour, purchase cost, rental price, deposit, rack, photos.
- AD4 See dashboard: today's pickups/returns, overdue, deposits held, cash expected, revenue/expense month.
- AD5 Record expense; run daily cash closing with **system-calculated expected cash**; record variance.
- AD6 Edit/cancel a booking; every money edit leaves an audit-log row (who, when, before/after).
- AD7 Change late-fee % and other shop settings.
- AD8 Receive nightly Google Sheet copy of bookings, payments, cash closings, expenses; download CSV anytime.

### Staff
- ST1 Search garment by SKU / name / colour / size; see photo, rack, availability for given dates.
- ST2 Create booking in 5 steps with auto-calculated totals; book is rejected if piece already booked for overlapping dates.
- ST3 Pickup handover: confirm balance collected, record condition + photo.
- ST4 Return: inspect, take damage photos from phone camera, system computes late fee + refund; send piece to laundry / tailor / back to rack.
- ST5 Dispatch / receive care jobs (stitching, dry clean, repair) with vendor + dates.
- ST6 Send booking confirmation / receipt to customer WhatsApp via prefilled `wa.me` link (opens WhatsApp, staff taps send).
- ST7 See in-app alerts: pickup due tomorrow, return overdue, care job overdue.

## 4. Business Rules (single source of truth — implemented once in `src/server/pricing.ts`)

All money = whole **rupees (integer)**. All dates = calendar date `YYYY-MM-DD`, timezone `Asia/Kolkata`.

1. **Rental days**: from `pickup_date` to `return_due_date` inclusive; price is per garment **flat package** (prototype: "₹3,500 for 3 days"), not per-day multiplier.
2. **Quote** (per booking):
   - `rental_total` = Σ garment `rental_price`
   - `deposit_total` = Σ garment `security_deposit` (refundable liability, never counted as revenue)
   - `dry_clean_charge` = optional, entered at counter (revenue)
   - `transit_charge` = optional delivery/transit (revenue)
   - `grand_total` = rental_total + dry_clean_charge + transit_charge + deposit_total
   - `advance_paid` = sum of ADVANCE payments
   - `balance_due` = grand_total − all payments received so far (advance + deposit + balance)
   - Owner formula check: Rental + Deposit + Dry clean + Transit − Advance = Balance. ✔ same.
3. **Availability**: piece is unavailable for [pickup, return_due + 1 day buffer] if another active booking (status ≠ CANCELLED/COMPLETED) overlaps. Overlap test (buffer both sides, so cleaning time is kept before and after): `new_pickup <= existing_return + 1 AND new_return + 1 >= existing_pickup`. Enforced **inside the database** (trigger) plus a transaction. Pieces with status `DAMAGED_REPAIR` or `UNAVAILABLE` cannot be booked.
4. **Late fee**: `late_days = max(0, actual_return_date − return_due_date)` (calendar days, IST). `late_fee = round(rental_total × late_fee_percent / 100) × late_days`. Default `late_fee_percent = 15` (setting, admin-editable). Computed **by server only**.
5. **Settlement**: `deductions = damage + cleaning + late_fee`.
   - `refund = max(0, deposit_total − deductions)`
   - `additional_due = max(0, deductions − deposit_total)` ← **new, fixes A7**; recorded, shown, collectable as EXTRA payment.
   - `damage`, `cleaning` entered by staff at inspection (inputs); admin can later correct with audit log.
6. **Garment physical status** (stored): `AVAILABLE`, `OUT_ON_RENT`, `RETURNED_CLEANING`, `IN_CARE`, `DAMAGED_REPAIR`, `UNAVAILABLE`. "Booked for a future date" is **not** a status; it is derived from bookings (`nextBooking`). Frontend shows "BOOKED" badge when AVAILABLE + booking starts within 3 days.
7. **Booking status**: `CONFIRMED → OUT_ON_RENT → COMPLETED`, or `CANCELLED` (only before pickup). `DRAFT` dropped (no use case).
8. **Customer totals** are never stored; always computed from bookings/payments.
9. **Cash closing**: `expected_cash = opening_cash + cash payments in − cash refunds out − cash expenses`. Computed from ledger; staff/admin enters `actual_cash`; `variance = actual − expected`.

## 5. Acceptance Criteria

- AC1 Two devices submit booking for same piece/overlapping dates at once → exactly one succeeds, other gets clear "already reserved for X (dates)" error. Verified by automated concurrency test.
- AC2 Quote/settlement numbers from API equal hand-calculated examples in test table (≥10 cases incl. late return, damage > deposit, zero deposit).
- AC3 Client cannot send `lateFee` / `refund`; server ignores and recomputes.
- AC4 Staff token gets `403` on every admin endpoint and no financial aggregate/purchase-cost fields in any response (automated test).
- AC5 Data created on phone visible on desktop within one refresh.
- AC6 Counter actions (garment search, booking save) respond < 500 ms p95 from Bargarh on typical 4G / shop Wi-Fi.
- AC7 Photo taken on phone appears on garment page; uploaded file ≤ 300 KB after compression.
- AC8 Nightly Google Sheet contains yesterday's bookings/payments; "Sync now" works; CSV export works.
- AC9 Installs to home screen on Android Chrome and iOS Safari; opens full-screen.
- AC10 `npm run build` + `npm run lint` + tests pass; production URL returns 200; login required for every `/erp/*` page and `/api/*` route (except login, cron).
- AC11 Running cost to client = ₹0/month at expected usage (free-tier limits checked in ARCHITECTURE §9).

## 6. Device Parity Checklist (Frontend, verified per screen in Phase 6)

Every action in §3 must be reachable at ≥40 px touch target on 390 px (phone), 820 px (tablet), 1280 px (desktop) widths; no truncated IDs/amounts; no horizontal page scroll. Staff phone priority screens: stock search, rack view, pickup, return+photos, care register. Admin-only screens may stay desktop/tablet-first but must not break on phone.

## 7. Non-Goals (explicit)

- No public website, public booking cart, online payment gateway (Agreement 3.1). Existing public pages (`/`, `/collections`, `/about`, `/contact`, `/how-it-works`, `/garment/[id]`) stay as-is, static/mock, **not wired to DB**.
- No automatic WhatsApp sending / WhatsApp Business API (paid + Meta approval). Only prefilled `wa.me` links.
- No offline mode. PWA = installable shell only; offline shows "No connection".
- No GST invoicing, barcode-scanner hardware integration, multi-branch, SMS, email.
- No per-day rental pricing, discounts engine, loyalty.
- No roles beyond Admin/Staff.
- No Google Sheet as database; sheet is one-way copy only (edits in sheet do **not** flow back).

## 8. Open Items (need owner/client answer; defaults used if silent)

| # | Question | Default assumed |
|---|----------|-----------------|
| O1 | Late fee: confirm **15 % of rental per day** (not ₹300/day). User brief says 15 %. | 15 %, setting editable; ₹300 text removed from invoice + docs |
| O2 | Hosting: Vercel Hobby terms say commercial use needs Pro ($20/mo = breaks ₹0). Internal-tool status unclear. | Spike Cloudflare Workers/Pages first (Phase 0 gate); fallback Vercel Hobby with written risk note |
| O3 | Does client give real inventory + rates within 7 days (Agreement 5.2)? | Seed with prototype mock data; real import via CSV script |
| O4 | Cloudflare R2 may need a payment card on file to enable, even for free tier. | Verify at signup; if blocker, use Turso-stored thumbnails (≤30 KB) only |
| O5 | Dry-clean charge at booking: is it customer-paid extra (revenue)? | Yes, optional line on booking |
