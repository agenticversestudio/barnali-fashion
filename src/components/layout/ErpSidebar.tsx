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

const OPERATIONS_NAV = [
  { label: "Dashboard", href: "/erp/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/erp/bookings", icon: ClipboardList },
  { label: "Calendar", href: "/erp/calendar", icon: CalendarDays },
  { label: "Care & Laundry", href: "/erp/operations/laundry", icon: Sparkles },
];

const CLIENT_NAV = [
  { label: "Customer Directory", href: "/erp/customers", icon: Users },
];

const INVENTORY_NAV = [
  { label: "Costumes & Rack", href: "/erp/inventory", icon: Shirt },
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
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center justify-between min-h-10 pl-3.5 pr-3 rounded-[10px] text-[13px] transition-all",
        active
          ? "bg-plum text-white font-semibold shadow-[0_2px_8px_-1px_rgba(122,22,36,0.35)]"
          : "text-ink-soft font-medium hover:bg-ivory hover:text-ink"
      )}
    >
      {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-gold" />}
      <span className="flex items-center gap-3">
        <Icon strokeWidth={1.75} className={cn("w-4 h-4 shrink-0 transition-colors", active ? "text-gold" : "text-mute group-hover:text-plum")} />
        <span className="truncate">{label}</span>
      </span>
      {badge !== undefined && (
        <span
          className={cn(
            "num text-[10px] font-semibold px-2 min-w-5 text-center py-0.5 rounded-full border",
            active ? "bg-white/20 text-white border-white/30" : "bg-rose-50 text-rose-800 border-rose-200"
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
    <aside className="hidden lg:flex fixed top-0 bottom-0 left-0 w-64 bg-sand border-r border-line flex-col z-30 select-none">
      {/* Brand */}
      <div className="h-16 px-5 border-b border-line flex items-center bg-sand">
        <Link href="/erp/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-plum border border-gold/50 flex items-center justify-center shadow-xs p-0.5">
            <div className="w-full h-full rounded-lg border border-gold/40 flex items-center justify-center font-display font-bold text-sm text-gold-soft tracking-wider">
              BF
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-display font-semibold text-[15px] tracking-wide text-ink leading-none">BARNALI FASHION</div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[9.5px] font-semibold tracking-wider text-gold leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              <span className="uppercase">BOUTIQUE ERP · BARGARH</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Costume-state legend: the same 6 states used on every screen */}
      <div className="px-4 py-2.5 bg-ivory-deep/70 border-b border-line">
        <div className="eyebrow mb-1.5 text-[9.5px] text-gold">Costume States</div>
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-1">
          {COSTUME_STATES.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5 text-[10.5px] text-ink-soft leading-none">
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />
              <span className="truncate">{s.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3.5 space-y-4" aria-label="Main">
        {/* OPERATIONS */}
        <div className="space-y-1">
          <div className="eyebrow px-3 pb-1 text-mute">OPERATIONS</div>
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
        <div className="space-y-1 pt-2 border-t border-line/60">
          <div className="eyebrow px-3 pb-1 text-mute">CLIENT BOOK</div>
          {CLIENT_NAV.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </div>

        {/* INVENTORY & LEDGER */}
        <div className="space-y-1 pt-2 border-t border-line/60">
          <div className="eyebrow px-3 pb-1 text-mute">INVENTORY &amp; LEDGER</div>
          {INVENTORY_NAV.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </div>

        {isAdmin && (
          <div className="space-y-1 pt-2 border-t border-line/60">
            <div className="eyebrow px-3 pb-1 text-mute">ADMIN &amp; FINANCIALS</div>
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />
            ))}
          </div>
        )}
      </nav>

      {/* Account + studio */}
      <div className="p-3 border-t border-line bg-sand space-y-2">
        {user ? (
          <div className="p-2.5 bg-white rounded-xl border border-line shadow-2xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs",
                  isAdmin ? "bg-plum text-gold-soft" : "bg-ink-soft text-white"
                )}
              >
                {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-ink truncate leading-tight">{user.name}</div>
                <div className="num text-[10px] text-ink-soft capitalize leading-tight mt-0.5">
                  {user.role} · @{user.username}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Log out"
              aria-label="Log out"
              className="w-10 h-10 flex items-center justify-center text-mute hover:text-rose-800 hover:bg-rose-50 rounded-lg shrink-0 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Link
            href="/erp/login"
            className="w-full min-h-10 flex items-center justify-center bg-plum hover:bg-plum-dark text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            Staff Login
          </Link>
        )}

        <div className="px-3 py-1.5 bg-ivory-deep/80 rounded-lg text-[10.5px] text-ink-soft border border-line flex items-center justify-between">
          <span className="truncate">LIC Office Rd, Bargarh</span>
          <Link href="/" target="_blank" aria-label="Open public storefront" className="text-mute hover:text-plum shrink-0 ml-2">
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
