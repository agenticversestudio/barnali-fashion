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
  ChevronRight,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DataStore } from "@/lib/dataStore";
import { UserRole } from "@/types";

export function ErpSidebar() {
  const pathname = usePathname();
  const [alertCount, setAlertCount] = useState<number>(0);
  const [role, setRole] = useState<UserRole>("owner");

  useEffect(() => {
    const alerts = DataStore.getDeliveryAlerts();
    const count =
      alerts.alerts4Days.length + alerts.alerts3Days.length + alerts.overdueReturns.length;
    setAlertCount(count);
    setRole(DataStore.getCurrentRole());
  }, [pathname]);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    DataStore.setCurrentRole(newRole);
    window.location.reload();
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
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Workspace
        </div>

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
                <span className="bg-rose-50 text-rose-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-rose-200/60">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#E6E4DF] space-y-2">
        {/* Role Selector */}
        <div className="px-3 py-2 bg-[#FAF9F6] rounded-lg border border-[#EFECE6]">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-[#6B1D2F]" />
              <span>Role</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-600 capitalize">
              {role.replace("_", " ")}
            </span>
          </div>
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value as UserRole)}
            className="w-full bg-white border border-[#E6E4DF] rounded-md text-xs font-semibold text-slate-800 p-1.5 focus:outline-hidden cursor-pointer"
          >
            <option value="owner">Owner (Full Access)</option>
            <option value="sales_staff">Counter Operator</option>
            <option value="admin">Admin</option>
            <option value="laundry_staff">Care / Laundry Staff</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Storefront</span>
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
        </Link>

        <div className="px-3 py-2 bg-slate-50 rounded-lg text-[11px] text-slate-500 border border-slate-200/60 leading-snug">
          <div className="font-medium text-slate-700">Studio Location</div>
          <div className="truncate mt-0.5">LIC Office Rd, Bargarh</div>
          <div className="font-mono text-slate-400 text-[10px] mt-0.5">+91 7978256488</div>
        </div>
      </div>
    </aside>
  );
}
