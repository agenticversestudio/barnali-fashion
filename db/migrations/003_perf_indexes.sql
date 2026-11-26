-- 003: indexes found missing by the T8.3 query-plan audit (scripts/perf-audit.ts, scratch DB at 500 garments / 6000 bookings)

-- bookings list: newest first, optionally per status / per customer, keyset-paginated on (created_at, id)
CREATE INDEX idx_bookings_created ON bookings(created_at DESC, id DESC);
CREATE INDEX idx_bookings_status_created ON bookings(status, created_at DESC, id DESC);
CREATE INDEX idx_bookings_customer_created ON bookings(customer_id, created_at DESC, id DESC);
DROP INDEX idx_bookings_customer;

-- alerts: overdue / due returns of bookings out on rent
CREATE INDEX idx_bookings_status_return ON bookings(status, return_due_date);

-- alerts + deposits-held report: refunds still owed (tiny partial index, only the pending rows)
CREATE INDEX idx_bookings_refund_pending ON bookings(actual_return_date) WHERE status = 'COMPLETED' AND deposit_status = 'HELD' AND refund_amount > 0;

-- audit lookups by (action, entity id), e.g. "was this expense edited?"
CREATE INDEX idx_audit_action_entity ON audit_log(action, entity_id);

-- default customer list ordered by name
CREATE INDEX idx_customers_name ON customers(name);
