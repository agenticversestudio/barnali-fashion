# Google Sheet backup sync — owner setup (T7.3)

Backend is done and tested with a mocked Google. Live sync needs these one-time steps.

1. Google Cloud console → new project → enable **Google Sheets API**.
2. IAM → Service accounts → create one → Keys → **Add key → JSON**. Keep the file private.
3. Create an empty Google Sheet. **Share** it (Editor) with the service account email (`...@...iam.gserviceaccount.com`).
4. Env vars (`.env.local`, Vercel dashboard for production):
   - `GOOGLE_SA_EMAIL` = `client_email` from the JSON
   - `GOOGLE_SA_PRIVATE_KEY` = `private_key` from the JSON (keep the `\n` sequences; quotes ok)
   - `GOOGLE_SHEET_ID` = the id in the sheet URL between `/d/` and `/edit`
   - `CRON_SECRET` = random string, 16+ chars (Vercel Cron sends it as `Authorization: Bearer ...`)
5. Run `npm run db:migrate` once on production (adds `sync_log`).
6. Test: log in as admin, `POST /api/v1/sync/sheets`; tabs Bookings, Payments, CashClosings, Expenses, Garments, Customers, _SyncLog appear.

Schedule: `vercel.json` runs `/api/v1/cron/sheets` daily at 18:00 UTC (23:30 IST).
The sheet is a one-way mirror, fully rewritten each run: edits made in the sheet are overwritten. It contains purchase costs and customer phones: share it only with the owner.