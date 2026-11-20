"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarCheck,
  Shirt,
  Sparkles,
  X,
  ExternalLink,
  RotateCcw,
  MapPin,
  Phone,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DataStore } from "@/lib/dataStore";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [alertCount, setAlertCount] = useState<number>(0);

  useEffect(() => {
    const alerts = DataStore.getDeliveryAlerts();
    const count =
      alerts.alerts4Days.length + alerts.alerts3Days.length + alerts.overdueReturns.length;
    setAlertCount(count);
  }, [pathname]);

  // Exact 4 Shop Operator Tabs
  const navItems = [
    {
      label: "Alerts",
      sublabel: "4D / 3D Alarms",
      href: "/erp/dashboard",
      icon: Bell,
      badge: alertCount > 0 ? alertCount : undefined,
    },
    {
      label: "Booking",
      sublabel: "5-Step Counter",
      href: "/erp/bookings",
      icon: ClipboardList,
    },
    {
      label: "Costumes",
      sublabel: "Stock & Racks",
      href: "/erp/inventory",
      icon: Shirt,
    },
    {
      label: "Return / Care",
      sublabel: "Refund & Care",
      href: "/erp/operations/laundry",
      icon: Sparkles,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E2E8F0] z-40 flex items-center justify-around px-1 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] select-none">
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
              "flex-1 flex flex-col items-center justify-center py-1 transition-all relative",
              isActive ? "text-[#6B1D2F] font-bold" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <div className="relative">
              <Icon
                className={cn(
                  "w-5 h-5 transition-transform",
                  isActive ? "scale-110 text-[#6B1D2F] stroke-[2.3]" : "text-slate-400 stroke-[1.8]"
                )}
              />
              {item.badge !== undefined && (
                <span className="absolute -top-1.5 -right-2.5 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full leading-tight animate-pulse">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight leading-none font-medium">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
