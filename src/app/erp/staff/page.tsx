"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  UserCheck,
  Lock,
  Plus,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { UserRole } from "@/types";

interface StaffMember {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  permissions: string[];
}

export default function StaffPage() {
  const staffList: StaffMember[] = [
    {
      id: "STF-01",
      name: "Business Owner",
      role: "owner",
      phone: "+91 7978256488",
      permissions: ["ALL_ACCESS", "FINANCIAL_REPORTS", "REFUND_DEPOSITS", "STAFF_MANAGEMENT"],
    },
    {
      id: "STF-02",
      name: "Pooja Das",
      role: "manager",
      phone: "+91 9437199001",
      permissions: ["CREATE_BOOKINGS", "ISSUE_GARMENTS", "APPROVE_RETURNS", "RECORD_EXPENSES", "CASH_CLOSING"],
    },
    {
      id: "STF-03",
      name: "Rahul Sahu",
      role: "sales_staff",
      phone: "+91 9861044321",
      permissions: ["CREATE_BOOKINGS", "ISSUE_GARMENTS", "INTAKE_RETURNS"],
    },
    {
      id: "STF-04",
      name: "Master Salim",
      role: "inventory_staff",
      phone: "+91 9124500987",
      permissions: ["INVENTORY_VIEW", "UPDATE_MAINTENANCE"],
    },
    {
      id: "STF-05",
      name: "Subhashree Mishra",
      role: "accountant",
      phone: "+91 9778233112",
      permissions: ["FINANCIAL_REPORTS", "CASH_CLOSING", "AUDIT_LOGS"],
    },
  ];

  const permissionMatrix = [
    { feature: "Create New Customer & Bookings", owner: true, manager: true, staff: true, tailor: false },
    { feature: "Physical Garment Issue / Handover", owner: true, manager: true, staff: true, tailor: false },
    { feature: "Return Intake & Condition Check", owner: true, manager: true, staff: true, tailor: false },
    { feature: "Authorize Security Deposit Refund", owner: true, manager: true, staff: false, tailor: false },
    { feature: "Approve Laundry Quality & Restock", owner: true, manager: true, staff: false, tailor: false },
    { feature: "Add / Edit Garment Asset Inventory", owner: true, manager: true, staff: false, tailor: true },
    { feature: "Lock Daily Cash Drawer Closing", owner: true, manager: true, staff: false, tailor: false },
    { feature: "Export Turnover & Financial Reports", owner: true, manager: false, staff: false, tailor: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-[#8C6F3B] font-semibold uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4 text-[#4B1835]" />
          <span>Role-Based Access Control (RBAC)</span>
        </div>
        <h1 className="text-2xl font-serif font-bold text-[#27222A]">Staff &amp; Permissions</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Configure security authorization levels, assign store counter roles, and safeguard financial deposit settlements.
        </p>
      </div>

      {/* Staff Roster Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffList.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-2xl border border-[#EFE9DD] p-5 shadow-xs text-xs space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{s.name}</h3>
                <span className="bg-[#FAF5EB] text-[#8C6F3B] font-mono font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                  {s.role.replace(/_/g, " ")}
                </span>
              </div>
              <span className="font-mono text-gray-400 text-[10px]">{s.id}</span>
            </div>

            <div className="text-gray-500 font-mono text-[11px]">{s.phone}</div>

            <div className="pt-2 border-t border-[#EFE9DD] flex flex-wrap gap-1">
              {s.permissions.map((p) => (
                <span
                  key={p}
                  className="bg-gray-100 text-gray-700 text-[9px] px-2 py-0.5 rounded-md font-mono"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Granular Permission Matrix Table */}
      <div className="bg-white rounded-2xl border border-[#EFE9DD] p-5 shadow-xs space-y-3">
        <div className="font-bold text-gray-900 text-sm pb-2 border-b border-[#EFE9DD]">
          Granular Permission Matrix by Role
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5EB] text-[#8C6F3B] font-bold uppercase text-[10px] border-b border-[#EFE9DD]">
              <tr>
                <th className="py-2.5 px-4">Feature / Action</th>
                <th className="py-2.5 px-3 text-center">Owner</th>
                <th className="py-2.5 px-3 text-center">Store Manager</th>
                <th className="py-2.5 px-3 text-center">Counter Sales</th>
                <th className="py-2.5 px-3 text-center">Master Tailor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1ECE3]">
              {permissionMatrix.map((row) => (
                <tr key={row.feature} className="hover:bg-[#FBF9F5]">
                  <td className="py-2.5 px-4 font-semibold text-gray-800">{row.feature}</td>
                  <td className="py-2.5 px-3 text-center">
                    {row.owner ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.manager ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.staff ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.tailor ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
