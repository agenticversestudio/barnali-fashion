import React, { Suspense } from "react";
import { ErpSidebar } from "@/components/layout/ErpSidebar";
import { ErpHeader } from "@/components/layout/ErpHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export default function ErpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 antialiased selection:bg-[#6B1D2F] selection:text-white">
      <Suspense fallback={<div className="w-64 bg-white fixed inset-y-0 left-0 hidden md:block border-r border-[#E2E8F0]" />}>
        <ErpSidebar />
      </Suspense>

      <div className="md:pl-64 flex flex-col flex-1">
        <Suspense fallback={<div className="h-14 md:h-16 bg-white border-b border-[#E2E8F0]" />}>
          <ErpHeader />
        </Suspense>

        <main className="flex-1 p-3.5 sm:p-5 md:p-8 pb-20 md:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        <Suspense fallback={null}>
          <MobileBottomNav />
        </Suspense>
      </div>
    </div>
  );
}
