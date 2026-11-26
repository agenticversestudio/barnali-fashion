# Cloudflare R2 photo storage — owner setup (T0.2)

Backend is finished and tested against an in-memory fake. Live uploads need these one-time steps.

1. Cloudflare dashboard → **R2** → create bucket `barnali-photos` (private; do NOT enable public access).
2. R2 → **Manage API tokens** → create token with **Object Read & Write** on that bucket. Note Account ID, Access Key ID, Secret Access Key.
3. Bucket → **Settings → CORS policy**:
   ```json
   [
     {
       "AllowedOrigins": ["https://<your-app-domain>", "http://localhost:3000"],
       "AllowedMethods": ["PUT", "GET", "HEAD"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
4. Env vars (`.env.local` locally, Vercel dashboard in production):
   `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.
5. Smoke test: log in, `POST /api/v1/photos/presign`, `PUT` a small WebP to `uploadUrl`, `POST /api/v1/photos`, open the returned `url`.

If R2 env vars are missing the photo endpoints return `500 INTERNAL "Photo storage is not configured"`; everything else keeps working.
