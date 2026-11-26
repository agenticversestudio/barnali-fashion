"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Coins,
  Plus,
  Search,
  Filter,
  Calendar,
  Wallet,
  X,
  Tag,
  Loader2,
  Trash2,
  Receipt,
} from "lucide-react";
import { expensesApi } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";
import type { ExpenseDto } from "@/types/api";
import { useAuth } from "@/context/AuthContext";

const CATEGORIES = [
  "Dry Cleaning & Laundry",
  "Tailoring & Alterations",
  "Packaging & Dust Bags",
  "Shop Rent & Electricity",
  "Staff Salary / Commission",
  "Marketing & Local Ads",
  "Travel & Transport",
  "Maintenance & Repair",
  "Miscellaneous",
];

export default function ExpensesPage() {
  const { user, isAdmin } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"CASH" | "UPI" | "BANK_TRANSFER">("UPI");
  const [receiptNo, setReceiptNo] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setExpenseDate(new Date().toISOString().split("T")[0]);
  }, []);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expensesApi.list();
      setExpenses(res.items || []);
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) {
      alert("Please provide a description and amount.");
      return;
    }

    setSubmitting(true);
    try {
      await expensesApi.create({
        date: expenseDate,
        category,
        description: description.trim(),
        amount: Math.round(Number(amount)),
        mode,
        receiptNo: receiptNo.trim() || undefined,
      });

      setShowAddModal(false);
      setDescription("");
      setAmount("");
      setReceiptNo("");
      await loadExpenses();
    } catch (err: any) {
      alert(err?.message || "Failed to record expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    try {
      await expensesApi.delete(id);
      await loadExpenses();
    } catch (err: any) {
      alert(err?.message || "Failed to delete expense");
    }
  };

  const filteredExpenses = expenses.filter((exp) => {
    const matchesCategory = filterCategory === "ALL" || exp.category === filterCategory;
    const matchesSearch =
      !searchQuery ||
      exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.receiptNo && exp.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalExpense = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);
  const cashExpense = filteredExpenses
    .filter((e) => e.mode === "CASH")
    .reduce((acc, exp) => acc + exp.amount, 0);
  const upiExpense = filteredExpenses
    .filter((e) => e.mode !== "CASH")
    .reduce((acc, exp) => acc + exp.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8C6F3B] font-semibold uppercase tracking-wider mb-1">
            <Coins className="w-4 h-4 text-[#4B1835]" />
            <span>Operational Outflow &amp; Maintenance Costs</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#27222A]">Expense Tracker</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Record day-to-day store expenditures including laundry dry cleaning, tailoring, packaging bags, and utilities.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#4B1835] hover:bg-[#320F23] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#D4B67F]" />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* Top Banner KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-5 rounded-2xl border border-[#EFE9DD] shadow-xs">
          <div className="text-gray-400 font-semibold uppercase text-[10px]">
            Total Expenses ({filteredExpenses.length})
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1 font-mono">{formatINR(totalExpense)}</div>
          <div className="text-gray-500 text-[11px] mt-1">Based on current filter view</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EFE9DD] shadow-xs">
          <div className="text-gray-400 font-semibold uppercase text-[10px]">
            Cash Drawer Outflow
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1 font-mono">{formatINR(cashExpense)}</div>
          <div className="text-gray-500 text-[11px] mt-1">Directly deducted from cash drawer</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EFE9DD] shadow-xs">
          <div className="text-gray-400 font-semibold uppercase text-[10px]">
            UPI / Bank Outflow
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1 font-mono">{formatINR(upiExpense)}</div>
          <div className="text-gray-500 text-[11px] mt-1">Direct digital vendor payments</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#EFE9DD] p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search expense description, category, or receipt #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-2 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl text-xs font-semibold text-gray-700"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expense List Table */}
      <div className="bg-white rounded-2xl border border-[#EFE9DD] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin text-[#4B1835] mx-auto mb-2" />
            Loading store expense records...
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            No expenses found matching the current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EB] border-b border-[#EFE9DD] text-[#8C6F3B] uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-3">Expense Category</th>
                  <th className="py-3 px-3">Description &amp; Purpose</th>
                  <th className="py-3 px-3">Payment Mode</th>
                  <th className="py-3 px-3">Receipt / Ref</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1ECE3]">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#FBF9F5] transition-colors">
                    <td className="py-3 px-4 font-mono text-gray-600">{formatDate(exp.date)}</td>
                    <td className="py-3 px-3 font-semibold text-gray-900">
                      <span className="bg-[#FAF5EB] text-[#8C6F3B] px-2 py-0.5 rounded text-[11px] border border-[#E8DFD1]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-700 font-medium">{exp.description}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-gray-600">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          exp.mode === "CASH"
                            ? "bg-amber-100 text-amber-800"
                            : exp.mode === "UPI"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {exp.mode}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-500 text-[11px]">
                      {exp.receiptNo || "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                      {formatINR(exp.amount)}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="text-gray-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                          title="Delete expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EFE9DD] max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DD]">
              <div className="flex items-center gap-2 font-bold text-sm text-[#4B1835]">
                <Plus className="w-4 h-4 text-[#B89558]" />
                <span>Record Store Expense</span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Expense Date *
                </label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Expense Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Description / Purpose *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50 bridal dust cover bags &amp; hangers"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 1500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold font-mono text-rose-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                    className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-semibold"
                  >
                    <option value="UPI">UPI (PhonePe / GPay)</option>
                    <option value="CASH">Cash in Drawer</option>
                    <option value="BANK_TRANSFER">Bank NEFT/RTGS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Voucher / Receipt # (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. BILL-9821"
                  value={receiptNo}
                  onChange={(e) => setReceiptNo(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-mono"
                />
              </div>

              <div className="pt-3 border-t border-[#EFE9DD] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#4B1835] hover:bg-[#320F23] disabled:opacity-50 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Expense</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
