import { Prisma, PrismaClient } from '@prisma/client';
import {
  QUALIFICATION_RULE_VERSION,
  STAGE_CONFIG,
  STAGE_IDS,
  STAGE_ORDER,
  STAGE_RANK,
  StageId,
  ATTAINED_STAGE_TO_LEGACY_COMPLETED_STAGE,
  getHighestStage,
  getNextStage,
  getStageDisplayName,
  isStageAtLeast,
  normalizeStageId,
} from './constants';

type TxClient =
  | Prisma.TransactionClient
  | PrismaClient
  | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

interface ContributorCandidate {
  memberId: string;
  contributorStage: StageId;
  genealogyDepth: number;
  contributorQualifiedAt: Date;
  registeredAt: Date;
}

export interface QualificationProgressResult {
  targetStage: StageId | null;
  requirementStage: StageId | null;
  qualifiedContributorCount: number;
  requiredContributorCount: number;
  remainingContributorCount: number;
  leftQualifiedCount?: number;
  rightQualifiedCount?: number;
  selectedContributors: ContributorCandidate[];
}

interface PromotionResult {
  stage: StageId;
  calculationId: string;
}

function createCalculationId(memberId: string, stage: StageId, now: Date): string {
  return `${QUALIFICATION_RULE_VERSION}:${memberId}:${stage}:${now.getTime()}`;
}

function isEligibleMember(user: { role?: string | null; status?: string | null }): boolean {
  return user.role === 'MEMBER' && user.status === 'ACTIVE';
}

function inferContributorQualifiedAt(
  contributor: { createdAt: Date; stageUpdatedAt?: Date | null },
  requiredStage: StageId
): Date {
  if (requiredStage === STAGE_IDS.REGISTERED_ACTIVE) {
    return contributor.createdAt;
  }
  return contributor.stageUpdatedAt ?? contributor.createdAt;
}

export function selectDeterministicContributors(
  candidates: ContributorCandidate[],
  requiredCount: number
): ContributorCandidate[] {
  return [...candidates]
    .sort((a, b) => {
      const qualifiedAtDiff =
        a.contributorQualifiedAt.getTime() - b.contributorQualifiedAt.getTime();
      if (qualifiedAtDiff !== 0) return qualifiedAtDiff;

      const depthDiff = a.genealogyDepth - b.genealogyDepth;
      if (depthDiff !== 0) return depthDiff;

      const registeredAtDiff = a.registeredAt.getTime() - b.registeredAt.getTime();
      if (registeredAtDiff !== 0) return registeredAtDiff;

      return a.memberId.localeCompare(b.memberId);
    })
    .slice(0, requiredCount);
}

export function getAncestorIdsFromBinaryPath(
  path: string | null | undefined,
  userId: string
): string[] {
  if (!path) return [];

  const ids = path.split('/').filter((part) => part && part !== 'root' && part !== userId);

  return ids.reverse();
}

async function recordStageProgress(
  tx: TxClient,
  userId: string,
  progress: QualificationProgressResult,
  status: 'IN_PROGRESS' | 'COMPLETED',
  calculationId: string | null,
  qualifiedAt: Date | null
) {
  if (!progress.targetStage) return;

  const data = {
    status,
    leftQualifiedCount: progress.leftQualifiedCount ?? progress.qualifiedContributorCount,
    rightQualifiedCount: progress.rightQualifiedCount ?? 0,
    qualifiedContributorCount: progress.qualifiedContributorCount,
    requiredContributorCount: progress.requiredContributorCount,
    remainingContributorCount: progress.remainingContributorCount,
    requirementStage: progress.requirementStage,
    calculationId,
    qualifiedAt,
    movedToNextStageAt: qualifiedAt,
  };

  await tx.stageProgress.upsert({
    where: { userId_stage: { userId, stage: progress.targetStage } },
    create: {
      userId,
      stage: progress.targetStage,
      ...data,
    },
    update: data,
  });
}

async function calculateStarterEntryProgress(): Promise<QualificationProgressResult> {
  const targetStage = STAGE_IDS.STARTER_ENTRY_STAGE;
  const config = STAGE_CONFIG[targetStage];

  return {
    targetStage,
    requirementStage: config.requiredContributorStage,
    qualifiedContributorCount: 0,
    requiredContributorCount: config.requiredCount,
    remainingContributorCount: 0,
    selectedContributors: [],
  };
}

function resolveRelativeBinaryLeg(
  rootTree: {
    path: string;
    depth: number;
    leftChildId: string | null;
    rightChildId: string | null;
  },
  memberTree: { path: string | null; depth: number } | null
): 'left' | 'right' | null {
  if (!memberTree?.path || !memberTree.path.startsWith(`${rootTree.path}/`)) {
    return null;
  }

  const [firstDescendantId] = memberTree.path.slice(rootTree.path.length + 1).split('/');
  if (firstDescendantId === rootTree.leftChildId) return 'left';
  if (firstDescendantId === rootTree.rightChildId) return 'right';
  return null;
}

async function calculateStarterCompletionProgress(
  tx: TxClient,
  userId: string
): Promise<QualificationProgressResult> {
  const targetStage = STAGE_IDS.EMERALD_STAGE_1;
  const config = STAGE_CONFIG[targetStage];
  const requiredStage = STAGE_IDS.STARTER_ENTRY_STAGE;

  const rootTree = await tx.binaryTree.findUnique({
    where: { userId },
    select: { path: true, depth: true, leftChildId: true, rightChildId: true },
  });

  if (!rootTree) {
    return {
      targetStage,
      requirementStage: requiredStage,
      qualifiedContributorCount: 0,
      requiredContributorCount: config.requiredCount,
      remainingContributorCount: config.requiredCount,
      leftQualifiedCount: 0,
      rightQualifiedCount: 0,
      selectedContributors: [],
    };
  }

  const sponsoredMembers = await tx.user.findMany({
    where: {
      sponsorId: userId,
      role: 'MEMBER',
      status: 'ACTIVE',
      activationCode: {
        is: {
          status: 'USED',
        },
      },
    },
    select: {
      id: true,
      currentStage: true,
      createdAt: true,
      stageUpdatedAt: true,
      binaryTree: {
        select: { path: true, depth: true },
      },
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });

  const candidatesByLeg: Record<'left' | 'right', ContributorCandidate[]> = {
    left: [],
    right: [],
  };

  for (const member of sponsoredMembers) {
    if (!isStageAtLeast(member.currentStage, requiredStage)) continue;

    const leg = resolveRelativeBinaryLeg(rootTree, member.binaryTree);
    if (!leg || !member.binaryTree) continue;

    candidatesByLeg[leg].push({
      memberId: member.id,
      contributorStage: normalizeStageId(member.currentStage),
      genealogyDepth: member.binaryTree.depth - rootTree.depth,
      contributorQualifiedAt: inferContributorQualifiedAt(member, requiredStage),
      registeredAt: member.createdAt,
    });
  }

  const leftQualifiedCount = Math.min(candidatesByLeg.left.length, 1);
  const rightQualifiedCount = Math.min(candidatesByLeg.right.length, 1);
  const qualifiedContributorCount = leftQualifiedCount + rightQualifiedCount;
  const selectedContributors = [
    ...selectDeterministicContributors(candidatesByLeg.left, 1),
    ...selectDeterministicContributors(candidatesByLeg.right, 1),
  ];

  return {
    targetStage,
    requirementStage: requiredStage,
    qualifiedContributorCount,
    requiredContributorCount: config.requiredCount,
    remainingContributorCount: Math.max(config.requiredCount - qualifiedContributorCount, 0),
    leftQualifiedCount,
    rightQualifiedCount,
    selectedContributors,
  };
}

async function calculateFirstThreeLevelProgress(
  tx: TxClient,
  userId: string,
  targetStage: StageId
): Promise<QualificationProgressResult> {
  const config = STAGE_CONFIG[targetStage];
  const requiredStage = config.requiredContributorStage;

  if (!requiredStage) {
    return {
      targetStage,
      requirementStage: null,
      qualifiedContributorCount: 0,
      requiredContributorCount: 0,
      remainingContributorCount: 0,
      selectedContributors: [],
    };
  }

  const rootTree = await tx.binaryTree.findUnique({
    where: { userId },
    select: { path: true, depth: true, leftChildId: true, rightChildId: true },
  });

  if (!rootTree) {
    return {
      targetStage,
      requirementStage: requiredStage,
      qualifiedContributorCount: 0,
      requiredContributorCount: config.requiredCount,
      remainingContributorCount: config.requiredCount,
      leftQualifiedCount: 0,
      rightQualifiedCount: 0,
      selectedContributors: [],
    };
  }

  const requiredPerLeg = config.requiredCount / 2;
  const candidatesByLeg: Record<'left' | 'right', ContributorCandidate[]> = {
    left: [],
    right: [],
  };
  const countedMemberIds = new Set<string>();
  let frontier: Array<{ userId: string; leg: 'left' | 'right'; depth: number }> = [
    ...(rootTree.leftChildId
      ? [{ userId: rootTree.leftChildId, leg: 'left' as const, depth: 1 }]
      : []),
    ...(rootTree.rightChildId
      ? [{ userId: rootTree.rightChildId, leg: 'right' as const, depth: 1 }]
      : []),
  ];

  for (let level = 1; level <= 3 && frontier.length > 0; level++) {
    const positionByUserId = new Map<string, (typeof frontier)[number]>();
    for (const position of frontier) {
      if (!positionByUserId.has(position.userId)) {
        positionByUserId.set(position.userId, position);
      }
    }
    const nodes = await tx.binaryTree.findMany({
      where: {
        userId: { in: [...positionByUserId.keys()] },
      },
      select: {
        userId: true,
        leftChildId: true,
        rightChildId: true,
        user: {
          select: {
            id: true,
            role: true,
            status: true,
            currentStage: true,
            createdAt: true,
            stageUpdatedAt: true,
            stageHistory: {
              where: { toStage: requiredStage },
              select: { qualifiedAt: true },
              orderBy: { qualifiedAt: 'asc' },
              take: 1,
            },
          },
        },
      },
    });

    const nextFrontier: typeof frontier = [];

    for (const node of nodes) {
      const position = positionByUserId.get(node.userId);
      if (!position) continue;

      if (
        node.user.role === 'MEMBER' &&
        node.user.status === 'ACTIVE' &&
        isStageAtLeast(node.user.currentStage, requiredStage) &&
        !countedMemberIds.has(node.userId)
      ) {
        countedMemberIds.add(node.userId);
        candidatesByLeg[position.leg].push({
          memberId: node.userId,
          contributorStage: normalizeStageId(node.user.currentStage),
          genealogyDepth: position.depth,
          contributorQualifiedAt:
            node.user.stageHistory[0]?.qualifiedAt ??
            inferContributorQualifiedAt(node.user, requiredStage),
          registeredAt: node.user.createdAt,
        });
      }

      if (level < 3) {
        if (node.leftChildId) {
          nextFrontier.push({
            userId: node.leftChildId,
            leg: position.leg,
            depth: position.depth + 1,
          });
        }
        if (node.rightChildId) {
          nextFrontier.push({
            userId: node.rightChildId,
            leg: position.leg,
            depth: position.depth + 1,
          });
        }
      }
    }

    frontier = nextFrontier;
  }

  const leftQualifiedCount = Math.min(candidatesByLeg.left.length, requiredPerLeg);
  const rightQualifiedCount = Math.min(candidatesByLeg.right.length, requiredPerLeg);
  const qualifiedContributorCount = leftQualifiedCount + rightQualifiedCount;
  const selectedContributors = [
    ...selectDeterministicContributors(candidatesByLeg.left, requiredPerLeg),
    ...selectDeterministicContributors(candidatesByLeg.right, requiredPerLeg),
  ];

  return {
    targetStage,
    requirementStage: requiredStage,
    qualifiedContributorCount,
    requiredContributorCount: config.requiredCount,
    remainingContributorCount: Math.max(config.requiredCount - qualifiedContributorCount, 0),
    leftQualifiedCount,
    rightQualifiedCount,
    selectedContributors,
  };
}

export async function calculateQualificationProgress(
  tx: TxClient,
  userId: string,
  targetStage: StageId | null
): Promise<QualificationProgressResult> {
  if (!targetStage) {
    return {
      targetStage: null,
      requirementStage: null,
      qualifiedContributorCount: 0,
      requiredContributorCount: 0,
      remainingContributorCount: 0,
      selectedContributors: [],
    };
  }

  if (targetStage === STAGE_IDS.STARTER_ENTRY_STAGE) {
    return calculateStarterEntryProgress();
  }

  if (targetStage === STAGE_IDS.EMERALD_STAGE_1) {
    return calculateStarterCompletionProgress(tx, userId);
  }

  return calculateFirstThreeLevelProgress(tx, userId, targetStage);
}

async function createStageReward(tx: TxClient, userId: string, stage: StageId) {
  const config = STAGE_CONFIG[stage];
  if (!config.hasReward) return;

  const legacyStage = ATTAINED_STAGE_TO_LEGACY_COMPLETED_STAGE[stage];
  const stageKeys = legacyStage ? [stage, legacyStage] : [stage];
  const existingReward = await tx.reward.findFirst({
    where: { userId, stage: { in: stageKeys } },
    orderBy: { createdAt: 'asc' },
  });

  if (existingReward) {
    if (existingReward.stage !== stage) {
      const newStageReward = await tx.reward.findUnique({
        where: { userId_stage: { userId, stage } },
      });
      if (!newStageReward) {
        await tx.reward.update({
          where: { id: existingReward.id },
          data: {
            stage,
            rewardValue: new Prisma.Decimal(config.rewardValue),
            rewardPackage: config.rewardPackage,
          },
        });
      }
    }
    return;
  }

  await tx.reward.create({
    data: {
      userId,
      stage,
      rewardValue: new Prisma.Decimal(config.rewardValue),
      rewardPackage: config.rewardPackage,
      status: 'EARNED',
    },
  });
}

async function createStageLoan(tx: TxClient, userId: string, stage: StageId) {
  const config = STAGE_CONFIG[stage];
  if (!config.loan) return;

  const principal = new Prisma.Decimal(config.loan.principal);
  const interestRate = new Prisma.Decimal(config.loan.interestRate);
  const interestAmount = principal.mul(interestRate);
  const totalRepayable = principal.plus(interestAmount);

  await tx.stageLoan.upsert({
    where: { userId_stage: { userId, stage } },
    update: {},
    create: {
      userId,
      stage,
      principal,
      interestRate,
      interestAmount,
      totalRepayable,
      outstandingBalance: totalRepayable,
      status: 'ISSUED',
      auditEntries: {
        create: {
          adminId: 'SYSTEM',
          action: 'ISSUED',
          details: `${getStageDisplayName(stage)} repayable loan issued at 1% interest.`,
        },
      },
    },
  });
}

async function promoteMemberToStage(
  tx: TxClient,
  userId: string,
  fromStage: StageId,
  progress: QualificationProgressResult,
  triggerMemberId: string | null
): Promise<PromotionResult | null> {
  if (!progress.targetStage) return null;

  const toStage = progress.targetStage;
  const config = STAGE_CONFIG[toStage];
  const now = new Date();
  const calculationId = createCalculationId(userId, toStage, now);

  const latestUser = await tx.user.findUnique({
    where: { id: userId },
    select: {
      currentStage: true,
      highestStage: true,
      compensationPlanStatus: true,
      finalStageCompletedAt: true,
    },
  });

  if (!latestUser) return null;

  const latestStage = normalizeStageId(latestUser.currentStage);
  if (STAGE_RANK[latestStage] >= STAGE_RANK[toStage]) {
    return null;
  }

  const history = await tx.stageHistory.upsert({
    where: { memberId_toStage: { memberId: userId, toStage } },
    update: {},
    create: {
      memberId: userId,
      fromStage,
      toStage,
      qualifiedAt: now,
      qualificationRuleVersion: QUALIFICATION_RULE_VERSION,
      triggerMemberId,
      calculationId,
    },
  });

  if (progress.selectedContributors.length > 0) {
    await tx.qualificationContributor.createMany({
      data: progress.selectedContributors.map((contributor) => ({
        stageHistoryId: history.id,
        qualifyingMemberId: userId,
        contributorMemberId: contributor.memberId,
        contributorStageAtQualification: contributor.contributorStage,
        genealogyDepth: contributor.genealogyDepth,
        contributorQualifiedAt: contributor.contributorQualifiedAt,
      })),
      skipDuplicates: true,
    });
  }

  const highestStage = getHighestStage(latestUser.highestStage, toStage);
  const completedFinalStage = config.isFinal;

  await tx.user.update({
    where: { id: userId },
    data: {
      currentStage: toStage,
      highestStage,
      stageUpdatedAt: now,
      compensationPlanStatus: completedFinalStage
        ? 'COMPLETED'
        : latestUser.compensationPlanStatus || 'ACTIVE',
      finalStageCompletedAt: completedFinalStage
        ? (latestUser.finalStageCompletedAt ?? now)
        : latestUser.finalStageCompletedAt,
    },
  });

  await recordStageProgress(tx, userId, progress, 'COMPLETED', calculationId, now);
  await createStageReward(tx, userId, toStage);
  await createStageLoan(tx, userId, toStage);

  await tx.auditLog.create({
    data: {
      adminId: 'SYSTEM',
      action: 'STAGE_PROMOTION',
      targetType: 'User',
      targetId: userId,
      details: JSON.stringify({
        fromStage,
        toStage,
        stageName: getStageDisplayName(toStage),
        qualificationRuleVersion: QUALIFICATION_RULE_VERSION,
        calculationId,
        triggerMemberId,
        contributorCount: progress.selectedContributors.length,
      }),
    },
  });

  return { stage: toStage, calculationId };
}

async function evaluateAndPromoteMember(
  tx: TxClient,
  userId: string,
  triggerMemberId: string | null
): Promise<PromotionResult[]> {
  const promoted: PromotionResult[] = [];

  for (let step = 0; step < STAGE_ORDER.length; step++) {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
        currentStage: true,
        compensationPlanStatus: true,
      },
    });

    if (!user || !isEligibleMember(user)) return promoted;

    const currentStage = normalizeStageId(user.currentStage);
    if (
      user.compensationPlanStatus === 'COMPLETED' ||
      currentStage === STAGE_IDS.DIAMOND_STAGE_6_FINAL
    ) {
      return promoted;
    }

    const targetStage = getNextStage(currentStage);
    const progress = await calculateQualificationProgress(tx, userId, targetStage);

    if (!targetStage) return promoted;

    if (progress.qualifiedContributorCount < progress.requiredContributorCount) {
      await recordStageProgress(tx, userId, progress, 'IN_PROGRESS', null, null);
      return promoted;
    }

    const promotion = await promoteMemberToStage(
      tx,
      userId,
      currentStage,
      progress,
      triggerMemberId
    );

    if (!promotion) return promoted;
    promoted.push(promotion);
  }

  return promoted;
}

export async function checkUserQualification(
  tx: TxClient,
  userId: string,
  visited = new Set<string>(),
  triggerMemberId: string | null = null
): Promise<void> {
  const promotedStages = await evaluateAndPromoteMember(tx, userId, triggerMemberId);
  if (promotedStages.length === 0) return;

  const tree = await tx.binaryTree.findUnique({
    where: { userId },
    select: { path: true },
  });

  const ancestors = getAncestorIdsFromBinaryPath(tree?.path, userId);
  for (const ancestorId of ancestors) {
    const visitKey = `ancestor:${ancestorId}`;
    if (visited.has(visitKey)) continue;
    visited.add(visitKey);

    await checkUserQualification(tx, ancestorId, visited, userId);
  }
}
