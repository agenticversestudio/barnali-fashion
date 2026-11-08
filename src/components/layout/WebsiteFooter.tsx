import React from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Clock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export function WebsiteFooter() {
  return (
    <footer className="bg-[#27222A] text-white border-t-4 border-[#B89558]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
          {/* Col 1: Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#4B1835] text-[#D4B67F] font-serif font-black flex items-center justify-center text-lg border border-[#B89558]">
                BF
              </div>
              <div className="font-serif font-bold text-base tracking-wider text-white">
                BARNALI FASHION
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed text-[11px]">
              Bargarh&apos;s premier destination for bridal lehengas, royal sherwanis, party gowns, and festive occasion wear on rental. Look extraordinary without the burden of buying.
            </p>
            <div className="pt-2">
              <Link
                href="/erp/dashboard"
                className="inline-flex items-center gap-1.5 text-[11px] bg-[#4B1835] hover:bg-[#320F23] text-[#D4B67F] font-bold px-3 py-1.5 rounded-lg border border-[#B89558]/40 transition-colors"
              >
                <span>Store Management ERP</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Col 2: Rental Collections */}
          <div className="space-y-2">
            <div className="font-serif font-bold text-sm text-[#D4B67F] uppercase tracking-wider mb-3">
              Rental Categories
            </div>
            <ul className="space-y-1.5 text-gray-300">
              <li>
                <Link href="/collections" className="hover:text-white transition-colors">
                  Bridal Velvet &amp; Zardozi Lehengas
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-white transition-colors">
                  Groom Raw Silk Sherwanis &amp; Safas
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-white transition-colors">
                  Evening Reception Cocktail Gowns
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-white transition-colors">
                  Pure Kanjeevaram Temple Silk Sarees
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-white transition-colors">
                  Indo-Western Bandhgalas &amp; Shararas
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-white transition-colors">
                  Kids Festive Celebration Outfits
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: How Rental Works */}
          <div className="space-y-2">
            <div className="font-serif font-bold text-sm text-[#D4B67F] uppercase tracking-wider mb-3">
              Why Rent with Us
            </div>
            <ul className="space-y-1.5 text-gray-400 text-[11px]">
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#B89558] shrink-0 mt-0.5" />
                <span>100% Sanitized &amp; Steam Cleaned before every handover</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#B89558] shrink-0 mt-0.5" />
                <span>Custom Alterations &amp; Blouse Fitting by Master Tailors</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#B89558] shrink-0 mt-0.5" />
                <span>Zero Hidden Fees: Clear Refundable Security Deposit</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Store Visit & Timings */}
          <div className="space-y-2">
            <div className="font-serif font-bold text-sm text-[#D4B67F] uppercase tracking-wider mb-3">
              Store Location &amp; Hours
            </div>
            <div className="space-y-2 text-gray-300 text-[11px]">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#B89558] shrink-0 mt-0.5" />
                <span>
                  In front of LIC Office, near Keshariya Restaurant, Bargarh Road, Bargarh, Odisha — 768028
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#B89558] shrink-0" />
                <a href="tel:+917978256488" className="hover:text-white font-mono font-bold">
                  +91 7978256488
                </a>
              </div>
              <div className="flex items-start gap-2 text-gray-400">
                <Clock className="w-4 h-4 text-[#B89558] shrink-0 mt-0.5" />
                <div>
                  <div>Mon – Sat: 9:30 AM – 8:30 PM</div>
                  <div>Sunday: 9:30 AM – 1:30 PM</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
          <div>
            © 2026 Barnali Fashion, Bargarh, Odisha. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <span>Client Approval Full-Stack Prototype</span>
            <span>•</span>
            <Link href="/erp/dashboard" className="text-[#D4B67F] hover:underline">
              Enter ERP Management System →
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
