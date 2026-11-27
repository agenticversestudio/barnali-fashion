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
import { EmptyState } from "@/components/ui/EmptyState";

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

  /** Display-only trust tier from order count (no stored field, nothing sent to the server). */
  const trustBadge = (n: number) =>
    n >= 5
      ? { label: "Loyal client", cls: "bg-plum/10 text-plum border-plum/20", icon: ShieldCheck }
      : n >= 2
        ? { label: "Returning", cls: "bg-gold-soft text-gold-dark border-gold/40", icon: CheckCircle2 }
        : n === 1
          ? { label: "First order", cls: "bg-white text-ink-soft border-line", icon: CheckCircle2 }
          : { label: "New contact", cls: "bg-white text-mute border-line", icon: Users };

  const initials = (n: string) =>
    n
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("");

  return (
    <div className="space-y-5 md:space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Client book</span>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h1 className="page-title text-2xl md:text-3xl">Customer Directory</h1>
            <span className="num text-[11px] font-semibold bg-plum/10 text-plum px-2.5 py-0.5 rounded-full">
              {customers.length} client{customers.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-xs text-mute mt-1.5">Rental profiles, contact details and security deposit ledgers.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 min-h-11 bg-plum hover:bg-plum-dark text-white text-sm font-semibold rounded-xl shadow-[0_1px_2px_rgba(75,24,53,0.3)] transition-colors shrink-0"
        >
          <Plus className="w-4 h-4 text-gold" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="surface p-3 md:p-4">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, 10-digit mobile number, or address..."
            className="w-full pl-9 pr-10 min-h-11 bg-ivory border border-line rounded-xl text-xs font-medium text-ink placeholder-stone-400 focus:outline-none focus:border-plum"
          />
          <Search className="w-4 h-4 text-mute absolute left-3 top-3.5" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
              className="absolute right-1 top-1 w-9 h-9 flex items-center justify-center text-mute hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Customer Grid */}
      {loading ? (
        <div className="surface p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-plum mx-auto mb-2" />
          <div className="text-xs text-mute">Loading customer records...</div>
        </div>
      ) : customers.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={Users}
            title="No customers found"
            hint="Try a different mobile number or name, or add a new customer directly."
            action={
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-4 min-h-10 bg-plum text-white rounded-lg text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5 text-gold" />
                Add New Customer
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {customers.map((c) => {
            const cleanPhone = getCleanPhone(c.phone);
            const trust = trustBadge(c.totalBookings);
            const TrustIcon = trust.icon;
            return (
              <article key={c.id} className="surface surface-interactive p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-plum text-gold-light flex items-center justify-center font-display font-semibold text-sm ring-1 ring-gold/40 shrink-0">
                    {initials(c.name) || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="num text-[10px] text-mute font-semibold">{c.id}</span>
                    <h3 className="font-display font-semibold text-base text-ink leading-tight truncate">{c.name}</h3>
                    <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${trust.cls}`}>
                      <TrustIcon className="w-3 h-3" />
                      {trust.label}
                    </span>
                  </div>
                  {c.activeRentals > 0 && (
                    <span className="num text-[10px] bg-sky-50 text-sky-900 border border-sky-200 px-2 py-0.5 rounded-full font-semibold shrink-0">
                      {c.activeRentals} active
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-ink-soft">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-mute shrink-0" />
                    <a href={`tel:${cleanPhone}`} className="num font-semibold hover:text-plum inline-flex items-center min-h-6">
                      +91 {cleanPhone}
                    </a>
                  </div>
                  {c.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-mute shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        {c.address}, {c.city}
                      </span>
                    </div>
                  )}
                </div>

                {/* Deposit ledger strip */}
                <div className="grid grid-cols-3 gap-2 bg-ivory border border-line-soft rounded-xl p-2.5 text-center">
                  <div>
                    <span className="eyebrow-mute block">Orders</span>
                    <span className="num font-display font-semibold text-lg text-ink leading-tight">{c.totalBookings}</span>
                  </div>
                  <div>
                    <span className="eyebrow-mute block">Deposit held</span>
                    <span className={`num font-display font-semibold text-lg leading-tight ${c.depositsHeld > 0 ? "text-amber-800" : "text-ink"}`}>
                      {formatINR(c.depositsHeld)}
                    </span>
                  </div>
                  <div>
                    <span className="eyebrow-mute block">Spent</span>
                    <span className="num font-display font-semibold text-lg text-ink leading-tight">
                      {isAdmin && c.totalSpent !== undefined ? formatINR(c.totalSpent) : "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  <a
                    href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                      `Namaste ${c.name} ji, Barnali Fashion Bargarh se aapka swagat hai.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition-colors flex items-center justify-center shrink-0"
                    title="Open WhatsApp chat"
                    aria-label={`WhatsApp ${c.name}`}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => setSelectedCustomer(c)}
                    className="flex-1 min-h-10 bg-white hover:bg-ivory-deep border border-line text-ink-soft text-center font-semibold rounded-xl text-xs transition-colors"
                  >
                    View Profile
                  </button>

                  <Link
                    href={`/erp/bookings/new?customerId=${c.id}&name=${encodeURIComponent(c.name)}&phone=${cleanPhone}`}
                    className="flex-1 min-h-10 inline-flex items-center justify-center bg-plum hover:bg-plum-dark text-white text-center font-semibold rounded-xl text-xs transition-colors"
                  >
                    New Booking
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Customer Detail Bottom Sheet / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-line shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line-soft">
              <div>
                <span className="num text-xs text-plum font-bold">
                  {selectedCustomer.id}
                </span>
                <h3 className="font-display font-semibold text-lg text-stone-900">
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
                    className="num font-bold text-plum"
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
                  <span className="num text-stone-700">
                    {formatDate(selectedCustomer.createdAt)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl">
                  <span className="text-[10px] text-amber-800 font-bold uppercase">
                    Security Deposit Held
                  </span>
                  <div className="num font-bold text-base text-amber-950 mt-0.5">
                    {formatINR(selectedCustomer.depositsHeld)}
                  </div>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <span className="text-[10px] text-stone-500 font-bold uppercase">
                    Total Bookings
                  </span>
                  <div className="num font-bold text-base text-stone-800 mt-0.5">
                    {selectedCustomer.totalBookings}
                  </div>
                </div>
              </div>

              {selectedCustomer.notes && (
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Customer Notes</span>
                  <p className="text-stone-700 mt-0.5 bg-ivory p-2.5 rounded-xl border border-stone-200/60">
                    {selectedCustomer.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-line-soft">
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
                className="flex-1 py-2.5 bg-plum hover:bg-plum-dark text-white font-semibold rounded-xl text-center text-xs"
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-line shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line-soft">
              <div>
                <h3 className="font-display font-semibold text-stone-900 text-base">Register New Customer</h3>
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
                  className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum font-medium text-stone-800"
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
                    className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum num font-semibold text-stone-800"
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
                    className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum num text-stone-800"
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
                  className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum font-medium"
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
                    className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum font-medium"
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
                    className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum font-medium num"
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
                  className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum font-medium"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-line-soft">
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
                  className="flex-1 py-2.5 bg-plum hover:bg-plum-dark text-white rounded-xl font-semibold shadow-xs flex items-center justify-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gold-light" />
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
