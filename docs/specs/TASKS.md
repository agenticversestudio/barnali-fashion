# TASKS — Barnali Fashion ERP: Real Backend

Status: **APPROVED 2026-11-26. Phases 0–3 complete (Week-1 checkpoint). Next: Phase 4.**
Rules: one task at a time · verify before ticking · checkpoint commit per task/phase (repo is not yet a git repo → T0.0) · Claude = backend, Gemini = frontend (see ARCHITECTURE §2).
Tag: `[C]` Claude, `[G]` Gemini, `[U]` owner/user action.

Milestones (Agreement Art. 2/4): **Week 1** = Phases 0–3 · **Week 2** = Phases 4–5 · **Week 3** = Phase 6 + staging → *Milestone 2 ₹6,000* · **Week 4** = Phases 7–9 → *Milestone 3 ₹6,000*.

## Phase 0 — Decisions & Accounts (before any backend code)
- [x] **T0.0 [C]** Repo already git (origin `agenticversestudio/barnali-fashion`), `.gitignore` covers `.env*`, `node_modules`, `.next`. Specs committed.
- [x] **T0.1 [U]** Specs approved; O1–O5 default answers taken (see `docs/DECISIONS.md`).
- [ ] **T0.2 [U]** Create free accounts: Turso, Cloudflare (R2 + Workers), Google Cloud (service account). Send credentials via `.env.local` only, **never in chat/docs**.
- [x] **T0.3 [C]** Read Next 16 docs (route handlers, proxy, cookies). Findings in `docs/DECISIONS.md`: `proxy.ts` replaces middleware, optimistic-only, adapter support platform-specific → page auth done in `erp/layout.tsx`.
- [x] **T0.4 [C]** Hosting spike done → **Vercel Hobby** (Cloudflare free: 10 ms CPU kills PBKDF2 login). See DECISIONS.md. ToS risk flagged to owner.
- [x] **T0.5 [C]** `RENTAL_BUSINESS_LOGIC.md` + `DATABASE_SCHEMA.md` updated. (Gemini ₹300→15 % text change in `invoices/page.tsx` pending commit by Gemini.)

## Phase 1 — Database Initialisation  (Week 1)
- [x] **T1.1 [C]** Add dep `@tursodatabase/serverless` (import `/compat`); `src/server/db.ts` (client, `tx()` helper). *Verify:* `/api/v1/health` returns `{db:"ok"}` locally. (verified vs Turso Mumbai; note: `cacheComponents` is on, so no `export const dynamic` in routes)
- [x] **T1.2 [C]** `db/migrations/001_init.sql` (ARCHITECTURE §3 incl. triggers) + `scripts/migrate.ts` with `_migrations` table. *Verify:* run twice, second is no-op; `.schema` matches. (run: `npm run db:migrate`; applied to Turso, 14 tables + 2 triggers; 2nd run no-op)
- [x] **T1.3 [C]** Trigger test (SQL-only): insert overlapping `booking_items` → `GARMENT_CONFLICT`; non-overlap ok; buffer edge days ok; inactive ignored. (`npm test`, 11 tests green; NOTE run tests from PowerShell/D: path casing, Git-Bash d: path breaks vitest)
- [x] **T1.4 [C]** `scripts/seed.ts`: settings, counters, 1 admin (password from env, prompted), demo garments/customers from `mockData.ts` **behind `--demo` flag only**. *Verify:* seed twice idempotent. (`npm run db:seed -- --demo`; idempotent)
- [x] **T1.5 [C]** Rewrite `src/types/index.ts` to the new contract (2 roles, 6 statuses, DTOs); list breaking changes in `docs/API_CHANGELOG.md` for Gemini. *Verify:* typecheck errors only in files Gemini owns. (contract in `src/types/api.ts`, legacy index.ts kept until T8.5; see DECISIONS)

## Phase 2 — Auth & Roles
- [x] **T2.1 [C]** `src/server/auth.ts`: PBKDF2 hash/verify, session create/lookup/revoke, `requireRole()`.
- [x] **T2.2 [C]** `POST /auth/login|logout`, `GET /auth/me` + lockout after 5 fails. *Verify:* curl matrix (good, bad pass, locked, disabled user).
- [x] **T2.3 [C]** Route guard for `/erp/*` pages (middleware/proxy per T0.3). *Verify:* unauth → redirect; `/erp/login` open. (`src/proxy.ts`, flag `ERP_AUTH_GUARD=1`, off until T6.2 so prototype keeps working)
- [x] **T2.4 [C]** Users API (create staff, disable, reset password, revoke sessions) + `audit_log` writer. *Verify:* staff token → 403.
- [x] **T2.5 [C]** Security checklist: Origin check on mutations, cookie flags, no secrets in responses.

## Phase 3 — Core Rental Domain (money-critical)
- [x] **T3.1 [C]** Add `vitest`. `pricing.ts`: `quote`, `lateDays`, `settle`. ≥ 15 table tests (late 0/1/3 days, damage > deposit, zero deposit, dry-clean+transit, partial advance, date-string edge: month end, leap day). *Verify:* tests green.
- [x] **T3.2 [C]** Garments API: list/search/filter, detail, create/edit (admin), location, status transitions, `availability` matrix. Staff redaction of `purchaseCost`. *Verify:* staff vs admin response diff test.
- [x] **T3.3 [C]** Customers API (phone search, upsert, derived totals).
- [x] **T3.4 [C]** `availability.ts` + `POST /bookings/quote`. *Verify:* conflict message names holder + dates.
- [x] **T3.5 [C]** `POST /bookings` (§4 transaction; IDs from counters; price from DB; advance payment row). *Verify:* **concurrency test** — 10 parallel create calls same garment/dates → exactly 1 success, 9 × 409 (AC1).
- [x] **T3.6 [C]** `POST /bookings/:id/pickup` + payments endpoint.
- [x] **T3.7 [C]** `POST /bookings/:id/return` using `settle()`; frees dates; creates care jobs; REFUND payment. *Verify:* AC2/AC3 (client-sent `lateFee` ignored).
- [x] **T3.8 [C]** Cancel + admin edit with audit log. *Verify:* cancelled booking frees garment dates.
- [x] **T3.9 [C]** Bookings list/detail with filters; derived `balanceDue`, `grandTotal`, `isOverdue`.
- [x] **CHECKPOINT: Week-1 review.** Commit + short demo script with curl; owner informed. (done: `docs/WEEK1_DEMO.md`, 108 tests)

## Phase 4 — Care, Cash, Reports, Alerts  (Week 2)
- [x] **T4.1 [C]** Care jobs API (create, list, receive → garment status).
- [x] **T4.2 [C]** Alerts endpoint (pickups ≤ 2 days, returns due/overdue, care overdue, refunds pending).
- [x] **T4.3 [C]** Expenses API (admin only).
- [x] **T4.4 [C]** Cash: `/cash/today` computed from payments + expenses; closing save with variance. *Verify:* numbers reconcile with hand example.
- [x] **T4.5 [C]** Reports summary (revenue, deposits held, expenses, top garments, utilisation) admin only + CSV export.
- [x] **T4.6 [C]** Staff-token fuzz test over **every** route (AC4).

## Phase 5 — Photos
- [x] **T5.1 [C]** `storage.ts` R2 presign (`aws4fetch`), bucket CORS config doc.
- [x] **T5.2 [C]** `/photos/presign`, `/photos`, delete; limits (8/garment, 400 KB). *Verify:* upload via curl, read signed URL.
- [ ] **T5.3 [G]** Camera capture + client compression component (WebP 1280 px) *(contract in ARCHITECTURE §7)*.
- [x] **T5.4 [C]** Photos embedded in garment/booking DTOs (main photo URL in lists).

## Phase 6 — Frontend Integration  (Week 3) — Gemini leads, Claude supports
Per screen: swap `DataStore` → `src/lib/api`, add loading/error/empty states, pass device checklist (PRD §6: 390/820/1280 px, ≥ 40 px targets, no truncation). Tick only after Claude re-tests the API calls.
- [ ] **T6.1 [G]** `src/lib/api/*` client + auth wrapper (401 → login).
- [ ] **T6.2 [G]** Login page (real), role from `/auth/me`, remove role dropdown.
- [ ] **T6.3 [G]** Inventory list + detail + photo upload + rack edit.
- [ ] **T6.4 [G]** Customers.
- [ ] **T6.5 [G]** New Booking 5-step using `/bookings/quote` for live totals; **delete the duplicate math in `bookings/page.tsx`** (finding A5).
- [ ] **T6.6 [G]** Bookings list, pickup handover, return & settlement (read-only results from server).
- [ ] **T6.7 [G]** Care register, Calendar matrix, Alerts/Dashboard.
- [ ] **T6.8 [G]** Admin screens: Expenses, Cash closing, Reports, Staff management, Settings; hide from Staff nav.
- [ ] **T6.9 [G]** WhatsApp `wa.me` buttons (confirmation, receipt, reminder) with prefilled text; printable invoice with correct late-fee wording.
- [ ] **T6.10 [C+G]** Staging deploy + end-to-end walkthrough on real phone + tablet + desktop. **→ Milestone 2 review (₹6,000).**

## Phase 7 — Google Sheet Sync & Export
- [x] **T7.1 [C]** `sheets.ts` JWT → token → write tabs. *Verify:* test sheet populated.
- [x] **T7.2 [C]** Cron endpoint + scheduler config (per hosting decision) + `_SyncLog` + dashboard banner field.
- [ ] **T7.3 [U]** Owner creates Sheet, shares with service account. **[G]** "Sync now" button + last-sync label.

## Phase 8 — PWA, Hardening, Test Pass
- [ ] **T8.1 [G]** `manifest.ts`, icons, minimal SW, install prompt hint; check Android Chrome + iOS Safari.
- [x] **T8.2 [C]** Backup script (SQL dump → R2) + restore drill on scratch DB.
- [x] **T8.3 [C]** Performance check: p95 < 500 ms on key endpoints (AC6); add indexes if needed; no full-table scans on `bookings`.
- [ ] **T8.4 [C]** Full AC1–AC11 checklist run; results in `docs/TEST_RESULTS.md`.
- [ ] **T8.5 [C]** Remove dead `DataStore`/mock usage from `/erp/**`; keep public pages untouched.

## Phase 9 — Deployment, Handover & Training  (Week 4)
- [ ] **T9.1 [C]** Production env vars, prod migrate, create real admin, import real catalogue via `scripts/import-csv.ts` (CSV template given to client) — **no demo data in prod**.
- [ ] **T9.2 [C]** Production deploy; verify 200, login, booking round-trip, photo, sheet sync, cron.
- [x] **T9.3 [C]** Docs: `docs/HANDOVER.md` (accounts owned by whom, where data lives, how to restore, free-tier limits & what happens if exceeded, sheet is one-way), `docs/STAFF_GUIDE.md` (Hindi/Odia-friendly steps with screenshots: login, search, book, pickup, return+photo, care).
- [ ] **T9.4 [U]** Staff training session (on-site/remote); collect feedback list.
- [ ] **T9.5 [C]** Fix training feedback (in-scope only; extras → supplementary work order per Art. 5.3). Final sign-off. **→ Milestone 3 (₹6,000), 30-day warranty starts.**
