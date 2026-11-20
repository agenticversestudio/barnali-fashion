"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Booking, GarmentUnit, Customer } from "@/types";

export default function BookingsCounterPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [garments, setGarments] = useState<GarmentUnit[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // --- NEW ORDER MODAL STATE ---
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
  const [handoverCondition, setHandoverCondition] = useState("Excellent condition, fitting verified");
  const [handoverDate, setHandoverDate] = useState("2026-11-08");

  // --- RETURN & SETTLEMENT MODAL STATE ---
  const [returnBooking, setReturnBooking] = useState<Booking | null>(null);
  const [actualReturnDate, setActualReturnDate] = useState("2026-11-08");
  const [damageCharge, setDamageCharge] = useState<number>(0);
  const [cleaningCharge, setCleaningCharge] = useState<number>(0);
  const [returnNotes, setReturnNotes] = useState("");
  const [nextCareAction, setNextCareAction] = useState<"DRY_CLEAN" | "STITCHING" | "AVAILABLE">("DRY_CLEAN");

  // WhatsApp Slip Preview
  const [whatsappReceipt, setWhatsappReceipt] = useState<string | null>(null);

  const loadData = () => {
    setBookings(DataStore.getBookings());
    setGarments(DataStore.getGarments());
    setCustomers(DataStore.getCustomers());
  };

  useEffect(() => {
    loadData();
  }, []);

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
    if (statusFilter === "ACTIVE") matchesStatus = b.status === "CONFIRMED" || b.status === "PICKUP_PENDING" || b.status === "OUT_ON_RENT";
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

      const msg = `*BARNALI FASHION — BOOKING CONFIRMATION*\n` +
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

    const msg = `*BARNALI FASHION — RETURN RECEIPT*\n` +
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bookings, handovers, returns, and deposit settlements.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedCostume(null);
            setWizardStep(1);
            setShowNewOrderModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#6B1D2F] hover:bg-[#551624] text-white text-xs font-medium rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Order</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
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

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === "ALL" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              All Orders ({bookings.length})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === "ACTIVE" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("OUT_ON_RENT")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === "OUT_ON_RENT" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Out on rent
            </button>
            <button
              onClick={() => setStatusFilter("COMPLETED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === "COMPLETED" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
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
                      <div className="text-[11px] text-slate-400 font-mono">+91 {b.customerPhone}</div>
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

      {/* --- NEW ORDER MODAL --- */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-xl w-full p-6 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-900">Create Order</span>
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Clean Stepper */}
            <div className="grid grid-cols-3 gap-2 my-4">
              <div
                className={`py-1.5 px-2 rounded-lg text-center text-[11px] font-medium transition-colors ${
                  wizardStep === 1
                    ? "bg-slate-900 text-white"
                    : selectedCostume
                    ? "bg-slate-100 text-slate-700"
                    : "text-slate-400 bg-slate-50"
                }`}
              >
                1. Select Piece
              </div>
              <div
                className={`py-1.5 px-2 rounded-lg text-center text-[11px] font-medium transition-colors ${
                  wizardStep === 2
                    ? "bg-slate-900 text-white"
                    : customerName
                    ? "bg-slate-100 text-slate-700"
                    : "text-slate-400 bg-slate-50"
                }`}
              >
                2. Client &amp; Dates
              </div>
              <div
                className={`py-1.5 px-2 rounded-lg text-center text-[11px] font-medium transition-colors ${
                  wizardStep === 3
                    ? "bg-slate-900 text-white"
                    : "text-slate-400 bg-slate-50"
                }`}
              >
                3. Payment
              </div>
            </div>

            {/* Step 1: Select Piece */}
            {wizardStep === 1 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700">Choose Piece</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Bridal Lehenga">Bridal Lehenga</option>
                    <option value="Groom Sherwani">Groom Sherwani</option>
                    <option value="Indo-Western">Indo-Western</option>
                    <option value="Party Gown">Party Gown</option>
                    <option value="Silk Saree">Silk Saree</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-0.5">
                  {filteredGarmentsForBooking.map((g) => {
                    const isSelected = selectedCostume?.id === g.id;
                    return (
                      <div
                        key={g.id}
                        onClick={() => setSelectedCostume(g)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-colors flex items-center gap-3 ${
                          isSelected
                            ? "border-slate-900 bg-slate-50/80 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <img
                          src={g.image}
                          alt={g.productName}
                          className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-semibold text-xs text-slate-900">
                              {g.id}
                            </span>
                            <StatusBadge status={g.status} className="text-[9px] py-0 px-1.5" />
                          </div>
                          <div className="font-medium text-slate-700 truncate mt-0.5">{g.productName}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Rent: {formatINR(g.rentalPrice)} · Dep: {formatINR(g.securityDeposit)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    disabled={!selectedCostume}
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 bg-[#6B1D2F] hover:bg-[#551624] disabled:opacity-40 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Customer & Dates */}
            {wizardStep === 2 && (
              <div className="space-y-3">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-400">Selected: </span>
                    <span className="font-semibold text-slate-900">{selectedCostume?.id}</span> · {selectedCostume?.productName}
                  </div>
                  <button
                    onClick={() => setWizardStep(1)}
                    className="text-xs font-medium text-[#6B1D2F] hover:underline"
                  >
                    Change
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sunita Panda"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Phone (WhatsApp) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9861023451"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Customer Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bhatli Road, Bargarh"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-700 mb-1">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-700 mb-1">
                      Pickup Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-700 mb-1">
                      Return Due Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={returnDueDate}
                      onChange={(e) => setReturnDueDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-3.5 py-1.5 border border-slate-200 rounded-lg font-medium text-slate-700"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!customerName || !customerPhone}
                    onClick={() => setWizardStep(3)}
                    className="px-4 py-1.5 bg-[#6B1D2F] hover:bg-[#551624] disabled:opacity-40 text-white font-medium rounded-lg text-xs flex items-center gap-1.5"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Fast Calculation */}
            {wizardStep === 3 && (
              <form onSubmit={handleCreateOrder} className="space-y-3.5">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Rental Rate:</span>
                    <span className="font-semibold text-slate-900">{formatINR(rentalPrice)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Security Deposit:</span>
                    <span className="font-medium text-slate-700">{formatINR(securityDeposit)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Delivery Charges:</span>
                    <div className="w-24">
                      <input
                        type="number"
                        min="0"
                        value={deliveryCharges}
                        onChange={(e) => setDeliveryCharges(Number(e.target.value) || 0)}
                        className="w-full p-1 bg-white border border-slate-200 rounded text-right font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-semibold">
                    <span>Total Amount:</span>
                    <span className="text-slate-900 font-bold">{formatINR(totalBill)}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Advance Received (₹)
                      </label>
                      <input
                        type="number"
                        required
                        value={advanceReceived}
                        onChange={(e) => setAdvanceReceived(Number(e.target.value) || 0)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-semibold text-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Balance Due at Pickup
                      </label>
                      <div className="p-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 text-xs">
                        {formatINR(balanceDue)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Payment Mode:</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMode("UPI")}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          paymentMode === "UPI" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"
                        }`}
                      >
                        UPI
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMode("CASH")}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          paymentMode === "CASH" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"
                        }`}
                      >
                        Cash
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="px-3.5 py-1.5 border border-slate-200 rounded-lg font-medium text-slate-700"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#6B1D2F] hover:bg-[#551624] text-white font-medium rounded-lg text-xs shadow-xs"
                  >
                    Confirm Order
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- HANDOVER MODAL --- */}
      {handoverBooking && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-900">Record Handover</span>
              <button
                onClick={() => setHandoverBooking(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="text-xs text-slate-500">Customer</div>
                <div className="font-semibold text-slate-900">{handoverBooking.customerName}</div>
                <div className="text-xs text-slate-600">
                  Costume: <span className="font-mono text-[#6B1D2F] font-semibold">{handoverBooking.costumeCode}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Balance to collect: <strong>{formatINR(handoverBooking.remainingRentalDue || 0)}</strong>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Handover Date
                </label>
                <input
                  type="date"
                  value={handoverDate}
                  onChange={(e) => setHandoverDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Condition Notes
                </label>
                <textarea
                  rows={2}
                  value={handoverCondition}
                  onChange={(e) => setHandoverCondition(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setHandoverBooking(null)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteHandover}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs"
                >
                  Confirm Handover
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- RETURN & SETTLEMENT MODAL --- */}
      {returnBooking && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 text-xs animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-900">Return &amp; Refund Settlement</span>
              <button
                onClick={() => setReturnBooking(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">Customer</div>
                  <div className="font-semibold text-slate-900">{returnBooking.customerName}</div>
                  <div className="text-xs text-[#6B1D2F] font-mono mt-0.5">{returnBooking.costumeCode}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Security Deposit</div>
                  <div className="font-semibold text-slate-900">{formatINR(returnBooking.securityDepositTotal)}</div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Actual Return Date
                </label>
                <input
                  type="date"
                  value={actualReturnDate}
                  onChange={(e) => setActualReturnDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs"
                />
              </div>

              {returnSettlement.lateDays > 0 && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                  <strong>{returnSettlement.lateDays} days overdue:</strong> 15% fee applied ({formatINR(returnSettlement.lateFee)}).
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Damage Deduction (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={damageCharge}
                    onChange={(e) => setDamageCharge(Number(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Cleaning Deduction (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cleaningCharge}
                    onChange={(e) => setCleaningCharge(Number(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Next Destination
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setNextCareAction("DRY_CLEAN")}
                    className={`py-2 px-1 rounded-lg border text-center transition-colors ${
                      nextCareAction === "DRY_CLEAN"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    Dry Clean
                  </button>
                  <button
                    type="button"
                    onClick={() => setNextCareAction("STITCHING")}
                    className={`py-2 px-1 rounded-lg border text-center transition-colors ${
                      nextCareAction === "STITCHING"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    Stitching
                  </button>
                  <button
                    type="button"
                    onClick={() => setNextCareAction("AVAILABLE")}
                    className={`py-2 px-1 rounded-lg border text-center transition-colors ${
                      nextCareAction === "AVAILABLE"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    Available
                  </button>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                <span className="text-xs text-emerald-800 font-medium">Net Refund to Client</span>
                <span className="text-base font-bold text-emerald-900">{formatINR(returnSettlement.netRefund)}</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturnBooking(null)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteReturn}
                  className="px-4 py-1.5 bg-[#6B1D2F] hover:bg-[#551624] text-white font-medium rounded-lg text-xs"
                >
                  Complete Settlement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Receipt Modal */}
      {whatsappReceipt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full border border-slate-200 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-semibold text-xs text-slate-900">WhatsApp Receipt</span>
              <button onClick={() => setWhatsappReceipt(null)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <pre className="my-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono text-[11px] whitespace-pre-wrap">
              {whatsappReceipt}
            </pre>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(whatsappReceipt);
                  alert("Copied to clipboard!");
                }}
                className="flex-1 py-1.5 bg-[#6B1D2F] hover:bg-[#551624] text-white rounded-lg font-medium"
              >
                Copy
              </button>
              <button
                onClick={() => setWhatsappReceipt(null)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}