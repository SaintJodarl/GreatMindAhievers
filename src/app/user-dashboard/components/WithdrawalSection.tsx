'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

interface WithdrawalFormData {
  amount: string;
  method: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  note: string;
}

const withdrawalHistory = [
  { id: 'wd-001', date: 'Apr 28, 2026', amount: 500000, method: 'Bank Transfer', account: '****4821', status: 'Pending', note: '' },
  { id: 'wd-002', date: 'Apr 15, 2026', amount: 1200000, method: 'Bank Transfer', account: '****4821', status: 'Approved', note: '' },
  { id: 'wd-003', date: 'Apr 2, 2026', amount: 800000, method: 'Bank Transfer', account: '****7734', status: 'Approved', note: '' },
  { id: 'wd-004', date: 'Mar 20, 2026', amount: 350000, method: 'Bank Transfer', account: '****4821', status: 'Rejected', note: 'Account name mismatch. Please update your bank details.' },
  { id: 'wd-005', date: 'Mar 8, 2026', amount: 600000, method: 'Bank Transfer', account: '****4821', status: 'Approved', note: '' },
  { id: 'wd-006', date: 'Feb 22, 2026', amount: 450000, method: 'Bank Transfer', account: '****2291', status: 'Approved', note: '' },
];

export default function WithdrawalSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WithdrawalFormData>();

  const walletBalance = 3847500;
  const minWithdrawal = 5000;
  const pendingAmount = 500000;

  // Backend integration point: POST /api/withdrawals/request
  const onSubmit = async (data: WithdrawalFormData) => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1400));
    setIsSubmitting(false);
    setSubmitSuccess(true);
    reset();
    setTimeout(() => setSubmitSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Balance overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Available Balance', value: `₦${(walletBalance - pendingAmount).toLocaleString()}`, color: 'var(--accent)', sub: 'Ready to withdraw' },
          { label: 'Pending Withdrawal', value: `₦${pendingAmount.toLocaleString()}`, color: 'var(--warning)', sub: 'Awaiting approval' },
          { label: 'Total Withdrawn', value: '₦3,400,000', color: 'var(--info)', sub: 'All-time payouts' },
        ].map((item) => (
          <div
            key={`wbal-${item.label}`}
            className="p-4 rounded-xl"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>{item.label}</p>
            <p className="text-2xl font-bold font-mono-nums" style={{ color: item.color }}>{item.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Withdrawal request form */}
        <div
          className="p-5 rounded-xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
            Request Withdrawal
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
            Minimum withdrawal: ₦{minWithdrawal.toLocaleString()}. Processed within 1–3 business days.
          </p>

          {submitSuccess && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm"
              style={{ background: 'rgba(16,217,160,0.1)', border: '1px solid rgba(16,217,160,0.25)', color: 'var(--accent)' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Withdrawal request submitted. Pending admin approval.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                Withdrawal Amount (₦)
              </label>
              <input
                type="number"
                step="1"
                className="input-field font-mono-nums"
                placeholder={`Min ₦${minWithdrawal.toLocaleString()}`}
                {...register('amount', {
                  required: 'Amount is required',
                  min: { value: minWithdrawal, message: `Minimum withdrawal is ₦${minWithdrawal.toLocaleString()}` },
                  max: { value: walletBalance - pendingAmount, message: `Cannot exceed available balance ₦${(walletBalance - pendingAmount).toLocaleString()}` },
                })}
              />
              {errors.amount && (
                <p className="mt-1 text-xs" style={{ color: 'var(--negative)' }}>{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                Payment Method
              </label>
              <select
                className="input-field"
                {...register('method', { required: 'Select a payment method' })}
              >
                <option value="">Select method</option>
                <option value="bank">Bank Transfer (Nigerian Banks)</option>
                <option value="opay">OPay</option>
                <option value="palmpay">PalmPay</option>
                <option value="kuda">Kuda Bank</option>
              </select>
              {errors.method && (
                <p className="mt-1 text-xs" style={{ color: 'var(--negative)' }}>{errors.method.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                  Account Holder Name
                </label>
                <input
                  className="input-field"
                  placeholder="Full legal name"
                  {...register('accountName', { required: 'Required' })}
                />
                {errors.accountName && (
                  <p className="mt-1 text-xs" style={{ color: 'var(--negative)' }}>{errors.accountName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                  Account Number
                </label>
                <input
                  className="input-field font-mono-nums"
                  placeholder="10-digit account number"
                  {...register('accountNumber', { required: 'Required' })}
                />
                {errors.accountNumber && (
                  <p className="mt-1 text-xs" style={{ color: 'var(--negative)' }}>{errors.accountNumber.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                Bank Name (optional)
              </label>
              <input
                className="input-field"
                placeholder="e.g. GTBank, First Bank, Access Bank"
                {...register('bankName')}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                Note (optional)
              </label>
              <textarea
                className="input-field resize-none"
                rows={2}
                placeholder="Any special instructions..."
                {...register('note')}
              />
            </div>

            <div
              className="p-3 rounded-lg text-xs"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--warning)' }}
            >
              ⚠️ Ensure your account details match your KYC documents exactly. Mismatches will result in rejection.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full"
            >
              {isSubmitting ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin">
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
                    <path d="M7 1.5A5.5 5.5 0 0112.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Submitting Request...
                </>
              ) : (
                'Submit Withdrawal Request'
              )}
            </button>
          </form>
        </div>

        {/* Withdrawal history */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Withdrawal History
            </h3>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {withdrawalHistory.map((w) => (
              <div key={w.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background:
                          w.status === 'Approved' ?'rgba(16,217,160,0.1)'
                            : w.status === 'Pending' ?'rgba(245,158,11,0.1)' :'rgba(255,77,106,0.1)',
                      }}
                    >
                      {w.status === 'Approved' ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--accent)' }}>
                          <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : w.status === 'Pending' ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--warning)' }}>
                          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
                          <path d="M7 4v3.5l2 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--negative)' }}>
                          <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                        {w.method}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {w.date} · {w.account}
                      </p>
                      {w.note && (
                        <p className="text-xs mt-1" style={{ color: 'var(--negative)' }}>{w.note}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div>
                      <p className="text-sm font-bold font-mono-nums" style={{ color: 'var(--foreground)' }}>
                        ₦{w.amount.toLocaleString()}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {w.method} · {w.account}
                      </p>
                    </div>
                    <span
                      className={`badge ${
                        w.status === 'Approved' ?'badge-active'
                          : w.status === 'Pending' ?'badge-pending' :'badge-rejected'
                      }`}
                    >
                      {w.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}