-- Google Sheets sync history (also the source of truth for the dashboard "last synced" label)
CREATE TABLE sync_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  trigger     TEXT NOT NULL CHECK (trigger IN ('CRON','MANUAL')),
  triggered_by TEXT,                                 -- user id for MANUAL
  started_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  finished_at TEXT,                                  -- NULL while running
  status      TEXT NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING','OK','FAILED')),
  tabs        INTEGER NOT NULL DEFAULT 0,
  row_count   INTEGER NOT NULL DEFAULT 0,
  message     TEXT
);
CREATE INDEX idx_sync_log_started ON sync_log(started_at DESC);
