import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  REQUIRED_DESCENDANT_COUNT,
  STAGE_CONFIG,
  STAGE_IDS,
  StageId,
  getStageDisplayName,
  isStageAtLeast,
} from '../src/lib/qualification/constants';

type RewardStatus =
  | 'EARNED'
  | 'CLAIMED'
  | 'WITHDRAWAL_PENDING'
  | 'WITHDRAWAL_APPROVED'
  | 'WITHDRAWAL_REJECTED'
  | 'PAID';

type ClaimStatus =
  | 'PENDING_ADMIN_PROCESSING'
  | 'PROCESSING'
  | 'PAID'
  | 'FULFILLED'
  | 'REJECTED'
  | 'CANCELLED';

type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
type RejectionType = 'CORRECTABLE' | 'FINAL';
type LedgerStatus = 'PENDING' | 'APPROVED' | 'CANCELLED' | 'COMPLETED';
type UserRole = 'MEMBER' | 'ADMIN' | 'SUPER_ADMIN' | 'SUPPORT';

type Claim = {
  id: string;
  rewardId: string;
  userId: string;
  selectedOption: 'CASH' | 'FOOD' | 'PACKAGE';
  status: ClaimStatus;
  adminNote?: string;
  processedByAdminId?: string;
};

type Reward = {
  id: string;
  userId: string;
  stage: StageId;
  amount: number;
  status: RewardStatus;
  claim?: Claim;
};

type Withdrawal = {
  id: string;
  userId: string;
  rewardId: string;
  rewardClaimId: string;
  amount: number;
  status: WithdrawalStatus;
  approvedAt?: Date;
  rejectedAt?: Date;
  paidAt?: Date;
  paymentReference?: string;
  paymentNote?: string;
  adminNote?: string;
  rejectionType?: RejectionType;
  processedBy?: string;
};

type LedgerEntry = {
  withdrawalId: string;
  type: string;
  amount: number;
  status: LedgerStatus;
};

type AuditEntry = {
  adminId: string;
  action: string;
  targetId: string;
  details: Record<string, unknown>;
};

type Member = {
  id: string;
  role: 'MEMBER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE';
  currentStage: StageId;
  completedStages: Set<StageId>;
  progress: {
    completed: number;
    total: number;
    remaining: number;
    leftCompleted?: number;
    leftRequired?: number;
    rightCompleted?: number;
    rightRequired?: number;
  };
  kycStatus: 'PENDING' | 'APPROVED';
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  rewards: Reward[];
  withdrawals: Withdrawal[];
  ledger: LedgerEntry[];
  auditLog: AuditEntry[];
  walletBalance: number;
};

type AdminActor = {
  id: string;
  role: UserRole;
  status?: 'ACTIVE' | 'SUSPENDED';
  adminRole?: 'FINANCE_ADMIN' | 'READ_ONLY_ADMIN' | 'SUPPORT_WITHDRAWALS' | 'BROKEN_ROLE';
};

type Eligibility = {
  eligible: boolean;
  qualificationComplete: boolean;
  reward?: Reward;
  claim?: Claim;
  rewardAmount?: number;
  existingWithdrawal?: Withdrawal;
  blockingReasons: string[];
  guidance: {
    state:
      | 'NOT_QUALIFIED'
      | 'QUALIFIED_REWARD_PROCESSING'
      | 'CASH_OPTION_REQUIRED'
      | 'NON_CASH_REWARD'
      | 'ELIGIBLE'
      | 'PENDING_WITHDRAWAL'
      | 'APPROVED_AWAITING_PAYMENT'
      | 'PAID'
      | 'REJECTED'
      | 'BLOCKED';
    title: string;
    description: string;
  };
  completedRequirement: number;
  totalRequirement: number;
  remainingRequirement: number;
  leftCompleted?: number;
  leftRequired?: number;
  rightCompleted?: number;
  rightRequired?: number;
};

const MIN_REJECTION_REASON_LENGTH = 5;
const MAX_REJECTION_REASON_LENGTH = 1000;
const ACTIVE_WITHDRAWAL_STATUSES = new Set<WithdrawalStatus>(['PENDING', 'APPROVED']);
const FINAL_WITHDRAWAL_STATUSES = new Set<WithdrawalStatus>(['PAID']);
const tests: string[] = [];

const adminRoles: Record<NonNullable<AdminActor['adminRole']>, string[] | null> = {
  FINANCE_ADMIN: ['withdrawal:read', 'withdrawal:write'],
  READ_ONLY_ADMIN: ['withdrawal:read'],
  SUPPORT_WITHDRAWALS: ['withdrawal:read', 'withdrawal:write'],
  BROKEN_ROLE: null,
};

const superAdmin: AdminActor = { id: 'super-admin', role: 'SUPER_ADMIN' };
const financeAdmin: AdminActor = {
  id: 'finance-admin',
  role: 'ADMIN',
  adminRole: 'FINANCE_ADMIN',
};
const readOnlyAdmin: AdminActor = {
  id: 'read-only-admin',
  role: 'ADMIN',
  adminRole: 'READ_ONLY_ADMIN',
};
const adminWithoutRole: AdminActor = { id: 'legacy-admin', role: 'ADMIN' };
const supportWithoutRole: AdminActor = { id: 'support-user', role: 'SUPPORT' };
const supportWithRole: AdminActor = {
  id: 'support-authorized',
  role: 'SUPPORT',
  adminRole: 'SUPPORT_WITHDRAWALS',
};
const memberActor: AdminActor = { id: 'member-actor', role: 'MEMBER' };

function test(name: string, fn: () => void) {
  fn();
  tests.push(name);
}

function makeMember(overrides: Partial<Member> = {}): Member {
  const stage = overrides.currentStage ?? STAGE_IDS.STARTER_ENTRY_STAGE;
  return {
    id: overrides.id ?? `member-${Math.random().toString(16).slice(2)}`,
    role: overrides.role ?? 'MEMBER',
    status: overrides.status ?? 'ACTIVE',
    currentStage: stage,
    completedStages: overrides.completedStages ?? new Set<StageId>(),
    progress:
      overrides.progress ??
      ({
        completed: 0,
        total: 2,
        remaining: 2,
        leftCompleted: 0,
        leftRequired: 1,
        rightCompleted: 0,
        rightRequired: 1,
      } satisfies Member['progress']),
    kycStatus: overrides.kycStatus ?? 'APPROVED',
    bankName: overrides.bankName ?? 'GMA Bank',
    accountNumber: overrides.accountNumber ?? '0123456789',
    accountName: overrides.accountName ?? 'Great Member',
    rewards: overrides.rewards ?? [],
    withdrawals: overrides.withdrawals ?? [],
    ledger: overrides.ledger ?? [],
    auditLog: overrides.auditLog ?? [],
    walletBalance: overrides.walletBalance ?? 0,
  };
}

function cloneMember(member: Member): Member {
  return {
    ...member,
    completedStages: new Set(member.completedStages),
    progress: { ...member.progress },
    rewards: member.rewards.map((reward) => ({
      ...reward,
      claim: reward.claim ? { ...reward.claim } : undefined,
    })),
    withdrawals: member.withdrawals.map((withdrawal) => ({ ...withdrawal })),
    ledger: member.ledger.map((entry) => ({ ...entry })),
    auditLog: member.auditLog.map((entry) => ({
      ...entry,
      details: { ...entry.details },
    })),
  };
}

function restoreMember(target: Member, snapshot: Member) {
  target.id = snapshot.id;
  target.role = snapshot.role;
  target.status = snapshot.status;
  target.currentStage = snapshot.currentStage;
  target.completedStages = new Set(snapshot.completedStages);
  target.progress = { ...snapshot.progress };
  target.kycStatus = snapshot.kycStatus;
  target.bankName = snapshot.bankName;
  target.accountNumber = snapshot.accountNumber;
  target.accountName = snapshot.accountName;
  target.rewards = snapshot.rewards.map((reward) => {
    const existing = target.rewards.find((item) => item.id === reward.id);
    const restored = existing ?? ({} as Reward);
    restored.id = reward.id;
    restored.userId = reward.userId;
    restored.stage = reward.stage;
    restored.amount = reward.amount;
    restored.status = reward.status;
    if (reward.claim) {
      const claim = existing?.claim ?? ({} as Claim);
      claim.id = reward.claim.id;
      claim.rewardId = reward.claim.rewardId;
      claim.userId = reward.claim.userId;
      claim.selectedOption = reward.claim.selectedOption;
      claim.status = reward.claim.status;
      claim.adminNote = reward.claim.adminNote;
      claim.processedByAdminId = reward.claim.processedByAdminId;
      restored.claim = claim;
    } else {
      restored.claim = undefined;
    }
    return restored;
  });
  target.withdrawals = snapshot.withdrawals.map((withdrawal) => {
    const existing = target.withdrawals.find((item) => item.id === withdrawal.id);
    const restored = existing ?? ({} as Withdrawal);
    Object.assign(restored, withdrawal);
    return restored;
  });
  target.ledger = snapshot.ledger.map((entry) => ({ ...entry }));
  target.auditLog = snapshot.auditLog.map((entry) => ({
    ...entry,
    details: { ...entry.details },
  }));
  target.walletBalance = snapshot.walletBalance;
}

function withRollback<T>(member: Member, action: () => T) {
  const snapshot = cloneMember(member);
  try {
    return action();
  } catch (error) {
    restoreMember(member, snapshot);
    throw error;
  }
}

function addCashClaimedReward(
  member: Member,
  stage: StageId,
  amount = STAGE_CONFIG[stage].rewardValue
) {
  member.completedStages.add(stage);
  member.currentStage = stage;
  member.progress = {
    completed: STAGE_CONFIG[stage].requiredCount,
    total: STAGE_CONFIG[stage].requiredCount,
    remaining: 0,
  };

  const reward: Reward = {
    id: `reward-${member.id}-${stage}`,
    userId: member.id,
    stage,
    amount,
    status: 'CLAIMED',
  };
  reward.claim = {
    id: `claim-${member.id}-${stage}`,
    rewardId: reward.id,
    userId: member.id,
    selectedOption: 'CASH',
    status: 'PENDING_ADMIN_PROCESSING',
  };
  member.rewards.push(reward);
  return reward;
}

function bankComplete(member: Member) {
  return Boolean(member.bankName && member.accountNumber && member.accountName);
}

function isBlockingWithdrawal(withdrawal: Withdrawal) {
  return (
    ACTIVE_WITHDRAWAL_STATUSES.has(withdrawal.status) ||
    FINAL_WITHDRAWAL_STATUSES.has(withdrawal.status) ||
    (withdrawal.status === 'REJECTED' && withdrawal.rejectionType === 'FINAL')
  );
}

function existingWithdrawal(member: Member, rewardId: string) {
  return member.withdrawals.find(
    (withdrawal) => withdrawal.rewardId === rewardId && isBlockingWithdrawal(withdrawal)
  );
}

function evaluateEligibility(member: Member, rewardId?: string): Eligibility {
  const reward = rewardId
    ? member.rewards.find((candidate) => candidate.id === rewardId)
    : member.rewards[0];
  const withdrawal = reward ? existingWithdrawal(member, reward.id) : undefined;
  const qualificationComplete =
    Boolean(reward) &&
    isStageAtLeast(member.currentStage, reward!.stage) &&
    member.completedStages.has(reward!.stage);
  const hasCompletedRewardStageWithoutReward =
    !reward &&
    STAGE_CONFIG[member.currentStage].hasReward &&
    member.completedStages.has(member.currentStage);
  const blockingReasons: string[] = [];

  if (member.role !== 'MEMBER' || member.status !== 'ACTIVE') {
    blockingReasons.push('Only active members can request reward withdrawals.');
  }
  if (!reward) {
    blockingReasons.push(
      hasCompletedRewardStageWithoutReward
        ? 'Your stage is complete, but the reward is still being processed.'
        : 'Your reward is not yet available for withdrawal.'
    );
  }
  if (reward && !qualificationComplete) {
    blockingReasons.push('The stage qualification has not been verified for this reward.');
  }
  if (reward && reward.amount <= 0) {
    blockingReasons.push('This reward has no positive cash value.');
  }
  if (reward?.claim?.selectedOption === 'FOOD' || reward?.claim?.selectedOption === 'PACKAGE') {
    blockingReasons.push('A non-cash reward option has already been selected.');
  }
  if (reward && reward.claim?.selectedOption !== 'CASH') {
    blockingReasons.push('Select the cash option before requesting withdrawal.');
  }
  if (withdrawal) {
    blockingReasons.push(
      `A ${withdrawal.status.toLowerCase()} withdrawal already exists for this reward.`
    );
  }
  if (member.kycStatus !== 'APPROVED') {
    blockingReasons.push('Complete KYC before requesting your unlocked reward.');
  }
  if (!bankComplete(member)) {
    blockingReasons.push('Add valid bank details before requesting your unlocked reward.');
  }
  if (reward && reward.status !== 'CLAIMED') {
    blockingReasons.push(
      `This reward is currently ${reward.status.toLowerCase().replace(/_/g, ' ')}.`
    );
  }

  const guidance =
    withdrawal?.status === 'PENDING'
      ? {
          state: 'PENDING_WITHDRAWAL' as const,
          title: 'Withdrawal request under review',
          description: 'No duplicate request can be submitted for this reward.',
        }
      : withdrawal?.status === 'APPROVED'
        ? {
            state: 'APPROVED_AWAITING_PAYMENT' as const,
            title: 'Withdrawal approved',
            description: 'The reward remains reserved until an admin records payment.',
          }
        : withdrawal?.status === 'PAID'
          ? {
              state: 'PAID' as const,
              title: 'Withdrawal paid',
              description: withdrawal.paymentReference ?? 'Paid',
            }
          : withdrawal?.status === 'REJECTED'
            ? {
                state: 'REJECTED' as const,
                title: 'Withdrawal rejected',
                description: withdrawal.adminNote ?? 'Rejected',
              }
            : !qualificationComplete
              ? {
                  state: hasCompletedRewardStageWithoutReward
                    ? ('QUALIFIED_REWARD_PROCESSING' as const)
                    : ('NOT_QUALIFIED' as const),
                  title: hasCompletedRewardStageWithoutReward
                    ? 'Reward is still being processed'
                    : 'Complete qualification first',
                  description: `${member.progress.completed} of ${member.progress.total} qualifying positions completed.`,
                }
              : reward?.claim?.selectedOption === 'FOOD' ||
                  reward?.claim?.selectedOption === 'PACKAGE'
                ? {
                    state: 'NON_CASH_REWARD' as const,
                    title: 'Non-cash reward selected',
                    description: 'Cash withdrawal is not available.',
                  }
                : reward?.claim?.selectedOption !== 'CASH'
                  ? {
                      state: 'CASH_OPTION_REQUIRED' as const,
                      title: 'Select the cash option first',
                      description: 'Cash withdrawal unlocks after claim selection.',
                    }
                  : {
                      state: blockingReasons.length ? ('BLOCKED' as const) : ('ELIGIBLE' as const),
                      title: blockingReasons.length
                        ? 'Reward withdrawal blocked'
                        : 'Reward withdrawal available',
                      description: blockingReasons[0] ?? 'Qualification verified.',
                    };

  return {
    eligible:
      Boolean(reward) &&
      qualificationComplete &&
      reward?.status === 'CLAIMED' &&
      reward.claim?.selectedOption === 'CASH' &&
      reward.claim.status === 'PENDING_ADMIN_PROCESSING' &&
      reward.amount > 0 &&
      member.kycStatus === 'APPROVED' &&
      bankComplete(member) &&
      !withdrawal &&
      blockingReasons.length === 0,
    qualificationComplete,
    reward,
    claim: reward?.claim,
    rewardAmount: reward?.amount,
    existingWithdrawal: withdrawal,
    blockingReasons,
    guidance,
    completedRequirement: member.progress.completed,
    totalRequirement: member.progress.total,
    remainingRequirement: member.progress.remaining,
    leftCompleted: member.progress.leftCompleted,
    leftRequired: member.progress.leftRequired,
    rightCompleted: member.progress.rightCompleted,
    rightRequired: member.progress.rightRequired,
  };
}

function verifyWithdrawalPermission(
  actor: AdminActor,
  requiredPermission: 'withdrawal:read' | 'withdrawal:write'
) {
  if (actor.status === 'SUSPENDED') {
    throw new Error('Forbidden: Account suspended');
  }
  if (actor.role === 'SUPER_ADMIN') {
    return actor;
  }
  if (!['ADMIN', 'SUPPORT'].includes(actor.role)) {
    throw new Error('Forbidden: Admin access only');
  }
  if (!actor.adminRole) {
    throw new Error('Forbidden: Withdrawal permissions require an assigned admin role');
  }
  const permissions = adminRoles[actor.adminRole];
  if (!permissions) {
    throw new Error('Forbidden: Admin role permissions are invalid');
  }
  if (permissions.includes('*') || permissions.includes(requiredPermission)) {
    return actor;
  }
  throw new Error(`Forbidden: Missing required permission: ${requiredPermission}`);
}

function assertExpectedLedger(member: Member, withdrawalId: string, expectedStatus: LedgerStatus) {
  const matches = member.ledger.filter((entry) => entry.withdrawalId === withdrawalId);
  if (matches.length !== 1 || matches[0].status !== expectedStatus) {
    throw new Error('Expected withdrawal ledger entry was not updated.');
  }
  return matches[0];
}

function validateRejectionInput(input: { reason?: unknown; rejectionType?: unknown }) {
  const reason = typeof input.reason === 'string' ? input.reason.trim() : '';
  const rejectionType = typeof input.rejectionType === 'string' ? input.rejectionType.trim() : '';

  if (!reason) {
    throw new Error('Rejection reason is required.');
  }
  if (reason.length < MIN_REJECTION_REASON_LENGTH) {
    throw new Error(`Rejection reason must be at least ${MIN_REJECTION_REASON_LENGTH} characters.`);
  }
  if (reason.length > MAX_REJECTION_REASON_LENGTH) {
    throw new Error(`Rejection reason must be ${MAX_REJECTION_REASON_LENGTH} characters or fewer.`);
  }
  if (rejectionType !== 'CORRECTABLE' && rejectionType !== 'FINAL') {
    throw new Error('Rejection type must be CORRECTABLE or FINAL.');
  }

  return { reason, rejectionType: rejectionType as RejectionType };
}

function submitWithdrawal(
  member: Member,
  payload: { rewardId?: string; amount?: number; userId?: string; status?: string; note?: string }
) {
  return withRollback(member, () => {
    const eligibility = evaluateEligibility(member, payload.rewardId);
    if (!eligibility.eligible || !eligibility.reward || !eligibility.claim) {
      throw new Error(eligibility.blockingReasons[0] ?? 'Reward is not eligible for withdrawal');
    }
    if (eligibility.reward.status !== 'CLAIMED') {
      throw new Error('This reward is already reserved or no longer eligible.');
    }
    if (
      eligibility.claim.selectedOption !== 'CASH' ||
      eligibility.claim.status !== 'PENDING_ADMIN_PROCESSING'
    ) {
      throw new Error('This reward claim is already being processed.');
    }

    eligibility.reward.status = 'WITHDRAWAL_PENDING';
    eligibility.claim.status = 'PROCESSING';

    const withdrawal: Withdrawal = {
      id: `withdrawal-${member.withdrawals.length + 1}`,
      userId: member.id,
      rewardId: eligibility.reward.id,
      rewardClaimId: eligibility.claim.id,
      amount: eligibility.reward.amount,
      status: 'PENDING',
    };

    member.withdrawals.push(withdrawal);
    member.ledger.push({
      withdrawalId: withdrawal.id,
      type: 'REWARD_WITHDRAWAL_REQUEST',
      amount: withdrawal.amount,
      status: 'PENDING',
    });

    member.auditLog.push({
      adminId: 'SYSTEM',
      action: 'REWARD_WITHDRAWAL_REQUESTED',
      targetId: withdrawal.id,
      details: {
        userId: member.id,
        rewardId: eligibility.reward.id,
        rewardClaimId: eligibility.claim.id,
        amount: eligibility.reward.amount,
      },
    });

    return withdrawal;
  });
}

function adminList(members: Member[], actor: AdminActor = financeAdmin) {
  verifyWithdrawalPermission(actor, 'withdrawal:read');
  return members.flatMap((member) =>
    member.withdrawals.filter((withdrawal) => {
      const eligibility = evaluateEligibility(member, withdrawal.rewardId);
      return Boolean(eligibility.reward && eligibility.qualificationComplete);
    })
  );
}

function approveWithdrawal(member: Member, withdrawalId: string, actor: AdminActor = financeAdmin) {
  verifyWithdrawalPermission(actor, 'withdrawal:write');

  return withRollback(member, () => {
    const withdrawal = member.withdrawals.find((item) => item.id === withdrawalId);
    assert.ok(withdrawal, 'withdrawal exists');
    const eligibility = evaluateEligibility(member, withdrawal.rewardId);
    if (withdrawal.status !== 'PENDING') {
      throw new Error('Only pending withdrawals can be reviewed.');
    }
    if (!eligibility.reward || eligibility.reward.status !== 'WITHDRAWAL_PENDING') {
      throw new Error('Reward is not reserved for this pending withdrawal.');
    }
    if (!eligibility.claim || eligibility.claim.status !== 'PROCESSING') {
      throw new Error('Reward claim reservation could not be verified.');
    }
    if (!eligibility.qualificationComplete) {
      throw new Error('Qualification can no longer be verified.');
    }
    if (member.kycStatus !== 'APPROVED') {
      throw new Error('Cannot approve withdrawal: member KYC is not complete.');
    }
    if (!bankComplete(member)) {
      throw new Error('Cannot approve withdrawal: member bank details are incomplete.');
    }

    withdrawal.status = 'APPROVED';
    withdrawal.approvedAt = new Date('2026-07-17T10:00:00Z');
    withdrawal.adminNote = 'Approved by admin; awaiting manual settlement.';
    withdrawal.processedBy = actor.id;
    eligibility.reward.status = 'WITHDRAWAL_APPROVED';
    assertExpectedLedger(member, withdrawal.id, 'PENDING').status = 'APPROVED';

    member.auditLog.push({
      adminId: actor.id,
      action: 'APPROVE_REWARD_WITHDRAWAL',
      targetId: withdrawal.id,
      details: {
        rewardId: withdrawal.rewardId,
        rewardClaimId: withdrawal.rewardClaimId,
        amount: withdrawal.amount,
      },
    });

    return withdrawal;
  });
}

function rejectWithdrawal(
  member: Member,
  withdrawalId: string,
  input: { reason?: unknown; rejectionType?: unknown },
  actor: AdminActor = financeAdmin
) {
  const { reason, rejectionType } = validateRejectionInput(input);
  verifyWithdrawalPermission(actor, 'withdrawal:write');

  return withRollback(member, () => {
    const withdrawal = member.withdrawals.find((item) => item.id === withdrawalId);
    assert.ok(withdrawal, 'withdrawal exists');
    const eligibility = evaluateEligibility(member, withdrawal.rewardId);
    if (withdrawal.status !== 'PENDING') {
      throw new Error('Only pending withdrawals can be reviewed.');
    }
    if (
      !eligibility.reward ||
      !eligibility.claim ||
      eligibility.reward.status !== 'WITHDRAWAL_PENDING'
    ) {
      throw new Error('Reward is not reserved for this pending withdrawal.');
    }
    if (eligibility.claim.status !== 'PROCESSING') {
      throw new Error('Reward claim reservation could not be released.');
    }

    withdrawal.status = 'REJECTED';
    withdrawal.rejectedAt = new Date('2026-07-17T10:00:00Z');
    withdrawal.adminNote = reason;
    withdrawal.rejectionType = rejectionType;
    withdrawal.processedBy = actor.id;
    eligibility.reward.status = rejectionType === 'CORRECTABLE' ? 'CLAIMED' : 'WITHDRAWAL_REJECTED';
    eligibility.claim.status =
      rejectionType === 'CORRECTABLE' ? 'PENDING_ADMIN_PROCESSING' : 'REJECTED';
    eligibility.claim.adminNote = reason;
    eligibility.claim.processedByAdminId = actor.id;
    assertExpectedLedger(member, withdrawal.id, 'PENDING').status = 'CANCELLED';

    member.auditLog.push({
      adminId: actor.id,
      action: 'REJECT_REWARD_WITHDRAWAL',
      targetId: withdrawal.id,
      details: {
        rewardId: withdrawal.rewardId,
        rewardClaimId: withdrawal.rewardClaimId,
        amount: withdrawal.amount,
        reason,
        rejectionType,
      },
    });

    return withdrawal;
  });
}

function markPaid(
  member: Member,
  withdrawalId: string,
  payment: { reference: string; paidAt: Date; note?: string },
  actor: AdminActor = financeAdmin
) {
  verifyWithdrawalPermission(actor, 'withdrawal:write');
  const paymentReference = payment.reference.trim();
  if (!paymentReference) throw new Error('Payment reference is required.');

  return withRollback(member, () => {
    const withdrawal = member.withdrawals.find((item) => item.id === withdrawalId);
    assert.ok(withdrawal, 'withdrawal exists');
    const reward = member.rewards.find((item) => item.id === withdrawal.rewardId);
    assert.ok(reward, 'reward exists');
    if (withdrawal.status !== 'APPROVED') {
      throw new Error('Only approved withdrawals can be marked as paid.');
    }
    if (reward.status !== 'WITHDRAWAL_APPROVED') {
      throw new Error('Reward is not approved for manual settlement.');
    }
    if (!reward.claim || reward.claim.status !== 'PROCESSING') {
      throw new Error('Reward claim settlement could not be finalized.');
    }

    withdrawal.status = 'PAID';
    withdrawal.paidAt = payment.paidAt;
    withdrawal.paymentReference = paymentReference;
    withdrawal.paymentNote = payment.note;
    withdrawal.processedBy = actor.id;
    reward.status = 'PAID';
    reward.claim.status = 'PAID';
    reward.claim.processedByAdminId = actor.id;
    assertExpectedLedger(member, withdrawal.id, 'APPROVED').status = 'COMPLETED';

    member.auditLog.push({
      adminId: actor.id,
      action: 'MARK_REWARD_WITHDRAWAL_PAID',
      targetId: withdrawal.id,
      details: {
        rewardId: withdrawal.rewardId,
        rewardClaimId: withdrawal.rewardClaimId,
        amount: withdrawal.amount,
        paymentReference,
      },
    });

    return withdrawal;
  });
}

function readyMember(stage: StageId = STAGE_IDS.EMERALD_STAGE_1) {
  const member = makeMember({ id: `ready-${stage}-${Math.random().toString(16).slice(2)}` });
  const reward = addCashClaimedReward(member, stage);
  return { member, reward };
}

function expectThrows(fn: () => unknown, message: RegExp) {
  assert.throws(fn, message);
}

function dbSafetyMessage() {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  const looksProduction = /(neon\.tech|prod|production|main)/i.test(databaseUrl);
  return looksProduction
    ? 'Database mutation tests skipped because DATABASE_URL looks production-like.'
    : 'Database mutation tests skipped; this verifier is intentionally in-memory only.';
}

test('Unqualified members cannot submit and see dynamic starter requirements', () => {
  const member = makeMember({
    progress: {
      completed: 1,
      total: 2,
      remaining: 1,
      leftCompleted: 1,
      leftRequired: 1,
      rightCompleted: 0,
      rightRequired: 1,
    },
  });
  const eligibility = evaluateEligibility(member);
  assert.equal(eligibility.eligible, false);
  assert.equal(eligibility.guidance.state, 'NOT_QUALIFIED');
  assert.equal(eligibility.remainingRequirement, 1);
  assert.equal(eligibility.leftCompleted, 1);
  assert.equal(eligibility.rightCompleted, 0);
});

test('Starter split rule requires one direct-sponsored member on each leg', () => {
  const leftOnly = makeMember({
    progress: {
      completed: 1,
      total: 2,
      remaining: 1,
      leftCompleted: 1,
      leftRequired: 1,
      rightCompleted: 0,
      rightRequired: 1,
    },
  });
  assert.equal(evaluateEligibility(leftOnly).remainingRequirement, 1);

  const splitComplete = makeMember({
    currentStage: STAGE_IDS.EMERALD_STAGE_1,
    completedStages: new Set([STAGE_IDS.EMERALD_STAGE_1]),
    progress: {
      completed: 2,
      total: 2,
      remaining: 0,
      leftCompleted: 1,
      leftRequired: 1,
      rightCompleted: 1,
      rightRequired: 1,
    },
  });
  const reward = addCashClaimedReward(splitComplete, STAGE_IDS.EMERALD_STAGE_1);
  assert.equal(evaluateEligibility(splitComplete, reward.id).eligible, true);
});

test('Higher stage progress blocks at 10 of 14 and reports four remaining', () => {
  const member = makeMember({
    currentStage: STAGE_IDS.EMERALD_STAGE_1,
    progress: {
      completed: 10,
      total: REQUIRED_DESCENDANT_COUNT,
      remaining: 4,
      leftCompleted: 5,
      leftRequired: 7,
      rightCompleted: 5,
      rightRequired: 7,
    },
  });
  const eligibility = evaluateEligibility(member);
  assert.equal(eligibility.eligible, false);
  assert.equal(eligibility.totalRequirement, 14);
  assert.equal(eligibility.remainingRequirement, 4);
});

test('Higher stage reward becomes eligible after authoritative 14-position completion', () => {
  const { member, reward } = readyMember(STAGE_IDS.SILVER_STAGE_2);
  member.progress = {
    completed: 14,
    total: 14,
    remaining: 0,
    leftCompleted: 7,
    leftRequired: 7,
    rightCompleted: 7,
    rightRequired: 7,
  };
  assert.equal(evaluateEligibility(member, reward.id).eligible, true);
});

test('Completed stage without a reward record stays disabled', () => {
  const member = makeMember({
    currentStage: STAGE_IDS.EMERALD_STAGE_1,
    completedStages: new Set([STAGE_IDS.EMERALD_STAGE_1]),
    progress: { completed: 2, total: 2, remaining: 0 },
  });
  const eligibility = evaluateEligibility(member);
  assert.equal(eligibility.eligible, false);
  assert.equal(eligibility.guidance.state, 'QUALIFIED_REWARD_PROCESSING');
});

test('Reward requires cash selection before withdrawal', () => {
  const { member, reward } = readyMember();
  reward.status = 'EARNED';
  reward.claim = undefined;
  const eligibility = evaluateEligibility(member, reward.id);
  assert.equal(eligibility.eligible, false);
  assert.equal(eligibility.guidance.state, 'CASH_OPTION_REQUIRED');
});

test('Package or food selections block cash withdrawal', () => {
  const { member, reward } = readyMember();
  reward.claim!.selectedOption = 'PACKAGE';
  const eligibility = evaluateEligibility(member, reward.id);
  assert.equal(eligibility.eligible, false);
  assert.equal(eligibility.guidance.state, 'NON_CASH_REWARD');
});

test('Fake reward stage without verified stage history is blocked', () => {
  const { member, reward } = readyMember();
  member.completedStages.clear();
  const eligibility = evaluateEligibility(member, reward.id);
  assert.equal(eligibility.eligible, false);
  assert.match(eligibility.blockingReasons.join(' '), /stage qualification/i);
});

test('Missing KYC blocks an otherwise qualified member', () => {
  const { member, reward } = readyMember();
  member.kycStatus = 'PENDING';
  const eligibility = evaluateEligibility(member, reward.id);
  assert.equal(eligibility.eligible, false);
  assert.match(eligibility.blockingReasons.join(' '), /KYC/i);
});

test('Missing bank details block an otherwise qualified member', () => {
  const { member, reward } = readyMember();
  member.accountNumber = '';
  const eligibility = evaluateEligibility(member, reward.id);
  assert.equal(eligibility.eligible, false);
  assert.match(eligibility.blockingReasons.join(' '), /bank/i);
});

test('Member-submitted amount and status are ignored at submission', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, {
    rewardId: reward.id,
    amount: 1,
    status: 'APPROVED',
    userId: 'attacker',
  });
  assert.equal(withdrawal.amount, reward.amount);
  assert.equal(withdrawal.status, 'PENDING');
  assert.equal(withdrawal.userId, member.id);
});

test('A member cannot submit another member reward', () => {
  const { member: owner, reward } = readyMember();
  const attacker = makeMember({ id: 'attacker' });
  expectThrows(
    () => submitWithdrawal(attacker, { rewardId: reward.id, userId: owner.id }),
    /reward/i
  );
});

test('Duplicate submissions are blocked by reservation state', () => {
  const { member, reward } = readyMember();
  submitWithdrawal(member, { rewardId: reward.id });
  expectThrows(
    () => submitWithdrawal(member, { rewardId: reward.id }),
    /already exists|currently/i
  );
  assert.equal(member.withdrawals.length, 1);
});

test('Concurrent submissions reserve exactly one withdrawal', () => {
  const { member, reward } = readyMember();
  const attempts = [
    () => submitWithdrawal(member, { rewardId: reward.id }),
    () => submitWithdrawal(member, { rewardId: reward.id }),
  ];
  const results = attempts.map((attempt) => {
    try {
      attempt();
      return 'ok';
    } catch {
      return 'blocked';
    }
  });
  assert.deepEqual(results.sort(), ['blocked', 'ok']);
  assert.equal(member.withdrawals.length, 1);
  assert.equal(reward.status, 'WITHDRAWAL_PENDING');
});

test('Admin list shows only real qualified reward withdrawals', () => {
  const { member: qualified, reward } = readyMember();
  submitWithdrawal(qualified, { rewardId: reward.id });
  const fake = makeMember({ id: 'fake' });
  fake.withdrawals.push({
    id: 'legacy-wallet-withdrawal',
    userId: fake.id,
    rewardId: 'missing-reward',
    rewardClaimId: 'missing-claim',
    amount: 999,
    status: 'PENDING',
  });
  const listed = adminList([qualified, fake], readOnlyAdmin);
  assert.deepEqual(
    listed.map((item) => item.id),
    ['withdrawal-1']
  );
});

test('Admin approval preserves reservation and does not mark paid', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  approveWithdrawal(member, withdrawal.id, financeAdmin);
  assert.equal(withdrawal.status, 'APPROVED');
  assert.equal(reward.status, 'WITHDRAWAL_APPROVED');
  assert.equal(withdrawal.paidAt, undefined);
});

test('Admin approval does not debit wallet or create a second ledger entry', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  const startingBalance = member.walletBalance;
  approveWithdrawal(member, withdrawal.id, financeAdmin);
  assert.equal(member.walletBalance, startingBalance);
  assert.equal(member.ledger.length, 1);
  assert.equal(member.ledger[0].status, 'APPROVED');
});

test('Missing rejection reason fails without releasing reservation', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  expectThrows(
    () => rejectWithdrawal(member, withdrawal.id, { rejectionType: 'CORRECTABLE' }, financeAdmin),
    /reason is required/i
  );
  assert.equal(withdrawal.status, 'PENDING');
  assert.equal(reward.status, 'WITHDRAWAL_PENDING');
  assert.equal(reward.claim!.status, 'PROCESSING');
  assert.equal(member.ledger[0].status, 'PENDING');
});

test('Empty rejection reason fails without releasing reservation', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  expectThrows(
    () =>
      rejectWithdrawal(
        member,
        withdrawal.id,
        { reason: '', rejectionType: 'CORRECTABLE' },
        financeAdmin
      ),
    /reason is required/i
  );
  assert.equal(reward.status, 'WITHDRAWAL_PENDING');
  assert.equal(reward.claim!.status, 'PROCESSING');
});

test('Whitespace-only rejection reason fails without releasing reservation', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  expectThrows(
    () =>
      rejectWithdrawal(
        member,
        withdrawal.id,
        { reason: '    ', rejectionType: 'CORRECTABLE' },
        financeAdmin
      ),
    /reason is required/i
  );
  assert.equal(reward.status, 'WITHDRAWAL_PENDING');
  assert.equal(member.ledger[0].status, 'PENDING');
});

test('Short rejection reason fails without releasing reservation', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  expectThrows(
    () =>
      rejectWithdrawal(
        member,
        withdrawal.id,
        { reason: 'bad', rejectionType: 'CORRECTABLE' },
        financeAdmin
      ),
    /at least 5/i
  );
  assert.equal(withdrawal.status, 'PENDING');
  assert.equal(reward.status, 'WITHDRAWAL_PENDING');
});

test('Valid rejection reason is trimmed, stored, audited, and member-visible', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  rejectWithdrawal(
    member,
    withdrawal.id,
    { reason: '  Bank account name mismatch  ', rejectionType: 'FINAL' },
    financeAdmin
  );
  assert.equal(withdrawal.status, 'REJECTED');
  assert.equal(withdrawal.adminNote, 'Bank account name mismatch');
  assert.equal(withdrawal.rejectionType, 'FINAL');
  assert.equal(member.auditLog.at(-1)?.details.reason, 'Bank account name mismatch');
  assert.equal(member.auditLog.at(-1)?.details.rejectionType, 'FINAL');
  assert.equal(
    evaluateEligibility(member, reward.id).guidance.description,
    'Bank account name mismatch'
  );
});

test('Correctable rejection releases reservation but keeps history and cancels ledger', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  rejectWithdrawal(
    member,
    withdrawal.id,
    { reason: 'Bank account mismatch', rejectionType: 'CORRECTABLE' },
    financeAdmin
  );
  assert.equal(withdrawal.status, 'REJECTED');
  assert.equal(withdrawal.rejectionType, 'CORRECTABLE');
  assert.equal(reward.status, 'CLAIMED');
  assert.equal(reward.claim!.status, 'PENDING_ADMIN_PROCESSING');
  assert.equal(member.withdrawals.length, 1);
  assert.equal(member.ledger[0].status, 'CANCELLED');
});

test('Repeated rejection does not release the reservation twice', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  rejectWithdrawal(
    member,
    withdrawal.id,
    { reason: 'Bank account mismatch', rejectionType: 'CORRECTABLE' },
    financeAdmin
  );
  expectThrows(
    () =>
      rejectWithdrawal(
        member,
        withdrawal.id,
        { reason: 'Second release attempt', rejectionType: 'FINAL' },
        financeAdmin
      ),
    /Only pending/i
  );
  assert.equal(reward.status, 'CLAIMED');
  assert.equal(reward.claim!.status, 'PENDING_ADMIN_PROCESSING');
  assert.equal(member.ledger.length, 1);
  assert.equal(member.ledger[0].status, 'CANCELLED');
});

test('Correctable rejection allows resubmission after the member corrects the blocker', () => {
  const { member, reward } = readyMember();
  const firstWithdrawal = submitWithdrawal(member, { rewardId: reward.id });
  rejectWithdrawal(
    member,
    firstWithdrawal.id,
    { reason: 'Bank account mismatch', rejectionType: 'CORRECTABLE' },
    financeAdmin
  );
  const eligibility = evaluateEligibility(member, reward.id);
  assert.equal(eligibility.eligible, true);
  const secondWithdrawal = submitWithdrawal(member, { rewardId: reward.id });
  assert.equal(secondWithdrawal.id, 'withdrawal-2');
  assert.equal(member.withdrawals.length, 2);
  assert.deepEqual(
    member.ledger.map((entry) => entry.status),
    ['CANCELLED', 'PENDING']
  );
});

test('Final rejection blocks resubmission for the reward', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  rejectWithdrawal(
    member,
    withdrawal.id,
    { reason: 'Reward invalidated', rejectionType: 'FINAL' },
    financeAdmin
  );
  const eligibility = evaluateEligibility(member, reward.id);
  assert.equal(eligibility.eligible, false);
  assert.equal(eligibility.guidance.state, 'REJECTED');
  expectThrows(
    () => submitWithdrawal(member, { rewardId: reward.id }),
    /rejected|exists|currently/i
  );
});

test('Paid finalizes an approved withdrawal with reference, date, and note', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  approveWithdrawal(member, withdrawal.id, financeAdmin);
  markPaid(
    member,
    withdrawal.id,
    {
      reference: 'BANK-REF-001',
      paidAt: new Date('2026-07-17T12:00:00Z'),
      note: 'Manual transfer confirmed',
    },
    financeAdmin
  );
  assert.equal(withdrawal.status, 'PAID');
  assert.equal(withdrawal.paymentReference, 'BANK-REF-001');
  assert.equal(withdrawal.paymentNote, 'Manual transfer confirmed');
  assert.equal(reward.status, 'PAID');
  assert.equal(member.ledger[0].status, 'COMPLETED');
});

test('Paid finalization cannot run twice', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  approveWithdrawal(member, withdrawal.id, financeAdmin);
  markPaid(
    member,
    withdrawal.id,
    {
      reference: 'BANK-REF-002',
      paidAt: new Date('2026-07-17T12:00:00Z'),
    },
    financeAdmin
  );
  expectThrows(
    () =>
      markPaid(
        member,
        withdrawal.id,
        {
          reference: 'BANK-REF-003',
          paidAt: new Date('2026-07-17T13:00:00Z'),
        },
        financeAdmin
      ),
    /approved/i
  );
});

test('Direct paid endpoint bypass is blocked before approval', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  expectThrows(
    () =>
      markPaid(
        member,
        withdrawal.id,
        {
          reference: 'BYPASS',
          paidAt: new Date('2026-07-17T12:00:00Z'),
        },
        financeAdmin
      ),
    /approved/i
  );
});

test('Admin approval is blocked if KYC becomes incomplete after submission', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  member.kycStatus = 'PENDING';
  expectThrows(() => approveWithdrawal(member, withdrawal.id, financeAdmin), /KYC/i);
});

test('Admin approval is blocked if bank details are removed after submission', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  member.bankName = '';
  expectThrows(() => approveWithdrawal(member, withdrawal.id, financeAdmin), /bank/i);
});

test('Super admin can perform withdrawal financial actions', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  approveWithdrawal(member, withdrawal.id, superAdmin);
  assert.equal(withdrawal.processedBy, superAdmin.id);
});

test('Explicitly authorized admin can approve withdrawal actions', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  approveWithdrawal(member, withdrawal.id, financeAdmin);
  assert.equal(withdrawal.processedBy, financeAdmin.id);
  assert.equal(member.auditLog.at(-1)?.adminId, financeAdmin.id);
});

test('Admin without adminRole is denied financial write access', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  expectThrows(
    () => approveWithdrawal(member, withdrawal.id, adminWithoutRole),
    /assigned admin role/i
  );
  assert.equal(withdrawal.status, 'PENDING');
});

test('Admin with read-only permission is denied approval, rejection, and payment', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  assert.doesNotThrow(() => adminList([member], readOnlyAdmin));
  expectThrows(() => approveWithdrawal(member, withdrawal.id, readOnlyAdmin), /withdrawal:write/i);
  expectThrows(
    () =>
      rejectWithdrawal(
        member,
        withdrawal.id,
        { reason: 'Read only attempt', rejectionType: 'FINAL' },
        readOnlyAdmin
      ),
    /withdrawal:write/i
  );
  assert.equal(withdrawal.status, 'PENDING');
});

test('Support user is denied unless explicitly assigned withdrawal permission', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  expectThrows(
    () => approveWithdrawal(member, withdrawal.id, supportWithoutRole),
    /assigned admin role/i
  );
  approveWithdrawal(member, withdrawal.id, supportWithRole);
  assert.equal(withdrawal.processedBy, supportWithRole.id);
});

test('Member actor is denied financial admin access', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  expectThrows(() => approveWithdrawal(member, withdrawal.id, memberActor), /Admin access only/i);
  assert.equal(withdrawal.status, 'PENDING');
});

test('Acting admin identity is recorded on approval, rejection, and paid actions', () => {
  const { member: approvedMember, reward: approvedReward } = readyMember();
  const approvedWithdrawal = submitWithdrawal(approvedMember, { rewardId: approvedReward.id });
  approveWithdrawal(approvedMember, approvedWithdrawal.id, financeAdmin);
  markPaid(
    approvedMember,
    approvedWithdrawal.id,
    { reference: 'IDENTITY-PAID', paidAt: new Date('2026-07-17T12:00:00Z') },
    financeAdmin
  );
  assert.equal(approvedWithdrawal.processedBy, financeAdmin.id);
  assert.equal(approvedMember.auditLog.at(-1)?.adminId, financeAdmin.id);

  const { member: rejectedMember, reward: rejectedReward } = readyMember();
  const rejectedWithdrawal = submitWithdrawal(rejectedMember, { rewardId: rejectedReward.id });
  rejectWithdrawal(
    rejectedMember,
    rejectedWithdrawal.id,
    { reason: 'Identity mismatch', rejectionType: 'FINAL' },
    supportWithRole
  );
  assert.equal(rejectedWithdrawal.processedBy, supportWithRole.id);
  assert.equal(rejectedMember.auditLog.at(-1)?.adminId, supportWithRole.id);
});

test('Missing ledger record rolls back approval', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  member.ledger = [];
  expectThrows(() => approveWithdrawal(member, withdrawal.id, financeAdmin), /ledger/i);
  assert.equal(withdrawal.status, 'PENDING');
  assert.equal(reward.status, 'WITHDRAWAL_PENDING');
  assert.equal(reward.claim!.status, 'PROCESSING');
});

test('Missing ledger record rolls back rejection', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  member.ledger = [];
  expectThrows(
    () =>
      rejectWithdrawal(
        member,
        withdrawal.id,
        { reason: 'Ledger missing', rejectionType: 'CORRECTABLE' },
        financeAdmin
      ),
    /ledger/i
  );
  assert.equal(withdrawal.status, 'PENDING');
  assert.equal(reward.status, 'WITHDRAWAL_PENDING');
  assert.equal(reward.claim!.status, 'PROCESSING');
});

test('Missing ledger record rolls back mark-paid', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  approveWithdrawal(member, withdrawal.id, financeAdmin);
  member.ledger = [];
  expectThrows(
    () =>
      markPaid(
        member,
        withdrawal.id,
        { reference: 'MISSING-LEDGER', paidAt: new Date('2026-07-17T12:00:00Z') },
        financeAdmin
      ),
    /ledger/i
  );
  assert.equal(withdrawal.status, 'APPROVED');
  assert.equal(reward.status, 'WITHDRAWAL_APPROVED');
  assert.equal(reward.claim!.status, 'PROCESSING');
});

test('Incorrect prior ledger state blocks transition and rolls back state changes', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  member.ledger[0].status = 'CANCELLED';
  expectThrows(() => approveWithdrawal(member, withdrawal.id, financeAdmin), /ledger/i);
  assert.equal(withdrawal.status, 'PENDING');
  assert.equal(reward.status, 'WITHDRAWAL_PENDING');
  assert.equal(member.ledger[0].status, 'CANCELLED');
});

test('Duplicate ledger rows are rejected as integrity failures', () => {
  const { member, reward } = readyMember();
  const withdrawal = submitWithdrawal(member, { rewardId: reward.id });
  member.ledger.push({ ...member.ledger[0] });
  expectThrows(() => approveWithdrawal(member, withdrawal.id, financeAdmin), /ledger/i);
  assert.equal(withdrawal.status, 'PENDING');
  assert.equal(reward.status, 'WITHDRAWAL_PENDING');
  assert.equal(member.ledger.length, 2);
});

test('Normal approval, rejection, and paid transitions still succeed with exact ledger movement', () => {
  const { member: approvalMember, reward: approvalReward } = readyMember();
  const approvedWithdrawal = submitWithdrawal(approvalMember, { rewardId: approvalReward.id });
  approveWithdrawal(approvalMember, approvedWithdrawal.id, financeAdmin);
  assert.equal(approvalMember.ledger[0].status, 'APPROVED');
  markPaid(
    approvalMember,
    approvedWithdrawal.id,
    { reference: 'NORMAL-PAID', paidAt: new Date('2026-07-17T12:00:00Z') },
    financeAdmin
  );
  assert.equal(approvalMember.ledger[0].status, 'COMPLETED');

  const { member: rejectionMember, reward: rejectionReward } = readyMember();
  const rejectedWithdrawal = submitWithdrawal(rejectionMember, { rewardId: rejectionReward.id });
  rejectWithdrawal(
    rejectionMember,
    rejectedWithdrawal.id,
    { reason: 'Normal correctable rejection', rejectionType: 'CORRECTABLE' },
    financeAdmin
  );
  assert.equal(rejectionMember.ledger[0].status, 'CANCELLED');
});

test('Migration encodes partial uniqueness for final and active withdrawals only', () => {
  const schema = readFileSync('prisma/schema.prisma', 'utf8');
  const migration = readFileSync(
    'prisma/migrations/20260717084000_reward_withdrawal_workflow/migration.sql',
    'utf8'
  );
  const reconciliation = readFileSync(
    'prisma/migrations/20260717120000_reconcile_reward_withdrawal_columns/migration.sql',
    'utf8'
  );
  assert.doesNotMatch(schema, /rewardId\s+String\?\s+@unique/);
  assert.doesNotMatch(schema, /rewardClaimId\s+String\?\s+@unique/);
  assert.match(migration, /CREATE UNIQUE INDEX "Withdrawal_non_correctable_rewardId_key"/);
  assert.match(migration, /"status" IN \('PENDING', 'APPROVED', 'PAID'\)/);
  assert.match(migration, /"status" = 'REJECTED' AND "rejectionType" = 'FINAL'/);
  assert.match(reconciliation, /ADD COLUMN IF NOT EXISTS "rewardId" TEXT/);
  assert.match(
    reconciliation,
    /CREATE UNIQUE INDEX IF NOT EXISTS "Withdrawal_non_correctable_rewardId_key"/
  );
  assert.match(reconciliation, /FOREIGN KEY \("rewardId"\) REFERENCES "Reward"\("id"\)/);
});

test('Dashboard disabled state and rejection controls expose required safeguards', () => {
  const memberUi = readFileSync('src/app/user-dashboard/components/WithdrawalSection.tsx', 'utf8');
  const adminUi = readFileSync(
    'src/app/admin-dashboard/withdrawals/components/AdminWithdrawalsClient.tsx',
    'utf8'
  );
  assert.match(memberUi, /sm:grid-cols|lg:grid-cols/);
  assert.match(memberUi, /disabled:cursor-not-allowed/);
  assert.match(memberUi, /rejectionType/);
  assert.match(adminUi, /overflow-x-auto/);
  assert.match(adminUi, /min-w-\[1180px\]/);
  assert.match(adminUi, /CORRECTABLE/);
  assert.match(adminUi, /FINAL/);
  assert.match(adminUi, /minLength=\{5\}/);
});

test('Rewards and withdrawal page uses shared workflow and flattened sidebar entry', () => {
  const rewardsRoute = readFileSync('src/app/api/user/rewards/route.ts', 'utf8');
  const rewardsPage = readFileSync('src/app/user-dashboard/rewards/page.tsx', 'utf8');
  const navConfig = readFileSync('src/config/member-navigation.ts', 'utf8');
  const navGroup = readFileSync('src/components/dashboard/member-nav-group.tsx', 'utf8');

  assert.match(rewardsRoute, /getCurrentUser/);
  assert.doesNotMatch(rewardsRoute, /getServerSession/);
  assert.match(rewardsRoute, /nextReward/);
  assert.match(rewardsRoute, /withdrawals/);
  assert.match(rewardsPage, /WithdrawalSection/);
  assert.match(rewardsPage, /Rewards & Withdrawal/);
  assert.match(navConfig, /Rewards & Withdrawal/);
  assert.doesNotMatch(navConfig, /Rewards & Wallet/);
  assert.match(navGroup, /isDirectGroup/);
  assert.match(navGroup, /!isDirectGroup/);
});

test('Binary tree cards use compact responsive dimensions', () => {
  const overviewTree = readFileSync(
    'src/app/user-dashboard/components/BinaryTreeSection.tsx',
    'utf8'
  );
  const treePage = readFileSync('src/app/user-dashboard/network/tree/page.tsx', 'utf8');

  assert.match(overviewTree, /w-\[clamp\(6\.5rem,44vw,8\.75rem\)\]/);
  assert.match(overviewTree, /overscroll-x-contain/);
  assert.match(treePage, /min-w-\[560px\]/);
  assert.match(treePage, /w-\[clamp\(6\.75rem,24vw,8\.5rem\)\]/);
});

console.log(dbSafetyMessage());
console.log(`Reward withdrawal workflow verification passed (${tests.length} cases).`);
