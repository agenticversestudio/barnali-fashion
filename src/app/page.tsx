"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  Star,
  ExternalLink,
  Lock,
} from "lucide-react";
import { WebsiteHeader } from "@/components/layout/WebsiteHeader";
import { WebsiteFooter } from "@/components/layout/WebsiteFooter";
import { formatINR } from "@/lib/utils";
import { DataStore } from "@/lib/dataStore";

export default function HomePage() {
  const [enquiryName, setEnquiryName] = useState("");
  const [enquiryPhone, setEnquiryPhone] = useState("");
  const [enquiryDate, setEnquiryDate] = useState("2026-11-25");
  const [enquiryCategory, setEnquiryCategory] = useState("Bridal Lehenga");
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const featuredProducts = [
    {
      id: "PROD-01",
      name: "Royal Zardozi Crimson Velvet Bridal Lehenga",
      category: "Bridal Lehenga",
      rentalPrice: 4500,
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=900",
      tag: "Most Popular",
    },
    {
      id: "PROD-02",
      name: "Maharaja Ivory Raw Silk Embroidered Sherwani",
      category: "Groom Sherwani",
      rentalPrice: 3800,
      image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=900",
      tag: "Groom Royal",
    },
    {
      id: "PROD-03",
      name: "Emerald Green Sequinned Cocktail Gown",
      category: "Party Gown",
      rentalPrice: 2800,
      image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=900",
      tag: "Cocktail Special",
    },
    {
      id: "PROD-04",
      name: "Temple Border Crimson Pure Kanjeevaram Saree",
      category: "Silk Saree",
      rentalPrice: 2200,
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=900",
      tag: "Pure Silk",
    },
  ];

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryName || !enquiryPhone) {
      alert("Please provide your name and phone number");
      return;
    }

    DataStore.addEnquiry({
      name: enquiryName,
      phone: enquiryPhone,
      eventDate: enquiryDate,
      categoryInterested: enquiryCategory as any,
      message: enquiryMessage,
    });

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col font-sans">
      <WebsiteHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative bg-gradient-to-b from-[#FAF5EB] via-[#FBF9F5] to-white pt-12 pb-20 md:py-24 border-b border-[#EFE9DD] overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Headline */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 bg-[#F9F1F5] border border-[#E7CDDC] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#4B1835]">
                  <Sparkles className="w-3.5 h-3.5 text-[#B89558]" />
                  <span>Western Odisha&apos;s Flagship Occasion Wear Rental Studio</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-black text-[#27222A] tracking-tight leading-[1.15]">
                  Wear Luxury. <br />
                  <span className="text-[#4B1835] italic">Rent</span> The Extraordinary.
                </h1>

                <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-xl">
                  Why spend ₹40,000+ on an outfit you will wear once? At <strong>Barnali Fashion</strong> in Bargarh, access handcrafted bridal lehengas, royal sherwanis, and luxury designer gowns at a fraction of the cost — steam-sanitized and custom-fitted for your special day.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    href="/collections"
                    className="bg-[#4B1835] hover:bg-[#320F23] text-white font-bold text-xs md:text-sm px-6 py-3.5 rounded-2xl shadow-lg transition-all flex items-center gap-2"
                  >
                    <span>Browse Rental Collections</span>
                    <ArrowRight className="w-4 h-4 text-[#D4B67F]" />
                  </Link>

                  <a
                    href="https://wa.me/917978256488?text=Namaste%20Barnali%20Fashion,%20I%20would%20like%20to%20book%20a%20bridal/wedding%20fitting%20appointment."
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs md:text-sm px-6 py-3.5 rounded-2xl shadow-md transition-all flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-200" />
                    <span>WhatsApp Fitting Enquiry</span>
                  </a>

                  <Link
                    href="/erp/dashboard"
                    className="bg-white hover:bg-[#FAF5EB] text-[#4B1835] border-2 border-[#4B1835] font-bold text-xs md:text-sm px-4 py-3 rounded-2xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#B89558]" />
                    <span>Internal ERP Demo</span>
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="pt-4 border-t border-[#EFE9DD] grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="font-bold text-[#4B1835] text-base">₹1,500 – ₹5,000</div>
                    <div className="text-gray-500 text-[11px]">Affordable 3-Day Rentals</div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-base">100% Sanitized</div>
                    <div className="text-gray-500 text-[11px]">Steam-Pressed Hygiene</div>
                  </div>
                  <div>
                    <div className="font-bold text-[#B89558] text-base">Free Alterations</div>
                    <div className="text-gray-500 text-[11px]">Master Tailor Fitting</div>
                  </div>
                </div>
              </div>

              {/* Right Hero Image Card */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md">
                  <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-[#B89558] to-[#4B1835] opacity-20 blur-xl"></div>
                  <div className="relative bg-white rounded-3xl border border-[#EFE9DD] p-3 shadow-2xl overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=900"
                      alt="Barnali Fashion Bridal Rental"
                      className="w-full h-96 object-cover rounded-2xl"
                    />
                    <div className="p-4 bg-white rounded-xl">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-[#8C6F3B] font-bold uppercase tracking-wider">
                            Bridal Showstopper
                          </span>
                          <h3 className="font-serif font-bold text-gray-900 text-sm mt-0.5">
                            Royal Zardozi Crimson Velvet Lehenga
                          </h3>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-gray-400">3-Day Rental</div>
                          <div className="font-bold text-[#4B1835] text-sm">₹4,500</div>
                        </div>
                      </div>
                      <div className="mt-2 text-[11px] text-gray-500 flex items-center justify-between">
                        <span>Includes double dupatta &amp; bridal cancan</span>
                        <span className="text-emerald-700 font-bold">In Store Bargarh</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED RENTAL COLLECTIONS */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-xs text-[#8C6F3B] font-bold uppercase tracking-wider">
                  Handcrafted Occasion Wear
                </span>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#27222A] mt-1">
                  Featured Wedding &amp; Festive Collections
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Explore our most popular bridal lehengas, sherwanis, and sarees available for your event dates.
                </p>
              </div>
              <Link
                href="/collections"
                className="text-xs font-bold text-[#4B1835] hover:text-[#B89558] flex items-center gap-1 shrink-0"
              >
                <span>View Complete Catalogue (35+ Outfits)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#FBF9F5] rounded-2xl border border-[#EFE9DD] overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
                >
                  <div className="relative">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-[#4B1835] text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow-xs">
                      {p.tag}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#8C6F3B] uppercase">
                        {p.category}
                      </span>
                      <h3 className="font-serif font-bold text-gray-900 text-sm mt-1 line-clamp-2">
                        {p.name}
                      </h3>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#EFE9DD] flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-gray-400">3-Day Rental</div>
                        <div className="font-bold text-sm text-[#4B1835]">
                          {formatINR(p.rentalPrice)}
                        </div>
                      </div>

                      <Link
                        href={`/garment/${p.id}`}
                        className="bg-white hover:bg-[#FAF5EB] text-[#4B1835] border border-[#E8DFD1] font-bold text-xs px-3 py-1.5 rounded-xl shadow-2xs transition-colors"
                      >
                        Enquire
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW RENTAL WORKS SECTION */}
        <section className="py-16 md:py-20 bg-[#FAF5EB] border-y border-[#EFE9DD]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs text-[#8C6F3B] font-bold uppercase tracking-wider">
                Transparent &amp; Simple
              </span>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#27222A] mt-1">
                How Renting Works at Barnali Fashion
              </h2>
              <p className="text-xs text-gray-600 mt-2">
                We make luxury wedding fashion accessible in 4 seamless, hassle-free steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
              <div className="bg-white p-6 rounded-2xl border border-[#EFE9DD] shadow-xs text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#4B1835] text-[#D4B67F] font-bold text-base flex items-center justify-center mx-auto">
                  1
                </div>
                <h3 className="font-bold text-sm text-gray-900">Visit or Browse Online</h3>
                <p className="text-gray-600 leading-relaxed text-[11px]">
                  Explore our curated bridal and occasion wear catalogue. Visit our Bargarh showroom for trial fittings.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#EFE9DD] shadow-xs text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#4B1835] text-[#D4B67F] font-bold text-base flex items-center justify-center mx-auto">
                  2
                </div>
                <h3 className="font-bold text-sm text-gray-900">Reserve with Advance</h3>
                <p className="text-gray-600 leading-relaxed text-[11px]">
                  Block your chosen outfit for your event dates with a nominal advance. We reserve the exact physical unit for you.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#EFE9DD] shadow-xs text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#4B1835] text-[#D4B67F] font-bold text-base flex items-center justify-center mx-auto">
                  3
                </div>
                <h3 className="font-bold text-sm text-gray-900">Pickup Steam-Pressed</h3>
                <p className="text-gray-600 leading-relaxed text-[11px]">
                  Collect your sanitized, tailored outfit 1 day before the event in a premium garment travel bag.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#EFE9DD] shadow-xs text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#4B1835] text-[#D4B67F] font-bold text-base flex items-center justify-center mx-auto">
                  4
                </div>
                <h3 className="font-bold text-sm text-gray-900">Return &amp; Refund</h3>
                <p className="text-gray-600 leading-relaxed text-[11px]">
                  Return the outfit after your celebration. We do not require you to wash it. Get 100% of your deposit refunded on the spot.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* REVIEWS & COMMUNITY TRUST */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="text-xs text-[#8C6F3B] font-bold uppercase tracking-wider">
                Client Experiences
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#27222A] mt-1">
                Loved by Families Across Western Odisha
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="p-6 bg-[#FBF9F5] rounded-2xl border border-[#EFE9DD] space-y-3">
                <div className="flex text-amber-500">
                  {"★".repeat(5)}
                </div>
                <p className="text-gray-700 italic leading-relaxed">
                  &ldquo;Rented the Crimson Velvet Zardozi Lehenga for my sister&apos;s wedding reception in Sambalpur. Everyone thought I bought it from Kolkata for ₹50,000! Barnali Fashion gave flawless blouse fitting.&rdquo;
                </p>
                <div className="pt-2 border-t border-[#EFE9DD]">
                  <div className="font-bold text-gray-900">Sunita Panda</div>
                  <div className="text-[10px] text-gray-400">Bargarh, Odisha</div>
                </div>
              </div>

              <div className="p-6 bg-[#FBF9F5] rounded-2xl border border-[#EFE9DD] space-y-3">
                <div className="flex text-amber-500">
                  {"★".repeat(5)}
                </div>
                <p className="text-gray-700 italic leading-relaxed">
                  &ldquo;Got an ivory raw silk sherwani for my marriage barat. Cleanest outfit, crisp packaging, and the security deposit was refunded immediately when I returned it. Highly recommended!&rdquo;
                </p>
                <div className="pt-2 border-t border-[#EFE9DD]">
                  <div className="font-bold text-gray-900">Rajesh Meher</div>
                  <div className="text-[10px] text-gray-400">Bargarh, Odisha</div>
                </div>
              </div>

              <div className="p-6 bg-[#FBF9F5] rounded-2xl border border-[#EFE9DD] space-y-3">
                <div className="flex text-amber-500">
                  {"★".repeat(5)}
                </div>
                <p className="text-gray-700 italic leading-relaxed">
                  &ldquo;Traveled from Jharsuguda for their cocktail gowns. The emerald green sequin gown was stunning. Rental procedure was so smooth and professional.&rdquo;
                </p>
                <div className="pt-2 border-t border-[#EFE9DD]">
                  <div className="font-bold text-gray-900">Priyanka Dash</div>
                  <div className="text-[10px] text-gray-400">Jharsuguda, Odisha</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ONLINE RENTAL ENQUIRY FORM & STORE VISIT */}
        <section id="enquiry" className="py-16 md:py-20 bg-[#FAF5EB] border-t border-[#EFE9DD]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Store details */}
              <div className="space-y-6">
                <div>
                  <span className="text-xs text-[#8C6F3B] font-bold uppercase tracking-wider">
                    Visit Our Showroom
                  </span>
                  <h2 className="text-3xl font-serif font-bold text-[#27222A] mt-1">
                    Experience the Outfits in Person
                  </h2>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    Come try on lehengas, sherwanis, and gowns with our in-house master stylists and tailors.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-[#E8DFD1]">
                    <MapPin className="w-5 h-5 text-[#4B1835] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-gray-900">Store Address:</div>
                      <div className="text-gray-600 mt-0.5">
                        In front of LIC Office, near Keshariya Restaurant, Bargarh Road, Bargarh, Odisha 768028
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-[#E8DFD1]">
                    <Phone className="w-5 h-5 text-[#4B1835] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-gray-900">Direct Contact &amp; Booking Hotline:</div>
                      <div className="text-gray-800 font-mono font-bold mt-0.5">
                        +91 7978256488 (Voice &amp; WhatsApp)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-[#E8DFD1]">
                    <Clock className="w-5 h-5 text-[#4B1835] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-gray-900">Showroom Hours:</div>
                      <div className="text-gray-600 mt-0.5">
                        Mon – Sat: 9:30 AM to 8:30 PM • Sunday: 9:30 AM to 1:30 PM
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Interactive Enquiry Form */}
              <div className="bg-white rounded-3xl border border-[#EFE9DD] p-8 shadow-xl text-xs">
                <div className="font-serif font-bold text-lg text-[#27222A] mb-1">
                  Check Garment Availability &amp; Reserve
                </div>
                <p className="text-gray-500 text-[11px] mb-4">
                  Enquiries automatically sync to our internal ERP management team.
                </p>

                {submitted ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <div className="font-bold text-emerald-900 text-sm">
                      Enquiry Received by Barnali Fashion!
                    </div>
                    <p className="text-emerald-700 text-xs">
                      Our counter team will call / WhatsApp you at <strong>{enquiryPhone}</strong> to confirm fitting slot and outfit availability.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="mt-3 text-xs text-[#4B1835] underline font-bold"
                    >
                      Submit another enquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleEnquirySubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                          Your Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Priyadarshini Sahu"
                          value={enquiryName}
                          onChange={(e) => setEnquiryName(e.target.value)}
                          className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                          WhatsApp Mobile Number *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="10-digit number"
                          value={enquiryPhone}
                          onChange={(e) => setEnquiryPhone(e.target.value)}
                          className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                          Event / Wedding Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={enquiryDate}
                          onChange={(e) => setEnquiryDate(e.target.value)}
                          className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                          Category of Interest *
                        </label>
                        <select
                          value={enquiryCategory}
                          onChange={(e) => setEnquiryCategory(e.target.value)}
                          className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold"
                        >
                          <option value="Bridal Lehenga">Bridal Lehenga</option>
                          <option value="Groom Sherwani">Groom Sherwani</option>
                          <option value="Party Gown">Party Gown</option>
                          <option value="Silk Saree">Silk Saree</option>
                          <option value="Indo-Western">Indo-Western</option>
                          <option value="Royal Jewellery & Accessories">Royal Jewellery</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                        Special Requirements / Fitting Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Need 4-day rental package for destination wedding in Sambalpur"
                        value={enquiryMessage}
                        onChange={(e) => setEnquiryMessage(e.target.value)}
                        className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#4B1835] hover:bg-[#320F23] text-white font-bold py-3 rounded-xl shadow-md transition-colors text-xs flex items-center justify-center gap-2 mt-2"
                    >
                      <span>Submit Rental Enquiry</span>
                      <ArrowRight className="w-4 h-4 text-[#D4B67F]" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <WebsiteFooter />
    </div>
  );
}
