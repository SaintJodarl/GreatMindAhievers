'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Banknote, CheckCircle2, Gift, Package, RefreshCw } from 'lucide-react';
import WithdrawalSection from '../components/WithdrawalSection';

type ClaimOption = 'CASH' | 'FOOD' | 'PACKAGE';

interface RewardClaimSummary {
  id: string;
  selectedOption: string;
  status: string;
}

interface RewardWithdrawalSummary {
  id: string;
  status: string;
  createdAt?: string | null;
}

interface RewardSummary {
  id: string;
  stageName: string;
  rewardValue: number;
  rewardPackage?: string | null;
  status: string;
  latestClaim?: RewardClaimSummary | null;
  latestWithdrawal?: RewardWithdrawalSummary | null;
  withdrawalStatus?: string | null;
}

interface StageSummary {
  currentStageName?: string | null;
  currentStageNumberLabel?: string | null;
  stageUpdatedAt?: string | null;
}

interface RewardConfigSummary {
  stageName: string;
  rewardValue: number;
  rewardPackage?: string | null;
}

interface NextRewardSummary extends RewardConfigSummary {
  requirement: string;
  attained: boolean;
  progress: {
    completedRequirement: number;
    totalRequirement: number;
    remainingRequirement: number;
    leftQualifiedCount?: number | null;
    rightQualifiedCount?: number | null;
    percentage: number;
  };
}

interface HistoryContributor {
  id: string;
  contributorMemberId: string;
  contributorStageName: string;
  contributorQualifiedAt?: string | null;
  genealogyDepth: number;
  contributorMember: {
    name?: string | null;
    username?: string | null;
    email?: string | null;
  };
}

interface StageHistoryItem {
  id: string;
  fromStageName: string;
  toStageName: string;
  qualifiedAt?: string | null;
  contributors?: HistoryContributor[];
}

interface StageLoanSummary {
  id: string;
  stageName: string;
  principal: unknown;
  interestAmount: unknown;
  outstandingBalance: unknown;
  status: string;
}

interface RewardsPageData {
  stageSummary?: StageSummary | null;
  rewards: RewardSummary[];
  currentReward?: RewardConfigSummary | null;
  nextReward?: NextRewardSummary | null;
  history?: StageHistoryItem[];
  loans?: StageLoanSummary[];
}

const formatMoney = (value: unknown) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString() : 'Not recorded';

const statusClass = (status: string | null | undefined) => {
  if (status === 'PAID') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'CLAIMED' || status === 'WITHDRAWAL_APPROVED') {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  if (status === 'WITHDRAWAL_PENDING') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'WITHDRAWAL_REJECTED') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
};

function RewardStatusBadge({ status }: { status: string | null | undefined }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
        status
      )}`}
    >
      {(status || 'Pending').replace(/_/g, ' ')}
    </span>
  );
}

export default function MemberRewardsPage() {
  const [data, setData] = useState<RewardsPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [claimMessage, setClaimMessage] = useState('');
  const [claimError, setClaimError] = useState('');

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/user/rewards', { cache: 'no-store' });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.message || 'Unable to load rewards.');
      }
      setData(payload as RewardsPageData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load rewards.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const handleClaim = async (rewardId: string, option: ClaimOption) => {
    setSubmitting(rewardId);
    setClaimMessage('');
    setClaimError('');

    try {
      const res = await fetch('/api/user/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId, selectedOption: option }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.message || 'Unable to submit reward claim.');
      }

      setClaimMessage(payload?.message || 'Reward option submitted for processing.');
      await fetchRewards();
    } catch (err: unknown) {
      setClaimError(err instanceof Error ? err.message : 'Unable to submit reward claim.');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0" size={20} />
            <div>
              <h1 className="font-semibold">Rewards could not be loaded</h1>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchRewards}
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-rose-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-800"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stageSummary = data?.stageSummary;
  const rewards = data?.rewards ?? [];
  const nextReward = data?.nextReward;
  const currentReward = data?.currentReward;
  const nextProgress = nextReward?.progress;
  const nextProgressTotal = nextProgress?.totalRequirement ?? 0;
  const nextProgressCompleted = nextProgress?.completedRequirement ?? 0;
  const nextProgressPercentage = nextProgress?.percentage ?? 0;
  const nextProgressRemaining = nextProgress?.remainingRequirement ?? 0;
  const progressLabel =
    nextProgressTotal > 0
      ? `${nextProgressCompleted} of ${nextProgressTotal}`
      : nextReward?.attained
        ? 'Stage attained'
        : 'Not started';

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rewards & Withdrawal</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track achieved rewards, claim your cash option, and submit withdrawals from one place.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchRewards}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {claimMessage && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          <CheckCircle2 className="shrink-0" size={20} />
          <p className="text-sm font-medium">{claimMessage}</p>
        </div>
      )}
      {claimError && (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
          <AlertCircle className="shrink-0" size={20} />
          <p className="text-sm font-medium">{claimError}</p>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Current Stage</p>
          <h2 className="mt-2 text-xl font-bold text-gray-900">
            {stageSummary?.currentStageName || 'Registered / Active'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {stageSummary?.currentStageNumberLabel || 'Account status'}
          </p>
          <p className="mt-3 text-xs text-gray-400">
            Attained: {formatDate(stageSummary?.stageUpdatedAt)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Gift size={17} className="text-indigo-600" />
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Current Reward
            </p>
          </div>
          <h2 className="mt-2 text-xl font-bold text-gray-900">
            {currentReward ? formatMoney(currentReward.rewardValue) : 'No stage reward'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {currentReward?.rewardPackage || 'This stage does not carry a reward package.'}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Banknote size={17} className="text-emerald-600" />
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Next Reward</p>
          </div>
          <h2 className="mt-2 text-xl font-bold text-gray-900">
            {nextReward ? formatMoney(nextReward.rewardValue) : 'Plan completed'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {nextReward
              ? `${nextReward.stageName}: ${nextReward.rewardPackage}`
              : 'No further reward stage exists.'}
          </p>
        </div>
      </section>

      {nextReward && (
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Next Reward Progress</h2>
              <p className="mt-1 text-sm text-gray-500">{nextReward.requirement}</p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
              {progressLabel}
            </span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${nextProgressPercentage}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
            <span>{nextProgressPercentage}% complete</span>
            {nextProgressRemaining > 0 && (
              <span>{nextProgressRemaining} requirement(s) remaining</span>
            )}
            {nextProgress?.leftQualifiedCount != null && (
              <span>Left leg: {nextProgress.leftQualifiedCount}</span>
            )}
            {nextProgress?.rightQualifiedCount != null && (
              <span>Right leg: {nextProgress.rightQualifiedCount}</span>
            )}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="text-lg font-bold text-gray-900">Achieved Rewards</h2>
        </div>
        {rewards.length ? (
          <div className="divide-y divide-gray-100">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-gray-900">{reward.stageName}</h3>
                    <RewardStatusBadge status={reward.status} />
                    {reward.withdrawalStatus && (
                      <RewardStatusBadge status={`Withdrawal: ${reward.withdrawalStatus}`} />
                    )}
                  </div>
                  <p className="mt-1 text-lg font-semibold text-green-700">
                    {formatMoney(reward.rewardValue)}
                  </p>
                  <p className="mt-2 max-w-3xl text-sm text-gray-600">{reward.rewardPackage}</p>
                  {reward.latestClaim && (
                    <p className="mt-3 rounded-lg bg-indigo-50 p-2 text-sm text-indigo-700">
                      Claim request: {reward.latestClaim.selectedOption} -{' '}
                      {reward.latestClaim.status.replace(/_/g, ' ')}
                    </p>
                  )}
                  {reward.latestWithdrawal && (
                    <p className="mt-2 rounded-lg bg-slate-50 p-2 text-sm text-slate-700">
                      Withdrawal: {reward.latestWithdrawal.status.replace(/_/g, ' ')} on{' '}
                      {formatDate(reward.latestWithdrawal.createdAt)}
                    </p>
                  )}
                </div>

                {reward.status === 'EARNED' && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleClaim(reward.id, 'CASH')}
                      disabled={submitting === reward.id}
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Banknote size={16} />
                      Request Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClaim(reward.id, 'PACKAGE')}
                      disabled={submitting === reward.id}
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Package size={16} />
                      Request Package
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 text-sm text-gray-500">
            {nextReward ? (
              <p>
                No achieved reward records yet. Your next reward is{' '}
                <span className="font-semibold text-gray-800">
                  {formatMoney(nextReward.rewardValue)}
                </span>{' '}
                at {nextReward.stageName}.
              </p>
            ) : (
              <p>No rewards recorded.</p>
            )}
          </div>
        )}
      </section>

      <WithdrawalSection
        summary={{ currentStageName: stageSummary?.currentStageName ?? undefined }}
      />

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="text-lg font-bold text-gray-900">Stage History</h2>
        </div>
        {data?.history?.length ? (
          <div className="divide-y divide-gray-100">
            {data.history.map((item) => (
              <div key={item.id} className="p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{item.toStageName}</h3>
                    <p className="text-sm text-gray-500">
                      Qualified on {formatDate(item.qualifiedAt)} from {item.fromStageName}
                    </p>
                  </div>
                  <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                    {item.contributors?.length || 0} contributors recorded
                  </span>
                </div>
                {(item.contributors?.length ?? 0) > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-xs uppercase text-gray-400">
                        <tr>
                          <th className="py-2 pr-4">Contributor</th>
                          <th className="py-2 pr-4">Stage at Qualification</th>
                          <th className="py-2 pr-4">Depth</th>
                          <th className="py-2 pr-4">Qualified At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(item.contributors ?? []).map((contributor) => (
                          <tr key={contributor.id}>
                            <td className="py-2 pr-4">
                              {contributor.contributorMember.name ||
                                contributor.contributorMember.username ||
                                contributor.contributorMember.email ||
                                contributor.contributorMemberId}
                            </td>
                            <td className="py-2 pr-4">{contributor.contributorStageName}</td>
                            <td className="py-2 pr-4">{contributor.genealogyDepth}</td>
                            <td className="py-2 pr-4">
                              {formatDate(contributor.contributorQualifiedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="p-5 text-sm text-gray-500">No completed stage history yet.</p>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="text-lg font-bold text-gray-900">Repayable Stage Loans</h2>
        </div>
        {data?.loans?.length ? (
          <div className="divide-y divide-gray-100">
            {data.loans.map((loan) => (
              <div key={loan.id} className="grid gap-3 p-5 text-sm md:grid-cols-5">
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">Stage</p>
                  <p className="font-semibold text-gray-900">{loan.stageName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">Principal</p>
                  <p className="font-semibold text-gray-900">{formatMoney(loan.principal)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">Interest</p>
                  <p className="font-semibold text-gray-900">{formatMoney(loan.interestAmount)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">Outstanding</p>
                  <p className="font-semibold text-gray-900">
                    {formatMoney(loan.outstandingBalance)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">Status</p>
                  <p className="font-semibold text-gray-900">{loan.status}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-5 text-sm text-gray-500">No repayable stage loans recorded.</p>
        )}
      </section>
    </div>
  );
}
