"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  MapPin,
  Wallet,
  Calendar,
  X,
  History,
  ShieldCheck,
  ChevronRight,
  ClipboardList,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { customersApi } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";
import type { CustomerDto } from "@/types/api";
import { useAuth } from "@/context/AuthContext";

export default function CustomersPage() {
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected customer for Full Details Bottom Sheet / Modal
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDto | null>(null);

  // New Customer Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Bargarh");
  const [pincode, setPincode] = useState("768028");
  const [notes, setNotes] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customersApi.list(searchTerm.trim() || undefined);
      setCustomers(res.items || []);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadCustomers]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Name and Phone are mandatory");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await customersApi.createOrUpdate({
        name: name.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        address: address.trim() || undefined,
        city: city.trim() || "Bargarh",
        pincode: pincode.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setShowAddModal(false);
      setName("");
      setPhone("");
      setWhatsapp("");
      setAddress("");
      setNotes("");
      await loadCustomers();
    } catch (err: any) {
      setError(err?.message || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  const getCleanPhone = (p: string) => p.replace(/\D/g, "").slice(-10);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 md:p-6 rounded-2xl border border-[#E8DFD1] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif font-bold text-xl md:text-2xl text-stone-900 tracking-tight">
              Customer Directory
            </h1>
            <span className="text-xs font-mono font-semibold bg-[#4B1835]/10 text-[#4B1835] px-2.5 py-0.5 rounded-full">
              {customers.length} Clients
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Verified rental profiles, contact information, and security deposit ledgers.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#4B1835] hover:bg-[#521624] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-3 md:p-4 rounded-2xl border border-[#E8DFD1] shadow-2xs">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, 10-digit mobile number, or address..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl text-xs font-medium text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#4B1835]"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Customer Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E8DFD1] p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#4B1835] mx-auto mb-2" />
          <div className="text-xs text-stone-500">Loading customer records from Turso database...</div>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8DFD1] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
            <Users className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-stone-800">No customers found</div>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Try searching a different mobile number or add a new customer directly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => {
            const cleanPhone = getCleanPhone(c.phone);
            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-[#E8DFD1] p-4 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-stone-400 font-semibold">
                        {c.id}
                      </span>
                      <h3 className="font-serif font-bold text-base text-stone-900 leading-tight">
                        {c.name}
                      </h3>
                    </div>

                    {c.activeRentals > 0 && (
                      <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                        {c.activeRentals} Active Rental{c.activeRentals > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 mt-3 text-xs text-stone-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <a href={`tel:${cleanPhone}`} className="font-mono font-semibold hover:text-[#4B1835]">
                        +91 {cleanPhone}
                      </a>
                    </div>

                    {c.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">
                          {c.address}, {c.city}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metrics Footer */}
                <div className="pt-3 border-t border-stone-100 space-y-2.5">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-stone-50 p-2 rounded-xl">
                    <div>
                      <span className="text-[10px] text-stone-400 block">Orders</span>
                      <span className="font-bold text-stone-800 font-mono">{c.totalBookings}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-400 block">Deposit</span>
                      <span className="font-bold text-amber-900 font-mono">
                        {formatINR(c.depositsHeld)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-400 block">Spent</span>
                      <span className="font-bold text-stone-800 font-mono">
                        {isAdmin && c.totalSpent !== undefined ? formatINR(c.totalSpent) : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                        `Namaste ${c.name} ji, Barnali Fashion Bargarh se aapka swagat hai.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition-colors flex items-center justify-center shrink-0 min-h-10"
                      title="Open WhatsApp chat"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="flex-1 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-center font-semibold rounded-xl text-xs transition-colors"
                    >
                      View Profile
                    </button>

                    <Link
                      href={`/erp/bookings/new?customerId=${c.id}&name=${encodeURIComponent(
                        c.name
                      )}&phone=${cleanPhone}`}
                      className="flex-1 py-1.5 bg-[#4B1835] hover:bg-[#521624] text-white text-center font-semibold rounded-xl text-xs transition-colors min-h-10"
                    >
                      New Booking
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Detail Bottom Sheet / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E8DFD1] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="font-mono text-xs text-[#4B1835] font-bold">
                  {selectedCustomer.id}
                </span>
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  {selectedCustomer.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Phone:</span>
                  <a
                    href={`tel:${selectedCustomer.phone}`}
                    className="font-mono font-bold text-[#4B1835]"
                  >
                    +91 {getCleanPhone(selectedCustomer.phone)}
                  </a>
                </div>
                {selectedCustomer.address && (
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Address:</span>
                    <span className="font-medium text-stone-800">
                      {selectedCustomer.address}, {selectedCustomer.city} {selectedCustomer.pincode}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Member Since:</span>
                  <span className="font-mono text-stone-700">
                    {formatDate(selectedCustomer.createdAt)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl">
                  <span className="text-[10px] text-amber-800 font-bold uppercase">
                    Security Deposit Held
                  </span>
                  <div className="font-mono font-bold text-base text-amber-950 mt-0.5">
                    {formatINR(selectedCustomer.depositsHeld)}
                  </div>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <span className="text-[10px] text-stone-500 font-bold uppercase">
                    Total Bookings
                  </span>
                  <div className="font-mono font-bold text-base text-stone-800 mt-0.5">
                    {selectedCustomer.totalBookings}
                  </div>
                </div>
              </div>

              {selectedCustomer.notes && (
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Customer Notes</span>
                  <p className="text-stone-700 mt-0.5 bg-[#FBF8F2] p-2.5 rounded-xl border border-stone-200/60">
                    {selectedCustomer.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              <Link
                href={`/erp/bookings?q=${selectedCustomer.phone}`}
                onClick={() => setSelectedCustomer(null)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-xl text-center text-xs"
              >
                Booking History
              </Link>
              <Link
                href={`/erp/bookings/new?customerId=${selectedCustomer.id}&name=${encodeURIComponent(
                  selectedCustomer.name
                )}&phone=${getCleanPhone(selectedCustomer.phone)}`}
                onClick={() => setSelectedCustomer(null)}
                className="flex-1 py-2.5 bg-[#4B1835] hover:bg-[#521624] text-white font-semibold rounded-xl text-center text-xs"
              >
                Create Booking
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E8DFD1] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base">Register New Customer</h3>
                <p className="text-[11px] text-stone-500">Saves customer profile into live database</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Smt. Priyadarshini Meher"
                  className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-medium text-stone-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Phone Number (10-Digit) *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-mono font-semibold text-stone-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Same as phone"
                    maxLength={10}
                    className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-mono text-stone-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Local Address / Landmark
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Bhatli Chowk, Ward 4"
                  className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    City / Town
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    PIN Code
                  </label>
                  <input
                    type="text" inputMode="numeric" pattern="[0-9]*"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-medium font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Customer Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. VIP client, preferred size L"
                  className="w-full p-2.5 bg-[#FBF8F2] border border-[#E8DFD1] rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-[#4B1835] hover:bg-[#521624] text-white rounded-xl font-semibold shadow-xs flex items-center justify-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#D4B67F]" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Customer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
