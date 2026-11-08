"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Phone,
  MessageSquare,
  Sparkles,
  Lock,
  Menu,
  X,
  MapPin,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

function WebsiteHeaderContent() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Rental Collections", href: "/collections" },
    { label: "How Rental Works", href: "/how-it-works" },
    { label: "About Barnali", href: "/about" },
    { label: "Visit Store & Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EFE9DD]">
      {/* Top Notification Announcement Bar */}
      <div className="bg-[#4B1835] text-[#F7F3EC] px-4 py-1.5 text-center text-[11px] font-medium tracking-wide flex items-center justify-center gap-2">
        <Sparkles className="w-3 h-3 text-[#D4B67F]" />
        <span>
          Wedding &amp; Festive Season Rentals Open in Bargarh, Odisha • Premium Designer Occasion Wear
        </span>
        <a
          href="tel:+917978256488"
          className="underline font-bold text-[#D4B67F] hover:text-white ml-2 hidden sm:inline"
        >
          Call: +91 7978256488
        </a>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#4B1835] text-[#D4B67F] font-serif font-black flex items-center justify-center text-xl shadow-md border border-[#6A254D]">
            BF
          </div>
          <div>
            <div className="font-serif font-bold text-lg md:text-xl tracking-wider text-[#27222A]">
              BARNALI FASHION
            </div>
            <div className="text-[10px] text-[#8C6F3B] tracking-widest uppercase font-semibold">
              Boutique &amp; Occasion Wear Rentals • Bargarh
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "transition-colors tracking-wide hover:text-[#4B1835]",
                  isActive ? "text-[#4B1835] font-bold border-b-2 border-[#B89558] pb-1" : "text-gray-700"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA Buttons */}
        <div className="flex items-center gap-2.5">
          <a
            href="https://wa.me/917978256488?text=Namaste%20Barnali%20Fashion,%20I%20would%20like%20to%20enquire%20about%20renting%20bridal/wedding%20outfits."
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-200" />
            <span>WhatsApp Enquiry</span>
          </a>

          {/* ERP Portal Switcher */}
          <Link
            href="/erp/dashboard"
            className="flex items-center gap-1.5 bg-[#FAF5EB] hover:bg-[#F3EFE7] text-[#4B1835] border border-[#E8DFD1] font-bold text-xs px-3 py-2 rounded-xl transition-colors shadow-2xs"
            title="Switch to Internal ERP Management Portal"
          >
            <Lock className="w-3.5 h-3.5 text-[#B89558]" />
            <span className="hidden sm:inline">ERP Portal</span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-[#4B1835]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#EFE9DD] px-6 py-4 space-y-3 text-xs animate-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 font-semibold text-gray-800 hover:text-[#4B1835] border-b border-gray-100"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://wa.me/917978256488"
            className="block w-full py-2.5 bg-emerald-700 text-white text-center font-bold rounded-xl mt-2"
          >
            WhatsApp +91 7978256488
          </a>
        </div>
      )}
    </header>
  );
}

export function WebsiteHeader() {
  return (
    <Suspense fallback={<header className="h-20 bg-white border-b border-[#EFE9DD]" />}>
      <WebsiteHeaderContent />
    </Suspense>
  );
}
