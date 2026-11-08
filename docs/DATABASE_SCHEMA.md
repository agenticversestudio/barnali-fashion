# Normalized Relational Database Schema (PostgreSQL / Supabase)

## Tables & Entity Relationships

### 1. `product_categories`
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `name` VARCHAR(100) NOT NULL UNIQUE
- `description` TEXT
- `created_at` TIMESTAMPTZ DEFAULT now()

### 2. `products`
- `id` VARCHAR(50) PRIMARY KEY (e.g. `PROD-01`)
- `category_id` UUID REFERENCES product_categories(id)
- `name` VARCHAR(255) NOT NULL
- `description` TEXT
- `fabric` VARCHAR(100)
- `color` VARCHAR(100)
- `rental_price` NUMERIC(10,2) NOT NULL
- `security_deposit` NUMERIC(10,2) NOT NULL
- `purchase_cost` NUMERIC(10,2) NOT NULL
- `images` TEXT[]
- `created_at` TIMESTAMPTZ DEFAULT now()

### 3. `garment_units`
- `id` VARCHAR(50) PRIMARY KEY (SKU: e.g. `BF-LH-001`)
- `product_id` VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE
- `barcode` VARCHAR(50) UNIQUE NOT NULL
- `size` VARCHAR(20) NOT NULL
- `chest_measure` VARCHAR(20)
- `waist_measure` VARCHAR(20)
- `length_measure` VARCHAR(20)
- `storage_location` VARCHAR(100) NOT NULL
- `status` VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE'
- `condition_rating` VARCHAR(50) NOT NULL DEFAULT 'Pristine'
- `rental_count` INT DEFAULT 0
- `last_rented_date` DATE
- `notes` TEXT
- `created_at` TIMESTAMPTZ DEFAULT now()

### 4. `customers`
- `id` VARCHAR(50) PRIMARY KEY (e.g. `CUST-001`)
- `name` VARCHAR(255) NOT NULL
- `phone` VARCHAR(20) NOT NULL UNIQUE
- `whatsapp` VARCHAR(20)
- `address` TEXT
- `city` VARCHAR(100) NOT NULL
- `pincode` VARCHAR(10)
- `notes` TEXT
- `total_bookings` INT DEFAULT 0
- `total_spent` NUMERIC(10,2) DEFAULT 0
- `deposits_held` NUMERIC(10,2) DEFAULT 0
- `created_at` TIMESTAMPTZ DEFAULT now()

### 5. `bookings`
- `id` VARCHAR(50) PRIMARY KEY (e.g. `BF-BK-2026-081`)
- `customer_id` VARCHAR(50) REFERENCES customers(id)
- `event_name` VARCHAR(255) NOT NULL
- `event_date` DATE NOT NULL
- `pickup_date` DATE NOT NULL
- `return_due_date` DATE NOT NULL
- `actual_return_date` DATE
- `rental_total` NUMERIC(10,2) NOT NULL
- `security_deposit_total` NUMERIC(10,2) NOT NULL
- `advance_paid` NUMERIC(10,2) NOT NULL
- `remaining_rental_due` NUMERIC(10,2) NOT NULL
- `status` VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED'
- `deposit_status` VARCHAR(50) NOT NULL DEFAULT 'HELD'
- `damage_deduction` NUMERIC(10,2) DEFAULT 0
- `late_fee` NUMERIC(10,2) DEFAULT 0
- `refund_amount` NUMERIC(10,2) DEFAULT 0
- `payment_method` VARCHAR(50) NOT NULL
- `issued_by_staff` VARCHAR(100)
- `received_by_staff` VARCHAR(100)
- `notes` TEXT
- `created_at` TIMESTAMPTZ DEFAULT now()

### 6. `booking_items`
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `booking_id` VARCHAR(50) REFERENCES bookings(id) ON DELETE CASCADE
- `garment_unit_id` VARCHAR(50) REFERENCES garment_units(id)
- `rental_price` NUMERIC(10,2) NOT NULL
- `security_deposit` NUMERIC(10,2) NOT NULL

### 7. `laundry_jobs`
- `id` VARCHAR(50) PRIMARY KEY (e.g. `LND-2026-041`)
- `garment_unit_id` VARCHAR(50) REFERENCES garment_units(id)
- `vendor_name` VARCHAR(255) NOT NULL
- `washing_type` VARCHAR(100) NOT NULL
- `sent_date` DATE NOT NULL
- `expected_date` DATE NOT NULL
- `completed_date` DATE
- `cost` NUMERIC(10,2) NOT NULL
- `status` VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS'
- `notes` TEXT

### 8. `maintenance_jobs`
- `id` VARCHAR(50) PRIMARY KEY (e.g. `MNT-2026-015`)
- `garment_unit_id` VARCHAR(50) REFERENCES garment_units(id)
- `work_type` VARCHAR(100) NOT NULL
- `tailor_name` VARCHAR(100) NOT NULL
- `sent_date` DATE NOT NULL
- `completed_date` DATE
- `estimated_cost` NUMERIC(10,2) NOT NULL
- `actual_cost` NUMERIC(10,2)
- `status` VARCHAR(50) NOT NULL DEFAULT 'UNDER_REPAIR'

### 9. `expenses`
- `id` VARCHAR(50) PRIMARY KEY (e.g. `EXP-2026-091`)
- `date` DATE NOT NULL
- `category` VARCHAR(100) NOT NULL
- `description` TEXT NOT NULL
- `amount` NUMERIC(10,2) NOT NULL
- `payment_mode` VARCHAR(50) NOT NULL
- `recorded_by` VARCHAR(100) NOT NULL

### 10. `cash_closings`
- `id` VARCHAR(50) PRIMARY KEY (e.g. `CC-2026-11-08`)
- `date` DATE NOT NULL
- `opening_cash` NUMERIC(10,2) NOT NULL
- `cash_rental_receipts` NUMERIC(10,2) NOT NULL
- `cash_deposits_received` NUMERIC(10,2) NOT NULL
- `cash_deposits_refunded` NUMERIC(10,2) NOT NULL
- `cash_expenses_paid` NUMERIC(10,2) NOT NULL
- `expected_cash` NUMERIC(10,2) NOT NULL
- `actual_cash` NUMERIC(10,2) NOT NULL
- `variance` NUMERIC(10,2) NOT NULL
- `status` VARCHAR(50) NOT NULL
- `verified_by` VARCHAR(100) NOT NULL
