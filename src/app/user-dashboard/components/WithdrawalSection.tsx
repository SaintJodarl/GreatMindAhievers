'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Award,
  Banknote,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  RefreshCw,
} from 'lucide-react';

interface Eligibility {
  eligible: boolean;
  currentStageName: string;
  nextStageName: string | null;
  nextRewardStageName: string | null;
  qualificationComplete: boolean;
  completedRequirement: number;
  totalRequirement: number;
  remainingRequirement: number;
  leftCompleted?: number;
  leftRequired?: number;
  rightCompleted?: number;
  rightRequired?: number;
  rewardId?: string;
  rewardClaimId?: string;
  rewardStageName?: string;
  rewardType?: string;
  rewardAmount?: number;
  rewardStatus?: string;
  rewardClaimStatus?: string;
  selectedOption?: string | null;
  requiresCashSelection: boolean;
  cashOptionSelected: boolean;
  kycComplete: boolean;
  bankDetailsComplete: boolean;
  bankDetails: {
    bankName: string | null;
    accountNumber: string | null;
    accountName: string | null;
  };
  existingWithdrawalId?: string;
  existingWithdrawalStatus?: string;
  existingWithdrawal?: {
    id: string;
    status: string;
    amount: string | number;
    createdAt: string;
    approvedAt?: string | null;
    paidAt?: string | null;
    paymentReference?: string | null;
    adminNote?: string | null;
    rejectionType?: string | null;
  } | null;
  blockingReasons: string[];
  guidance: {
    state: string;
    title: string;
    description: string;
    emphasis: string;
  };
}

interface WithdrawalHistory {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  approvedAt?: string | null;
  paidAt?: string | null;
  paymentReference?: string | null;
  adminNote?: string | null;
  rejectionType?: string | null;
  reward?: {
    stageName: string;
    status: string;
  } | null;
}

interface WithdrawalSectionProps {
  summary?: {
    currentStageName?: string;
  };
}

const formatMoney = (value: number | string | undefined | null) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString() : 'Not recorded';

function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'green' | 'amber' | 'slate' | 'red' | 'blue';
}) {
  const className =
    tone === 'green'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : tone === 'red'
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : tone === 'blue'
            ? 'border-blue-200 bg-blue-50 text-blue-700'
            : 'border-slate-200 bg-slate-50 text-slate-600';

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${className}`}
    >
      {children}
    </span>
  );
}

function progressPercent(completed: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((completed / total) * 100));
}

function withdrawalStatusLabel(withdrawal: WithdrawalHistory) {
  if (withdrawal.status === 'APPROVED') return 'Approved - awaiting payment';
  if (withdrawal.status === 'REJECTED' && withdrawal.rejectionType === 'CORRECTABLE') {
    return 'Rejected - correctable';
  }
  if (withdrawal.status === 'REJECTED' && withdrawal.rejectionType === 'FINAL') {
    return 'Rejected - final';
  }
  return withdrawal.status;
}

export default function WithdrawalSection({ summary }: WithdrawalSectionProps) {
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalHistory[]>([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadEligibility = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/user/withdrawals', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load withdrawal eligibility');
      setEligibility(data.eligibility);
      setWithdrawals(data.withdrawals || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load withdrawal eligibility');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEligibility();
  }, []);

  const submitWithdrawal = async () => {
    if (!eligibility?.rewardId) return;

    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);
      const res = await fetch('/api/user/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId: eligibility.rewardId, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Unable to submit withdrawal request');
      setMessage(data.message || 'Withdrawal request submitted.');
      setNote('');
      await loadEligibility();
    } catch (err: any) {
      setError(err.message || 'Unable to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const stateTone: 'green' | 'amber' | 'slate' | 'red' | 'blue' =
    eligibility?.guidance.state === 'ELIGIBLE'
      ? 'green'
      : eligibility?.guidance.state === 'PAID'
        ? 'green'
        : eligibility?.guidance.state === 'APPROVED_AWAITING_PAYMENT'
          ? 'blue'
          : eligibility?.guidance.state === 'REJECTED'
            ? 'red'
            : 'amber';

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Reward Withdrawal
            </p>
            <h2 className="text-lg font-bold text-slate-900">Withdrawal Readiness</h2>
          </div>
          <button
            type="button"
            onClick={loadEligibility}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loading && !eligibility ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <p className="text-sm text-slate-500">Checking reward eligibility...</p>
          </div>
        ) : eligibility ? (
          <div className="space-y-5">
            {message && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
                  <Award size={15} />
                  Current stage
                </div>
                <p className="mt-2 text-sm font-bold text-indigo-950">
                  {eligibility.currentStageName || summary?.currentStageName}
                </p>
                <p className="mt-1 text-xs text-indigo-700/80">
                  Next: {eligibility.nextStageName || 'Plan complete'}
                </p>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <Banknote size={15} />
                  Eligible reward
                </div>
                <p className="mt-2 font-mono-nums text-xl font-bold text-emerald-950">
                  {eligibility.rewardAmount ? formatMoney(eligibility.rewardAmount) : 'Locked'}
                </p>
                <p className="mt-1 text-xs text-emerald-700/80">
                  {eligibility.rewardStageName ||
                    eligibility.nextRewardStageName ||
                    'No reward yet'}
                </p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                  <Clock3 size={15} />
                  Requirement
                </div>
                <p className="mt-2 text-sm font-bold text-amber-950">
                  {eligibility.completedRequirement} of {eligibility.totalRequirement || 0}
                </p>
                <p className="mt-1 text-xs text-amber-700/80">
                  {eligibility.remainingRequirement} remaining
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <LockKeyhole size={15} />
                  Controls
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusPill tone={eligibility.kycComplete ? 'green' : 'amber'}>
                    KYC {eligibility.kycComplete ? 'complete' : 'required'}
                  </StatusPill>
                  <StatusPill tone={eligibility.bankDetailsComplete ? 'green' : 'amber'}>
                    Bank {eligibility.bankDetailsComplete ? 'ready' : 'required'}
                  </StatusPill>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {eligibility.guidance.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {eligibility.guidance.description}
                    </p>
                  </div>
                  <StatusPill tone={stateTone}>
                    {eligibility.guidance.state.replace(/_/g, ' ')}
                  </StatusPill>
                </div>

                {eligibility.totalRequirement > 0 && (
                  <div className="space-y-3">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{
                          width: `${progressPercent(
                            eligibility.completedRequirement,
                            eligibility.totalRequirement
                          )}%`,
                        }}
                      />
                    </div>
                    {eligibility.leftRequired != null && eligibility.rightRequired != null && (
                      <div className="grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-2">
                        <div className="rounded-lg bg-indigo-50 p-2 text-indigo-700">
                          Left branch: {eligibility.leftCompleted || 0} of{' '}
                          {eligibility.leftRequired}
                        </div>
                        <div className="rounded-lg bg-sky-50 p-2 text-sky-700">
                          Right branch: {eligibility.rightCompleted || 0} of{' '}
                          {eligibility.rightRequired}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex gap-3">
                    {eligibility.eligible ? (
                      <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                    ) : (
                      <AlertCircle className="mt-0.5 shrink-0 text-amber-600" size={18} />
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {eligibility.guidance.emphasis}
                      </p>
                      {eligibility.blockingReasons.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs text-slate-600">
                          {eligibility.blockingReasons.slice(0, 4).map((reason) => (
                            <li key={reason}>- {reason}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {!eligibility.cashOptionSelected && eligibility.rewardId && (
                  <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                    Select the cash option on the rewards page before requesting withdrawal.{' '}
                    <Link href="/user-dashboard/rewards" className="font-bold underline">
                      Open rewards
                    </Link>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-base font-bold text-slate-900">Request Summary</h3>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p>
                    Reward:{' '}
                    <span className="font-semibold text-slate-900">
                      {eligibility.rewardStageName || 'Not unlocked'}
                    </span>
                  </p>
                  <p>
                    Amount:{' '}
                    <span className="font-semibold text-slate-900">
                      {eligibility.rewardAmount ? formatMoney(eligibility.rewardAmount) : 'N/A'}
                    </span>
                  </p>
                  <p>
                    Bank:{' '}
                    <span className="font-semibold text-slate-900">
                      {eligibility.bankDetails.bankName || 'Missing'}
                    </span>
                  </p>
                  <p>
                    Account:{' '}
                    <span className="font-semibold text-slate-900">
                      {eligibility.bankDetails.accountName || 'Missing'}
                    </span>
                  </p>
                </div>

                <label className="mt-4 block text-xs font-bold text-slate-700">Optional note</label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Optional note for admin review"
                />

                <button
                  type="button"
                  onClick={submitWithdrawal}
                  disabled={!eligibility.eligible || submitting}
                  className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {submitting ? 'Submitting...' : 'Request Reward Withdrawal'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error || 'Unable to load withdrawal eligibility.'}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">Reward Withdrawal History</h3>
          <Banknote className="text-indigo-600" size={18} />
        </div>

        {withdrawals.length ? (
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => (
              <article key={withdrawal.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-bold text-slate-900">
                      {withdrawal.reward?.stageName || 'Reward withdrawal'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Requested on {formatDate(withdrawal.createdAt)}
                    </p>
                    {withdrawal.adminNote && (
                      <p className="mt-1 text-xs text-slate-500">
                        Admin note: {withdrawal.adminNote}
                      </p>
                    )}
                    {withdrawal.status === 'REJECTED' && withdrawal.rejectionType && (
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Rejection outcome:{' '}
                        {withdrawal.rejectionType === 'CORRECTABLE' ? 'Correctable' : 'Final'}
                      </p>
                    )}
                    {withdrawal.paymentReference && (
                      <p className="mt-1 break-all font-mono text-xs text-slate-500">
                        Payment reference: {withdrawal.paymentReference}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill
                      tone={
                        withdrawal.status === 'PAID'
                          ? 'green'
                          : withdrawal.status === 'APPROVED'
                            ? 'blue'
                            : withdrawal.status === 'REJECTED'
                              ? 'red'
                              : 'amber'
                      }
                    >
                      {withdrawalStatusLabel(withdrawal)}
                    </StatusPill>
                    <span className="font-mono-nums text-sm font-bold text-slate-900">
                      {formatMoney(withdrawal.amount)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No reward withdrawal requests yet.</p>
        )}
      </section>
    </div>
  );
}
