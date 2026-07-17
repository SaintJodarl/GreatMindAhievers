'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Banknote, CheckCircle2, Gift, Package, RefreshCw } from 'lucide-react';

type ClaimOption = 'CASH' | 'PACKAGE';
type SavedClaimOption = ClaimOption | 'FOOD';
type NoticeTone = 'success' | 'warning' | 'error';

interface RewardClaimSummary {
  id: string;
  selectedOption: SavedClaimOption | string;
  status: string;
}

interface RewardWithdrawalSummary {
  id: string;
  status: string;
  createdAt?: string | null;
}

interface RewardSummary {
  id: string;
  stage?: string | null;
  stageName: string;
  stageNumberLabel?: string | null;
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
  stage?: string | null;
  stageName: string;
  stageNumberLabel?: string | null;
  rewardValue: number;
  rewardPackage?: string | null;
}

interface NextRewardSummary extends RewardConfigSummary {
  requirement?: string;
  attained?: boolean;
}

interface RewardsPageData {
  stageSummary?: StageSummary | null;
  rewards: RewardSummary[];
  currentReward?: RewardConfigSummary | null;
  nextReward?: NextRewardSummary | null;
}

interface RewardWithdrawalEligibility {
  eligible: boolean;
  rewardId?: string;
  rewardClaimId?: string;
  rewardStageName?: string;
  rewardAmount?: number;
  rewardStatus?: string;
  rewardClaimStatus?: string;
  selectedOption?: string | null;
  kycComplete: boolean;
  bankDetailsComplete: boolean;
  existingWithdrawalId?: string;
  existingWithdrawalStatus?: string;
  blockingReasons?: string[];
  guidance?: {
    state: string;
    title: string;
    description: string;
    emphasis: string;
  };
}

interface WithdrawalApiData {
  eligibility?: RewardWithdrawalEligibility | null;
}

interface RewardPackageDisplay {
  intro: string;
  items: string[];
}

interface Notice {
  tone: NoticeTone;
  message: string;
}

const formatMoney = (value: unknown) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString() : 'Not recorded';

const EMERALD_ITEMS = [
  '1 carton of noodles',
  '1 roll of milk',
  '1 roll of Milo',
  '1 pack of sugar',
  `${formatMoney(10000)} cash`,
  '5 kg garri',
  '5 kg beans',
  '10 kg rice',
  '2 litres palm oil',
];

const SILVER_ITEMS = [
  '1 carton of spaghetti',
  '2 tins of tomatoes',
  '1 packet of sugar',
  '2 rolls of milk and Milo',
  `${formatMoney(20000)} cash`,
  `Healthcare products worth ${formatMoney(11000)}`,
];

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

function formatHumanStatus(status: string | null | undefined) {
  if (!status) return 'Pending';
  const value = status.replace(/_/g, ' ').toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatOptionLabel(option: string | null | undefined) {
  if (!option) return 'Not selected';
  if (option === 'CASH') return 'Cash';
  if (option === 'FOOD' || option === 'PACKAGE') return 'Food Package';
  return formatHumanStatus(option);
}

function isCashOption(option: string | null | undefined) {
  return option === 'CASH';
}

function isFoodPackageOption(option: string | null | undefined) {
  return option === 'FOOD' || option === 'PACKAGE';
}

function isStage(
  reward: Pick<RewardConfigSummary, 'stage' | 'stageName'> | RewardSummary,
  stageId: string,
  stageName: string
) {
  return reward.stage === stageId || reward.stageName.toLowerCase().startsWith(stageName);
}

function parseRewardPackage(packageText: string | null | undefined): RewardPackageDisplay {
  if (!packageText?.trim()) {
    return { intro: 'This stage does not carry a reward package.', items: [] };
  }

  const [intro, ...rest] = packageText.split(':');
  const itemText = rest.join(':');
  const items = itemText
    .split(';')
    .map((item) => item.trim().replace(/\.$/, ''))
    .filter(Boolean);

  return {
    intro: itemText ? `${intro.trim()}:` : packageText.trim(),
    items,
  };
}

function getRewardPackageDisplay(
  reward: Pick<RewardConfigSummary, 'stage' | 'stageName' | 'rewardValue' | 'rewardPackage'>
): RewardPackageDisplay {
  if (isStage(reward, 'EMERALD_STAGE_1', 'emerald')) {
    return {
      intro: `Food package or approved cash option worth ${formatMoney(reward.rewardValue)}:`,
      items: EMERALD_ITEMS,
    };
  }

  if (isStage(reward, 'SILVER_STAGE_2', 'silver')) {
    return {
      intro: `Reward value ${formatMoney(reward.rewardValue)}:`,
      items: SILVER_ITEMS,
    };
  }

  return parseRewardPackage(reward.rewardPackage);
}

function getNextRewardDisplay(nextReward: NextRewardSummary): RewardPackageDisplay {
  const packageDisplay = getRewardPackageDisplay(nextReward);

  return {
    intro: `When you qualify for ${nextReward.stageName}, your reward value is ${formatMoney(
      nextReward.rewardValue
    )}:`,
    items: packageDisplay.items,
  };
}

function getShortRewardSummary(reward: RewardSummary) {
  const packageDisplay = getRewardPackageDisplay(reward);
  return packageDisplay.intro.replace(/:\s*$/, '.');
}

function getStageAmountLabel(stageName: string) {
  const [stageBase] = stageName.split(/\s+(?:\u2014|-)\s+/);
  return `${stageBase.trim().toUpperCase()} STAGE`;
}

function selectWithdrawReward(rewards: RewardSummary[], eligibilityRewardId: string | undefined) {
  if (!rewards.length) return null;

  if (eligibilityRewardId) {
    const matchingReward = rewards.find((reward) => reward.id === eligibilityRewardId);
    if (matchingReward) return matchingReward;
  }

  return (
    rewards.find(
      (reward) =>
        reward.status === 'WITHDRAWAL_PENDING' ||
        reward.latestWithdrawal?.status === 'PENDING' ||
        reward.withdrawalStatus === 'PENDING'
    ) ??
    rewards.find(
      (reward) => reward.status === 'CLAIMED' && isCashOption(reward.latestClaim?.selectedOption)
    ) ??
    rewards.find((reward) => reward.status === 'EARNED') ??
    rewards[0]
  );
}

function getSimpleEligibilityReason(
  eligibility: RewardWithdrawalEligibility | null | undefined,
  reward?: RewardSummary | null
) {
  const withdrawalStatus =
    eligibility?.existingWithdrawalStatus || reward?.latestWithdrawal?.status;

  if (withdrawalStatus === 'PENDING' || reward?.status === 'WITHDRAWAL_PENDING') {
    return 'Your withdrawal request is being reviewed.';
  }
  if (withdrawalStatus === 'APPROVED' || reward?.status === 'WITHDRAWAL_APPROVED') {
    return 'Your withdrawal request has been approved and is waiting for payment.';
  }
  if (withdrawalStatus === 'PAID' || reward?.status === 'PAID') {
    return 'This reward has been paid.';
  }
  if (withdrawalStatus === 'REJECTED' || reward?.status === 'WITHDRAWAL_REJECTED') {
    return 'Your withdrawal request was not approved.';
  }
  if (isFoodPackageOption(eligibility?.selectedOption || reward?.latestClaim?.selectedOption)) {
    return 'Your food package request is being reviewed.';
  }
  if (eligibility && !eligibility.kycComplete) {
    return 'Complete your KYC before withdrawing your reward.';
  }
  if (eligibility && !eligibility.bankDetailsComplete) {
    return 'Add your bank details before withdrawing your reward.';
  }
  if (eligibility?.guidance?.state === 'CASH_OPTION_REQUIRED') {
    return 'Choose Cash before withdrawing this reward.';
  }
  if (eligibility?.guidance?.state === 'NOT_QUALIFIED') {
    return 'You do not have a reward ready to withdraw yet.';
  }

  const reason = eligibility?.blockingReasons?.[0] || eligibility?.guidance?.description;
  if (reason?.toLowerCase().includes('kyc')) {
    return 'Complete your KYC before withdrawing your reward.';
  }
  if (reason?.toLowerCase().includes('bank')) {
    return 'Add your bank details before withdrawing your reward.';
  }
  if (reason?.toLowerCase().includes('cash option')) {
    return 'Choose Cash before withdrawing this reward.';
  }

  return reason || 'Reward withdrawal is not available right now.';
}

function NoticeMessage({ notice }: { notice: Notice }) {
  const className =
    notice.tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : notice.tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-rose-200 bg-rose-50 text-rose-700';
  const Icon = notice.tone === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-4 ${className}`}>
      <Icon className="shrink-0" size={20} />
      <p className="text-sm font-medium">{notice.message}</p>
    </div>
  );
}

function RewardItems({ display }: { display: RewardPackageDisplay }) {
  return (
    <div className="mt-3">
      <p className="text-sm leading-6 text-gray-700">{display.intro}</p>
      {display.items.length > 0 && (
        <ul className="mt-3 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
          {display.items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RewardOptionSelector({
  selectedOption,
  onChange,
  disabled,
}: {
  selectedOption: ClaimOption;
  onChange: (option: ClaimOption) => void;
  disabled?: boolean;
}) {
  const options: Array<{
    value: ClaimOption;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }> = [
    { value: 'CASH', label: 'Cash', icon: Banknote },
    { value: 'PACKAGE', label: 'Food Package', icon: Package },
  ];

  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-gray-900">Choose your reward option:</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const Icon = option.icon;
          const active = selectedOption === option.value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                active
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getRewardStatusMessage(
  reward: RewardSummary,
  eligibility: RewardWithdrawalEligibility | null
) {
  if (
    reward.status === 'WITHDRAWAL_PENDING' ||
    reward.latestWithdrawal?.status === 'PENDING' ||
    eligibility?.existingWithdrawalStatus === 'PENDING'
  ) {
    return 'Your withdrawal request is being reviewed.';
  }

  if (reward.latestClaim && isFoodPackageOption(reward.latestClaim.selectedOption)) {
    return 'Your food package request is being reviewed.';
  }

  if (reward.latestClaim && isCashOption(reward.latestClaim.selectedOption)) {
    if (reward.status === 'CLAIMED' && eligibility?.eligible) return '';
    return getSimpleEligibilityReason(eligibility, reward);
  }

  if (reward.status === 'PAID') return 'This reward has been paid.';
  if (reward.status === 'WITHDRAWAL_APPROVED') {
    return 'Your withdrawal request has been approved and is waiting for payment.';
  }
  if (reward.status === 'WITHDRAWAL_REJECTED') return 'Your withdrawal request was not approved.';

  return '';
}

export default function MemberRewardsPage() {
  const [data, setData] = useState<RewardsPageData | null>(null);
  const [withdrawalEligibility, setWithdrawalEligibility] =
    useState<RewardWithdrawalEligibility | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, ClaimOption>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const fetchPageData = useCallback(async (showPageLoading = true) => {
    if (showPageLoading) setLoading(true);
    setError('');

    try {
      const [rewardsRes, withdrawalsRes] = await Promise.all([
        fetch('/api/user/rewards', { cache: 'no-store' }),
        fetch('/api/user/withdrawals', { cache: 'no-store' }),
      ]);
      const rewardsPayload = await rewardsRes.json().catch(() => null);
      const withdrawalsPayload = (await withdrawalsRes
        .json()
        .catch(() => null)) as WithdrawalApiData | null;

      if (!rewardsRes.ok) {
        throw new Error(rewardsPayload?.message || 'Unable to load rewards.');
      }
      if (!withdrawalsRes.ok) {
        throw new Error(
          (withdrawalsPayload as { message?: string } | null)?.message ||
            'Unable to load withdrawal status.'
        );
      }

      setData(rewardsPayload as RewardsPageData);
      setWithdrawalEligibility(withdrawalsPayload?.eligibility ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load rewards.');
      setData(null);
      setWithdrawalEligibility(null);
    } finally {
      if (showPageLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const fetchRewardEligibility = async (rewardId: string) => {
    const res = await fetch(
      `/api/user/withdrawals/eligibility?rewardId=${encodeURIComponent(rewardId)}`,
      { cache: 'no-store' }
    );
    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(payload?.message || 'Unable to check withdrawal status.');
    }

    return payload?.eligibility as RewardWithdrawalEligibility | null;
  };

  const submitRewardClaim = async (rewardId: string, selectedOption: ClaimOption) => {
    const res = await fetch('/api/user/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rewardId, selectedOption }),
    });
    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(payload?.message || 'Unable to submit reward option.');
    }
  };

  const submitCashWithdrawal = async (rewardId: string) => {
    const res = await fetch('/api/user/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rewardId }),
    });
    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(payload?.message || 'Unable to submit withdrawal request.');
    }
  };

  const handleRewardSubmit = async (reward: RewardSummary) => {
    const selectedOption = selectedOptions[reward.id] ?? 'CASH';
    setSubmitting(reward.id);
    setNotice(null);

    try {
      if (reward.status === 'EARNED' && !reward.latestClaim) {
        await submitRewardClaim(reward.id, selectedOption);

        if (selectedOption === 'PACKAGE') {
          setNotice({
            tone: 'success',
            message: 'Food package option submitted for admin processing.',
          });
          await fetchPageData(false);
          return;
        }

        const eligibility = await fetchRewardEligibility(reward.id);
        if (eligibility?.eligible) {
          await submitCashWithdrawal(reward.id);
          setNotice({ tone: 'success', message: 'Your withdrawal request is being reviewed.' });
        } else {
          setNotice({
            tone: 'warning',
            message: getSimpleEligibilityReason(eligibility, reward),
          });
        }

        await fetchPageData(false);
        return;
      }

      if (reward.latestClaim && isCashOption(reward.latestClaim.selectedOption)) {
        const eligibility = await fetchRewardEligibility(reward.id);
        if (!eligibility?.eligible) {
          setNotice({
            tone: eligibility?.existingWithdrawalStatus === 'PENDING' ? 'success' : 'warning',
            message: getSimpleEligibilityReason(eligibility, reward),
          });
          await fetchPageData(false);
          return;
        }

        await submitCashWithdrawal(reward.id);
        setNotice({ tone: 'success', message: 'Your withdrawal request is being reviewed.' });
        await fetchPageData(false);
      }
    } catch (err: unknown) {
      setNotice({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Unable to submit reward request.',
      });
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
            <div key={item} className="h-44 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-lg bg-slate-100" />
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
            onClick={() => fetchPageData()}
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
  const withdrawReward = selectWithdrawReward(rewards, withdrawalEligibility?.rewardId);
  const activeEligibility =
    withdrawReward && withdrawalEligibility?.rewardId === withdrawReward.id
      ? withdrawalEligibility
      : null;
  const selectedWithdrawOption = withdrawReward
    ? (selectedOptions[withdrawReward.id] ?? 'CASH')
    : 'CASH';
  const showOptionSelector =
    Boolean(withdrawReward) && withdrawReward?.status === 'EARNED' && !withdrawReward.latestClaim;
  const showWithdrawalButton =
    Boolean(withdrawReward) &&
    (showOptionSelector ||
      (withdrawReward?.status === 'CLAIMED' &&
        isCashOption(withdrawReward.latestClaim?.selectedOption) &&
        activeEligibility?.eligible));
  const rewardStatusMessage = withdrawReward
    ? getRewardStatusMessage(withdrawReward, activeEligibility)
    : '';

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rewards & Withdrawal</h1>
        <p className="mt-1 text-sm text-gray-500">
          View your stage, current reward, next reward, and reward request.
        </p>
      </div>

      {notice && <NoticeMessage notice={notice} />}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.85fr_1.15fr_1.15fr]">
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
            <Gift size={17} className="text-green-600" />
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Current Reward
            </p>
          </div>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            {currentReward ? formatMoney(currentReward.rewardValue) : 'No stage reward'}
          </h2>
          {currentReward ? (
            <>
              <RewardItems display={getRewardPackageDisplay(currentReward)} />
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-900">Reward choices:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    Cash
                  </span>
                  <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                    Food Package
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-gray-600">
              This stage does not carry a reward package.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Banknote size={17} className="text-emerald-600" />
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Next Reward</p>
          </div>
          {nextReward ? (
            <>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {formatMoney(nextReward.rewardValue)}{' '}
                <span className="text-base font-semibold text-gray-500">
                  ({getStageAmountLabel(nextReward.stageName)})
                </span>
              </h2>
              <RewardItems display={getNextRewardDisplay(nextReward)} />
            </>
          ) : (
            <>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">Plan completed</h2>
              <p className="mt-3 text-sm text-gray-600">No further reward stage exists.</p>
            </>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="text-lg font-bold text-gray-900">Withdraw Reward</h2>
        </div>

        {withdrawReward ? (
          <div className="p-5">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">{withdrawReward.stageName}</h3>
                  <RewardStatusBadge status={withdrawReward.status} />
                </div>
                <p className="mt-2 text-2xl font-bold text-green-700">
                  {formatMoney(withdrawReward.rewardValue)}
                </p>
                <p className="mt-3 text-sm text-gray-600">
                  Reward option: {getShortRewardSummary(withdrawReward)}
                </p>

                {withdrawReward.latestClaim ? (
                  <div className="mt-4 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
                    <p>
                      <span className="font-semibold text-gray-900">Withdrawal option:</span>{' '}
                      {formatOptionLabel(withdrawReward.latestClaim.selectedOption)}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-900">Status:</span>{' '}
                      {formatHumanStatus(withdrawReward.latestClaim.status)}
                    </p>
                  </div>
                ) : (
                  <RewardOptionSelector
                    selectedOption={selectedWithdrawOption}
                    disabled={submitting === withdrawReward.id}
                    onChange={(option) =>
                      setSelectedOptions((current) => ({
                        ...current,
                        [withdrawReward.id]: option,
                      }))
                    }
                  />
                )}

                {rewardStatusMessage && (
                  <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
                    {rewardStatusMessage}
                  </p>
                )}
              </div>

              {showWithdrawalButton && (
                <button
                  type="button"
                  onClick={() => withdrawReward && handleRewardSubmit(withdrawReward)}
                  disabled={submitting === withdrawReward.id}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {submitting === withdrawReward.id ? 'Submitting...' : 'Withdraw Reward'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-5 text-sm text-gray-500">
            {nextReward ? (
              <p>
                No reward is ready to withdraw yet. Your next reward is{' '}
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
    </div>
  );
}
