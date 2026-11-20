"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  Phone,
  MessageCircle,
  PackageCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
  ChevronRight,
  Calendar,
  DollarSign,
  Shirt,
  MapPin,
  Clock,
  ShieldCheck,
  Receipt,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Booking, GarmentUnit, Customer } from "@/types";

function BookingsContent() {
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [garments, setGarments] = useState<GarmentUnit[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Selected Order for Full Details Bottom Sheet
  const [selectedOrder, setSelectedOrder] = useState<Booking | null>(null);

  // --- NEW ORDER WIZARD STATE ---
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Step 1: Piece Selection
  const [selectedCostume, setSelectedCostume] = useState<GarmentUnit | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Step 2: Customer & Booking Info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [eventDate, setEventDate] = useState("2026-11-20");
  const [pickupDate, setPickupDate] = useState("2026-11-18");
  const [returnDueDate, setReturnDueDate] = useState("2026-11-22");
  const [deliveryCharges, setDeliveryCharges] = useState<number>(0);
  const [advanceReceived, setAdvanceReceived] = useState<number>(2000);
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI">("UPI");

  // --- HANDOVER MODAL STATE ---
  const [handoverBooking, setHandoverBooking] = useState<Booking | null>(null);
  const [handoverCondition, setHandoverCondition] = useState(
    "Excellent condition, fitting verified"
  );
  const [handoverDate, setHandoverDate] = useState("2026-11-08");

  // --- RETURN & SETTLEMENT MODAL STATE ---
  const [returnBooking, setReturnBooking] = useState<Booking | null>(null);
  const [actualReturnDate, setActualReturnDate] = useState("2026-11-08");
  const [damageCharge, setDamageCharge] = useState<number>(0);
  const [cleaningCharge, setCleaningCharge] = useState<number>(0);
  const [returnNotes, setReturnNotes] = useState("");
  const [nextCareAction, setNextCareAction] = useState<"DRY_CLEAN" | "STITCHING" | "AVAILABLE">(
    "DRY_CLEAN"
  );

  // WhatsApp Slip Preview
  const [whatsappReceipt, setWhatsappReceipt] = useState<string | null>(null);

  const loadData = () => {
    setBookings(DataStore.getBookings());
    setGarments(DataStore.getGarments());
    setCustomers(DataStore.getCustomers());
  };

  useEffect(() => {
    loadData();

    // Handle deep links from URL params
    const newParam = searchParams.get("new");
    const skuParam = searchParams.get("sku");
    const orderIdParam = searchParams.get("orderId");
    const filterParam = searchParams.get("filter");

    if (newParam) {
      setShowNewOrderModal(true);
      if (skuParam) {
        const found = DataStore.getGarmentById(skuParam);
        if (found) {
          setSelectedCostume(found);
          setWizardStep(2);
        }
      }
    }

    if (filterParam === "overdue") {
      setStatusFilter("OUT_ON_RENT");
    } else if (filterParam === "today") {
      setStatusFilter("ACTIVE");
    }

    if (orderIdParam) {
      const b = DataStore.getBookingById(orderIdParam);
      if (b) setSelectedOrder(b);
    }
  }, [searchParams]);

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    const sTerm = searchTerm.toLowerCase();
    const matchesSearch =
      b.id.toLowerCase().includes(sTerm) ||
      b.customerName.toLowerCase().includes(sTerm) ||
      b.customerPhone.includes(sTerm) ||
      (b.costumeCode && b.costumeCode.toLowerCase().includes(sTerm)) ||
      b.items.some((it) => it.productName.toLowerCase().includes(sTerm));

    let matchesStatus = statusFilter === "ALL";
    if (statusFilter === "ACTIVE")
      matchesStatus =
        b.status === "CONFIRMED" || b.status === "PICKUP_PENDING" || b.status === "OUT_ON_RENT";
    if (statusFilter === "OUT_ON_RENT") matchesStatus = b.status === "OUT_ON_RENT";
    if (statusFilter === "COMPLETED") matchesStatus = b.status === "COMPLETED";

    return matchesSearch && matchesStatus;
  });

  const filteredGarmentsForBooking = garments.filter((g) => {
    const matchesCat = selectedCategory === "ALL" || g.category === selectedCategory;
    return matchesCat;
  });

  const rentalPrice = selectedCostume ? selectedCostume.rentalPrice : 0;
  const securityDeposit = selectedCostume ? selectedCostume.securityDeposit : 0;
  const totalBill = rentalPrice + securityDeposit + deliveryCharges;
  const balanceDue = Math.max(0, totalBill - advanceReceived);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCostume) {
      alert("Please select a costume first!");
      return;
    }
    if (!customerName || !customerPhone) {
      alert("Please enter customer name and phone number!");
      return;
    }

    const res = DataStore.createBooking({
      customerId: "CUST-NEW",
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerWhatsApp: customerPhone.trim(),
      customerCity: "Bargarh",
      customerAddress: customerAddress.trim(),
      eventName: "Wedding Occasion",
      eventDate: eventDate,
      pickupDate: pickupDate,
      returnDueDate: returnDueDate,
      costumeCode: selectedCostume.id,
      items: [
        {
          garmentUnitId: selectedCostume.id,
          productName: selectedCostume.productName,
          size: selectedCostume.size,
          rentalPrice: selectedCostume.rentalPrice,
          securityDeposit: selectedCostume.securityDeposit,
        },
      ],
      rentalTotal: rentalPrice,
      securityDepositTotal: securityDeposit,
      deliveryCharges: deliveryCharges,
      advancePaid: advanceReceived,
      remainingRentalDue: balanceDue,
      paymentMethod: paymentMode,
      notes: `Order created. Advance: ₹${advanceReceived}. Balance due: ₹${balanceDue}.`,
    });

    if (res.success && res.booking) {
      loadData();
      setShowNewOrderModal(false);
      setWizardStep(1);

      const msg =
        `*BARNALI FASHION — BOOKING CONFIRMATION*\n` +
        `Order: ${res.booking.id}\n` +
        `Customer: ${customerName}\n` +
        `Costume: ${selectedCostume.id} (${selectedCostume.productName})\n` +
        `Event Date: ${eventDate}\n` +
        `Pickup Date: ${pickupDate}\n` +
        `Return Due Date: ${returnDueDate}\n` +
        `-------------------------\n` +
        `Rental Rate: ₹${rentalPrice}\n` +
        `Security Deposit: ₹${securityDeposit}\n` +
        `Delivery Charges: ₹${deliveryCharges}\n` +
        `Total: ₹${totalBill}\n` +
        `Advance Received: ₹${advanceReceived}\n` +
        `*Balance Due at Handover: ₹${balanceDue}*\n` +
        `-------------------------\n` +
        `Terms: Returns due by ${returnDueDate}. Late returns incur 15% daily fee. Thank you!`;

      setWhatsappReceipt(msg);
    } else {
      alert(res.error || "Could not save booking");
    }
  };

  const handleExecuteHandover = () => {
    if (!handoverBooking) return;
    DataStore.issueBooking(handoverBooking.id, "Counter Staff");
    const b = DataStore.getBookingById(handoverBooking.id);
    if (b) {
      b.handoverDate = handoverDate;
      b.handoverCondition = handoverCondition;
    }
    loadData();
    setHandoverBooking(null);
  };

  const calculateReturnSettlement = () => {
    if (!returnBooking) return { lateDays: 0, lateFee: 0, netRefund: 0 };
    const dueTime = new Date(returnBooking.returnDueDate).getTime();
    const actTime = new Date(actualReturnDate).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const lateDays = Math.max(0, Math.round((actTime - dueTime) / dayMs));
    const lateFee = lateDays > 0 ? Math.round(returnBooking.rentalTotal * 0.15 * lateDays) : 0;
    const totalDeductions = lateFee + damageCharge + cleaningCharge;
    const netRefund = Math.max(0, returnBooking.securityDepositTotal - totalDeductions);
    return { lateDays, lateFee, netRefund };
  };

  const returnSettlement = calculateReturnSettlement();

  const handleExecuteReturn = () => {
    if (!returnBooking) return;
    DataStore.settleReturn5Step(
      returnBooking.id,
      actualReturnDate,
      damageCharge,
      cleaningCharge,
      returnNotes,
      nextCareAction
    );
    loadData();
    const bCustomer = returnBooking.customerName;
    const bDeposit = returnBooking.securityDepositTotal;
    const bRefund = returnSettlement.netRefund;
    setReturnBooking(null);

    const msg =
      `*BARNALI FASHION — RETURN RECEIPT*\n` +
      `Customer: ${bCustomer}\n` +
      `Return Date: ${actualReturnDate}\n` +
      `Late Days: ${returnSettlement.lateDays} days\n` +
      `Late Fee: ₹${returnSettlement.lateFee}\n` +
      `Damage / Cleaning: ₹${damageCharge + cleaningCharge}\n` +
      `-------------------------\n` +
      `Security Deposit: ₹${bDeposit}\n` +
      `*Net Refund Paid: ₹${bRefund}*\n` +
      `Thank you for renting with Barnali Fashion, Bargarh!`;

    setWhatsappReceipt(msg);
  };

  return (
    <div className="space-y-3.5 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
            Orders
          </h1>
          <p className="text-[11px] md:text-xs text-slate-500 mt-0.5">
            5-Step counter workflow: Selection, Client, Pricing, Handover, Return.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedCostume(null);
            setWizardStep(1);
            setShowNewOrderModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 bg-[#6B1D2F] hover:bg-[#551624] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Order</span>
        </button>
      </div>

      {/* FILTER & SEARCH STRIP */}
      <div className="bg-white p-3 md:p-4 rounded-xl border border-[#E2E8F0] shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by customer, phone, SKU, or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#6B1D2F] text-slate-800"
            />
          </div>

          {/* Compact 1-Row Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === "ALL"
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              All Orders ({bookings.length})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === "ACTIVE"
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("OUT_ON_RENT")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === "OUT_ON_RENT"
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Out on rent
            </button>
            <button
              onClick={() => setStatusFilter("COMPLETED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === "COMPLETED"
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE ORDER CARDS (< 768px): ZERO HORIZONTAL SCROLL      */}
      {/* ========================================================= */}
      <div className="block md:hidden space-y-2.5">
        {filteredBookings.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
            No orders found matching your filter.
          </div>
        ) : (
          filteredBookings.map((b) => {
            const isOut = b.status === "OUT_ON_RENT";
            const isConfirmed = b.status === "CONFIRMED" || b.status === "PICKUP_PENDING";
            const isCompleted = b.status === "COMPLETED";

            return (
              <div
                key={b.id}
                className="bg-white rounded-xl border border-[#E2E8F0] p-3.5 shadow-2xs space-y-2.5"
              >
                {/* Top Row: Order ID + Customer Name + Phone + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{b.id}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="text-xs font-semibold text-slate-900 mt-1">
                      {b.customerName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      +91 {b.customerPhone}
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/91${b.customerPhone}?text=Namaste%20${encodeURIComponent(
                      b.customerName
                    )},%20Barnali%20Fashion%20se%20Order%20${b.id}%20ka%20update.`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>

                {/* Middle Row: Costume SKU + Name + Dates + Overdue */}
                <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/60 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#6B1D2F]">
                      {b.costumeCode || b.items[0]?.garmentUnitId}
                    </span>
                    <span className="text-slate-600 font-medium truncate ml-2">
                      {b.items[0]?.productName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-0.5">
                    <span>Pickup: {b.pickupDate}</span>
                    <span className="flex items-center gap-1 font-medium">
                      <span>Due: {b.returnDueDate}</span>
                      {b.lateDays && b.lateDays > 0 ? (
                        <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1 py-0.2 rounded">
                          {b.lateDays}d late
                        </span>
                      ) : null}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Advance / Balance / Deposit + Primary Action + Details */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">
                      Adv: <strong className="text-emerald-700">{formatINR(b.advancePaid)}</strong>{" "}
                      · Bal:{" "}
                      <strong className="text-slate-900">
                        {formatINR(b.remainingRentalDue || 0)}
                      </strong>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Deposit: <strong>{formatINR(b.securityDepositTotal)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedOrder(b)}
                      className="px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg transition-colors"
                    >
                      Details
                    </button>

                    {isConfirmed && (
                      <button
                        onClick={() => {
                          setHandoverBooking(b);
                          setHandoverDate("2026-11-08");
                        }}
                        className="px-2.5 py-1.5 bg-[#6B1D2F] hover:bg-[#551624] text-white font-semibold rounded-lg text-[11px] transition-colors shadow-2xs"
                      >
                        Handover
                      </button>
                    )}

                    {isOut && (
                      <button
                        onClick={() => {
                          setReturnBooking(b);
                          setActualReturnDate("2026-11-08");
                          setDamageCharge(0);
                          setCleaningCharge(0);
                        }}
                        className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-[11px] transition-colors shadow-2xs"
                      >
                        Return
                      </button>
                    )}

                    {isCompleted && (
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        Settled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================= */}
      {/* DESKTOP ORDERS TABLE (>= 768px)                           */}
      {/* ========================================================= */}
      <div className="hidden md:block bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-[#E2E8F0] text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Order &amp; Client</th>
                <th className="py-3 px-3">Costume Item</th>
                <th className="py-3 px-3">Pickup Date</th>
                <th className="py-3 px-3">Return Due</th>
                <th className="py-3 px-3">Advance / Balance</th>
                <th className="py-3 px-3">Deposit</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map((b) => {
                const isOut = b.status === "OUT_ON_RENT";
                const isConfirmed = b.status === "CONFIRMED" || b.status === "PICKUP_PENDING";
                const isCompleted = b.status === "COMPLETED";

                return (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs font-semibold text-slate-900">{b.id}</div>
                      <div className="font-medium text-slate-700 mt-0.5">{b.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        +91 {b.customerPhone}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono text-xs font-semibold text-[#6B1D2F]">
                        {b.costumeCode || b.items[0]?.garmentUnitId}
                      </span>
                      <div className="text-slate-600 font-medium line-clamp-1 mt-0.5 max-w-[180px]">
                        {b.items[0]?.productName}
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{b.pickupDate}</div>
                      <div className="text-[11px] text-slate-400">{b.eventName}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{b.returnDueDate}</div>
                      {b.lateDays && b.lateDays > 0 ? (
                        <span className="text-[10px] text-rose-700 font-medium bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          {b.lateDays}d overdue
                        </span>
                      ) : null}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="text-emerald-700 font-medium">
                        Adv: {formatINR(b.advancePaid)}
                      </div>
                      <div className="text-slate-700 font-medium">
                        Bal: {formatINR(b.remainingRentalDue || 0)}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                      {formatINR(b.securityDepositTotal)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={b.status} />
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(b)}
                          className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-[11px] font-medium"
                        >
                          Details
                        </button>

                        {isConfirmed && (
                          <button
                            onClick={() => {
                              setHandoverBooking(b);
                              setHandoverDate("2026-11-08");
                            }}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs flex items-center gap-1 transition-colors"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Handover</span>
                          </button>
                        )}

                        {isOut && (
                          <button
                            onClick={() => {
                              setReturnBooking(b);
                              setActualReturnDate("2026-11-08");
                              setDamageCharge(0);
                              setCleaningCharge(0);
                            }}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs flex items-center gap-1 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Return</span>
                          </button>
                        )}

                        {isCompleted && (
                          <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/60">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Settled</span>
                          </span>
                        )}

                        <a
                          href={`https://wa.me/91${b.customerPhone}?text=Namaste%20${encodeURIComponent(
                            b.customerName
                          )},%20Barnali%20Fashion%20se%20Order%20${b.id}%20ka%20update.`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="WhatsApp Message"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ORDER FULL DETAILS BOTTOM SHEET                           */}
      {/* ========================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-4 sm:p-6 text-xs max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-900">
                  {selectedOrder.id}
                </span>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {/* Customer Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Customer Profile
                </span>
                <div className="text-sm font-semibold text-slate-900">
                  {selectedOrder.customerName}
                </div>
                <div className="text-slate-600 font-mono">+91 {selectedOrder.customerPhone}</div>
                {selectedOrder.customerAddress && (
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {selectedOrder.customerAddress}
                  </div>
                )}
              </div>

              {/* Costume & Dates */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Costume &amp; Schedule
                </span>
                <div className="font-medium text-slate-900">
                  <span className="font-mono font-bold text-[#6B1D2F]">
                    {selectedOrder.costumeCode || selectedOrder.items[0]?.garmentUnitId}
                  </span>{" "}
                  — {selectedOrder.items[0]?.productName}
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Pickup Date</span>
                    <strong className="text-slate-800">{selectedOrder.pickupDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Event Date</span>
                    <strong className="text-slate-800">{selectedOrder.eventDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Return Due</span>
                    <strong className="text-slate-800">{selectedOrder.returnDueDate}</strong>
                  </div>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400">Rental Total</span>
                  <div className="text-sm font-bold text-[#6B1D2F]">
                    {formatINR(selectedOrder.rentalTotal)}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400">Security Deposit</span>
                  <div className="text-sm font-bold text-slate-900">
                    {formatINR(selectedOrder.securityDepositTotal)}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400">Advance Paid</span>
                  <div className="font-bold text-emerald-700">
                    {formatINR(selectedOrder.advancePaid)}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400">Balance Due</span>
                  <div className="font-bold text-slate-900">
                    {formatINR(selectedOrder.remainingRentalDue || 0)}
                  </div>
                </div>
              </div>

              {/* Handover & Return Logs if exists */}
              {selectedOrder.handoverCondition && (
                <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                  <strong>Handover Log:</strong> {selectedOrder.handoverCondition} (Date:{" "}
                  {selectedOrder.handoverDate})
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <a
                  href={`https://wa.me/91${selectedOrder.customerPhone}?text=Namaste%20${encodeURIComponent(
                    selectedOrder.customerName
                  )},%20Barnali%20Fashion%20se%20Order%20${selectedOrder.id}%20ka%20update.`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-medium text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Slip</span>
                </a>

                {selectedOrder.status === "OUT_ON_RENT" && (
                  <button
                    onClick={() => {
                      setReturnBooking(selectedOrder);
                      setActualReturnDate("2026-11-08");
                      setSelectedOrder(null);
                    }}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs shadow-xs"
                  >
                    Process Return
                  </button>
                )}

                {selectedOrder.status === "CONFIRMED" && (
                  <button
                    onClick={() => {
                      setHandoverBooking(selectedOrder);
                      setHandoverDate("2026-11-08");
                      setSelectedOrder(null);
                    }}
                    className="px-3.5 py-2 bg-[#6B1D2F] hover:bg-[#551624] text-white rounded-xl font-semibold text-xs shadow-xs"
                  >
                    Execute Handover
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5-STEP NEW ORDER WIZARD (MOBILE-FIRST WITH STICKY BAR)    */}
      {/* ========================================================= */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-4 sm:p-6 text-xs max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-semibold text-sm text-slate-900">
                  New Rental Order (5-Step Counter Flow)
                </span>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Step {wizardStep} of 3:{" "}
                  {wizardStep === 1
                    ? "Select Costume"
                    : wizardStep === 2
                    ? "Customer & Dates"
                    : "Calculate & Confirm"}
                </div>
              </div>
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Indicator */}
            <div className="grid grid-cols-3 gap-2 my-3">
              <div
                className={`py-1.5 px-2 rounded-lg text-center text-[10px] font-semibold transition-colors ${
                  wizardStep === 1
                    ? "bg-[#6B1D2F] text-white"
                    : selectedCostume
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                1. Costume
              </div>
              <div
                className={`py-1.5 px-2 rounded-lg text-center text-[10px] font-semibold transition-colors ${
                  wizardStep === 2
                    ? "bg-[#6B1D2F] text-white"
                    : customerName
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                2. Client &amp; Dates
              </div>
              <div
                className={`py-1.5 px-2 rounded-lg text-center text-[10px] font-semibold transition-colors ${
                  wizardStep === 3
                    ? "bg-[#6B1D2F] text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                3. Payment Bill
              </div>
            </div>

            {/* STEP 1: COSTUME SELECTION */}
            {wizardStep === 1 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="ALL">All Garment Types</option>
                    <option value="Bridal Lehenga">Bridal Lehenga</option>
                    <option value="Indo-Western">Indo-Western</option>
                    <option value="Jodhpuri Suit">Jodhpuri Suit</option>
                    <option value="Groom Sherwani">Groom Sherwani</option>
                    <option value="Party Gown">Party Gown</option>
                    <option value="Silk Saree">Silk Saree</option>
                    <option value="Kids Festive Wear">Kids Festive Wear</option>
                  </select>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {filteredGarmentsForBooking.map((g) => {
                    const isSelected = selectedCostume?.id === g.id;
                    const isAvail = g.status === "AVAILABLE";

                    return (
                      <div
                        key={g.id}
                        onClick={() => setSelectedCostume(g)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#6B1D2F]/8 border-[#6B1D2F] shadow-2xs"
                            : "bg-white hover:bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={g.image}
                            alt={g.productName}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-[#6B1D2F]">
                                {g.id}
                              </span>
                              <StatusBadge status={g.status} />
                            </div>
                            <div className="text-xs font-semibold text-slate-900 truncate mt-0.5">
                              {g.productName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Size: {g.size} · Rent:{" "}
                              <strong className="text-slate-900">{formatINR(g.rentalPrice)}</strong>{" "}
                              · Dep: {formatINR(g.securityDeposit)}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 pl-2">
                          {isSelected ? (
                            <CheckCircle2 className="w-5 h-5 text-[#6B1D2F]" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-slate-300" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sticky Action */}
                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    disabled={!selectedCostume}
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 bg-[#6B1D2F] hover:bg-[#551624] disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs"
                  >
                    Next: Customer Info &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CUSTOMER & BOOKING INFO */}
            {wizardStep === 2 && (
              <div className="space-y-3">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Selected Piece
                    </span>
                    <div className="font-semibold text-slate-900 text-xs">
                      <span className="font-mono text-[#6B1D2F] font-bold">
                        {selectedCostume?.id}
                      </span>{" "}
                      · {selectedCostume?.productName}
                    </div>
                  </div>
                  <button
                    onClick={() => setWizardStep(1)}
                    className="text-[11px] text-[#6B1D2F] font-semibold underline"
                  >
                    Change
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Minati Meher"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                    Customer Address / Landmark
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Near Bhatli Chowk, Bargarh"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                      Pickup Date *
                    </label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                      Return Date *
                    </label>
                    <input
                      type="date"
                      value={returnDueDate}
                      onChange={(e) => setReturnDueDate(e.target.value)}
                      className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Sticky Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-3.5 py-2 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!customerName || !customerPhone}
                    onClick={() => setWizardStep(3)}
                    className="px-4 py-2 bg-[#6B1D2F] hover:bg-[#551624] disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs"
                  >
                    Next: Pricing &amp; Bill &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PRICING & PAYMENT */}
            {wizardStep === 3 && (
              <form onSubmit={handleCreateOrder} className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rental Price:</span>
                    <span className="font-semibold text-slate-900">{formatINR(rentalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Security Deposit (Refundable):</span>
                    <span className="font-semibold text-slate-900">
                      {formatINR(securityDeposit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Delivery Charges:</span>
                    <input
                      type="number"
                      value={deliveryCharges}
                      onChange={(e) => setDeliveryCharges(Number(e.target.value) || 0)}
                      className="w-20 p-1 text-right bg-white border border-slate-200 rounded text-xs font-semibold"
                    />
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                    <span>Total Amount:</span>
                    <span className="text-[#6B1D2F]">{formatINR(totalBill)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                      Advance Received (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={advanceReceived}
                      onChange={(e) => setAdvanceReceived(Number(e.target.value) || 0)}
                      className="w-full p-2 bg-emerald-50/50 border border-emerald-200 rounded-lg font-bold text-emerald-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as any)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                    >
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="CASH">Cash Counter</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-medium text-amber-900">Balance Due at Handover:</span>
                  <span className="font-bold text-base text-amber-950 font-mono">
                    {formatINR(balanceDue)}
                  </span>
                </div>

                {/* Sticky Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="px-3.5 py-2 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#6B1D2F] hover:bg-[#551624] text-white font-semibold rounded-lg shadow-xs"
                  >
                    Confirm &amp; Generate Slip
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- HANDOVER MODAL --- */}
      {handoverBooking && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-4 sm:p-6 text-xs animate-in slide-in-from-bottom sm:zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-900">
                Step 4: Costume Handover &amp; Delivery
              </span>
              <button
                onClick={() => setHandoverBooking(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-900">{handoverBooking.customerName}</div>
                <div className="text-slate-500 font-mono">
                  Order {handoverBooking.id} · Piece:{" "}
                  <strong className="text-[#6B1D2F]">{handoverBooking.costumeCode}</strong>
                </div>
                <div className="text-amber-700 font-semibold mt-1">
                  Collect Balance Due: {formatINR(handoverBooking.remainingRentalDue || 0)}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                  Handover Date
                </label>
                <input
                  type="date"
                  value={handoverDate}
                  onChange={(e) => setHandoverDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                  Condition &amp; Inspection Note at Handover *
                </label>
                <textarea
                  rows={2}
                  value={handoverCondition}
                  onChange={(e) => setHandoverCondition(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setHandoverBooking(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteHandover}
                  className="px-4 py-1.5 bg-[#6B1D2F] hover:bg-[#551624] text-white rounded-lg font-semibold shadow-xs"
                >
                  Confirm Handover (Out on Rent)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- RETURN & SETTLEMENT MODAL --- */}
      {returnBooking && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-4 sm:p-6 text-xs max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-900">
                Step 5: Return Inspection &amp; Deposit Refund
              </span>
              <button
                onClick={() => setReturnBooking(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-900">{returnBooking.customerName}</div>
                <div className="text-slate-500 font-mono">
                  Piece: <strong className="text-[#6B1D2F]">{returnBooking.costumeCode}</strong> ·
                  Security Held: {formatINR(returnBooking.securityDepositTotal)}
                </div>
                <div className="text-[11px] text-slate-500">
                  Scheduled Due: <strong>{returnBooking.returnDueDate}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                    Actual Return Date
                  </label>
                  <input
                    type="date"
                    value={actualReturnDate}
                    onChange={(e) => setActualReturnDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                    Late Fee (15% / day)
                  </label>
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg font-bold text-rose-700">
                    {formatINR(returnSettlement.lateFee)} ({returnSettlement.lateDays}d late)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                    Damage Deductions (₹)
                  </label>
                  <input
                    type="number"
                    value={damageCharge}
                    onChange={(e) => setDamageCharge(Number(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                    Special Cleaning (₹)
                  </label>
                  <input
                    type="number"
                    value={cleaningCharge}
                    onChange={(e) => setCleaningCharge(Number(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                  Next Post-Return Care Action
                </label>
                <select
                  value={nextCareAction}
                  onChange={(e) => setNextCareAction(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  <option value="DRY_CLEAN">Send to Dry Clean Register (Out Date)</option>
                  <option value="STITCHING">Send to Tailor Stitching Register (Out Date)</option>
                  <option value="AVAILABLE">Directly Available (No Care Needed)</option>
                </select>
              </div>

              {/* Net Refund Result Box */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-emerald-800 font-semibold uppercase">
                    Net Refund Payable to Customer
                  </div>
                  <div className="text-base font-bold text-emerald-950 font-mono">
                    {formatINR(returnSettlement.netRefund)}
                  </div>
                </div>
                <div className="text-[10px] text-emerald-700 text-right">
                  Deposit: {formatINR(returnBooking.securityDepositTotal)} <br />- Deductions:{" "}
                  {formatINR(returnSettlement.lateFee + damageCharge + cleaningCharge)}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturnBooking(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteReturn}
                  className="px-4 py-1.5 bg-[#6B1D2F] hover:bg-[#551624] text-white rounded-lg font-semibold shadow-xs"
                >
                  Complete Return &amp; Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- WHATSAPP SLIP MODAL --- */}
      {whatsappReceipt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full border border-slate-200 shadow-xl text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-slate-900">
                WhatsApp Slip Generated
              </span>
              <button
                onClick={() => setWhatsappReceipt(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <pre className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono whitespace-pre-wrap text-slate-800 max-h-60 overflow-y-auto leading-relaxed">
              {whatsappReceipt}
            </pre>

            <button
              onClick={() => {
                navigator.clipboard?.writeText(whatsappReceipt);
                alert("Receipt copied to clipboard!");
                setWhatsappReceipt(null);
              }}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Copy WhatsApp Text</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingsCounterPage() {
  return (
    <Suspense fallback={<div className="p-4 text-xs text-slate-400">Loading orders...</div>}>
      <BookingsContent />
    </Suspense>
  );
}
