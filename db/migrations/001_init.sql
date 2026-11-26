-- 001_init: generated from docs/specs/ARCHITECTURE.md §3

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
