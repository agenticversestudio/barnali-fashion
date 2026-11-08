import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  Calendar,
  RotateCcw,
  Shirt,
  Scissors,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { WebsiteHeader } from "@/components/layout/WebsiteHeader";
import { WebsiteFooter } from "@/components/layout/WebsiteFooter";

export default function HowItWorksPage() {
  const faqs = [
    {
      q: "How many days is the standard rental period?",
      a: "Our standard rental covers 3 days: Pickup day (1 day before your celebration), the Event day, and Return day (before 7:00 PM). Additional extension days are available for destination weddings at ₹500/day.",
    },
    {
      q: "Do I need to wash or dry-clean the outfit before returning?",
      a: "No! Please do NOT attempt to wash, soak, or machine clean the garments yourself. Heavy bridal zardozi and raw silks require delicate hydrocarbon cleaning. We manage all sanitization and dry cleaning in-house.",
    },
    {
      q: "When and how do I receive my security deposit back?",
      a: "Your security deposit is 100% refundable. When you return the outfit, our counter staff completes a quick 3-minute physical inspection for missing pieces or major tears. Your deposit is immediately refunded via Cash or UPI.",
    },
    {
      q: "Will the bridal lehenga or sherwani fit my exact measurements?",
      a: "Yes! Every rental booking includes a complimentary fitting session with our in-house master tailor, Master Salim. We adjust the blouse chest/waist and lehenga drawstring hook to your exact fit.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col font-sans">
      <WebsiteHeader />

      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="text-xs text-[#8C6F3B] font-bold uppercase tracking-wider">
              Hassle-Free Experience
            </span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#27222A]">
              How Clothing Rental Works
            </h1>
            <p className="text-xs text-gray-600 max-w-xl mx-auto">
              Enjoy authentic luxury designer fashion without paying exorbitant retail prices or worrying about garment storage and dry cleaning.
            </p>
          </div>

          {/* 4 Step In-Depth Guide */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#EFE9DD] shadow-xs flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-12 h-12 rounded-2xl bg-[#4B1835] text-[#D4B67F] font-bold text-lg flex items-center justify-center shrink-0">
                01
              </div>
              <div className="space-y-1 text-xs">
                <h3 className="font-serif font-bold text-base text-gray-900">
                  Select Your Outfit &amp; Trial Fitting
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Browse our catalogue online or walk into our showroom in front of the LIC Office on Bargarh Road. Try on multiple lehengas, sherwanis, or gowns in our air-conditioned fitting suite.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#EFE9DD] shadow-xs flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-12 h-12 rounded-2xl bg-[#4B1835] text-[#D4B67F] font-bold text-lg flex items-center justify-center shrink-0">
                02
              </div>
              <div className="space-y-1 text-xs">
                <h3 className="font-serif font-bold text-base text-gray-900">
                  Reserve for Your Event Dates
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Lock your favorite outfit with an advance token payment. Our system reserves that physical garment unit and blocks overlapping dates to ensure it is guaranteed for your wedding day.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#EFE9DD] shadow-xs flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-12 h-12 rounded-2xl bg-[#4B1835] text-[#D4B67F] font-bold text-lg flex items-center justify-center shrink-0">
                03
              </div>
              <div className="space-y-1 text-xs">
                <h3 className="font-serif font-bold text-base text-gray-900">
                  Pickup Pristine &amp; Ready to Wear
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Collect your tailored, steam-pressed outfit 1 day before the event. Pay the remaining rental balance and refundable security deposit. Handed over in a protective dust cover bag.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#EFE9DD] shadow-xs flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-12 h-12 rounded-2xl bg-[#4B1835] text-[#D4B67F] font-bold text-lg flex items-center justify-center shrink-0">
                04
              </div>
              <div className="space-y-1 text-xs">
                <h3 className="font-serif font-bold text-base text-gray-900">
                  Return &amp; Receive 100% Deposit Refund
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Bring the outfit back on the designated return date. No need to wash it. Following a quick condition check, your security deposit is refunded on the spot via Cash or UPI.
                </p>
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div className="bg-white p-8 rounded-3xl border border-[#EFE9DD] shadow-xs space-y-6 text-xs">
            <div className="font-serif font-bold text-xl text-[#27222A] flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#B89558]" />
              <span>Frequently Asked Questions</span>
            </div>

            <div className="divide-y divide-[#F1ECE3] space-y-4">
              {faqs.map((f, i) => (
                <div key={i} className="pt-4 first:pt-0 space-y-1">
                  <div className="font-bold text-sm text-gray-900">{f.q}</div>
                  <p className="text-gray-600 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-[#4B1835] text-white p-8 rounded-3xl text-center space-y-4">
            <h2 className="text-2xl font-serif font-bold">Have an Upcoming Celebration?</h2>
            <p className="text-xs text-[#F7F3EC]/80 max-w-md mx-auto">
              Book your fitting appointment today or visit our store in Bargarh.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/collections"
                className="bg-[#B89558] hover:bg-[#A38248] text-[#27222A] font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-colors"
              >
                Browse Collections
              </Link>
              <Link
                href="/contact"
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-6 py-3 rounded-xl border border-white/20 transition-colors"
              >
                Store Directions
              </Link>
            </div>
          </div>
        </div>
      </main>

      <WebsiteFooter />
    </div>
  );
}
