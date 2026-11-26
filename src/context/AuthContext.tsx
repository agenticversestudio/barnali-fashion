"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import type { SessionUser, Role } from "@/types/api";
import { DataStore } from "@/lib/dataStore";

interface AuthContextType {
  user: SessionUser | null;
  role: Role | null;
  isAdmin: boolean;
  isStaff: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isAdmin: false,
  isStaff: false,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.user);
      // Synchronize with legacy DataStore role for backwards compatibility during Phase 6
      if (res.user.role === "admin") {
        DataStore.setCurrentRole("owner");
      } else {
        DataStore.setCurrentRole("sales_staff");
      }
    } catch {
      setUser(null);
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path.startsWith("/erp") && path !== "/erp/login") {
          router.push(`/erp/login?next=${encodeURIComponent(path)}`);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      router.push("/erp/login");
    }
  };

  const role = user?.role || null;
  const isAdmin = role === "admin";
  const isStaff = role === "staff";

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        isStaff,
        loading,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
