-- 004: the partial index from 003 was never chosen by the planner; a plain (status, deposit_status) index is,
-- and it serves both the refund-pending alert and the deposits-held report.
DROP INDEX idx_bookings_refund_pending;
CREATE INDEX idx_bookings_status_deposit ON bookings(status, deposit_status);
