"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  UserCheck,
  Shirt,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR } from "@/lib/utils";
import { Customer, GarmentUnit } from "@/types";

export default function NewBookingWizardPage() {
  const router = useRouter();

  const [step, setStep] = useState<number>(1);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allGarments, setAllGarments] = useState<GarmentUnit[]>([]);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCity, setCustomerCity] = useState("Bargarh");

  const [eventName, setEventName] = useState("Wedding Reception");
  const [eventDate, setEventDate] = useState("2026-11-20");
  const [pickupDate, setPickupDate] = useState("2026-11-19");
  const [returnDueDate, setReturnDueDate] = useState("2026-11-22");

  const [selectedGarmentIds, setSelectedGarmentIds] = useState<string[]>([]);
  const [advancePaid, setAdvancePaid] = useState<number>(2000);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD">("UPI");
  const [bookingNotes, setBookingNotes] = useState("");

  const [conflictError, setConflictError] = useState<string | null>(null);

  useEffect(() => {
    const custs = DataStore.getCustomers();
    const garms = DataStore.getGarments();
    setCustomers(custs);
    setAllGarments(garms);

    if (custs.length > 0) {
      setSelectedCustomerId(custs[0].id);
      setCustomerName(custs[0].name);
      setCustomerPhone(custs[0].phone);
      setCustomerCity(custs[0].city);
    }
  }, []);

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    const c = customers.find((cust) => cust.id === id);
    if (c) {
      setCustomerName(c.name);
      setCustomerPhone(c.phone);
      setCustomerCity(c.city);
    }
  };

  const toggleGarmentSelection = (garmentId: string) => {
    setConflictError(null);
    if (selectedGarmentIds.includes(garmentId)) {
      setSelectedGarmentIds(selectedGarmentIds.filter((id) => id !== garmentId));
    } else {
      // Validate conflict for this garment
      const conflict = DataStore.checkConflict(garmentId, pickupDate, returnDueDate);
      if (conflict.hasConflict) {
        setConflictError(conflict.message || `Garment ${garmentId} is unavailable for selected dates.`);
        return;
      }
      setSelectedGarmentIds([...selectedGarmentIds, garmentId]);
    }
  };

  // Selected items calculation
  const selectedGarments = allGarments.filter((g) => selectedGarmentIds.includes(g.id));
  const rentalTotal = selectedGarments.reduce((acc, g) => acc + g.rentalPrice, 0);
  const securityDepositTotal = selectedGarments.reduce((acc, g) => acc + g.securityDeposit, 0);
  const remainingRentalDue = Math.max(0, rentalTotal - advancePaid);

  const handleSubmitBooking = () => {
    if (selectedGarmentIds.length === 0) {
      alert("Please select at least one garment unit for this booking.");
      return;
    }

    const items = selectedGarments.map((g) => ({
      garmentUnitId: g.id,
      productName: g.productName,
      size: g.size,
      rentalPrice: g.rentalPrice,
      securityDeposit: g.securityDeposit,
    }));

    const result = DataStore.createBooking({
      customerId: selectedCustomerId,
      customerName,
      customerPhone,
      customerWhatsApp: customerPhone,
      customerCity,
      eventName,
      eventDate,
      pickupDate,
      returnDueDate,
      items,
      rentalTotal,
      securityDepositTotal,
      advancePaid,
      remainingRentalDue,
      paymentMethod,
      notes: bookingNotes,
    });

    if (result.success && result.booking) {
      alert(`Booking ${result.booking.id} created successfully! Redirecting to printable invoice...`);
      router.push(`/erp/billing/invoices?bookingId=${result.booking.id}`);
    } else {
      alert(`Booking failed: ${result.error}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/erp/bookings"
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#4B1835] font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bookings</span>
        </Link>
        <span className="text-xs text-[#8C6F3B] font-bold uppercase tracking-wider">
          Step {step} of 4
        </span>
      </div>

      {/* Wizard Progress Bar */}
      <div className="grid grid-cols-4 gap-2 text-xs font-semibold">
        <div
          className={`p-2.5 rounded-xl border text-center transition-all ${
            step >= 1
              ? "bg-[#4B1835] text-white border-[#4B1835]"
              : "bg-white text-gray-400 border-gray-200"
          }`}
        >
          1. Customer
        </div>
        <div
          className={`p-2.5 rounded-xl border text-center transition-all ${
            step >= 2
              ? "bg-[#4B1835] text-white border-[#4B1835]"
              : "bg-white text-gray-400 border-gray-200"
          }`}
        >
          2. Rental Dates
        </div>
        <div
          className={`p-2.5 rounded-xl border text-center transition-all ${
            step >= 3
              ? "bg-[#4B1835] text-white border-[#4B1835]"
              : "bg-white text-gray-400 border-gray-200"
          }`}
        >
          3. Garments
        </div>
        <div
          className={`p-2.5 rounded-xl border text-center transition-all ${
            step >= 4
              ? "bg-[#4B1835] text-white border-[#4B1835]"
              : "bg-white text-gray-400 border-gray-200"
          }`}
        >
          4. Advance &amp; Confirm
        </div>
      </div>

      {/* STEP 1: Customer Selection */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-[#EFE9DD] p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-sm text-[#4B1835]">
            <UserCheck className="w-5 h-5 text-[#B89558]" />
            <span>Select or Enter Customer Details</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Choose Existing Client
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold text-gray-800"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.phone} ({c.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Phone (WhatsApp) *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  City / Town *
                </label>
                <input
                  type="text"
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#EFE9DD] flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="bg-[#4B1835] hover:bg-[#320F23] text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              Continue to Event Dates →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Event Details & Rental Dates */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-[#EFE9DD] p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-sm text-[#4B1835]">
            <Calendar className="w-5 h-5 text-[#B89558]" />
            <span>Event Details &amp; Rental Dates</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Event Occasion / Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Wedding Barat / Sangeet Night"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Event Date *
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-semibold"
              />
            </div>
          </div>

          <div className="p-4 bg-[#FAF5EB] rounded-xl border border-[#E8DFD1] space-y-3">
            <div className="font-bold text-gray-900">
              Rental Handover Period (Asia/Kolkata Business Calendar)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[#8C6F3B] uppercase mb-1">
                  Pickup / Handover Date *
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full p-2 bg-white border border-[#E8DFD1] rounded-lg font-bold text-[#4B1835]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#8C6F3B] uppercase mb-1">
                  Return Due Date (Before 7:00 PM) *
                </label>
                <input
                  type="date"
                  value={returnDueDate}
                  onChange={(e) => setReturnDueDate(e.target.value)}
                  className="w-full p-2 bg-white border border-[#E8DFD1] rounded-lg font-bold text-[#4B1835]"
                />
              </div>
            </div>
            <p className="text-[11px] text-gray-500">
              Note: System automatically enforces a 24-hour cleaning and quality inspection buffer before releasing garments to next customers.
            </p>
          </div>

          <div className="pt-4 border-t border-[#EFE9DD] flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="bg-[#4B1835] hover:bg-[#320F23] text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              Select Garment Inventory →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Garment Selection with Conflict Checking */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-[#EFE9DD] p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-[#4B1835]">
              <Shirt className="w-5 h-5 text-[#B89558]" />
              <span>Select Garments for Booking ({selectedGarmentIds.length} Selected)</span>
            </div>
            <span className="text-[11px] text-gray-500">
              Dates: <strong>{pickupDate}</strong> to <strong>{returnDueDate}</strong>
            </span>
          </div>

          {/* Conflict Banner if encountered */}
          {conflictError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{conflictError}</span>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto space-y-2 pr-1 divide-y divide-[#F1ECE3]">
            {allGarments.map((g) => {
              const isSelected = selectedGarmentIds.includes(g.id);
              const conflict = DataStore.checkConflict(g.id, pickupDate, returnDueDate);

              return (
                <div
                  key={g.id}
                  onClick={() => toggleGarmentSelection(g.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#FAF5EB] border-[#B89558] shadow-xs"
                      : conflict.hasConflict
                      ? "bg-gray-50/60 border-gray-200 opacity-60 cursor-not-allowed"
                      : "bg-[#FBF9F5] border-[#E8DFD1] hover:border-[#B89558]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                        isSelected
                          ? "bg-[#4B1835] border-[#4B1835] text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#D4B67F]" />}
                    </div>

                    <img
                      src={g.image}
                      alt={g.productName}
                      className="w-12 h-12 rounded-lg object-cover border border-[#EFE9DD]"
                    />

                    <div>
                      <div className="font-bold text-gray-900 flex items-center gap-2">
                        <span className="font-mono text-[#4B1835]">{g.id}</span>
                        <span>{g.productName}</span>
                        <span className="bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded text-[10px]">
                          {g.size}
                        </span>
                      </div>
                      <div className="text-gray-500 text-[11px] mt-0.5">
                        {g.category} • Rack: {g.storageLocation}
                      </div>
                      {conflict.hasConflict && (
                        <div className="text-[10px] text-rose-600 font-bold mt-1">
                          Conflict: Already reserved/rented for overlapping dates
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-gray-900 text-xs">
                      {formatINR(g.rentalPrice)}
                    </div>
                    <div className="text-[10px] text-[#B89558] font-semibold">
                      Dep: {formatINR(g.securityDeposit)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-[#EFE9DD] flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700"
            >
              ← Back
            </button>
            <button
              disabled={selectedGarmentIds.length === 0}
              onClick={() => setStep(4)}
              className={`font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors ${
                selectedGarmentIds.length > 0
                  ? "bg-[#4B1835] hover:bg-[#320F23] text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Continue to Billing Calculation →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Financial Calculation & Settlement */}
      {step === 4 && (
        <div className="bg-white rounded-2xl border border-[#EFE9DD] p-6 shadow-xs space-y-5 text-xs">
          <div className="flex items-center gap-2 font-bold text-sm text-[#4B1835]">
            <Wallet className="w-5 h-5 text-[#B89558]" />
            <span>Financial Segregation &amp; Advance Confirmation</span>
          </div>

          {/* Breakdown Card */}
          <div className="p-4 bg-[#FAF5EB] rounded-xl border border-[#E8DFD1] space-y-3">
            <div className="font-bold text-gray-900 uppercase text-[11px] tracking-wider">
              Selected Garment Items ({selectedGarments.length})
            </div>
            <div className="space-y-1 divide-y divide-[#E8DFD1]">
              {selectedGarments.map((g) => (
                <div key={g.id} className="pt-1.5 flex justify-between">
                  <span>
                    <strong>{g.id}</strong> — {g.productName} ({g.size})
                  </span>
                  <span>
                    Rental: {formatINR(g.rentalPrice)} | Dep: {formatINR(g.securityDeposit)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t-2 border-[#E8DFD1] grid grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-lg border border-[#E8DFD1]">
                <div className="text-[10px] text-gray-500 font-bold uppercase">
                  Rental Service Total (Revenue)
                </div>
                <div className="text-lg font-bold text-gray-900 mt-1">
                  {formatINR(rentalTotal)}
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#B89558]">
                <div className="text-[10px] text-[#8C6F3B] font-bold uppercase">
                  Refundable Security Deposit (Liability)
                </div>
                <div className="text-lg font-bold text-[#B89558] mt-1">
                  {formatINR(securityDepositTotal)}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Refundable at return inspection
                </div>
              </div>
            </div>
          </div>

          {/* Payment inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Advance Payment Received Now (₹) *
              </label>
              <input
                type="number"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(Number(e.target.value) || 0)}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold text-gray-900 text-sm"
              />
              <div className="text-[11px] text-gray-500 mt-1">
                Remaining Rental Balance at Pickup: <strong>{formatINR(remainingRentalDue)}</strong>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Payment Mode *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold text-gray-800"
              >
                <option value="UPI">UPI (PhonePe / GPay / Paytm)</option>
                <option value="CASH">Cash in Drawer</option>
                <option value="CARD">Debit / Credit Card</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
              Internal Booking Notes / Fitting Alterations
            </label>
            <input
              type="text"
              placeholder="e.g. Blouse alteration required by Master Salim on 18 Nov morning"
              value={bookingNotes}
              onChange={(e) => setBookingNotes(e.target.value)}
              className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl"
            />
          </div>

          <div className="pt-4 border-t border-[#EFE9DD] flex justify-between">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmitBooking}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-8 py-3 rounded-xl shadow-md transition-colors flex items-center gap-2 text-xs"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-200" />
              <span>Confirm &amp; Generate Booking Invoice</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
