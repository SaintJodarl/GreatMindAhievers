'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AlertCircle, Award, Banknote, Clock3, LockKeyhole, Wallet } from 'lucide-react';
import {
  STAGE_CONFIG,
  STAGE_ORDER,
  STAGE_RANK,
  getStageDisplayName,
  normalizeStageId,
} from '@/lib/qualification/constants';

interface WithdrawalFormData {
  amount: string;
  method: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  note: string;
}

interface RewardSummary {
  id: string;
  stage: string;
  stageName: string;
  rewardValue: number;
  rewardPackage?: string | null;
  status: string;
  latestClaim?: {
    selectedOption: string;
    status: string;
  } | null;
}

interface WithdrawalSectionProps {
  summary?: {
    balance?: number | string;
    pendingWithdrawals?: number | string;
    currentStage?: string;
    currentStageName?: string;
    nextStage?: string | null;
    nextStageName?: string | null;
    kycStatus?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    rewards?: RewardSummary[];
  };
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

function getNextRewardStage(currentStage: string | null | undefined) {
  const normalized = normalizeStageId(currentStage);
  return STAGE_ORDER.slice(STAGE_RANK[normalized] + 1).find(
    (stage) => STAGE_CONFIG[stage].hasReward
  );
}

function getRewardForStage(rewards: RewardSummary[] | undefined, stage: string) {
  return rewards?.find((reward) => normalizeStageId(reward.stage) === normalizeStageId(stage));
}

function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'green' | 'amber' | 'slate' | 'red';
}) {
  const className =
    tone === 'green'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : tone === 'red'
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-slate-200 bg-slate-50 text-slate-600';

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${className}`}
    >
      {children}
    </span>
  );
}

export default function WithdrawalSection({ summary }: WithdrawalSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<WithdrawalFormData>({
    defaultValues: {
      bankName: summary?.bankName || '',
      accountNumber: summary?.accountNumber || '',
      accountName: summary?.accountName || '',
    },
  });

  const walletBalance = Number(summary?.balance || 0);
  const pendingAmount = Number(summary?.pendingWithdrawals || 0);
  const availableBalance = Math.max(0, walletBalance - pendingAmount);
  const currentStage = normalizeStageId(summary?.currentStage);
  const currentStageConfig = STAGE_CONFIG[currentStage];
  const currentStageReward = getRewardForStage(summary?.rewards, currentStage);
  const nextRewardStage = getNextRewardStage(currentStage);
  const nextRewardConfig = nextRewardStage ? STAGE_CONFIG[nextRewardStage] : null;
  const kycApproved = ['APPROVED', 'COMPLETE'].includes((summary?.kycStatus || '').toUpperCase());
  const earnedRewards = summary?.rewards?.filter((reward) => reward.status === 'EARNED') || [];
  const claimedRewards = summary?.rewards?.filter((reward) => reward.status === 'CLAIMED') || [];

  // No member withdrawal creation route exists in the current app. Keep this display-only flow honest.
  const onSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSubmitting(false);
    setSubmitSuccess(true);
    reset({
      amount: '',
      method: '',
      bankName: summary?.bankName || '',
      accountNumber: summary?.accountNumber || '',
      accountName: summary?.accountName || '',
      note: '',
    });
    setTimeout(() => setSubmitSuccess(false), 5000);
  };

  const payoutBlockedReason = !kycApproved
    ? 'KYC approval is required before admin can approve wallet payouts.'
    : availableBalance <= 0
      ? 'You have not yet unlocked a withdrawable wallet balance.'
      : null;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Wallet & Rewards
            </p>
            <h2 className="text-lg font-bold text-slate-900">Withdrawal Readiness</h2>
          </div>
          <StatusPill tone={kycApproved ? 'green' : 'amber'}>
            KYC {summary?.kycStatus || 'PENDING'}
          </StatusPill>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <Wallet size={15} />
              Available balance
            </div>
            <p className="mt-2 font-mono-nums text-xl font-bold text-emerald-950">
              {formatMoney(availableBalance)}
            </p>
            <p className="mt-1 text-xs text-emerald-700/80">
              Current wallet balance less pending requests.
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
              <Clock3 size={15} />
              Pending requests
            </div>
            <p className="mt-2 font-mono-nums text-xl font-bold text-amber-950">
              {formatMoney(pendingAmount)}
            </p>
            <p className="mt-1 text-xs text-amber-700/80">Awaiting admin decision.</p>
          </div>

          <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
              <Award size={15} />
              Current stage
            </div>
            <p className="mt-2 text-sm font-bold text-indigo-950">
              {summary?.currentStageName || getStageDisplayName(currentStage)}
            </p>
            <p className="mt-1 text-xs text-indigo-700/80">
              {currentStageConfig.hasReward
                ? `Reward value: ${formatMoney(currentStageConfig.rewardValue)}`
                : 'No separate reward is configured for this stage.'}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <LockKeyhole size={15} />
              Next reward
            </div>
            <p className="mt-2 text-sm font-bold text-slate-950">
              {nextRewardConfig ? nextRewardConfig.displayName : 'Plan complete'}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {nextRewardConfig
                ? `${formatMoney(nextRewardConfig.rewardValue)} after qualification is confirmed.`
                : 'No further configured stage reward.'}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900">Current Stage Reward</h3>
              <StatusPill
                tone={
                  currentStageReward?.status === 'EARNED'
                    ? 'green'
                    : currentStageReward?.status === 'CLAIMED'
                      ? 'slate'
                      : 'amber'
                }
              >
                {currentStageReward?.status || 'Not unlocked'}
              </StatusPill>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              {currentStageConfig.hasReward
                ? currentStageReward
                  ? currentStageReward.rewardPackage || currentStageConfig.rewardPackage
                  : 'Your reward becomes available after qualification is confirmed and recorded.'
                : 'Complete your current stage requirements to unlock the next configured reward.'}
            </p>
            {currentStageReward?.latestClaim && (
              <p className="mt-2 text-xs font-semibold text-slate-600">
                Latest claim: {currentStageReward.latestClaim.selectedOption} -{' '}
                {currentStageReward.latestClaim.status.replace(/_/g, ' ')}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 p-3">
            <h3 className="text-sm font-bold text-slate-900">Eligibility</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              {payoutBlockedReason ||
                'Your available wallet balance may be requested for admin review. Stage rewards are unlocked separately after qualification and can be claimed from the Rewards page.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusPill tone={availableBalance > 0 ? 'green' : 'slate'}>
                Withdrawable cash: {formatMoney(availableBalance)}
              </StatusPill>
              <StatusPill tone={earnedRewards.length ? 'green' : 'slate'}>
                Earned rewards: {earnedRewards.length}
              </StatusPill>
              <StatusPill tone={claimedRewards.length ? 'amber' : 'slate'}>
                Claimed rewards: {claimedRewards.length}
              </StatusPill>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Request Wallet Payout</h3>
            <p className="mt-1 text-sm text-slate-500">
              Enter an amount up to your available wallet balance. No authoritative stage-based
              minimum withdrawal rule is defined in the current codebase.
            </p>
          </div>

          {submitSuccess && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 shrink-0 text-amber-600" size={18} />
                <div>
                  <h4 className="text-sm font-bold text-amber-800">Request details prepared</h4>
                  <p className="mt-1 text-xs text-amber-700">
                    This member dashboard does not currently expose a withdrawal-submission API.
                    Please contact support/admin processing for the payout workflow.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Withdrawal Method
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                  <p className="mt-1 text-xs font-medium text-rose-500">{errors.method.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Amount (NGN)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    NGN
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-12 pr-16 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="0.00"
                    {...register('amount', {
                      required: 'Amount is required',
                      min: { value: 1, message: 'Enter an amount greater than zero' },
                      max: {
                        value: availableBalance,
                        message: 'Insufficient available balance',
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setValue('amount', availableBalance.toString())}
                    className="absolute right-2 top-1/2 min-h-8 -translate-y-1/2 rounded-md bg-slate-100 px-2 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    MAX
                  </button>
                </div>
                {errors.amount && (
                  <p className="mt-1 text-xs font-medium text-rose-500">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Account Number
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="0123456789"
                  {...register('accountNumber', {
                    required: 'Account number is required',
                    pattern: { value: /^[0-9]{10}$/, message: 'Must be 10 digits' },
                  })}
                />
                {errors.accountNumber && (
                  <p className="mt-1 text-xs font-medium text-rose-500">
                    {errors.accountNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Account Name
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g. John Doe"
                  {...register('accountName', { required: 'Account name is required' })}
                />
                {errors.accountName && (
                  <p className="mt-1 text-xs font-medium text-rose-500">
                    {errors.accountName.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Optional Note
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g. Monthly withdrawal"
                  {...register('note')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || Boolean(payoutBlockedReason)}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? 'Preparing...' : 'Prepare Payout Request'}
            </button>
            {payoutBlockedReason && (
              <p className="text-center text-xs font-medium text-rose-600">{payoutBlockedReason}</p>
            )}
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-900">Reward Claim Path</h3>
            <Banknote className="text-indigo-600" size={18} />
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              Stage rewards are created after qualification is confirmed. Earned rewards can be
              requested as cash/package where the configured package supports those options.
            </p>
            {nextRewardConfig && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Next reward details
                </p>
                <p className="mt-1 font-bold text-slate-900">{nextRewardConfig.displayName}</p>
                <p className="mt-1 font-mono-nums font-semibold text-indigo-700">
                  {formatMoney(nextRewardConfig.rewardValue)}
                </p>
                <p className="mt-2 text-xs leading-relaxed">{nextRewardConfig.rewardPackage}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
