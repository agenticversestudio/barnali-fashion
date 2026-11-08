# Rental Business Logic & State Machine Specification

## 1. Physical Unit Lifecycle State Machine
Garment units move through strictly validated operational states:

```
[PURCHASE / STOCK ENTRY]
           │
           ▼
     [AVAILABLE] ◄────────────────────────────────────────┐
           │                                              │
           ▼                                              │
      [RESERVED]                                   [QUALITY_CHECK]
           │                                              ▲
           ▼                                              │
      [PREPARING]                                  [IN_LAUNDRY]
 (Ironing / Packing)                                      ▲
           │                                              │
           ▼                                              │
    [OUT_ON_RENT]                                         │
 (Picked Up by Client)                                    │
           │                                              │
           ▼                                              │
   [RETURN_RECEIVED]                                      │
 (Counter Check-in)                                       │
           │                                              │
           ▼                                              │
  [INSPECTION_PENDING] ─── (Stains / Sweat Detected) ─────┘
           │
           └─── (Tears / Zipper Broken) ───► [UNDER_REPAIR] ───► [QUALITY_CHECK]
```

### State Definitions
- **AVAILABLE**: Pristine garment stored on showroom rack (e.g. `Rack A-01`), ready for trial fitting and immediate rental.
- **RESERVED**: Unit is committed to a customer booking for a future date window.
- **PREPARING**: Unit is removed from rack 24h before pickup for steam pressing, blouse checking, and packaging into branded dust bags.
- **OUT_ON_RENT**: Client has completed handover verification and collected the garment.
- **RETURN_RECEIVED**: Outfit is returned to store counter and entered into quarantine.
- **IN_LAUNDRY**: Dispatched to partner dry cleaners (e.g. Maa Samleswari Dry Cleaners, Bargarh).
- **UNDER_REPAIR**: Handed over to in-house master tailor for zari re-stitching, hook replacement, or bead fixing.
- **QUALITY_CHECK**: Cleaned/repaired unit undergoes final bead count and scent check before restocking.
- **DAMAGED / RETIRED**: Permanently written off or retired from active rental inventory.

## 2. Date Conflict & Availability Engine
When creating or extending a booking, the engine applies:
1. `Booking Period = [Pickup Date, Return Due Date]`
2. `Quarantine Buffer = 24 Hours post Return Due Date`
3. If `Proposed_Start <= (Existing_Return + 24h)` AND `Proposed_End >= Existing_Pickup`, a **Hard Conflict** is flagged and reservation is blocked.
4. Business Timezone: `Asia/Kolkata` (9:30 AM to 8:30 PM store hours).

## 3. Financial Segregation Rules
- **Rental Charge**: Earned service income subject to business accounting.
- **Security Deposit**: 100% refundable escrow liability. Held in drawer/vault.
- **Damage Deductions**: Retained only upon customer acknowledgment of tears, burns, or broken accessories. Transferred directly to maintenance repair funds.
- **Late Return Fee**: ₹300 per calendar day beyond the 7:00 PM return cutoff.
- **Settlement Formula**:
  $$\text{Net Deposit Refund} = \max\left(0, \text{Security Deposit Held} - \text{Damage Penalty} - \text{Late Fee}\right)$$
