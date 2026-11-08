# Client Demonstration Walkthrough Guide
## Prepared for: Barnali Fashion, Bargarh, Odisha

This guide details the step-by-step presentation flow for demonstrating the platform prototype to the store owner.

---

### Step 1: Open the Application
1. Start the server using `npm run start` or `npm run dev` in `D:\Projects\Barnali\barnali-erp`.
2. Open your browser at `http://localhost:3000`.
3. Highlight that the prototype is completely self-contained in **Demo Mode**, populated with 35+ realistic Indian wedding wear garments, 12 Western Odisha customers, and active rental workflows.

---

### Step 2: Customer Acquisition Website Walkthrough
**URL**: `http://localhost:3000`
1. **Showcase the Brand & Visual Direction**:
   - Palette: Deep Plum (`#4B1835`), Antique Gold (`#B89558`), Warm Ivory (`#F7F3EC`).
   - Mention the local store identity: In front of LIC Office, near Keshariya Restaurant, Bargarh Road.
2. **Browse Rental Collections (`/collections`)**:
   - Filter by Bridal Lehengas, Groom Sherwanis, Party Gowns, Kanjeevaram Sarees.
   - Point out the clear separation of the 3-day rental fee and refundable security deposit on every product card.
3. **Submit an Online Availability Enquiry**:
   - Open any product (e.g. `/garment/PROD-01`).
   - Submit a test enquiry with name and phone.
   - Mention to the owner: *"Notice how enquiries from customers directly sync to your store counter staff."*
4. **Click "ERP Portal" in the top header** to transition into the internal business operations platform.

---

### Step 3: Staff Role Simulation & ERP Dashboard
**URL**: `http://localhost:3000/erp/dashboard`
1. **Role Switcher**:
   - Demonstrate the role selector in the top-right header: Switch between **Owner**, **Store Manager**, **Counter Staff**, and **Accountant**.
2. **Operations Command Center**:
   - **Overdue Alert Banner**: Show how overdue rentals (e.g. Bikash Pradhan, due 07 Nov) immediately flash at the top of the screen with a 1-click WhatsApp follow-up button.
   - **KPI Cards**: Review physical units out on rent, ready stock in showroom, units in laundry, and the total security deposit liability held in the vault (`₹23,500`).
   - Emphasize to the owner: *"Notice that your security deposits are strictly tracked as a refundable liability and never mixed with your taxable rental sales."*

---

### Step 4: Individual Garment Inventory & Barcode Tracking
**URL**: `http://localhost:3000/erp/inventory`
1. **Physical Unit vs Product Model**:
   - Show how a single model like *"Royal Zardozi Crimson Velvet Lehenga"* has multiple distinct physical units: `BF-LH-001`, `BF-LH-002`, `BF-LH-003`.
   - Each unit displays its size (S/M/L), specific storage rack location (`Hanger Rack A-01`), and rental count.
2. **Barcode / QR Tag Printing**:
   - Click the QR icon on any garment to display the printable tag with barcode `8907825001`, SKU, rack location, and rental rate.
3. **Add New Garment Unit**:
   - Click **"Add Garment Unit"** and show how easy it is to enter a new piece into the store inventory with purchase cost and rental rate.

---

### Step 5: End-to-End Booking Creation with Date Conflict Protection
**URL**: `http://localhost:3000/erp/bookings/new`
1. **Step 1: Customer Selection**: Pick an existing customer like Sunita Panda or create a new client from Bargarh/Sambalpur.
2. **Step 2: Dates**: Select Pickup Date (e.g. 19 Nov) and Return Due Date (22 Nov).
3. **Step 3: Conflict Engine Demonstration**:
   - Attempt to pick a garment already reserved for overlapping dates.
   - Point out the red conflict warning: *"The system protects you from accidentally double-booking the same physical lehenga for two different brides on the same wedding weekend."*
   - Select an available unit.
4. **Step 4: Billing Segregation**:
   - Show the auto-calculated rental charge, separate security deposit, advance paid input, and remaining balance.
5. **Step 5: Confirm**:
   - Submit the booking to instantly generate the printable agreement!

---

### Step 6: Handover (Pickup) & Return Counter Settlement
1. **Pickup Desk (`/erp/operations/pickup`)**:
   - Review accessories checklist (matching dupatta, safa brooch, wooden hanger, dust bag).
   - Click **"Confirm Handover & Issue"** -> Garment status immediately transitions to `RENTED`.
2. **Return Desk (`/erp/operations/returns`)**:
   - Select an active rental.
   - Walk through the physical inspection checklist: Stains, tears, buttons/hooks, odour.
   - Enter a damage deduction or late fee (e.g. ₹300).
   - Point out the **Settlement Formula**:
     `Deposit Held (₹5,000) - Damage (₹300) = Net Refund (₹4,700)`.
   - Route garment to **Laundry** or **Master Tailor** -> Click **"Settle Deposit & Complete Return"**.

---

### Step 7: Care Operations: Laundry & Tailoring
1. **Laundry Module (`/erp/operations/laundry`)**:
   - Show garments sent to local Bargarh partners: *Maa Samleswari Dry Cleaners* and *Shree Ganesh Steam Cleaners*.
   - Click **"Approve & Restock"** to show how a cleaned garment automatically becomes `AVAILABLE` on the showroom rack.
2. **Maintenance Module (`/erp/operations/maintenance`)**:
   - View jobs assigned to in-house master tailor Salim for alterations and zari fixes.

---

### Step 8: Billing, Invoices & Daily Cash Closing
1. **Invoices (`/erp/billing/invoices`)**:
   - Toggle between **A4 Rental Agreement** and **80mm Thermal Receipt**.
   - Click Print to show clean layout with store details and signature lines.
2. **Daily Cash Closing (`/erp/billing/cash-closing`)**:
   - Show how the counter cash drawer balances opening cash + cash rentals + cash deposits in - cash deposit refunds out - cash expenses = Expected Cash vs Actual Counted.
   - Lock the closing with zero variance.

---

### Step 9: Owner Decisions Needed for Production Build
1. **Brand Assets**: Final logo artwork, official color scheme approval, and high-resolution showroom photography.
2. **GST Configuration**: Confirm GST registration status (Regular vs Composition vs Unregistered).
3. **SMS / WhatsApp Gateway**: Approval of Twilio/Gupshup WhatsApp Business API account for automated return reminders.
4. **Hosting**: Supabase Cloud PostgreSQL setup and custom domain connection (`barnalifashion.com`).
