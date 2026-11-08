"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shirt,
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { WebsiteHeader } from "@/components/layout/WebsiteHeader";
import { WebsiteFooter } from "@/components/layout/WebsiteFooter";
import { DataStore } from "@/lib/dataStore";
import { formatINR } from "@/lib/utils";
import { Product } from "@/types";

export default function CollectionsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setProducts(DataStore.getProducts());
  }, []);

  const categories = [
    "ALL",
    "Bridal Lehenga",
    "Groom Sherwani",
    "Party Gown",
    "Silk Saree",
    "Indo-Western",
    "Kids Festive Wear",
    "Royal Jewellery & Accessories",
  ];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fabric.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.color.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col font-sans">
      <WebsiteHeader />

      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          {/* Header Banner */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs text-[#8C6F3B] font-bold uppercase tracking-wider">
              Boutique Rental Catalogue
            </span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#27222A]">
              Wedding &amp; Occasion Wear Collections
            </h1>
            <p className="text-xs text-gray-600">
              Browse our handcrafted designer outfits. All rentals include steam pressing, custom alterations, and bridal jewelry matching.
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="bg-white p-4 rounded-2xl border border-[#EFE9DD] shadow-xs space-y-4">
            <div className="relative max-w-md mx-auto">
              <Search className="w-4 h-4 text-[#B89558] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by outfit name, velvet, zardozi, silk, raw silk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl focus:outline-hidden text-gray-800"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs justify-center flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-[#4B1835] text-white font-bold"
                      : "bg-[#FBF9F5] text-gray-600 hover:bg-[#F3EFE7] border border-[#EFE9DD]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-[#EFE9DD] overflow-hidden shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-[#4B1835] text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow-xs">
                    {p.category}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-serif font-bold text-gray-900 text-base leading-snug">
                      {p.name}
                    </h3>
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                    <div className="text-[11px] text-gray-500 mt-2 space-y-0.5">
                      <div>Fabric: <strong>{p.fabric}</strong></div>
                      <div>Palette: <strong>{p.color}</strong></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#EFE9DD]">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-[10px] text-gray-400">3-Day Rental</div>
                        <div className="font-bold text-base text-[#4B1835]">
                          {formatINR(p.rentalPrice)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-gray-400">Security Deposit</div>
                        <div className="font-bold text-xs text-[#B89558]">
                          {formatINR(p.securityDeposit)}
                        </div>
                        <div className="text-[9px] text-gray-400">100% Refundable</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/917978256488?text=Namaste%20Barnali%20Fashion,%20I%20am%20interested%20in%20renting%20"${encodeURIComponent(
                          p.name
                        )}"%20for%20my%20event.`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl"
                        title="Enquire on WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                      <Link
                        href={`/garment/${p.id}`}
                        className="flex-1 bg-[#4B1835] hover:bg-[#320F23] text-white text-xs font-bold py-2.5 rounded-xl text-center shadow-xs transition-colors"
                      >
                        View Details &amp; Reserve
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <WebsiteFooter />
    </div>
  );
}
