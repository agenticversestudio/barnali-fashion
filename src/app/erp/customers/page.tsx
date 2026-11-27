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
  Grid,
  List,
} from "lucide-react";
import { customersApi } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";
import type { CustomerDto } from "@/types/api";
import { useAuth } from "@/context/AuthContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";

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

  // View mode: table or cards
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

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

  // Derived metrics for KPI Summary Row
  const totalActiveRentals = customers.reduce((acc, c) => acc + (c.activeRentals || 0), 0);
  const totalHeldDeposits = customers.reduce((acc, c) => acc + (c.depositsHeld || 0), 0);

  const closeAddModal = () => {
    setShowAddModal(false);
    setError(null);
    setName("");
    setPhone("");
    setWhatsapp("");
    setAddress("");
    setCity("Bargarh");
    setPincode("768028");
    setNotes("");
  };

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

      closeAddModal();
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
    <div className="space-y-6 animate-in fade-in">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="eyebrow text-gold">CLIENT BOOK</span>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h1 className="page-title text-2xl md:text-3xl text-ink">Customer Directory</h1>
            <span className="num text-[11px] font-semibold bg-gold-soft text-plum border border-line-strong px-3 py-0.5 rounded-full shadow-2xs">
              {customers.length} client{customers.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-xs text-ink-soft mt-1.5 max-w-xl">
            Client profiles, active costume rentals, verified contact channels, and security deposit ledgers.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 min-h-11 bg-plum hover:bg-plum-dark text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4 text-gold-soft" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* 2. KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <StatCard
          label="Total Clients"
          value={customers.length}
          hint="Registered boutique contacts"
          icon={Users}
          tone="gold"
        />
        <StatCard
          label="Active Rentals Out"
          value={totalActiveRentals}
          hint="Pieces currently with clients"
          icon={ClipboardList}
          tone="amber"
        />
        <StatCard
          label="Held Deposits Ledger"
          value={formatINR(totalHeldDeposits)}
          hint="Refundable security held"
          icon={Wallet}
          tone="plum"
        />
      </div>

      {/* 3. Unified Listing Container */}
      <div className="bg-white rounded-2xl border border-line shadow-2xs overflow-hidden">
        {/* Search & View Controls */}
        <div className="p-3.5 md:p-4 border-b border-line bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, 10-digit mobile number, or address..."
              className="w-full pl-9 pr-10 min-h-10 bg-ivory border border-line rounded-xl text-xs font-medium text-ink placeholder-mute focus:outline-none focus:border-plum focus:ring-2 focus:ring-plum/15 transition-all"
            />
            <Search className="w-4 h-4 text-mute absolute left-3 top-3" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                className="absolute right-0 top-0 w-10 h-10 flex items-center justify-center text-mute hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-mute hidden sm:inline">View:</span>
            <div className="flex items-center p-0.5 bg-ivory border border-line rounded-xl">
              <button
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                title="Grid view"
                className={`flex items-center gap-1.5 px-3 min-h-10 rounded-lg text-xs font-medium transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-plum font-semibold shadow-2xs border border-line"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                aria-pressed={viewMode === "table"}
                title="Table view"
                className={`flex items-center gap-1.5 px-3 min-h-10 rounded-lg text-xs font-medium transition-all ${
                  viewMode === "table"
                    ? "bg-white text-plum font-semibold shadow-2xs border border-line"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-12 text-center bg-white">
            <Loader2 className="w-6 h-6 animate-spin text-plum mx-auto mb-2" />
            <div className="text-xs text-ink-soft">Loading customer records...</div>
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            hint="Try searching a different mobile number or customer name, or register a new customer profile."
            action={
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-4 min-h-10 bg-plum hover:bg-plum-dark text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-gold-soft" />
                Add New Customer
              </button>
            }
          />
        ) : viewMode === "table" ? (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-ivory-deep border-b border-line text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  <th className="py-3 px-4">Client ID &amp; Name</th>
                  <th className="py-3 px-4">Trust Level</th>
                  <th className="py-3 px-4">Phone / WhatsApp</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4 text-center">Orders</th>
                  <th className="py-3 px-4 text-right">Deposit Held</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft text-xs">
                {customers.map((c) => {
                  const cleanPhone = getCleanPhone(c.phone);
                  const trust = trustBadge(c.totalBookings);
                  const TrustIcon = trust.icon;
                  return (
                    <tr key={c.id} className="hover:bg-ivory transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-plum text-gold-soft flex items-center justify-center font-display font-semibold text-xs shrink-0 shadow-2xs">
                            {initials(c.name) || "?"}
                          </div>
                          <div>
                            <span className="num text-[10px] text-mute font-semibold block">{c.id}</span>
                            <span className="font-semibold text-ink">{c.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${trust.cls}`}>
                          <TrustIcon className="w-3 h-3" />
                          {trust.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <a href={`tel:${cleanPhone}`} className="num font-semibold text-ink hover:text-plum">
                            +91 {cleanPhone}
                          </a>
                          <a
                            href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                              `Namaste ${c.name} ji, Barnali Fashion Bargarh se aapka swagat hai.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px] truncate text-ink-soft">
                        {c.address ? `${c.address}, ${c.city}` : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="num font-semibold text-ink">{c.totalBookings}</span>
                        {c.activeRentals > 0 && (
                          <span className="num ml-1.5 text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded-full font-semibold">
                            {c.activeRentals} active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className={`num font-semibold text-sm ${c.depositsHeld > 0 ? "text-amber-800" : "text-ink"}`}>
                          {formatINR(c.depositsHeld)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedCustomer(c)}
                            className="px-2.5 min-h-10 rounded-lg border border-line bg-white hover:bg-ivory-deep text-ink-soft text-xs font-semibold transition-colors"
                          >
                            Profile
                          </button>
                          <Link
                            href={`/erp/bookings/new?customerId=${c.id}&name=${encodeURIComponent(c.name)}&phone=${cleanPhone}`}
                            className="px-3 min-h-10 rounded-lg bg-plum hover:bg-plum-dark text-white text-xs font-semibold inline-flex items-center shadow-2xs transition-colors"
                          >
                            New Order
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Cards Grid View */
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 bg-ivory">
            {customers.map((c) => {
              const cleanPhone = getCleanPhone(c.phone);
              const trust = trustBadge(c.totalBookings);
              const TrustIcon = trust.icon;
              return (
                <article key={c.id} className="surface surface-interactive p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-plum text-gold-soft flex items-center justify-center font-display font-semibold text-sm ring-1 ring-gold/40 shrink-0 shadow-2xs">
                      {initials(c.name) || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="num text-[10px] text-mute font-semibold">{c.id}</span>
                      <h3 className="font-display font-semibold text-base text-ink leading-tight truncate">{c.name}</h3>
                      <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${trust.cls}`}>
                        <TrustIcon className="w-3 h-3" />
                        {trust.label}
                      </span>
                    </div>
                    {c.activeRentals > 0 && (
                      <span className="num text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-semibold shrink-0">
                        {c.activeRentals} active
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-ink-soft">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-mute shrink-0" />
                      <a href={`tel:${cleanPhone}`} className="num font-semibold text-ink hover:text-plum inline-flex items-center min-h-10">
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
                  <div className="grid grid-cols-3 gap-2 bg-ivory border border-line rounded-xl p-2.5 text-center">
                    <div>
                      <span className="eyebrow-mute block text-[9.5px]">Orders</span>
                      <span className="num font-display font-semibold text-lg text-ink leading-tight">{c.totalBookings}</span>
                    </div>
                    <div>
                      <span className="eyebrow-mute block text-[9.5px]">Deposit held</span>
                      <span className={`num font-display font-semibold text-lg leading-tight ${c.depositsHeld > 0 ? "text-amber-800" : "text-ink"}`}>
                        {formatINR(c.depositsHeld)}
                      </span>
                    </div>
                    <div>
                      <span className="eyebrow-mute block text-[9.5px]">Spent</span>
                      <span className="num font-display font-semibold text-lg text-ink leading-tight">
                        {isAdmin && c.totalSpent !== undefined ? formatINR(c.totalSpent) : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-auto pt-1">
                    <a
                      href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                        `Namaste ${c.name} ji, Barnali Fashion Bargarh se aapka swagat hai.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition-colors flex items-center justify-center shrink-0 shadow-2xs"
                      title="Open WhatsApp chat"
                      aria-label={`WhatsApp ${c.name}`}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="flex-1 min-h-10 bg-white hover:bg-ivory-deep border border-line text-ink-soft text-center font-semibold rounded-xl text-xs transition-colors shadow-2xs"
                    >
                      View Profile
                    </button>

                    <Link
                      href={`/erp/bookings/new?customerId=${c.id}&name=${encodeURIComponent(c.name)}&phone=${cleanPhone}`}
                      className="flex-1 min-h-10 inline-flex items-center justify-center bg-plum hover:bg-plum-dark text-white text-center font-semibold rounded-xl text-xs transition-colors shadow-2xs"
                    >
                      New Booking
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Detail Bottom Sheet / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-line shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div>
                <span className="num text-xs text-plum font-bold">
                  {selectedCustomer.id}
                </span>
                <h3 className="font-display font-semibold text-lg text-ink">
                  {selectedCustomer.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-10 h-10 -mr-2 rounded-lg flex items-center justify-center text-mute hover:text-ink hover:bg-ivory-deep"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-ivory rounded-xl border border-line space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-ink-soft">Phone:</span>
                  <a
                    href={`tel:${selectedCustomer.phone}`}
                    className="num font-bold text-plum"
                  >
                    +91 {getCleanPhone(selectedCustomer.phone)}
                  </a>
                </div>
                {selectedCustomer.address && (
                  <div className="flex items-center justify-between">
                    <span className="text-ink-soft">Address:</span>
                    <span className="font-medium text-ink">
                      {selectedCustomer.address}, {selectedCustomer.city} {selectedCustomer.pincode}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-ink-soft">Member Since:</span>
                  <span className="num text-ink">
                    {formatDate(selectedCustomer.createdAt)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-amber-100/60 border border-amber-200 rounded-xl">
                  <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">
                    Security Deposit Held
                  </span>
                  <div className="num font-bold text-base text-amber-800 mt-0.5">
                    {formatINR(selectedCustomer.depositsHeld)}
                  </div>
                </div>

                <div className="p-3 bg-ivory border border-line rounded-xl">
                  <span className="text-[10px] text-ink-soft font-bold uppercase tracking-wider">
                    Total Bookings
                  </span>
                  <div className="num font-bold text-base text-ink mt-0.5">
                    {selectedCustomer.totalBookings}
                  </div>
                </div>
              </div>

              {selectedCustomer.notes && (
                <div>
                  <span className="text-[10px] font-bold text-mute uppercase tracking-wider">Customer Notes</span>
                  <p className="text-ink mt-1 bg-ivory p-2.5 rounded-xl border border-line">
                    {selectedCustomer.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-line">
              <Link
                href={`/erp/bookings?q=${selectedCustomer.phone}`}
                onClick={() => setSelectedCustomer(null)}
                className="flex-1 py-2.5 bg-ivory hover:bg-ivory-deep text-ink-soft border border-line font-semibold rounded-xl text-center text-xs transition-colors"
              >
                Booking History
              </Link>
              <Link
                href={`/erp/bookings/new?customerId=${selectedCustomer.id}&name=${encodeURIComponent(
                  selectedCustomer.name
                )}&phone=${getCleanPhone(selectedCustomer.phone)}`}
                onClick={() => setSelectedCustomer(null)}
                className="flex-1 py-2.5 bg-plum hover:bg-plum-dark text-white font-semibold rounded-xl text-center text-xs shadow-xs transition-colors"
              >
                Create Booking
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-line shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div>
                <h3 className="font-display font-semibold text-ink text-base">Register New Customer</h3>
                <p className="text-[11px] text-ink-soft">Saves customer profile into live database</p>
              </div>
              <button
                onClick={closeAddModal}
                className="w-10 h-10 -mr-2 rounded-lg flex items-center justify-center text-mute hover:text-ink hover:bg-ivory-deep"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-800 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-ink-soft uppercase mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Smt. Priyadarshini Meher"
                  className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum font-medium text-ink"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-ink-soft uppercase mb-1">
                    Phone Number (10-Digit) *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum num font-semibold text-ink"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink-soft uppercase mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Same as phone"
                    maxLength={10}
                    className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum num text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-soft uppercase mb-1">
                  Local Address / Landmark
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Bhatli Chowk, Ward 4"
                  className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum font-medium text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-ink-soft uppercase mb-1">
                    City / Town
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum font-medium text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink-soft uppercase mb-1">
                    PIN Code
                  </label>
                  <input
                    type="text" inputMode="numeric" pattern="[0-9]*"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum font-medium num text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-soft uppercase mb-1">
                  Customer Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. VIP client, preferred size L"
                  className="w-full px-3 min-h-10 bg-ivory border border-line rounded-xl focus:outline-none focus:border-plum font-medium text-ink"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="flex-1 py-2.5 rounded-xl border border-line bg-white hover:bg-ivory-deep text-ink-soft font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-plum hover:bg-plum-dark text-white rounded-xl font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gold-soft" />
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
