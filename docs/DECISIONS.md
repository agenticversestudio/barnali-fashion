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
