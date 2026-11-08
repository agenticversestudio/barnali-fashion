import React, { Suspense } from "react";
import { ErpSidebar } from "@/components/layout/ErpSidebar";
import { ErpHeader } from "@/components/layout/ErpHeader";

export default function ErpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col">
      <Suspense fallback={<div className="w-64 bg-[#FBF9F5] fixed inset-y-0 left-0 hidden lg:block border-r border-[#EFE9DD]" />}>
        <ErpSidebar />
      </Suspense>
      <div className="lg:pl-64 flex flex-col flex-1">
        <Suspense fallback={<div className="h-16 bg-white border-b border-[#EFE9DD]" />}>
          <ErpHeader />
        </Suspense>
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
