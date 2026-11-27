"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Shirt, Sparkles, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { alertsApi } from "@/lib/api";

const NAV_ITEMS = [
  { label: "Alerts", href: "/erp/dashboard", icon: Bell },
  { label: "Orders", href: "/erp/bookings", icon: ClipboardList },
  { label: "Costumes", href: "/erp/inventory", icon: Shirt },
  { label: "Return / Care", href: "/erp/operations/laundry", icon: Sparkles },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [alertCount, setAlertCount] = useState<number>(0);

  useEffect(() => {
    alertsApi
      .list()
      .then((res) => setAlertCount(res.alerts?.length || 0))
      .catch(() => setAlertCount(0));
  }, [pathname]);

  if (pathname === "/erp/login") return null;

  return (
    <nav
      aria-label="Main"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#EAE0D2] shadow-[0_-4px_16px_rgba(31,24,21,0.06)] select-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="h-16 flex items-stretch justify-around">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/erp/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          const badge = item.href === "/erp/dashboard" && alertCount > 0 ? alertCount : undefined;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex-1 min-h-11 flex flex-col items-center justify-center gap-1",
                active ? "text-[#7A1624]" : "text-[#9C8E83] active:text-[#1F1815]"
              )}
            >
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-b-full bg-[#B8893A]" />}
              <span className="relative">
                <Icon className={cn("w-[22px] h-[22px]", active ? "stroke-[2.2]" : "stroke-[1.75]")} />
                {badge !== undefined && (
                  <span className="num absolute -top-1.5 -right-3 min-w-4 text-center bg-[#9F1239] text-white text-[9px] font-bold px-1 py-px rounded-full leading-tight ring-2 ring-white">
                    {badge}
                  </span>
                )}
              </span>
              <span className={cn("text-[11px] leading-none tracking-tight", active ? "font-semibold" : "font-medium")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
