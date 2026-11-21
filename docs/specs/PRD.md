# Product Requirements Document (PRD)
## Barnali Fashion ERP — Responsive Tablet Redesign & Viewport Optimization

### 1. Problem Statement
On tablet viewports (`768px` to `1024px`, spanning both Portrait like iPad 768x1024 / iPad Air 820x1180, and Landscape like 1024x768), the permanent desktop left sidebar consumes ~240px+ of horizontal width. This causes:
- Severe content squishing and horizontal overflow on multi-column tables and calendar matrices.
- Aggressive text truncation (`truncate`) cutting off vital operational data (customer names, costume names, addresses, amounts).
- Cramped touch targets that fail touch ergonomics (< 40x40px).
- Uneven card grids and misaligned action buttons.

### 2. Target Users & Environment
- **Users**: Boutique Owner, Shop Floor Counter Operators, Tailoring & Laundry Staff at Barnali Fashion, Bargarh, Odisha.
- **Devices**: iPad (10.2", 10.9"), iPad Air, Android Tablets (Samsung Galaxy Tab, Lenovo Tab) placed on store counter stands or carried around racks.
- **Constraints**: Touch-first operation, fast scanning, zero horizontal body scroll, high contrast on warm alabaster (`#F7F6F3`) background.

### 3. Goals & Success Criteria
1. **Collapsible Sidebar on `< 1024px` (`lg` breakpoint)**:
   - On `< 1024px`, sidebar converts from permanent fixed bar to a smooth slide-over drawer triggered by the top bar hamburger menu (`Menu`).
   - On `>= 1024px`, permanent sidebar remains intact (`lg:block`, `lg:pl-64`).
   - Existing mobile navigation (`< 768px`) bottom tab bar and top bar remain 100% intact.
2. **Zero Horizontal Page Overflow**:
   - `overflow-x: hidden` on page canvas; tables and calendar matrices have smooth, self-contained horizontal scrolling with sticky headers and pinned keys.
3. **Typography & Wrapping Integrity**:
   - Critical data (Costume Names, Client Names, Mobile numbers, Event Dates, Godown Racks, Financials) wrap gracefully with `line-clamp-2` or structured stacks, eliminating truncation bugs.
4. **Touch Target Ergonomics**:
   - All interactive controls (`WhatsApp`, `Details`, `Handover`, `Return & Refund`, `Mark Rcv`, filters) meet minimum 40px touch boundaries with proper gaps.

### 4. Explicit Non-Goals
- No backend/data model rewrites or breaking API changes.
- No alteration to existing Desktop layout (`>= 1024px`) or Mobile bottom bar (`< 768px`).
- No changes to the 5-step counter booking logic, 15% late fee rules, or care workflows.
