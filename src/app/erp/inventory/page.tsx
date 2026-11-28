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
import { formatINR, formatDate, plural } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CostumeThumb } from "@/components/ui/CostumeThumb";
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
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");

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

  const openRackEditor = (g: GarmentDto) => {
    setEditingRackGarment(g);
    setNewRack(g.rack);
    setNewShelf(g.shelf || "");
  };

  /** Rack tag: location pill with quick-edit affordance. */
  const rackTag = (g: GarmentDto) => (
    <div className="flex items-center justify-between gap-2 bg-ivory border border-line rounded-lg pl-2.5 pr-1 min-h-10">
      <div className="flex items-center gap-1.5 text-[11px] text-ink-soft min-w-0">
        <MapPin className="w-3.5 h-3.5 text-plum shrink-0" />
        <span className="num font-semibold truncate">
          {g.rack}
          {g.shelf ? ` · ${g.shelf}` : ""}
        </span>
      </div>
      <button
        onClick={() => openRackEditor(g)}
        className="w-10 h-10 flex items-center justify-center text-mute hover:text-plum rounded-md"
        title="Edit rack location"
        aria-label={`Edit rack location for ${g.id}`}
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  const sizePill = (g: GarmentDto) => (
    <span className="num text-[11px] font-bold bg-plum/10 border border-plum/30 text-plum px-2.5 py-0.5 rounded-full whitespace-nowrap">Size {g.size}</span>
  );

  return (
    <div className="space-y-5 md:space-y-6 animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span className="eyebrow text-[#059669]">THE WARDROBE</span>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h1 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] text-[#18141E]">Costumes &amp; Inventory</h1>
            <span className="num text-[11px] font-semibold bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0] px-3 py-0.5 rounded-full">
              {plural(garments.length, "piece")}
            </span>
          </div>
          <p className="text-xs text-[#5B5566] mt-1.5">Godown rack tracking, booking availability and care states.</p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => {
                setCostumeId(`LF-${String(garments.length + 1).padStart(3, "0")}`);
                setAddError(null);
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 min-h-11 bg-gradient-to-r from-[#BE123C] to-[#7C3AED] hover:from-[#9F1239] hover:to-[#6D28D9] text-white rounded-full text-sm font-medium shadow-[0_6px_18px_-3px_rgba(190,18,60,0.35)] transition-all shrink-0"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Add Costume</span>
            </button>
          )}

          <div className="flex items-center bg-[#F5F2F8] p-1 rounded-full border border-[#E8E2F0]" role="group" aria-label="View mode">
            <button
              onClick={() => setViewMode("grid")}
              aria-pressed={viewMode === "grid"}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                viewMode === "grid" ? "bg-white text-[#BE123C] shadow-xs border border-[#E8E2F0]" : "text-[#5B5566] hover:text-[#18141E]"
              }`}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              aria-pressed={viewMode === "table"}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                viewMode === "table" ? "bg-white text-[#BE123C] shadow-xs border border-[#E8E2F0]" : "text-[#5B5566] hover:text-[#18141E]"
              }`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-3 surface p-3.5 md:p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by SKU (e.g. LF-001), garment name, fabric or rack..."
              className="w-full pl-9 pr-10 min-h-11 bg-ivory border border-line rounded-xl text-xs font-medium text-ink placeholder-stone-400 focus:outline-none focus:border-plum"
            />
            <Search className="w-4 h-4 text-mute absolute left-3 top-3.5" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                className="absolute right-0 top-0 w-10 h-10 flex items-center justify-center text-mute hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full min-h-11 px-3 bg-ivory border border-line rounded-xl text-xs font-medium text-ink focus:outline-none focus:border-plum"
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
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-3 border-t border-line-soft">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              aria-pressed={selectedCategory === cat}
              className={`px-4 min-h-10 rounded-full text-[11px] whitespace-nowrap transition-colors shrink-0 border ${
                selectedCategory === cat
                  ? "bg-plum text-white font-semibold border-plum"
                  : "bg-white hover:bg-ivory-deep text-ink-soft font-medium border-line"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Inventory Display */}
      {loading ? (
        <div className="surface p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-plum mx-auto mb-2" />
          <div className="text-xs text-mute">Loading inventory...</div>
        </div>
      ) : garments.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={Shirt}
            title="No costumes match your filters"
            hint="Try clearing search keywords or switching the category."
            action={
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("ALL");
                  setSelectedStatus("ALL");
                }}
                className="px-4 min-h-10 bg-white hover:bg-ivory-deep border border-line text-ink-soft text-xs font-semibold rounded-lg"
              >
                Clear Filters
              </button>
            }
          />
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {garments.map((g) => (
            <article key={g.id} className="surface surface-interactive overflow-hidden flex flex-col group">
              <div className="aspect-[4/5] relative overflow-hidden bg-ivory-deep">
                <CostumeThumb
                  src={g.mainPhotoUrl}
                  alt={g.name}
                  className="absolute inset-0"
                  imgClassName="group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="num font-bold text-[11px] bg-ink/80 text-white px-2 py-0.5 rounded-md backdrop-blur-xs">{g.id}</span>
                </div>
                <div className="absolute top-2.5 right-2.5">
                  <StatusBadge status={g.status} />
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col gap-3">
                <div>
                  <div className="eyebrow-mute">{g.category}</div>
                  <h3 className="font-display font-semibold text-[15px] text-ink line-clamp-1 mt-1">{g.name}</h3>
                  <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                    {sizePill(g)}
                    {g.colour && <span className="text-[11px] text-mute">{g.colour}</span>}
                  </div>
                  {g.nextBooking && (
                    <div className="num text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 font-medium mt-2 leading-snug">
                      Reserved from {formatDate(g.nextBooking.from)} · {g.nextBooking.customerName}
                    </div>
                  )}
                </div>

                <div className="mt-auto space-y-2.5">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="eyebrow-mute">Rental</div>
                      <div className="num font-display font-semibold text-lg text-plum leading-tight">{formatINR(g.rentalPrice)}</div>
                    </div>
                    <div className="text-right">
                      <div className="eyebrow-mute">Deposit</div>
                      <div className="num text-xs font-semibold text-ink-soft">{formatINR(g.securityDeposit)}</div>
                    </div>
                  </div>

                  {rackTag(g)}

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/erp/inventory/${g.id}`}
                      className="min-h-10 flex items-center justify-center bg-white hover:bg-ivory-deep border border-line text-ink-soft font-semibold rounded-lg text-[11px] transition-colors"
                    >
                      Details
                    </Link>
                    <Link
                      href={`/erp/bookings/new?sku=${g.id}`}
                      className="min-h-10 flex items-center justify-center bg-plum hover:bg-plum-dark text-white font-semibold rounded-lg text-[11px] transition-colors"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-line shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[780px]">
              <thead>
                <tr className="bg-ivory-deep border-b border-line">
                  {["Garment SKU", "Category & Specs", "Current Status", "Godown Location", "Rental / Deposit", "Actions"].map((h, i) => (
                    <th key={h} className={`py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-ink-soft ${i >= 4 ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {garments.map((g) => (
                  <tr key={g.id} className="hover:bg-ivory transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <CostumeThumb src={g.mainPhotoUrl} alt={g.name} className="w-12 h-14 rounded-lg border border-line shrink-0" />
                        <div className="min-w-0">
                          <span className="num font-bold text-xs text-plum">{g.id}</span>
                          <div className="font-display font-semibold text-ink line-clamp-1">{g.name}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-ink-soft font-medium">{g.category}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {sizePill(g)}
                        {g.colour && <span className="text-[11px] text-mute">{g.colour}</span>}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={g.status} />
                      {g.nextBooking && (
                        <div className="num text-[10px] text-amber-800 font-medium mt-1">
                          Next: {g.nextBooking.from} ({g.nextBooking.customerName})
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 min-w-44">{rackTag(g)}</td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="num font-display font-semibold text-ink text-sm">{formatINR(g.rentalPrice)}</div>
                      <div className="num text-[10px] text-mute">Dep: {formatINR(g.securityDeposit)}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/erp/inventory/${g.id}`}
                          className="px-3 min-h-10 inline-flex items-center bg-white hover:bg-ivory-deep border border-line text-ink-soft font-semibold rounded-lg text-[11px] transition-colors"
                        >
                          Details
                        </Link>
                        <Link
                          href={`/erp/bookings/new?sku=${g.id}`}
                          className="px-3 min-h-10 inline-flex items-center bg-plum hover:bg-plum-dark text-white font-semibold rounded-lg text-[11px] transition-colors"
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
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-line shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Update Godown Rack</h3>
                <span className="text-[11px] num text-plum font-semibold">
                  {editingRackGarment.id} · {editingRackGarment.name}
                </span>
              </div>
              <button
                onClick={() => setEditingRackGarment(null)}
                aria-label="Close" className="w-10 h-10 -mr-2 rounded-lg flex items-center justify-center text-mute hover:text-ink hover:bg-ivory-deep"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateLocation} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Rack Name / Number
                </label>
                <input
                  type="text"
                  value={newRack}
                  onChange={(e) => setNewRack(e.target.value)}
                  placeholder="e.g. Rack A-02, Godown Rack B"
                  className="w-full p-2.5 bg-ivory border border-line rounded-xl font-medium focus:outline-none focus:border-plum"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Shelf / Compartment (Optional)
                </label>
                <input
                  type="text"
                  value={newShelf}
                  onChange={(e) => setNewShelf(e.target.value)}
                  placeholder="e.g. Shelf 2, Box 3"
                  className="w-full p-2.5 bg-ivory border border-line rounded-xl font-medium focus:outline-none focus:border-plum"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRackGarment(null)}
                  className="flex-1 py-2 rounded-xl border border-stone-200 text-stone-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLocation}
                  className="flex-1 py-2 bg-plum text-white rounded-xl font-semibold shadow-xs flex items-center justify-center gap-1.5"
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
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-line shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-display font-semibold text-ink text-base">Add New Rental Costume</h3>
                <p className="text-[11px] text-stone-500">Persists directly to live Turso database</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddError(null);
                }}
                aria-label="Close" className="w-10 h-10 -mr-2 rounded-lg flex items-center justify-center text-mute hover:text-ink hover:bg-ivory-deep"
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
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Costume SKU ID *
                  </label>
                  <input
                    type="text"
                    value={costumeId}
                    onChange={(e) => setCostumeId(e.target.value)}
                    placeholder="e.g. LF-041"
                    className="w-full p-2.5 bg-ivory border border-line rounded-xl num font-bold text-stone-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-ivory border border-line rounded-xl font-medium text-stone-800"
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
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Costume Title / Design Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Zardosi Maroon Velvet Bridal Lehenga"
                  className="w-full p-2.5 bg-ivory border border-line rounded-xl font-medium text-stone-800"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">
                    Size *
                  </label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="e.g. M / 38"
                    className="w-full p-2 bg-ivory border border-line rounded-xl font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">
                    Colour
                  </label>
                  <input
                    type="text"
                    value={colour}
                    onChange={(e) => setColour(e.target.value)}
                    placeholder="e.g. Maroon"
                    className="w-full p-2 bg-ivory border border-line rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">
                    Fabric
                  </label>
                  <input
                    type="text"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    placeholder="e.g. Velvet"
                    className="w-full p-2 bg-ivory border border-line rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-stone-700 uppercase mb-1">
                    Rental Tariff (₹) *
                  </label>
                  <input
                    type="number"
                    value={rentalPrice}
                    onChange={(e) => setRentalPrice(e.target.value)}
                    className="w-full p-2 bg-ivory border border-line rounded-xl num font-bold text-plum"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-700 uppercase mb-1">
                    Deposit (₹) *
                  </label>
                  <input
                    type="number"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    className="w-full p-2 bg-ivory border border-line rounded-xl num font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-700 uppercase mb-1">
                    Purchase Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(e.target.value)}
                    className="w-full p-2 bg-ivory border border-line rounded-xl num text-stone-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Rack Location *
                  </label>
                  <input
                    type="text"
                    value={rack}
                    onChange={(e) => setRack(e.target.value)}
                    placeholder="e.g. Rack A-01"
                    className="w-full p-2.5 bg-ivory border border-line rounded-xl font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Shelf
                  </label>
                  <input
                    type="text"
                    value={shelf}
                    onChange={(e) => setShelf(e.target.value)}
                    placeholder="e.g. Shelf 1"
                    className="w-full p-2.5 bg-ivory border border-line rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Design &amp; Fitting Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Padded blouse, includes matching dupatta and can-can skirt layer."
                  className="w-full p-2.5 bg-ivory border border-line rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                  setShowAddModal(false);
                  setAddError(null);
                }}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-plum hover:bg-plum-dark text-white rounded-xl font-semibold shadow-xs flex items-center justify-center gap-1.5"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gold-light" />
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
