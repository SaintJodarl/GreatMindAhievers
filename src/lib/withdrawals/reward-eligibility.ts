import { Prisma, PrismaClient } from '@prisma/client';
import {
  REQUIRED_DESCENDANT_COUNT,
  STAGE_CONFIG,
  STAGE_IDS,
  STAGE_RANK,
  StageId,
  getNextStage,
  getStageDisplayName,
  getStageNumberLabel,
  isStageAtLeast,
  normalizeStageId,
} from '@/lib/qualification/constants';
import { calculateQualificationProgress } from '@/lib/qualification/engine';

type TxClient =
  | Prisma.TransactionClient
  | PrismaClient
  | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

type RewardWithRelations = Prisma.RewardGetPayload<{
  include: {
    claims: {
      orderBy: { createdAt: 'desc' };
      include: { withdrawals: { orderBy: { createdAt: 'desc' } } };
    };
    withdrawals: { orderBy: { createdAt: 'desc' } };
  };
}>;

type WithdrawalLite = {
  id: string;
  status: string;
  amount: Prisma.Decimal;
  createdAt: Date;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  paidAt: Date | null;
  paymentReference: string | null;
  adminNote: string | null;
  rejectionType: string | null;
};

export type RewardWithdrawalEligibility = {
  eligible: boolean;
  memberId: string;
  currentStage: StageId;
  currentStageName: string;
  nextStage: StageId | null;
  nextStageName: string | null;
  nextRewardStage: StageId | null;
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
  rewardStage?: StageId;
  rewardStageName?: string;
  rewardType?: 'CASH_ONLY' | 'FOOD_ONLY' | 'CASH_OR_PACKAGE' | 'UNKNOWN';
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
  existingWithdrawal?: WithdrawalLite | null;
  blockingReasons: string[];
  guidance: {
    state:
      | 'NOT_QUALIFIED'
      | 'QUALIFIED_REWARD_PROCESSING'
      | 'NON_CASH_REWARD'
      | 'CASH_OPTION_REQUIRED'
      | 'ELIGIBLE'
      | 'PENDING_WITHDRAWAL'
      | 'APPROVED_AWAITING_PAYMENT'
      | 'PAID'
      | 'REJECTED'
      | 'BLOCKED';
    title: string;
    description: string;
    emphasis: string;
  };
};

const FINAL_WITHDRAWAL_STATUSES = new Set(['PAID']);
const ACTIVE_WITHDRAWAL_STATUSES = new Set(['PENDING', 'APPROVED']);
const FINAL_CLAIM_STATUSES = new Set(['PAID', 'FULFILLED', 'REJECTED', 'CANCELLED']);
const NON_CASH_OPTIONS = new Set(['FOOD', 'PACKAGE']);

function decimalToNumber(value: Prisma.Decimal | number | string | null | undefined) {
  if (value == null) return 0;
  return Number(value);
}

function hasBankDetails(user: {
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
}) {
  return Boolean(user.bankName?.trim() && user.accountNumber?.trim() && user.accountName?.trim());
}

function isKycComplete(status: string | null | undefined) {
  return ['APPROVED', 'COMPLETE'].includes((status || '').toUpperCase());
}

function getNextRewardStage(currentStage: StageId) {
  const currentRank = STAGE_RANK[currentStage];
  return Object.values(STAGE_IDS).find(
    (stage) => STAGE_RANK[stage] > currentRank && STAGE_CONFIG[stage].hasReward
  ) as StageId | undefined;
}

function getStageProgressRequirement(
  stage: StageId,
  progress?: {
    qualifiedContributorCount: number;
    requiredContributorCount: number;
    remainingContributorCount: number;
    leftQualifiedCount?: number | null;
    rightQualifiedCount?: number | null;
  } | null
) {
  const config = STAGE_CONFIG[stage];
  const total = progress?.requiredContributorCount ?? config.requiredCount;
  const completed =
    progress?.qualifiedContributorCount ?? (total > 0 ? total : config.hasReward ? total : 0);
  const remaining = progress?.remainingContributorCount ?? Math.max(total - completed, 0);
  const perLeg =
    stage === STAGE_IDS.EMERALD_STAGE_1
      ? 1
      : total === REQUIRED_DESCENDANT_COUNT
        ? REQUIRED_DESCENDANT_COUNT / 2
        : undefined;

  return {
    completedRequirement: completed,
    totalRequirement: total,
    remainingRequirement: Math.max(remaining, 0),
    leftCompleted:
      progress?.leftQualifiedCount == null ? undefined : Number(progress.leftQualifiedCount),
    rightCompleted:
      progress?.rightQualifiedCount == null ? undefined : Number(progress.rightQualifiedCount),
    leftRequired: perLeg,
    rightRequired: perLeg,
  };
}

function findDisplayReward(rewards: RewardWithRelations[], preferredRewardId?: string | null) {
  if (preferredRewardId) {
    return rewards.find((reward) => reward.id === preferredRewardId) ?? null;
  }

  const ranked = [...rewards].sort(
    (a, b) => STAGE_RANK[normalizeStageId(b.stage)] - STAGE_RANK[normalizeStageId(a.stage)]
  );

  return (
    ranked.find((reward) =>
      reward.claims.some(
        (claim) => claim.selectedOption === 'CASH' && !claim.withdrawals.some(isBlockingWithdrawal)
      )
    ) ??
    ranked.find((reward) => reward.status === 'EARNED') ??
    ranked[0] ??
    null
  );
}

function selectExistingWithdrawal(reward: RewardWithRelations | null) {
  if (!reward) return null;
  return (
    reward.withdrawals.find(isBlockingWithdrawal) ??
    reward.claims.flatMap((claim) => claim.withdrawals).find(isBlockingWithdrawal) ??
    null
  );
}

function isFinalRejection(withdrawal: { status: string; rejectionType?: string | null }) {
  return withdrawal.status === 'REJECTED' && withdrawal.rejectionType === 'FINAL';
}

function isBlockingWithdrawal(withdrawal: { status: string; rejectionType?: string | null }) {
  return (
    ACTIVE_WITHDRAWAL_STATUSES.has(withdrawal.status) ||
    FINAL_WITHDRAWAL_STATUSES.has(withdrawal.status) ||
    isFinalRejection(withdrawal)
  );
}

function buildGuidance(input: {
  blockingReasons: string[];
  existingWithdrawal: WithdrawalLite | null;
  reward: RewardWithRelations | null;
  latestClaim: RewardWithRelations['claims'][number] | null;
  rewardStage: StageId | null;
  nextStage: StageId | null;
  qualificationComplete: boolean;
  completedRequirement: number;
  totalRequirement: number;
  remainingRequirement: number;
  leftCompleted?: number;
  leftRequired?: number;
  rightCompleted?: number;
  rightRequired?: number;
  rewardAmount?: number;
}) {
  const {
    existingWithdrawal,
    reward,
    latestClaim,
    rewardStage,
    nextStage,
    qualificationComplete,
    completedRequirement,
    totalRequirement,
    remainingRequirement,
    leftCompleted,
    leftRequired,
    rightCompleted,
    rightRequired,
    rewardAmount,
  } = input;

  if (existingWithdrawal?.status === 'PENDING') {
    return {
      state: 'PENDING_WITHDRAWAL' as const,
      title: 'Withdrawal request under review',
      description: `Your ${rewardStage ? getStageDisplayName(rewardStage) : 'reward'} request has been sent to the admin back office.`,
      emphasis: 'No duplicate request can be submitted for this reward.',
    };
  }

  if (existingWithdrawal?.status === 'APPROVED') {
    return {
      state: 'APPROVED_AWAITING_PAYMENT' as const,
      title: 'Withdrawal approved',
      description: 'Your request has been approved and is awaiting manual settlement.',
      emphasis: 'The reward remains reserved until an admin records payment.',
    };
  }

  if (existingWithdrawal?.status === 'PAID') {
    return {
      state: 'PAID' as const,
      title: 'Withdrawal paid',
      description: existingWithdrawal.paidAt
        ? `Your reward was marked as paid on ${existingWithdrawal.paidAt.toLocaleDateString()}.`
        : 'Your reward has been marked as paid.',
      emphasis: existingWithdrawal.paymentReference
        ? `Payment reference: ${existingWithdrawal.paymentReference}`
        : 'Payment reference was not recorded.',
    };
  }

  if (existingWithdrawal?.status === 'REJECTED') {
    return {
      state: 'REJECTED' as const,
      title: 'Withdrawal rejected',
      description: existingWithdrawal.adminNote || 'The admin rejected this withdrawal request.',
      emphasis:
        existingWithdrawal.rejectionType === 'FINAL'
          ? 'This reward was rejected with final effect.'
          : 'Correct the issue and submit a new request when ready.',
    };
  }

  if (!qualificationComplete) {
    const nextName = nextStage ? getStageDisplayName(nextStage) : 'the next stage';
    const leftText =
      leftCompleted != null && leftRequired != null
        ? ` Left branch: ${leftCompleted} of ${leftRequired}.`
        : '';
    const rightText =
      rightCompleted != null && rightRequired != null
        ? ` Right branch: ${rightCompleted} of ${rightRequired}.`
        : '';
    const requirementUnit = totalRequirement === 2 ? 'member' : 'position';

    return {
      state: 'NOT_QUALIFIED' as const,
      title:
        nextStage === STAGE_IDS.EMERALD_STAGE_1
          ? 'Complete Starter qualification'
          : `${nextName} reward not yet unlocked`,
      description: `You have completed ${completedRequirement} of ${totalRequirement} required qualifying ${requirementUnit}${totalRequirement === 1 ? '' : 's'}.${leftText}${rightText}`,
      emphasis: `${remainingRequirement} more qualifying ${requirementUnit}${remainingRequirement === 1 ? ' is' : 's are'} required before your next reward can be unlocked.`,
    };
  }

  if (!reward) {
    return {
      state: 'QUALIFIED_REWARD_PROCESSING' as const,
      title: 'Reward is still being processed',
      description:
        'Your qualification is complete, but the authoritative reward record has not been created yet.',
      emphasis: 'No withdrawal can be created until the reward record exists.',
    };
  }

  if (latestClaim && NON_CASH_OPTIONS.has(latestClaim.selectedOption)) {
    return {
      state: 'NON_CASH_REWARD' as const,
      title: 'Non-cash reward selected',
      description: `You selected ${latestClaim.selectedOption.toLowerCase()} fulfilment for this reward.`,
      emphasis: 'Cash withdrawal is not available after selecting a package or food option.',
    };
  }

  if (!latestClaim || latestClaim.selectedOption !== 'CASH') {
    return {
      state: 'CASH_OPTION_REQUIRED' as const,
      title: 'Select the cash option first',
      description:
        'This reward supports a package or approved cash option through the reward-claim flow.',
      emphasis:
        'The cash withdrawal button unlocks after you select and confirm CASH for this reward.',
    };
  }

  return {
    state: input.blockingReasons.length ? ('BLOCKED' as const) : ('ELIGIBLE' as const),
    title: input.blockingReasons.length
      ? 'Reward withdrawal blocked'
      : `Your ${rewardStage ? getStageDisplayName(rewardStage) : 'stage'} reward is available`,
    description: input.blockingReasons.length
      ? input.blockingReasons[0]
      : `You have completed the verified qualification for this reward.`,
    emphasis: input.blockingReasons.length
      ? input.blockingReasons[0]
      : `Eligible cash reward: ${new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN',
          maximumFractionDigits: 0,
        }).format(rewardAmount || 0)}.`,
  };
}

export async function getRewardWithdrawalEligibility(
  tx: TxClient,
  memberId: string,
  options: { rewardId?: string | null } = {}
): Promise<RewardWithdrawalEligibility> {
  const user = await tx.user.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      role: true,
      status: true,
      currentStage: true,
      kycStatus: true,
      bankName: true,
      accountNumber: true,
      accountName: true,
    },
  });

  if (!user) {
    throw new Error('Member not found');
  }

  const currentStage = normalizeStageId(user.currentStage);
  const nextStage = getNextStage(currentStage);
  const nextRewardStage = getNextRewardStage(currentStage) ?? null;

  const [rewards, nextProgress, currentStageHistory, currentStageProgress] = await Promise.all([
    tx.reward.findMany({
      where: { userId: memberId },
      include: {
        claims: {
          orderBy: { createdAt: 'desc' },
          include: {
            withdrawals: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        withdrawals: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    calculateQualificationProgress(tx, memberId, nextStage),
    tx.stageHistory.findUnique({
      where: { memberId_toStage: { memberId, toStage: currentStage } },
    }),
    tx.stageProgress.findUnique({
      where: { userId_stage: { userId: memberId, stage: currentStage } },
    }),
  ]);

  const selectedReward = findDisplayReward(rewards, options.rewardId);
  const selectedRewardStage = selectedReward ? normalizeStageId(selectedReward.stage) : null;
  const latestClaim = selectedReward?.claims[0] ?? null;
  const existingWithdrawal = selectExistingWithdrawal(selectedReward);
  const stageForRequirement = selectedRewardStage ?? nextStage;
  const selectedStageProgress = selectedRewardStage === currentStage ? currentStageProgress : null;
  const requirement = stageForRequirement
    ? selectedRewardStage && isStageAtLeast(currentStage, selectedRewardStage)
      ? getStageProgressRequirement(selectedRewardStage, selectedStageProgress)
      : getStageProgressRequirement(stageForRequirement, nextProgress)
    : getStageProgressRequirement(currentStage, null);
  const selectedStageHistory = selectedRewardStage
    ? selectedRewardStage === currentStage
      ? currentStageHistory
      : await tx.stageHistory.findUnique({
          where: { memberId_toStage: { memberId, toStage: selectedRewardStage } },
        })
    : null;

  const rewardQualificationComplete = selectedRewardStage
    ? isStageAtLeast(currentStage, selectedRewardStage) && Boolean(selectedStageHistory)
    : false;
  const qualifiedCurrentRewardMissing =
    !selectedReward && STAGE_CONFIG[currentStage].hasReward && Boolean(currentStageHistory);
  const qualificationComplete = selectedReward
    ? rewardQualificationComplete
    : qualifiedCurrentRewardMissing;
  const kycComplete = isKycComplete(user.kycStatus);
  const bankDetailsComplete = hasBankDetails(user);
  const rewardAmount = decimalToNumber(selectedReward?.rewardValue);
  const rewardType = selectedReward ? 'CASH_OR_PACKAGE' : undefined;
  const cashOptionSelected = latestClaim?.selectedOption === 'CASH';
  const blockingReasons: string[] = [];

  if (user.role !== 'MEMBER' || user.status !== 'ACTIVE') {
    blockingReasons.push('Only active members can request reward withdrawals.');
  }
  if (!selectedReward && STAGE_CONFIG[currentStage].hasReward && currentStageHistory) {
    blockingReasons.push('Your stage is complete, but the reward is still being processed.');
  }
  if (!selectedReward) {
    blockingReasons.push('Your reward is not yet available for withdrawal.');
  }
  if (selectedReward && !rewardQualificationComplete) {
    blockingReasons.push('The stage qualification has not been verified for this reward.');
  }
  if (selectedReward && !STAGE_CONFIG[selectedRewardStage!].hasReward) {
    blockingReasons.push('This stage does not have a withdrawable reward.');
  }
  if (selectedReward && rewardAmount <= 0) {
    blockingReasons.push('This reward has no positive cash value.');
  }
  if (latestClaim && NON_CASH_OPTIONS.has(latestClaim.selectedOption)) {
    blockingReasons.push('A non-cash reward option has already been selected.');
  }
  if (selectedReward && !cashOptionSelected) {
    blockingReasons.push('Select the cash option before requesting withdrawal.');
  }
  if (latestClaim && FINAL_CLAIM_STATUSES.has(latestClaim.status)) {
    blockingReasons.push(`This reward claim is already ${latestClaim.status.toLowerCase()}.`);
  }
  if (existingWithdrawal) {
    blockingReasons.push(
      `A ${existingWithdrawal.status.toLowerCase()} withdrawal already exists for this reward.`
    );
  }
  if (!kycComplete) {
    blockingReasons.push('Complete KYC before requesting your unlocked reward.');
  }
  if (!bankDetailsComplete) {
    blockingReasons.push('Add valid bank details before requesting your unlocked reward.');
  }
  if (selectedReward && selectedReward.status !== 'CLAIMED') {
    blockingReasons.push(
      selectedReward.status === 'EARNED'
        ? 'Confirm the cash reward option before requesting withdrawal.'
        : `This reward is currently ${selectedReward.status.toLowerCase().replace(/_/g, ' ')}.`
    );
  }

  const activeOrFinalExisting = existingWithdrawal && isBlockingWithdrawal(existingWithdrawal);

  const baseEligible =
    Boolean(selectedReward) &&
    Boolean(latestClaim) &&
    qualificationComplete &&
    cashOptionSelected &&
    selectedReward?.status === 'CLAIMED' &&
    rewardAmount > 0 &&
    kycComplete &&
    bankDetailsComplete &&
    !activeOrFinalExisting &&
    !blockingReasons.length;

  const guidance = buildGuidance({
    blockingReasons,
    existingWithdrawal,
    reward: selectedReward,
    latestClaim,
    rewardStage: selectedRewardStage,
    nextStage,
    qualificationComplete,
    ...requirement,
    rewardAmount,
  });

  return {
    eligible: baseEligible,
    memberId,
    currentStage,
    currentStageName: getStageDisplayName(currentStage),
    nextStage,
    nextStageName: nextStage ? getStageDisplayName(nextStage) : null,
    nextRewardStage,
    nextRewardStageName: nextRewardStage ? getStageDisplayName(nextRewardStage) : null,
    qualificationComplete,
    ...requirement,
    rewardId: selectedReward?.id,
    rewardClaimId: latestClaim?.id,
    rewardStage: selectedRewardStage ?? undefined,
    rewardStageName: selectedRewardStage ? getStageDisplayName(selectedRewardStage) : undefined,
    rewardType,
    rewardAmount: selectedReward ? rewardAmount : undefined,
    rewardStatus: selectedReward?.status,
    rewardClaimStatus: latestClaim?.status,
    selectedOption: latestClaim?.selectedOption ?? null,
    requiresCashSelection: Boolean(selectedReward),
    cashOptionSelected,
    kycComplete,
    bankDetailsComplete,
    bankDetails: {
      bankName: user.bankName,
      accountNumber: user.accountNumber,
      accountName: user.accountName,
    },
    existingWithdrawalId: existingWithdrawal?.id,
    existingWithdrawalStatus: existingWithdrawal?.status,
    existingWithdrawal,
    blockingReasons,
    guidance,
  };
}

export function getRewardOptionLabel(selectedOption: string | null | undefined) {
  if (!selectedOption) return 'Not selected';
  if (selectedOption === 'CASH') return 'Cash option selected';
  if (selectedOption === 'PACKAGE') return 'Package option selected';
  if (selectedOption === 'FOOD') return 'Food option selected';
  return selectedOption;
}

export function getStageProgressLabel(eligibility: RewardWithdrawalEligibility) {
  if (eligibility.totalRequirement === 0) {
    return getStageNumberLabel(eligibility.currentStage);
  }
  return `${eligibility.completedRequirement} of ${eligibility.totalRequirement} complete`;
}
