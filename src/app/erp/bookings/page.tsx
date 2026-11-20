"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Search,
  Plus,
  Calendar,
  Phone,
  MessageCircle,
  PackageCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Printer,
  X,
  Sparkles,
  MapPin,
  Clock,
  Shirt,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Booking, GarmentUnit, Customer } from "@/types";

export default function BookingsCounterPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [garments, setGarments] = useState<GarmentUnit[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // --- 5-STEP NEW ORDER WIZARD MODAL STATE ---
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Step 1: Costume Selection
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

  // --- STEP 4: HANDOVER MODAL STATE ---
  const [handoverBooking, setHandoverBooking] = useState<Booking | null>(null);
  const [handoverCondition, setHandoverCondition] = useState("Excellent condition, blouse fitting verified");
  const [handoverDate, setHandoverDate] = useState("2026-11-08");

  // --- STEP 5: RETURN & SETTLEMENT MODAL STATE ---
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

  // Available costumes for Step 1
  const filteredGarmentsForBooking = garments.filter((g) => {
    const matchesCat = selectedCategory === "ALL" || g.category === selectedCategory;
    return matchesCat;
  });

  // Step 3 Math
  const rentalPrice = selectedCostume ? selectedCostume.rentalPrice : 0;
  const securityDeposit = selectedCostume ? selectedCostume.securityDeposit : 0;
  const totalBill = rentalPrice + securityDeposit + deliveryCharges;
  const balanceDue = Math.max(0, totalBill - advanceReceived);

  // Handle Submit Step 1->2->3
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
      notes: `Booked via 5-Step Counter. Delivery Charges: ₹${deliveryCharges}. Balance due on pickup: ₹${balanceDue}.`,
    });

    if (res.success && res.booking) {
      loadData();
      setShowNewOrderModal(false);

      // Prepare WhatsApp Receipt message
      const msg = `*BARNALI FASHION — BOOKING RECEIPT*\n` +
        `Order ID: ${res.booking.id}\n` +
        `Customer: ${customerName}\n` +
        `Costume: ${selectedCostume.id} (${selectedCostume.productName})\n` +
        `Event Date: ${eventDate}\n` +
        `Pickup Date: ${pickupDate}\n` +
        `Return Due Date: ${returnDueDate}\n` +
        `-------------------------\n` +
        `Rental Price: ₹${rentalPrice}\n` +
        `Security Deposit: ₹${securityDeposit}\n` +
        `Delivery Charges: ₹${deliveryCharges}\n` +
        `Total: ₹${totalBill}\n` +
        `*Advance Received: ₹${advanceReceived}*\n` +
        `*Balance Due at Handover: ₹${balanceDue}*\n` +
        `-------------------------\n` +
        `Terms: Please return by ${returnDueDate}. Late returns incur 15% daily fee. Thank you!`;

      setWhatsappReceipt(msg);
    } else {
      alert(res.error || "Could not save booking");
    }
  };

  // Step 4 Handover Execution
  const handleExecuteHandover = () => {
    if (!handoverBooking) return;
    DataStore.issueBooking(handoverBooking.id, "Counter Staff");
    // Also record handover condition in notes
    const b = DataStore.getBookingById(handoverBooking.id);
    if (b) {
      b.handoverDate = handoverDate;
      b.handoverCondition = handoverCondition;
    }
    loadData();
    setHandoverBooking(null);
    alert(`Handover completed! Costume is now marked "Out on rent 🔵".`);
  };

  // Step 5 Return Calculation
  const calculateReturnSettlement = () => {
    if (!returnBooking) return { lateDays: 0, lateFee: 0, netRefund: 0 };
    const dueTime = new Date(returnBooking.returnDueDate).getTime();
    const actTime = new Date(actualReturnDate).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const lateDays = Math.max(0, Math.round((actTime - dueTime) / dayMs));
    // 15% late fee per day on rental total
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

    // Prepare Return WhatsApp Message
    const msg = `*BARNALI FASHION — RETURN & REFUND RECEIPT*\n` +
      `Customer: ${bCustomer}\n` +
      `Actual Return Date: ${actualReturnDate}\n` +
      `Late Days: ${returnSettlement.lateDays} days\n` +
      `Late Fee (15%): ₹${returnSettlement.lateFee}\n` +
      `Damage Charges: ₹${damageCharge}\n` +
      `Cleaning Deduction: ₹${cleaningCharge}\n` +
      `-------------------------\n` +
      `Original Security Deposit: ₹${bDeposit}\n` +
      `*Net Refund Paid to Customer: ₹${bRefund}*\n` +
      `Settled via Cash / UPI. Thank you for renting with Barnali Fashion, Bargarh!`;

    setWhatsappReceipt(msg);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8C6F3B] font-semibold uppercase tracking-wider mb-1">
            <ClipboardCheck className="w-4 h-4 text-[#4B1835]" />
            <span>Counter Orders Register</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#27222A]">Counter Orders (5-Step Flow)</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Step 1: Selection &rarr; Step 2: Booking Info &rarr; Step 3: Math &rarr; Step 4: Handover &rarr; Step 5: Return &amp; 15% Late Fee Refund.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedCostume(null);
            setWizardStep(1);
            setShowNewOrderModal(true);
          }}
          className="bg-[#4B1835] hover:bg-[#320F23] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4 text-[#D4B67F]" />
          <span>New 5-Step Booking</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EFE9DD] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#B89558] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Customer Name, Phone, Costume Code (e.g. LF-001), or Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl focus:outline-hidden focus:border-[#4B1835] text-gray-800"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                statusFilter === "ALL" ? "bg-[#4B1835] text-white" : "bg-[#FBF9F5] text-gray-700 border border-[#E8DFD1]"
              }`}
            >
              All Orders ({bookings.length})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                statusFilter === "ACTIVE" ? "bg-[#4B1835] text-white" : "bg-[#FBF9F5] text-gray-700 border border-[#E8DFD1]"
              }`}
            >
              Active / Upcoming
            </button>
            <button
              onClick={() => setStatusFilter("OUT_ON_RENT")}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                statusFilter === "OUT_ON_RENT" ? "bg-[#4B1835] text-white" : "bg-[#FBF9F5] text-gray-700 border border-[#E8DFD1]"
              }`}
            >
              Out on Rent 🔵
            </button>
            <button
              onClick={() => setStatusFilter("COMPLETED")}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                statusFilter === "COMPLETED" ? "bg-[#4B1835] text-white" : "bg-[#FBF9F5] text-gray-700 border border-[#E8DFD1]"
              }`}
            >
              Returned &amp; Settled
            </button>
          </div>
        </div>
      </div>

      {/* Bookings Table with Step 4 & Step 5 Quick Action Buttons */}
      <div className="bg-white rounded-2xl border border-[#EFE9DD] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5EB] border-b border-[#EFE9DD] text-[#8C6F3B] uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Order ID &amp; Customer</th>
                <th className="py-3 px-3">Costume Code &amp; Item</th>
                <th className="py-3 px-3">Event &amp; Pickup Date</th>
                <th className="py-3 px-3">Return Due Date</th>
                <th className="py-3 px-3">Advance / Balance</th>
                <th className="py-3 px-3">Security Deposit</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Counter Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1ECE3]">
              {filteredBookings.map((b) => {
                const isOut = b.status === "OUT_ON_RENT";
                const isConfirmed = b.status === "CONFIRMED" || b.status === "PICKUP_PENDING";
                const isCompleted = b.status === "COMPLETED";

                return (
                  <tr key={b.id} className="hover:bg-[#FBF9F5] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-[#4B1835]">{b.id}</div>
                      <div className="font-semibold text-gray-900 mt-0.5">{b.customerName}</div>
                      <div className="text-[11px] text-gray-500 font-mono">+91 {b.customerPhone}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-xs bg-[#F5EFE6] text-[#4B1835] px-1.5 py-0.5 rounded border border-[#E8DFD1]">
                        {b.costumeCode || b.items[0]?.garmentUnitId || "LF-001"}
                      </span>
                      <div className="text-gray-800 font-medium line-clamp-1 mt-0.5">
                        {b.items[0]?.productName}
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-gray-900">Pickup: {b.pickupDate}</div>
                      <div className="text-[11px] text-gray-500">Event: {b.eventDate}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-gray-900">{b.returnDueDate}</div>
                      {b.lateDays && b.lateDays > 0 ? (
                        <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          {b.lateDays}d Late (15% fee: {formatINR(b.lateFee)})
                        </span>
                      ) : null}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="text-emerald-700 font-semibold">
                        Adv: {formatINR(b.advancePaid)}
                      </div>
                      <div className="text-rose-700 font-bold">
                        Bal: {formatINR(b.remainingRentalDue || 0)}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-semibold text-[#8C6F3B] whitespace-nowrap">
                      {formatINR(b.securityDepositTotal)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={b.status} />
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Step 4 Button: Handover */}
                        {isConfirmed && (
                          <button
                            onClick={() => {
                              setHandoverBooking(b);
                              setHandoverDate("2026-11-08");
                            }}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Step 4: Handover</span>
                          </button>
                        )}

                        {/* Step 5 Button: Return & Refund */}
                        {isOut && (
                          <button
                            onClick={() => {
                              setReturnBooking(b);
                              setActualReturnDate("2026-11-08");
                              setDamageCharge(0);
                              setCleaningCharge(0);
                            }}
                            className="px-2.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Step 5: Return &amp; Settle</span>
                          </button>
                        )}

                        {/* Completed View */}
                        {isCompleted && (
                          <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Refunded {formatINR(b.refundAmount || 0)}</span>
                          </span>
                        )}

                        {/* WhatsApp Slip Trigger */}
                        <a
                          href={`https://wa.me/91${b.customerPhone}?text=Namaste%20${encodeURIComponent(
                            b.customerName
                          )},%20Barnali%20Fashion%20se%20Order%20${b.id}%20(Costume%20${b.costumeCode})%20ka%20update.`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                          title="Send WhatsApp Update"
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

      {/* --- MODAL 1: NEW 5-STEP BOOKING WIZARD --- */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EFE9DD] max-w-2xl w-full p-6 text-xs max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DD]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8C6F3B] bg-amber-100 px-2 py-0.5 rounded">
                  Client 5-Step Counter
                </span>
                <h3 className="font-serif font-bold text-lg text-[#27222A] mt-1">
                  New Costume Booking
                </h3>
              </div>
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Indicator */}
            <div className="grid grid-cols-3 gap-2 my-4">
              <div
                className={`p-2 rounded-xl border text-center transition-all ${
                  wizardStep === 1
                    ? "bg-[#4B1835] text-white border-[#4B1835] font-bold"
                    : selectedCostume
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                    : "bg-gray-50 border-gray-200 text-gray-500"
                }`}
              >
                Step 1: Costume Selection
              </div>
              <div
                className={`p-2 rounded-xl border text-center transition-all ${
                  wizardStep === 2
                    ? "bg-[#4B1835] text-white border-[#4B1835] font-bold"
                    : customerName
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                    : "bg-gray-50 border-gray-200 text-gray-500"
                }`}
              >
                Step 2: Customer &amp; Dates
              </div>
              <div
                className={`p-2 rounded-xl border text-center transition-all ${
                  wizardStep === 3
                    ? "bg-[#4B1835] text-white border-[#4B1835] font-bold"
                    : "bg-gray-50 border-gray-200 text-gray-500"
                }`}
              >
                Step 3: Fast Calculation
              </div>
            </div>

            {/* --- STEP 1: COSTUME SELECTION --- */}
            {wizardStep === 1 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800">
                    Select Costume by Type (Lehenga, Sherwani, Indo-Western, etc.)
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="p-1.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-semibold"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Bridal Lehenga">Bridal Lehenga</option>
                    <option value="Groom Sherwani">Groom Sherwani</option>
                    <option value="Indo-Western">Indo-Western</option>
                    <option value="Party Gown">Party Gown</option>
                    <option value="Silk Saree">Silk Saree</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-1">
                  {filteredGarmentsForBooking.map((g) => {
                    const isSelected = selectedCostume?.id === g.id;
                    return (
                      <div
                        key={g.id}
                        onClick={() => setSelectedCostume(g)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected
                            ? "bg-[#FAF5EB] border-2 border-[#4B1835] shadow-xs"
                            : "bg-white border-[#EFE9DD] hover:border-[#8C6F3B]"
                        }`}
                      >
                        <img
                          src={g.image}
                          alt={g.productName}
                          className="w-14 h-14 rounded-lg object-cover shrink-0 border"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs bg-[#4B1835] text-white px-1.5 py-0.5 rounded">
                              {g.id}
                            </span>
                            <StatusBadge status={g.status} className="text-[9px] py-0 px-1.5" />
                          </div>
                          <div className="font-bold text-gray-900 truncate mt-1">{g.productName}</div>
                          <div className="text-[11px] text-gray-600 mt-0.5">
                            Rent: <strong>{formatINR(g.rentalPrice)}</strong> | Dep: {formatINR(g.securityDeposit)}
                          </div>
                          <div className="text-[10px] text-emerald-800 font-semibold">
                            Location: {g.location || g.storageLocation}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-[#EFE9DD] flex justify-end">
                  <button
                    disabled={!selectedCostume}
                    onClick={() => setWizardStep(2)}
                    className="px-5 py-2 bg-[#4B1835] hover:bg-[#320F23] disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <span>Proceed to Customer Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* --- STEP 2: CUSTOMER & BOOKING INFO --- */}
            {wizardStep === 2 && (
              <div className="space-y-3">
                <div className="p-2.5 bg-[#FAF5EB] rounded-xl border border-[#E8DFD1] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Selected Costume:</span>
                    <div className="font-bold text-[#4B1835]">
                      {selectedCostume?.id} — {selectedCostume?.productName}
                    </div>
                  </div>
                  <button
                    onClick={() => setWizardStep(1)}
                    className="text-xs font-bold text-[#8C6F3B] hover:underline"
                  >
                    Change
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sunita Panda"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Phone Number (WhatsApp) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9861023451"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Customer Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bhatli Road, Near Radharani Temple, Bargarh"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">
                      Pickup / Delivery Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">
                      Return Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={returnDueDate}
                      onChange={(e) => setReturnDueDate(e.target.value)}
                      className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-bold"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EFE9DD] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 border rounded-xl font-semibold text-gray-700"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!customerName || !customerPhone}
                    onClick={() => setWizardStep(3)}
                    className="px-5 py-2 bg-[#4B1835] hover:bg-[#320F23] disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <span>Proceed to Step 3: Calculation</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* --- STEP 3: FAST CALCULATION & CONFIRMATION --- */}
            {wizardStep === 3 && (
              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div className="bg-[#FAF5EB] p-4 rounded-xl border border-[#E8DFD1] space-y-2.5">
                  <h4 className="font-serif font-bold text-sm text-[#4B1835] border-b border-[#E8DFD1] pb-1.5">
                    Step 3: Instant Rental Price &amp; Deposit Calculation
                  </h4>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">Rental Price:</span>
                    <span className="font-bold text-gray-900">{formatINR(rentalPrice)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">Refundable Security Deposit:</span>
                    <span className="font-bold text-[#8C6F3B]">{formatINR(securityDeposit)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">Delivery / Shipping Charges:</span>
                    <div className="w-28">
                      <input
                        type="number"
                        min="0"
                        value={deliveryCharges}
                        onChange={(e) => setDeliveryCharges(Number(e.target.value) || 0)}
                        className="w-full p-1 bg-white border border-[#E8DFD1] rounded text-right font-bold"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E8DFD1] flex justify-between items-center text-sm font-bold">
                    <span>Total Contract Amount:</span>
                    <span className="text-[#4B1835] font-black">{formatINR(totalBill)}</span>
                  </div>

                  <div className="pt-2 border-t border-dashed border-[#E8DFD1] grid grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                        Advance Received (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        value={advanceReceived}
                        onChange={(e) => setAdvanceReceived(Number(e.target.value) || 0)}
                        className="w-full p-2 bg-emerald-50 border border-emerald-300 rounded-lg font-bold text-emerald-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-rose-900 mb-1">
                        Balance Due at Handover
                      </label>
                      <div className="p-2 bg-rose-50 border border-rose-300 rounded-lg font-black text-rose-900 text-sm">
                        {formatINR(balanceDue)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-600">Payment Mode:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMode("UPI")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          paymentMode === "UPI" ? "bg-emerald-600 text-white" : "bg-gray-100"
                        }`}
                      >
                        UPI / GPay
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMode("CASH")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          paymentMode === "CASH" ? "bg-emerald-600 text-white" : "bg-gray-100"
                        }`}
                      >
                        Cash
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EFE9DD] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 border rounded-xl font-semibold text-gray-700"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Booking &amp; Generate WhatsApp Receipt</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 2: STEP 4 HANDOVER & DELIVERY --- */}
      {handoverBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EFE9DD] max-w-lg w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DD]">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#27222A]">
                    Step 4: Record Handover / Delivery
                  </h3>
                  <p className="text-[11px] text-gray-500">Record costume condition &amp; delivery date</p>
                </div>
              </div>
              <button
                onClick={() => setHandoverBooking(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-[#FAF5EB] rounded-xl border border-[#E8DFD1]">
                <div className="text-gray-600">Customer:</div>
                <div className="text-sm font-bold text-gray-900">{handoverBooking.customerName} (+91 {handoverBooking.customerPhone})</div>
                <div className="text-gray-600 mt-1">Costume Given:</div>
                <div className="font-bold text-[#4B1835]">
                  {handoverBooking.costumeCode || handoverBooking.items[0]?.garmentUnitId} — {handoverBooking.items[0]?.productName}
                </div>
                <div className="mt-2 text-rose-800 font-bold">
                  Balance to Collect at Counter: {formatINR(handoverBooking.remainingRentalDue || 0)}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Delivery / Handover Date *
                </label>
                <input
                  type="date"
                  value={handoverDate}
                  onChange={(e) => setHandoverDate(e.target.value)}
                  className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Costume Condition at Handover *
                </label>
                <textarea
                  rows={2}
                  value={handoverCondition}
                  onChange={(e) => setHandoverCondition(e.target.value)}
                  className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-medium"
                />
              </div>

              <div className="pt-3 border-t border-[#EFE9DD] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setHandoverBooking(null)}
                  className="px-4 py-2 border rounded-xl font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteHandover}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Mark Handed Over (Status &rarr; Out on rent 🔵)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: STEP 5 RETURN & 15% LATE FEE REFUND --- */}
      {returnBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EFE9DD] max-w-xl w-full p-6 text-xs animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DD]">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-800 rounded-lg">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#27222A]">
                    Step 5: Return &amp; Inspection (15% Late Fee + Security Refund)
                  </h3>
                  <p className="text-[11px] text-gray-500">Record return, calculate late fee, damages &amp; refund</p>
                </div>
              </div>
              <button
                onClick={() => setReturnBooking(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div className="p-3 bg-[#FAF5EB] rounded-xl border border-[#E8DFD1]">
                <div className="flex justify-between">
                  <div>
                    <span className="text-gray-500">Customer:</span>
                    <span className="font-bold text-gray-900 ml-1">{returnBooking.customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Expected Due:</span>
                    <span className="font-bold text-gray-900 ml-1">{returnBooking.returnDueDate}</span>
                  </div>
                </div>
                <div className="mt-1 font-bold text-[#4B1835]">
                  Costume: {returnBooking.costumeCode || returnBooking.items[0]?.garmentUnitId} — {returnBooking.items[0]?.productName}
                </div>
                <div className="mt-1 text-xs font-semibold text-[#8C6F3B]">
                  Original Security Deposit Held: {formatINR(returnBooking.securityDepositTotal)}
                </div>
              </div>

              {/* Actual Return Date */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Actual Return Date *
                </label>
                <input
                  type="date"
                  value={actualReturnDate}
                  onChange={(e) => setActualReturnDate(e.target.value)}
                  className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-bold"
                />
              </div>

              {/* Late Fee Calculation Banner */}
              {returnSettlement.lateDays > 0 ? (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl">
                  <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Costume Returned Late by {returnSettlement.lateDays} Day(s)</span>
                  </div>
                  <p className="text-[11px] text-rose-800 mt-1">
                    Late Fee Formula: Rental ({formatINR(returnBooking.rentalTotal)}) &times; 15% &times; {returnSettlement.lateDays} days =
                    <strong className="text-rose-900 ml-1">{formatINR(returnSettlement.lateFee)}</strong>
                  </p>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-semibold text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Returned on time! No late fee applied.</span>
                </div>
              )}

              {/* Damage & Cleaning Charges */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Damage Deduction (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={damageCharge}
                    onChange={(e) => setDamageCharge(Number(e.target.value) || 0)}
                    className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-bold text-rose-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Cleaning Deduction (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cleaningCharge}
                    onChange={(e) => setCleaningCharge(Number(e.target.value) || 0)}
                    className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-bold text-purple-700"
                  />
                </div>
              </div>

              {/* Return Condition Notes */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Return Condition Inspection Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Minor food spot on hem; all beadwork intact"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg"
                />
              </div>

              {/* Next Post-Return Care Action */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Post-Return Next Action *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNextCareAction("DRY_CLEAN")}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                      nextCareAction === "DRY_CLEAN"
                        ? "bg-purple-700 text-white border-purple-800"
                        : "bg-gray-50 border-gray-200 text-gray-700"
                    }`}
                  >
                    🟣 Send to Dry Clean
                  </button>
                  <button
                    type="button"
                    onClick={() => setNextCareAction("STITCHING")}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                      nextCareAction === "STITCHING"
                        ? "bg-rose-700 text-white border-rose-800"
                        : "bg-gray-50 border-gray-200 text-gray-700"
                    }`}
                  >
                    🔴 Send to Stitching
                  </button>
                  <button
                    type="button"
                    onClick={() => setNextCareAction("AVAILABLE")}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                      nextCareAction === "AVAILABLE"
                        ? "bg-emerald-700 text-white border-emerald-800"
                        : "bg-gray-50 border-gray-200 text-gray-700"
                    }`}
                  >
                    🟢 Available in Godown
                  </button>
                </div>
              </div>

              {/* Final Refund Calculation Box */}
              <div className="p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-800">
                    Net Refund Payable to Customer
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    Deposit ({formatINR(returnBooking.securityDepositTotal)}) - Late Fee ({formatINR(returnSettlement.lateFee)}) - Deductions ({formatINR(damageCharge + cleaningCharge)})
                  </div>
                </div>
                <div className="text-xl font-black text-emerald-900 font-mono">
                  {formatINR(returnSettlement.netRefund)}
                </div>
              </div>

              <div className="pt-3 border-t border-[#EFE9DD] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturnBooking(null)}
                  className="px-4 py-2 border rounded-xl font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteReturn}
                  className="px-5 py-2.5 bg-[#4B1835] hover:bg-[#320F23] text-white font-bold rounded-xl shadow-xs"
                >
                  Settle Return &amp; Pay {formatINR(returnSettlement.netRefund)} Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- WHATSAPP SLIP MODAL (CLIENT CAN DIRECTLY COPY / SEND) --- */}
      {whatsappReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-[#EFE9DD] shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFE9DD]">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Customer Receipt Generated</span>
              </div>
              <button
                onClick={() => setWhatsappReceipt(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre className="my-4 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-gray-800 font-mono text-[11px] whitespace-pre-wrap">
              {whatsappReceipt}
            </pre>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(whatsappReceipt);
                  alert("WhatsApp slip copied to clipboard!");
                }}
                className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-colors"
              >
                Copy to WhatsApp
              </button>
              <button
                onClick={() => setWhatsappReceipt(null)}
                className="px-4 py-2 border rounded-xl font-semibold text-gray-700"
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