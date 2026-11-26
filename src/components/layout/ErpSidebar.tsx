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
  ShieldCheck,
  User,
  LogOut,
  IndianRupee,
  Receipt,
  BarChart3,
  Settings,
  Shield,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { alertsApi } from "@/lib/api";

export function ErpSidebar() {
  const pathname = usePathname();
  const { user, isAdmin, isStaff, logout } = useAuth();
  const [alertCount, setAlertCount] = useState<number>(0);

  useEffect(() => {
    alertsApi
      .list()
      .then((res) => {
        setAlertCount(res.alerts?.length || 0);
      })
      .catch(() => {
        setAlertCount(0);
      });
  }, [pathname]);

  if (pathname === "/erp/login") return null;

  const coreNavItems = [
    {
      label: "Dashboard",
      href: "/erp/dashboard",
      icon: LayoutDashboard,
      badge: alertCount > 0 ? alertCount : undefined,
    },
    {
      label: "Orders & Billing",
      href: "/erp/bookings",
      icon: ClipboardList,
    },
    {
      label: "Inventory Assets",
      href: "/erp/inventory",
      icon: Shirt,
    },
    {
      label: "Care & Laundry",
      href: "/erp/operations/laundry",
      icon: Sparkles,
    },
    {
      label: "Calendar Matrix",
      href: "/erp/calendar",
      icon: CalendarDays,
    },
    {
      label: "Customer Records",
      href: "/erp/customers",
      icon: Users,
    },
  ];

  const adminNavItems = [
    {
      label: "Daily Cash Closing",
      href: "/erp/billing/cash-closing",
      icon: Coins,
    },
    {
      label: "Shop Expenses",
      href: "/erp/billing/expenses",
      icon: IndianRupee,
    },
    {
      label: "Deposit Register",
      href: "/erp/billing/deposits",
      icon: Receipt,
    },
    {
      label: "Financial Reports",
      href: "/erp/reports",
      icon: BarChart3,
    },
    {
      label: "Staff Accounts",
      href: "/erp/staff",
      icon: Shield,
    },
    {
      label: "Store Settings",
      href: "/erp/settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="hidden lg:flex fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-[#E6E4DF] flex-col z-30 shadow-xs">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-[#E6E4DF] flex items-center justify-between">
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
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Core Workspace */}
        <div className="space-y-1">
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Counter Operations
          </div>

          {coreNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/erp/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors group",
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
                  <span className="bg-rose-50 text-rose-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-rose-200/60">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Admin Financials (Hidden for Staff) */}
        {isAdmin && (
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Admin &amp; Financials
            </div>

            {adminNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors group",
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
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info & Active User Profile */}
      <div className="p-3.5 border-t border-[#E6E4DF] space-y-2.5">
        {user ? (
          <div className="p-2.5 bg-[#FAF9F6] rounded-xl border border-[#EFECE6] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs",
                  isAdmin ? "bg-[#6B1D2F] text-white" : "bg-slate-700 text-white"
                )}
              >
                {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate leading-tight">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono capitalize">
                  {user.role} · @{user.username}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Link
            href="/erp/login"
            className="w-full py-2 bg-[#6B1D2F] text-white rounded-lg text-xs font-bold text-center block"
          >
            Staff Login
          </Link>
        )}

        <div className="px-2.5 py-1.5 bg-slate-50 rounded-lg text-[10px] text-slate-500 border border-slate-200/60 flex items-center justify-between">
          <span className="truncate">LIC Office Rd, Bargarh</span>
          <Link href="/" target="_blank" className="text-slate-400 hover:text-slate-700">
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
