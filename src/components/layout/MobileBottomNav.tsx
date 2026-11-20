"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Shirt,
  Users,
  Menu,
  X,
  CalendarDays,
  Sparkles,
  ExternalLink,
  RotateCcw,
  MapPin,
  Phone,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DataStore } from "@/lib/dataStore";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [alertCount, setAlertCount] = useState<number>(0);

  useEffect(() => {
    const alerts = DataStore.getDeliveryAlerts();
    const count =
      alerts.alerts4Days.length + alerts.alerts3Days.length + alerts.overdueReturns.length;
    setAlertCount(count);
  }, [pathname]);

  const handleResetData = () => {
    if (
      confirm(
        "Reset prototype data to default initial state? All your additions in this session will be refreshed."
      )
    ) {
      DataStore.resetAll();
      window.location.reload();
    }
  };

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
      label: "Customers",
      href: "/erp/customers",
      icon: Users,
    },
  ];

  const isMoreActive =
    pathname.startsWith("/erp/operations") || pathname.startsWith("/erp/calendar");

  return (
    <>
      {/* Pinned Mobile Bottom Navigation Bar (height: 60px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-15 bg-white border-t border-[#E2E8F0] z-40 flex items-center justify-around px-1 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] select-none">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/erp/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-1.5 transition-all relative",
                isActive
                  ? "text-[#6B1D2F] font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform",
                    isActive ? "scale-110 text-[#6B1D2F]" : "text-slate-400"
                  )}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full leading-tight">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More Tab */}
        <button
          onClick={() => setShowMoreSheet(true)}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-1.5 transition-all relative",
            isMoreActive
              ? "text-[#6B1D2F] font-semibold"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          <div className="relative">
            <Menu
              className={cn(
                "w-5 h-5 transition-transform",
                isMoreActive ? "scale-110 text-[#6B1D2F]" : "text-slate-400"
              )}
            />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight leading-none">More</span>
        </button>
      </nav>

      {/* More Options Bottom Sheet */}
      {showMoreSheet && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setShowMoreSheet(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Sheet Content */}
          <div className="relative bg-white rounded-t-2xl shadow-2xl border-t border-[#E2E8F0] p-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Grab Handle */}
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#6B1D2F] text-white flex items-center justify-center font-bold text-xs">
                  BF
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900">Barnali Fashion</div>
                  <div className="text-[10px] text-slate-500">More Tools & Studio Actions</div>
                </div>
              </div>
              <button
                onClick={() => setShowMoreSheet(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav Links */}
            <div className="py-3 space-y-1">
              <Link
                href="/erp/operations/laundry"
                onClick={() => setShowMoreSheet(false)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl text-xs font-medium transition-colors",
                  pathname.startsWith("/erp/operations/laundry")
                    ? "bg-[#6B1D2F]/10 text-[#6B1D2F] font-semibold"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-800"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-[#6B1D2F]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Care & Laundry</div>
                    <div className="text-[10px] text-slate-500">
                      Tailor Stitching & Dry Clean Registers (Out / Rcv)
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/erp/calendar"
                onClick={() => setShowMoreSheet(false)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl text-xs font-medium transition-colors",
                  pathname === "/erp/calendar"
                    ? "bg-[#6B1D2F]/10 text-[#6B1D2F] font-semibold"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-800"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-blue-600">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Availability Calendar</div>
                    <div className="text-[10px] text-slate-500">
                      Costume event schedule & cleaning buffers
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/"
                target="_blank"
                onClick={() => setShowMoreSheet(false)}
                className="flex items-center justify-between p-3 rounded-xl text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-emerald-600">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Client Storefront</div>
                    <div className="text-[10px] text-slate-500">
                      Public rental catalogue & fitting booking
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            {/* Studio Info & Reset */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-[#6B1D2F]" />
                  <span>Bargarh Studio (LIC Office Road)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 pl-5">
                  <Phone className="w-3 h-3" />
                  <span>+91 7978256488</span>
                </div>
              </div>

              <button
                onClick={handleResetData}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-medium text-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Data to Initial</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
