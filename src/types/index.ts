export type UserRole =
  | "owner"
  | "admin"
  | "manager"
  | "sales_staff"
  | "inventory_staff"
  | "laundry_staff"
  | "accountant"
  | "viewer";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatar?: string;
}

export type GarmentStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "PREPARING"
  | "RENTED"
  | "RETURN_RECEIVED"
  | "INSPECTION_PENDING"
  | "IN_LAUNDRY"
  | "REPAIR_PENDING"
  | "UNDER_REPAIR"
  | "QUALITY_CHECK"
  | "DAMAGED"
  | "RETIRED";

export type ProductCategory =
  | "Bridal Lehenga"
  | "Groom Sherwani"
  | "Party Gown"
  | "Silk Saree"
  | "Indo-Western"
  | "Kids Festive Wear"
  | "Royal Jewellery & Accessories";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  subCategory?: string;
  description: string;
  rentalPrice: number; // e.g. 3500 for 3 days
  securityDeposit: number; // e.g. 4000 (refundable)
  purchaseCost: number; // e.g. 24000
  images: string[];
  fabric: string;
  color: string;
  totalUnits: number;
  availableUnits: number;
}

export interface GarmentUnit {
  id: string; // SKU e.g. "BF-LH-001"
  productId: string;
  productName: string;
  category: ProductCategory;
  barcode: string;
  size: "XS" | "S" | "M" | "L" | "XL" | "XXL" | "Free Size";
  chest?: string;
  waist?: string;
  length?: string;
  blouseSize?: string;
  storageLocation: string; // e.g. "Rack A-3, Bargarh Store"
  status: GarmentStatus;
  conditionRating: "Pristine" | "Good" | "Minor Wear" | "Repairs Needed";
  rentalCount: number;
  lastRentedDate?: string;
  notes?: string;
  image: string;
  rentalPrice: number;
  securityDeposit: number;
}

export type BookingStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "PICKUP_PENDING"
  | "OUT_ON_RENT"
  | "RETURN_RECEIVED"
  | "COMPLETED"
  | "CANCELLED";

export interface BookingItem {
  garmentUnitId: string;
  productName: string;
  size: string;
  rentalPrice: number;
  securityDeposit: number;
}

export interface Booking {
  id: string; // e.g. "BF-BK-2026-101"
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerWhatsApp: string;
  customerCity: string;
  eventName: string; // e.g. "Sister's Wedding Reception"
  eventDate: string;
  pickupDate: string;
  returnDueDate: string;
  actualReturnDate?: string;
  items: BookingItem[];
  rentalTotal: number;
  securityDepositTotal: number;
  advancePaid: number;
  remainingRentalDue: number;
  status: BookingStatus;
  depositStatus: "HELD" | "PARTIALLY_REFUNDED" | "FULLY_REFUNDED" | "FORFEITED";
  damageDeduction: number;
  lateFee: number;
  refundAmount: number;
  paymentMethod: "CASH" | "UPI" | "CARD" | "BANK_TRANSFER";
  notes?: string;
  createdAt: string;
  issuedByStaff?: string;
  receivedByStaff?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  pincode: string;
  notes?: string;
  totalBookings: number;
  totalSpent: number;
  activeRentalsCount: number;
  refundableDepositsHeld: number;
  createdAt: string;
}

export interface LaundryJob {
  id: string; // e.g. "LND-2026-042"
  garmentUnitId: string;
  productName: string;
  vendorName: string; // e.g. "Maa Samleswari Dry Cleaners, Bargarh"
  washingType: "Standard Dry Clean" | "Delicate Zari Handwash" | "Steam Pressing & Sanitization" | "Spot Stain Removal";
  sentDate: string;
  expectedDate: string;
  completedDate?: string;
  cost: number;
  status: "SENT" | "IN_PROGRESS" | "RECEIVED" | "QUALITY_APPROVED" | "REWORK_REQUIRED";
  notes?: string;
}

export interface MaintenanceJob {
  id: string;
  garmentUnitId: string;
  productName: string;
  issueDescription: string;
  workType: "Zari Resewing" | "Zipper Replacement" | "Hem Alteration" | "Beadwork & Stone Fixing" | "Lining Repair";
  tailorName: string;
  sentDate: string;
  completedDate?: string;
  estimatedCost: number;
  actualCost?: number;
  status: "PENDING" | "UNDER_REPAIR" | "READY_FOR_QC" | "COMPLETED";
}

export interface InspectionRecord {
  id: string;
  bookingId: string;
  garmentUnitId: string;
  customerName: string;
  inspectedBy: string;
  returnDate: string;
  hasStains: boolean;
  hasTears: boolean;
  missingAccessories: boolean;
  zipperFunctional: boolean;
  conditionNotes: string;
  assessedDamageCharge: number;
  requiresSpecialDryClean: boolean;
  requiresTailorRepair: boolean;
  disputeNotes?: string;
  status: "APPROVED_CLEAN" | "SENT_TO_LAUNDRY" | "SENT_TO_MAINTENANCE" | "DAMAGE_ASSESSED";
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category:
    | "Dry Cleaning & Laundry"
    | "Tailoring & Alterations"
    | "Garment Purchase / New Stock"
    | "Packaging & Dust Bags"
    | "Shop Rent & Electricity"
    | "Staff Salary / Commission"
    | "Marketing & Local Ads"
    | "Miscellaneous";
  description: string;
  amount: number;
  paymentMode: "CASH" | "UPI" | "BANK_TRANSFER";
  recordedBy: string;
  receiptNumber?: string;
}

export interface CashClosingRecord {
  id: string;
  date: string;
  openingCash: number;
  cashRentalReceipts: number;
  cashSecurityDepositsReceived: number;
  cashDepositRefundsGiven: number;
  cashExpensesPaid: number;
  expectedCashInDrawer: number;
  actualCashCounted: number;
  differenceVariance: number;
  closingNotes?: string;
  verifiedBy: string;
  status: "BALANCED" | "VARIANCE_RECORDED";
}

export interface NotificationItem {
  id: string;
  type: "PICKUP_DUE" | "RETURN_OVERDUE" | "LAUNDRY_DUE" | "PAYMENT_PENDING" | "DEPOSIT_REFUND" | "MAINTENANCE_QC";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface PublicEnquiry {
  id: string;
  name: string;
  phone: string;
  eventDate: string;
  categoryInterested: ProductCategory;
  specificGarment?: string;
  sizePreference?: string;
  message?: string;
  createdAt: string;
  status: "NEW" | "CONTACTED" | "CONVERTED" | "DISMISSED";
}
