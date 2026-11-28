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

const OPERATIONS_NAV = [
  { label: "Dashboard", href: "/erp/dashboard", icon: LayoutDashboard, color: "text-[#E11D48] bg-[#FFE4E6]" },
  { label: "Orders", href: "/erp/bookings", icon: ClipboardList, color: "text-[#4F46E5] bg-[#E0E7FF]" },
  { label: "Calendar", href: "/erp/calendar", icon: CalendarDays, color: "text-[#D97706] bg-[#FEF3C7]" },
  { label: "Care & Laundry", href: "/erp/operations/laundry", icon: Sparkles, color: "text-[#0284C7] bg-[#E0F2FE]" },
];

const CLIENT_NAV = [
  { label: "Customer Directory", href: "/erp/customers", icon: Users, color: "text-[#7C3AED] bg-[#EDE9FE]" },
];

const INVENTORY_NAV = [
  { label: "Costumes & Rack", href: "/erp/inventory", icon: Shirt, color: "text-[#059669] bg-[#D1FAE5]" },
];

const ADMIN_NAV = [
  { label: "Daily Cash Closing", href: "/erp/billing/cash-closing", icon: Coins, color: "text-[#D97706] bg-[#FEF3C7]" },
  { label: "Shop Expenses", href: "/erp/billing/expenses", icon: IndianRupee, color: "text-[#EA580C] bg-[#FFEDD5]" },
  { label: "Deposit Register", href: "/erp/billing/deposits", icon: Receipt, color: "text-[#059669] bg-[#D1FAE5]" },
  { label: "Financial Reports", href: "/erp/reports", icon: BarChart3, color: "text-[#4F46E5] bg-[#E0E7FF]" },
  { label: "Staff Accounts", href: "/erp/staff", icon: Shield, color: "text-[#E11D48] bg-[#FFE4E6]" },
  { label: "Store Settings", href: "/erp/settings", icon: Settings, color: "text-[#0284C7] bg-[#E0F2FE]" },
];

function NavLink({
  href,
  label,
  icon: Icon,
  color,
  active,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center justify-between min-h-10 px-2.5 rounded-xl text-[13px] transition-all",
        active
          ? "bg-gradient-to-r from-[#FFF1F2] via-[#FCE7F3] to-[#F3E8FF] text-[#9F1239] font-semibold shadow-2xs border border-[#FECDD3]/60"
          : "text-[#5B5566] font-medium hover:bg-[#F5F2F8] hover:text-[#18141E]"
      )}
    >
      <span className="flex items-center gap-2.5 min-w-0">
        <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105", color)}>
          <Icon strokeWidth={2} className="w-3.5 h-3.5" />
        </span>
        <span className="truncate">{label}</span>
      </span>
      {badge !== undefined && (
        <span
          className={cn(
            "num text-[10px] font-bold px-2 min-w-5 text-center py-0.5 rounded-full border",
            active ? "bg-[#BE123C] text-white border-[#BE123C]" : "bg-[#FFE4E6] text-[#E11D48] border-[#FECDD3]"
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

export function ErpSidebar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const [alertCount, setAlertCount] = useState<number>(0);

  useEffect(() => {
    alertsApi
      .list()
      .then((res) => setAlertCount(res.alerts?.length || 0))
      .catch(() => setAlertCount(0));
  }, [pathname]);

  if (pathname === "/erp/login") return null;

  const isActive = (href: string) => pathname === href || (href !== "/erp/dashboard" && pathname.startsWith(href));

  return (
    <aside className="hidden lg:flex fixed top-0 bottom-0 left-0 w-64 bg-white/85 backdrop-blur-xl border-r border-[#EBE6F0] flex-col z-30 select-none">
      {/* Brand */}
      <div className="h-16 px-5 border-b border-[#EBE6F0] flex items-center">
        <Link href="/erp/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#BE123C] to-[#7C3AED] flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(190,18,60,0.4)] p-0.5">
            <div className="w-full h-full rounded-[10px] border border-white/25 flex items-center justify-center font-serif font-bold text-sm text-white tracking-wider">
              BF
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[15px] tracking-tight text-[#18141E] leading-none">Barnali Fashion</div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[9.5px] font-bold tracking-wider text-[#7C3AED] leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] ring-2 ring-[#10B981]/20" />
              <span className="uppercase">BOUTIQUE ERP · BARGARH</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3.5 space-y-4" aria-label="Main">
        {/* OPERATIONS */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold tracking-wider uppercase px-3 pb-1 text-[#8C8499]">OPERATIONS</div>
          {OPERATIONS_NAV.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              active={isActive(item.href)}
              badge={item.href === "/erp/dashboard" && alertCount > 0 ? alertCount : undefined}
            />
          ))}
        </div>

        {/* CLIENT BOOK */}
        <div className="space-y-1 pt-2 border-t border-[#EBE6F0]/70">
          <div className="text-[10px] font-bold tracking-wider uppercase px-3 pb-1 text-[#8C8499]">CLIENT BOOK</div>
          {CLIENT_NAV.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </div>

        {/* INVENTORY & LEDGER */}
        <div className="space-y-1 pt-2 border-t border-[#EBE6F0]/70">
          <div className="text-[10px] font-bold tracking-wider uppercase px-3 pb-1 text-[#8C8499]">INVENTORY &amp; LEDGER</div>
          {INVENTORY_NAV.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </div>

        {isAdmin && (
          <div className="space-y-1 pt-2 border-t border-[#EBE6F0]/70">
            <div className="text-[10px] font-bold tracking-wider uppercase px-3 pb-1 text-[#8C8499]">ADMIN &amp; FINANCIALS</div>
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />
            ))}
          </div>
        )}
      </nav>

      {/* Account + studio */}
      <div className="p-3 border-t border-[#EBE6F0] bg-white/60 space-y-2">
        {user ? (
          <div className="p-2.5 bg-white rounded-xl border border-[#EBE6F0] shadow-2xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs",
                  isAdmin ? "bg-gradient-to-br from-[#BE123C] to-[#7C3AED] text-white" : "bg-[#5B5566] text-white"
                )}
              >
                {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#18141E] truncate leading-tight">{user.name}</div>
                <div className="num text-[10px] text-[#5B5566] capitalize leading-tight mt-0.5">
                  {user.role} · @{user.username}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Log out"
              aria-label="Log out"
              className="w-10 h-10 flex items-center justify-center text-[#8C8499] hover:text-[#E11D48] hover:bg-[#FFE4E6] rounded-lg shrink-0 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/erp/login"
            className="w-full min-h-10 flex items-center justify-center bg-gradient-to-r from-[#BE123C] to-[#7C3AED] text-white rounded-full text-xs font-semibold shadow-sm"
          >
            Staff Login
          </Link>
        )}

        <div className="px-3 py-1.5 bg-[#F5F2F8] rounded-lg text-[10.5px] text-[#5B5566] border border-[#EBE6F0] flex items-center justify-between">
          <span className="truncate">LIC Office Rd, Bargarh</span>
          <Link href="/" target="_blank" aria-label="Open public storefront" className="text-[#8C8499] hover:text-[#BE123C] shrink-0 ml-2">
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
