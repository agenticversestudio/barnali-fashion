"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shirt,
  Search,
  Plus,
  QrCode,
  Grid,
  List,
  MapPin,
  X,
  ChevronRight,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GarmentUnit, ProductCategory } from "@/types";

export default function InventoryPage() {
  const [garments, setGarments] = useState<GarmentUnit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Add Costume Modal state
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

  const statuses = [
    { label: "All", value: "ALL" },
    { label: "Available", value: "AVAILABLE" },
    { label: "Booked", value: "BOOKED" },
    { label: "Out on rent", value: "OUT_ON_RENT" },
    { label: "Cleaning", value: "RETURNED_CLEANING" },
    { label: "In repair", value: "DAMAGED_REPAIR" },
    { label: "Unavailable", value: "UNAVAILABLE" },
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
      notes: "Newly entered piece",
    };

    DataStore.saveGarment(newUnit);
    setGarments(DataStore.getGarments());
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage catalogue garments, rack assignments, and rental pricing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === "table" ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-500"
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-500"
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#6B1D2F] hover:bg-[#551624] text-white text-xs font-medium rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Piece</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by SKU, name, color, or rack..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#6B1D2F] text-slate-800"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-hidden"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "All Categories" : c}
              </option>
            ))}
          </select>
        </div>

        {/* Clean Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-t border-slate-100 pt-2.5">
          <span className="text-[11px] font-medium text-slate-400 shrink-0 mr-1">Status:</span>
          {statuses.map((st) => (
            <button
              key={st.value}
              onClick={() => setSelectedStatus(st.value)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
                selectedStatus === st.value
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Presentation */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-[#E2E8F0] text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Size &amp; Color</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Rental Rate</th>
                  <th className="py-3 px-3">Security Deposit</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGarments.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={g.image}
                          alt={g.productName}
                          className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <span className="font-mono text-xs font-semibold text-slate-900">
                            {g.id}
                          </span>
                          <div className="text-slate-700 font-medium line-clamp-1 max-w-[200px]">
                            {g.productName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-medium whitespace-nowrap">{g.category}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{g.size}</div>
                      <div className="text-[11px] text-slate-400">{g.colour || "—"}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-slate-600 font-medium bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{g.location || g.storageLocation}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {formatINR(g.rentalPrice)}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-medium whitespace-nowrap">
                      {formatINR(g.securityDeposit)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={g.status} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setQrGarment(g)}
                          title="View Rack Tag"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/erp/inventory/${g.id}`}
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-[11px] font-medium"
                        >
                          Details
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
        /* Grid Presentation */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredGarments.map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-colors flex flex-col justify-between"
            >
              <div className="relative">
                <img src={g.image} alt={g.productName} className="w-full h-44 object-cover" />
                <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-xs text-slate-900 text-xs font-mono font-semibold px-2 py-0.5 rounded shadow-xs border border-slate-200">
                  {g.id}
                </div>
                <div className="absolute top-2.5 right-2.5">
                  <StatusBadge status={g.status} />
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{g.category}</span>
                    <span>{g.size}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-xs mt-1 line-clamp-2">
                    {g.productName}
                  </h3>
                  <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{g.location || g.storageLocation}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">Rental</div>
                    <div className="font-semibold text-slate-900">{formatINR(g.rentalPrice)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Deposit</div>
                    <div className="text-slate-600 font-medium">{formatINR(g.securityDeposit)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Piece Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 text-xs animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-900">Add Inventory Piece</span>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCostume} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Costume SKU *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LF-010"
                    value={costumeId}
                    onChange={(e) => setCostumeId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    {categories.filter((c) => c !== "ALL").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Item Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Red Royal Velvet Bridal Lehenga"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Size *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="M / Adjustable"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Colour *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Red"
                    value={colour}
                    onChange={(e) => setColour(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-slate-700 mb-1">
                    Purchase Price (₹)
                  </label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-700 mb-1">
                    Rental Rate (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={rentalPrice}
                    onChange={(e) => setRentalPrice(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-700 mb-1">
                    Security Deposit (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Condition
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Minor Wear">Minor Wear</option>
                    <option value="Repairs Needed">Repairs Needed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Godown Rack *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Godown Rack A-01"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#6B1D2F] hover:bg-[#551624] text-white font-medium rounded-lg shadow-xs"
                >
                  Save Piece
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rack Tag Modal */}
      {qrGarment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-xs w-full border border-slate-200 shadow-xl text-center">
            <h3 className="font-semibold text-sm text-slate-900">Storage Rack Label</h3>
            <p className="text-xs text-slate-500 mt-0.5">{qrGarment.productName}</p>

            <div className="my-4 p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50 flex flex-col items-center">
              <div className="text-xl font-mono font-bold text-slate-900">{qrGarment.id}</div>
              <div className="text-xs text-slate-600 mt-1">{qrGarment.category} · {qrGarment.size}</div>
              <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-2">
                Rack: {qrGarment.location || qrGarment.storageLocation}
              </div>
            </div>

            <button
              onClick={() => setQrGarment(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}