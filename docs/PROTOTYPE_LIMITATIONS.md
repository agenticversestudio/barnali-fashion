# Prototype Limitations & Production Roadmap

## 1. Prototype Scope vs Production Architecture

| Module | Implemented Prototype Feature | Production Upgrade Required |
|---|---|---|
| **Data Layer** | Reactive LocalStorage persistence with factory demo data reset | Supabase PostgreSQL with Row Level Security (RLS) policies |
| **Authentication** | 1-Click Role Simulation (Owner, Manager, Staff, Accountant) | Supabase Auth with secure HTTP-only session cookies and MFA |
| **Notifications** | In-app notification center & click-to-WhatsApp link generator | Twilio / Gupshup WhatsApp Business API integration |
| **Barcode / QR** | Client-side visual barcode generator & thermal receipt layout | Physical USB/Bluetooth barcode scanner integration & thermal printer driver |
| **Payment Gateway** | Cash / UPI / Card manual recording & till balance | Razorpay / Cashfree payment gateway webhook integration |
| **Photo Uploads** | High-resolution illustrative stock photos with SKU overlays | Supabase Storage bucket with client camera snapshot capture |

## 2. Verified Decisions Needed from Barnali Fashion Owner
1. **Brand Identity**: Confirm whether original logo artwork exists or if the Deep Plum & Antique Gold identity is approved.
2. **GST Registration**: Confirm whether tax invoices require GSTIN and HSN code treatment (rental services: 9973).
3. **Odisha-wide Logistics Scope**: Clarify if courier delivery across Western Odisha (Sambalpur, Jharsuguda, Rourkela) should be integrated with Shiprocket/Delhivery or remain counter-pickup exclusive.
4. **Laundry Vendor Network**: Finalize list of authorized dry-cleaning partners and rate contracts.
