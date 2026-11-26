# ARCHITECTURE — Barnali Fashion ERP: Real Backend

Status: **DRAFT — awaiting owner approval** · Companion: `PRD.md`, `TASKS.md`

## 1. Stack (simplest that meets locked constraints)

| Layer | Choice | Why (1 sentence) |
|-------|--------|------------------|
| App | Next.js 16 App Router (existing) | Already built; API route handlers live in same repo, one deploy. |
| Database | **Turso (libSQL / SQLite)** | Free, never pauses, no cold start, real transactions + triggers = no double-booking. |
| DB client | `@tursodatabase/serverless` compat (plain SQL, no ORM; fetch-based, runs on Node and Workers) | ~12 tables; ORM adds weight and a second schema to maintain. |
| Auth | Own username + password, DB-backed session cookie | 2 roles, 4 users; no third-party auth service needed. |
| Password hash | WebCrypto PBKDF2-SHA256 | Built into every runtime, no native deps. |
| Photos | **Cloudflare R2** (S3 API) + `aws4fetch` | 10 GB free, no egress fee; browser uploads direct to R2. |
| Google Sheet sync | Google Sheets API via service account (`fetch`, no SDK) | One-way nightly copy; owner can open/export in Excel. |
| Tests | `vitest` (dev only) | Money + conflict logic must be proven by tests; only added dependency besides above. |
| Hosting | **Decision gate, see §9** | Vercel Hobby forbids commercial use; Cloudflare must be proven to run Next 16. |

Not used on purpose: ORM, Docker, queues, Redis, microservices, Supabase (free project pauses after inactivity), Neon (scale-to-zero cold start), Google Sheets as DB (no locks, 60 req/min).

Turso note: vendor news (Turso joining Supabase) — libSQL is SQLite-compatible, so data is portable (`.dump`) if terms change.

## 2. Folder Layout & Ownership

```
barnali-erp/
  db/migrations/001_init.sql        (Claude)
  scripts/ seed.ts import-csv.ts migrate.ts   (Claude)
  src/server/                       (Claude — server-only, never imported by client)
    db.ts            libsql client + tx helper
    auth.ts          hash, session, requireRole()
    pricing.ts       quote(), settle(), lateFee()  ← only place with money math
    availability.ts  findConflicts()
    storage.ts       R2 presign
    sheets.ts        nightly sync
    services/        bookings.ts garments.ts customers.ts care.ts expenses.ts cash.ts reports.ts
  src/app/api/v1/**/route.ts        (Claude)
  src/types/index.ts                (Claude only edits — API contract)
  src/lib/api/                      (Gemini — async fetch wrapper, same names as DataStore)
  src/app/erp/**, src/components/** (Gemini)
```

Rule: Gemini never imports from `src/server/`. Claude never edits `src/app/erp/**` or `src/components/**`. Contract change = Claude edits `types/index.ts` + notes it in `docs/API_CHANGELOG.md`.

## 3. Database Schema (SQLite DDL, `db/migrations/001_init.sql`)

Conventions: money `INTEGER` rupees; dates `TEXT 'YYYY-MM-DD'` (IST calendar day); timestamps `TEXT` ISO UTC; `PRAGMA foreign_keys=ON`.

```sql
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,                       -- "pbkdf2$iters$saltB64$hashB64"
  role          TEXT NOT NULL CHECK (role IN ('admin','staff')),
  phone         TEXT,
  active        INTEGER NOT NULL DEFAULT 1,
  failed_count  INTEGER NOT NULL DEFAULT 0,
  locked_until  TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,                       -- sha256 of cookie value
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  last_seen  TEXT NOT NULL,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
-- seed: late_fee_percent=15, buffer_days=1, shop_name, shop_address, shop_phone, default_care_vendor

CREATE TABLE counters (name TEXT PRIMARY KEY, value INTEGER NOT NULL);  -- booking-2026, care, expense

CREATE TABLE garments (
  id              TEXT PRIMARY KEY,                  -- SKU e.g. LF-001
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,
  description     TEXT,
  fabric          TEXT,
  colour          TEXT,
  size            TEXT NOT NULL,
  chest           TEXT, waist TEXT, length TEXT, blouse_size TEXT,
  rack            TEXT NOT NULL,                     -- "Rack A-03"
  shelf           TEXT,                              -- "Shelf 2"
  purchase_cost   INTEGER NOT NULL DEFAULT 0,        -- ADMIN ONLY in API
  rental_price    INTEGER NOT NULL,
  security_deposit INTEGER NOT NULL,
  status          TEXT NOT NULL DEFAULT 'AVAILABLE'
                  CHECK (status IN ('AVAILABLE','OUT_ON_RENT','RETURNED_CLEANING','IN_CARE','DAMAGED_REPAIR','UNAVAILABLE')),
  condition       TEXT NOT NULL DEFAULT 'Excellent',
  notes           TEXT,
  active          INTEGER NOT NULL DEFAULT 1,        -- soft delete
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_garments_cat ON garments(category);
CREATE INDEX idx_garments_status ON garments(status);
CREATE INDEX idx_garments_rack ON garments(rack);

CREATE TABLE customers (
  id         TEXT PRIMARY KEY,                       -- CUST-0001
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL UNIQUE,
  whatsapp   TEXT,
  address    TEXT, city TEXT, pincode TEXT, notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE bookings (
  id               TEXT PRIMARY KEY,                 -- BF-BK-2026-081
  customer_id      TEXT NOT NULL REFERENCES customers(id),
  event_name       TEXT NOT NULL,
  event_date       TEXT NOT NULL,
  pickup_date      TEXT NOT NULL,
  return_due_date  TEXT NOT NULL CHECK (return_due_date >= pickup_date),
  actual_return_date TEXT,
  status           TEXT NOT NULL DEFAULT 'CONFIRMED'
                   CHECK (status IN ('CONFIRMED','OUT_ON_RENT','COMPLETED','CANCELLED')),
  rental_total     INTEGER NOT NULL,
  deposit_total    INTEGER NOT NULL,
  dry_clean_charge INTEGER NOT NULL DEFAULT 0,
  transit_charge   INTEGER NOT NULL DEFAULT 0,
  -- filled at return (server computed)
  damage_charge    INTEGER NOT NULL DEFAULT 0,
  cleaning_charge  INTEGER NOT NULL DEFAULT 0,
  late_days        INTEGER NOT NULL DEFAULT 0,
  late_fee         INTEGER NOT NULL DEFAULT 0,
  refund_amount    INTEGER NOT NULL DEFAULT 0,
  additional_due   INTEGER NOT NULL DEFAULT 0,
  deposit_status   TEXT NOT NULL DEFAULT 'HELD'
                   CHECK (deposit_status IN ('NOT_COLLECTED','HELD','REFUNDED','PARTIALLY_REFUNDED','FORFEITED')),
  handover_condition TEXT,
  return_notes     TEXT,
  notes            TEXT,
  issued_by        TEXT REFERENCES users(id),
  received_by      TEXT REFERENCES users(id),
  created_by       TEXT NOT NULL REFERENCES users(id),
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_status_pickup ON bookings(status, pickup_date);
CREATE INDEX idx_bookings_return ON bookings(return_due_date);

CREATE TABLE booking_items (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id       TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  garment_id       TEXT NOT NULL REFERENCES garments(id),
  rental_price     INTEGER NOT NULL,                 -- price snapshot
  security_deposit INTEGER NOT NULL,                 -- snapshot
  pickup_date      TEXT NOT NULL,                    -- denormalised for the trigger
  return_due_date  TEXT NOT NULL,
  active           INTEGER NOT NULL DEFAULT 1        -- 0 when booking CANCELLED / COMPLETED
);
CREATE INDEX idx_items_garment_active ON booking_items(garment_id, active, pickup_date);
CREATE INDEX idx_items_booking ON booking_items(booking_id);

-- DB-LEVEL double-booking guard (symmetric 1-day buffer from settings default 1)
CREATE TRIGGER trg_item_no_overlap_ins BEFORE INSERT ON booking_items
WHEN NEW.active = 1 AND EXISTS (
  SELECT 1 FROM booking_items o
  WHERE o.garment_id = NEW.garment_id AND o.active = 1
    AND NEW.pickup_date <= date(o.return_due_date, '+1 day')
    AND date(NEW.return_due_date, '+1 day') >= o.pickup_date)
BEGIN SELECT RAISE(ABORT, 'GARMENT_CONFLICT'); END;

CREATE TRIGGER trg_item_no_overlap_upd BEFORE UPDATE OF active, pickup_date, return_due_date, garment_id ON booking_items
WHEN NEW.active = 1 AND EXISTS (
  SELECT 1 FROM booking_items o
  WHERE o.garment_id = NEW.garment_id AND o.active = 1 AND o.id <> NEW.id
    AND NEW.pickup_date <= date(o.return_due_date, '+1 day')
    AND date(NEW.return_due_date, '+1 day') >= o.pickup_date)
BEGIN SELECT RAISE(ABORT, 'GARMENT_CONFLICT'); END;

CREATE TABLE payments (                              -- cash ledger; drives cash closing
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id  TEXT REFERENCES bookings(id),
  kind        TEXT NOT NULL CHECK (kind IN ('ADVANCE','BALANCE','DEPOSIT','EXTRA','REFUND')),
  amount      INTEGER NOT NULL CHECK (amount > 0),   -- REFUND = money OUT, others = money IN
  mode        TEXT NOT NULL CHECK (mode IN ('CASH','UPI','CARD','BANK_TRANSFER')),
  paid_on     TEXT NOT NULL,                         -- IST date
  note        TEXT,
  recorded_by TEXT NOT NULL REFERENCES users(id),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_date ON payments(paid_on);

CREATE TABLE care_jobs (                             -- replaces Laundry/Maintenance/Stitching/DryClean
  id            TEXT PRIMARY KEY,                    -- CARE-0001
  garment_id    TEXT NOT NULL REFERENCES garments(id),
  booking_id    TEXT REFERENCES bookings(id),
  kind          TEXT NOT NULL CHECK (kind IN ('STITCHING','DRY_CLEAN','REPAIR')),
  vendor_name   TEXT NOT NULL,                       -- tailor or dry-cleaner
  sub_type      TEXT,                                -- "Hem alteration", "Delicate zari handwash"
  out_date      TEXT NOT NULL,
  expected_date TEXT,
  rcv_date      TEXT,
  cost          INTEGER NOT NULL DEFAULT 0,
  notes         TEXT,                                -- fitting notes
  status        TEXT NOT NULL DEFAULT 'OUT' CHECK (status IN ('OUT','RECEIVED')),
  created_by    TEXT NOT NULL REFERENCES users(id),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_care_garment ON care_jobs(garment_id);
CREATE INDEX idx_care_status ON care_jobs(status, expected_date);

CREATE TABLE photos (
  id          TEXT PRIMARY KEY,                      -- uuid
  garment_id  TEXT REFERENCES garments(id) ON DELETE CASCADE,
  booking_id  TEXT REFERENCES bookings(id),
  care_job_id TEXT REFERENCES care_jobs(id),
  kind        TEXT NOT NULL CHECK (kind IN ('MAIN','FRONT','BACK','DETAIL','HANDOVER','DAMAGE','STITCH_NOTE')),
  object_key  TEXT NOT NULL UNIQUE,                  -- r2 key garments/<id>/<uuid>.webp
  bytes       INTEGER,
  note        TEXT,
  sort        INTEGER NOT NULL DEFAULT 0,
  created_by  TEXT NOT NULL REFERENCES users(id),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_photos_garment ON photos(garment_id, sort);

CREATE TABLE expenses (                              -- ADMIN ONLY
  id          TEXT PRIMARY KEY,                      -- EXP-0001
  date        TEXT NOT NULL,
  category    TEXT NOT NULL,
  description TEXT NOT NULL,
  amount      INTEGER NOT NULL CHECK (amount > 0),
  mode        TEXT NOT NULL CHECK (mode IN ('CASH','UPI','BANK_TRANSFER')),
  receipt_no  TEXT,
  recorded_by TEXT NOT NULL REFERENCES users(id)
);
CREATE INDEX idx_expenses_date ON expenses(date);

CREATE TABLE cash_closings (                         -- ADMIN ONLY
  id            TEXT PRIMARY KEY,                    -- CC-2026-11-26
  date          TEXT NOT NULL UNIQUE,
  opening_cash  INTEGER NOT NULL,
  cash_in       INTEGER NOT NULL,                    -- snapshot from payments
  cash_refunds  INTEGER NOT NULL,
  cash_expenses INTEGER NOT NULL,
  expected_cash INTEGER NOT NULL,
  actual_cash   INTEGER NOT NULL,
  variance      INTEGER NOT NULL,
  notes         TEXT,
  verified_by   TEXT NOT NULL REFERENCES users(id),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE audit_log (                             -- money edits, price edits, user changes
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  user_id   TEXT NOT NULL,
  action    TEXT NOT NULL,                           -- booking.edit, garment.price, user.create ...
  entity    TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before    TEXT, after TEXT                         -- JSON
);
```

Changes vs prototype types: `Product` table dropped (each costume = one garment row; `totalUnits/availableUnits` gone). 8 roles → 2. `BOOKED/RESERVED/...` aliases removed; 6 physical statuses only. Customer totals derived. Laundry+Maintenance+Stitching+DryClean → `care_jobs`. Added `payments`, `photos`, `settings`, `counters`, `sessions`, `audit_log`.

## 4. Business Logic Modules

`pricing.ts` (pure functions, no DB → unit-testable):
- `quote({items, dryCleanCharge, transitCharge, paymentsIn}) → {rentalTotal, depositTotal, grandTotal, balanceDue}`
- `lateDays(dueDate, returnDate)` — pure string-date diff, no `Date` timezone drift.
- `settle({depositTotal, rentalTotal, damage, cleaning, lateDays, latePercent}) → {lateFee, deductions, refund, additionalDue}`

`availability.ts`: `findConflicts(garmentIds, pickup, due, excludeBookingId?)` for friendly pre-check (shows *who* holds it). The trigger is the real guard; API maps `GARMENT_CONFLICT` abort → `409`.

**Create booking (one write transaction):**
1. `requireRole(staff|admin)`; validate body.
2. Load garments (active, not DAMAGED/UNAVAILABLE) — read **prices from DB**, ignore client prices.
3. Upsert customer by phone.
4. `counters` row `booking-<year>` +1 → id `BF-BK-2026-081`.
5. Insert booking + items (trigger enforces overlap) + advance `payments` row.
6. Commit; on `GARMENT_CONFLICT` rollback → `409 {code:"GARMENT_CONFLICT", garmentId, heldBy, from, to}`.

**Pickup:** status `CONFIRMED→OUT_ON_RENT`, garments→`OUT_ON_RENT`, optional BALANCE/DEPOSIT payments, optional HANDOVER photo ids.
**Return:** body = `{actualReturnDate, damageCharge, cleaningCharge, notes, nextAction per garment, refundMode?}`; server computes via `settle()`, sets `COMPLETED`, `booking_items.active=0` (frees dates), garments→`AVAILABLE|RETURNED_CLEANING|IN_CARE|DAMAGED_REPAIR`, creates `care_jobs` if sent out, writes REFUND payment (if refund paid now). Never trusts `lateFee`/`refund` from client.
**Cancel:** only `CONFIRMED`; items `active=0`; advance policy (kept/refunded) recorded as payment + audit.

## 5. Auth & Authorization

- `POST /auth/login` {username,password} → verify PBKDF2 → random 32-byte token → store sha256 in `sessions` → cookie `bf_session` (`HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=30d`). Staff phones stay logged in 30 days; admin 7 days.
- `failed_count ≥ 5` → lock 15 min.
- Page gate: server check in `src/app/erp/layout.tsx` (`await cookies()` → session lookup → `redirect('/erp/login')`). Next 16 renamed middleware to `proxy.ts` (Node runtime, adapter support platform-specific), and docs say proxy is for optimistic checks only — so it is **optional** (cookie-presence redirect) and never the security boundary. See `docs/DECISIONS.md`. API routes call `requireRole()` themselves.
- CSRF: SameSite=Lax + all mutations are `application/json` + `Origin` header check.
- **Field-level redaction** in `services/*`: for `staff`, strip `purchaseCost`, expenses, cash closings, revenue/profit aggregates. One `redactForRole()` helper + automated test that fuzzes every route with a staff token (AC4).
- Remote logout: admin `DELETE /users/:id/sessions`.

## 6. API Contract (REST JSON, `/api/v1`)

Conventions: camelCase; money = integer rupees; dates `YYYY-MM-DD`; errors `{error:{code,message,details?}}` with `400 VALIDATION`, `401`, `403`, `404`, `409 GARMENT_CONFLICT`, `422 RULE`. Lists: `?q=&status=&limit=&cursor=`.
Legend: **S** = staff+admin, **A** = admin only.

| Area | Endpoint | Role | Notes |
|------|----------|------|-------|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | public/S | |
| Users | `GET/POST /users`, `PATCH /users/:id`, `POST /users/:id/reset-password`, `DELETE /users/:id/sessions` | A | |
| Garments | `GET /garments?q&category&status&rack&availableFrom&availableTo` | S | `purchaseCost` only for A; includes `mainPhotoUrl`, `nextBooking` |
| | `GET /garments/:id` | S | + photos[], booking history (A: + profit stats) |
| | `POST /garments`, `PATCH /garments/:id` | A | price/purchase cost edits → audit |
| | `PATCH /garments/:id/location` | S | `{rack, shelf}` rack locating |
| | `PATCH /garments/:id/status` | S | allowed transitions only |
| | `GET /garments/availability?from&to&category` | S | calendar matrix data |
| Customers | `GET /customers?q=` (phone/name), `POST`, `PATCH /customers/:id`, `GET /customers/:id` | S | totals computed; deposit held visible |
| Quote | `POST /bookings/quote` | S | `{garmentIds[], pickupDate, returnDueDate, dryCleanCharge?, transitCharge?, advance?}` → totals + conflicts[] (live preview for step 4) |
| Bookings | `POST /bookings` | S | see §4 |
| | `GET /bookings?status&from&to&q&customerId`, `GET /bookings/:id` | S | |
| | `POST /bookings/:id/pickup` | S | |
| | `POST /bookings/:id/return` | S | |
| | `POST /bookings/:id/payments` | S | `{kind, amount, mode, note}`; EXTRA/BALANCE/DEPOSIT |
| | `POST /bookings/:id/cancel` | A | |
| | `PATCH /bookings/:id` | A | non-money fields S-ok; money fields A + audit |
| Care | `GET /care?kind&status`, `POST /care`, `POST /care/:id/receive` | S | `receive` sets garment `RETURNED_CLEANING→AVAILABLE` per payload |
| Photos | `POST /photos/presign` → `{uploadUrl, objectKey}`; `POST /photos` (register) ; `DELETE /photos/:id` (A); `GET` returns signed URLs inside parent DTOs | S | §7 |
| Alerts | `GET /alerts` | S | pickups ≤2d, returns due/overdue, care overdue, deposits to refund |
| Expenses | `GET/POST /expenses`, `PATCH/DELETE /expenses/:id` | A | |
| Cash | `GET /cash/today` (computed expected), `POST /cash/closing`, `GET /cash/closings` | A | |
| Reports | `GET /reports/summary?from&to`, `GET /reports/export.csv?type=bookings|payments|expenses|garments` | A | |
| Settings | `GET/PATCH /settings` | A (`GET` limited fields for S: shop name/phone/late %) | |
| Sheets | `POST /sync/sheets` (manual), `GET /cron/sheets` (cron secret) | A / cron | |
| Health | `GET /health` | public | DB ping |

**Key DTOs** (full TS in `src/types/index.ts`):

```ts
// POST /bookings/quote  → 200
{ rentalTotal:number, depositTotal:number, dryCleanCharge:number, transitCharge:number,
  grandTotal:number, advance:number, balanceDue:number,
  conflicts: { garmentId:string, heldBy:string, from:string, to:string }[] }

// POST /bookings (request)
{ customer:{ id?:string, name:string, phone:string, whatsapp?:string, address?:string, city?:string, pincode?:string },
  eventName:string, eventDate:string, pickupDate:string, returnDueDate:string,
  garmentIds:string[], dryCleanCharge?:number, transitCharge?:number,
  advance:{ amount:number, mode:"CASH"|"UPI"|"CARD"|"BANK_TRANSFER" }, notes?:string }

// POST /bookings/:id/return (request)
{ actualReturnDate:string, damageCharge:number, cleaningCharge:number, notes?:string,
  items:{ garmentId:string, nextAction:"AVAILABLE"|"DRY_CLEAN"|"REPAIR"|"DAMAGED" , vendorName?:string, expectedDate?:string, cost?:number }[],
  refund?:{ pay:boolean, mode:"CASH"|"UPI"|"BANK_TRANSFER" }, photoIds?:string[] }
// → settlement
{ lateDays:number, lateFee:number, deductions:number, refund:number, additionalDue:number, depositStatus:string }
```

## 7. Photo Pipeline

1. Phone camera: `<input type="file" accept="image/*" capture="environment">` (Gemini).
2. Client compresses before upload: canvas → WebP (JPEG fallback iOS<16), longest edge 1280 px, quality 0.75 → typically 80–200 KB; hard reject > 400 KB.
3. `POST /photos/presign` {garmentId, kind, contentType, bytes} → server validates role/limits (max 8 photos/garment, ≤ 400 KB) → R2 presigned `PUT` URL (5 min) with key `garments/<garmentId>/<uuid>.webp`.
4. Browser `PUT`s file straight to R2 (does not pass through app server → no body-size limit issue).
5. `POST /photos` {objectKey, kind, note, bookingId?} registers row after server `HEAD`-checks object exists.
6. Read: DTOs include short-lived signed GET URLs (1 h). Bucket is private; keys are unguessable. R2 bucket needs CORS for PUT from app origin.
7. Delete: admin only; removes DB row then R2 object.
Capacity: 1,000 garments × 4 photos × 150 KB ≈ 600 MB ≪ 10 GB.

## 8. Google Sheet Sync (one-way, nightly)

- One Google Cloud service account (free). Owner creates a Sheet in own Drive and **shares it with the service-account email (Editor)**. Sheet ID in env.
- Tabs overwritten each run (data tiny): `Bookings`, `Payments`, `CashClosings`, `Expenses`, `Garments` (no purchase cost? — admin sheet, included), `Customers`, `_SyncLog`.
- Trigger: scheduler hits `GET /api/v1/cron/sheets` with `Authorization: Bearer CRON_SECRET` at 23:30 IST; plus admin "Sync now" button. Last sync time in `settings`.
- Implementation: sign JWT (RS256 via WebCrypto) → access token → `spreadsheets.values.clear` + `values.update` per tab. ~7 API calls/run vs 300/min quota.
- Failure: log in `_SyncLog`, show red banner in admin dashboard; never blocks app.
- Also: CSV export endpoint (same data) as fallback if Google setup delayed.
- Edits made in the Sheet do **not** flow back (stated in handover doc).

## 9. Hosting & Free-Tier Budget (verify before go-live)

Checked in research (figures from vendor pages / reports; re-check on signup):

| Service | Free allowance | Our use | Verdict |
|---------|---------------|---------|---------|
| Turso Free | 5 GB, 500 M rows read/mo, 10 M rows written/mo (over limit → queries blocked, not billed) | ~20 MB/yr; ≤ few M reads/mo with indexes | ✔ huge headroom |
| Cloudflare R2 (Standard) | 10 GB-mo, 1 M Class A, 10 M Class B ops/mo | ~1 GB, < 20 k ops/mo | ✔ (may need card on file — O4) |
| Google Sheets API | free quota | 7 calls/night | ✔ |
| Hosting | see below | | ⚠ gate |

**Hosting gate (Phase 0):** Vercel docs state Hobby = non-commercial only; whether an internal business tool counts is unclear. Pro = $20/mo breaks "₹0 forever". Plan:
1. Spike: deploy Next 16 hello + Turso query on **Cloudflare Workers via `@opennextjs/cloudflare`**; confirm login (PBKDF2 within free-plan CPU limit), cookies, cron trigger work.
2. If pass → Cloudflare (commercial use allowed, free cron triggers).
3. If fail → stay on Vercel Hobby; record risk in handover; owner informed that Vercel could ask to upgrade. Decision logged in `docs/DECISIONS.md`.
Free-tier terms change: handover doc tells owner "₹0 today", and Agreement 5.5 AMC covers any later cost.

## 10. Configuration (env vars, never committed)

`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SESSION_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `GOOGLE_SA_EMAIL`, `GOOGLE_SA_PRIVATE_KEY`, `GOOGLE_SHEET_ID`, `CRON_SECRET`, `APP_ORIGIN`. Local `.env.local` (git-ignored); prod via host dashboard.

## 11. PWA

`app/manifest.ts` (name, icons 192/512, `display: standalone`, theme colour) + minimal service worker that only caches static shell and shows offline page. No offline writes. Gemini owns UI/icons; Claude owns nothing here.

## 12. Backup & Safety

- Turso point-in-time restore (check plan retention at setup) + weekly `scripts/backup.ts` → `.sql` dump to R2 `backups/` (cron).
- All money changes after creation → `audit_log`.
- Migrations: numbered SQL files, `scripts/migrate.ts` records applied in `_migrations` table.

## 13. Frontend Integration Strategy

`src/lib/api/index.ts` exposes async functions with the **same names** as `DataStore` (`getGarments`, `createBooking`, …) returning the new DTOs. Gemini swaps screens one at a time. `DataStore` stays only for public marketing pages until deleted in final cleanup. Screen order: Login → Garments/Inventory → Customers → New Booking (5-step) → Bookings list/pickup/return → Care → Alerts/Dashboard → Expenses/Cash/Reports (admin).
