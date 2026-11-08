"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Globe,
  Building2,
} from "lucide-react";
import { DataStore } from "@/lib/dataStore";
import { UserRole } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@barnalifashion.com");
  const [password, setPassword] = useState("••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("owner");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    DataStore.setCurrentRole(selectedRole);
    router.push("/erp/dashboard");
  };

  const handleQuickDemoEnter = (role: UserRole) => {
    DataStore.setCurrentRole(role);
    router.push("/erp/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col justify-between p-4 md:p-8">
      {/* Top Navbar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#4B1835] text-[#D4B67F] font-serif font-black flex items-center justify-center text-sm shadow-sm">
            BF
          </div>
          <div>
            <span className="font-serif font-bold text-sm text-[#27222A] tracking-wider">
              BARNALI FASHION
            </span>
            <span className="text-[10px] text-[#8C6F3B] block font-semibold">Bargarh, Odisha</span>
          </div>
        </Link>

        <Link
          href="/"
          className="text-xs font-semibold text-[#4B1835] hover:text-[#320F23] flex items-center gap-1.5 bg-white border border-[#E8DFD1] px-3 py-1.5 rounded-lg shadow-2xs"
        >
          <Globe className="w-3.5 h-3.5 text-[#B89558]" />
          <span>Customer Website</span>
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-8 bg-white rounded-3xl border border-[#EFE9DD] p-8 shadow-xl text-xs space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-[#4B1835] text-[#D4B67F] font-serif font-black text-xl flex items-center justify-center mx-auto shadow-md">
            BF
          </div>
          <h1 className="font-serif font-bold text-2xl text-[#27222A] pt-2">
            Staff &amp; ERP Access
          </h1>
          <p className="text-gray-500 text-xs">
            Rental billing, garment availability, laundry &amp; financial operations.
          </p>
        </div>

        {/* Demo Fast Access Pill */}
        <div className="bg-[#FAF5EB] p-3.5 rounded-2xl border border-[#E8DFD1] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#8C6F3B]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Click Prototype Demo Access</span>
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">
              Active
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => handleQuickDemoEnter("owner")}
              className="p-2 bg-white hover:bg-[#F3EFE7] border border-[#E8DFD1] rounded-xl font-bold text-[#4B1835] text-left transition-colors"
            >
              👑 Store Owner
            </button>
            <button
              onClick={() => handleQuickDemoEnter("manager")}
              className="p-2 bg-white hover:bg-[#F3EFE7] border border-[#E8DFD1] rounded-xl font-bold text-gray-800 text-left transition-colors"
            >
              💼 Store Manager
            </button>
            <button
              onClick={() => handleQuickDemoEnter("sales_staff")}
              className="p-2 bg-white hover:bg-[#F3EFE7] border border-[#E8DFD1] rounded-xl font-bold text-gray-800 text-left transition-colors"
            >
              🏷️ Counter Staff
            </button>
            <button
              onClick={() => handleQuickDemoEnter("accountant")}
              className="p-2 bg-white hover:bg-[#F3EFE7] border border-[#E8DFD1] rounded-xl font-bold text-gray-800 text-left transition-colors"
            >
              📊 Accountant
            </button>
          </div>
        </div>

        {/* Standard Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
              Registered Staff Email / Phone
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#4B1835] hover:bg-[#320F23] text-white font-bold py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-xs"
          >
            <span>Enter Barnali ERP Dashboard</span>
            <ArrowRight className="w-4 h-4 text-[#D4B67F]" />
          </button>
        </form>

        <div className="text-center text-[11px] text-gray-400 pt-2 border-t border-[#EFE9DD]">
          Barnali Fashion Bargarh • Security Guarded Session
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-[11px] text-gray-400">
        In front of LIC Office, near Keshariya Restaurant, Bargarh, Odisha 768028 • Phone: +91 7978256488
      </div>
    </div>
  );
}
