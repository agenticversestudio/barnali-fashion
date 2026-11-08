# Barnali Fashion — Rental Business Management ERP + Customer Website

**Location**: In front of LIC Office, near Keshariya Restaurant, Bargarh Road, Bargarh, Odisha — 768028  
**Phone**: +91 7978256488  
**Live Production URL**: [https://barnali-erp.vercel.app](https://barnali-erp.vercel.app)  
**GitHub Repository**: [https://github.com/agenticversestudio/barnali-fashion](https://github.com/agenticversestudio/barnali-fashion)  
**Platform**: Full-Stack Functional Client Approval Prototype  

---

## 🌟 Executive Overview
This platform provides a complete, interactive, full-stack-oriented operational prototype for **Barnali Fashion**, a leading clothing and occasion-wear rental boutique in Bargarh, Odisha.

Built to replace their previously liked but defunct platform (associated with Lexicon Solutions), this system bridges two interconnected experiences:
1. **Internal Business ERP (`/erp/*`)**: Mission-critical operations for bookings, physical garment assets, conflict-free availability calendar, handover dispatch, return inspection, partner dry cleaning, master tailor alterations, and cash drawer till closing.
2. **Customer-Facing Boutique Website (`/*`)**: High-conversion storefront enabling customers across Western Odisha to browse bridal lehengas, sherwanis, and gowns, check rental rates and deposit terms, and submit date availability enquiries.

---

## 🚀 Quick Startup Instructions

### Prerequisites
- Node.js v18+ (tested on Node v24.13.0)
- npm v9+

### Start the Local Application
```bash
cd D:\Projects\Barnali\barnali-erp
npm install
npm run build
npm run start -p 3000
```
Or for development with live reload:
```bash
npm run dev
```

Open your browser at:
- **Customer Website**: `http://localhost:3000`
- **Internal ERP Command Center**: `http://localhost:3000/erp/dashboard`
- **Quick Demo Login**: `http://localhost:3000/erp/login`

---

## 💎 Key Features Implemented

### 1. Dual Execution Architecture
- **Demo Mode (Default)**: Works immediately without database credentials. Seeded with 35+ realistic Indian wedding garments, 12 Western Odisha customer profiles, historical & upcoming bookings, laundry jobs, and daily cash closings. Features local persistence and a one-click factory reset button.
- **Backend Mode (Ready)**: Clean service abstraction prepared for instant connection to Supabase PostgreSQL, Auth, and Storage.

### 2. Physical Unit Tracking & Barcodes
- Distinguishes catalog models from individual garment units (`BF-LH-001`, `BF-LH-002`, `BF-SH-001`).
- Real-time physical status tracking: `AVAILABLE`, `RESERVED`, `PREPARING`, `RENTED`, `RETURN_RECEIVED`, `IN_LAUNDRY`, `UNDER_REPAIR`, `QUALITY_CHECK`.
- Printable barcode tags with rack storage locations (`Rack A-01`) and size measurements.

### 3. Date Overlap Conflict Engine
- Prevents double-booking of physical units.
- Enforces an automated 24-hour post-event cleaning buffer before marking units available for the next customer.

### 4. Financial Integrity & Deposit Escrow
- **Strict Segregation**: Refundable security deposits are held in a separate escrow liability ledger and are never conflated with earned rental revenue.
- Multi-point condition checklists assess damage deductions and late fees transparently.
- Automated net deposit refund calculation.

### 5. Document & Receipt Printing
- **A4 Rental Agreement & Invoice**: Includes terms, customer signatures, and itemized deposits.
- **80mm Thermal Receipt**: Fast POS counter print format.

### 6. Operational Workflows
- **Pickup Desk**: Handover verification, accessories checklist, and issue slips.
- **Return Counter**: Condition audit, damage assessment, and deposit settlement.
- **Laundry Hub**: Partner tracking with *Maa Samleswari Dry Cleaners, Bargarh*.
- **Tailor Alterations**: In-house fitting jobs with *Master Salim*.
- **Daily Cash Closing**: Drawer till reconciliation (Opening cash + receipts - refunds - expenses = Expected vs Actual Counted).

---

## 📁 Project Architecture & Routes

```
src/
├── app/
│   ├── page.tsx                    # Customer Website Home
│   ├── collections/page.tsx        # Browse Rental Catalogue
│   ├── garment/[id]/page.tsx       # Outfit Detail & Date Enquiry
│   ├── how-it-works/page.tsx       # 4-Step Rental Process & FAQs
│   ├── about/page.tsx              # Boutique Story & Heritage
│   ├── contact/page.tsx            # Bargarh Location, Map & Timings
│   └── erp/
│       ├── layout.tsx              # Persistent ERP Shell (Sidebar + Header)
│       ├── login/page.tsx          # Staff Auth & 1-Click Role Simulation
│       ├── dashboard/page.tsx      # Operational Command Center & KPIs
│       ├── inventory/page.tsx      # Stock Grid & Table Views, Barcode Tag
│       ├── inventory/[id]/page.tsx # Garment Detail & Lifecycle Timeline
│       ├── bookings/page.tsx       # Orders & Rental Contracts List
│       ├── bookings/new/page.tsx   # 4-Step Booking Wizard with Conflict Engine
│       ├── calendar/page.tsx       # Availability Timeline & Buffer Matrix
│       ├── customers/page.tsx      # CRM Directory & WhatsApp Links
│       ├── operations/
│       │   ├── pickup/page.tsx     # Dispatch & Handover Desk
│       │   ├── returns/page.tsx    # Return Check-in & Deposit Settlement
│       │   ├── inspection/page.tsx # Quality Bay & Defect Classification
│       │   ├── laundry/page.tsx    # Dry Cleaning Partner Management
│       │   └── maintenance/page.tsx# Tailor Alterations & Zari Repair
│       ├── billing/
│       │   ├── invoices/page.tsx   # A4 Agreement & 80mm Thermal Receipt
│       │   ├── deposits/page.tsx   # Segregated Security Deposit Ledger
│       │   ├── expenses/page.tsx   # Daily Shop Expenditure Tracker
│       │   └── cash-closing/page.tsx# Till Reconciliation & Vault Lock
│       ├── reports/page.tsx        # Revenue Analytics & Highest ROI Outfits
│       ├── staff/page.tsx          # RBAC Granular Permission Matrix
│       └── settings/page.tsx       # Business Rules, Buffers & Address
├── components/
│   ├── layout/                     # Sidebar, Headers, Footers
│   └── ui/                         # Status badges, search inputs
├── lib/
│   ├── mockData.ts                 # 35+ Garments, 12 Customers, Bookings
│   ├── dataStore.ts                # Reactive LocalStorage & Business Logic
│   └── utils.ts                    # INR currency formatter, date utilities
└── types/                          # Full TypeScript Domain Types
```

---

## 📖 Complete Documentation
Explore the detailed specifications inside `/docs`:
- [`docs/SKILLS_AUDIT.md`](docs/SKILLS_AUDIT.md)
- [`docs/PRODUCT_BRIEF.md`](docs/PRODUCT_BRIEF.md)
- [`docs/RENTAL_BUSINESS_LOGIC.md`](docs/RENTAL_BUSINESS_LOGIC.md)
- [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md)
- [`docs/CLIENT_DEMO_GUIDE.md`](docs/CLIENT_DEMO_GUIDE.md)
- [`docs/TEST_RESULTS.md`](docs/TEST_RESULTS.md)
- [`docs/PROTOTYPE_LIMITATIONS.md`](docs/PROTOTYPE_LIMITATIONS.md)
