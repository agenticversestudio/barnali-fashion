"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Clock,
  MessageSquare,
  Mail,
  CheckCircle2,
  Building2,
  Navigation,
} from "lucide-react";
import { WebsiteHeader } from "@/components/layout/WebsiteHeader";
import { WebsiteFooter } from "@/components/layout/WebsiteFooter";
import { DataStore } from "@/lib/dataStore";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("Please provide name and phone number");
      return;
    }

    DataStore.addEnquiry({
      name,
      phone,
      eventDate: "2026-12-01",
      categoryInterested: "Bridal Lehenga",
      message: message || "General contact request",
    });

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col font-sans">
      <WebsiteHeader />

      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="text-xs text-[#8C6F3B] font-bold uppercase tracking-wider">
              We&apos;d Love to Welcome You
            </span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#27222A]">
              Visit Our Bargarh Showroom
            </h1>
            <p className="text-xs text-gray-600 max-w-xl mx-auto">
              Drop by for trial sessions, book bridal fittings, or reach out to our rental styling consultants.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs">
            {/* Store Information (Left) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-[#EFE9DD] shadow-xs space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-[#FAF5EB] rounded-2xl text-[#4B1835] shrink-0 border border-[#E8DFD1]">
                    <MapPin className="w-5 h-5 text-[#B89558]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Showroom Address</h3>
                    <p className="text-gray-600 text-[11px] mt-1 leading-relaxed">
                      In front of LIC Office, near Keshariya Restaurant, Bargarh Road, Bargarh, Odisha — 768028
                    </p>
                    <div className="text-[10px] text-emerald-700 font-bold mt-1">
                      Landmark: Opp. LIC Office &amp; Near Balaji Jewellers
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-3 border-t border-[#EFE9DD]">
                  <div className="p-3 bg-[#FAF5EB] rounded-2xl text-[#4B1835] shrink-0 border border-[#E8DFD1]">
                    <Phone className="w-5 h-5 text-[#B89558]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Direct Phone &amp; WhatsApp</h3>
                    <p className="text-gray-800 font-mono font-bold text-sm mt-1">
                      +91 7978256488
                    </p>
                    <p className="text-gray-500 text-[10px] mt-0.5">
                      Available during store hours for enquiries &amp; booking status
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-3 border-t border-[#EFE9DD]">
                  <div className="p-3 bg-[#FAF5EB] rounded-2xl text-[#4B1835] shrink-0 border border-[#E8DFD1]">
                    <Clock className="w-5 h-5 text-[#B89558]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Store Timings</h3>
                    <div className="text-gray-600 text-[11px] mt-1 space-y-0.5">
                      <div>Monday – Saturday: <strong>9:30 AM – 8:30 PM</strong></div>
                      <div>Sunday: <strong>9:30 AM – 1:30 PM</strong></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instant WhatsApp Action Card */}
              <div className="bg-[#4B1835] text-white p-6 rounded-3xl shadow-sm space-y-3">
                <div className="font-serif font-bold text-base text-[#D4B67F]">
                  Instant WhatsApp Stylist Chat
                </div>
                <p className="text-[#F7F3EC]/80 text-[11px] leading-relaxed">
                  Send photos of your dream bridal lehenga or sherwani and check if similar outfits are in stock.
                </p>
                <a
                  href="https://wa.me/917978256488?text=Namaste%20Barnali%20Fashion,%20I%20am%20looking%20for%20wedding%20wear%20rentals."
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors shadow-xs"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-200" />
                  <span>Open WhatsApp (+91 7978256488)</span>
                </a>
              </div>
            </div>

            {/* Interactive Message / Callback Form (Right) */}
            <div className="lg:col-span-7">
              <div className="bg-white p-8 rounded-3xl border border-[#EFE9DD] shadow-xs space-y-5">
                <div>
                  <h2 className="font-serif font-bold text-xl text-gray-900">
                    Send Us a Message or Request a Call
                  </h2>
                  <p className="text-gray-500 text-[11px] mt-1">
                    Fill in your details and our team will get back to you with available dates and fitting slots.
                  </p>
                </div>

                {submitted ? (
                  <div className="p-8 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <div className="font-bold text-emerald-900 text-base">Thank you, {name}!</div>
                    <p className="text-emerald-700 text-xs">
                      Your message has been registered in the Barnali Fashion counter desk. We will call you shortly on <strong>{phone}</strong>.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="text-xs text-[#4B1835] underline font-bold mt-2"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                          Your Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Subhashree Mohapatra"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-semibold text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                          Phone Number (WhatsApp) *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="10-digit number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-mono text-gray-900 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                        How can we help you? (Event dates, outfit preferences) *
                      </label>
                      <textarea
                        rows={4}
                        required
                        placeholder="Tell us what event you are attending, preferred colors, or if you need a trial fitting slot..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl text-gray-800"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="bg-[#4B1835] hover:bg-[#320F23] text-white font-bold py-3 px-8 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 text-xs"
                    >
                      <span>Submit Message</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <WebsiteFooter />
    </div>
  );
}
