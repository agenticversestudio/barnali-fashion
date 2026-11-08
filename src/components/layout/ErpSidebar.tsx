"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Shirt,
  Users,
  PackageCheck,
  RotateCcw,
  Sparkles,
  Wrench,
  Receipt,
  Wallet,
  TrendingUp,
  ShieldCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Coins,
  BadgeAlert,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function ErpSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [operationsOpen, setOperationsOpen] = useState(true);
  const [financeOpen, setFinanceOpen] = useState(true);

  const mainNav: NavItem[] = [
    { label: "Dashboard", href: "/erp/dashboard", icon: LayoutDashboard },
    { label: "Bookings", href: "/erp/bookings", icon: ClipboardCheck },
    { label: "Availability Calendar", href: "/erp/calendar", icon: CalendarDays },
    { label: "Garment Inventory", href: "/erp/inventory", icon: Shirt },
    { label: "Customers & CRM", href: "/erp/customers", icon: Users },
  ];

  const operationsNav: NavItem[] = [
    { label: "Pickup / Issue", href: "/erp/operations/pickup", icon: PackageCheck },
    { label: "Return Counter", href: "/erp/operations/returns", icon: RotateCcw, badge: 1 },
    { label: "Inspection Bay", href: "/erp/operations/inspection", icon: ShieldCheck },
    { label: "Laundry & Dry Clean", href: "/erp/operations/laundry", icon: Sparkles },
    { label: "Maintenance & Tailor", href: "/erp/operations/maintenance", icon: Wrench },
  ];

  const financeNav: NavItem[] = [
    { label: "Invoices & Receipts", href: "/erp/billing/invoices", icon: Receipt },
    { label: "Deposit Ledger", href: "/erp/billing/deposits", icon: Wallet },
    { label: "Expense Tracker", href: "/erp/billing/expenses", icon: Coins },
    { label: "Daily Cash Closing", href: "/erp/billing/cash-closing", icon: BadgeAlert },
  ];

  const bottomNav: NavItem[] = [
    { label: "Analytics & Reports", href: "/erp/reports", icon: TrendingUp },
    { label: "Staff & Permissions", href: "/erp/staff", icon: ShieldCheck },
    { label: "Business Settings", href: "/erp/settings", icon: Settings },
  ];

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href || (item.href !== "/erp/dashboard" && pathname.startsWith(item.href));
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group",
          isActive
            ? "bg-[#4B1835] text-white shadow-xs font-semibold"
            : "text-[#4A424D] hover:bg-[#F3EFE7] hover:text-[#27222A]"
        )}
      >
        <span className="flex items-center gap-2.5">
          <Icon
            className={cn(
              "w-4 h-4 transition-colors",
              isActive ? "text-[#D4B67F]" : "text-[#8C6F3B] group-hover:text-[#4B1835]"
            )}
          />
          <span>{item.label}</span>
        </span>
        {item.badge !== undefined && item.badge > 0 && (
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
              isActive ? "bg-[#D4B67F] text-[#4B1835]" : "bg-rose-100 text-rose-800"
            )}
          >
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-[#4B1835] text-white rounded-full shadow-2xl flex items-center justify-center"
        aria-label="Toggle Navigation"
      >
        {mobileOpen ? <X className="w-5 h-5 text-[#D4B67F]" /> : <Menu className="w-5 h-5 text-[#D4B67F]" />}
      </button>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-40"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 w-64 bg-[#FBF9F5] border-r border-[#EFE9DD] flex flex-col z-40 transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-[#EFE9DD] flex items-center justify-between bg-white">
          <Link href="/erp/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#4B1835] flex items-center justify-center text-[#D4B67F] font-serif font-black text-lg shadow-sm border border-[#6A254D]">
              BF
            </div>
            <div>
              <div className="font-serif font-bold text-sm tracking-wide text-[#27222A]">BARNALI FASHION</div>
              <div className="text-[10px] text-[#8C6F3B] font-medium tracking-wider flex items-center gap-1">
                <span>BARGARH, ODISHA</span>
                <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                <span>ERP</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Links */}
          <div className="space-y-1">{mainNav.map(renderNavItem)}</div>

          {/* Rental Operations Group */}
          <div>
            <button
              onClick={() => setOperationsOpen(!operationsOpen)}
              className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-bold text-[#8C6F3B] uppercase tracking-wider hover:text-[#4B1835]"
            >
              <span>Rental Operations</span>
              {operationsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {operationsOpen && <div className="mt-1 space-y-1">{operationsNav.map(renderNavItem)}</div>}
          </div>

          {/* Billing & Finance Group */}
          <div>
            <button
              onClick={() => setFinanceOpen(!financeOpen)}
              className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-bold text-[#8C6F3B] uppercase tracking-wider hover:text-[#4B1835]"
            >
              <span>Billing & Finance</span>
              {financeOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {financeOpen && <div className="mt-1 space-y-1">{financeNav.map(renderNavItem)}</div>}
          </div>

          {/* Reports & Settings */}
          <div className="border-t border-[#EFE9DD] pt-3 space-y-1">
            {bottomNav.map(renderNavItem)}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-[#EFE9DD] bg-white text-[11px] text-gray-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[#4B1835] font-semibold">Store Open</span>
          </div>
          <span className="text-gray-400 font-mono">v1.0-proto</span>
        </div>
      </aside>
    </>
  );
}
