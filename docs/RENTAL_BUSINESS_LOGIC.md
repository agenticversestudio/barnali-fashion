# Rental Business Logic (v2 — aligned with `docs/specs/PRD.md` §4)

> Authoritative rules live in `docs/specs/PRD.md` §4 and are implemented once in `src/server/pricing.ts`.
> This file is the plain-language summary. If they disagree, PRD wins.

## 1. Garment physical status (stored)

| Status | Meaning |
|--------|---------|
| `AVAILABLE` | On rack, can be rented |
| `OUT_ON_RENT` | Customer has picked it up |
| `RETURNED_CLEANING` | Back at counter, waiting for check / wash |
| `IN_CARE` | At tailor or dry cleaner (open `care_jobs` row) |
| `DAMAGED_REPAIR` | Needs repair, cannot be booked |
| `UNAVAILABLE` | Retired / lost |

"Booked for a future date" is **not** a status. It is derived from bookings (a booking exists for the dates). UI shows a BOOKED badge when AVAILABLE and a booking starts within 3 days.

Flow: `AVAILABLE → OUT_ON_RENT → RETURNED_CLEANING → (AVAILABLE | IN_CARE | DAMAGED_REPAIR)`; `IN_CARE → RETURNED_CLEANING → AVAILABLE` after receive + check.

## 2. Date conflict rule
- Booking period = [pickup date, return due date], calendar days, `Asia/Kolkata`.
- Buffer = 1 day on **both** sides for cleaning.
- Conflict if `new_pickup <= existing_return + 1` AND `new_return + 1 >= existing_pickup`.
- Enforced by a database trigger, so two devices cannot both succeed.
- Cancelled / completed bookings do not block dates. Early return frees the dates.

## 3. Money (whole rupees)
- `rental_total` = sum of garment rental prices (flat package price, not per day).
- `deposit_total` = sum of security deposits. Refundable liability, never revenue.
- Optional extra revenue lines: `dry_clean_charge`, `transit_charge`.
- `grand_total` = rental + dry clean + transit + deposit.
- `balance_due` = grand_total − all payments received.
- **Late fee** = 15 % of `rental_total` per late calendar day (`late_fee_percent` setting, admin editable). Replaces the old "₹300/day" text.
- `deductions` = damage + cleaning + late fee.
- `refund` = max(0, deposit − deductions).
- `additional_due` = max(0, deductions − deposit): customer owes this; recorded as EXTRA payment when collected.

## 4. Cash closing
`expected_cash = opening_cash + cash received − cash refunds − cash expenses`, all from the payments + expenses ledger. Staff/admin enters counted cash; variance is stored.
