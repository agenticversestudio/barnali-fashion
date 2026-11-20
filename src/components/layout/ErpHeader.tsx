"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  User,
  Shield,
  RotateCcw,
  Sparkles,
  Shirt,
  Users as UsersIcon,
  ClipboardList,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { NotificationItem, UserRole } from "@/types";

export function ErpHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole>("owner");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showShopSheet, setShowShopSheet] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setRole(DataStore.getCurrentRole());
    setNotifications(DataStore.getNotifications());
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    DataStore.setCurrentRole(newRole);
    setShowShopSheet(false);
  };

  const handleResetData = () => {
    if (
      confirm(
        "Reset prototype data to default initial state? All changes made during this session will be refreshed."
      )
    ) {
      DataStore.resetAll();
      window.location.reload();
    }
  };

  // Everyday shop titles for data entry operator
  const getPageTitle = () => {
    if (pathname.startsWith("/erp/dashboard")) return "Alerts & Today";
    if (pathname.startsWith("/erp/bookings")) return "New Booking & Handover";
    if (pathname.startsWith("/erp/inventory")) return "Costumes & Stock";
    if (pathname.startsWith("/erp/operations/laundry")) return "Return & Care";
    if (pathname.startsWith("/erp/calendar")) return "Costume Calendar";
    if (pathname.startsWith("/erp/customers")) return "Customer Register";
    return "Barnali Fashion";
  };

  // Contextual quick create button
  const getQuickAction = () => {
    if (pathname.startsWith("/erp/inventory")) {
      return {
        label: "+ Costume",
        href: "/erp/inventory?action=new",
      };
    }
    if (pathname.startsWith("/erp/operations/laundry")) {
      return {
        label: "+ Care",
        href: "/erp/operations/laundry?action=new",
      };
    }
    if (pathname.startsWith("/erp/customers")) {
      return {
        label: "+ Customer",
        href: "/erp/customers?action=new",
      };
    }
    return {
      label: "+ Booking",
      href: "/erp/bookings?new=1",
    };
  };

  const quickAction = getQuickAction();

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
    <>
      <header className="h-14 md:h-16 bg-white border-b border-[#E6E4DF] px-3.5 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)] select-none">
        {/* ========================================================= */}
        {/* MOBILE STICKY TOP BAR: EXACT 3 CONTROLS MAX (< 768px)     */}
        {/* ========================================================= */}
        <div className="flex md:hidden items-center justify-between w-full">
          {/* Left: Studio Badge + Page Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/erp/dashboard"
              className="w-7 h-7 rounded-lg bg-[#6B1D2F] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs"
            >
              BF
            </Link>
            <div className="min-w-0">
              <h1 className="font-semibold text-sm text-slate-900 tracking-tight truncate leading-tight">
                {getPageTitle()}
              </h1>
              <div className="text-[10px] text-slate-400 font-normal leading-none mt-0.5">
                Bargarh Studio
              </div>
            </div>
          </div>

          {/* Right Action Controls: EXACT 3 (Search, Quick Create, Shop/Account) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* 1. Quick Search Icon */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
              aria-label="Search items"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* 2. Contextual Quick Action '+' Button */}
            <Link
              href={quickAction.href}
              className="h-8 px-2.5 rounded-lg bg-[#6B1D2F] hover:bg-[#551624] text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="text-[11px]">{quickAction.label}</span>
            </Link>

            {/* 3. Shop & Role Avatar */}
            <button
              onClick={() => setShowShopSheet(true)}
              className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center transition-colors relative"
              aria-label="Shop Menu"
            >
              <User className="w-4 h-4 text-slate-700" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-rose-600 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* DESKTOP HEADER (>= 768px)                                 */}
        {/* ========================================================= */}
        <div className="hidden md:flex items-center justify-between w-full">
          {/* Left: Search Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSearchModal(true)}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-500 px-3 py-1.5 rounded-lg transition-colors w-72 justify-between"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Search Costume ID, Client, Order...</span>
              </span>
              <kbd className="bg-white text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded border border-slate-200">
                ⌘K
              </kbd>
            </button>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full text-[11px] font-medium text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Bargarh Studio (In front of LIC Office)</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <span>Customer Storefront</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            <Link
              href="/erp/bookings?new=1"
              className="flex items-center gap-1.5 bg-[#6B1D2F] hover:bg-[#551624] text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Booking</span>
            </Link>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 text-slate-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-600 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-[#E2E8F0] rounded-xl shadow-2xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-sm">
                      Delivery Alerts &amp; Alarms
                    </span>
                    <span className="text-[11px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-semibold">
                      {unreadCount} Due
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-400">No new alerts</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            DataStore.markNotificationRead(n.id);
                            setNotifications(DataStore.getNotifications());
                            if (n.actionUrl) router.push(n.actionUrl);
                            setShowNotifMenu(false);
                          }}
                          className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                            !n.read ? "bg-amber-50/40" : ""
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {n.type === "RETURN_OVERDUE" ? (
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <div className="font-semibold text-slate-900">{n.title}</div>
                              <p className="text-slate-600 text-[11px] mt-0.5 leading-snug">
                                {n.message}
                              </p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {n.timestamp}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Role Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400">Role:</span>
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="owner">Owner (Full Access)</option>
                <option value="sales_staff">Counter Operator</option>
                <option value="admin">Admin</option>
                <option value="laundry_staff">Laundry / Care Staff</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* SHOP / ROLE / RESET SHEET (MOBILE)                        */}
      {/* ========================================================= */}
      {showShopSheet && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            onClick={() => setShowShopSheet(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
          />
          <div className="relative bg-white rounded-t-2xl shadow-2xl border-t border-[#E2E8F0] p-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 text-xs">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#6B1D2F] text-white flex items-center justify-center font-bold text-xs">
                  BF
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">
                    Barnali Fashion, Bargarh
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Boutique &amp; Rental Studio Operations
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowShopSheet(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Links */}
            <div className="py-3 space-y-1.5">
              <Link
                href="/erp/calendar"
                onClick={() => setShowShopSheet(false)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 font-medium text-slate-800"
              >
                <span>Costume Code Calendar View</span>
                <span className="text-[10px] text-slate-400">Nov 2026 &rarr;</span>
              </Link>

              <Link
                href="/erp/customers"
                onClick={() => setShowShopSheet(false)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 font-medium text-slate-800"
              >
                <span>Customer Contacts &amp; Ledger</span>
                <span className="text-[10px] text-slate-400">View Clients &rarr;</span>
              </Link>

              <Link
                href="/"
                target="_blank"
                onClick={() => setShowShopSheet(false)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 font-medium text-slate-800"
              >
                <span>Open Public Storefront</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>

            {/* Switch Mode */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider mb-2">
                Operator Mode
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "owner", label: "Owner (Full)" },
                  { id: "sales_staff", label: "Counter Operator" },
                  { id: "admin", label: "Admin" },
                  { id: "laundry_staff", label: "Laundry Ops" },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleRoleChange(r.id as UserRole)}
                    className={`py-2 px-2.5 rounded-xl border text-left font-medium transition-colors ${
                      role === r.id
                        ? "bg-[#6B1D2F] text-white border-[#6B1D2F]"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Prototype Data */}
            <div className="pt-3 mt-3 border-t border-slate-100">
              <button
                onClick={handleResetData}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-50 text-rose-700 font-medium border border-rose-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Shop Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FAST OPERATOR SEARCH MODAL                                */}
      {/* ========================================================= */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center pt-3 md:pt-20 px-3 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-3.5 border-b border-slate-200 flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search Costume ID (LF-001, SH-001), Client, Phone, Order..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs md:text-sm text-slate-900 focus:outline-hidden placeholder:text-slate-400"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[70vh] md:max-h-96 overflow-y-auto p-3 space-y-3 text-xs">
              {searchQuery.trim() === "" ? (
                <div className="text-center py-6 text-slate-400">
                  <p className="font-semibold text-slate-700">Quick Shop Search</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter Costume ID (`LF-001`), customer mobile number, or booking code.
                  </p>
                </div>
              ) : (
                <>
                  {filteredGarments.length > 0 && (
                    <div>
                      <div className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Shirt className="w-3 h-3 text-[#6B1D2F]" />
                        <span>Costumes ({filteredGarments.length})</span>
                      </div>
                      <div className="space-y-1">
                        {filteredGarments.map((g) => (
                          <div
                            key={g.id}
                            onClick={() => {
                              setShowSearchModal(false);
                              router.push(`/erp/inventory?sku=${g.id}`);
                            }}
                            className="p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between border border-slate-100"
                          >
                            <div>
                              <span className="font-mono font-bold text-[#6B1D2F] mr-2">
                                {g.id}
                              </span>
                              <span className="font-medium text-slate-900">{g.productName}</span>
                              <span className="text-slate-400 text-[11px] ml-1.5">
                                · Rack: {g.location || g.storageLocation}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {g.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredBookings.length > 0 && (
                    <div>
                      <div className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1.5">
                        <ClipboardList className="w-3 h-3 text-amber-600" />
                        <span>Bookings ({filteredBookings.length})</span>
                      </div>
                      <div className="space-y-1">
                        {filteredBookings.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => {
                              setShowSearchModal(false);
                              router.push(`/erp/bookings?orderId=${b.id}`);
                            }}
                            className="p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between border border-slate-100"
                          >
                            <div>
                              <span className="font-mono font-bold text-slate-900 mr-2">
                                {b.id}
                              </span>
                              <span className="font-medium text-slate-800">{b.customerName}</span>
                              <span className="text-slate-400 text-[11px] ml-1.5 font-mono">
                                {b.customerPhone}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                              {b.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredCustomers.length > 0 && (
                    <div>
                      <div className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1.5">
                        <UsersIcon className="w-3 h-3 text-blue-600" />
                        <span>Customers ({filteredCustomers.length})</span>
                      </div>
                      <div className="space-y-1">
                        {filteredCustomers.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setShowSearchModal(false);
                              router.push(`/erp/customers?id=${c.id}`);
                            }}
                            className="p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between border border-slate-100"
                          >
                            <div>
                              <span className="font-semibold text-slate-900 mr-2">{c.name}</span>
                              <span className="text-slate-400 text-[11px] font-mono">
                                {c.phone} · {c.city}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {c.id}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredGarments.length === 0 &&
                    filteredBookings.length === 0 &&
                    filteredCustomers.length === 0 && (
                      <div className="text-center py-6 text-slate-400">
                        No matches found for &ldquo;{searchQuery}&rdquo;
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
