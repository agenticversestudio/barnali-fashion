# Database Schema

The old PostgreSQL / Supabase design is **replaced**. Production DB is Turso (libSQL / SQLite).

Authoritative DDL: `docs/specs/ARCHITECTURE.md` §3 → will become `db/migrations/001_init.sql`.

Tables: `users`, `sessions`, `settings`, `counters`, `garments`, `customers`, `bookings`, `booking_items`, `payments`, `care_jobs`, `photos`, `expenses`, `cash_closings`, `audit_log`.

Removed vs old doc: `products` and `product_categories` (each costume is one `garments` row with a `category`), `laundry_jobs` + `maintenance_jobs` (merged into `care_jobs`).
