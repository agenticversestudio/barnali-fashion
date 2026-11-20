"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Sparkles,
  ClipboardList,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GarmentUnit, ProductCategory } from "@/types";

export default function InventoryPage() {
  const router = useRouter();
  const [garments, setGarments] = useState<GarmentUnit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Selected item for Mobile Full Details Bottom Sheet
  const [selectedGarment, setSelectedGarment] = useState<GarmentUnit | null>(null);

  // Add Costume Modal state (2-step Mobile Wizard)
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState<1 | 2>(1);
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
  const [photoUrl, setPhotoUrl] = useState(
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600"
  );

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
    { label: "All Costumes", value: "ALL", count: garments.length, dot: "" },
    {
      label: "Available",
      value: "AVAILABLE",
      count: garments.filter((g) => g.status === "AVAILABLE").length,
      dot: "bg-emerald-500",
    },
    {
      label: "Booked",
      value: "BOOKED",
      count: garments.filter(
        (g) => g.status === "BOOKED" || g.status === "RESERVED" || g.status === "PREPARING"
      ).length,
      dot: "bg-amber-500",
    },
    {
      label: "Out on rent",
      value: "OUT_ON_RENT",
      count: garments.filter((g) => g.status === "OUT_ON_RENT" || g.status === "RENTED").length,
      dot: "bg-blue-500",
    },
    {
      label: "Returned – cleaning pending",
      value: "RETURNED_CLEANING",
      count: garments.filter(
        (g) =>
          g.status === "RETURNED_CLEANING" ||
          g.status === "RETURN_RECEIVED" ||
          g.status === "IN_LAUNDRY"
      ).length,
      dot: "bg-purple-500",
    },
    {
      label: "Damaged / Repair",
      value: "DAMAGED_REPAIR",
      count: garments.filter(
        (g) =>
          g.status === "DAMAGED_REPAIR" ||
          g.status === "UNDER_REPAIR" ||
          g.status === "REPAIR_PENDING"
      ).length,
      dot: "bg-rose-500",
    },
    {
      label: "Unavailable",
      value: "UNAVAILABLE",
      count: garments.filter((g) => g.status === "UNAVAILABLE" || g.status === "RETIRED").length,
      dot: "bg-slate-400",
    },
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
    if (selectedStatus === "BOOKED")
      matchesStatus =
        g.status === "BOOKED" || g.status === "RESERVED" || g.status === "PREPARING";
    if (selectedStatus === "OUT_ON_RENT")
      matchesStatus = g.status === "OUT_ON_RENT" || g.status === "RENTED";
    if (selectedStatus === "RETURNED_CLEANING")
      matchesStatus =
        g.status === "RETURNED_CLEANING" ||
        g.status === "RETURN_RECEIVED" ||
        g.status === "IN_LAUNDRY";
    if (selectedStatus === "DAMAGED_REPAIR")
      matchesStatus =
        g.status === "DAMAGED_REPAIR" ||
        g.status === "UNDER_REPAIR" ||
        g.status === "REPAIR_PENDING";
    if (selectedStatus === "UNAVAILABLE")
      matchesStatus = g.status === "UNAVAILABLE" || g.status === "RETIRED";

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
      image:
        photoUrl ||
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600",
      notes: "Newly entered piece",
    };

    DataStore.saveGarment(newUnit);
    setGarments(DataStore.getGarments());
    setShowAddModal(false);
    setAddStep(1);
    setCostumeId("");
    setName("");
  };

  return (
    <div className="space-y-3.5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
            Inventory
          </h1>
          <p className="text-[11px] md:text-xs text-slate-500 mt-0.5">
            11 Exact costume fields &amp; 6 status states across Bargarh racks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle (desktop) */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-500"
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-500"
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => {
              setAddStep(1);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 bg-[#6B1D2F] hover:bg-[#551624] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Piece</span>
          </button>
        </div>
      </div>

      {/* COMPACT FILTER & SEARCH STRIP */}
      <div className="bg-white p-3 md:p-4 rounded-xl border border-[#E2E8F0] shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Costume ID (LF-001), category, size, colour, or rack..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#6B1D2F] text-slate-800"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-hidden"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "All Categories" : c}
              </option>
            ))}
          </select>
        </div>

        {/* Single-Row Horizontally Scrollable Status Pills with Colour Dots */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-t border-slate-100 pt-2 select-none no-scrollbar">
          {statuses.map((st) => (
            <button
              key={st.value}
              onClick={() => setSelectedStatus(st.value)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedStatus === st.value
                  ? "bg-slate-900 text-white shadow-xs font-semibold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              {st.dot && <span className={`w-2 h-2 rounded-full ${st.dot}`} />}
              <span>{st.label}</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded-full font-bold ${
                  selectedStatus === st.value
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {st.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE CARDS VIEW (< 768px): 4-ROW ZERO-SCROLL LAYOUT     */}
      {/* ========================================================= */}
      <div className="block md:hidden space-y-3">
        {filteredGarments.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-[#E6E4DF] text-center text-xs text-slate-500 shadow-2xs">
            No costumes found matching your filter.
          </div>
        ) : (
          filteredGarments.map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-xl border border-[#E6E4DF] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-2.5"
            >
              {/* Row 1: Header (Costume ID on left, Status Badge on right) */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-[#6B1D2F] bg-rose-50/60 px-2 py-0.5 rounded border border-rose-200/60">
                  {g.id}
                </span>
                <StatusBadge status={g.status} />
              </div>

              {/* Row 2: Body Block (Thumbnail + Name on own line, category/size/colour, and 2-col info strip) */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <img
                    src={g.image}
                    alt={g.productName}
                    className="w-12 h-12 rounded-lg object-cover border border-[#E6E4DF] shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 leading-snug line-clamp-1">
                      {g.productName}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 truncate">
                      {g.category} · {g.size} · {g.colour}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#FAF9F6] border border-[#EFECE6] p-2.5 rounded-lg text-xs mt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Rental Rate</span>
                    <span className="font-semibold text-slate-900">{formatINR(g.rentalPrice)} <span className="text-[10px] text-slate-500 font-normal">/ 3d</span></span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Godown Rack</span>
                    <span className="font-semibold text-slate-800">{g.location || g.storageLocation}</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Footer (Details on left, Book Piece on right) */}
              <div className="flex items-center justify-between pt-2 border-t border-[#EFECE6] gap-2">
                <button
                  onClick={() => setSelectedGarment(g)}
                  className="h-8 px-3 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-[#E6E4DF] hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Details
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setQrGarment(g)}
                    title="Rack Tag"
                    className="h-8 px-2 text-slate-500 hover:text-slate-800 bg-white border border-[#E6E4DF] rounded-lg text-xs transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => router.push(`/erp/bookings?new=true&sku=${g.id}`)}
                    className="h-8 px-3.5 bg-[#6B1D2F] hover:bg-[#551624] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    Book Piece
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========================================================= */}
      {/* DESKTOP PRESENTATION (>= 768px): TABLE OR GRID            */}
      {/* ========================================================= */}
      <div className="hidden md:block">
        {viewMode === "table" ? (
          <div className="bg-white rounded-xl border border-[#E6E4DF] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F6] border-b border-[#E6E4DF] text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Size &amp; Color</th>
                    <th className="py-3 px-3">Godown Rack</th>
                    <th className="py-3 px-3">Rental Rate</th>
                    <th className="py-3 px-3">Deposit</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFECE6]">
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
                      <td className="py-3 px-3 text-slate-500 font-medium whitespace-nowrap">
                        {g.category}
                      </td>
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
                          <button
                            onClick={() => setSelectedGarment(g)}
                            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-[11px] font-medium"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredGarments.map((g) => (
              <div
                key={g.id}
                onClick={() => setSelectedGarment(g)}
                className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div className="relative">
                  <img
                    src={g.image}
                    alt={g.productName}
                    className="w-full h-44 object-cover group-hover:scale-102 transition-transform duration-200"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="font-mono text-[10px] bg-slate-900/90 text-white font-bold px-2 py-0.5 rounded shadow-xs">
                      {g.id}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <StatusBadge status={g.status} />
                  </div>
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      {g.category}
                    </span>
                    <h3 className="font-medium text-slate-900 text-xs mt-0.5 line-clamp-1">
                      {g.productName}
                    </h3>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Size: {g.size} · {g.colour}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">Rental / 3d</div>
                      <div className="font-bold text-[#6B1D2F]">{formatINR(g.rentalPrice)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Rack</div>
                      <div className="text-[11px] font-medium text-slate-700">
                        {g.location || g.storageLocation}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* FULL DETAILS BOTTOM SHEET (ALL 11 CLIENT FIELDS)          */}
      {/* ========================================================= */}
      {selectedGarment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-4 sm:p-6 text-xs max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Grab handle for mobile */}
            <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-[#6B1D2F]">
                  {selectedGarment.id}
                </span>
                <StatusBadge status={selectedGarment.status} />
              </div>
              <button
                onClick={() => setSelectedGarment(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content: Photo + 11 Fields */}
            <div className="mt-3 space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 h-48 sm:h-56 bg-slate-100">
                <img
                  src={selectedGarment.image}
                  alt={selectedGarment.productName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded">
                  {selectedGarment.category}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {selectedGarment.productName}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Condition:{" "}
                  <strong className="text-emerald-700">
                    {selectedGarment.condition || selectedGarment.conditionRating}
                  </strong>{" "}
                  · Colour: <strong>{selectedGarment.colour || "Standard"}</strong> · Size:{" "}
                  <strong>{selectedGarment.size}</strong>
                </p>
              </div>

              {/* 11 Fields Details Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Rental Price / 3 Days
                  </span>
                  <span className="text-sm font-bold text-[#6B1D2F]">
                    {formatINR(selectedGarment.rentalPrice)}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Security Deposit (Refundable)
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatINR(selectedGarment.securityDeposit)}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Purchase Price / Asset Cost
                  </span>
                  <span className="font-semibold text-slate-700">
                    {formatINR(selectedGarment.purchasePrice || 25000)}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Storage Godown Rack
                  </span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#6B1D2F]" />
                    <span>{selectedGarment.location || selectedGarment.storageLocation}</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedGarment(null);
                    router.push(`/erp/bookings?new=1&sku=${selectedGarment.id}`);
                  }}
                  className="flex-1 py-2.5 bg-[#6B1D2F] hover:bg-[#551624] text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Book this Piece</span>
                </button>

                <button
                  onClick={() => {
                    setQrGarment(selectedGarment);
                    setSelectedGarment(null);
                  }}
                  className="px-3 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium text-xs transition-colors flex items-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Rack Tag</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD PIECE WIZARD (MOBILE STEP-BY-STEP & DESKTOP)          */}
      {/* ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-4 sm:p-6 text-xs max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />

            {/* Modal Header & Step Indicator */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-semibold text-sm text-slate-900">Add New Costume Piece</span>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Step {addStep} of 2: {addStep === 1 ? "Costume Identity" : "Pricing & Godown Rack"}
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCostume} className="mt-4 space-y-3">
              {addStep === 1 ? (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                        Costume ID *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. LF-005"
                        value={costumeId}
                        onChange={(e) => setCostumeId(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                        Category *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ProductCategory)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                      >
                        {categories
                          .filter((c) => c !== "ALL")
                          .map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                      Garment Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Red Royal Zardozi Bridal Lehenga"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                        Size
                      </label>
                      <input
                        type="text"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                        Colour
                      </label>
                      <input
                        type="text"
                        value={colour}
                        onChange={(e) => setColour(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                      Photo URL
                    </label>
                    <input
                      type="url"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                        Rental Rate (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        value={rentalPrice}
                        onChange={(e) => setRentalPrice(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-[#6B1D2F]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                        Security Deposit (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        value={securityDeposit}
                        onChange={(e) => setSecurityDeposit(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                        Purchase / Asset Cost (₹)
                      </label>
                      <input
                        type="number"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                        Condition
                      </label>
                      <select
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                      >
                        <option value="Excellent">Excellent</option>
                        <option value="Good">Good</option>
                        <option value="Minor Wear">Minor Wear</option>
                        <option value="Repairs Needed">Repairs Needed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                      Godown Rack Location *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Godown Rack A-01"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Sticky Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {addStep === 2 ? (
                  <button
                    type="button"
                    onClick={() => setAddStep(1)}
                    className="px-3.5 py-2 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3.5 py-2 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}

                {addStep === 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!costumeId || !name) {
                        alert("Please fill Costume ID and Name");
                        return;
                      }
                      setAddStep(2);
                    }}
                    className="px-4 py-2 bg-[#6B1D2F] hover:bg-[#551624] text-white font-semibold rounded-lg shadow-xs"
                  >
                    Next: Pricing &amp; Rack
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#6B1D2F] hover:bg-[#551624] text-white font-semibold rounded-lg shadow-xs"
                  >
                    Save Piece
                  </button>
                )}
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
              <div className="text-xs text-slate-600 mt-1">
                {qrGarment.category} · {qrGarment.size}
              </div>
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
