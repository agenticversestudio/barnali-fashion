"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR, formatDate } from "@/lib/utils";
import { Customer, Booking } from "@/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Selected customer for Full Details Bottom Sheet
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New Customer Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Bargarh");
  const [pincode, setPincode] = useState("768028");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setCustomers(DataStore.getCustomers());
    setBookings(DataStore.getBookings());
  }, []);

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("Name and Phone are mandatory");
      return;
    }

    const newCust: Customer = {
      id: `CUST-${String(customers.length + 13).padStart(3, "0")}`,
      name,
      phone,
      whatsapp: phone,
      address,
      city,
      pincode,
      notes,
      totalBookings: 0,
      totalSpent: 0,
      activeRentalsCount: 0,
      refundableDepositsHeld: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };

    DataStore.saveCustomer(newCust);
    setCustomers(DataStore.getCustomers());
    setShowAddModal(false);
    setName("");
    setPhone("");
    setAddress("");
    alert(`Customer ${name} added successfully!`);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-3.5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
            Customers
          </h1>
          <p className="text-[11px] md:text-xs text-slate-500 mt-0.5">
            Verified client profiles, contact numbers, and security deposit ledger.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 bg-[#6B1D2F] hover:bg-[#551624] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 md:p-4 rounded-xl border border-[#E6E4DF] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer name, mobile number, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#6B1D2F] text-slate-800"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE CUSTOMER CARDS (< 768px): ZERO HORIZONTAL SCROLL   */}
      {/* ========================================================= */}
      <div className="block md:hidden space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-[#E6E4DF] text-center text-xs text-slate-500 shadow-2xs">
            No customers found matching your search.
          </div>
        ) : (
          filteredCustomers.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-[#E6E4DF] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-2.5"
            >
              {/* Top Row: Name + ID */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 text-xs">{c.name}</h3>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#6B1D2F]" />
                    <span>
                      {c.city}, Odisha • PIN {c.pincode}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold border border-slate-200">
                  {c.id}
                </span>
              </div>

              {/* Contact strip with 1-tap call & WhatsApp */}
              <div className="p-2.5 bg-[#FAF9F6] rounded-lg border border-[#EFECE6] flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-slate-800">+91 {c.phone}</span>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${c.phone}`}
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center bg-white border border-[#E6E4DF] rounded-md text-slate-700 hover:text-slate-900 shadow-2xs"
                    title="Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://wa.me/91${c.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center bg-emerald-50 border border-emerald-300 rounded-md text-emerald-800 hover:text-emerald-950 shadow-2xs"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* 3-Stat Metric Strip */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs p-2 bg-[#FAF9F6] border border-[#EFECE6] rounded-lg">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Orders</div>
                  <div className="font-bold text-slate-900 mt-0.5">{c.totalBookings}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Spent</div>
                  <div className="font-bold text-[#6B1D2F] mt-0.5 truncate">{formatINR(c.totalSpent)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Deposit Held</div>
                  <div className="font-bold text-emerald-800 mt-0.5 truncate">
                    {formatINR(c.refundableDepositsHeld)}
                  </div>
                </div>
              </div>

              {/* Details Trigger */}
              <button
                onClick={() => setSelectedCustomer(c)}
                className="w-full min-h-[40px] flex items-center justify-center text-center text-xs font-semibold text-slate-700 bg-white border border-[#E6E4DF] hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
              >
                View Full Profile &amp; History &rarr;
              </button>
            </div>
          ))
        )}
      </div>

      {/* ========================================================= */}
      {/* DESKTOP CUSTOMERS GRID (>= 768px)                         */}
      {/* ========================================================= */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-xl border border-[#E6E4DF] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{c.name}</h3>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#6B1D2F]" />
                    <span>
                      {c.city}, Odisha • PIN {c.pincode}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                  {c.id}
                </span>
              </div>

              {/* Contact info */}
              <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-slate-800">+91 {c.phone}</span>
                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${c.phone}`}
                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-md text-slate-600 hover:text-slate-900 shadow-2xs"
                    title="Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://wa.me/91${c.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 flex items-center justify-center bg-emerald-50 border border-emerald-200 rounded-md text-emerald-700 hover:text-emerald-900 shadow-2xs"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {c.notes && (
                <p className="text-[11px] text-slate-500 mt-2 italic bg-slate-50 p-2 rounded-lg">
                  &ldquo;{c.notes}&rdquo;
                </p>
              )}
            </div>

            {/* Metrics Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="text-[10px] text-slate-400">Total Orders</div>
                <div className="font-bold text-slate-900 mt-0.5">{c.totalBookings}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Total Spent</div>
                <div className="font-bold text-[#6B1D2F] mt-0.5 truncate">{formatINR(c.totalSpent)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Deposit Held</div>
                <div className="font-bold text-emerald-700 mt-0.5 truncate">
                  {formatINR(c.refundableDepositsHeld)}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedCustomer(c)}
              className="mt-3.5 w-full min-h-[38px] flex items-center justify-center text-center text-xs font-semibold text-slate-700 bg-[#FAF9F6] border border-[#E6E4DF] hover:bg-slate-100 rounded-lg transition-colors shadow-2xs"
            >
              View Full Profile &amp; History &rarr;
            </button>
          </div>
        ))}
      </div>

      {/* ========================================================= */}
      {/* FULL CUSTOMER DETAILS BOTTOM SHEET                        */}
      {/* ========================================================= */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-4 sm:p-6 text-xs max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-900">
                  {selectedCustomer.name}
                </span>
                <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                  {selectedCustomer.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Address</span>
                <div className="text-slate-800 font-medium">
                  {selectedCustomer.address || "LIC Office Road vicinity"}
                </div>
                <div className="text-slate-500 text-[11px]">
                  {selectedCustomer.city}, Odisha • PIN {selectedCustomer.pincode}
                </div>
              </div>

              {/* Quick Contact Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${selectedCustomer.phone}`}
                  className="min-h-[42px] py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call +91 {selectedCustomer.phone}</span>
                </a>
                <a
                  href={`https://wa.me/91${selectedCustomer.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[42px] py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors border border-emerald-200"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Chat</span>
                </a>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-[10px] text-slate-400">Orders</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {selectedCustomer.totalBookings}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-[10px] text-slate-400">Total Spent</div>
                  <div className="font-bold text-[#6B1D2F] mt-0.5">
                    {formatINR(selectedCustomer.totalSpent)}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-[10px] text-slate-400">Deposit Held</div>
                  <div className="font-bold text-emerald-700 mt-0.5">
                    {formatINR(selectedCustomer.refundableDepositsHeld)}
                  </div>
                </div>
              </div>

              {/* Client Notes */}
              {selectedCustomer.notes && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Notes</span>
                  <p className="text-slate-700 mt-0.5">{selectedCustomer.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="min-h-[40px] px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Close
                </button>
                <Link
                  href={`/erp/bookings?new=1`}
                  className="min-h-[40px] inline-flex items-center px-4 py-2 bg-[#6B1D2F] hover:bg-[#551624] text-white rounded-lg font-semibold shadow-xs"
                >
                  New Order for Client
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD CUSTOMER MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-4 sm:p-6 text-xs max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-900">Add Customer Profile</span>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="mt-4 space-y-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Minati Meher"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                    Mobile / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                    City / Town *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                  Street Address / Landmark
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Bhatli Chowk, Bargarh"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Prefers bridal red, daughter getting married in Dec"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-[40px] px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-4 py-2 bg-[#6B1D2F] hover:bg-[#551624] text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
