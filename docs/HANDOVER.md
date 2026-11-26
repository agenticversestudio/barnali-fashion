# Barnali Fashion ERP — Handover Guide

For the owner and whoever looks after the system later. Plain language first, commands second.
Last updated: 2026-11-26.

---

## 1. What you have

An internal web app for the shop (not for customers). Staff open it on a phone, tablet or the shop computer, log in, and:

- search garments and see which **rack** they are on,
- make bookings (the system refuses a garment that is already reserved for overlapping dates),
- hand over (pickup) and take back (return) garments, with photos,
- track garments sent for dry-clean / repair / stitching,
- see alerts (pickups tomorrow, returns overdue).

The owner (admin) additionally sees expenses, daily cash closing, reports, staff accounts, shop settings and the purchase cost of garments. **Staff never see purchase cost, profit, expenses or cash reports** (this is enforced by the server and covered by an automated test over every API route, not just hidden on screen).

Everything money-related (late fee, refund, totals) is calculated **by the server**. The screen only displays it, so a staff member cannot type a wrong late fee or refund.

Not included, by agreement: public online booking, online payments, automatic WhatsApp sending (staff tap a prefilled `wa.me` link and press send themselves), GST invoicing, and offline working (the installed app only keeps its login screen available offline; bookings need internet).

## 2. How it fits together

```
 Phone / tablet / PC browser  ──►  Vercel (the app, Mumbai region)  ──►  Turso database (Mumbai)   ← all business data
        (installed as an app)              │                       ──►  Cloudflare R2 bucket       ← garment / handover photos
                                           └─ nightly 23:30 IST ──►  Google Sheet (read-only copy of the data)
```

| Part | What it is | Why this choice |
|---|---|---|
| App | Next.js 16 (React), one project, API under `/api/v1` | one codebase, one deploy |
| Database | **Turso** (hosted SQLite), region `aws-ap-south-1` Mumbai | free tier is far bigger than the shop needs; double-booking is blocked inside the database itself |
| Photos | **Cloudflare R2** (private bucket) | 10 GB free; browser uploads directly, app never stores files |
| Hosting | **Vercel Hobby**, region `bom1` (Mumbai) | free; see the licence note in §6 |
| Backup copy | **Google Sheet**, rewritten every night | owner can read bookings/payments even if the app is down |
| Logins | own username + password, PBKDF2 hashed, sessions stored in the database | no paid login service |

Where things are in the code (for a developer):

| Folder | Contents |
|---|---|
| `src/app/api/v1/**` | API routes. Every one checks the user's role first |
| `src/server/**` | all rules: `pricing.ts` (the money formulas, one place), `services/*` (business logic), `auth.ts`, `storage.ts`, `sheets.ts` |
| `src/app/erp/**`, `src/components/**` | the screens |
| `db/migrations/*.sql` | database structure, applied in order (`npm run db:migrate`) |
| `scripts/` | backup, restore, import, wipe, performance audit |
| `tests/` | automated tests (`npm test`) |
| `docs/` | this guide, staff guide, API changelog, security, performance, decisions |

## 3. Accounts — who owns what

**Every account must be in the shop owner's name** (owner's email, owner's phone for recovery). The developer gets temporary "member/collaborator" access only during the warranty period. Fill this table in at go-live and keep a printed copy somewhere safe.

| Service | What for | Account owner / email | Where the password is kept |
|---|---|---|---|
| GitHub (repository `barnali-fashion`) | the source code | ______ | ______ |
| Vercel | runs the app | ______ | ______ |
| Turso | database | ______ | ______ |
| Cloudflare (R2) | photos + off-site backups | ______ | ______ |
| Google Cloud + the Google Sheet | nightly copy | ______ | ______ |
| Domain name (if any) | web address | ______ | ______ |
| App admin login | the owner's login to the ERP | ______ | ______ |

> Losing access to one of these accounts is the single biggest risk to the system. Use the owner's own email, turn on two-step verification, and store recovery codes on paper.

## 4. Configuration (environment variables)

Set in the Vercel dashboard → Project → Settings → Environment Variables. For local work they live in `.env.local` (never committed to git; the repo ignores it).

| Variable | What it is | If missing |
|---|---|---|
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | database address + key (Turso dashboard → your database → Create token) | the whole app fails |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | photo storage (setup: `docs/R2_SETUP.md`) | photo upload returns "storage not configured"; everything else works |
| `GOOGLE_SA_EMAIL`, `GOOGLE_SA_PRIVATE_KEY`, `GOOGLE_SHEET_ID` | Google Sheet copy (setup: `docs/SHEETS_SETUP.md`) | "Sync now" says not configured; everything else works |
| `CRON_SECRET` | password the nightly job uses (16+ random characters) | the nightly sync is refused |
| `ERP_AUTH_GUARD` | set to `1` in production: makes every `/erp/*` page redirect to login when not signed in (the API is always protected; this protects the screens) | pages open without login (empty, because data calls still fail) |
| `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD` | only for the first `db:seed` run: the real admin's login. If omitted a random password is printed once | username `admin` with a random password |
| `APP_ORIGIN` | the app's own address, e.g. `https://erp.example.com` (used to block requests from other websites) | falls back to the request host |

Rotating a secret (do this if a laptop is lost or someone leaves): create a new token/key in that service's dashboard → paste it into Vercel → redeploy → delete the old token. Rotating the Turso token or R2 key never loses data.

## 4a. Setting it all up from zero (about 1–2 hours, cost ₹0 / month)

Do this once, signed in with the **owner's own email** at every service (see §3). Keep each password in the owner's password manager or on paper.

**Step 1 — GitHub.** Create a free account, create a **private** repository `barnali-fashion`, and give the developer temporary access. The developer pushes the code to it.

**Step 2 — Turso (database).**
1. Sign up at turso.tech → create a database named `barnali`, region **AWS ap-south-1 (Mumbai)**.
2. Copy the database URL (starts `libsql://`) and create a token (database → *Create token*, no expiry, read & write).
3. These are `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.

**Step 3 — Cloudflare R2 (photos + backup files).** Follow `docs/R2_SETUP.md` (private bucket, API token, CORS rule for the app's address). You end with `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.

**Step 4 — Google Sheet (nightly read-only copy).** Follow `docs/SHEETS_SETUP.md` (service account, share a blank Sheet with it). You end with `GOOGLE_SA_EMAIL`, `GOOGLE_SA_PRIVATE_KEY`, `GOOGLE_SHEET_ID`.

**Step 5 — Vercel (hosting).**
1. Sign up at vercel.com with the GitHub account → *Add New → Project* → import `barnali-fashion`.
2. Before the first deploy open *Settings → Environment Variables* and add every variable from §4, including `ERP_AUTH_GUARD=1`, a long random `CRON_SECRET`, and `APP_ORIGIN` (the project's address, shown after the first deploy; set it, then redeploy).
3. `vercel.json` already sets the Mumbai region (`bom1`) and the nightly sync (18:00 UTC = 23:30 IST). Deploy.

**Step 6 — Prepare the database** (the developer does this from a computer that has the code and a `.env.local` holding the Turso values — never commit that file):
```
npm run db:migrate
SEED_ADMIN_USERNAME=owner SEED_ADMIN_PASSWORD=<a strong password> npm run db:seed
npm run db:wipe -- --yes-wipe          # only on a database that was used before; resets booking numbers to 001
npm run db:import -- catalogue.csv --dry-run
npm run db:import -- catalogue.csv
```
(On Windows PowerShell set the two `SEED_` variables with `$env:SEED_ADMIN_USERNAME="owner"` first.) `catalogue.csv` is the owner's filled copy of `docs/CATALOGUE_TEMPLATE.csv` (delete the `EXAMPLE-` rows).

**Step 7 — Check it works** (10 minutes): open the app address → log in as the owner → Admin → Settings (shop name, phone, late-fee 15 %) → Admin → Staff (create each staff login) → make one test booking, pick up, return, then remove it with a wipe if the shop has not started yet → take a photo → *Sync now* and look at the Sheet → install on each phone (Android Chrome: menu → **Install app**).

**Running cost:** all four services stay on their free plans (limits and what happens beyond them are in §6).

## 5. The database

- Provider: Turso, free plan, Mumbai. Open the Turso dashboard to see tables and run queries.
- Tables: `users`, `sessions`, `settings`, `counters` (booking / care / expense numbers), `garments`, `customers`, `bookings`, `booking_items`, `payments` (the cash ledger), `care_jobs`, `photos`, `expenses`, `cash_closings`, `audit_log` (every money edit: who, when, before/after), `sync_log`.
- Structure changes are numbered files in `db/migrations`. To apply new ones: `npm run db:migrate` (safe to run repeatedly).
- A garment can never be double-booked: the database refuses an overlapping reservation (with a 1-day buffer before and after) even if two staff save at the same second.
- Money is whole rupees; dates are `YYYY-MM-DD` in Indian time.
- Booking numbers look like `BF-BK-2026-081`; the counter lives in the `counters` table.

## 6. Free-tier limits and what happens if you exceed them

The system was designed to cost **₹0 per month** at 1 shop and 2–3 staff. Numbers below are the vendors' published free allowances at the time of writing; **vendors change them, so re-check the pricing pages once a year**.

| Service | Free allowance (published) | Expected use | If exceeded |
|---|---|---|---|
| Turso Free | 5 GB storage, 500 M rows read / month, 10 M rows written / month | about 20 MB a year; a few million reads a month (all queries use indexes — see `docs/PERF.md`) | Queries are blocked until the month resets or you upgrade. **No surprise bill.** |
| Cloudflare R2 | 10 GB stored, 1 M writes + 10 M reads / month | ~1 GB, a few thousand operations | Charged at small per-GB rates; at this size even 50 GB would be a few dollars a month. The photo rule (max 8 photos per garment, 400 KB each) keeps it small |
| Google Sheets API | free quota | about 20 requests a night | Sync fails and is shown as FAILED; the app is unaffected |
| Vercel Hobby | free for personal / non-commercial use | well inside the usage limits | see the licence note below |

**Licence note (important, decided and recorded in `docs/DECISIONS.md`):** Vercel's Hobby plan terms say it is for non-commercial use. This is an internal shop tool, and we could not find a free host that works (Cloudflare Workers' free plan cannot run the login hashing). The risk is that Vercel may one day ask for the paid plan (about USD 20 / month). The code deliberately uses nothing Vercel-specific, so moving to another host (a paid Cloudflare plan, or a small server) is a configuration change, not a rewrite. The owner has been informed of this risk.

## 7. Backups and disaster recovery

Three independent safety nets:

1. **Turso point-in-time restore** (in the Turso dashboard; how far back depends on the plan — check at go-live and write it here: ______).
2. **Backup files** made by `npm run db:backup` — a single compressed file containing every table (with a checksum so corruption is detected). Run it weekly and copy the file somewhere outside the laptop (`-- --r2` uploads it to the R2 bucket under `backups/`). Backups contain customer phone numbers and password hashes: keep them private. The `backups/` folder is excluded from git.
3. **The Google Sheet** — a nightly human-readable copy of bookings, payments, cash closings, expenses, garments and customers. Not a restore source (it is one-way and edits in the sheet are overwritten), but it lets the owner see everything even if the app is completely down.

### Make a backup
```
npm run db:backup -- --out backups --keep 12 --r2
```
(`--keep 12` deletes local files older than the newest 12; `--r2` also uploads to the bucket.)

### Scenarios

| What happened | What to do |
|---|---|
| Someone edited / deleted the wrong thing | Money edits are in `audit_log` (before/after). For a bigger mistake use Turso point-in-time restore to a *new* database and copy the rows back |
| Database lost or damaged | **Full restore** below |
| Vercel down or account locked | The Google Sheet still has yesterday's data. Re-deploy the repository to any host that runs Node, set the same environment variables |
| Photos bucket lost | Garment records stay; photos must be re-taken. (Keep R2 under the owner's own account to avoid this) |
| A staff phone is lost | Admin → Staff → revoke that user's sessions (and reset the password). Sessions can be revoked at any time |

### Full restore (database lost)
Safest method: restore into a **new, empty** database, then switch the app over.
1. Turso dashboard → create a new database in Mumbai. Create a token.
2. In `.env.local` set `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` to the new database.
3. `npm run db:migrate` (builds the empty tables).
4. `npm run db:restore -- backups/barnali-YYYYMMDD-HHMMSS.json.gz --dry-run` (checks the file and shows the row counts, writes nothing), then run it again without `--dry-run`.
5. Update the two variables in Vercel and redeploy. Everyone logs in again (sessions are not restored).
6. Spot-check: open today's bookings and the cash screen.

The restore refuses a database that already contains data unless you add `--force`; it checks the file's checksum first and compares row counts afterwards. **A restore drill was run on a scratch database (including against a copy of the real data) and is part of the automated tests.** Repeat the drill after every big change and at least twice a year.

Expected loss if the worst happens: at most the time since the last backup (weekly) — or a few minutes if Turso point-in-time restore is used.

## 8. Everyday tasks

(Screen names below follow the final app; a label may differ slightly.)

| Task | How |
|---|---|
| Add / disable a staff member, reset a password, log someone out | Admin → Staff |
| Change late-fee % or shop name / phone / address | Admin → Settings (every change is recorded in `audit_log`) |
| Add garments | one by one in Inventory, or many at once: fill `docs/CATALOGUE_TEMPLATE.csv`, then `npm run db:import -- file.csv --dry-run` (checks only) and without `--dry-run` to load. It validates everything first and loads nothing if any row is wrong |
| Fix a wrong money figure on a booking | Admin only (staff cannot); it is audited |
| Daily cash closing | Admin → Cash. Expected cash is calculated from the payments and expenses ledgers; type the cash actually counted; the difference (variance) is stored |
| Force a Google Sheet update | Admin → Sync now (it also runs by itself at 23:30 IST) |
| Deploy a change | push to the `master` branch; Vercel builds and publishes. Run `npm run db:migrate` first if the release adds a migration |
| Check performance after adding queries | `npm run perf:audit` (reports any full table scans) |

## 9. Go-live checklist (done once, by the developer)

- [ ] All accounts in §3 created in the owner's name; developer added as temporary member.
- [ ] Environment variables set in Vercel (§4); region `bom1`.
- [ ] `ERP_AUTH_GUARD=1` set in Vercel (§4); open `/erp/dashboard` in a private window and confirm it redirects to login.
- [ ] `npm run db:migrate` on the production database.
- [ ] **Create the real admin:** `SEED_ADMIN_USERNAME=... SEED_ADMIN_PASSWORD=... npm run db:seed` (without `--demo`). Then **delete/rotate the development admin** if the database was used for development. **Never run `scripts/set-dev-passwords.ts` on production** (it sets admin123/staff123; it now refuses unless given `--i-am-on-a-dev-database`).
- [ ] **Booking numbers:** `db:seed` starts numbering at BF-BK-2026-081 (prototype numbering). For a clean start at 001 run `npm run db:wipe -- --yes-wipe` once on the empty database (or `--booking-start N` to continue from N).
- [ ] **No demo data in production.** If the database was used for development: `npm run db:wipe -- --yes-wipe` (takes a backup first, keeps users and settings, resets numbering; delete test photos in the R2 dashboard).
- [ ] Import the real catalogue (§8) — first with `--dry-run`.
- [ ] Settings screen: shop name, address, phone, late-fee % (15 by agreement).
- [ ] One test booking → pickup → return → refund on a test garment, then cancel / remove it (or wipe again) so it is not in the real books.
- [ ] Take one photo, run "Sync now" and check the Sheet, check the nightly cron ran the next morning.
- [ ] First backup taken and copied off the laptop; restore drill repeated on a scratch database.
- [ ] Staff guide printed (`docs/STAFF_GUIDE.md`); app installed to the home screen on each staff phone (Android Chrome: menu → Install app; needs the https address).

## 10. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Staff "can't log in" | wrong password; after 5 wrong tries the account is locked for 15 minutes | wait 15 min, or admin resets the password |
| Everything shows an error / blank | Turso quota exceeded, token revoked, or Turso outage | check the Turso dashboard; check the variables in Vercel |
| "storage not configured" when adding a photo | R2 variables missing / wrong | `docs/R2_SETUP.md` |
| Photo upload fails in the browser only | bucket CORS missing the app's address | `docs/R2_SETUP.md` step 3 |
| Sheet shows old data / "Sync failed" banner | Google key changed, sheet no longer shared with the service account, quota | `docs/SHEETS_SETUP.md`; check Admin → sync status message |
| "Garment already reserved" | genuine clash (another booking overlaps ± 1 day) | choose other dates or another garment; the message names the booking holding it |
| Screens slow | usually the phone's internet; the server answers in well under half a second (`docs/PERF.md`) | check connection |

## 11. Security summary
Details in `docs/SECURITY.md`. In short: hashed passwords, lock after 5 wrong tries, sessions revocable, every API route checks the role, cross-site request protection, staff blocked from all admin data (automated test over every route), money edits audited, secrets only in environment variables, photos in a private bucket served by short-lived links.

## 12. Support
Warranty and annual maintenance are as set out in the signed agreement (30-day warranty from sign-off; later work under the maintenance clause). Keep this folder (`docs/`) with the code: it is the manual.
