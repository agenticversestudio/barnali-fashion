"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shirt,
  Search,
  Filter,
  Plus,
  QrCode,
  Tag,
  Grid,
  List,
  CheckCircle2,
  MapPin,
  Sparkles,
  X,
  History,
  Printer,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GarmentUnit, ProductCategory, GarmentStatus } from "@/types";

export default function InventoryPage() {
  const [garments, setGarments] = useState<GarmentUnit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Add Costume Modal state (Matching Client 11 Fields)
  const [showAddModal, setShowAddModal] = useState(false);
  const [costumeId, setCostumeId] = useState("");
  const [category, setCategory] = useState<ProductCategory>("Bridal Lehenga");
  const [name, setName] = useState("");
  const [size, setSize] = useState("M / Adjustable");
  const [colour, setColour] = useState("Red");
  const [purchasePrice, setPurchasePrice] = useState("25000");
  const [rentalPrice, setRentalPrice] = useState("5000");
  const [securityDeposit, setSecurityDeposit] = useState("3000");
  const [condition, setCondition] = useState("Excellent");
  const [location, setLocation] = useState("Godown Rack A-01");
  const [photoUrl, setPhotoUrl] = useState("https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600");

  // Barcode / QR Label Modal
  const [qrGarment, setQrGarment] = useState<GarmentUnit | null>(null);

  useEffect(() => {
    setGarments(DataStore.getGarments());
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

  // Exact 6 statuses requested by client
  const statuses = [
    { label: "ALL", value: "ALL" },
    { label: "🟢 Available", value: "AVAILABLE" },
    { label: "🟠 Booked", value: "BOOKED" },
    { label: "🔵 Out on rent", value: "OUT_ON_RENT" },
    { label: "🟣 Returned – cleaning pending", value: "RETURNED_CLEANING" },
    { label: "🔴 Damaged / Repair", value: "DAMAGED_REPAIR" },
    { label: "⚫ Unavailable", value: "UNAVAILABLE" },
  ];

  const filteredGarments = garments.filter((g) => {
    const sTerm = searchTerm.toLowerCase();
    const matchesSearch =
      g.id.toLowerCase().includes(sTerm) ||
      g.productName.toLowerCase().includes(sTerm) ||
      (g.colour && g.colour.toLowerCase().includes(sTerm)) ||
      (g.location && g.location.toLowerCase().includes(sTerm)) ||
      g.storageLocation.toLowerCase().includes(sTerm);

    const matchesCategory = selectedCategory === "ALL" || g.category === selectedCategory;

    let matchesStatus = selectedStatus === "ALL";
    if (selectedStatus === "AVAILABLE") matchesStatus = g.status === "AVAILABLE";
    if (selectedStatus === "BOOKED") matchesStatus = g.status === "BOOKED" || g.status === "RESERVED" || g.status === "PREPARING";
    if (selectedStatus === "OUT_ON_RENT") matchesStatus = g.status === "OUT_ON_RENT" || g.status === "RENTED";
    if (selectedStatus === "RETURNED_CLEANING") matchesStatus = g.status === "RETURNED_CLEANING" || g.status === "RETURN_RECEIVED" || g.status === "IN_LAUNDRY";
    if (selectedStatus === "DAMAGED_REPAIR") matchesStatus = g.status === "DAMAGED_REPAIR" || g.status === "UNDER_REPAIR" || g.status === "REPAIR_PENDING";
    if (selectedStatus === "UNAVAILABLE") matchesStatus = g.status === "UNAVAILABLE" || g.status === "RETIRED";

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddCostume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!costumeId || !name) {
      alert("Please enter Costume ID and Name");
      return;
    }

    const newUnit: GarmentUnit = {
      id: costumeId.toUpperCase().trim(),
      costumeId: costumeId.toUpperCase().trim(),
      productId: "PROD-MANUAL",
      productName: name.trim(),
      category: category,
      barcode: `890782${Math.floor(1000 + Math.random() * 9000)}`,
      size: size,
      colour: colour.trim(),
      purchasePrice: Number(purchasePrice) || 25000,
      rentalPrice: Number(rentalPrice) || 5000,
      securityDeposit: Number(securityDeposit) || 3000,
      condition: condition,
      conditionRating: condition as any,
      location: location.trim(),
      storageLocation: location.trim(),
      status: "AVAILABLE",
      rentalCount: 0,
      image: photoUrl || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600",
      notes: "Newly entered into Barnali store catalogue",
    };

    DataStore.saveGarment(newUnit);
    setGarments(DataStore.getGarments());
    setShowAddModal(false);
    alert(`Costume ${newUnit.id} added successfully to stock!`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8C6F3B] font-semibold uppercase tracking-wider mb-1">
            <Shirt className="w-4 h-4 text-[#4B1835]" />
            <span>Costumes &amp; Godown Stock</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#27222A]">Costume Inventory</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Exact 11 costume fields, godown rack locations, and 6 active status states.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#F3EFE7] p-1 rounded-xl border border-[#E8DFD1]">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === "table" ? "bg-white text-[#4B1835] shadow-xs font-bold" : "text-gray-500"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === "grid" ? "bg-white text-[#4B1835] shadow-xs font-bold" : "text-gray-500"
              }`}
              title="Grid Card View"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#4B1835] hover:bg-[#320F23] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 text-[#D4B67F]" />
            <span>Add New Costume</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EFE9DD] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#B89558] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Costume ID (e.g. LF-001), Name, Colour, or Godown Rack..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl focus:outline-hidden focus:border-[#4B1835] text-gray-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs py-2 px-3 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-semibold text-gray-800 focus:outline-hidden"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "ALL" ? "All Categories" : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 6 Exact Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-t border-[#EFE9DD] pt-2.5">
          <span className="text-[10px] uppercase font-bold text-[#8C6F3B] shrink-0 mr-1">Status:</span>
          {statuses.map((st) => (
            <button
              key={st.value}
              onClick={() => setSelectedStatus(st.value)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                selectedStatus === st.value
                  ? "bg-[#4B1835] text-white shadow-xs"
                  : "bg-[#FBF9F5] text-gray-700 hover:bg-[#F3EFE7] border border-[#E8DFD1]"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Garments Presentation */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-2xl border border-[#EFE9DD] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EB] border-b border-[#EFE9DD] text-[#8C6F3B] uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Costume ID &amp; Photo</th>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Size &amp; Colour</th>
                  <th className="py-3 px-3">Godown Location</th>
                  <th className="py-3 px-3">Purchase Price</th>
                  <th className="py-3 px-3">Rental Price</th>
                  <th className="py-3 px-3">Security Deposit</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Condition</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1ECE3]">
                {filteredGarments.map((g) => (
                  <tr key={g.id} className="hover:bg-[#FBF9F5] transition-colors group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={g.image}
                          alt={g.productName}
                          className="w-12 h-12 rounded-lg object-cover border border-[#EFE9DD] shrink-0"
                        />
                        <div>
                          <span className="font-mono font-bold text-sm text-[#4B1835] bg-[#F5EFE6] px-1.5 py-0.5 rounded border border-[#E8DFD1]">
                            {g.id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-gray-900 max-w-[180px]">
                      <div className="line-clamp-2">{g.productName}</div>
                    </td>
                    <td className="py-3 px-3 text-gray-600 font-medium whitespace-nowrap">{g.category}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-gray-900">{g.size}</div>
                      <div className="text-[11px] text-gray-500">{g.colour || "Standard"}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-gray-700 font-medium bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                        <MapPin className="w-3 h-3 text-[#8C6F3B]" />
                        <span>{g.location || g.storageLocation}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-600 font-medium whitespace-nowrap">
                      {formatINR(g.purchasePrice || 25000)}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#4B1835] whitespace-nowrap">
                      {formatINR(g.rentalPrice)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#8C6F3B] whitespace-nowrap">
                      {formatINR(g.securityDeposit)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={g.status} />
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {g.condition || g.conditionRating}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setQrGarment(g)}
                          title="Generate Barcode / Rack Tag"
                          className="p-1.5 bg-[#FAF5EB] hover:bg-[#F3EFE7] text-[#8C6F3B] rounded-lg transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/erp/inventory/${g.id}`}
                          className="px-2 py-1 bg-[#4B1835] text-white hover:bg-[#320F23] rounded-lg transition-colors text-[11px] font-semibold"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredGarments.map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-2xl border border-[#EFE9DD] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="relative">
                <img src={g.image} alt={g.productName} className="w-full h-48 object-cover" />
                <div className="absolute top-2 left-2 bg-[#4B1835] text-white text-xs font-mono font-bold px-2.5 py-1 rounded-md shadow-xs border border-[#D4B67F]/40">
                  {g.id}
                </div>
                <div className="absolute top-2 right-2">
                  <StatusBadge status={g.status} />
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#8C6F3B] uppercase">
                    <span>{g.category}</span>
                    <span className="text-gray-500 font-semibold">{g.size}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mt-1 line-clamp-2">
                    {g.productName}
                  </h3>
                  <div className="text-[11px] text-gray-600 mt-2 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#8C6F3B]" />
                    <span className="font-medium">{g.location || g.storageLocation}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#EFE9DD] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-[10px] text-gray-400">Rental Price</div>
                    <div className="font-bold text-[#4B1835]">{formatINR(g.rentalPrice)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400">Security Deposit</div>
                    <div className="font-bold text-[#8C6F3B]">{formatINR(g.securityDeposit)}</div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#EFE9DD] flex items-center justify-between">
                  <span className="text-[11px] text-gray-600 font-medium">
                    Colour: <strong>{g.colour || "Standard"}</strong>
                  </span>
                  <button
                    onClick={() => setQrGarment(g)}
                    className="p-1.5 bg-[#FAF5EB] text-[#8C6F3B] rounded-lg hover:bg-[#F3EFE7]"
                    title="Print Rack Tag"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- ADD NEW COSTUME MODAL (EXACT 11 CLIENT FIELDS) --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EFE9DD] max-w-xl w-full p-6 text-xs animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DD]">
              <div className="flex items-center gap-2 font-bold text-base text-[#4B1835]">
                <Plus className="w-5 h-5 text-[#8C6F3B]" />
                <span>Add New Costume (Client 11 Fields Form)</span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCostume} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                {/* 1. Costume ID */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Costume ID * (e.g. LF-001)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="LF-001"
                    value={costumeId}
                    onChange={(e) => setCostumeId(e.target.value)}
                    className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-mono font-bold text-[#4B1835]"
                  />
                </div>

                {/* 2. Category */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-semibold"
                  >
                    {categories.filter((c) => c !== "ALL").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Name */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Costume Name * (e.g. Red Royal Bridal Lehenga)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Red Royal Bridal Lehenga"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* 4. Size */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Size * (e.g. M / Adjustable)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="M / Adjustable"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg"
                  />
                </div>

                {/* 5. Colour */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Colour * (e.g. Red, Maroon, Ivory)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Red"
                    value={colour}
                    onChange={(e) => setColour(e.target.value)}
                    className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* 6. Purchase Price */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">
                    Purchase Price (₹)
                  </label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-medium"
                  />
                </div>

                {/* 7. Rental Price */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">
                    Rental Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={rentalPrice}
                    onChange={(e) => setRentalPrice(e.target.value)}
                    className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-bold text-[#4B1835]"
                  />
                </div>

                {/* 8. Security Deposit */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">
                    Security Deposit (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-bold text-[#8C6F3B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* 10. Condition */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Condition (e.g. Excellent)
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-semibold"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Minor Wear">Minor Wear</option>
                    <option value="Repairs Needed">Repairs Needed</option>
                  </select>
                </div>

                {/* 11. Location */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Location * (e.g. Godown Rack A-01)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Godown Rack A-01"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-medium"
                  />
                </div>
              </div>

              {/* Photo URL */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Costume Photo Image URL
                </label>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg text-gray-600"
                />
              </div>

              <div className="pt-3 border-t border-[#EFE9DD] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4B1835] hover:bg-[#320F23] text-white font-bold rounded-xl shadow-xs"
                >
                  Save Costume to Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Tag Modal */}
      {qrGarment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#EFE9DD] shadow-2xl text-center">
            <h3 className="font-serif font-bold text-base text-[#27222A]">Godown Rack Tag</h3>
            <p className="text-xs text-gray-500 mt-1">{qrGarment.productName}</p>

            <div className="my-4 p-4 border-2 border-dashed border-[#B89558] rounded-xl bg-[#FAF5EB] flex flex-col items-center">
              <div className="text-2xl font-mono font-black text-[#4B1835]">{qrGarment.id}</div>
              <div className="text-xs font-semibold text-gray-800 mt-1">{qrGarment.category} — {qrGarment.size}</div>
              <div className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded mt-1.5">
                Rack: {qrGarment.location || qrGarment.storageLocation}
              </div>
              <div className="mt-3 text-[10px] text-gray-500 font-mono">BARNALI FASHION • BARGARH</div>
            </div>

            <button
              onClick={() => setQrGarment(null)}
              className="w-full py-2 bg-[#4B1835] text-white rounded-xl text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}