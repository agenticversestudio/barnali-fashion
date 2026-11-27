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

/** The 6 costume states every screen uses; dot colours match <StatusBadge>. */
const COSTUME_STATES = [
  { label: "Available", dot: "bg-emerald-500" },
  { label: "Booked", dot: "bg-amber-500" },
  { label: "Out on rent", dot: "bg-sky-500" },
  { label: "Cleaning", dot: "bg-violet-500" },
  { label: "Damaged / Repair", dot: "bg-rose-500" },
  { label: "Unavailable", dot: "bg-stone-500" },
];

const CORE_NAV = [
  { label: "Dashboard", href: "/erp/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/erp/bookings", icon: ClipboardList },
  { label: "Inventory", href: "/erp/inventory", icon: Shirt },
  { label: "Care & Laundry", href: "/erp/operations/laundry", icon: Sparkles },
  { label: "Calendar", href: "/erp/calendar", icon: CalendarDays },
  { label: "Customers", href: "/erp/customers", icon: Users },
];

const ADMIN_NAV = [
  { label: "Daily Cash Closing", href: "/erp/billing/cash-closing", icon: Coins },
  { label: "Shop Expenses", href: "/erp/billing/expenses", icon: IndianRupee },
  { label: "Deposit Register", href: "/erp/billing/deposits", icon: Receipt },
  { label: "Financial Reports", href: "/erp/reports", icon: BarChart3 },
  { label: "Staff Accounts", href: "/erp/staff", icon: Shield },
  { label: "Store Settings", href: "/erp/settings", icon: Settings },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center justify-between min-h-10 pl-3.5 pr-3 rounded-lg text-[13px] transition-colors",
        active
          ? "bg-plum text-white font-semibold shadow-[0_1px_2px_rgba(75,24,53,0.25)]"
          : "text-ink-soft font-medium hover:bg-ivory-deep hover:text-ink"
      )}
    >
      {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-gold" />}
      <span className="flex items-center gap-3">
        <Icon className={cn("w-4 h-4 shrink-0", active ? "text-gold" : "text-mute group-hover:text-plum")} />
        <span>{label}</span>
      </span>
      {badge !== undefined && (
        <span
          className={cn(
            "num text-[10px] font-semibold px-1.5 min-w-5 text-center py-0.5 rounded-full border",
            active ? "bg-white/15 text-white border-white/25" : "bg-rose-50 text-rose-700 border-rose-200"
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
    <aside className="hidden lg:flex fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-line flex-col z-30">
      {/* Brand */}
      <div className="h-16 px-5 border-b border-line flex items-center">
        <Link href="/erp/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-plum flex items-center justify-center text-gold-light font-display font-bold text-base shadow-sm ring-1 ring-gold/40">
            B
          </div>
          <div className="min-w-0">
            <div className="font-display font-semibold text-[15px] tracking-wide text-ink leading-none">BARNALI FASHION</div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-medium tracking-wider text-gold-dark leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="uppercase">Rental Studio · Bargarh</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Costume-state legend: the same 6 states used on every screen */}
      <div className="px-5 py-3 bg-gold-soft/60 border-b border-line">
        <div className="eyebrow mb-2">Costume states</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {COSTUME_STATES.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5 text-[11px] text-ink-soft leading-none">
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />
              <span className="truncate">{s.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Main">
        <div className="space-y-1">
          <div className="eyebrow px-3.5 pb-1.5">Counter operations</div>
          {CORE_NAV.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              active={isActive(item.href)}
              badge={item.href === "/erp/dashboard" && alertCount > 0 ? alertCount : undefined}
            />
          ))}
        </div>

        {isAdmin && (
          <div className="space-y-1 pt-4 border-t border-line-soft">
            <div className="eyebrow px-3.5 pb-1.5">Admin &amp; financials</div>
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />
            ))}
          </div>
        )}
      </nav>

      {/* Account + studio */}
      <div className="p-3 border-t border-line space-y-2.5">
        {user ? (
          <div className="p-2.5 bg-ivory rounded-xl border border-line-soft flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  isAdmin ? "bg-plum text-gold-light" : "bg-stone-700 text-white"
                )}
              >
                {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-ink truncate leading-tight">{user.name}</div>
                <div className="num text-[10px] text-mute capitalize leading-tight mt-0.5">
                  {user.role} · @{user.username}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Log out"
              aria-label="Log out"
              className="w-10 h-10 flex items-center justify-center text-mute hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/erp/login"
            className="w-full min-h-10 flex items-center justify-center bg-plum text-white rounded-lg text-xs font-bold"
          >
            Staff Login
          </Link>
        )}

        <div className="px-3 py-2 bg-ivory rounded-lg text-[11px] text-mute border border-line-soft flex items-center justify-between">
          <span className="truncate">LIC Office Rd, Bargarh</span>
          <Link href="/" target="_blank" aria-label="Open public storefront" className="text-mute hover:text-plum shrink-0 ml-2">
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
