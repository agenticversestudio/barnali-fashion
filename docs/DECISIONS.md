# Decisions Log

## 2026-11-26 — Specs approved by owner
PRD / ARCHITECTURE / TASKS in `docs/specs/` approved. Phase 0 started.
Defaults taken for open items O1–O5 (PRD §8) because owner was silent: late fee 15 %, Cloudflare hosting spike first, seed with mock data, R2 card requirement unchecked, dry-clean charge = optional revenue line.

## 2026-11-26 — Next.js 16 findings (T0.3, read from `node_modules/next/dist/docs/01-app`)
- `middleware.ts` is renamed **`proxy.ts`** (project root or `src/`). Defaults to **Node.js runtime**; `runtime` config is not allowed in it.
- Proxy platform support: Node server, Docker = yes; **adapters = "platform-specific"**. Cloudflare/Netlify adapters are described as still in progress (`17-deploying.md`). So Node-runtime proxy on Cloudflare is **not guaranteed**.
- Docs say proxy is for **optimistic checks only** (e.g. cookie present → else redirect), not full auth. Real auth check belongs in the data layer.
- `cookies()` from `next/headers` is **async** (`await cookies()`); can set cookies in Route Handlers and Server Functions.
- Route Handlers: `app/**/route.ts`, export `GET/POST/PATCH/DELETE`; not cached by default; cannot sit beside a `page.tsx` at same segment.

**Consequence:** do not depend on `proxy.ts` for security. Page protection = server check in `src/app/erp/layout.tsx` (reads session via `cookies()`), API protection = `requireRole()` in every route. `proxy.ts` stays optional (cookie-presence redirect only). This keeps the app portable between Cloudflare and Vercel. ARCHITECTURE §5 updated accordingly.

## 2026-11-26 — Repo state
`barnali-erp` is already a git repo (origin `agenticversestudio/barnali-fashion`, branch `master`). T0.0 `git init` not needed.

## 2026-11-26 — Hosting gate result (T0.4): **Vercel Hobby**, not Cloudflare Workers
Spike: Next 16.4.5 + `@opennextjs/cloudflare` 1.20.19, run in workerd (`wrangler dev`), Turso Mumbai from India.
- Windows build fails (`EPERM symlink`); builds only in WSL/Linux CI. Minor.
- `@libsql/client` fails on Workers ("Failed to load external module", Next lists it as server-external). `@tursodatabase/serverless/compat` (fetch-based) works: query ~100 ms.
- PBKDF2-SHA256 100k iters = ~80 ms CPU. Workers **Free = 10 ms CPU/request** → login would hit Error 1102. Fix needs Workers Paid ($5/mo) → breaks ₹0 rule.
- Hello-world bundle already 956 KiB gzip of 3 MiB free cap; real app likely close to cap.
- `proxy.ts` not supported by the OpenNext adapter (unverified issue #1277). Already avoided by design.
**Decision:** deploy on Vercel Hobby (Node runtime: native scrypt/PBKDF2, no CPU cap issue). **Known risk:** Hobby ToS = non-commercial use; client must be told (PRD O2). Mitigation: keep code portable (DB client = `@tursodatabase/serverless/compat`, no Vercel-only APIs) so a move to a ~$5/mo plan or VPS is a config change.
