"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  Plus,
  RefreshCw,
  Globe,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  X,
  ExternalLink,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { NotificationItem, UserRole } from "@/types";

export function ErpHeader() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("owner");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickActionOpen, setQuickActionOpen] = useState(false);

  useEffect(() => {
    setRole(DataStore.getCurrentRole());
    setNotifications(DataStore.getNotifications());
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    DataStore.setCurrentRole(newRole);
  };

  const handleResetData = () => {
    if (confirm("Reset all prototype data to initial seed state? This will clear any changes made in this browser session.")) {
      DataStore.resetAll();
      window.location.reload();
    }
  };

  // Search filter
  const allGarments = DataStore.getGarments();
  const allBookings = DataStore.getBookings();
  const allCustomers = DataStore.getCustomers();

  const filteredGarments = searchQuery.trim()
    ? allGarments.filter(
        (g) =>
          g.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.barcode.includes(searchQuery)
      )
    : [];

  const filteredBookings = searchQuery.trim()
    ? allBookings.filter(
        (b) =>
          b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.customerPhone.includes(searchQuery)
      )
    : [];

  const filteredCustomers = searchQuery.trim()
    ? allCustomers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone.includes(searchQuery) ||
          c.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="h-16 bg-white border-b border-[#EFE9DD] px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Search Trigger & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowSearchModal(true)}
          className="flex items-center gap-2 bg-[#FBF9F5] hover:bg-[#F3EFE7] border border-[#E8DFD1] text-xs md:text-sm text-gray-500 px-3 py-1.5 rounded-lg transition-all w-44 md:w-72 justify-between"
        >
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#B89558]" />
            <span>Search SKU, Booking, Client...</span>
          </span>
          <kbd className="hidden md:inline-block bg-white text-[10px] text-gray-400 font-mono px-1.5 py-0.5 rounded border border-gray-200">
            ⌘K
          </kbd>
        </button>

        {/* Demo Mode Badge */}
        <div className="hidden lg:flex items-center gap-1.5 bg-[#FAF5EB] border border-[#E8DFD1] px-2.5 py-1 rounded-full text-[11px] font-medium text-[#8C6F3B]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Demo Mode (Local Active)</span>
          <button
            onClick={handleResetData}
            title="Reset to factory demo data"
            className="hover:text-red-700 ml-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Switch to Public Website */}
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[#4B1835] hover:text-[#320F23] bg-[#F9F1F5] hover:bg-[#F3E2EC] border border-[#E7CDDC] px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-[#B89558]" />
          <span>Customer Website</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </Link>

        {/* Quick Create Dropdown */}
        <div className="relative">
          <button
            onClick={() => setQuickActionOpen(!quickActionOpen)}
            className="flex items-center gap-1.5 bg-[#4B1835] hover:bg-[#351125] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-[#D4B67F]" />
            <span className="hidden sm:inline">Quick Action</span>
          </button>

          {quickActionOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#EFE9DD] rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 text-xs">
              <Link
                href="/erp/bookings/new"
                onClick={() => setQuickActionOpen(false)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-[#FAF5EB] text-gray-800 font-medium"
              >
                <Plus className="w-3.5 h-3.5 text-[#4B1835]" /> New Booking Wizard
              </Link>
              <Link
                href="/erp/customers?action=new"
                onClick={() => setQuickActionOpen(false)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-[#FAF5EB] text-gray-800 font-medium"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#B89558]" /> Add New Customer
              </Link>
              <Link
                href="/erp/inventory?action=new"
                onClick={() => setQuickActionOpen(false)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-[#FAF5EB] text-gray-800 font-medium"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" /> Add Garment Unit
              </Link>
              <Link
                href="/erp/billing/expenses?action=new"
                onClick={() => setQuickActionOpen(false)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-[#FAF5EB] text-gray-800 font-medium"
              >
                <Plus className="w-3.5 h-3.5 text-rose-600" /> Record Daily Expense
              </Link>
            </div>
          )}
        </div>

        {/* Notification Center */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-[#F3EFE7] rounded-lg transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-[#4B1835]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-600 rounded-full ring-2 ring-white animate-pulse"></span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-[#EFE9DD] rounded-xl shadow-2xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-2 border-b border-[#EFE9DD] flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm">Notifications & Alerts</span>
                <span className="text-[11px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-semibold">
                  {unreadCount} Unread
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-[#F1ECE3]">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      DataStore.markNotificationRead(n.id);
                      setNotifications(DataStore.getNotifications());
                      if (n.actionUrl) router.push(n.actionUrl);
                      setShowNotifMenu(false);
                    }}
                    className={`p-3 hover:bg-[#FBF9F5] cursor-pointer transition-colors ${
                      !n.read ? "bg-[#FAF5EB]/50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {n.type === "RETURN_OVERDUE" ? (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      ) : (
                        <Clock className="w-4 h-4 text-[#B89558] shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">{n.title}</div>
                        <p className="text-gray-600 text-[11px] mt-0.5 leading-snug">{n.message}</p>
                        <span className="text-[10px] text-gray-400 mt-1 block">{n.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Role Switcher for Demo Simulation */}
        <div className="flex items-center gap-1.5 bg-[#FBF9F5] border border-[#E8DFD1] px-2 py-1 rounded-lg">
          <span className="text-[10px] uppercase font-bold text-gray-400 hidden xl:inline">Role:</span>
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value as UserRole)}
            className="bg-transparent text-xs font-semibold text-[#4B1835] focus:outline-hidden cursor-pointer"
          >
            <option value="owner">Owner (Full Access)</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="sales_staff">Counter Staff</option>
            <option value="laundry_staff">Laundry Ops</option>
            <option value="accountant">Accountant</option>
            <option value="viewer">Viewer (Read-Only)</option>
          </select>
        </div>
      </div>

      {/* Global Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-20 px-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EFE9DD] w-full max-w-2xl overflow-hidden">
            <div className="p-4 border-b border-[#EFE9DD] flex items-center gap-3">
              <Search className="w-5 h-5 text-[#B89558]" />
              <input
                type="text"
                autoFocus
                placeholder="Search by SKU (BF-LH-001), Client Name, Phone, or Booking ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm text-gray-900 focus:outline-hidden placeholder:text-gray-400"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-xs">
              {searchQuery.trim() === "" ? (
                <div className="text-center py-8 text-gray-400">
                  Type to search across garments, bookings, and customer profiles.
                </div>
              ) : (
                <>
                  {filteredGarments.length > 0 && (
                    <div>
                      <div className="font-bold text-gray-400 uppercase text-[10px] tracking-wider mb-2">
                        Garment Units ({filteredGarments.length})
                      </div>
                      <div className="space-y-1">
                        {filteredGarments.map((g) => (
                          <div
                            key={g.id}
                            onClick={() => {
                              setShowSearchModal(false);
                              router.push(`/erp/inventory/${g.id}`);
                            }}
                            className="p-2 hover:bg-[#FAF5EB] rounded-lg cursor-pointer flex items-center justify-between border border-transparent hover:border-[#E8DFD1]"
                          >
                            <span className="font-semibold text-gray-900">
                              <span className="text-[#4B1835] font-mono mr-2">{g.id}</span>
                              {g.productName} ({g.size})
                            </span>
                            <span className="text-gray-500 font-mono text-[11px]">{g.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredBookings.length > 0 && (
                    <div>
                      <div className="font-bold text-gray-400 uppercase text-[10px] tracking-wider mb-2">
                        Bookings ({filteredBookings.length})
                      </div>
                      <div className="space-y-1">
                        {filteredBookings.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => {
                              setShowSearchModal(false);
                              router.push(`/erp/bookings`);
                            }}
                            className="p-2 hover:bg-[#FAF5EB] rounded-lg cursor-pointer flex items-center justify-between border border-transparent hover:border-[#E8DFD1]"
                          >
                            <span className="font-semibold text-gray-900">
                              <span className="text-[#B89558] font-mono mr-2">{b.id}</span>
                              {b.customerName} — {b.eventName}
                            </span>
                            <span className="text-gray-500 text-[11px] font-mono">{b.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredCustomers.length > 0 && (
                    <div>
                      <div className="font-bold text-gray-400 uppercase text-[10px] tracking-wider mb-2">
                        Customers ({filteredCustomers.length})
                      </div>
                      <div className="space-y-1">
                        {filteredCustomers.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setShowSearchModal(false);
                              router.push(`/erp/customers`);
                            }}
                            className="p-2 hover:bg-[#FAF5EB] rounded-lg cursor-pointer flex items-center justify-between border border-transparent hover:border-[#E8DFD1]"
                          >
                            <span className="font-semibold text-gray-900">
                              {c.name} ({c.city})
                            </span>
                            <span className="text-gray-500 font-mono text-[11px]">{c.phone}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredGarments.length === 0 &&
                    filteredBookings.length === 0 &&
                    filteredCustomers.length === 0 && (
                      <div className="text-center py-6 text-gray-400">
                        No matches found for &quot;{searchQuery}&quot;.
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
