'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  User,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  X,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  createdAt: string;
}

interface ResetRequest {
  id: string;
  userId: string | null;
  email: string;
  status: string; // PENDING, APPROVED, COMPLETED, REJECTED
  requestedAt: string;
  completedAt: string | null;
  resolvedBy: string | null;
  reason: string | null;
  notes: string | null;
  user: UserData | null;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminResetRequestsClient() {
  const { user: currentUser } = useAuth();

  const [requests, setRequests] = useState<ResetRequest[]>([]);
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
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Selected request modal
  const [selectedRequest, setSelectedRequest] = useState<ResetRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Reset password states
  const [showResetForm, setShowResetForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetErrorMessage, setResetErrorMessage] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
        search: debouncedSearch,
      });

      const res = await fetch(`/api/admin/reset-requests?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch reset requests');
      }

      const data = await res.json();
      setRequests(data.requests || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading reset requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [pagination.page, statusFilter, debouncedSearch]);

  const handleUpdateStatus = async (requestId: string, targetStatus: string) => {
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/admin/reset-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, notes: adminNotes }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update request status');
      }

      setSuccessMsg(data.message || 'Request status updated successfully.');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) {
      setError(err.message || 'Error updating status.');
    }
  };

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setResetErrorMessage(null);
    setResetSuccessMessage(null);

    if (newPassword !== confirmPassword) {
      setResetErrorMessage('Passwords do not match.');
      return;
    }

    try {
      setResetSubmitting(true);
      const res = await fetch(`/api/admin/reset-requests/${selectedRequest.id}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword, notes: adminNotes }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      // Password reset success! Show password so the admin can copy and share it
      setResetSuccessMessage(
        `Password reset successfully! Share the temporary password manually: ${newPassword}`
      );
      setSuccessMsg(`Password successfully reset for ${selectedRequest.email}`);
      setNewPassword('');
      setConfirmPassword('');
      fetchRequests();
    } catch (err: any) {
      setResetErrorMessage(err.message || 'Error resetting password.');
    } finally {
      setResetSubmitting(false);
    }
  };

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
    pass = pass.split('').sort(() => 0.5 - Math.random()).join('');
    setNewPassword(pass);
    setConfirmPassword(pass);
  };

  const openRequestModal = (request: ResetRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.notes || '');
    setShowResetForm(false);
    setNewPassword('');
    setConfirmPassword('');
    setResetSuccessMessage(null);
    setResetErrorMessage(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'APPROVED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Password Reset Requests</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Review, approve, and execute manual password resets for members.
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
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-gray-800">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
              <option value="all">All Requests</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <button
            onClick={fetchRequests}
            className="p-2 text-gray-400 hover:text-indigo-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
            title="Refresh list"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-150 overflow-hidden text-gray-800">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-indigo-600" size={28} />
              <p className="text-xs text-gray-400">Querying request database...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-3">
                <KeyRound size={20} />
              </div>
              <p className="text-sm font-bold text-gray-700">No Reset Requests Found</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                No reset requests match the selected search criteria.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-150">
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Registered Account</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">User Details</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Requested Date</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-800 font-bold">{request.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      {request.user ? (
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{request.user.name}</p>
                          <p className="text-xs text-gray-400">ID: {request.user.id}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-rose-500 font-bold italic">User not matched</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                      {new Date(request.requestedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border uppercase ${getStatusBadge(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openRequestModal(request)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors inline-flex items-center gap-1"
                      >
                        <Eye size={14} />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && requests.length > 0 && (
          <div className="bg-gray-50/50 border-t border-gray-150 px-6 py-4 flex items-center justify-between text-xs text-gray-500 font-bold">
            <div>
              Showing <span className="text-gray-800 font-extrabold">{requests.length}</span> of{' '}
              <span className="text-gray-800 font-extrabold">{pagination.total}</span> requests
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

      {/* REQUEST DETAILS & ACTIONS MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-gray-800">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-gray-150 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-3 border-b border-gray-150">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <KeyRound className="text-indigo-600" size={22} />
                Password Reset Request
              </h3>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Request Detail Panel */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-bold text-gray-400 uppercase tracking-wider">Registered Email</p>
                <p className="font-bold text-gray-800 text-sm mt-0.5 font-mono">{selectedRequest.email}</p>
              </div>
              <div>
                <p className="font-bold text-gray-400 uppercase tracking-wider">Current Status</p>
                <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border uppercase ${getStatusBadge(selectedRequest.status)}`}>
                  {selectedRequest.status}
                </span>
              </div>
              <div>
                <p className="font-bold text-gray-400 uppercase tracking-wider">Member Name</p>
                <p className="font-bold text-gray-800 mt-0.5">{selectedRequest.user?.name || 'Unregistered / Invalid'}</p>
              </div>
              <div>
                <p className="font-bold text-gray-400 uppercase tracking-wider">Member ID</p>
                <p className="font-bold text-gray-800 mt-0.5 font-mono">{selectedRequest.userId || '-'}</p>
              </div>
              <div>
                <p className="font-bold text-gray-400 uppercase tracking-wider">Registration Date</p>
                <p className="font-bold text-gray-800 mt-0.5">
                  {selectedRequest.user ? new Date(selectedRequest.user.createdAt).toLocaleDateString() : '-'}
                </p>
              </div>
              <div>
                <p className="font-bold text-gray-400 uppercase tracking-wider">Account Status</p>
                <p className="font-bold text-gray-800 mt-0.5 uppercase">{selectedRequest.user?.status || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="font-bold text-gray-400 uppercase tracking-wider">Request Received Date</p>
                <p className="font-bold text-gray-800 mt-0.5">{new Date(selectedRequest.requestedAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Admin Notes Section */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase">Administrator Notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Enter notes about verification or reset status..."
                rows={2}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
              />
            </div>

            {/* Sub-Form for Actual Password Reset Execution */}
            {showResetForm && (
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound size={14} />
                  Execute Password Reset
                </h4>

                {resetErrorMessage && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] rounded-xl flex items-center gap-2 font-medium">
                    <AlertCircle className="text-rose-500 flex-shrink-0" size={14} />
                    <span>{resetErrorMessage}</span>
                  </div>
                )}

                {resetSuccessMessage && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] rounded-xl flex items-center gap-2 font-medium">
                    <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={14} />
                    <span>{resetSuccessMessage}</span>
                  </div>
                )}

                <form onSubmit={handleExecuteReset} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Temporary Password</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Enter temporary password..."
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-gray-800"
                      />
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="px-2 py-1.5 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-xl text-[10px] font-bold text-gray-600 transition-colors"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Confirm Password</label>
                    <input
                      type="text"
                      required
                      placeholder="Repeat password..."
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-gray-800"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowResetForm(false)}
                      className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resetSubmitting}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {resetSubmitting ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Executing...
                        </>
                      ) : (
                        'Save & Issue Password'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Actions Panel */}
            {!showResetForm && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-150 justify-between items-center text-xs font-bold">
                {/* Status operations */}
                <div className="flex gap-2">
                  {selectedRequest.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'APPROVED')}
                        className="px-3 py-2 rounded-xl text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle size={14} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'REJECTED')}
                        className="px-3 py-2 rounded-xl text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-150 transition-colors flex items-center gap-1"
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    </>
                  )}
                  {selectedRequest.status === 'APPROVED' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.id, 'REJECTED')}
                      className="px-3 py-2 rounded-xl text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-150 transition-colors flex items-center gap-1"
                    >
                      <XCircle size={14} />
                      Reject
                    </button>
                  )}
                </div>

                {/* Password reset trigger */}
                <div className="flex gap-2 ml-auto">
                  {selectedRequest.status !== 'COMPLETED' && selectedRequest.user && (
                    <button
                      onClick={() => setShowResetForm(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <KeyRound size={14} />
                      Reset Password
                    </button>
                  )}
                  {selectedRequest.status === 'APPROVED' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.id, 'COMPLETED')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle size={14} />
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
