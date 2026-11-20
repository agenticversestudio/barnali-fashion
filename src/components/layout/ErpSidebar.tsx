"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Shirt,
  Users,
  ClipboardList,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DataStore } from "@/lib/dataStore";

export function ErpSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alertCount, setAlertCount] = useState<number>(0);

  useEffect(() => {
    const alerts = DataStore.getDeliveryAlerts();
    const count = alerts.alerts4Days.length + alerts.alerts3Days.length + alerts.overdueReturns.length;
    setAlertCount(count);
  }, [pathname]);

  const navItems = [
    {
      label: "Dashboard",
      href: "/erp/dashboard",
      icon: LayoutDashboard,
      badge: alertCount > 0 ? alertCount : undefined,
    },
    {
      label: "Orders",
      href: "/erp/bookings",
      icon: ClipboardList,
    },
    {
      label: "Inventory",
      href: "/erp/inventory",
      icon: Shirt,
    },
    {
      label: "Care & Laundry",
      href: "/erp/operations/laundry",
      icon: Sparkles,
    },
    {
      label: "Calendar",
      href: "/erp/calendar",
      icon: CalendarDays,
    },
    {
      label: "Customers",
      href: "/erp/customers",
      icon: Users,
    },
  ];

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed bottom-5 right-5 z-50 p-3 bg-[#6B1D2F] text-white rounded-full shadow-lg flex items-center justify-center border border-white/20 hover:bg-[#551624] transition-all"
        aria-label="Toggle Navigation"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-[#E2E8F0] flex flex-col z-40 transition-transform duration-200 lg:translate-x-0 shadow-xs",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header (Sleek SaaS Style) */}
        <div className="h-16 px-6 border-b border-[#E2E8F0] flex items-center justify-between">
          <Link href="/erp/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#6B1D2F] flex items-center justify-center text-white font-semibold text-sm shadow-xs">
              BF
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight text-slate-900 leading-none">
                Barnali
              </div>
              <div className="text-[11px] text-slate-500 font-normal mt-1 leading-none">
                Rental Studio · Bargarh
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Workspace
          </div>

          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/erp/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors group",
                  isActive
                    ? "bg-[#6B1D2F]/8 text-[#6B1D2F] font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-[#6B1D2F]" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#6B1D2F]/10 text-[#6B1D2F]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer Area */}
        <div className="p-4 border-t border-[#E2E8F0] space-y-1.5 bg-slate-50/50">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Customer Storefront</span>
            </span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </Link>

          <button
            onClick={() => {
              if (confirm("Reset demo data to initial state?")) {
                DataStore.resetAll();
                window.location.reload();
              }
            }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-normal text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </aside>
    </>
  );
}