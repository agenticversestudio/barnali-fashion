"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Loader2,
  Edit2,
  Check,
} from "lucide-react";
import { garmentsApi } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { GarmentDto, GarmentStatus } from "@/types/api";
import { useAuth } from "@/context/AuthContext";

export default function InventoryPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  const [garments, setGarments] = useState<GarmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Selected item for Bottom Sheet (Mobile / Tablet quick preview)
  const [selectedGarment, setSelectedGarment] = useState<GarmentDto | null>(null);

  // Quick Inline Rack Edit Modal / Prompt
  const [editingRackGarment, setEditingRackGarment] = useState<GarmentDto | null>(null);
  const [newRack, setNewRack] = useState("");
  const [newShelf, setNewShelf] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);

  // Add Costume Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [costumeId, setCostumeId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Bridal Lehenga");
  const [size, setSize] = useState("M / Adjustable");
  const [colour, setColour] = useState("Crimson Red");
  const [fabric, setFabric] = useState("Raw Silk");
  const [rentalPrice, setRentalPrice] = useState("4500");
  const [securityDeposit, setSecurityDeposit] = useState("3000");
  const [purchaseCost, setPurchaseCost] = useState("22000");
  const [rack, setRack] = useState("Rack A-01");
  const [shelf, setShelf] = useState("Shelf 1");
  const [description, setDescription] = useState("");

  const loadGarments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await garmentsApi.list({
        q: searchTerm.trim() || undefined,
        category: selectedCategory !== "ALL" ? selectedCategory : undefined,
        status: selectedStatus !== "ALL" ? (selectedStatus as GarmentStatus) : undefined,
      });
      setGarments(res.items || []);
    } catch (err) {
      console.error("Failed to load garments:", err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, selectedStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadGarments();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadGarments]);

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

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRackGarment || !newRack.trim()) return;

    setSavingLocation(true);
    try {
      await garmentsApi.updateLocation(editingRackGarment.id, {
        rack: newRack.trim(),
        shelf: newShelf.trim() || undefined,
      });
      setEditingRackGarment(null);
      await loadGarments();
    } catch (err: any) {
      alert(err?.message || "Failed to update location");
    } finally {
      setSavingLocation(false);
    }
  };

  const handleCreateGarment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!costumeId.trim() || !name.trim() || !rentalPrice || !securityDeposit || !rack.trim()) {
      setAddError("Please fill in SKU ID, Name, Rental Price, Deposit and Rack location.");
      return;
    }

    setCreating(true);
    setAddError(null);

    try {
      await garmentsApi.create({
        id: costumeId.trim().toUpperCase(),
        name: name.trim(),
        category,
        size,
        colour,
        fabric,
        rentalPrice: Number(rentalPrice),
        securityDeposit: Number(securityDeposit),
        purchaseCost: purchaseCost ? Number(purchaseCost) : undefined,
        rack: rack.trim(),
        shelf: shelf.trim() || undefined,
        description: description.trim() || undefined,
      });

      setShowAddModal(false);
      // Reset form
      setCostumeId("");
      setName("");
      setDescription("");
      await loadGarments();
    } catch (err: any) {
      setAddError(err?.message || "Failed to create garment. SKU might already exist.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 md:p-6 rounded-2xl border border-[#E6E4DF] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif font-bold text-xl md:text-2xl text-slate-900 tracking-tight">
              Costumes &amp; Inventory Assets
            </h1>
            <span className="text-xs font-mono font-semibold bg-[#6B1D2F]/10 text-[#6B1D2F] px-2.5 py-0.5 rounded-full">
              {garments.length} Pieces
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time godown rack tracking, booking availability &amp; care states.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => {
                setCostumeId(`LF-${String(garments.length + 1).padStart(3, "0")}`);
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-[#6B1D2F] hover:bg-[#521624] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Costume</span>
            </button>
          )}

          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "table" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-3 bg-white p-3.5 md:p-4 rounded-2xl border border-[#E6E4DF] shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by SKU (e.g. LF-001), garment name, fabric or rack..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#6B1D2F]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2.5 px-3 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#6B1D2F]"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available Now</option>
              <option value="OUT_ON_RENT">Out on Rent</option>
              <option value="RETURNED_CLEANING">Cleaning Pending</option>
              <option value="IN_CARE">In Care / Tailoring</option>
              <option value="DAMAGED_REPAIR">Damaged / Repair</option>
              <option value="UNAVAILABLE">Unavailable / Retired</option>
            </select>
          </div>
        </div>

        {/* Scrollable Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-slate-100">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors shrink-0 ${
                selectedCategory === cat
                  ? "bg-[#6B1D2F] text-white font-semibold"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Inventory Display */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E6E4DF] p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#6B1D2F] mx-auto mb-2" />
          <div className="text-xs text-slate-500">Loading inventory assets from database...</div>
        </div>
      ) : garments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E6E4DF] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Shirt className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-slate-800">No costumes match your filters</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try clearing search keywords or switching category filters.
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("ALL");
              setSelectedStatus("ALL");
            }}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {garments.map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-2xl border border-[#E6E4DF] overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col group"
            >
              <div className="h-56 bg-slate-100 relative overflow-hidden">
                <img
                  src={
                    g.mainPhotoUrl ||
                    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600"
                  }
                  alt={g.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="font-mono font-bold text-xs bg-black/75 text-white px-2 py-0.5 rounded-md backdrop-blur-xs">
                    {g.id}
                  </span>
                </div>
                <div className="absolute top-2.5 right-2.5">
                  <StatusBadge status={g.status} />
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">{g.category}</div>
                  <h3 className="font-serif font-bold text-sm text-slate-900 line-clamp-1 mt-0.5">
                    {g.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span>Size: {g.size}</span>
                    {g.colour && <span>• {g.colour}</span>}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Rental Tariff:</span>
                    <span className="font-bold text-[#6B1D2F] font-mono">
                      {formatINR(g.rentalPrice)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-lg">
                    <div className="flex items-center gap-1.5 text-slate-600 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#6B1D2F] shrink-0" />
                      <span className="truncate">
                        {g.rack} {g.shelf ? `· ${g.shelf}` : ""}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setEditingRackGarment(g);
                        setNewRack(g.rack);
                        setNewShelf(g.shelf || "");
                      }}
                      className="text-slate-400 hover:text-[#6B1D2F] p-0.5"
                      title="Edit Rack Location"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/erp/inventory/${g.id}`}
                      className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-center font-semibold rounded-lg text-[11px] transition-colors"
                    >
                      Details
                    </Link>
                    <Link
                      href={`/erp/bookings/new?sku=${g.id}`}
                      className="flex-1 py-1.5 bg-[#6B1D2F] hover:bg-[#521624] text-white text-center font-semibold rounded-lg text-[11px] transition-colors"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-[#E6E4DF] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#E6E4DF] text-[11px] font-bold uppercase text-slate-500">
                  <th className="py-3 px-4">Garment SKU</th>
                  <th className="py-3 px-4">Category &amp; Specs</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Godown Location</th>
                  <th className="py-3 px-4 text-right">Rental / Deposit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6]">
                {garments.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            g.mainPhotoUrl ||
                            "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=200"
                          }
                          alt={g.name}
                          className="w-11 h-11 object-cover rounded-lg border border-slate-200 shrink-0"
                          loading="lazy"
                        />
                        <div>
                          <span className="font-mono font-bold text-xs text-[#6B1D2F]">
                            {g.id}
                          </span>
                          <div className="font-serif font-semibold text-slate-900 line-clamp-1">
                            {g.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">{g.category}</div>
                      <div className="text-[11px] text-slate-500">
                        Size: <span className="font-semibold text-slate-700">{g.size}</span>
                        {g.colour && <span> · {g.colour}</span>}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={g.status} />
                      {g.nextBooking && (
                        <div className="text-[10px] text-amber-800 font-medium mt-1">
                          Next: {g.nextBooking.from} ({g.nextBooking.customerName})
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#6B1D2F] shrink-0" />
                        <span>{g.rack}</span>
                        {g.shelf && <span className="text-slate-400">· {g.shelf}</span>}
                        <button
                          onClick={() => {
                            setEditingRackGarment(g);
                            setNewRack(g.rack);
                            setNewShelf(g.shelf || "");
                          }}
                          className="text-slate-400 hover:text-[#6B1D2F] ml-1 p-0.5"
                          title="Quick update rack"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="font-mono font-bold text-slate-900 text-xs">
                        {formatINR(g.rentalPrice)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Dep: {formatINR(g.securityDeposit)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/erp/inventory/${g.id}`}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition-colors"
                        >
                          Details
                        </Link>
                        <Link
                          href={`/erp/bookings/new?sku=${g.id}`}
                          className="px-2.5 py-1.5 bg-[#6B1D2F] hover:bg-[#521624] text-white font-semibold rounded-lg text-[11px] transition-colors"
                        >
                          Book
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Edit Rack Modal */}
      {editingRackGarment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-[#E6E4DF] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Update Godown Rack</h3>
                <span className="text-[11px] font-mono text-[#6B1D2F] font-semibold">
                  {editingRackGarment.id} · {editingRackGarment.name}
                </span>
              </div>
              <button
                onClick={() => setEditingRackGarment(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateLocation} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Rack Name / Number
                </label>
                <input
                  type="text"
                  value={newRack}
                  onChange={(e) => setNewRack(e.target.value)}
                  placeholder="e.g. Rack A-02, Godown Rack B"
                  className="w-full p-2.5 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-medium focus:outline-none focus:border-[#6B1D2F]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Shelf / Compartment (Optional)
                </label>
                <input
                  type="text"
                  value={newShelf}
                  onChange={(e) => setNewShelf(e.target.value)}
                  placeholder="e.g. Shelf 2, Box 3"
                  className="w-full p-2.5 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-medium focus:outline-none focus:border-[#6B1D2F]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRackGarment(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLocation}
                  className="flex-1 py-2 bg-[#6B1D2F] text-white rounded-xl font-semibold shadow-xs flex items-center justify-center gap-1.5"
                >
                  {savingLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Location</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Costume Modal (Admin Only) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E6E4DF] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-serif font-bold text-slate-900 text-base">Add New Rental Costume</h3>
                <p className="text-[11px] text-slate-500">Persists directly to live Turso database</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateGarment} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Costume SKU ID *
                  </label>
                  <input
                    type="text"
                    value={costumeId}
                    onChange={(e) => setCostumeId(e.target.value)}
                    placeholder="e.g. LF-041"
                    className="w-full p-2.5 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-mono font-bold text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-medium text-slate-800"
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
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Costume Title / Design Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Zardosi Maroon Velvet Bridal Lehenga"
                  className="w-full p-2.5 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-medium text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Size *
                  </label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="e.g. M / 38"
                    className="w-full p-2 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Colour
                  </label>
                  <input
                    type="text"
                    value={colour}
                    onChange={(e) => setColour(e.target.value)}
                    placeholder="e.g. Maroon"
                    className="w-full p-2 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Fabric
                  </label>
                  <input
                    type="text"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    placeholder="e.g. Velvet"
                    className="w-full p-2 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Rental Tariff (₹) *
                  </label>
                  <input
                    type="number"
                    value={rentalPrice}
                    onChange={(e) => setRentalPrice(e.target.value)}
                    className="w-full p-2 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-mono font-bold text-[#6B1D2F]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Deposit (₹) *
                  </label>
                  <input
                    type="number"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    className="w-full p-2 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Purchase Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(e.target.value)}
                    className="w-full p-2 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-mono text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Rack Location *
                  </label>
                  <input
                    type="text"
                    value={rack}
                    onChange={(e) => setRack(e.target.value)}
                    placeholder="e.g. Rack A-01"
                    className="w-full p-2.5 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Shelf
                  </label>
                  <input
                    type="text"
                    value={shelf}
                    onChange={(e) => setShelf(e.target.value)}
                    placeholder="e.g. Shelf 1"
                    className="w-full p-2.5 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Design &amp; Fitting Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Padded blouse, includes matching dupatta and can-can skirt layer."
                  className="w-full p-2.5 bg-[#F7F6F3] border border-[#E6E4DF] rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-[#6B1D2F] hover:bg-[#521624] text-white rounded-xl font-semibold shadow-xs flex items-center justify-center gap-1.5"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#D4B67F]" />
                      <span>Saving Piece...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Add to Live Stock</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
