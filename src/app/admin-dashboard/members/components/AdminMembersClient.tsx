'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  UserCheck,
  UserX,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Mail,
  User,
  ShieldCheck,
  X,
  KeyRound,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface MemberData {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  status: string; // ACTIVE, PENDING_PROFILE_COMPLETION, PENDING_KYC_REVIEW, PENDING_ACTIVATION, SUSPENDED
  referralCode: string | null;
  kycStatus: string; // PENDING, SUBMITTED, APPROVED, REJECTED
  createdAt: string;
  leftLegCount: number;
  rightLegCount: number;
  totalDownlines: number;
  wallet: { balance: number } | null;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminMembersClient() {
  const [members, setMembers] = useState<MemberData[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Password reset state
  const [resetPasswordMember, setResetPasswordMember] = useState<MemberData | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let pass = '';
    pass += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    pass += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    pass += '0123456789'[Math.floor(Math.random() * 10)];
    pass += '!@#$%^&*()_+'[Math.floor(Math.random() * 12)];
    for (let i = 0; i < 6; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    pass = pass
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');
    setResetNewPassword(pass);
    setResetConfirmPassword(pass);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordMember) return;
    setResetError(null);
    setResetSuccess(null);

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    try {
      setResetSubmitting(true);
      const res = await fetch(`/api/admin/members/${resetPasswordMember.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: resetNewPassword,
          confirmPassword: resetConfirmPassword,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Failed to reset password');
      }

      setResetSuccess(result.message || 'Password reset successfully!');
      setTimeout(() => {
        setResetPasswordMember(null);
        setResetSuccess(null);
      }, 2000);
    } catch (err: any) {
      setResetError(err.message || 'An error occurred during password reset.');
    } finally {
      setResetSubmitting(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
        kycStatus: kycFilter,
        search: debouncedSearch,
      });

      const res = await fetch(`/api/admin/members?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch members list');
      }

      const data = await res.json();
      setMembers(data.members || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [pagination.page, statusFilter, kycFilter, debouncedSearch]);

  const handleStatusToggle = async (member: MemberData, targetStatus: string) => {
    try {
      setActionLoadingId(member.id);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/admin/members/${member.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update member status');
      }

      setSuccessMsg(data.message || 'Member status updated successfully.');
      fetchMembers();
    } catch (err: any) {
      setError(err.message || 'Error updating status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDING_PROFILE_COMPLETION':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PENDING_KYC_REVIEW':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'PENDING_ACTIVATION':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'SUSPENDED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getProgressLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Onboarding Completed (100%)';
      case 'PENDING_PROFILE_COMPLETION':
        return 'Stage 2 Profile (Steps 1-3) Pending';
      case 'PENDING_KYC_REVIEW':
        return 'KYC Uploaded (Step 4) - Reviewing';
      case 'PENDING_ACTIVATION':
        return 'KYC Approved - Code (Step 5) Pending';
      case 'SUSPENDED':
        return 'Account Suspended';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Member Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            View, track progress, review verification status, and suspend/activate GMA network
            members.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3 text-sm font-medium">
          <ShieldAlert className="text-rose-600 mt-0.5 flex-shrink-0" size={18} />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
            <X size={16} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start gap-3 text-sm font-medium">
          <ShieldCheck className="text-emerald-600 mt-0.5 flex-shrink-0" size={18} />
          <div className="flex-1">{successMsg}</div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-400 hover:text-emerald-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, email, referral code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-bold uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="py-1.5 px-3 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700"
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_PROFILE_COMPLETION">Pending Profile</option>
              <option value="PENDING_KYC_REVIEW">Pending KYC Review</option>
              <option value="PENDING_ACTIVATION">Pending Activation Code</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-bold uppercase">KYC status:</span>
            <select
              value={kycFilter}
              onChange={(e) => {
                setKycFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="py-1.5 px-3 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700"
            >
              <option value="all">All KYC Statuses</option>
              <option value="PENDING">Pending Submit</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <button
            onClick={fetchMembers}
            className="p-2 text-gray-400 hover:text-indigo-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
            title="Refresh list"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-150 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-indigo-600" size={28} />
              <p className="text-xs text-gray-400">Querying member database...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-3">
                <User size={20} />
              </div>
              <p className="text-sm font-bold text-gray-700">No Members Found</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                No members match the selected search terms or filters.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-150">
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">
                    Member Details
                  </th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">
                    Referral Code
                  </th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">
                    Lifecycle Status
                  </th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">
                    Onboarding Progress
                  </th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">
                    Wallet Balance
                  </th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm flex-shrink-0">
                          {(member.name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            {member.name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-400 font-medium">{member.email}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                            username:{' '}
                            <span className="font-bold text-indigo-600">
                              {member.username || '-'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {member.referralCode ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-gray-50 border border-gray-100 px-2 py-1 rounded text-gray-700 tracking-wider">
                            {member.referralCode}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(member.referralCode!);
                              alert('Referral code copied!');
                            }}
                            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Copy code"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono font-bold text-xs bg-gray-50 border border-gray-100 px-2 py-1 rounded text-gray-400 tracking-wider">
                          Direct
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border uppercase ${getStatusBadge(member.status)}`}
                      >
                        {member.status?.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <span className="text-xs text-gray-700 font-bold block">
                          {getProgressLabel(member.status)}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold">
                          KYC: {member.kycStatus}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono font-bold text-sm text-gray-900">
                      ₦{member.wallet?.balance?.toLocaleString() || 0}
                    </td>

                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      {actionLoadingId === member.id ? (
                        <Loader2 className="animate-spin text-indigo-600 inline-block" size={16} />
                      ) : (
                        <>
                          {member.status === 'SUSPENDED' ? (
                            <button
                              onClick={() => handleStatusToggle(member, 'ACTIVE')}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-100 transition-colors inline-flex items-center gap-1"
                            >
                              <UserCheck size={14} />
                              Reactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusToggle(member, 'SUSPENDED')}
                              className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-100 transition-colors inline-flex items-center gap-1"
                            >
                              <UserX size={14} />
                              Suspend
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setResetPasswordMember(member);
                              setResetNewPassword('');
                              setResetConfirmPassword('');
                              setResetError(null);
                              setResetSuccess(null);
                            }}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors inline-flex items-center gap-1"
                          >
                            <KeyRound size={14} />
                            Reset PW
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && members.length > 0 && (
          <div className="bg-gray-50/50 border-t border-gray-150 px-6 py-4 flex items-center justify-between text-xs text-gray-500 font-bold">
            <div>
              Showing <span className="text-gray-800 font-extrabold">{members.length}</span> of{' '}
              <span className="text-gray-800 font-extrabold">{pagination.total}</span> members
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              >
                Previous
              </button>

              <span className="text-gray-700">
                Page <span className="font-extrabold">{pagination.page}</span> of{' '}
                <span className="font-extrabold">{pagination.totalPages}</span>
              </span>

              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RESET PASSWORD DIALOG MODAL */}
      {resetPasswordMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-gray-800">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-gray-150 p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-150">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <KeyRound className="text-indigo-600" size={20} />
                Reset Member Password
              </h3>
              <button
                onClick={() => setResetPasswordMember(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {resetError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                <AlertCircle className="text-rose-500 flex-shrink-0" size={16} />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={16} />
                <span>{resetSuccess}</span>
              </div>
            )}

            <p className="text-xs text-gray-500 leading-relaxed">
              You are resetting the password for{' '}
              <span className="font-bold text-gray-900">{resetPasswordMember.name}</span> (
              <span className="font-mono text-indigo-600">{resetPasswordMember.email}</span>). The
              registered email will not be changed.
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  New Password
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter new password..."
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                  />
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="px-3 py-2 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-600 transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Confirm Password
                </label>
                <input
                  type="text"
                  required
                  placeholder="Repeat new password..."
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setResetPasswordMember(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-bold text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {resetSubmitting ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
