'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  kycStatus: string; // APPROVED, SUBMITTED, PENDING, REJECTED
}

interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  method: string;
  details: string;
  status: string; // PENDING, APPROVED, REJECTED
  adminNote: string | null;
  processedAt: string | Date | null;
  processedBy: string | null;
  createdAt: string | Date;
  user: UserInfo;
}

interface AdminWithdrawalsClientProps {
  initialWithdrawals: Withdrawal[];
}

export default function AdminWithdrawalsClient({
  initialWithdrawals,
}: AdminWithdrawalsClientProps) {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(initialWithdrawals);

  // Modals state
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);

  // Form / Action states
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showNotification = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(msg);
      setError(null);
    } else {
      setError(msg);
      setSuccess(null);
    }
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 4500);
  };

  const openApproveModal = (w: Withdrawal) => {
    setSelectedWithdrawal(w);
    setIsApproveOpen(true);
  };

  const openRejectModal = (w: Withdrawal) => {
    setSelectedWithdrawal(w);
    setRejectReason('');
    setIsRejectOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedWithdrawal) return;

    // Client-side KYC check
    if (selectedWithdrawal.user.kycStatus !== 'APPROVED') {
      showNotification('Cannot approve withdrawal: Member KYC status is not APPROVED.', 'error');
      setIsApproveOpen(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/withdrawals/${selectedWithdrawal.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to approve withdrawal');

      showNotification('Withdrawal request approved successfully', 'success');
      setIsApproveOpen(false);
      router.refresh();

      // Update local state
      setWithdrawals(
        withdrawals.map((w) =>
          w.id === selectedWithdrawal.id
            ? { ...w, status: 'APPROVED', adminNote: 'Approved by admin' }
            : w
        )
      );
    } catch (err: any) {
      showNotification(err.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawal) return;

    if (!rejectReason.trim()) {
      showNotification('Rejection reason is required', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/withdrawals/${selectedWithdrawal.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reject withdrawal');

      showNotification('Withdrawal request rejected successfully', 'success');
      setIsRejectOpen(false);
      router.refresh();

      // Update local state
      setWithdrawals(
        withdrawals.map((w) =>
          w.id === selectedWithdrawal.id ? { ...w, status: 'REJECTED', adminNote: rejectReason } : w
        )
      );
    } catch (err: any) {
      showNotification(err.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {success && (
        <div className="flex items-center gap-3 bg-green-50 text-green-700 border border-green-200 p-4 rounded-xl shadow-sm animate-fade-in">
          <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl shadow-sm animate-fade-in">
          <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Withdrawal Requests</h1>
          <p className="text-gray-500 mt-1">Review and process member withdrawal requests.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Date</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Member</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Amount (₦)</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Method & Details</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">Status</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(withdrawal.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900 text-sm">{withdrawal.user.name}</p>
                    <p className="text-xs text-gray-500">{withdrawal.user.email}</p>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mt-1 ${
                        withdrawal.user.kycStatus === 'APPROVED'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      KYC: {withdrawal.user.kycStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    ₦{withdrawal.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="font-semibold block text-gray-800">{withdrawal.method}</span>
                    <span className="text-xs text-gray-500 break-all">{withdrawal.details}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        withdrawal.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : withdrawal.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {withdrawal.status}
                    </span>
                    {withdrawal.adminNote && (
                      <p className="text-[11px] text-gray-400 mt-1 max-w-[180px] italic">
                        Note: {withdrawal.adminNote}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {withdrawal.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openApproveModal(withdrawal)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-200"
                          title="Approve Withdrawal"
                        >
                          <CheckCircle size={20} />
                        </button>
                        <button
                          onClick={() => openRejectModal(withdrawal)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                          title="Reject Withdrawal"
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No withdrawal requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* APPROVAL CONFIRMATION MODAL */}
      {isApproveOpen && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-3 text-green-600 pb-2 border-b border-gray-100">
              <CheckCircle2 size={24} />
              <h3 className="text-xl font-bold text-gray-900">Approve Withdrawal</h3>
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <p>You are approving a withdrawal request for:</p>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="font-semibold text-gray-900">{selectedWithdrawal.user.name}</p>
                <p className="font-mono text-xs text-gray-500">{selectedWithdrawal.user.email}</p>
                <p className="mt-2 font-bold text-gray-900">
                  Amount: ₦{selectedWithdrawal.amount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Method: {selectedWithdrawal.method}</p>
              </div>

              {selectedWithdrawal.user.kycStatus !== 'APPROVED' ? (
                <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl flex items-start gap-2.5 mt-2">
                  <AlertCircle className="flex-shrink-0 mt-0.5" size={16} />
                  <p className="text-xs font-semibold">
                    Warning: User KYC is not approved. System security constraints prevent approving
                    payouts for unverified users.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 pt-1">
                  Confirming this action will debit the member&apos;s wallet balance and mark this
                  request as completed.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsApproveOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={loading || selectedWithdrawal.user.kycStatus !== 'APPROVED'}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white px-4 py-2 rounded-xl font-semibold transition-colors shadow-sm"
              >
                {loading && <Loader2 className="animate-spin" size={16} />}
                <span>Confirm Approval</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION CONFIRMATION MODAL */}
      {isRejectOpen && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600 pb-2 border-b border-gray-100">
              <AlertCircle size={24} />
              <h3 className="text-xl font-bold text-gray-900">Reject Withdrawal</h3>
            </div>

            <form onSubmit={handleReject} className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>
                  You are rejecting the withdrawal of{' '}
                  <span className="font-bold text-gray-900">
                    ₦{selectedWithdrawal.amount.toLocaleString()}
                  </span>{' '}
                  for{' '}
                  <span className="font-semibold text-gray-900">
                    {selectedWithdrawal.user.name}
                  </span>
                  .
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Reason for Rejection
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Incomplete bank details, please update profile..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsRejectOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
