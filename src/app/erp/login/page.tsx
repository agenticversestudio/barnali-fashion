"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Globe,
  AlertCircle,
  Loader2,
  ShieldCheck,
  User,
} from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/erp/dashboard";
  const { refreshUser } = useAuth();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authApi.login({ username: username.trim(), password });
      await refreshUser();
      router.push(nextUrl);
    } catch (err: any) {
      setError(err?.message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
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
          className="text-xs font-semibold text-[#4B1835] hover:text-[#320F23] flex items-center gap-1.5 bg-white border border-[#E8DFD1] px-3 py-1.5 rounded-lg shadow-2xs min-h-10"
        >
          <Globe className="w-3.5 h-3.5 text-[#B89558]" />
          <span>Customer Website</span>
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-8 bg-white rounded-3xl border border-[#EFE9DD] p-7 md:p-8 shadow-xl text-xs space-y-6">
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

        {/* Quick Demo Credentials */}
        <div className="bg-[#FAF5EB] p-3.5 rounded-2xl border border-[#E8DFD1] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#8C6F3B]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Select Role for Quick Access</span>
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              Secure Auth
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickDemoFill("admin", "admin123")}
              className={`p-2.5 rounded-xl border text-left transition-colors font-medium flex items-center gap-2 ${
                username === "admin"
                  ? "bg-white border-[#4B1835] shadow-xs text-[#4B1835] font-bold"
                  : "bg-white/70 hover:bg-white border-[#E8DFD1] text-gray-700"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#4B1835] shrink-0" />
              <div>
                <div className="font-bold text-xs">Admin / Owner</div>
                <div className="text-[10px] text-gray-500 font-mono">admin / admin123</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill("staff", "staff123")}
              className={`p-2.5 rounded-xl border text-left transition-colors font-medium flex items-center gap-2 ${
                username === "staff"
                  ? "bg-white border-[#4B1835] shadow-xs text-[#4B1835] font-bold"
                  : "bg-white/70 hover:bg-white border-[#E8DFD1] text-gray-700"
              }`}
            >
              <User className="w-4 h-4 text-stone-600 shrink-0" />
              <div>
                <div className="font-bold text-xs">Counter Staff</div>
                <div className="text-[10px] text-gray-500 font-mono">staff / staff123</div>
              </div>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Standard Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or staff"
                className="w-full p-2.5 pl-9 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-semibold text-stone-800 focus:outline-none focus:border-[#4B1835]"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full p-2.5 pl-9 pr-10 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-semibold text-stone-800 focus:outline-none focus:border-[#4B1835]"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 p-0.5"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4B1835] hover:bg-[#320F23] disabled:opacity-70 text-white font-bold py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#D4B67F]" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <span>Enter Barnali ERP Dashboard</span>
                <ArrowRight className="w-4 h-4 text-[#D4B67F]" />
              </>
            )}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-gray-400">Loading Barnali ERP...</div>}>
      <LoginContent />
    </Suspense>
  );
}
