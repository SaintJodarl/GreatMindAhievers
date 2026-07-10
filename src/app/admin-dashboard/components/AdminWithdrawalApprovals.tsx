'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

interface WithdrawalRequest {
  id: string;
  memberId: string;
  memberName: string;
  email: string;
  amount: number;
  method: string;
  accountDetails: string;
  requestDate: string;
  kycStatus: 'Approved' | 'Rejected' | 'Under Review';
  accountStatus: 'Active' | 'Suspended' | 'Pending KYC';
  walletBalance: number;
  previousWithdrawals: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}

const withdrawalRequests: WithdrawalRequest[] = [
  {
    id: 'wr-002',
    memberId: 'GMA-00218',
    memberName: 'Chidinma Obi',
    email: 'chidinma.obi@email.com',
    amount: 800000,
    method: 'Bank Transfer',
    accountDetails: 'Access Bank · ****7712 · Chidinma Obi',
    requestDate: 'Apr 27, 2026',
    kycStatus: 'Approved',
    accountStatus: 'Active',
    walletBalance: 1240000,
    previousWithdrawals: 0,
    status: 'Pending',
  },
  {
    id: 'wr-003',
    memberId: 'GMA-00267',
    memberName: 'Tunde Bakare',
    email: 'tunde.bakare@email.com',
    amount: 350000,
    method: 'Bank Transfer',
    accountDetails: 'First Bank Nigeria · ****2291 · Tunde Bakare',
    requestDate: 'Apr 26, 2026',
    kycStatus: 'Approved',
    accountStatus: 'Active',
    walletBalance: 980000,
    previousWithdrawals: 600000,
    status: 'Pending',
  },
  {
    id: 'wr-004',
    memberId: 'GMA-00311',
    memberName: 'Biodun Lawal',
    email: 'biodun.lawal@email.com',
    amount: 560000,
    method: 'Bank Transfer',
    accountDetails: 'Zenith Bank · ****9934 · Biodun Lawal',
    requestDate: 'Apr 25, 2026',
    kycStatus: 'Rejected',
    accountStatus: 'Suspended',
    walletBalance: 560000,
    previousWithdrawals: 0,
    status: 'Pending',
  },
  {
    id: 'wr-005',
    memberId: 'GMA-00341',
    memberName: 'Emeka Nwosu',
    email: 'emeka.nwosu@email.com',
    amount: 150000,
    method: 'Bank Transfer',
    accountDetails: 'UBA · ****7734 · Emeka Nwosu',
    requestDate: 'Apr 24, 2026',
    kycStatus: 'Approved',
    accountStatus: 'Active',
    walletBalance: 210000,
    previousWithdrawals: 0,
    status: 'Pending',
  },
];

interface ReviewFormData {
  note: string;
}

export default function AdminWithdrawalApprovals() {
  const [selectedWR, setSelectedWR] = useState<WithdrawalRequest | null>(null);
  const [processedIds, setProcessedIds] = useState<Map<string, 'Approved' | 'Rejected'>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);

  const { register, handleSubmit, reset } = useForm<ReviewFormData>();

  const pending = withdrawalRequests.filter((w) => !processedIds.has(w.id));
  const totalPendingValue = pending.reduce((s, w) => s + w.amount, 0);

  // Backend integration point: POST /api/admin/withdrawals/:id/process
  const onSubmit = async (data: ReviewFormData) => {
    if (!selectedWR || !pendingAction) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1100));
    setProcessedIds(
      (prev) =>
        new Map([...prev, [selectedWR.id, pendingAction === 'approve' ? 'Approved' : 'Rejected']])
    );
    setSelectedWR(null);
    setPendingAction(null);
    reset();
    setIsSubmitting(false);
  };

  const getRiskLevel = (wr: WithdrawalRequest): 'low' | 'medium' | 'high' => {
    if (wr.kycStatus !== 'Approved' || wr.accountStatus !== 'Active') return 'high';
    if (wr.amount > wr.walletBalance * 0.8) return 'medium';
    return 'low';
  };

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Pending Approvals',
            value: pending.length.toString(),
            color: 'var(--warning)',
            bg: 'rgba(245,158,11,0.08)',
            border: 'rgba(245,158,11,0.25)',
          },
          {
            label: 'Total Pending Value',
            value: `₦${totalPendingValue.toLocaleString('en-NG')}`,
            color: 'var(--negative)',
            bg: 'rgba(255,77,106,0.08)',
            border: 'rgba(255,77,106,0.2)',
          },
          {
            label: 'Approved Today',
            value: `${processedIds.size}`,
            color: 'var(--accent)',
            bg: 'rgba(16,217,160,0.08)',
            border: 'rgba(16,217,160,0.2)',
          },
        ].map((s) => (
          <div
            key={`wrsummary-${s.label}`}
            className="p-4 rounded-xl"
            style={{ background: s.bg, border: `1px solid ${s.border}` }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
              {s.label}
            </p>
            <p className="text-2xl font-bold font-mono-nums" style={{ color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Request list */}
        <div
          className="xl:col-span-2 rounded-xl overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Pending Requests ({pending.length})
            </h3>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {pending.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-3xl mb-3">✅</div>
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  All clear!
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  No pending withdrawal requests.
                </p>
              </div>
            ) : (
              pending.map((wr) => {
                const risk = getRiskLevel(wr);
                const isSelected = selectedWR?.id === wr.id;
                return (
                  <div
                    key={wr.id}
                    onClick={() => {
                      setSelectedWR(wr);
                      setPendingAction(null);
                    }}
                    className="p-4 cursor-pointer transition-all duration-150"
                    style={{
                      background: isSelected ? 'rgba(108,71,255,0.1)' : 'transparent',
                      borderLeft: isSelected ? '2px solid var(--primary)' : '2px solid transparent',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                          {wr.memberName}
                        </p>
                        <p
                          className="text-xs font-mono-nums"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          {wr.memberId}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-sm font-bold font-mono-nums"
                          style={{
                            color: risk === 'high' ? 'var(--negative)' : 'var(--foreground)',
                          }}
                        >
                          ₦{wr.amount.toLocaleString()}
                        </p>
                        <span
                          className="text-xs font-medium"
                          style={{
                            color:
                              risk === 'high'
                                ? 'var(--negative)'
                                : risk === 'medium'
                                  ? 'var(--warning)'
                                  : 'var(--accent)',
                          }}
                        >
                          {risk === 'high'
                            ? '⚠ High Risk'
                            : risk === 'medium'
                              ? '~ Medium'
                              : '✓ Low Risk'}
                        </span>
                      </div>
                    </div>
                    <div
                      className="flex items-center justify-between mt-2 text-xs"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      <span>{wr.method}</span>
                      <span>{wr.requestDate}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detail & action panel */}
        <div className="xl:col-span-3">
          {!selectedWR ? (
            <div
              className="h-full rounded-xl flex flex-col items-center justify-center py-16"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="text-4xl mb-4">💸</div>
              <p className="text-base font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
                Select a Withdrawal Request
              </p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Review member details and risk indicators before approving.
              </p>
            </div>
          ) : (
            <div
              className="rounded-xl overflow-hidden animate-fade-in"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div
                className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--border)' }}
              >
                <h3 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                  Withdrawal Review — {selectedWR.memberName}
                </h3>
                <button
                  onClick={() => {
                    setSelectedWR(null);
                    setPendingAction(null);
                    reset();
                  }}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 2l10 10M12 2L2 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Risk banner */}
                {getRiskLevel(selectedWR) === 'high' && (
                  <div
                    className="flex items-start gap-3 p-3 rounded-lg text-sm"
                    style={{
                      background: 'rgba(255,77,106,0.1)',
                      border: '1px solid rgba(255,77,106,0.3)',
                      color: 'var(--negative)',
                    }}
                  >
                    <span className="text-lg flex-shrink-0">⚠️</span>
                    <div>
                      <p className="font-semibold text-xs mb-0.5">High Risk Withdrawal</p>
                      <p className="text-xs">
                        {selectedWR.kycStatus !== 'Approved' && 'KYC not approved. '}
                        {selectedWR.accountStatus !== 'Active' && 'Account is not active. '}
                        Manual verification recommended before approving.
                      </p>
                    </div>
                  </div>
                )}

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Member ID', value: selectedWR.memberId, mono: true },
                    {
                      label: 'Request Amount',
                      value: `₦${selectedWR.amount.toLocaleString()}`,
                      mono: true,
                      highlight: 'var(--foreground)',
                    },
                    { label: 'Payment Method', value: selectedWR.method, mono: false },
                    { label: 'Account Details', value: selectedWR.accountDetails, mono: true },
                    {
                      label: 'Wallet Balance',
                      value: `₦${selectedWR.walletBalance.toLocaleString()}`,
                      mono: true,
                      highlight: 'var(--accent)',
                    },
                    {
                      label: 'Previous Withdrawals',
                      value: `₦${selectedWR.previousWithdrawals.toLocaleString()}`,
                      mono: true,
                    },
                    {
                      label: 'KYC Status',
                      value: selectedWR.kycStatus,
                      mono: false,
                      highlight:
                        selectedWR.kycStatus === 'Approved' ? 'var(--accent)' : 'var(--negative)',
                    },
                    {
                      label: 'Account Status',
                      value: selectedWR.accountStatus,
                      mono: false,
                      highlight:
                        selectedWR.accountStatus === 'Active' ? 'var(--accent)' : 'var(--negative)',
                    },
                  ].map((item) => (
                    <div
                      key={`wrdetail-${item.label}`}
                      className="p-3 rounded-lg"
                      style={{ background: 'var(--muted)' }}
                    >
                      <p className="text-xs mb-0.5" style={{ color: 'var(--muted-foreground)' }}>
                        {item.label}
                      </p>
                      <p
                        className={`text-xs font-semibold truncate ${item.mono ? 'font-mono-nums' : ''}`}
                        style={{ color: item.highlight || 'var(--foreground)' }}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Action selection */}
                <div>
                  <h4
                    className="text-xs font-semibold mb-3 uppercase tracking-wider"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    Action
                  </h4>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      {
                        value: 'approve' as const,
                        label: '✓ Approve Payment',
                        color: 'var(--accent)',
                        bg: 'rgba(16,217,160,0.08)',
                        border: 'rgba(16,217,160,0.3)',
                      },
                      {
                        value: 'reject' as const,
                        label: '✗ Reject Request',
                        color: 'var(--negative)',
                        bg: 'rgba(255,77,106,0.08)',
                        border: 'rgba(255,77,106,0.3)',
                      },
                    ].map((opt) => (
                      <button
                        key={`action-${opt.value}`}
                        type="button"
                        onClick={() => setPendingAction(opt.value)}
                        className="p-3 rounded-lg text-sm font-semibold transition-all duration-150"
                        style={
                          pendingAction === opt.value
                            ? {
                                background: opt.bg,
                                border: `1px solid ${opt.border}`,
                                color: opt.color,
                              }
                            : {
                                background: 'var(--muted)',
                                border: '1px solid var(--border)',
                                color: 'var(--secondary-foreground)',
                              }
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {pendingAction && (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 animate-fade-in">
                      <div>
                        <label
                          className="block text-xs font-medium mb-1.5"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {pendingAction === 'reject'
                            ? 'Rejection Reason'
                            : 'Admin Note (Optional)'}
                        </label>
                        <textarea
                          className="input-field resize-none"
                          rows={2}
                          placeholder={
                            pendingAction === 'reject'
                              ? 'Reason for rejection (will be shown to member)...'
                              : 'Internal processing note...'
                          }
                          {...register('note')}
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setPendingAction(null);
                            reset();
                          }}
                          className="btn-secondary flex-1 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className={`flex-1 text-sm ${pendingAction === 'approve' ? 'btn-accent' : 'btn-danger'}`}
                        >
                          {isSubmitting ? (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="none"
                              className="animate-spin mx-auto"
                            >
                              <circle
                                cx="7"
                                cy="7"
                                r="5.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeOpacity="0.3"
                              />
                              <path
                                d="M7 1.5A5.5 5.5 0 0112.5 7"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          ) : pendingAction === 'approve' ? (
                            `Confirm — Pay ₦${selectedWR.amount.toLocaleString()}`
                          ) : (
                            'Confirm Rejection'
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
