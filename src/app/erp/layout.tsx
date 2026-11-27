import React, { Suspense } from "react";
import { ErpSidebar } from "@/components/layout/ErpSidebar";
import { ErpHeader } from "@/components/layout/ErpHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AuthProvider } from "@/context/AuthContext";

export default function ErpLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-ivory flex flex-col font-sans text-ink antialiased selection:bg-plum selection:text-white">
        <Suspense fallback={<div className="w-64 bg-white fixed inset-y-0 left-0 hidden lg:block border-r border-line" />}>
          <ErpSidebar />
        </Suspense>

        <div className="lg:pl-64 flex flex-col flex-1">
          <Suspense fallback={<div className="h-14 md:h-16 bg-white border-b border-line" />}>
            <ErpHeader />
          </Suspense>

          <main className="flex-1 p-3.5 sm:p-5 md:p-8 pb-28 lg:pb-8 max-w-7xl w-full mx-auto">
            {children}
          </main>

          <Suspense fallback={null}>
            <MobileBottomNav />
          </Suspense>
        </div>
      </div>
    </AuthProvider>
  );
}
