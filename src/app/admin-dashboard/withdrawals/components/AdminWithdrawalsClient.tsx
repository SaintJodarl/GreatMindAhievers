'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Banknote, CheckCircle, CheckCircle2, Loader2, XCircle } from 'lucide-react';

interface UserInfo {
  id: string;
  name: string | null;
  email: string | null;
  referralCode?: string | null;
  kycStatus: string;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
}

interface QualificationVerification {
  qualificationComplete: boolean;
  completedRequirement: number;
  totalRequirement: number;
  remainingRequirement: number;
  leftCompleted?: number;
  leftRequired?: number;
  rightCompleted?: number;
  rightRequired?: number;
  cashOptionSelected: boolean;
  kycComplete: boolean;
  bankDetailsComplete: boolean;
  blockingReasons: string[];
}

interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  method: string;
  details: {
    bankName?: string | null;
    accountNumber?: string | null;
    accountName?: string | null;
    note?: string | null;
    raw?: string;
  };
  status: string;
  adminNote: string | null;
  processedAt: string | Date | null;
  processedBy: string | null;
  approvedAt?: string | Date | null;
  rejectedAt?: string | Date | null;
  rejectionType?: 'CORRECTABLE' | 'FINAL' | string | null;
  paidAt?: string | Date | null;
  paymentReference?: string | null;
  paymentNote?: string | null;
  createdAt: string | Date;
  user: UserInfo;
  reward: {
    id: string;
    stage: string;
    stageName: string;
    rewardValue: number;
    rewardPackage?: string | null;
    status: string;
  } | null;
  rewardClaim: {
    id: string;
    selectedOption: string;
    status: string;
  } | null;
  qualificationVerification?: QualificationVerification | null;
}

interface AdminWithdrawalsClientProps {
  initialWithdrawals: Withdrawal[];
  initialError?: string | null;
}

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (value: string | Date | null | undefined) =>
  value ? new Date(value).toLocaleDateString() : 'Not recorded';

const statusClass = (status: string) =>
  status === 'PAID'
    ? 'bg-emerald-100 text-emerald-800'
    : status === 'APPROVED'
      ? 'bg-blue-100 text-blue-800'
      : status === 'REJECTED'
        ? 'bg-red-100 text-red-800'
        : 'bg-yellow-100 text-yellow-800';

const rejectionTypeLabel = (type: string | null | undefined) =>
  type === 'FINAL' ? 'Final' : type === 'CORRECTABLE' ? 'Correctable' : null;

export default function AdminWithdrawalsClient({
  initialWithdrawals,
  initialError = null,
}: AdminWithdrawalsClientProps) {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(initialWithdrawals);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isPaidOpen, setIsPaidOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectionType, setRejectionType] = useState<'CORRECTABLE' | 'FINAL'>('CORRECTABLE');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentNote, setPaymentNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
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

  const openApproveModal = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setIsApproveOpen(true);
  };

  const openRejectModal = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setRejectReason('');
    setRejectionType('CORRECTABLE');
    setIsRejectOpen(true);
  };

  const openPaidModal = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setPaymentReference('');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentNote('');
    setIsPaidOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedWithdrawal) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/withdrawals/${selectedWithdrawal.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to approve withdrawal');

      showNotification('Withdrawal approved. Awaiting manual settlement.', 'success');
      setIsApproveOpen(false);
      router.refresh();
      setWithdrawals((items) =>
        items.map((item) =>
          item.id === selectedWithdrawal.id
            ? {
                ...item,
                status: 'APPROVED',
                adminNote: 'Approved by admin; awaiting manual settlement.',
                approvedAt: new Date().toISOString(),
              }
            : item
        )
      );
    } catch (err: any) {
      showNotification(err.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedWithdrawal) return;

    const reason = rejectReason.trim();

    if (!reason) {
      showNotification('Rejection reason is required', 'error');
      return;
    }

    if (reason.length < 5) {
      showNotification('Rejection reason must be at least 5 characters', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/withdrawals/${selectedWithdrawal.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, rejectionType }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reject withdrawal');

      showNotification('Withdrawal request rejected successfully', 'success');
      setIsRejectOpen(false);
      router.refresh();
      setWithdrawals((items) =>
        items.map((item) =>
          item.id === selectedWithdrawal.id
            ? {
                ...item,
                status: 'REJECTED',
                adminNote: data.withdrawal?.adminNote || reason,
                rejectionType: data.withdrawal?.rejectionType || rejectionType,
                rejectedAt: new Date().toISOString(),
              }
            : item
        )
      );
    } catch (err: any) {
      showNotification(err.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePaid = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedWithdrawal) return;

    if (!paymentReference.trim()) {
      showNotification('Payment reference is required', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/withdrawals/${selectedWithdrawal.id}/paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentReference,
          paymentDate,
          paymentNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to mark withdrawal as paid');

      showNotification('Withdrawal marked as paid', 'success');
      setIsPaidOpen(false);
      router.refresh();
      setWithdrawals((items) =>
        items.map((item) =>
          item.id === selectedWithdrawal.id
            ? {
                ...item,
                status: 'PAID',
                paidAt: paymentDate,
                paymentReference,
                paymentNote,
              }
            : item
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
      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700 shadow-sm">
          <CheckCircle2 className="shrink-0 text-green-500" size={20} />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
          <AlertCircle className="shrink-0 text-red-500" size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Reward Withdrawal Requests
          </h1>
          <p className="mt-1 text-gray-500">
            Review verified reward withdrawals and record manual settlement.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Member</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Reward</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Bank Details</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Verification</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="transition-colors hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(withdrawal.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {withdrawal.user.name || 'Unnamed member'}
                    </p>
                    <p className="break-all text-xs text-gray-500">
                      {withdrawal.user.email || 'No email'}
                    </p>
                    {withdrawal.user.referralCode && (
                      <p className="mt-0.5 font-mono text-[10px] text-gray-400">
                        {withdrawal.user.referralCode}
                      </p>
                    )}
                    <span
                      className={`mt-1 inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                        withdrawal.user.kycStatus === 'APPROVED'
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                    >
                      KYC: {withdrawal.user.kycStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">
                      {withdrawal.reward?.stageName || 'Reward'}
                    </p>
                    <p className="mt-1 font-mono-nums text-sm font-bold text-emerald-700">
                      {formatMoney(withdrawal.amount)}
                    </p>
                    <p className="mt-1 break-all font-mono text-[10px] text-gray-400">
                      Reward ID: {withdrawal.reward?.id || 'N/A'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Option: {withdrawal.rewardClaim?.selectedOption || 'Not selected'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="block font-semibold text-gray-800">
                      {withdrawal.details?.bankName || withdrawal.user.bankName || 'N/A'}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {withdrawal.details?.accountName || withdrawal.user.accountName || 'N/A'}
                    </span>
                    <span className="block font-mono text-xs text-gray-500">
                      {withdrawal.details?.accountNumber || withdrawal.user.accountNumber || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600">
                    {withdrawal.qualificationVerification ? (
                      <div className="space-y-1">
                        <p className="font-bold text-emerald-700">
                          {withdrawal.qualificationVerification.qualificationComplete
                            ? 'Qualification verified'
                            : 'Qualification not verified'}
                        </p>
                        <p>
                          {withdrawal.qualificationVerification.completedRequirement} of{' '}
                          {withdrawal.qualificationVerification.totalRequirement} qualifying
                          positions
                        </p>
                        {withdrawal.qualificationVerification.leftRequired != null && (
                          <p>
                            L: {withdrawal.qualificationVerification.leftCompleted} /{' '}
                            {withdrawal.qualificationVerification.leftRequired} | R:{' '}
                            {withdrawal.qualificationVerification.rightCompleted} /{' '}
                            {withdrawal.qualificationVerification.rightRequired}
                          </p>
                        )}
                        <p>
                          Cash:{' '}
                          {withdrawal.qualificationVerification.cashOptionSelected
                            ? 'selected'
                            : 'not selected'}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400">Unavailable</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass(withdrawal.status)}`}
                    >
                      {withdrawal.status === 'APPROVED'
                        ? 'APPROVED - AWAITING PAYMENT'
                        : withdrawal.status === 'REJECTED' && withdrawal.rejectionType
                          ? `REJECTED - ${withdrawal.rejectionType}`
                          : withdrawal.status}
                    </span>
                    {withdrawal.status === 'REJECTED' &&
                      rejectionTypeLabel(withdrawal.rejectionType) && (
                        <p className="mt-1 text-[11px] font-semibold text-gray-500">
                          {rejectionTypeLabel(withdrawal.rejectionType)}
                        </p>
                      )}
                    {withdrawal.adminNote && (
                      <p className="mt-1 max-w-[180px] text-[11px] italic text-gray-400">
                        Note: {withdrawal.adminNote}
                      </p>
                    )}
                    {withdrawal.paymentReference && (
                      <p className="mt-1 break-all font-mono text-[10px] text-gray-500">
                        Ref: {withdrawal.paymentReference}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {withdrawal.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openApproveModal(withdrawal)}
                          className="rounded-lg border border-transparent p-1.5 text-green-600 transition-colors hover:border-green-200 hover:bg-green-50"
                          title="Approve withdrawal"
                        >
                          <CheckCircle size={20} />
                        </button>
                        <button
                          onClick={() => openRejectModal(withdrawal)}
                          className="rounded-lg border border-transparent p-1.5 text-red-600 transition-colors hover:border-red-200 hover:bg-red-50"
                          title="Reject withdrawal"
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    )}
                    {withdrawal.status === 'APPROVED' && (
                      <button
                        onClick={() => openPaidModal(withdrawal)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-50"
                      >
                        <Banknote size={15} />
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No reward withdrawal requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isApproveOpen && selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-2 text-green-600">
              <CheckCircle2 size={24} />
              <h3 className="text-xl font-bold text-gray-900">Approve Withdrawal</h3>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p>You are approving this reward withdrawal for manual settlement:</p>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="font-semibold text-gray-900">{selectedWithdrawal.user.name}</p>
                <p className="font-mono text-xs text-gray-500">{selectedWithdrawal.user.email}</p>
                <p className="mt-2 font-bold text-gray-900">
                  Amount: {formatMoney(selectedWithdrawal.amount)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Reward: {selectedWithdrawal.reward?.stageName || 'Reward'}
                </p>
              </div>

              {selectedWithdrawal.user.kycStatus !== 'APPROVED' ? (
                <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
                  <AlertCircle className="mt-0.5 shrink-0" size={16} />
                  <p className="text-xs font-semibold">
                    Member KYC is not approved. Server-side checks will block this action.
                  </p>
                </div>
              ) : (
                <p className="pt-1 text-xs text-gray-500">
                  Approval keeps the reward reserved. It does not mark the request paid.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setIsApproveOpen(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={loading || selectedWithdrawal.user.kycStatus !== 'APPROVED'}
                className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:opacity-40"
              >
                {loading && <Loader2 className="animate-spin" size={16} />}
                <span>Confirm Approval</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isRejectOpen && selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-2 text-red-600">
              <AlertCircle size={24} />
              <h3 className="text-xl font-bold text-gray-900">Reject Withdrawal</h3>
            </div>

            <form onSubmit={handleReject} className="space-y-4">
              <p className="text-sm text-gray-600">
                You are rejecting {formatMoney(selectedWithdrawal.amount)} for{' '}
                <span className="font-semibold text-gray-900">{selectedWithdrawal.user.name}</span>.
              </p>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Reason for Rejection
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={5}
                  maxLength={1000}
                  placeholder="e.g. Bank account name does not match KYC record."
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Rejection Outcome
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1">
                  {(['CORRECTABLE', 'FINAL'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRejectionType(type)}
                      className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                        rejectionType === type
                          ? 'bg-white text-red-700 shadow-sm'
                          : 'text-gray-500 hover:bg-white/70'
                      }`}
                    >
                      {type === 'CORRECTABLE' ? 'Correctable' : 'Final'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsRejectOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPaidOpen && selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-2 text-blue-600">
              <Banknote size={24} />
              <h3 className="text-xl font-bold text-gray-900">Mark as Paid</h3>
            </div>

            <form onSubmit={handlePaid} className="space-y-4">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
                <p className="font-semibold text-gray-900">{selectedWithdrawal.user.name}</p>
                <p className="mt-1 text-gray-600">{formatMoney(selectedWithdrawal.amount)}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedWithdrawal.reward?.stageName || 'Reward withdrawal'}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Payment Reference
                </label>
                <input
                  required
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Bank transfer reference"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Payment Date
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Optional Note
                </label>
                <textarea
                  rows={3}
                  value={paymentNote}
                  onChange={(event) => setPaymentNote(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Settlement note"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPaidOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  <span>Confirm Paid</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
