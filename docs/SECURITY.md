# Security checklist (T2.5)

| Item | Status | Where |
|------|--------|-------|
| Passwords: PBKDF2-SHA256, 210k iterations, per-user salt, stored as `pbkdf2$iters$salt$hash` | done | `src/server/password.ts` |
| Login lockout: 5 wrong → 15 min lock; right password refused while locked | done, tested | `auth.ts` |
| Same error for unknown user / wrong password; dummy hash equalises timing | done | `auth.ts` |
| Session token: 32 random bytes; only SHA-256 stored in DB; cookie `HttpOnly; SameSite=Lax; Path=/; Secure` (prod) | done | `auth.ts` |
| Session lifetime: staff 30 d, admin 7 d; expired/disabled users rejected; disable/reset/revoke delete sessions | done, tested | `auth.ts`, users routes |
| CSRF: mutations reject a cross-site `Origin`; bodies are JSON only | done, tested | `assertSameOrigin` |
| Role check in **every** API route (`requireUser` / `requireAdmin`); page proxy is only optimistic | done | routes |
| No hashes, tokens, or secrets in any response | tested for auth/users | tests/api/auth.test.ts |
| Security headers on /erp and /api (nosniff, frame deny, referrer) | done | `next.config.ts` |
| Last-admin protection (cannot demote/disable self or last admin) | done, tested | users PATCH |
| Audit log for user create/update/reset/revoke (money edits in Phase 3) | done | `audit.ts` |
| Secrets only in `.env.local` / Vercel env, never committed | `.gitignore` covers `.env*` | |
| Staff fuzz test over every route (AC4); a route added without being classified fails the test | done | `tests/api/staff-fuzz.test.ts` |
| Cron endpoint needs `Authorization: Bearer CRON_SECRET` (constant-time compare, refuses if secret unset/short) | done, tested | `api/v1/cron/sheets` |
| Photos: private bucket, short-lived signed URLs, size/type/count limits, object existence + size verified at register | done, tested | `storage.ts`, `photos.ts` |
| Settings changes (late-fee %) audited; backups contain PII, kept out of git | done | `settings.ts`, `.gitignore` |
