"use client";

import React, { useState, useEffect } from "react";
import {
  Coins,
  Plus,
  Search,
  Filter,
  Calendar,
  Wallet,
  X,
  Tag,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { formatINR, formatDate } from "@/lib/utils";
import { ExpenseRecord } from "@/types";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [category, setCategory] = useState<ExpenseRecord["category"]>("Packaging & Dust Bags");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "BANK_TRANSFER">("UPI");
  const [recordedBy, setRecordedBy] = useState("Pooja Das (Manager)");

  useEffect(() => {
    setExpenses(DataStore.getExpenses());
  }, []);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) {
      alert("Please fill description and amount");
      return;
    }

    DataStore.addExpense({
      date: new Date().toISOString().split("T")[0],
      category,
      description,
      amount: Number(amount) || 0,
      paymentMode,
      recordedBy,
    });

    setExpenses(DataStore.getExpenses());
    setShowAddModal(false);
    alert("Expense recorded successfully!");
  };

  const totalExpense = expenses.reduce((acc, exp) => acc + exp.amount, 0);

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
          className="bg-[#4B1835] hover:bg-[#320F23] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4 text-[#D4B67F]" />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* Top Banner KPI */}
      <div className="bg-white p-5 rounded-2xl border border-[#EFE9DD] flex items-center justify-between shadow-xs">
        <div>
          <div className="text-gray-400 font-semibold uppercase text-[10px]">
            Total Store Expenses Recorded
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{formatINR(totalExpense)}</div>
        </div>
        <span className="text-xs text-[#8C6F3B] bg-[#FAF5EB] px-3 py-1.5 rounded-xl font-bold border border-[#E8DFD1]">
          {expenses.length} Expense Transactions
        </span>
      </div>

      {/* Expense List Table */}
      <div className="bg-white rounded-2xl border border-[#EFE9DD] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5EB] border-b border-[#EFE9DD] text-[#8C6F3B] uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Expense Category</th>
                <th className="py-3 px-3">Description &amp; Purpose</th>
                <th className="py-3 px-3">Payment Mode</th>
                <th className="py-3 px-3">Recorded By</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1ECE3]">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-[#FBF9F5] transition-colors">
                  <td className="py-3 px-4 font-mono text-gray-600">{formatDate(exp.date)}</td>
                  <td className="py-3 px-3 font-semibold text-gray-900">
                    <span className="bg-[#FAF5EB] text-[#8C6F3B] px-2 py-0.5 rounded text-[11px] border border-[#E8DFD1]">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-700 font-medium">{exp.description}</td>
                  <td className="py-3 px-3 font-mono font-semibold text-gray-600">{exp.paymentMode}</td>
                  <td className="py-3 px-3 text-gray-500">{exp.recordedBy}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                    {formatINR(exp.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Expense Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold"
                >
                  <option value="Dry Cleaning & Laundry">Dry Cleaning & Laundry</option>
                  <option value="Tailoring & Alterations">Tailoring & Alterations</option>
                  <option value="Garment Purchase / New Stock">Garment Purchase / New Stock</option>
                  <option value="Packaging & Dust Bags">Packaging & Dust Bags</option>
                  <option value="Shop Rent & Electricity">Shop Rent & Electricity</option>
                  <option value="Staff Salary / Commission">Staff Salary / Commission</option>
                  <option value="Marketing & Local Ads">Marketing & Local Ads</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Description / Vendor Details *
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
                    required
                    placeholder="e.g. 1500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold text-rose-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-semibold"
                  >
                    <option value="UPI">UPI (PhonePe / GPay)</option>
                    <option value="CASH">Cash in Drawer</option>
                    <option value="BANK_TRANSFER">Bank NEFT/RTGS</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EFE9DD] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4B1835] hover:bg-[#320F23] text-white font-bold rounded-xl shadow-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
