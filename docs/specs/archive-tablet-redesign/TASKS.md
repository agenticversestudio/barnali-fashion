# Implementation Tasks (TASKS.md)
## Responsive Tablet Viewport Overhaul (768px - 1024px)

### Phase 1: Layout Shell & Responsive Sidebar / Header
- [x] **Task 1.1: Responsive ErpLayout breakpoint adjustment** (`src/app/erp/layout.tsx`)
  - Adjust sidebar visibility from `md:block` to `lg:block`.
  - Adjust main content left padding from `md:pl-64` to `lg:pl-64` (full width `pl-0` on tablets `< 1024px`).
  - Verify zero content horizontal overflow.
- [x] **Task 1.2: Collapsible slide-over drawer in ErpHeader for `< 1024px`** (`src/components/layout/ErpHeader.tsx`)
  - Show hamburger menu trigger on screens `< 1024px` (`lg:hidden`).
  - Enable slide-over drawer on both mobile (`< 768px`) and tablet (`768px - 1023px`).
  - Maintain desktop top bar layout on `lg:` (`>= 1024px`) with search, notifications, and avatar pill.
  - Verify touch target sizes >= 40px for mobile/tablet buttons.

### Phase 2: Dashboard & Today's Operations Tablet Layout
- [x] **Task 2.1: Delivery Alerts & Pending Actions responsive grid** (`src/app/erp/dashboard/page.tsx`)
  - Update Delivery Alerts grid to `grid-cols-1 md:grid-cols-2` with `mt-auto` footer alignment and `line-clamp-2` for full costume names.
  - Re-structure Today's Pending Work to 2-row layout on tablet with full button visibility.
  - Fix 10-day calendar strip and 6-status KPI grid (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`).

### Phase 3: Orders / Bookings Page Tablet Layout
- [x] **Task 3.1: Hybrid 2-column tablet card grid & scrollable table** (`src/app/erp/bookings/page.tsx`)
  - Render high-density 2-column card grid on tablets `< 1024px` (`grid-cols-1 md:grid-cols-2 lg:hidden`).
  - Keep full 8-column table on desktop `lg:block` with consolidated columns for overflow prevention.
  - Ensure filter tabs are smoothly scrollable with `overflow-x-auto no-scrollbar`.

### Phase 4: Inventory & Stock Tablet Layout
- [x] **Task 4.1: Inventory table & filter optimization** (`src/app/erp/inventory/page.tsx`)
  - Make search input and category dropdown side-by-side on tablet (`grid grid-cols-1 sm:grid-cols-2`).
  - Wrap status filter chips (`flex flex-wrap gap-2`).
  - Consolidate inventory table columns for tablet (`Size/Color/Rack` badges under Title, stacked Pricing).

### Phase 5: Care & Laundry (Stitching & Washing) Tablet Layout
- [x] **Task 5.1: Care tables responsive timeline & notes wrapping** (`src/app/erp/operations/laundry/page.tsx`)
  - Combine Out Date and Rcv Date into a stacked `Timeline` column.
  - Allow `Fitting Notes` to wrap cleanly across 2-3 lines without truncating.
  - Stack action buttons (`Details` and `Mark Received`) with min 40px touch targets.

### Phase 6: Calendar Availability Matrix & Customers Page
- [x] **Task 6.1: Calendar 30-day matrix sticky column & scroll** (`src/app/erp/calendar/page.tsx`)
  - Make `Piece SKU` column sticky (`sticky left-0 bg-[#FAF9F6] z-20 w-52 border-r border-[#E6E4DF] shadow-[2px_0_4px_rgba(0,0,0,0.03)]`).
  - Set each date column min width to 40px inside an `overflow-x-auto` wrapper.
- [x] **Task 6.2: Customers responsive cards & modals check** (`src/app/erp/customers/page.tsx`)
  - Adjust grid to `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`.
  - Fix 3-column financial metric footer (`Orders`, `Spent`, `Deposit Held`).
  - Check all modal sheets for `max-w-2xl w-[92vw] max-h-[88vh] overflow-y-auto`.

### Phase 7: Verification, Git Commit & Vercel Production Deploy
- [x] **Task 7.1: Build check & production deployment**
  - Run `npm run build` and ensure 0 TypeScript / bundling errors.
  - Git commit checkpoint.
  - Deploy to Vercel production (`npx vercel --prod --yes`) and verify HTTP 200 at `https://barnali-erp.vercel.app`.
