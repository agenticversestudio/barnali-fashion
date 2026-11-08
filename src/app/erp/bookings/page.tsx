"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Search,
  Filter,
  Plus,
  Calendar,
  Phone,
  FileText,
  Printer,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Booking, BookingStatus } from "@/types";

export default function BookingsListPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    setBookings(DataStore.getBookings());
  }, []);

  const statuses = [
    "ALL",
    "CONFIRMED",
    "PICKUP_PENDING",
    "OUT_ON_RENT",
    "RETURN_RECEIVED",
    "COMPLETED",
    "CANCELLED",
  ];

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customerPhone.includes(searchTerm) ||
      b.eventName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8C6F3B] font-semibold uppercase tracking-wider mb-1">
            <ClipboardCheck className="w-4 h-4 text-[#4B1835]" />
            <span>Rental Contracts &amp; Orders</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#27222A]">Bookings Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Complete booking lifecycle tracking with date conflict protection, advance receipts, and deposit records.
          </p>
        </div>

        <Link
          href="/erp/bookings/new"
          className="bg-[#4B1835] hover:bg-[#320F23] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4 text-[#D4B67F]" />
          <span>New Booking Wizard</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EFE9DD] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#B89558] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Booking ID (BF-BK-2026-081), Customer Name, Phone, or Event..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl focus:outline-hidden focus:border-[#4B1835] text-gray-800"
            />
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? "bg-[#4B1835] text-white font-bold"
                  : "bg-[#FBF9F5] text-gray-600 hover:bg-[#F3EFE7] border border-[#EFE9DD]"
              }`}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-[#EFE9DD] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5EB] border-b border-[#EFE9DD] text-[#8C6F3B] uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Booking ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Garments Booked</th>
                <th className="py-3 px-3">Rental Dates</th>
                <th className="py-3 px-3">Rental Total</th>
                <th className="py-3 px-3">Deposit (Held)</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1ECE3]">
              {filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-[#FBF9F5] transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-[#4B1835]">{b.id}</span>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                      Created: {formatDate(b.createdAt)}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-gray-900">{b.customerName}</div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#B89558]" />
                      <span>{b.customerPhone} ({b.customerCity})</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-gray-800 line-clamp-1 max-w-xs">
                      {b.items.map((i) => i.productName).join(" + ")}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono">
                      {b.items.map((i) => `${i.garmentUnitId} (${i.size})`).join(", ")}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-gray-900">
                      {formatDate(b.pickupDate)} → {formatDate(b.returnDueDate)}
                    </div>
                    <div className="text-[11px] text-[#8C6F3B] font-medium">{b.eventName}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-gray-900">{formatINR(b.rentalTotal)}</div>
                    {b.remainingRentalDue > 0 ? (
                      <span className="text-[10px] text-rose-600 font-semibold">
                        Due: {formatINR(b.remainingRentalDue)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        Paid Full
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-semibold text-[#B89558]">
                    {formatINR(b.securityDepositTotal)}
                    <div className="text-[10px] text-gray-400 font-normal">
                      {b.depositStatus}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/erp/billing/invoices?bookingId=${b.id}`}
                        title="View & Print Rental Agreement / Invoice"
                        className="p-1.5 bg-[#FAF5EB] hover:bg-[#F3EFE7] text-[#8C6F3B] rounded-lg transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </Link>
                      {b.status === "CONFIRMED" || b.status === "PICKUP_PENDING" ? (
                        <Link
                          href={`/erp/operations/pickup?bookingId=${b.id}`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] px-2.5 py-1 rounded-lg shadow-xs"
                        >
                          Issue
                        </Link>
                      ) : b.status === "OUT_ON_RENT" ? (
                        <Link
                          href={`/erp/operations/returns?bookingId=${b.id}`}
                          className="bg-[#4B1835] hover:bg-[#320F23] text-white font-semibold text-[11px] px-2.5 py-1 rounded-lg shadow-xs"
                        >
                          Return
                        </Link>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-medium">Done</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
