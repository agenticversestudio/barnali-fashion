"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageSquare,
  MapPin,
  Wallet,
  Calendar,
  X,
  History,
  ShieldCheck,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR, formatDate } from "@/lib/utils";
import { Customer } from "@/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Customer Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Bargarh");
  const [pincode, setPincode] = useState("768028");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setCustomers(DataStore.getCustomers());
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
    alert(`Customer ${name} added successfully!`);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8C6F3B] font-semibold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4 text-[#4B1835]" />
            <span>Client Profiles &amp; Rental Records</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#27222A]">Customers &amp; CRM</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Maintain verified customer contact records, rental history, and active deposit balances across Western Odisha.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#4B1835] hover:bg-[#320F23] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4 text-[#D4B67F]" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EFE9DD] shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-[#B89558] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Customer Name, Mobile Number, or City (Bargarh, Sambalpur, Jharsuguda)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl focus:outline-hidden focus:border-[#4B1835] text-gray-800"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-[#EFE9DD] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{c.name}</h3>
                  <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#B89558]" />
                    <span>{c.city}, Odisha • PIN {c.pincode}</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] bg-[#FAF5EB] text-[#8C6F3B] px-2 py-0.5 rounded font-bold">
                  {c.id}
                </span>
              </div>

              {/* Contact info */}
              <div className="mt-3 p-2.5 bg-[#FBF9F5] rounded-xl border border-[#E8DFD1] flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-gray-800">{c.phone}</span>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${c.phone}`}
                    className="p-1 bg-white border border-gray-200 rounded text-gray-600 hover:text-gray-900"
                    title="Call Customer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://wa.me/91${c.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 bg-emerald-50 border border-emerald-200 rounded text-emerald-700 hover:text-emerald-900"
                    title="WhatsApp Chat"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Notes */}
              {c.notes && (
                <p className="text-[11px] text-gray-600 mt-2 italic bg-[#FAF5EB]/50 p-2 rounded-lg">
                  &ldquo;{c.notes}&rdquo;
                </p>
              )}
            </div>

            {/* Metrics Footer */}
            <div className="mt-4 pt-3 border-t border-[#EFE9DD] grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="text-[10px] text-gray-400">Total Orders</div>
                <div className="font-bold text-gray-900 mt-0.5">{c.totalBookings}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400">Total Spent</div>
                <div className="font-bold text-[#4B1835] mt-0.5">{formatINR(c.totalSpent)}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400">Deposit Held</div>
                <div className="font-bold text-[#B89558] mt-0.5">
                  {formatINR(c.refundableDepositsHeld)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EFE9DD] max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DD]">
              <div className="flex items-center gap-2 font-bold text-sm text-[#4B1835]">
                <Plus className="w-4 h-4 text-[#B89558]" />
                <span>Add Customer Profile</span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Minati Meher"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Mobile / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    City / Town *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Street Address / Landmark
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near LIC Office, Bargarh Road"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Customer Preferences / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bridal preference: maroon &amp; antique gold zari"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-[#EFE9DD] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4B1835] hover:bg-[#320F23] text-white font-bold rounded-xl shadow-xs"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
