"use client";

import {
  Product,
  GarmentUnit,
  Customer,
  Booking,
  LaundryJob,
  MaintenanceJob,
  InspectionRecord,
  ExpenseRecord,
  CashClosingRecord,
  NotificationItem,
  PublicEnquiry,
  GarmentStatus,
  UserRole,
} from "@/types";
import {
  INITIAL_PRODUCTS,
  INITIAL_GARMENTS,
  INITIAL_CUSTOMERS,
  INITIAL_BOOKINGS,
  INITIAL_LAUNDRY_JOBS,
  INITIAL_MAINTENANCE_JOBS,
  INITIAL_INSPECTIONS,
  INITIAL_EXPENSES,
  INITIAL_CASH_CLOSING,
  INITIAL_NOTIFICATIONS,
  INITIAL_ENQUIRIES,
} from "./mockData";

const STORAGE_KEYS = {
  PRODUCTS: "barnali_products",
  GARMENTS: "barnali_garments",
  CUSTOMERS: "barnali_customers",
  BOOKINGS: "barnali_bookings",
  LAUNDRY: "barnali_laundry",
  MAINTENANCE: "barnali_maintenance",
  INSPECTIONS: "barnali_inspections",
  EXPENSES: "barnali_expenses",
  CASH_CLOSING: "barnali_cash_closing",
  NOTIFICATIONS: "barnali_notifications",
  ENQUIRIES: "barnali_enquiries",
  CURRENT_ROLE: "barnali_current_role",
};

// Safe LocalStorage helpers
function getStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return fallback;
  }
}

function setStored<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
  }
}

export const DataStore = {
  // Reset all data to factory demo state
  resetAll: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.GARMENTS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
    localStorage.removeItem(STORAGE_KEYS.LAUNDRY);
    localStorage.removeItem(STORAGE_KEYS.MAINTENANCE);
    localStorage.removeItem(STORAGE_KEYS.INSPECTIONS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.CASH_CLOSING);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.ENQUIRIES);
  },

  // Role Management
  getCurrentRole: (): UserRole => {
    return getStored<UserRole>(STORAGE_KEYS.CURRENT_ROLE, "owner");
  },
  setCurrentRole: (role: UserRole) => {
    setStored(STORAGE_KEYS.CURRENT_ROLE, role);
  },

  // Products
  getProducts: (): Product[] => {
    return getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },
  getProductById: (id: string): Product | undefined => {
    return DataStore.getProducts().find((p) => p.id === id);
  },

  // Garment Units
  getGarments: (): GarmentUnit[] => {
    return getStored<GarmentUnit[]>(STORAGE_KEYS.GARMENTS, INITIAL_GARMENTS);
  },
  getGarmentById: (id: string): GarmentUnit | undefined => {
    return DataStore.getGarments().find((g) => g.id === id);
  },
  updateGarmentStatus: (garmentId: string, newStatus: GarmentStatus, notes?: string): boolean => {
    const garments = DataStore.getGarments();
    const index = garments.findIndex((g) => g.id === garmentId);
    if (index === -1) return false;

    garments[index] = {
      ...garments[index],
      status: newStatus,
      notes: notes !== undefined ? notes : garments[index].notes,
    };
    setStored(STORAGE_KEYS.GARMENTS, garments);
    return true;
  },
  saveGarment: (garment: GarmentUnit): void => {
    const garments = DataStore.getGarments();
    const index = garments.findIndex((g) => g.id === garment.id);
    if (index >= 0) {
      garments[index] = garment;
    } else {
      garments.unshift(garment);
    }
    setStored(STORAGE_KEYS.GARMENTS, garments);
  },

  // Customers
  getCustomers: (): Customer[] => {
    return getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  },
  getCustomerById: (id: string): Customer | undefined => {
    return DataStore.getCustomers().find((c) => c.id === id);
  },
  saveCustomer: (customer: Customer): void => {
    const customers = DataStore.getCustomers();
    const index = customers.findIndex((c) => c.id === customer.id);
    if (index >= 0) {
      customers[index] = customer;
    } else {
      customers.unshift(customer);
    }
    setStored(STORAGE_KEYS.CUSTOMERS, customers);
  },

  // Bookings
  getBookings: (): Booking[] => {
    return getStored<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
  },
  getBookingById: (id: string): Booking | undefined => {
    return DataStore.getBookings().find((b) => b.id === id);
  },

  // Check availability conflict for a garment between dates
  checkConflict: (
    garmentId: string,
    startDateStr: string,
    endDateStr: string,
    excludeBookingId?: string
  ): { hasConflict: boolean; conflictingBooking?: Booking; message?: string } => {
    const bookings = DataStore.getBookings();
    const start = new Date(startDateStr).getTime();
    const end = new Date(endDateStr).getTime();

    // Check against active/confirmed bookings
    for (const b of bookings) {
      if (excludeBookingId && b.id === excludeBookingId) continue;
      if (b.status === "CANCELLED" || b.status === "COMPLETED") continue;

      const hasItem = b.items.some((item) => item.garmentUnitId === garmentId);
      if (!hasItem) continue;

      // Add a 1-day cleaning buffer to return due date
      const bStart = new Date(b.pickupDate).getTime();
      const bEndWithBuffer = new Date(b.returnDueDate).getTime() + 24 * 60 * 60 * 1000;

      // Overlap check
      if (start <= bEndWithBuffer && end >= bStart) {
        return {
          hasConflict: true,
          conflictingBooking: b,
          message: `Garment ${garmentId} is already reserved for "${b.customerName}" (${b.pickupDate} to ${b.returnDueDate}) with cleaning buffer.`,
        };
      }
    }

    // Also check physical garment's current status
    const garment = DataStore.getGarmentById(garmentId);
    if (garment && (garment.status === "DAMAGED" || garment.status === "RETIRED")) {
      return {
        hasConflict: true,
        message: `Garment ${garmentId} is currently marked as ${garment.status} and cannot be rented.`,
      };
    }

    return { hasConflict: false };
  },

  // Create new booking with strict validation
  createBooking: (
    bookingData: Omit<Booking, "id" | "createdAt" | "status" | "depositStatus" | "damageDeduction" | "lateFee" | "refundAmount">
  ): { success: boolean; booking?: Booking; error?: string } => {
    // 1. Conflict check for all items
    for (const item of bookingData.items) {
      const conflict = DataStore.checkConflict(item.garmentUnitId, bookingData.pickupDate, bookingData.returnDueDate);
      if (conflict.hasConflict) {
        return {
          success: false,
          error: conflict.message || `Unit ${item.garmentUnitId} is unavailable for selected dates.`,
        };
      }
    }

    const bookings = DataStore.getBookings();
    const newId = `BF-BK-2026-${String(bookings.length + 80).padStart(3, "0")}`;

    const newBooking: Booking = {
      ...bookingData,
      id: newId,
      status: "CONFIRMED",
      depositStatus: "HELD",
      damageDeduction: 0,
      lateFee: 0,
      refundAmount: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };

    // Update garments status to RESERVED
    for (const item of bookingData.items) {
      DataStore.updateGarmentStatus(item.garmentUnitId, "RESERVED", `Reserved for booking ${newId}`);
    }

    // Update customer stats
    const customer = DataStore.getCustomerById(bookingData.customerId);
    if (customer) {
      customer.totalBookings += 1;
      customer.totalSpent += bookingData.rentalTotal;
      customer.refundableDepositsHeld += bookingData.securityDepositTotal;
      DataStore.saveCustomer(customer);
    }

    bookings.unshift(newBooking);
    setStored(STORAGE_KEYS.BOOKINGS, bookings);

    return { success: true, booking: newBooking };
  },

  // Issue / Handover Workflow
  issueBooking: (bookingId: string, staffName: string): boolean => {
    const bookings = DataStore.getBookings();
    const index = bookings.findIndex((b) => b.id === bookingId);
    if (index === -1) return false;

    bookings[index].status = "OUT_ON_RENT";
    bookings[index].issuedByStaff = staffName;

    // Transition all garments to RENTED
    for (const item of bookings[index].items) {
      DataStore.updateGarmentStatus(
        item.garmentUnitId,
        "RENTED",
        `Issued on rent to ${bookings[index].customerName} (Booking ${bookingId})`
      );
    }

    setStored(STORAGE_KEYS.BOOKINGS, bookings);
    return true;
  },

  // Return & Inspection Settlement Workflow
  processReturnAndSettlement: (
    bookingId: string,
    receivedStaff: string,
    damageDeduction: number,
    lateFee: number,
    inspectionNotes: string,
    nextAction: "CLEAN_AVAILABLE" | "SEND_TO_LAUNDRY" | "SEND_TO_MAINTENANCE"
  ): { success: boolean; refundAmount: number } => {
    const bookings = DataStore.getBookings();
    const index = bookings.findIndex((b) => b.id === bookingId);
    if (index === -1) return { success: false, refundAmount: 0 };

    const booking = bookings[index];
    const totalDeductions = damageDeduction + lateFee;
    const refundAmount = Math.max(0, booking.securityDepositTotal - totalDeductions);

    booking.status = "COMPLETED";
    booking.actualReturnDate = new Date().toISOString().split("T")[0];
    booking.receivedByStaff = receivedStaff;
    booking.damageDeduction = damageDeduction;
    booking.lateFee = lateFee;
    booking.refundAmount = refundAmount;
    booking.depositStatus = totalDeductions > 0 ? "PARTIALLY_REFUNDED" : "FULLY_REFUNDED";

    // Handle each garment unit's next step
    for (const item of booking.items) {
      if (nextAction === "SEND_TO_LAUNDRY") {
        DataStore.updateGarmentStatus(item.garmentUnitId, "IN_LAUNDRY", `Dispatched for laundry post-return: ${inspectionNotes}`);
        // Add to laundry jobs
        DataStore.addLaundryJob({
          garmentUnitId: item.garmentUnitId,
          productName: item.productName,
          vendorName: "Maa Samleswari Dry Cleaners, Bargarh",
          washingType: "Standard Dry Clean",
          sentDate: new Date().toISOString().split("T")[0],
          expectedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          cost: 400,
          notes: inspectionNotes,
        });
      } else if (nextAction === "SEND_TO_MAINTENANCE") {
        DataStore.updateGarmentStatus(item.garmentUnitId, "UNDER_REPAIR", `Sent for tailor maintenance: ${inspectionNotes}`);
        DataStore.addMaintenanceJob({
          garmentUnitId: item.garmentUnitId,
          productName: item.productName,
          issueDescription: inspectionNotes,
          workType: "Zari Resewing",
          tailorName: "Master Salim (In-house Tailor)",
          sentDate: new Date().toISOString().split("T")[0],
          estimatedCost: damageDeduction || 250,
        });
      } else {
        DataStore.updateGarmentStatus(item.garmentUnitId, "AVAILABLE", `Returned clean & approved`);
      }
    }

    // Release customer deposit held
    const customer = DataStore.getCustomerById(booking.customerId);
    if (customer) {
      customer.refundableDepositsHeld = Math.max(0, customer.refundableDepositsHeld - booking.securityDepositTotal);
      DataStore.saveCustomer(customer);
    }

    setStored(STORAGE_KEYS.BOOKINGS, bookings);
    return { success: true, refundAmount };
  },

  // Laundry Module
  getLaundryJobs: (): LaundryJob[] => {
    return getStored<LaundryJob[]>(STORAGE_KEYS.LAUNDRY, INITIAL_LAUNDRY_JOBS);
  },
  addLaundryJob: (job: Omit<LaundryJob, "id" | "status">): LaundryJob => {
    const jobs = DataStore.getLaundryJobs();
    const newJob: LaundryJob = {
      ...job,
      id: `LND-2026-${String(jobs.length + 42).padStart(3, "0")}`,
      status: "IN_PROGRESS",
    };
    jobs.unshift(newJob);
    setStored(STORAGE_KEYS.LAUNDRY, jobs);
    return newJob;
  },
  approveLaundryJob: (jobId: string): boolean => {
    const jobs = DataStore.getLaundryJobs();
    const index = jobs.findIndex((j) => j.id === jobId);
    if (index === -1) return false;

    jobs[index].status = "QUALITY_APPROVED";
    jobs[index].completedDate = new Date().toISOString().split("T")[0];

    // Garment is now available!
    DataStore.updateGarmentStatus(jobs[index].garmentUnitId, "AVAILABLE", "Laundry & quality check completed successfully");

    setStored(STORAGE_KEYS.LAUNDRY, jobs);
    return true;
  },

  // Maintenance Module
  getMaintenanceJobs: (): MaintenanceJob[] => {
    return getStored<MaintenanceJob[]>(STORAGE_KEYS.MAINTENANCE, INITIAL_MAINTENANCE_JOBS);
  },
  addMaintenanceJob: (job: Omit<MaintenanceJob, "id" | "status">): MaintenanceJob => {
    const jobs = DataStore.getMaintenanceJobs();
    const newJob: MaintenanceJob = {
      ...job,
      id: `MNT-2026-${String(jobs.length + 16).padStart(3, "0")}`,
      status: "UNDER_REPAIR",
    };
    jobs.unshift(newJob);
    setStored(STORAGE_KEYS.MAINTENANCE, jobs);
    return newJob;
  },
  completeMaintenanceJob: (jobId: string, actualCost: number): boolean => {
    const jobs = DataStore.getMaintenanceJobs();
    const index = jobs.findIndex((j) => j.id === jobId);
    if (index === -1) return false;

    jobs[index].status = "COMPLETED";
    jobs[index].completedDate = new Date().toISOString().split("T")[0];
    jobs[index].actualCost = actualCost;

    // After repair, send to quality check or make available
    DataStore.updateGarmentStatus(jobs[index].garmentUnitId, "AVAILABLE", "Tailor repairs completed and quality inspected");

    setStored(STORAGE_KEYS.MAINTENANCE, jobs);
    return true;
  },

  // Inspections
  getInspections: (): InspectionRecord[] => {
    return getStored<InspectionRecord[]>(STORAGE_KEYS.INSPECTIONS, INITIAL_INSPECTIONS);
  },

  // Expenses
  getExpenses: (): ExpenseRecord[] => {
    return getStored<ExpenseRecord[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  },
  addExpense: (expense: Omit<ExpenseRecord, "id">): ExpenseRecord => {
    const expenses = DataStore.getExpenses();
    const newExpense: ExpenseRecord = {
      ...expense,
      id: `EXP-2026-${String(expenses.length + 92).padStart(3, "0")}`,
    };
    expenses.unshift(newExpense);
    setStored(STORAGE_KEYS.EXPENSES, expenses);
    return newExpense;
  },

  // Daily Cash Closing
  getCashClosings: (): CashClosingRecord[] => {
    return getStored<CashClosingRecord[]>(STORAGE_KEYS.CASH_CLOSING, INITIAL_CASH_CLOSING);
  },
  saveCashClosing: (record: Omit<CashClosingRecord, "id">): CashClosingRecord => {
    const closings = DataStore.getCashClosings();
    const newRecord: CashClosingRecord = {
      ...record,
      id: `CC-${record.date}`,
    };
    closings.unshift(newRecord);
    setStored(STORAGE_KEYS.CASH_CLOSING, closings);
    return newRecord;
  },

  // Notifications
  getNotifications: (): NotificationItem[] => {
    return getStored<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },
  markNotificationRead: (id: string) => {
    const notifs = DataStore.getNotifications();
    const item = notifs.find((n) => n.id === id);
    if (item) {
      item.read = true;
      setStored(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }
  },

  // Enquiries (From Public Website)
  getEnquiries: (): PublicEnquiry[] => {
    return getStored<PublicEnquiry[]>(STORAGE_KEYS.ENQUIRIES, INITIAL_ENQUIRIES);
  },
  addEnquiry: (enquiry: Omit<PublicEnquiry, "id" | "createdAt" | "status">): PublicEnquiry => {
    const enquiries = DataStore.getEnquiries();
    const newEnquiry: PublicEnquiry = {
      ...enquiry,
      id: `ENQ-2026-${String(enquiries.length + 3).padStart(2, "0")}`,
      createdAt: new Date().toISOString().split("T")[0],
      status: "NEW",
    };
    enquiries.unshift(newEnquiry);
    setStored(STORAGE_KEYS.ENQUIRIES, enquiries);
    return newEnquiry;
  },
};
