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

interface WithdrawalSectionProps {
  summary?: any;
}

export default function WithdrawalSection({ summary }: WithdrawalSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WithdrawalFormData>();

  const walletBalance = summary?.balance || 0;
  const minWithdrawal = 5000;
  const pendingAmount = summary?.pendingWithdrawals || 0;

  // No withdrawal history yet for new accounts.
  // Real implementation should fetch from `/api/wallet/withdrawals`
  const withdrawalHistory: any[] = [];

  // Backend integration point: POST /api/withdrawals/request
  const onSubmit = async (data: WithdrawalFormData) => {
    setIsSubmitting(true);
    // Dummy delay for UI purposes
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
          {
            label: 'Available Balance',
            value: `₦${Math.max(0, walletBalance - pendingAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            color: 'var(--accent)',
            sub: 'Ready to withdraw',
          },
          {
            label: 'Pending Withdrawal',
            value: `₦${pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            color: 'var(--warning)',
            sub: 'Awaiting approval',
          },
          {
            label: 'Total Withdrawn',
            value: '₦0.00', // Need an API field for total withdrawn. Default to 0.00 for empty state
            color: 'var(--info)',
            sub: 'All-time payouts',
          },
        ].map((item) => (
          <div
            key={`wbal-${item.label}`}
            className="p-4 rounded-xl"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
              {item.label}
            </p>
            <p className="text-2xl font-bold font-mono-nums" style={{ color: item.color }}>
              {item.value}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
              {item.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Withdrawal request form */}
        <div
          className="p-6 rounded-xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
              Request Withdrawal
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Transfer your earnings to your local bank account. Minimum withdrawal is ₦
              {minWithdrawal.toLocaleString()}.
            </p>
          </div>

          {submitSuccess && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex gap-3">
                <div className="mt-0.5 text-emerald-600">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.5-4.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-800">Request Submitted</h4>
                  <p className="text-xs text-emerald-600 mt-1">
                    Your withdrawal request has been received and is pending admin approval. You
                    will be notified once processed.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-4">
              {/* Method */}
              <div>
                <label
                  className="block text-xs font-bold mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  Withdrawal Method
                </label>
                <select
                  className="input-field"
                  {...register('method', { required: 'Please select a method' })}
                >
                  <option value="">Select bank...</option>
                  <option value="GTBank">GTBank</option>
                  <option value="Zenith">Zenith Bank</option>
                  <option value="Access">Access Bank</option>
                  <option value="UBA">UBA</option>
                  <option value="ALAT by Wema">ALAT by Wema</option>
                  <option value="Kuda Bank">Kuda Bank</option>
                  <option value="Moniepoint Microfinance Bank">Moniepoint Microfinance Bank</option>
                  <option value="Opay">OPay</option>
                  <option value="Paga">Paga</option>
                  <option value="Palmpay">PalmPay</option>
                  <option value="Sparkle">Sparkle</option>
                  <option value="VBank">VBank</option>
                </select>
                {errors.method && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">{errors.method.message}</p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label
                  className="block text-xs font-bold mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  Amount (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                    ₦
                  </span>
                  <input
                    type="number"
                    className="input-field pl-8"
                    placeholder="5000"
                    {...register('amount', {
                      required: 'Amount is required',
                      min: {
                        value: minWithdrawal,
                        message: `Minimum withdrawal is ₦${minWithdrawal}`,
                      },
                      max: {
                        value: Math.max(0, walletBalance - pendingAmount),
                        message: 'Insufficient available balance',
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const max = Math.max(0, walletBalance - pendingAmount);
                      reset({ ...register, amount: max.toString() } as any);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                  >
                    MAX
                  </button>
                </div>
                {errors.amount && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">{errors.amount.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Account Number */}
                <div>
                  <label
                    className="block text-xs font-bold mb-1.5"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Account Number
                  </label>
                  <input
                    className="input-field"
                    placeholder="0123456789"
                    {...register('accountNumber', {
                      required: 'Account number is required',
                      pattern: { value: /^[0-9]{10}$/, message: 'Must be 10 digits' },
                    })}
                  />
                  {errors.accountNumber && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">
                      {errors.accountNumber.message}
                    </p>
                  )}
                </div>

                {/* Account Name */}
                <div>
                  <label
                    className="block text-xs font-bold mb-1.5"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Account Name
                  </label>
                  <input
                    className="input-field"
                    placeholder="e.g. John Doe"
                    {...register('accountName', { required: 'Account name is required' })}
                  />
                  {errors.accountName && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">
                      {errors.accountName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Note */}
              <div>
                <label
                  className="block text-xs font-bold mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  Optional Note
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. Monthly withdrawal"
                  {...register('note')}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || walletBalance - pendingAmount < minWithdrawal}
                className="w-full btn-primary py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
              {walletBalance - pendingAmount < minWithdrawal && (
                <p className="text-center text-[11px] text-rose-500 font-medium mt-2">
                  You need at least ₦{minWithdrawal.toLocaleString()} available balance to withdraw.
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Withdrawal History */}
        <div
          className="rounded-xl overflow-hidden flex flex-col"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
              Recent Withdrawals
            </h3>
            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
              View All
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-[300px]">
            {withdrawalHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-700">No withdrawals yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[250px]">
                  When you request a payout, your withdrawal history will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {withdrawalHistory.map((item) => (
                  <div key={item.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                            item.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : item.status === 'Pending'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {item.status}
                        </span>
                        <span
                          className="text-xs font-medium"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          {item.date}
                        </span>
                      </div>
                      <span
                        className="text-sm font-bold font-mono-nums"
                        style={{ color: 'var(--foreground)' }}
                      >
                        ₦{item.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div
                        className="flex items-center gap-1.5"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <rect
                            x="1.5"
                            y="2.5"
                            width="9"
                            height="7"
                            rx="1.5"
                            stroke="currentColor"
                            strokeWidth="1.2"
                          />
                          <path d="M1.5 5.5h9" stroke="currentColor" strokeWidth="1.2" />
                        </svg>
                        {item.method} ({item.account})
                      </div>
                      <span
                        className="font-mono text-[10px] uppercase"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        {item.id}
                      </span>
                    </div>
                    {item.note && item.status === 'Rejected' && (
                      <div className="mt-3 p-2.5 rounded bg-rose-50 border border-rose-100 text-[11px] text-rose-600 font-medium leading-relaxed">
                        Reason: {item.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
