# Architecture & Responsive Design Document
## Barnali Fashion ERP — Tablet (768px - 1024px) Layout Architecture

### 1. Viewport Breakpoints & Layout Matrix
Tailwind CSS default breakpoints map cleanly to the required tiers:
- **Mobile (`< 768px`)**:
  - Sticky header (`h-14`) with hamburger + brand mark + title + search + notifications.
  - Mobile bottom navigation bar (`h-16`) with 4 primary shop tabs (`Alerts`, `Booking`, `Costumes`, `Return/Care`).
  - Single column mobile cards.
- **Tablet (`768px` to `1023px`, Tailwind `md:` up to `lg:`)**:
  - Full width canvas (`pl-0 lg:pl-64`). Left permanent sidebar is hidden and replaced by a responsive slide-over drawer triggered by the top header hamburger menu.
  - Sticky top header (`h-14` to `h-16`): Hamburger menu trigger (`md:flex lg:hidden`), Global search bar (`⌘K`), Notifications, and Studio Avatar pill with role switcher.
  - Bottom navigation bar: Hidden on tablet (`hidden md:hidden` or kept clean).
  - Main content: 2-column balanced card grids (`grid-cols-1 md:grid-cols-2`), compact 5-column data tables, sticky timeline matrices.
- **Desktop (`>= 1024px`, Tailwind `lg:`)**:
  - Fixed left sidebar (`w-64`, `fixed inset-y-0 left-0 lg:block`).
  - Canvas padded by sidebar (`lg:pl-64`).
  - Full expansive multi-column tables and 4-column cards.

### 2. Component Architecture Changes

```
┌─────────────────────────────────────────────────────────────┐
│ src/app/erp/layout.tsx                                       │
│ - Change sidebar container: hidden lg:block w-64            │
│ - Change main content padding: pl-0 lg:pl-64               │
└───────────────────────────┬─────────────────────────────────┘
                            │
       ┌────────────────────┴─────────────────────┐
       ▼                                          ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐
│ src/components/layout/        │ │ src/components/layout/        │
│ ErpSidebar.tsx                │ │ ErpHeader.tsx                 │
│ - Permanent on lg: (>=1024px) │ │ - Show hamburger on <1024px   │
│ - Role switcher in footer     │ │ - Full search input on md+    │
│ - Studio address in footer    │ │ - Notification & profile menu │
│                               │ │ - Slide-over drawer on <1024px│
└───────────────────────────────┘ └───────────────────────────────┘
```

### 3. Page-Level Responsive Patterns
1. **Dashboard (`/erp/dashboard`)**:
   - Delivery Date Alerts: `grid-cols-1 md:grid-cols-2` with `mt-auto` button row alignment and multi-line costume titles (`line-clamp-2`).
   - Pending Work: 2-row card on tablet (`Row 1: Customer + Status`, `Row 2: Costume + Balance + Action CTA`).
   - Calendar 10-day strip: `grid-cols-5 md:grid-cols-10` with clean SKU pills.
   - Statuses KPI: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`.
2. **Orders (`/erp/bookings`)**:
   - Tablet Card Grid: `grid-cols-1 md:grid-cols-2 lg:hidden` rendering structured 4-row order cards, and full table on `lg:table` (`>=1024px`).
   - Filters: Horizontally scrollable chips with zero wrap.
3. **Inventory (`/erp/inventory`)**:
   - Filter bar: `grid-cols-1 md:grid-cols-2` search + category.
   - Status chips: `flex flex-wrap gap-2`.
   - Table: Pinned image + SKU, consolidated metadata badges (Size/Color/Rack), and stacked Pricing (Rental / Deposit).
4. **Care & Laundry (`/erp/operations/laundry`)**:
   - Stitching & Dry Clean tables: Stacked Timeline column (`Out Date` / `Rcv Date`), multi-line wrapping notes, stacked action buttons (`Details` / `Mark Received`).
5. **Calendar (`/erp/calendar`)**:
   - 30-Day Matrix: Sticky piece SKU column (`sticky left-0 bg-white z-10 w-44`), cell min-width `min-w-[40px]`, horizontal container `overflow-x-auto`.
6. **Customers (`/erp/customers`)**:
   - Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` with 3-column non-wrapping stat footers.
7. **Modals & Drawers**:
   - Dialogs: `max-w-2xl w-[92vw] max-h-[88vh] overflow-y-auto` with sticky footer action buttons.
