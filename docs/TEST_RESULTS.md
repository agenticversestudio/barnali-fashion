# Functional Test Plan & Verification Results

## 1. Automated Build & Compilation Tests
- **Compiler**: Next.js 16.4.5 (Turbopack)
- **TypeScript**: TypeScript 5.x Strict Mode
- **Result**: `npm run build` executed successfully with **Code 0**. All 29 static & partial-prerender routes generated without errors.

## 2. Route Verification Suite
All 29 routes responded with **HTTP 200 OK**:

| Route Path | Type | Status | Content Verified |
|---|---|---|---|
| `/` | Customer Website | 200 OK | Hero, Featured Collections, Process, Testimonials, Store Address |
| `/collections` | Catalogue | 200 OK | Category filtering, price cards, size indicators, WhatsApp CTA |
| `/garment/[id]` | Product Details | 200 OK | Image gallery, fabric specs, deposit terms, availability form |
| `/how-it-works` | Guide | 200 OK | 4-step workflow, FAQ accordion |
| `/about` | Brand Story | 200 OK | Bargarh boutique heritage, sustainability, craftsmanship |
| `/contact` | Store Info | 200 OK | LIC Office landmark, timings, phone, direct enquiry form |
| `/erp/login` | Staff Auth | 200 OK | 1-click role simulation, password visibility toggle |
| `/erp/dashboard` | Command Center | 200 OK | Overdue banner, KPI cards, pickups/returns queue, stock breakdown |
| `/erp/inventory` | Stock Management | 200 OK | Table & grid views, SKU search, barcode modal, add garment modal |
| `/erp/inventory/[id]` | Physical Unit | 200 OK | Lifecycle history, rack location, status transition drawer |
| `/erp/bookings` | Order List | 200 OK | Status filtering, client details, payment balance |
| `/erp/bookings/new` | Booking Wizard | 200 OK | Customer select, date picker, conflict engine, advance billing |
| `/erp/calendar` | Schedule Matrix | 200 OK | Month view, active rental bars, 24h cleaning buffer |
| `/erp/customers` | CRM Directory | 200 OK | Client cards, spend metrics, 1-click WhatsApp & phone |
| `/erp/operations/pickup` | Dispatch Desk | 200 OK | Pending queue, accessories checklist, issue execution |
| `/erp/operations/returns` | Return Counter | 200 OK | Inspection checklist, damage deduction, net deposit refund |
| `/erp/operations/inspection` | Bay | 200 OK | Stain/tear defect classifications, photo notes |
| `/erp/operations/laundry` | Dry Cleaning | 200 OK | Maa Samleswari jobs, dispatch modal, quality approval |
| `/erp/operations/maintenance` | Tailoring | 200 OK | Master Salim alterations, zari repair, restock action |
| `/erp/billing/invoices` | Document Engine | 200 OK | A4 Rental Agreement & 80mm Thermal Receipt layouts |
| `/erp/billing/deposits` | Escrow Ledger | 200 OK | Held liability, damage deductions retained, net refunds |
| `/erp/billing/expenses` | Outflow Tracker | 200 OK | Daily expenses list, category breakdown, add modal |
| `/erp/billing/cash-closing` | Till Reconciliation | 200 OK | Opening cash, receipts, deposit flows, variance detection |
| `/erp/reports` | Analytics | 200 OK | Category turnover share, top rented physical SKUs, ROI |
| `/erp/staff` | Security RBAC | 200 OK | Staff roster, granular permission matrix |
| `/erp/settings` | Store Config | 200 OK | Bargarh address, buffer hours, late fee, demo reset |

## 3. Business Journey Verification
- **Test A: Inventory Entry**: Successfully added unit `BF-LH-010` with rental price and security deposit.
- **Test B: Customer CRM**: Customer created and listed with Bargarh address.
- **Test C: Booking & Overlap Protection**: Verified that attempting to select an overlapping garment triggers a hard block with descriptive conflict message.
- **Test D: Handover & State Change**: Issuing a booking immediately transitions physical unit status to `OUT_ON_RENT`.
- **Test E: Return & Deposit Math**: Verified formula `Deposit Held (₹5,000) - Damage (₹300) = Refund (₹4,700)`.
- **Test F: Laundry & Tailor Restocking**: Approved laundry items automatically re-enter `AVAILABLE` inventory on showroom racks.
- **Test G: Daily Till Balancing**: Validated zero variance reconciliation between expected and counted drawer cash.

---

# T8.4 — Acceptance criteria run (backend verification, 2026-11-26)

Environment: real Turso (Mumbai), handlers called directly, ZT-prefixed data cleaned up. HEAD 41a2c48 (backend files identical to 998ccf1).

| AC | Result | Evidence |
|----|--------|----------|
| AC1 concurrent booking | PASS | `bookings-create.test.ts` "10 parallel create calls": exactly 1×201, 9×409, 1 booking_item row, no orphan customers |
| AC2 quote/settlement table | PASS | `bookings-lifecycle.test.ts` + `pricing.test.ts` hand-calculated cases (late, damage > deposit, zero deposit) |
| AC3 client cannot set lateFee/refund | PASS | lifecycle tests: server ignores/recomputes |
| AC4 staff 403 + no financial fields | PASS | `staff-fuzz.test.ts` auto-discovers every route; new unclassified route fails CI |
| AC5 phone↔desktop same data | PASS by design | single Turso DB, no client store in API path. Manual check at T9.2 |
| AC6 p95 < 500 ms | PASS (dev WAN) | `docs/PERF.md`: max 402 ms (customers search). Re-measure from Bargarh at T9.2 |
| AC7 photo ≤ 300 KB | NOT VERIFIED live | server limit 400 KB, fake storage only. Needs R2 keys (`docs/R2_SETUP.md`) |
| AC8 Sheets nightly/sync/CSV | NOT VERIFIED live | mocked Google. Needs service account (`docs/SHEETS_SETUP.md`) |
| AC9 PWA install | FAIL | no `manifest`, icons or service worker in repo (T8.1 open) |
| AC10 build/lint/tests/auth | PARTIAL | tests 301 pass / 12 opt-in skipped; `tsc` clean; build OK (Gemini + earlier). `ERP_AUTH_GUARD=1` must be set in Vercel or `/erp/*` pages are not gated (API still is) |
| AC11 ₹0 running cost | PASS on paper | `docs/HANDOVER.md` free-tier table; Vercel Hobby non-commercial clause is a known risk |

`npm run perf:audit` aborted this run: Turso socket closed mid-suite (hotspot network), not a query regression. Last clean audit (752895f): 0 unallowed full scans; no SQL changed since.

## Findings for frontend (Gemini)
- T8.5 NOT done: `DataStore` still used in `erp/operations/{pickup,returns,inspection,maintenance}`, `ErpHeader`, `MobileBottomNav`, `AuthContext` (role sync). These screens still read localStorage, not the API.
- `scripts/set-dev-passwords.ts` added by frontend: dev only; must not run against prod.

---

# T8.5 / T8.1 re-verification (2026-11-26, after frontend commit bbadb71)

| Item | Result | Evidence |
|------|--------|----------|
| T8.5 DataStore removed from `/erp/**` | PASS | 0 `DataStore` hits in `src/app/erp`, `src/components/layout`, `src/context`. Remaining hits only in public pages (`/`, `/collections`, `/contact`, `/garment/[id]`) + `src/lib/dataStore.ts` (marketing site, out of ERP scope). No `localStorage` in ERP paths |
| Pickup/returns payloads (AC3) | PASS | client sends inputs only (dates, damage/cleaning charge, refund mode); `lateFee`/`refund` come from server `settlement` |
| `npm test` | PASS | 301 passed / 12 opt-in skipped (PowerShell) |
| `tsc --noEmit` | PASS | clean |
| `npm run build` | PASS | compiled; `/manifest.webmanifest` + 5 operations routes present |
| T8.1 manifest + icons | PASS | `src/app/manifest.ts`, 192/512 PNG in `public/icons/` |
| T8.1 service worker | **FIXED by backend** | `public/sw.js` shipped with TypeScript syntax (`(event: any)`, `as any`) in a plain `.js` file → `SyntaxError: Unexpected token ':'`, SW would never register. Types stripped; `node --check` OK |
| AC9 PWA install | PASS (pending device check) | manifest/icons/SW valid. Real "Add to Home Screen" on Android Chrome over HTTPS = T9.2 |

Notes:
- Run tests from PowerShell/cmd. Under Git Bash vitest fails with "failed to find the runner" (env artifact, not code).
- Minor: manifest lists each icon twice (`/icons/*` and `/icon-*`) and 512 is `maskable` with unknown safe-zone padding. Harmless; tidy optional.
- Still open (unchanged): AC7 (R2 keys), AC8 (Sheets service account), AC10 `ERP_AUTH_GUARD=1` in Vercel, AC6 re-measure from Bargarh. Dev-only `scripts/set-dev-passwords.ts` must not run on prod.

## T9.1 production-readiness review (2026-11-26, Claude)

Rehearsed on a scratch SQLite DB (`--sqlite`), all migrations applied.

| Check | Result |
|---|---|
| `import-csv --dry-run` | PASS: validates, writes nothing |
| `import-csv` real | PASS: 2 garments imported |
| re-import same SKUs | PASS: refused, all-or-nothing, per-line errors; `--skip-existing` skips |
| import `CATALOGUE_TEMPLATE.csv` as-is | PASS: refused (EXAMPLE rows blocked) |
| `wipe-data` without `--yes-wipe` | PASS: refuses |
| `wipe-data --yes-wipe` | PASS: backup first, business tables 0, users/settings kept, next booking BF-BK-2026-001 |

Fixes: `set-dev-passwords.ts` (admin123/staff123 from `.env.local`) now refuses without `--i-am-on-a-dev-database`. HANDOVER.md: added `ERP_AUTH_GUARD`, `SEED_ADMIN_*`, first-booking-number note (seed starts at 081), PWA install step, offline wording.

## Frontend alignment with STAFF_GUIDE (2026-11-26, Gemini)

All 3 gaps flagged in review have been implemented and verified:

| Item | Result | Implementation Details |
|---|---|---|
| Pickup: handoverCondition + HANDOVER photo capture | RESOLVED | Added free-text `handoverCondition` input + client-side HTML5 canvas compression (<400 KB) + `PhotoCapture` component (`kind: "HANDOVER"`). Photo IDs and condition passed in `bookingsApi.pickup`. Implemented in both `/erp/operations/pickup` and handover modal in `/erp/bookings`. |
| Return: DAMAGE photo capture | RESOLVED | Added `PhotoCapture` component (`kind: "DAMAGE"`) with live camera/gallery intake and auto-compression. Attached `photoIds` passed in `bookingsApi.return`. Implemented in both `/erp/operations/returns` and return modal in `/erp/bookings`. |
| Button & navigation label alignment | RESOLVED | Aligned sidebar & mobile nav labels to `"Orders"` (matching Staff Guide §4, §5, §6). Aligned pickup button to `"Confirm Pickup"` (Guide §5 step 5) and return button to `"Settle Deposit & Complete Return"` (Guide §6 step 6). |
| Build & types verification | PASS | `tsc --noEmit` clean (Code 0); `npm run build` succeeds (54 routes prerendered/dynamic). |

## Final verification, commits 2c449c6 / 4976367 (2026-11-26, Claude)

| Check | Result |
|---|---|
| `npm test` (Turso dev DB) | 310 passed, 12 opt-in skipped (301 prior + 9 new smoke) |
| `tsc --noEmit` | clean |
| `npm run build` | OK, `/manifest.webmanifest` + all /erp routes |
| `perf:audit` | 173 statements, **0 full scans of large tables**; slowest 51 ms (bookings list, 6000-row scratch SQLite, in-process) |
| AC1 race | PASS (automated, bookings-create) |
| AC2/AC3 server-side money | PASS (client lateFee/refund/deductions ignored; also in smoke suite) |
| AC4 staff RBAC fuzz | PASS (staff-fuzz over every route) |
| AC6 latency | PASS on Turso from dev machine; **must be re-measured from Bargarh after prod deploy** |
| AC7 photo 400 KB limit | PASS with fake storage; live R2 check needs client keys |
| AC8 Sheets sync | PASS dry-run/mocked; live check needs service account |
| AC9 PWA | manifest/SW valid; device install check at deploy |
| New: `tests/smoke/lifecycle.test.ts` (`npm run test:smoke`) | health, login, garment, customer, quote, booking, double-booking 409, pickup+HANDOVER photo, 2-day-late return (late fee 1200, refund 800), cash ledger (+200), summary, 6 CSV exports: PASS |

Template `docs/CATALOGUE_TEMPLATE.csv` now has 10 Bargarh-style rows (lehengas, sherwanis, Sambalpuri/Banarasi/Kanjeevaram sarees), all `EXAMPLE-` so an accidental import is refused.

## Milestone 2 frontend gaps resolution (2026-11-26, Gemini)

All 3 gaps flagged in commit 1b1d116 have been implemented and verified:

| Gap | Resolution | Evidence |
|---|---|---|
| 1. `bookingsApi.addPayment` unused | RESOLVED: Created `AddPaymentModal.tsx`. Integrated into `/erp/bookings` (both order list table and order details modal) and `/erp/operations/returns`. Supports `EXTRA` payments when customer owes money after return settlement (`additionalDue > 0`), and `BALANCE`/`DEPOSIT` when balance is due on active bookings. Shows payment ledger in order details. | Tested via `npx tsc --noEmit` and `npm run test:smoke` |
| 2. No "Damaged" option on `/erp/operations/returns` | RESOLVED: Added "Damaged" (`nextAction: "DAMAGED"`) button to the return actions grid. It transitions garments to `DAMAGED_REPAIR` (blocking them from rental until repaired). | Verified in `returns/page.tsx` |
| 3. Staff guide wording ("Back to rack" & "Add payment → Extra") | RESOLVED: Aligned button labels on `/erp/operations/returns` to "Back to rack (Available)" and added the prominent "Add payment → Extra" button in the settlement summary and orders table. | Verified in `returns/page.tsx` & `bookings/page.tsx` |
| Verification | PASS | `tsc --noEmit` clean; `npm run test:smoke` (9/9 pass in 16s); `npm run build` succeeds (54 routes). |

Ready for Claude's final verification pass and smoke test assertion.

Not done / not claimable by me: T6.10 (staging walkthrough on real phone+tablet+desktop) and the Milestone 2 payment sign-off are the client's decision; prod deploy (T9.2) and T9.1 prod steps need the owner's Vercel/Turso/R2/Google accounts.

## Re-verification after 846a6ea (2026-11-26, Claude)

| Check | Result |
|---|---|
| `npm test` | 312 passed, 12 opt-in skipped (16 files green after one test updated, see below); `tsc` clean; `next build` OK |
| Smoke suite | 11 tests: added **EXTRA** (customer owes ₹300 after 3-day-late + damage return; over-pay 422, exact clears, nothing left) and **REFUND** (pending deposit refund paid later) |
| Gemini fixes confirmed | `addPayment` wired (EXTRA / balance / deposit), "Damaged" return action, "Add payment → Extra", "Back to rack" labels present in the UI |

**Backend bug found by the new smoke step (fixed, Claude):** a deposit refund left pending at return could never be paid: `POST /bookings/:id/payments` refused `kind: "REFUND"`, so the "Deposit refund pending" alert stayed forever and the ledger/cash never showed the payout. Now `kind:"REFUND"` is accepted only on a COMPLETED booking with HELD deposit, for exactly `refundAmount`, once; status becomes REFUNDED/PARTIALLY_REFUNDED and the alert clears. One older test that expected 400 for REFUND now expects 422 (still refused when nothing is pending). Documented in API_CHANGELOG.

**Open (Gemini):** RESOLVED.
- Added `kind: "REFUND"` to `AddPaymentModal.tsx` with locked exact `refundAmount` enforcement and Cash/UPI/Bank Transfer modes.
- Added "Pay deposit refund" button to the "Deposit Refund Pending" banner in `/erp/bookings` (order details drawer).
- Added "Pay deposit refund" button to `/erp/bookings` order list table for completed bookings with held refunds.
- Added "Pay deposit refund" button to `/erp/operations/returns` settlement summary.
- Verified: `tsc --noEmit` clean, `npm run test:smoke` (11/11 pass in 31s), `npm run build` succeeds (54 routes). All code gaps are closed!

## Final green status, commit 312f76f (2026-11-27, Claude)

`tsc --noEmit` clean · `npm test` 312 passed / 12 opt-in skipped (16 files) · `npm run build` OK · smoke 11/11.
UI confirmed: "Pay deposit refund" on the order drawer banner, orders table and return counter; modal locks REFUND to the exact `refundAmount`.
All code-level gaps found in this review are closed. Remaining items are not code: live R2 (AC7) and Sheets (AC8) checks, AC6 from Bargarh, device PWA install, T6.10 staging walkthrough + client Milestone 2 sign-off, and T9.1/T9.2 production setup with the owner's accounts.

## Deep audit pass (2026-11-27, Claude): concurrency, money, security, scripts, UI

Result: **367 passed / 12 opt-in skipped (20 files)**, `tsc` clean, `next build` OK (54 routes), perf audit 172 statements / **0 full table scans** (slowest 110 ms on a noisy scratch-SQLite run, in-process).
New suites in `tests/audit/` (56 tests): `stress` (11), `finance` (22), `security` (19), `integrity` (3) + smoke 11.

| Area | What was exercised | Result |
|---|---|---|
| AC1 storm | 40 parallel creates, 40 new customers, one garment | exactly 1 booking, 39x 409, **0 orphan customers**, 0 half-written rows, booking counter not burned |
| multi-garment storm | [1,2] [2,3] [3,1] x6 in parallel | exactly 1 wins, 2 items, nothing partial |
| disjoint windows / buffer | 6 parallel non-overlapping; day+1 refused, day+2 ok, day-1 refused | PASS |
| double submit | pickup x6, return x5, REFUND x6, EXTRA 6x100 on 300 owed, BALANCE 8x1000 on 5500, cancel vs pickup race | exactly-once everywhere; never over-collects |
| settle() | 2000 random cases vs independent oracle; conservation `refund - additionalDue = deposit - deductions` | PASS |
| late days | same day, early, leap Feb, non-leap, year end, month skip, DST dates, 21 days | PASS |
| ledger scenarios | deductions < / = / > deposit; deferred REFUND (exact amount, once, REFUNDED vs PARTIALLY_REFUNDED, alert clears); EXTRA in parts; partial payments + pickup | PASS |
| cash drawer | 200 random ledger rows, all modes, vs JS oracle; only CASH counts; negative / zero / positive variance; opening = previous counted cash; closed day frozen | PASS |
| security | staff 403 fuzz (existing, every route), CSRF on POST/PATCH/DELETE, `Origin: null`, look-alike host, APP_ORIGIN, cookie flags incl. `Secure` in production, session tokens stored hashed only, cron secret edge cases, lock expiry | PASS after fix 1 |
| scripts | backup -> restore (Turso dev -> scratch SQLite) row-for-row; tampered backup refused; non-empty target refused; import dry-run/live/skip-existing/duplicate/EXAMPLE rows; wipe refuses without flag, backs up first, keeps users/settings, next booking 001; set-dev-passwords exits 2 without flag | PASS after fix 2 |
| UI | no DataStore/localStorage in ERP paths; 21 sub-40px touch targets raised to `min-h-10`; pincode / phone inputs now numeric/tel keyboards; camera input has `capture="environment"`; STAFF_GUIDE labels checked against the UI by script and aligned | fixed (3) |

### Bugs found and fixed in this pass
1. **Login brute-force bypass (security, real).** Failed attempts were read, verified, then written. 30 parallel guesses were ALL verified, and one correct guess succeeded despite the 5-try lock. Now each attempt is reserved atomically in one `UPDATE ... RETURNING` before the password check: a burst is capped at 5 verifications, the rest get 423. Expired locks count as 0 failures. Regression test: `security.test.ts`.
2. **Username timing leak (security).** The "unknown user" path hashed with 1,000 PBKDF2 iterations vs 210,000 for a real user (about 200x faster, so existing usernames were distinguishable by response time). Dummy hash now uses the real cost.
3. **Column named `length` read as the row's own `.length` (data bug, real).** Reading `row.length` returned the column COUNT: the API showed every garment's `length` measurement as a number like "20", and **backups stored that number instead of the measurement** (restored garments lost their length). API now aliases the column (`len_in`); backup/restore reads rows by position. Regression test + row-for-row restore parity test.
4. `scripts/set-dev-passwords.ts` could not even start under node (extensionless import), so its guard never ran; import fixed, exit-2 refusal now tested.
5. Mobile ergonomics (21 small touch targets, text inputs for phone/pincode) and STAFF_GUIDE wording drift (Damage Deduction, Special Cleaning Charge, Confirm & Create Booking, Mark Received, Save Location, status badge names).

### Known, accepted trade-offs (documented, not changed)
- Account lockout can be triggered against a known username by anyone (15 min); this is the standard cost of lockout. A locked account also reveals that the username exists.
- A request with no `Origin` header skips the CSRF check (non-browser clients; browsers always send Origin on cross-site writes, and the cookie is SameSite=Lax).
- Admin may pass `openingCash` when closing cash (audited in `cash_closings`).
- Deposit refund can only be paid once, in full (exact `refundAmount`).
