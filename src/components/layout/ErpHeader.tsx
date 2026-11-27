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
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { alertsApi, garmentsApi, bookingsApi, customersApi } from "@/lib/api";
import type { AlertDto, GarmentDto, BookingDto, CustomerDto, Role } from "@/types/api";

export function ErpHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, isStaff, logout } = useAuth();
  const [alerts, setAlerts] = useState<AlertDto[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    alertsApi
      .list()
      .then((res) => {
        setAlerts(res.alerts || []);
      })
      .catch(() => {
        setAlerts([]);
      });
  }, [pathname]);

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

  const unreadCount = alerts.length;

  // Clean page titles for header
  const getPageTitle = () => {
    const titles: [string, string][] = [
      ["/erp/dashboard", "Studio Today"],
      ["/erp/bookings/new", "New Counter Booking"],
      ["/erp/bookings", "Orders"],
      ["/erp/inventory", "Inventory"],
      ["/erp/operations/laundry", "Return & Care"],
      ["/erp/operations/pickup", "Pickup Desk"],
      ["/erp/operations/returns", "Return Counter"],
      ["/erp/operations/inspection", "Inspection"],
      ["/erp/operations/maintenance", "Alterations"],
      ["/erp/calendar", "Calendar"],
      ["/erp/customers", "Customers"],
      ["/erp/billing/cash-closing", "Cash Closing"],
      ["/erp/billing/expenses", "Expenses"],
      ["/erp/billing/deposits", "Deposit Register"],
      ["/erp/reports", "Reports"],
      ["/erp/staff", "Staff"],
      ["/erp/settings", "Settings"],
    ];
    return titles.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "Barnali Fashion";
  };

  // Role display label
  const getRoleLabel = (r?: Role | string) => {
    switch (r) {
      case "admin":
      case "owner":
        return "Admin (Owner)";
      case "staff":
      case "sales_staff":
        return "Counter Operator";
      default:
        return r || "Operator";
    }
  };

  // Search filter via live APIs
  const [filteredGarments, setFilteredGarments] = useState<GarmentDto[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingDto[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerDto[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setFilteredGarments([]);
      setFilteredBookings([]);
      setFilteredCustomers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const [gRes, bRes, cRes] = await Promise.all([
          garmentsApi.list({ q, limit: 5 }),
          bookingsApi.list({ q, limit: 5 }),
          customersApi.list(q),
        ]);
        setFilteredGarments(gRes.items || []);
        setFilteredBookings(bRes.items || []);
        setFilteredCustomers(cRes.items || []);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <>
      <header className="h-16 bg-ivory/90 backdrop-blur-md border-b border-line px-3.5 md:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
        {/* MOBILE (< 768px): menu, mark + serif page title, search, alerts */}
        <div className="flex md:hidden items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setShowMobileDrawer(true)}
              className="w-10 h-10 -ml-1.5 rounded-lg text-ink-soft hover:bg-ivory-deep flex items-center justify-center shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link
              href="/erp/dashboard"
              aria-label="Barnali Fashion home"
              className="w-8 h-8 rounded-lg bg-plum border border-gold/50 flex items-center justify-center text-gold-soft font-display font-bold text-xs shrink-0 shadow-2xs"
            >
              BF
            </Link>
            <h1 className="page-title text-[17px] text-ink truncate">{getPageTitle()}</h1>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowSearchModal(true)}
              className="w-10 h-10 rounded-xl bg-white hover:bg-ivory-deep border border-line text-ink-soft flex items-center justify-center shadow-2xs"
              aria-label="Search costumes, customers, orders"
            >
              <Search className="w-4 h-4" />
            </button>
            {/* on a phone the bell opens the dashboard, where every alert is listed with its actions */}
            <Link
              href="/erp/dashboard"
              className="w-10 h-10 rounded-xl bg-white hover:bg-ivory-deep border border-line text-ink-soft flex items-center justify-center relative shadow-2xs"
              aria-label={`Alerts (${unreadCount})`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-800 rounded-full ring-2 ring-white" />}
            </Link>
          </div>
        </div>

        {/* TABLET / DESKTOP (>= 768px) */}
        <div className="hidden md:flex items-center justify-between w-full gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setShowMobileDrawer(true)}
              className="lg:hidden w-10 h-10 rounded-xl text-ink-soft hover:bg-ivory-deep flex items-center justify-center border border-line bg-white shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="page-title text-xl text-ink hidden lg:block shrink-0">{getPageTitle()}</h1>
            <span className="hidden lg:block h-6 w-px bg-line shrink-0" />
            <button
              onClick={() => setShowSearchModal(true)}
              className="flex items-center justify-between bg-white hover:bg-ivory-deep/40 border border-line text-xs text-ink-soft px-4 min-h-10 rounded-xl w-64 lg:w-96 shadow-2xs transition-colors"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Search className="w-4 h-4 text-mute shrink-0" />
                <span className="truncate">Search Costume ID, Client, Order...</span>
              </span>
              <kbd className="num bg-ivory-deep text-[10px] text-ink-soft font-semibold px-2 py-0.5 rounded border border-line ml-2 shrink-0">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="w-10 h-10 text-ink-soft hover:text-ink bg-white hover:bg-ivory-deep border border-line rounded-xl flex items-center justify-center relative shadow-2xs transition-colors"
                aria-label={`Alerts (${alerts.length})`}
                aria-expanded={showNotifMenu}
              >
                <Bell className="w-4 h-4" />
                {alerts.length > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-800 rounded-full ring-2 ring-white" />}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-line rounded-xl shadow-[0_12px_32px_rgba(60,40,20,0.16)] z-50 text-xs animate-in fade-in slide-in-from-top-1 overflow-hidden">
                  <div className="px-4 py-3 border-b border-line-soft flex items-center justify-between bg-ivory">
                    <div>
                      <span className="section-title text-[15px]">Operational alerts</span>
                      <p className="text-[11px] text-mute mt-0.5">Pickups, returns, refunds &amp; care</p>
                    </div>
                    <span className="num text-[11px] bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-semibold">
                      {alerts.length} due
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-line-soft">
                    {alerts.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="section-title text-sm">All caught up</p>
                        <p className="text-[11px] text-mute mt-1">No pickups, returns or refunds need attention right now.</p>
                      </div>
                    ) : (
                      alerts.map((a, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (a.type === "CARE_OVERDUE") router.push(`/erp/operations/laundry`);
                            else router.push(`/erp/bookings?orderId=${a.refId}`);
                            setShowNotifMenu(false);
                          }}
                          className="w-full text-left p-3.5 hover:bg-ivory cursor-pointer"
                        >
                          <div className="flex items-start gap-2.5">
                            {a.type.includes("OVERDUE") ? (
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-ink">{a.title}</div>
                              <p className="text-ink-soft text-[11px] mt-0.5 leading-snug">{a.message}</p>
                              {a.date && <span className="num text-[10px] text-mute mt-1 block">{a.date}</span>}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* studio / user badge */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 p-1 pr-3 bg-white hover:bg-ivory border border-line rounded-lg min-h-10"
                aria-label="Account menu"
                aria-expanded={showUserMenu}
              >
                <div className="w-8 h-8 rounded-md bg-plum text-gold-light flex items-center justify-center font-display font-bold text-xs shrink-0 ring-1 ring-gold/40">
                  BF
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-semibold text-ink leading-none">{user?.name || "Barnali User"}</div>
                  <div className="text-[10px] text-mute font-medium mt-1 leading-none">{getRoleLabel(user?.role)}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-mute" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-line rounded-xl shadow-[0_12px_32px_rgba(60,40,20,0.16)] p-2 z-50 text-xs animate-in fade-in slide-in-from-top-1 space-y-2">
                  <div className="p-3 bg-ivory rounded-lg border border-line-soft">
                    <div className="font-semibold text-ink text-sm">{user?.name || "Barnali User"}</div>
                    <div className="num text-[10px] text-mute mt-0.5">@{user?.username} · {user?.role}</div>
                  </div>
                  <div className="pt-1 border-t border-line-soft space-y-1">
                    <Link
                      href="/"
                      target="_blank"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center justify-between px-2.5 min-h-10 rounded-lg text-ink-soft hover:bg-ivory font-medium"
                    >
                      <span>Public storefront</span>
                      <ExternalLink className="w-3.5 h-3.5 text-mute" />
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-1.5 px-2.5 min-h-10 rounded-lg text-rose-700 hover:bg-rose-50 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MOBILE & TABLET SLIDE-OVER NAVIGATION DRAWER (< 1024px)   */}
      {/* ========================================================= */}
      {showMobileDrawer && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setShowMobileDrawer(false)}
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Slide-over Drawer Content */}
          <div className="relative bg-white w-4/5 max-w-xs h-full shadow-2xl flex flex-col justify-between p-4 z-10 animate-in slide-in-from-left duration-200">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-line-soft">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-plum text-gold-light flex items-center justify-center font-display font-bold text-base ring-1 ring-gold/40">
                    B
                  </div>
                  <div>
                    <div className="font-display font-semibold tracking-wide text-ink text-[15px] leading-tight">
                      BARNALI FASHION
                    </div>
                    <div className="text-[10px] text-stone-500 leading-tight mt-0.5">
                      Rental Studio · Bargarh
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileDrawer(false)}
                  className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-stone-700 rounded-lg"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="py-3 space-y-1 text-xs">
                <div className="px-2 pb-1 eyebrow">
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
                      className={`flex items-center gap-3 px-3 min-h-11 rounded-xl font-medium transition-colors ${
                        isActive
                          ? "bg-plum/10 text-plum font-semibold"
                          : "text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${isActive ? "text-plum" : "text-stone-400"}`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <Link
                  href="/"
                  target="_blank"
                  onClick={() => setShowMobileDrawer(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-stone-700 hover:bg-stone-50 font-medium"
                >
                  <span className="flex items-center gap-3">
                    <ExternalLink className="w-4 h-4 text-stone-400" />
                    <span>Storefront</span>
                  </span>
                  <span className="text-[10px] text-stone-400">View &rarr;</span>
                </Link>
              </div>

              {/* Active User on Mobile Drawer */}
              <div className="pt-2 border-t border-line-soft">
                <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase text-stone-400 tracking-wider">
                  Logged In Account
                </div>
                {user ? (
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-stone-800">{user.name}</div>
                      <div className="text-[10px] text-stone-500 font-mono capitalize">
                        {user.role} · @{user.username}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowMobileDrawer(false);
                        logout();
                      }}
                      className="px-2.5 py-1 text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold rounded-lg border border-rose-200"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/erp/login"
                    onClick={() => setShowMobileDrawer(false)}
                    className="block text-center py-2 bg-plum text-white rounded-lg font-semibold text-xs"
                  >
                    Staff Login
                  </Link>
                )}
              </div>
            </div>

            {/* Drawer Footer: Studio Address */}
            <div className="pt-3 border-t border-line-soft space-y-2 text-xs">
              <div className="p-2.5 bg-ivory rounded-xl border border-line-soft text-[11px] text-stone-600 leading-snug">
                <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-plum" />
                  <span>Bargarh Studio</span>
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">LIC Office Rd, Bargarh</div>
                <div className="text-[10px] text-stone-500 font-mono mt-0.5">+91 7978256488</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FAST OPERATOR SEARCH MODAL (CMD+K / SEARCH ICON)          */}
      {/* ========================================================= */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-start justify-center pt-3 md:pt-20 px-3 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-line w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-3.5 border-b border-line-soft flex items-center gap-2.5">
              <Search className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search Costume ID (LF-001, SH-001), Client, Phone, Order..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs md:text-sm text-stone-900 focus:outline-hidden placeholder:text-stone-400 bg-transparent"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-stone-600 rounded-lg"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[70vh] md:max-h-96 overflow-y-auto p-3 space-y-3 text-xs">
              {searchQuery.trim() === "" ? (
                <div className="text-center py-6 text-stone-400">
                  <p className="section-title text-base">Quick shop search</p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Enter Costume ID (`LF-001`), customer mobile number, or booking code.
                  </p>
                </div>
              ) : (
                <>
                  {filteredGarments.length > 0 && (
                    <div>
                      <div className="font-semibold eyebrow-mute mb-1.5 flex items-center gap-1.5">
                        <Shirt className="w-3 h-3 text-plum" />
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
                            className="p-2.5 hover:bg-stone-50 rounded-xl cursor-pointer flex items-center justify-between border border-line-soft"
                          >
                            <div>
                              <span className="font-mono font-bold text-plum mr-2">
                                {g.id}
                              </span>
                              <span className="font-medium text-stone-900">{g.name}</span>
                              <span className="text-stone-400 text-[11px] ml-1.5">
                                · Rack: {g.rack || "Unassigned"}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                              {g.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredBookings.length > 0 && (
                    <div>
                      <div className="font-semibold eyebrow-mute mb-1.5 flex items-center gap-1.5">
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
                            className="p-2.5 hover:bg-stone-50 rounded-xl cursor-pointer flex items-center justify-between border border-line-soft"
                          >
                            <div>
                              <span className="font-mono font-bold text-stone-900 mr-2">
                                {b.id}
                              </span>
                              <span className="font-medium text-stone-800">{b.customer?.name}</span>
                              <span className="text-stone-400 text-[11px] ml-1.5 font-mono">
                                {b.customer?.phone}
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
                      <div className="font-semibold eyebrow-mute mb-1.5 flex items-center gap-1.5">
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
                            className="p-2.5 hover:bg-stone-50 rounded-xl cursor-pointer flex items-center justify-between border border-line-soft"
                          >
                            <div>
                              <span className="font-semibold text-stone-900 mr-2">{c.name}</span>
                              <span className="text-stone-400 text-[11px] font-mono">
                                {c.phone} · {c.city || "Bargarh"}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
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
                      <div className="text-center py-6 text-stone-400">
                        Nothing matches &ldquo;{searchQuery}&rdquo;. Try a costume code (LF-001), a 10-digit mobile number or a booking code.
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
