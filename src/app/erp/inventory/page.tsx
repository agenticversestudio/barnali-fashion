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
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  // Add Garment Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSku, setNewSku] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newCategory, setNewCategory] = useState<ProductCategory>("Bridal Lehenga");
  const [newSize, setNewSize] = useState<GarmentUnit["size"]>("M");
  const [newRentalPrice, setNewRentalPrice] = useState("3500");
  const [newDeposit, setNewDeposit] = useState("5000");
  const [newStorage, setNewStorage] = useState("Hanger Rack A-04");

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

  const statuses: ("ALL" | GarmentStatus)[] = [
    "ALL",
    "AVAILABLE",
    "RESERVED",
    "PREPARING",
    "RENTED",
    "RETURN_RECEIVED",
    "INSPECTION_PENDING",
    "IN_LAUNDRY",
    "UNDER_REPAIR",
    "QUALITY_CHECK",
  ];

  const filteredGarments = garments.filter((g) => {
    const matchesSearch =
      g.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.barcode.includes(searchTerm) ||
      g.storageLocation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "ALL" || g.category === selectedCategory;
    const matchesStatus = selectedStatus === "ALL" || g.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddGarment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku || !newProductName) {
      alert("Please fill in SKU and Product Name");
      return;
    }

    const newUnit: GarmentUnit = {
      id: newSku.toUpperCase(),
      productId: "PROD-CUSTOM",
      productName: newProductName,
      category: newCategory,
      barcode: `890782${Math.floor(1000 + Math.random() * 9000)}`,
      size: newSize,
      storageLocation: newStorage,
      status: "AVAILABLE",
      conditionRating: "Pristine",
      rentalCount: 0,
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600",
      rentalPrice: Number(newRentalPrice) || 3000,
      securityDeposit: Number(newDeposit) || 4000,
      notes: "Newly entered into store inventory",
    };

    DataStore.saveGarment(newUnit);
    setGarments(DataStore.getGarments());
    setShowAddModal(false);
    alert(`Garment Unit ${newUnit.id} added successfully to inventory!`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8C6F3B] font-semibold uppercase tracking-wider mb-1">
            <Shirt className="w-4 h-4 text-[#4B1835]" />
            <span>Garment Assets &amp; Individual SKUs</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#27222A]">Inventory Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Individual physical garment units with unique barcodes, sizes, storage rack locations, and real-time statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#4B1835] hover:bg-[#320F23] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 text-[#D4B67F]" />
            <span>Add Garment Unit</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EFE9DD] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#B89558] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by SKU (BF-LH-001), Product Name, Barcode, or Rack Location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl focus:outline-hidden focus:border-[#4B1835] text-gray-800"
            />
          </div>

          {/* View Toggles */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-[#FBF9F5] p-1 rounded-xl border border-[#E8DFD1] flex items-center">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === "table" ? "bg-white shadow-xs text-[#4B1835]" : "text-gray-500 hover:text-gray-900"
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === "grid" ? "bg-white shadow-xs text-[#4B1835]" : "text-gray-500 hover:text-gray-900"
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-[#4B1835] text-white"
                  : "bg-[#FBF9F5] text-gray-600 hover:bg-[#F3EFE7] border border-[#EFE9DD]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Dropdown Filter */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#EFE9DD] text-xs">
          <span className="text-gray-400 font-semibold uppercase text-[10px]">Status Filter:</span>
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                  selectedStatus === st
                    ? "bg-[#B89558] text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {st.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Garments Presentation */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-2xl border border-[#EFE9DD] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EB] border-b border-[#EFE9DD] text-[#8C6F3B] uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">SKU / Garment</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Size</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Rental Rate</th>
                  <th className="py-3 px-3">Security Deposit</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1ECE3]">
                {filteredGarments.map((g) => (
                  <tr key={g.id} className="hover:bg-[#FBF9F5] transition-colors group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={g.image}
                          alt={g.productName}
                          className="w-10 h-10 rounded-lg object-cover border border-[#EFE9DD] shrink-0"
                        />
                        <div>
                          <div className="font-bold text-[#4B1835] font-mono">{g.id}</div>
                          <div className="text-gray-800 font-medium line-clamp-1 max-w-xs">
                            {g.productName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-600 font-medium">{g.category}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                        {g.size}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-600 flex items-center gap-1 mt-3">
                      <MapPin className="w-3 h-3 text-[#B89558]" />
                      <span>{g.storageLocation}</span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-gray-900">
                      {formatINR(g.rentalPrice)}
                    </td>
                    <td className="py-3 px-3 text-[#B89558] font-semibold">
                      {formatINR(g.securityDeposit)}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={g.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setQrGarment(g)}
                          title="Generate Barcode / QR Label"
                          className="p-1.5 bg-[#FAF5EB] hover:bg-[#F3EFE7] text-[#8C6F3B] rounded-lg transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/erp/inventory/${g.id}`}
                          className="p-1.5 bg-[#FBF9F5] hover:bg-[#FAF5EB] text-[#4B1835] rounded-lg transition-colors font-semibold flex items-center gap-1 text-[11px]"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3 h-3" />
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
                <img src={g.image} alt={g.productName} className="w-full h-44 object-cover" />
                <div className="absolute top-2 left-2 bg-[#4B1835] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shadow-xs">
                  {g.id}
                </div>
                <div className="absolute top-2 right-2">
                  <StatusBadge status={g.status} />
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold text-[#8C6F3B] uppercase">{g.category}</div>
                  <h3 className="font-bold text-gray-900 text-xs mt-0.5 line-clamp-2">
                    {g.productName}
                  </h3>
                  <div className="text-[11px] text-gray-500 mt-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#B89558]" />
                    <span>{g.storageLocation}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#EFE9DD] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-gray-400">Rental Rate</div>
                    <div className="font-bold text-xs text-gray-900">{formatINR(g.rentalPrice)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400">Security Dep.</div>
                    <div className="font-bold text-xs text-[#B89558]">
                      {formatINR(g.securityDeposit)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => setQrGarment(g)}
                    className="p-2 bg-[#FAF5EB] hover:bg-[#F3EFE7] text-[#8C6F3B] rounded-xl text-xs flex items-center justify-center shrink-0"
                    title="Print Barcode Tag"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/erp/inventory/${g.id}`}
                    className="flex-1 bg-[#4B1835] hover:bg-[#320F23] text-white text-xs font-semibold py-1.5 rounded-xl text-center transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Garment Unit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EFE9DD] max-w-lg w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DD]">
              <div className="flex items-center gap-2 font-bold text-sm text-[#4B1835]">
                <Plus className="w-4 h-4 text-[#B89558]" />
                <span>Add Physical Garment Unit</span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddGarment} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Unique SKU (ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BF-LH-010"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Size *
                  </label>
                  <select
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value as any)}
                    className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-bold"
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="Free Size">Free Size</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Maroon Velvet Bridal Lehenga"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
                    className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-semibold"
                  >
                    {categories.filter((c) => c !== "ALL").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Storage Rack / Bin *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStorage}
                    onChange={(e) => setNewStorage(e.target.value)}
                    className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Rental Rate (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newRentalPrice}
                    onChange={(e) => setNewRentalPrice(e.target.value)}
                    className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Security Deposit (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newDeposit}
                    onChange={(e) => setNewDeposit(e.target.value)}
                    className="w-full p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-lg font-semibold text-[#B89558]"
                  />
                </div>
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
                  Save Garment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode / QR Label Preview Modal */}
      {qrGarment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EFE9DD] max-w-sm w-full p-6 text-xs text-center">
            <div className="flex justify-end">
              <button
                onClick={() => setQrGarment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Label Card */}
            <div className="p-4 border-2 border-dashed border-[#B89558] rounded-xl bg-[#FAF5EB]/50 mt-2">
              <div className="font-serif font-bold text-[#4B1835] text-sm tracking-wider">
                BARNALI FASHION
              </div>
              <div className="text-[9px] text-[#8C6F3B] font-semibold uppercase tracking-widest">
                Bargarh, Odisha • Rental Tag
              </div>

              {/* Barcode Mock Rendering */}
              <div className="my-4 p-2 bg-white rounded border border-gray-200 inline-block shadow-xs">
                <div className="font-mono text-xl font-bold tracking-widest text-black">
                  ||||| | |||| ||| |||| |
                </div>
                <div className="text-[11px] font-mono font-bold text-gray-800 mt-1">
                  {qrGarment.barcode}
                </div>
              </div>

              <div className="font-mono font-bold text-base text-[#4B1835]">
                {qrGarment.id}
              </div>
              <div className="font-bold text-xs text-gray-900 mt-0.5 line-clamp-1">
                {qrGarment.productName}
              </div>
              <div className="text-[11px] text-gray-600 mt-1 flex justify-center gap-3">
                <span>Size: <strong>{qrGarment.size}</strong></span>
                <span>Rack: <strong>{qrGarment.storageLocation}</strong></span>
              </div>
              <div className="text-[11px] text-[#B89558] font-bold mt-1">
                Rental: {formatINR(qrGarment.rentalPrice)} • Dep: {formatINR(qrGarment.securityDeposit)}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-[#4B1835] hover:bg-[#320F23] text-white font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4 text-[#D4B67F]" />
                <span>Print Tag Label</span>
              </button>
              <button
                onClick={() => setQrGarment(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
