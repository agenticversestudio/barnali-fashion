"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Search,
  Loader2,
  MapPin,
  Clock,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { bookingsApi, customersApi, garmentsApi } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import type { CustomerDto, GarmentDto, QuoteResponse, PayMode, ConflictInfo } from "@/types/api";

function NewBookingWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Wizard Step: 1 = Customer, 2 = Dates & Event, 3 = Garments, 4 = Financial Quote, 5 = Confirmation
  const [step, setStep] = useState<number>(1);

  // Data
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [garments, setGarments] = useState<GarmentDto[]>([]);
  const [garmentSearch, setGarmentSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  // Customer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("Bargarh");

  // Dates & Event State (Default: Pickup tomorrow, event in 2 days, return in 4 days)
  const [eventName, setEventName] = useState("Wedding Reception");
  const [eventDate, setEventDate] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDueDate, setReturnDueDate] = useState("");
  const [today, setToday] = useState("");

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const inTwoDays = new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0];
    const inFourDays = new Date(Date.now() + 86400000 * 4).toISOString().split("T")[0];
    setToday(todayStr);
    setPickupDate(tomorrow);
    setEventDate(inTwoDays);
    setReturnDueDate(inFourDays);
  }, []);

  // Garments & Line Items
  const [selectedGarmentIds, setSelectedGarmentIds] = useState<string[]>([]);

  // Charges & Payments
  const [dryCleanCharge, setDryCleanCharge] = useState<number>(0);
  const [transitCharge, setTransitCharge] = useState<number>(0);
  const [advanceAmount, setAdvanceAmount] = useState<number>(2000);
  const [paymentMode, setPaymentMode] = useState<PayMode>("UPI");
  const [bookingNotes, setBookingNotes] = useState("");

  // Server Quote & Conflicts
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pre-fill from query params if available
  useEffect(() => {
    const qSku = searchParams.get("sku");
    const qCustId = searchParams.get("customerId");
    const qName = searchParams.get("name");
    const qPhone = searchParams.get("phone");

    if (qSku) {
      setSelectedGarmentIds([qSku]);
    }
    if (qCustId) {
      setSelectedCustomerId(qCustId);
    }
    if (qName) {
      setCustomerName(qName);
    }
    if (qPhone) {
      setCustomerPhone(qPhone);
      setCustomerWhatsapp(qPhone);
    }

    // Load available garments and customers
    garmentsApi.list({ limit: 100 }).then((res) => setGarments(res.items || []));
    customersApi.list().then((res) => setCustomers(res.items || []));
  }, [searchParams]);

  // Handle selecting an existing customer
  const handleSelectCustomer = (c: CustomerDto) => {
    setSelectedCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setCustomerWhatsapp(c.whatsapp || c.phone);
    setCustomerAddress(c.address || "");
    setCustomerCity(c.city || "Bargarh");
  };

  // Toggle Garment Selection
  const toggleGarment = (id: string) => {
    if (selectedGarmentIds.includes(id)) {
      setSelectedGarmentIds(selectedGarmentIds.filter((gId) => gId !== id));
    } else {
      setSelectedGarmentIds([...selectedGarmentIds, id]);
    }
  };

  // Fetch Live Server Quote whenever garments, dates or charges change
  const fetchQuote = useCallback(async () => {
    if (selectedGarmentIds.length === 0 || !pickupDate || !returnDueDate) {
      setQuote(null);
      setConflicts([]);
      return;
    }

    setQuoting(true);
    try {
      const q = await bookingsApi.quote({
        garmentIds: selectedGarmentIds,
        pickupDate,
        returnDueDate,
        dryCleanCharge: Number(dryCleanCharge) || 0,
        transitCharge: Number(transitCharge) || 0,
        advance: Number(advanceAmount) || 0,
      });
      setQuote(q);
      setConflicts(q.conflicts || []);
    } catch (err) {
      console.error("Quote calculation error:", err);
    } finally {
      setQuoting(false);
    }
  }, [selectedGarmentIds, pickupDate, returnDueDate, dryCleanCharge, transitCharge, advanceAmount]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  // Submit Booking to Live Database
  const handleSubmitBooking = async () => {
    if (selectedGarmentIds.length === 0) {
      alert("Please select at least one costume.");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Customer Name and Phone number are required.");
      return;
    }
    if (conflicts.length > 0) {
      alert("Cannot create booking due to scheduling conflict. Please resolve conflicting dates or garments.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await bookingsApi.create({
        customer: {
          id: selectedCustomerId || undefined,
          name: customerName.trim(),
          phone: customerPhone.trim(),
          whatsapp: customerWhatsapp.trim() || customerPhone.trim(),
          address: customerAddress.trim() || undefined,
          city: customerCity.trim() || "Bargarh",
        },
        eventName: eventName.trim() || "Rental Booking",
        eventDate,
        pickupDate,
        returnDueDate,
        garmentIds: selectedGarmentIds,
        dryCleanCharge: Number(dryCleanCharge) || 0,
        transitCharge: Number(transitCharge) || 0,
        advance: {
          amount: Number(advanceAmount) || 0,
          mode: paymentMode,
        },
        notes: bookingNotes.trim() || undefined,
      });

      setCreatedBookingId(res.id);
      setStep(5);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to create booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCostumes = garments.filter((g) => selectedGarmentIds.includes(g.id));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#E8DFD1] shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/erp/bookings"
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors min-h-10"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-serif font-bold text-lg md:text-xl text-stone-900">
              5-Step Counter Booking Wizard
            </h1>
            <p className="text-xs text-stone-500">
              Transactional booking with automated quote and double-booking conflict check.
            </p>
          </div>
        </div>

        {step < 5 && (
          <div className="text-xs font-semibold text-[#4B1835] bg-[#4B1835]/10 px-3 py-1.5 rounded-full font-mono">
            Step {step} of 4
          </div>
        )}
      </div>

      {/* Wizard Progress Steps Indicator */}
      {step < 5 && (
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {[
            { s: 1, title: "1. Customer", icon: UserCheck },
            { s: 2, title: "2. Dates", icon: Calendar },
            { s: 3, title: "3. Costumes", icon: Shirt },
            { s: 4, title: "4. Quote", icon: Wallet },
          ].map((item) => {
            const Icon = item.icon;
            const isDone = step > item.s;
            const isCurrent = step === item.s;
            return (
              <button
                key={item.s}
                onClick={() => setStep(item.s)}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-colors ${
                  isCurrent
                    ? "bg-[#4B1835] text-white border-[#4B1835] font-bold shadow-xs"
                    : isDone
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold"
                    : "bg-white text-stone-500 border-stone-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{item.title}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Conflicts Alert Banner */}
      {conflicts.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Schedule Conflict Detected (Double-Booking Prevented)</span>
          </div>
          <div className="space-y-1">
            {conflicts.map((c, i) => (
              <div key={i} className="pl-6 text-[11px]">
                • <strong className="font-mono">{c.garmentId}</strong> ({c.garmentName || "Costume"}) is already reserved by booking{" "}
                <strong className="font-mono">{c.heldBy}</strong> for{" "}
                <span className="font-semibold">{c.from} to {c.to}</span>.
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 1: Customer Details */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-[#E8DFD1] p-6 shadow-2xs space-y-5">
          <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-stone-900 text-sm">Step 1: Client Information</h2>
              <p className="text-xs text-stone-500">Search existing customer or enter new profile</p>
            </div>
          </div>

          {/* Quick Search Existing Customers */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-stone-600 uppercase">
              Quick Search Existing Customers
            </label>
            <div className="relative">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Type name or phone number..."
                className="w-full pl-9 pr-4 py-2 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl text-xs"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            </div>

            {customerSearch && (
              <div className="max-h-40 overflow-y-auto divide-y divide-stone-100 border border-stone-200 rounded-xl bg-white shadow-lg">
                {customers
                  .filter(
                    (c) =>
                      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                      c.phone.includes(customerSearch)
                  )
                  .map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        handleSelectCustomer(c);
                        setCustomerSearch("");
                      }}
                      className="p-2.5 hover:bg-stone-50 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-800">{c.name}</span>
                        <span className="text-[11px] text-stone-500 ml-2 font-mono">+91 {c.phone}</span>
                      </div>
                      <span className="text-[10px] bg-stone-100 px-2 py-0.5 rounded text-stone-600">
                        Select
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Smt. Sunita Sahu"
                className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Phone Number (10 digits) *
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => {
                  setCustomerPhone(e.target.value);
                  if (!customerWhatsapp) setCustomerWhatsapp(e.target.value);
                }}
                placeholder="9876543210"
                maxLength={10}
                className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                WhatsApp Number
              </label>
              <input
                type="tel"
                value={customerWhatsapp}
                onChange={(e) => setCustomerWhatsapp(e.target.value)}
                placeholder="9876543210"
                maxLength={10}
                className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Town / City
              </label>
              <input
                type="text"
                value={customerCity}
                onChange={(e) => setCustomerCity(e.target.value)}
                placeholder="Bargarh"
                className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Local Address / Landmark
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="e.g. Near Bhatli Chowk, Ward 4"
                className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              onClick={() => {
                if (!customerName.trim() || !customerPhone.trim()) {
                  alert("Customer Name and Phone are required.");
                  return;
                }
                setStep(2);
              }}
              className="px-6 py-2.5 bg-[#4B1835] text-white font-semibold rounded-xl text-xs shadow-xs hover:bg-[#521624]"
            >
              Next: Event &amp; Dates &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Event & Dates */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-[#E8DFD1] p-6 shadow-2xs space-y-5">
          <div className="border-b border-stone-100 pb-3">
            <h2 className="font-bold text-stone-900 text-sm">Step 2: Event &amp; Rental Schedule</h2>
            <p className="text-xs text-stone-500">Pick-up, wedding/function date, and expected return deadline</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Event / Occasion Name
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Sangeet & Reception, Bridal Photoshoot"
                className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Event Date *
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-mono font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Store Pickup Date *
              </label>
              <input
                type="date"
                value={pickupDate}
                min={today}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-mono font-semibold text-[#4B1835]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Return Due Date *
              </label>
              <input
                type="date"
                value={returnDueDate}
                min={pickupDate}
                onChange={(e) => setReturnDueDate(e.target.value)}
                className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-mono font-semibold text-rose-800"
                required
              />
            </div>
          </div>

          <div className="flex justify-between pt-3">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold"
            >
              &larr; Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2.5 bg-[#4B1835] text-white font-semibold rounded-xl text-xs shadow-xs hover:bg-[#521624]"
            >
              Next: Select Costumes &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Costume Selection */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-[#E8DFD1] p-6 shadow-2xs space-y-5">
          <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-stone-900 text-sm">Step 3: Select Rental Pieces</h2>
              <p className="text-xs text-stone-500">Pick costumes from inventory for these dates</p>
            </div>
            <div className="text-xs font-mono font-bold text-[#4B1835]">
              {selectedGarmentIds.length} Selected
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={garmentSearch}
              onChange={(e) => setGarmentSearch(e.target.value)}
              placeholder="Filter costumes by SKU, name, or category..."
              className="w-full pl-9 pr-4 py-2 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl text-xs"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          </div>

          {/* Garments Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-1">
            {garments
              .filter(
                (g) =>
                  g.name.toLowerCase().includes(garmentSearch.toLowerCase()) ||
                  g.id.toLowerCase().includes(garmentSearch.toLowerCase()) ||
                  g.category.toLowerCase().includes(garmentSearch.toLowerCase())
              )
              .map((g) => {
                const isSelected = selectedGarmentIds.includes(g.id);
                return (
                  <div
                    key={g.id}
                    onClick={() => toggleGarment(g.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? "bg-[#4B1835]/5 border-[#4B1835] shadow-xs ring-1 ring-[#4B1835]"
                        : "bg-white border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-1 h-4 w-4 text-[#4B1835] rounded border-stone-300 pointer-events-none"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-[#4B1835]">{g.id}</span>
                        <span className="text-[10px] text-stone-400">{g.rack}</span>
                      </div>
                      <div className="font-bold text-xs text-stone-900 truncate mt-0.5">{g.name}</div>
                      <div className="text-[11px] text-stone-500 mt-1">
                        Rent: <span className="font-mono font-bold text-stone-800">{formatINR(g.rentalPrice)}</span> · Dep: {formatINR(g.securityDeposit)}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="flex justify-between pt-3 border-t border-stone-100">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold"
            >
              &larr; Back
            </button>
            <button
              onClick={() => {
                if (selectedGarmentIds.length === 0) {
                  alert("Please select at least one garment.");
                  return;
                }
                setStep(4);
              }}
              className="px-6 py-2.5 bg-[#4B1835] text-white font-semibold rounded-xl text-xs shadow-xs hover:bg-[#521624]"
            >
              Next: Financial Quote &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Financial Quote & Settlement */}
      {step === 4 && (
        <div className="bg-white rounded-2xl border border-[#E8DFD1] p-6 shadow-2xs space-y-5">
          <div className="border-b border-stone-100 pb-3">
            <h2 className="font-bold text-stone-900 text-sm">Step 4: Real-time Tariff &amp; Deposit Quote</h2>
            <p className="text-xs text-stone-500">Live computation from server-side pricing engine</p>
          </div>

          {/* Selected Items summary */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-stone-600 uppercase block">
              Selected Costumes ({selectedCostumes.length})
            </span>
            <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-stone-50/50">
              {selectedCostumes.map((g) => (
                <div key={g.id} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-[#4B1835] mr-2">{g.id}</span>
                    <span className="font-semibold text-stone-800">{g.name}</span>
                    <span className="text-stone-400 text-[11px] ml-2 font-mono">({g.rack})</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-stone-800">{formatINR(g.rentalPrice)}</span>
                    <span className="text-[10px] text-stone-500 block">Dep: {formatINR(g.securityDeposit)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Charges & Advance Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Dry Clean Charge (₹)
              </label>
              <input
                type="number"
                value={dryCleanCharge}
                onChange={(e) => setDryCleanCharge(Number(e.target.value) || 0)}
                className="w-full p-2 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-mono text-stone-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Transit / Delivery (₹)
              </label>
              <input
                type="number"
                value={transitCharge}
                onChange={(e) => setTransitCharge(Number(e.target.value) || 0)}
                className="w-full p-2 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-mono text-stone-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Advance Paid Now (₹) *
              </label>
              <input
                type="number"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(Number(e.target.value) || 0)}
                className="w-full p-2 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-mono font-bold text-[#4B1835]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Advance Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PayMode)}
                className="w-full p-2 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-medium"
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="CASH">Cash at Counter</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="BANK_TRANSFER">Bank Transfer / IMPS</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Booking Remarks / Fitting Notes
              </label>
              <input
                type="text"
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="e.g. Alter blouse waist by 1 inch"
                className="w-full p-2 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Live Quote Breakdown Card */}
          {quoting ? (
            <div className="p-4 bg-stone-50 rounded-xl text-center text-xs text-stone-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#4B1835]" />
              <span>Fetching server-side quote...</span>
            </div>
          ) : quote ? (
            <div className="p-4 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Rental Service Tariff:</span>
                <span className="font-mono font-semibold">{formatINR(quote.rentalTotal)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Refundable Security Deposit:</span>
                <span className="font-mono font-semibold">{formatINR(quote.depositTotal)}</span>
              </div>
              {quote.dryCleanCharge > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Dry Clean Charge:</span>
                  <span className="font-mono">{formatINR(quote.dryCleanCharge)}</span>
                </div>
              )}
              {quote.transitCharge > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Transit / Delivery:</span>
                  <span className="font-mono">{formatINR(quote.transitCharge)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-sm text-stone-900">
                <span>Grand Total:</span>
                <span className="font-mono text-[#4B1835]">{formatINR(quote.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-semibold pt-1">
                <span>Advance Receipt:</span>
                <span className="font-mono">− {formatINR(quote.advance)}</span>
              </div>
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between font-bold text-amber-950 mt-2">
                <span>Balance Due at Pickup:</span>
                <span className="font-mono text-sm">{formatINR(quote.balanceDue)}</span>
              </div>
            </div>
          ) : null}

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="flex justify-between pt-3 border-t border-stone-100">
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold"
            >
              &larr; Back
            </button>
            <button
              onClick={handleSubmitBooking}
              disabled={submitting || conflicts.length > 0}
              className="px-6 py-2.5 bg-[#4B1835] hover:bg-[#521624] disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4B67F]" />
                  <span>Locking in Turso DB...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm &amp; Create Booking</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Success & WhatsApp Slip */}
      {step === 5 && createdBookingId && (
        <div className="bg-white rounded-3xl border border-[#E8DFD1] p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-[#4B1835] uppercase tracking-wider">
              Booking Created Successfully
            </span>
            <h2 className="font-serif font-bold text-2xl text-stone-900">
              {createdBookingId}
            </h2>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Garments locked in database for dates {pickupDate} to {returnDueDate}. Advance of{" "}
              <strong>{formatINR(advanceAmount)}</strong> recorded in payment ledger.
            </p>
          </div>

          {/* Quick WhatsApp Share Button */}
          <div className="pt-2">
            <a
              href={`https://wa.me/91${customerPhone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                `*BARNALI FASHION — BOOKING CONFIRMATION*\n` +
                `Order ID: ${createdBookingId}\n` +
                `Client: ${customerName}\n` +
                `Pickup Date: ${pickupDate}\n` +
                `Return Due Date: ${returnDueDate}\n` +
                `-------------------------\n` +
                `Costumes: ${selectedCostumes.map((g) => `${g.name} (${g.id})`).join(", ")}\n` +
                `Grand Total: ₹${quote?.grandTotal || 0}\n` +
                `Advance Received: ₹${advanceAmount} (${paymentMode})\n` +
                `*Balance Due at Handover: ₹${quote?.balanceDue || 0}*\n` +
                `-------------------------\n` +
                `Terms: Security deposit is refundable upon undamaged return. Thank you!`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send WhatsApp Confirmation Slip</span>
            </a>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4 border-t border-stone-100">
            <Link
              href={`/erp/billing/invoices?orderId=${createdBookingId}`}
              className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs"
            >
              Print Receipt / Invoice
            </Link>
            <Link
              href="/erp/bookings"
              className="px-5 py-2.5 bg-[#4B1835] hover:bg-[#521624] text-white font-semibold rounded-xl text-xs shadow-xs"
            >
              Go to Orders List
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewBookingWizardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading booking wizard...</div>}>
      <NewBookingWizardContent />
    </Suspense>
  );
}
