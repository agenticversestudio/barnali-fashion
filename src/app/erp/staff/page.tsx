"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  UserCheck,
  Lock,
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
  KeyRound,
  LogOut,
  X,
} from "lucide-react";
import { usersApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { UserDto, Role } from "@/types/api";
import { useAuth } from "@/context/AuthContext";

export default function StaffPage() {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);

  // Create User Form State
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("staff");
  const [newPhone, setNewPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset Password State
  const [resetPasswordVal, setResetPasswordVal] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.list();
      setUsers(res.users || []);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUsername || !newPassword) {
      alert("Name, username, and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      await usersApi.create({
        name: newName.trim(),
        username: newUsername.trim(),
        password: newPassword,
        role: newRole,
        phone: newPhone.trim() || undefined,
      });

      setShowCreateModal(false);
      setNewName("");
      setNewUsername("");
      setNewPassword("");
      setNewPhone("");
      await loadUsers();
      alert("User account created successfully!");
    } catch (err: any) {
      alert(err?.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: UserDto) => {
    const action = user.active ? "disable" : "enable";
    if (!confirm(`Are you sure you want to ${action} user "${user.username}"?`)) return;

    try {
      await usersApi.update(user.id, { active: !user.active });
      await loadUsers();
    } catch (err: any) {
      alert(err?.message || `Failed to ${action} user`);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !resetPasswordVal) return;

    setSubmitting(true);
    try {
      await usersApi.resetPassword(selectedUser.id, { password: resetPasswordVal });
      setShowResetModal(false);
      setResetPasswordVal("");
      setSelectedUser(null);
      alert(`Password for ${selectedUser.username} updated successfully!`);
    } catch (err: any) {
      alert(err?.message || "Failed to reset password");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoutSessions = async (user: UserDto) => {
    if (!confirm(`Log out all active sessions for ${user.username}?`)) return;
    try {
      await usersApi.deleteSessions(user.id);
      alert(`All active sessions terminated for ${user.username}.`);
    } catch (err: any) {
      alert(err?.message || "Failed to terminate sessions");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8C6F3B] font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-[#4B1835]" />
            <span>Role-Based Access Control (RBAC)</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#27222A]">Staff &amp; Operator Accounts</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage authenticated user access, assign Admin vs Staff roles, and govern counter permissions.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#4B1835] hover:bg-[#320F23] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D4B67F]" />
            <span>Create Staff Account</span>
          </button>
        )}
      </div>

      {/* Staff Roster Cards */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#EFE9DD] p-12 text-center text-xs text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin text-[#4B1835] mx-auto mb-2" />
          Loading user accounts...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => (
            <div
              key={u.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs text-xs space-y-3 ${
                u.active ? "border-[#EFE9DD]" : "border-rose-200 bg-rose-50/20 opacity-70"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{u.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded uppercase ${
                        u.role === "admin"
                          ? "bg-[#FAF5EB] text-[#4B1835] border border-[#E8DFD1]"
                          : "bg-blue-50 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {u.role}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        u.active ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
                      }`}
                    >
                      {u.active ? "Active" : "Disabled"}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-gray-400 text-[10px]">@{u.username}</span>
              </div>

              <div className="text-gray-500 font-mono text-[11px]">
                {u.phone || "No phone registered"}
              </div>

              <div className="text-[10px] text-gray-400">
                Created: {formatDate(u.createdAt)}
              </div>

              {isAdmin && (
                <div className="pt-3 border-t border-[#EFE9DD] flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedUser(u);
                      setShowResetModal(true);
                    }}
                    className="flex items-center gap-1 text-[#4B1835] hover:underline font-bold text-[11px] cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Reset Pass</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLogoutSessions(u)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      title="Log out from all devices"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`text-[11px] font-bold px-2 py-1 rounded-md cursor-pointer ${
                        u.active
                          ? "text-rose-700 hover:bg-rose-50"
                          : "text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {u.active ? "Disable" : "Enable"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Role & Permissions Explanation */}
      <div className="bg-white rounded-2xl border border-[#EFE9DD] p-5 shadow-xs space-y-3">
        <div className="font-bold text-gray-900 text-sm pb-2 border-b border-[#EFE9DD]">
          Role Permissions Matrix
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#FAF5EB] text-[#8C6F3B] font-bold uppercase text-[10px] border-b border-[#EFE9DD]">
              <tr>
                <th className="py-2.5 px-4">Feature / Action Area</th>
                <th className="py-2.5 px-4 text-center">Admin (Owner)</th>
                <th className="py-2.5 px-4 text-center">Staff (Counter Operator)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1ECE3]">
              <tr>
                <td className="py-2.5 px-4 font-semibold text-gray-800">New Booking &amp; Quote Calculation</td>
                <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-gray-800">Garment Handover &amp; Return Check-in</td>
                <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-gray-800">Rack &amp; Shelf Location Management</td>
                <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-gray-800">Daily Cash Drawer Closing Count</td>
                <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-gray-800">Garment Purchase Cost &amp; Profit Visibility</td>
                <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-2.5 px-4 text-center"><XCircle className="w-4 h-4 text-gray-300 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-gray-800">Turnover &amp; Financial Analytics Reports</td>
                <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-2.5 px-4 text-center"><XCircle className="w-4 h-4 text-gray-300 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-gray-800">User Creation &amp; Password Reset</td>
                <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-2.5 px-4 text-center"><XCircle className="w-4 h-4 text-gray-300 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-gray-800">Google Sheets Sync &amp; Database Backups</td>
                <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-2.5 px-4 text-center"><XCircle className="w-4 h-4 text-gray-300 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EFE9DD] max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DD]">
              <div className="flex items-center gap-2 font-bold text-sm text-[#4B1835]">
                <Plus className="w-4 h-4 text-[#B89558]" />
                <span>Create Staff User</span>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pooja Das"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. pooja"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Role *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as Role)}
                    className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-bold"
                  >
                    <option value="staff">Staff (Counter)</option>
                    <option value="admin">Admin (Owner)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 9437199001"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-mono"
                />
              </div>

              <div className="pt-3 border-t border-[#EFE9DD] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EFE9DD] max-w-sm w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DD]">
              <div className="flex items-center gap-2 font-bold text-sm text-[#4B1835]">
                <KeyRound className="w-4 h-4 text-[#B89558]" />
                <span>Reset Password</span>
              </div>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-3">
              <p className="text-gray-600">
                Enter a new password for <strong>{selectedUser.username}</strong> ({selectedUser.name}):
              </p>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#E8DFD1] rounded-xl font-mono"
                />
              </div>

              <div className="pt-3 border-t border-[#EFE9DD] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setSelectedUser(null);
                  }}
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
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
