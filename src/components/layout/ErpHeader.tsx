"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Search,
  Menu,
  X,
  ExternalLink,
  User,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Shirt,
  Users as UsersIcon,
  ClipboardList,
  CalendarDays,
  LayoutDashboard,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  Check,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { NotificationItem, UserRole } from "@/types";

export function ErpHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole>("owner");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRole(DataStore.getCurrentRole());
    setNotifications(DataStore.getNotifications());
  }, []);

  // Keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close popups on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile drawer when route changes
  useEffect(() => {
    setShowMobileDrawer(false);
  }, [pathname]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    DataStore.setCurrentRole(newRole);
    setShowUserMenu(false);
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

  // Clean page titles for header
  const getPageTitle = () => {
    if (pathname.startsWith("/erp/dashboard")) return "Alerts & Today";
    if (pathname.startsWith("/erp/bookings")) return "Orders";
    if (pathname.startsWith("/erp/inventory")) return "Inventory";
    if (pathname.startsWith("/erp/operations/laundry")) return "Return & Care";
    if (pathname.startsWith("/erp/calendar")) return "Calendar";
    if (pathname.startsWith("/erp/customers")) return "Customers";
    return "Barnali Fashion";
  };

  // Role display label
  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case "owner":
        return "Owner";
      case "sales_staff":
        return "Counter Operator";
      case "admin":
        return "Admin";
      case "laundry_staff":
        return "Care / Laundry";
      case "viewer":
        return "Viewer";
      default:
        return r;
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
    <>
      <header className="h-14 md:h-16 bg-white border-b border-[#E6E4DF] px-3.5 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)] select-none">
        {/* ========================================================= */}
        {/* MOBILE COMPACT TOP BAR (< 768px): ZERO DUPLICATES         */}
        {/* ========================================================= */}
        <div className="flex md:hidden items-center justify-between w-full">
          {/* Left: Hamburger Menu Trigger + Brand Mark + Page Title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setShowMobileDrawer(true)}
              className="w-8 h-8 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors -ml-1"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>

            <Link
              href="/erp/dashboard"
              className="w-7 h-7 rounded-lg bg-[#6B1D2F] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs"
            >
              BF
            </Link>

            <h1 className="font-semibold text-sm text-slate-900 tracking-tight truncate leading-none">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right Action Controls: Search Icon + Notification Bell (NO DUPLICATE '+') */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Search Icon Button */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 flex items-center justify-center transition-colors"
              aria-label="Search items"
            >
              <Search className="w-4 h-4 text-slate-600" />
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 flex items-center justify-center transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-600 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* DESKTOP MINIMAL HEADER (>= 768px): SAAS STANDARD         */}
        {/* ========================================================= */}
        <div className="hidden md:flex items-center justify-between w-full">
          {/* Left: Global Search Bar */}
          <div className="flex items-center">
            <button
              onClick={() => setShowSearchModal(true)}
              className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 border border-[#E6E4DF] text-xs text-slate-500 px-3.5 py-2 rounded-lg transition-colors w-80 lg:w-96 shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <span className="font-normal text-slate-500">
                  Search Costume ID, Client, Order...
                </span>
              </span>
              <kbd className="bg-white text-[10px] text-slate-400 font-mono font-medium px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Controls: Notification Bell + Minimal User/Studio Avatar Pill */}
          <div className="flex items-center gap-2.5">
            {/* Notification Bell with Clean Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="w-9 h-9 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-[#E6E4DF] rounded-lg transition-colors flex items-center justify-center relative"
                aria-label="Delivery Alerts & Alarms"
              >
                <Bell className="w-4 h-4 text-slate-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-[#E6E4DF] rounded-xl shadow-2xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-1">
                  <div className="px-3.5 py-2.5 border-b border-[#EFECE6] flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900 text-sm">
                        Delivery Alerts &amp; Alarms
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        4-day &amp; 3-day notifications
                      </p>
                    </div>
                    <span className="text-[11px] bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-semibold">
                      {unreadCount} Due
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[#EFECE6]">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">No new alerts</div>
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
                          <div className="flex items-start gap-2.5">
                            {n.type === "RETURN_OVERDUE" ? (
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-900">{n.title}</div>
                              <p className="text-slate-600 text-[11px] mt-0.5 leading-snug">
                                {n.message}
                              </p>
                              <span className="text-[10px] text-slate-400 mt-1 block font-mono">
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

            {/* Minimal User / Studio Avatar Pill with Role Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pr-2.5 bg-white hover:bg-slate-50 border border-[#E6E4DF] rounded-lg transition-colors shadow-2xs"
                aria-label="User Account & Role Menu"
              >
                <div className="w-7 h-7 rounded-lg bg-[#6B1D2F] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                  BF
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-semibold text-slate-900 leading-none">
                    Barnali Studio
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium leading-none mt-1">
                    {getRoleLabel(role)}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E6E4DF] rounded-xl shadow-2xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-1 space-y-2">
                  {/* Studio Info Header */}
                  <div className="p-2.5 bg-[#FAF9F6] rounded-lg border border-[#EFECE6]">
                    <div className="font-semibold text-slate-900 text-xs">
                      Barnali Fashion Studio
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Bargarh, Odisha · Demo Environment
                    </div>
                  </div>

                  {/* Role Selector List */}
                  <div>
                    <div className="px-2 pb-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Switch Role
                    </div>
                    <div className="space-y-0.5">
                      {(
                        [
                          { id: "owner", label: "Owner (Full Access)" },
                          { id: "sales_staff", label: "Counter Operator" },
                          { id: "admin", label: "Admin" },
                          { id: "laundry_staff", label: "Care / Laundry Staff" },
                          { id: "viewer", label: "Viewer" },
                        ] as const
                      ).map((r) => (
                        <button
                          key={r.id}
                          onClick={() => handleRoleChange(r.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                            role === r.id
                              ? "bg-[#6B1D2F]/10 text-[#6B1D2F] font-semibold"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>{r.label}</span>
                          {role === r.id && <Check className="w-3.5 h-3.5 text-[#6B1D2F]" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-1.5 border-t border-[#EFECE6] space-y-1">
                    <Link
                      href="/"
                      target="_blank"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <span>Public Storefront</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </Link>

                    <button
                      onClick={handleResetData}
                      className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-rose-700 hover:bg-rose-50 font-medium transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Demo Data</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MOBILE SLIDE-OVER NAVIGATION DRAWER                       */}
      {/* ========================================================= */}
      {showMobileDrawer && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setShowMobileDrawer(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Slide-over Drawer Content */}
          <div className="relative bg-white w-4/5 max-w-xs h-full shadow-2xl flex flex-col justify-between p-4 z-10 animate-in slide-in-from-left duration-200">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#EFECE6]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#6B1D2F] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    BF
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm leading-tight">
                      Barnali Fashion
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      Rental Studio · Bargarh
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileDrawer(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="py-3 space-y-1 text-xs">
                <div className="px-2 pb-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Navigation
                </div>

                {[
                  { label: "Dashboard & Alerts", href: "/erp/dashboard", icon: LayoutDashboard },
                  { label: "Orders & Counter", href: "/erp/bookings", icon: ClipboardList },
                  { label: "Costumes & Stock", href: "/erp/inventory", icon: Shirt },
                  { label: "Care & Laundry", href: "/erp/operations/laundry", icon: Sparkles },
                  { label: "Calendar", href: "/erp/calendar", icon: CalendarDays },
                  { label: "Customers", href: "/erp/customers", icon: UsersIcon },
                ].map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/erp/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMobileDrawer(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                        isActive
                          ? "bg-[#6B1D2F]/10 text-[#6B1D2F] font-semibold"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${isActive ? "text-[#6B1D2F]" : "text-slate-400"}`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <Link
                  href="/"
                  target="_blank"
                  onClick={() => setShowMobileDrawer(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <span className="flex items-center gap-3">
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                    <span>Storefront</span>
                  </span>
                  <span className="text-[10px] text-slate-400">View &rarr;</span>
                </Link>
              </div>

              {/* Switch Role on Mobile */}
              <div className="pt-2 border-t border-[#EFECE6]">
                <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                  Active Role
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { id: "owner", label: "Owner" },
                    { id: "sales_staff", label: "Counter" },
                    { id: "admin", label: "Admin" },
                    { id: "laundry_staff", label: "Care Staff" },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleRoleChange(r.id as UserRole)}
                      className={`py-1.5 px-2 rounded-lg border text-center font-medium transition-colors text-[11px] ${
                        role === r.id
                          ? "bg-[#6B1D2F] text-white border-[#6B1D2F] font-semibold"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer: Studio Address & Reset Demo Data */}
            <div className="pt-3 border-t border-[#EFECE6] space-y-2 text-xs">
              <div className="p-2.5 bg-[#FAF9F6] rounded-xl border border-[#EFECE6] text-[11px] text-slate-600 leading-snug">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#6B1D2F]" />
                  <span>Bargarh Studio</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">LIC Office Rd, Bargarh</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">+91 7978256488</div>
              </div>

              <button
                onClick={handleResetData}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-50 text-rose-800 font-medium border border-rose-200 text-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FAST OPERATOR SEARCH MODAL (CMD+K / SEARCH ICON)          */}
      {/* ========================================================= */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center pt-3 md:pt-20 px-3 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E6E4DF] w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-3.5 border-b border-[#EFECE6] flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search Costume ID (LF-001, SH-001), Client, Phone, Order..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs md:text-sm text-slate-900 focus:outline-hidden placeholder:text-slate-400 bg-transparent"
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
                            className="p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between border border-[#EFECE6]"
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
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
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
                            className="p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between border border-[#EFECE6]"
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
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
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
                            className="p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between border border-[#EFECE6]"
                          >
                            <div>
                              <span className="font-semibold text-slate-900 mr-2">{c.name}</span>
                              <span className="text-slate-400 text-[11px] font-mono">
                                {c.phone} · {c.city}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
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
