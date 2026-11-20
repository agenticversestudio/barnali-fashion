"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Shirt,
  Users,
  ClipboardCheck,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Menu,
  X,
  BellRing,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DataStore } from "@/lib/dataStore";

export function ErpSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alertCount, setAlertCount] = useState<number>(0);

  useEffect(() => {
    // Check 4-day & 3-day alerts count
    const alerts = DataStore.getDeliveryAlerts();
    const count = alerts.alerts4Days.length + alerts.alerts3Days.length + alerts.overdueReturns.length;
    setAlertCount(count);
  }, [pathname]);

  const primaryNav = [
    {
      label: "Dashboard & Delivery Alerts",
      subLabel: "4-Day / 3-Day Alerts & Calendar",
      href: "/erp/dashboard",
      icon: LayoutDashboard,
      badge: alertCount > 0 ? `${alertCount} Alerts` : undefined,
      badgeColor: "bg-rose-500 text-white animate-pulse",
    },
    {
      label: "Costumes / Stock",
      subLabel: "Exact 11 Fields & 6 Status Dots",
      href: "/erp/inventory",
      icon: Shirt,
    },
    {
      label: "Counter Orders (5-Step)",
      subLabel: "Book, Advance, Handover, Return",
      href: "/erp/bookings",
      icon: ClipboardCheck,
    },
    {
      label: "Stitching & Dry Clean",
      subLabel: "Out Date / Rcv Date Khata",
      href: "/erp/operations/laundry",
      icon: Sparkles,
    },
  ];

  const secondaryNav = [
    {
      label: "Availability Calendar",
      href: "/erp/calendar",
      icon: CalendarDays,
    },
    {
      label: "Customer Directory",
      href: "/erp/customers",
      icon: Users,
    },
  ];

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-[#4B1835] text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-[#D4B67F]"
        aria-label="Toggle Navigation"
      >
        {mobileOpen ? <X className="w-5 h-5 text-[#D4B67F]" /> : <Menu className="w-5 h-5 text-[#D4B67F]" />}
      </button>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-xs z-40"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 w-64 bg-[#FBF9F5] border-r border-[#EFE9DD] flex flex-col z-40 transition-transform duration-300 lg:translate-x-0 shadow-sm",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-[#EFE9DD] flex items-center justify-between bg-white">
          <Link href="/erp/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#4B1835] flex items-center justify-center text-[#D4B67F] font-serif font-black text-lg shadow-sm border border-[#6A254D]">
              BF
            </div>
            <div>
              <div className="font-serif font-bold text-sm tracking-wide text-[#27222A]">BARNALI FASHION</div>
              <div className="text-[10px] text-[#8C6F3B] font-medium tracking-wider flex items-center gap-1.5">
                <span>BARGARH, ODISHA</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
            </div>
          </Link>
        </div>

        {/* 6 Status Legend Quick Strip */}
        <div className="px-3 py-2 bg-[#F5EFE6] border-b border-[#E8DFD1] text-[10px] text-[#5C4D3C]">
          <div className="font-semibold text-[10px] uppercase tracking-wider text-[#8C6F3B] mb-1">
            Costume Statuses:
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-medium">
            <span className="flex items-center gap-1">🟢 Available</span>
            <span className="flex items-center gap-1">🟠 Booked</span>
            <span className="flex items-center gap-1">🔵 Out on rent</span>
            <span className="flex items-center gap-1">🟣 Cleaning</span>
            <span className="flex items-center gap-1">🔴 Damaged</span>
            <span className="flex items-center gap-1">⚫ Unavailable</span>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8C6F3B]">
              Counter Operations
            </div>
            <div className="space-y-1">
              {primaryNav.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/erp/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-start justify-between p-2.5 rounded-xl transition-all group",
                      isActive
                        ? "bg-[#4B1835] text-white shadow-sm font-semibold"
                        : "text-[#4A424D] hover:bg-[#F3EFE7] hover:text-[#27222A]"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <Icon
                        className={cn(
                          "w-4 h-4 mt-0.5 shrink-0 transition-colors",
                          isActive ? "text-[#D4B67F]" : "text-[#8C6F3B] group-hover:text-[#4B1835]"
                        )}
                      />
                      <div>
                        <div className="text-xs leading-tight font-medium">{item.label}</div>
                        <div
                          className={cn(
                            "text-[10px] leading-tight mt-0.5",
                            isActive ? "text-[#D4B67F]/90" : "text-gray-500"
                          )}
                        >
                          {item.subLabel}
                        </div>
                      </div>
                    </div>
                    {item.badge && (
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase", item.badgeColor)}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8C6F3B]">
              Quick Reference
            </div>
            <div className="space-y-1">
              {secondaryNav.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all group",
                      isActive
                        ? "bg-[#4B1835] text-white font-semibold"
                        : "text-[#4A424D] hover:bg-[#F3EFE7] hover:text-[#27222A]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive ? "text-[#D4B67F]" : "text-[#8C6F3B] group-hover:text-[#4B1835]"
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick External Links */}
          <div className="border-t border-[#EFE9DD] pt-3 space-y-1.5">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-[#4B1835] hover:bg-[#F3EFE7] border border-[#E8DFD1]"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-[#8C6F3B]" />
                <span>Customer Website</span>
              </span>
              <span className="text-[10px] text-gray-500">Live</span>
            </Link>

            <button
              onClick={() => {
                if (confirm("Reset demo data to factory defaults?")) {
                  DataStore.resetAll();
                  window.location.reload();
                }
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-gray-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>

        {/* Store Footer */}
        <div className="p-3 border-t border-[#EFE9DD] bg-white text-[11px] text-gray-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[#4B1835] font-semibold">Store Counter Ready</span>
          </div>
          <span className="text-gray-400 font-mono text-[10px]">Bargarh</span>
        </div>
      </aside>
    </>
  );
}
