# Performance audit (T8.3 / AC6)

## Method
1. **Query plans** — `npm run perf:audit` runs the API test suite with SQL capture on, builds a scratch SQLite DB at realistic shop size
   (500 garments, 2 000 customers, 6 000 bookings ≈ 2.5 years of trading, 7 700 booking items, 9 200 payments, 1 500 care jobs), runs
   `EXPLAIN QUERY PLAN` on every distinct statement (189) and fails if a large table is full-scanned without being on the allowlist in
   `scripts/perf-audit.ts`. Never touches Turso.
2. **Endpoint latency** — `PERF_LATENCY=1 npx vitest run tests/perf` calls the real handlers against the real Turso DB, 20 runs per endpoint,
   asserts p95 < 500 ms.

## Findings and fixes
| Finding | Fix |
|---|---|
| Unfiltered bookings list scanned all customers, then sorted every booking (O(N) per page) | `JOIN customers` only when searching; indexes `(created_at, id)`, `(status, created_at, id)`, `(customer_id, created_at, id)` — migration 003 |
| Overdue-returns alert scanned all past returns incl. completed ones | `(status, return_due_date)` |
| Refund-pending alert + deposits-held report scanned every booking | `(status, deposit_status)` (003 partial index was ignored by the planner, replaced in 004); deposits-held rewritten as two indexed sums |
| `audit_log` lookups by action + entity (was this expense edited?) full-scanned | `(action, entity_id)` |
| Customer list ordered by name used a temp sort | `(name)` |
| **Round trips.** A request ran 4-10 sequential queries; at ~85 ms per round trip from a developer PC that alone blew the budget (reports: 1 015 ms). `Promise.all` does not help: the Turso HTTP client serialises requests | New `readAll()` sends independent reads as one `batch()`. Reports 10 → 1 round trip, alerts 4 → 1, cash 4 → 1, booking detail/list 4 → 1, garment list/detail 3-5 → 1 |
| Vercel function region vs database region | `vercel.json` pins `bom1` (Mumbai), same as Turso `aws-ap-south-1` |

## Result (0 large-table full scans; allowlisted on purpose: free-text customer search `%term%`, whole-catalogue count (≤ 600 rows), CSV/Sheet exports)
Latency from the developer PC over the public internet to Turso Mumbai (the worst case; production runs in the same region):

| endpoint | p50 ms | p95 ms | round trips |
|---|---|---|---|
| GET /garments | 289 | 330 | 2 |
| GET /garments (availability filter) | 296 | 334 | 2 |
| GET /garments/availability | 274 | 293 | 3 |
| GET /customers?q= | 362 | 402 | 4 |
| GET /bookings | 264 | 290 | 2 |
| GET /bookings?status= | 258 | 299 | 2 |
| GET /bookings/:id | 172 | 218 | 1 |
| POST /bookings/quote | 264 | 282 | 3 |
| GET /alerts | 172 | 216 | 1 |
| GET /care | 174 | 198 | 2 |
| GET /cash/today | 165 | 186 | 1 |
| GET /reports/summary | 180 | 189 | 1 |

(round trips excludes the session check and counts a batch as one.) All p95 < 500 ms. The slowest in-process statements at 6 000 bookings are the full exports (≤ 41 ms), which are deliberate.
Re-run `npm run perf:audit` after adding any query or index.