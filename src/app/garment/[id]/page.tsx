"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  Tag,
} from "lucide-react";
import { WebsiteHeader } from "@/components/layout/WebsiteHeader";
import { WebsiteFooter } from "@/components/layout/WebsiteFooter";
import { DataStore } from "@/lib/dataStore";
import { formatINR } from "@/lib/utils";
import { Product } from "@/types";

function GarmentDetailContent() {
  const params = useParams();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [eventDate, setEventDate] = useState("2026-11-28");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (id) {
      const p = DataStore.getProductById(id);
      if (p) {
        setProduct(p);
        setSelectedImage(p.images[0]);
      }
    }
  }, [id]);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col font-sans">
        <WebsiteHeader />
        <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-gray-500">
          <div>
            <div className="font-bold text-base text-gray-800">Outfit not found</div>
            <Link href="/collections" className="text-[#4B1835] underline font-bold mt-2 inline-block">
              Return to Catalogue
            </Link>
          </div>
        </div>
        <WebsiteFooter />
      </div>
    );
  }

  const handleEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      alert("Please provide name and phone number");
      return;
    }

    DataStore.addEnquiry({
      name: customerName,
      phone: customerPhone,
      eventDate,
      categoryInterested: product.category,
      specificGarment: product.name,
      message,
    });

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col font-sans">
      <WebsiteHeader />

      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <Link
            href="/collections"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#4B1835] font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Collections</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Gallery (Left) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-3xl border border-[#EFE9DD] p-3 shadow-md overflow-hidden">
                <img
                  src={selectedImage || product.images[0]}
                  alt={product.name}
                  className="w-full h-[450px] md:h-[550px] object-cover rounded-2xl"
                />
              </div>

              {product.images.length > 1 && (
                <div className="flex gap-3">
                  {product.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt=""
                      onClick={() => setSelectedImage(img)}
                      className={`w-20 h-24 object-cover rounded-xl border-2 cursor-pointer transition-all ${
                        selectedImage === img ? "border-[#4B1835] shadow-xs" : "border-transparent opacity-70"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Product Info & Booking Enquiry (Right) */}
            <div className="lg:col-span-5 space-y-6 text-xs">
              <div>
                <span className="text-[11px] text-[#8C6F3B] font-bold uppercase tracking-wider">
                  {product.category}
                </span>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mt-1">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3 mt-3">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">3-Day Rental Rate</span>
                    <span className="text-2xl font-bold text-[#4B1835]">
                      {formatINR(product.rentalPrice)}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-gray-200"></div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Refundable Deposit</span>
                    <span className="text-base font-bold text-[#B89558]">
                      {formatINR(product.securityDeposit)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 bg-white rounded-2xl border border-[#EFE9DD] space-y-2">
                <div className="font-bold text-gray-900">Craftsmanship &amp; Details</div>
                <p className="text-gray-600 leading-relaxed text-[11px]">{product.description}</p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#EFE9DD] text-[11px] text-gray-700">
                  <div>Fabric: <strong>{product.fabric}</strong></div>
                  <div>Color: <strong>{product.color}</strong></div>
                </div>
              </div>

              {/* Rental Inclusions */}
              <div className="p-4 bg-[#FAF5EB] rounded-2xl border border-[#E8DFD1] space-y-2">
                <div className="font-bold text-[#4B1835] text-[11px] uppercase tracking-wider">
                  What is included in this rental:
                </div>
                <div className="space-y-1 text-gray-700 text-[11px]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Dry cleaning &amp; steam pressing prior to pickup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Free waist &amp; blouse alterations by Master Salim</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Protective branded garment bag &amp; hanger</span>
                  </div>
                </div>
              </div>

              {/* Direct Booking / Date Enquiry Card */}
              <div className="bg-white rounded-3xl border border-[#EFE9DD] p-6 shadow-md space-y-4">
                <div className="font-bold text-sm text-gray-900">
                  Check Event Availability for this Piece
                </div>

                {submitted ? (
                  <div className="p-4 bg-emerald-50 rounded-xl text-center space-y-1">
                    <div className="font-bold text-emerald-900">Enquiry Logged in Store ERP!</div>
                    <p className="text-emerald-700 text-[11px]">
                      Our team will verify available sizes and connect with you on WhatsApp at {customerPhone}.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleEnquiry} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">
                        WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">
                        Your Event / Wedding Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#4B1835] hover:bg-[#320F23] text-white font-bold py-3 rounded-xl shadow-xs transition-colors"
                    >
                      Request Availability Confirmation
                    </button>
                  </form>
                )}

                <div className="pt-2 text-center">
                  <a
                    href={`https://wa.me/917978256488?text=Namaste%20Barnali%20Fashion,%20I%20am%20enquiring%20about%20"${encodeURIComponent(
                      product.name
                    )}"%20for%20my%20event.`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold hover:underline"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Instant WhatsApp Enquiry (+91 7978256488)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <WebsiteFooter />
    </div>
  );
}

export default function GarmentDetailPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-gray-400">Loading outfit details...</div>}>
      <GarmentDetailContent />
    </Suspense>
  );
}
