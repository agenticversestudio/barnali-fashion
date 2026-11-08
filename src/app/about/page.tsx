import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  Building2,
  Heart,
  Shirt,
  Users,
} from "lucide-react";
import { WebsiteHeader } from "@/components/layout/WebsiteHeader";
import { WebsiteFooter } from "@/components/layout/WebsiteFooter";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col font-sans">
      <WebsiteHeader />

      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
          {/* Hero */}
          <div className="text-center space-y-2">
            <span className="text-xs text-[#8C6F3B] font-bold uppercase tracking-wider">
              Our Story &amp; Heritage
            </span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#27222A]">
              About Barnali Fashion
            </h1>
            <p className="text-xs text-gray-600 max-w-xl mx-auto leading-relaxed">
              Bringing royal Indian bridal couture and luxury occasion wear to the families of Bargarh, Sambalpur, and Western Odisha through sustainable fashion rental.
            </p>
          </div>

          {/* Story Narrative */}
          <div className="bg-white p-8 md:p-10 rounded-3xl border border-[#EFE9DD] shadow-xs space-y-6 text-xs text-gray-700 leading-relaxed">
            <h2 className="font-serif font-bold text-xl text-[#4B1835]">
              Redefining Wedding Fashion in Bargarh
            </h2>
            <p>
              Weddings and festivals are the most cherished moments of our lives. Yet, for decades, brides, grooms, and their families have faced a costly dilemma: spending tens of thousands of rupees purchasing heavy zardozi lehengas and royal sherwanis that are worn for a single evening and then locked away in suitcases forever.
            </p>
            <p>
              <strong>Barnali Fashion</strong> was founded in Bargarh to eliminate this burden. We curate authentic bridal velvet lehengas, pure Banarasi raw silk sherwanis, temple-border Kanjeevarams, and contemporary cocktail gowns — maintaining each outfit to impeccable pristine standards.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#EFE9DD]">
              <div className="p-4 bg-[#FAF5EB] rounded-2xl border border-[#E8DFD1]">
                <Sparkles className="w-5 h-5 text-[#B89558] mb-2" />
                <div className="font-bold text-gray-900 text-sm">Finest Craftsmanship</div>
                <div className="text-gray-500 text-[11px] mt-1">
                  Hand-embroidered zardozi, dabka, mirror work, and real zari weaves.
                </div>
              </div>

              <div className="p-4 bg-[#FAF5EB] rounded-2xl border border-[#E8DFD1]">
                <ShieldCheck className="w-5 h-5 text-[#4B1835] mb-2" />
                <div className="font-bold text-gray-900 text-sm">Medical-Grade Hygiene</div>
                <div className="text-gray-500 text-[11px] mt-1">
                  Quarantine and professional hydrocarbon steam sanitization after every single wear.
                </div>
              </div>

              <div className="p-4 bg-[#FAF5EB] rounded-2xl border border-[#E8DFD1]">
                <Heart className="w-5 h-5 text-rose-600 mb-2" />
                <div className="font-bold text-gray-900 text-sm">Sustainable Luxury</div>
                <div className="text-gray-500 text-[11px] mt-1">
                  Circular fashion economy that reduces textile waste while saving you 90% of retail cost.
                </div>
              </div>
            </div>
          </div>

          {/* Showroom Location Banner */}
          <div className="bg-[#FAF5EB] p-8 rounded-3xl border border-[#E8DFD1] text-xs space-y-4">
            <div className="font-serif font-bold text-lg text-gray-900">
              Visit Our Flagship Bargarh Boutique
            </div>
            <p className="text-gray-600 leading-relaxed">
              Located conveniently in front of the LIC Office near Keshariya Restaurant on Bargarh Road. Step into our spacious fitting suites with full-length bridal mirrors, matching jewelry try-ons, and personal consultations with our master stylists.
            </p>
            <div>
              <Link
                href="/contact"
                className="bg-[#4B1835] hover:bg-[#320F23] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors inline-block"
              >
                Store Directions &amp; Timings →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <WebsiteFooter />
    </div>
  );
}
