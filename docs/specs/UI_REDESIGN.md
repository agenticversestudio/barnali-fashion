# ERP UI/UX redesign (boutique editorial)

Scope: **visual design only**. No change to routes, API calls, state hooks, `src/server/**`, `db/**`, `src/types/api.ts`.
Baseline look: commit `8087518` (ivory/cream surfaces, plum + antique-gold accents, serif headings), applied on top of today's code.

## Locked decisions (owner, 2026-11-27)
1. Baseline = commit `8087518`.
2. Backend enums untouched. **4D "Trial Due" / 3D "Packing Ready"** badges are computed client-side from `pickupDate` (booking pickup in 4 / 3 days).
3. Type: **Playfair Display** (page titles, stat titles, section titles) + **Inter** (body) + **Geist Mono with tabular digits** for money, dates, phones, SKUs.

## Design tokens (src/app/globals.css)
| Token | Value | Use |
|---|---|---|
| `ivory` / `ivory-deep` | #FBF8F2 / #F5EFE4 | page background, hover wash |
| `line` / `line-soft` | #E8DFD1 / #EFE8DB | hairline borders / dividers |
| `ink` / `ink-soft` / `mute` | #1C1917 / #44403C / #78716C | text |
| `plum` / `plum-dark` | #4B1835 / #320F23 | brand, primary actions, active nav |
| `gold` / `gold-dark` / `gold-soft` | #B89558 / #8C6F3B / #FAF5EB | accents, eyebrow labels |

Utilities: `.page-title`, `.section-title` (serif), `.eyebrow` / `.eyebrow-mute` (10px, uppercase, `tracking 0.08em`), `.num` (mono + tabular-nums), `.surface` / `.surface-interactive` (white card, hairline border, soft shadow), `animate-in` family (fade / rise / zoom / slide, disabled for reduced motion), global press + focus-visible ring.
Minimum touch target 40 px (`min-h-10`), 44 px for bottom-nav items.

## Phases (one commit each; `tsc`, `npm test`, `next build` after every phase)
- [x] **Phase 1** tokens, fonts, sidebar, top bar, drawer, search modal, mobile bottom nav, palette sweep (maroon to plum, slate to warm stone) across ERP pages
- [x] **Phase 2** shared pieces (StatusPill, EmptyState, StatCard, OrderCard) + Dashboard: Delivery Date Alerts (4D / 3D), Today's Pending Actions, costume-code calendar strip, 6-state bar
- [x] **Phase 3** Orders cards (`/erp/bookings`)
- [x] **Phase 4** Inventory grid with thumbnails and rack tags
- [x] **Phase 5** Return & Care vendor tracker (`/erp/operations/laundry`)
- [ ] **Phase 6** Customer directory cards + deposit ledger, empty states and micro-interactions sweep

## Acceptance for each phase
No functional regression (all 367 tests green, build OK), every touched screen usable at 360 px width, no hard-coded maroon / slate left in touched files, numbers set in `.num`.
