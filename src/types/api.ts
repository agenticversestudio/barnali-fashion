/**
 * API CONTRACT for /api/v1  (owned by Claude/backend — frontend must not edit).
 * Money = integer rupees. Dates = "YYYY-MM-DD" (Asia/Kolkata). Timestamps = ISO-8601 UTC.
 * The legacy prototype types stay in ./index.ts until Phase 6 screens are migrated; new code imports from "@/types/api".
 * Fields marked (admin) are ABSENT from responses for role "staff".
 */

export type Role = "admin" | "staff";
export type PayMode = "CASH" | "UPI" | "CARD" | "BANK_TRANSFER";

// ---------- errors ----------
export type ErrorCode =
  | "VALIDATION" // 400
  | "UNAUTHENTICATED" // 401
  | "FORBIDDEN" // 403
  | "NOT_FOUND" // 404
  | "GARMENT_CONFLICT" // 409
  | "LOCKED" // 423 too many failed logins
  | "RULE" // 422 business rule broken
  | "INTERNAL"; // 500
export interface ApiErrorBody {
  error: { code: ErrorCode; message: string; details?: unknown };
}
/** details for GARMENT_CONFLICT */
export interface ConflictInfo {
  garmentId: string;
  garmentName?: string;
  heldBy: string; // booking id
  from: string;
  to: string;
}

// ---------- auth ----------
export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  phone?: string;
}
export interface LoginRequest { username: string; password: string }
export interface LoginResponse { user: SessionUser } // cookie bf_session set (HttpOnly)
export interface MeResponse { user: SessionUser }

// ---------- users (admin) ----------
export interface UserDto extends SessionUser { active: boolean; createdAt: string }
export interface CreateUserRequest { name: string; username: string; password: string; role: Role; phone?: string }
export interface UpdateUserRequest { name?: string; phone?: string; role?: Role; active?: boolean }
export interface ResetPasswordRequest { password: string }

// ---------- garments ----------
export type GarmentStatus =
  | "AVAILABLE"
  | "OUT_ON_RENT"
  | "RETURNED_CLEANING"
  | "IN_CARE"
  | "DAMAGED_REPAIR"
  | "UNAVAILABLE";

export interface PhotoDto { id: string; kind: string; url: string; note?: string }

export interface GarmentDto {
  id: string;
  name: string;
  category: string;
  description?: string;
  fabric?: string;
  colour?: string;
  size: string;
  chest?: string;
  waist?: string;
  length?: string;
  blouseSize?: string;
  rack: string;
  shelf?: string;
  rentalPrice: number;
  securityDeposit: number;
  purchaseCost?: number; // (admin)
  status: GarmentStatus;
  condition: string;
  notes?: string;
  active: boolean;
  mainPhotoUrl?: string;
  nextBooking?: { bookingId: string; from: string; to: string; customerName: string };
}
export interface GarmentDetailDto extends GarmentDto {
  photos: PhotoDto[];
  history: { bookingId: string; from: string; to: string; status: BookingStatus; customerName: string }[];
  stats?: { timesRented: number; revenue: number; profit: number }; // (admin)
}
export interface GarmentListQuery {
  q?: string; category?: string; status?: GarmentStatus; rack?: string;
  availableFrom?: string; availableTo?: string; limit?: number; cursor?: string;
}
export interface CreateGarmentRequest {
  id: string; name: string; category: string; size: string; rack: string; rentalPrice: number; securityDeposit: number;
  purchaseCost?: number; description?: string; fabric?: string; colour?: string; chest?: string; waist?: string;
  length?: string; blouseSize?: string; shelf?: string; condition?: string; notes?: string;
}
export type UpdateGarmentRequest = Partial<Omit<CreateGarmentRequest, "id">> & { active?: boolean };
export interface UpdateLocationRequest { rack: string; shelf?: string }
export interface UpdateStatusRequest { status: GarmentStatus; note?: string }
export interface AvailabilityRow {
  garmentId: string; name: string; category: string; rack: string; status: GarmentStatus;
  busy: { bookingId: string; from: string; to: string; status: BookingStatus }[];
}

// ---------- customers ----------
export interface CustomerDto {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  pincode?: string;
  notes?: string;
  totalBookings: number; // derived
  activeRentals: number; // derived
  depositsHeld: number; // derived
  totalSpent?: number; // derived (admin)
  createdAt: string;
}
export interface CustomerInput {
  id?: string; name: string; phone: string; whatsapp?: string; address?: string; city?: string; pincode?: string; notes?: string;
}

// ---------- bookings ----------
export type BookingStatus = "CONFIRMED" | "OUT_ON_RENT" | "COMPLETED" | "CANCELLED";
export type DepositStatus = "NOT_COLLECTED" | "HELD" | "REFUNDED" | "PARTIALLY_REFUNDED" | "FORFEITED";
export type PaymentKind = "ADVANCE" | "BALANCE" | "DEPOSIT" | "EXTRA" | "REFUND";

export interface QuoteRequest {
  garmentIds: string[]; pickupDate: string; returnDueDate: string;
  dryCleanCharge?: number; transitCharge?: number; advance?: number;
}
export interface QuoteResponse {
  rentalTotal: number; depositTotal: number; dryCleanCharge: number; transitCharge: number;
  grandTotal: number; advance: number; balanceDue: number; conflicts: ConflictInfo[];
}

export interface CreateBookingRequest {
  customer: CustomerInput;
  eventName: string; eventDate: string; pickupDate: string; returnDueDate: string;
  garmentIds: string[]; dryCleanCharge?: number; transitCharge?: number;
  advance: { amount: number; mode: PayMode }; notes?: string;
}

export interface PaymentDto {
  id: number; kind: PaymentKind; amount: number; mode: PayMode; paidOn: string; note?: string; recordedBy: string;
}
export interface BookingItemDto {
  garmentId: string; name: string; size: string; rack?: string; rentalPrice: number; securityDeposit: number; mainPhotoUrl?: string;
}
export interface BookingDto {
  id: string;
  customer: { id: string; name: string; phone: string; whatsapp?: string; city?: string };
  eventName: string; eventDate: string; pickupDate: string; returnDueDate: string; actualReturnDate?: string;
  status: BookingStatus;
  items: BookingItemDto[];
  rentalTotal: number; depositTotal: number; dryCleanCharge: number; transitCharge: number;
  grandTotal: number; // derived
  amountPaid: number; // derived: Σ payments with kind ≠ REFUND (refunds are listed in payments[] separately)
  balanceDue: number; // derived: max(0, grandTotal − amountPaid)
  payments: PaymentDto[];
  damageCharge: number; cleaningCharge: number; lateDays: number; lateFee: number;
  refundAmount: number; additionalDue: number; depositStatus: DepositStatus;
  handoverCondition?: string; returnNotes?: string; notes?: string;
  isOverdue: boolean; // derived: OUT_ON_RENT and today > returnDueDate
  createdAt: string;
}
export interface BookingListQuery {
  status?: BookingStatus; from?: string; to?: string; q?: string; customerId?: string; limit?: number; cursor?: string;
}
export interface PickupRequest {
  handoverCondition?: string;
  payments?: { kind: "BALANCE" | "DEPOSIT"; amount: number; mode: PayMode; note?: string }[];
  photoIds?: string[];
}
export interface AddPaymentRequest { kind: "BALANCE" | "DEPOSIT" | "EXTRA"; amount: number; mode: PayMode; note?: string }

export type NextAction = "AVAILABLE" | "DRY_CLEAN" | "REPAIR" | "DAMAGED";
export interface ReturnRequest {
  actualReturnDate: string;
  damageCharge: number;
  cleaningCharge: number;
  notes?: string;
  items: { garmentId: string; nextAction: NextAction; vendorName?: string; expectedDate?: string; cost?: number }[];
  refund?: { pay: boolean; mode: "CASH" | "UPI" | "BANK_TRANSFER" };
  photoIds?: string[];
  // lateFee / refund are NOT accepted: server recomputes (any such field is ignored)
}
export interface Settlement {
  lateDays: number; lateFee: number; deductions: number; refund: number; additionalDue: number; depositStatus: DepositStatus;
}
export interface ReturnResponse { booking: BookingDto; settlement: Settlement }
export interface CancelRequest { reason?: string; refundAdvance?: { amount: number; mode: PayMode } }
export interface UpdateBookingRequest { // money fields: admin only, audited
  eventName?: string; eventDate?: string; notes?: string; dryCleanCharge?: number; transitCharge?: number;
  damageCharge?: number; cleaningCharge?: number;
}

// ---------- care ----------
export type CareKind = "STITCHING" | "DRY_CLEAN" | "REPAIR";
export interface CareJobDto {
  id: string; garmentId: string; garmentName: string; bookingId?: string; kind: CareKind; vendorName: string; subType?: string;
  outDate: string; expectedDate?: string; rcvDate?: string; cost: number; notes?: string; status: "OUT" | "RECEIVED"; isOverdue: boolean;
}
export interface CreateCareRequest {
  garmentId: string; kind: CareKind; vendorName: string; subType?: string; outDate: string; expectedDate?: string; cost?: number; notes?: string; bookingId?: string;
}
export interface ReceiveCareRequest { rcvDate: string; cost?: number; notes?: string; nextStatus: "AVAILABLE" | "RETURNED_CLEANING" | "DAMAGED_REPAIR" }

// ---------- photos ----------
export interface PresignRequest { garmentId?: string; kind: "MAIN" | "FRONT" | "BACK" | "DETAIL" | "HANDOVER" | "DAMAGE" | "STITCH_NOTE"; contentType: "image/webp" | "image/jpeg"; bytes: number }
export interface PresignResponse { uploadUrl: string; objectKey: string }
export interface RegisterPhotoRequest { objectKey: string; kind: PresignRequest["kind"]; garmentId?: string; bookingId?: string; careJobId?: string; note?: string }

// ---------- alerts / admin ----------
export interface AlertDto {
  type: "PICKUP_SOON" | "RETURN_DUE" | "RETURN_OVERDUE" | "CARE_OVERDUE" | "REFUND_PENDING";
  title: string; message: string; refId: string; date?: string;
}
export interface ExpenseDto { id: string; date: string; category: string; description: string; amount: number; mode: "CASH" | "UPI" | "BANK_TRANSFER"; receiptNo?: string }
export interface CashTodayDto { date: string; openingCash: number; cashIn: number; cashRefunds: number; cashExpenses: number; expectedCash: number; closed: boolean }
export interface SettingsDto { lateFeePercent: number; bufferDays: number; shopName: string; shopAddress: string; shopPhone: string; defaultCareVendor: string }
