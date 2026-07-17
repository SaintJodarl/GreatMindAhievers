import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { getSafeApiError } from '@/lib/prisma-errors';
import {
  STAGE_CONFIG,
  STAGE_ORDER,
  STAGE_RANK,
  type StageId,
  getNextStage,
  getRequirementText,
  getStageDisplayName,
  getStageNumberLabel,
  normalizeStageId,
} from '@/lib/qualification/constants';
import { calculateQualificationProgress } from '@/lib/qualification/engine';

type ClaimOption = 'CASH' | 'FOOD' | 'PACKAGE';

type RewardWithDashboardRelations = Prisma.RewardGetPayload<{
  include: {
    claims: {
      include: {
        withdrawals: true;
      };
    };
    withdrawals: true;
  };
}>;

class ApiError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

const CLAIM_OPTIONS = new Set<ClaimOption>(['CASH', 'FOOD', 'PACKAGE']);

function decimalToNumber(value: unknown) {
  if (value == null) return 0;
  return Number(value);
}

function getNextRewardStage(currentStage: StageId, rewardStages: Set<StageId>) {
  if (STAGE_CONFIG[currentStage].hasReward && !rewardStages.has(currentStage)) {
    return currentStage;
  }

  return (
    STAGE_ORDER.find(
      (stage) =>
        STAGE_RANK[stage] > STAGE_RANK[currentStage] &&
        STAGE_CONFIG[stage].hasReward &&
        !rewardStages.has(stage)
    ) ?? null
  );
}

function serializeReward(reward: RewardWithDashboardRelations) {
  const stage = normalizeStageId(reward.stage);
  const latestClaim = reward.claims?.[0] ?? null;
  const withdrawalFromClaim = reward.claims?.flatMap((claim) => claim.withdrawals ?? []) ?? [];
  const latestWithdrawal = reward.withdrawals?.[0] ?? withdrawalFromClaim[0] ?? null;

  return {
    id: reward.id,
    stage,
    stageName: getStageDisplayName(stage),
    stageNumberLabel: getStageNumberLabel(stage),
    rewardValue: decimalToNumber(reward.rewardValue),
    rewardPackage: reward.rewardPackage,
    status: reward.status,
    createdAt: reward.createdAt,
    updatedAt: reward.updatedAt,
    claims: reward.claims ?? [],
    latestClaim,
    latestWithdrawal,
    withdrawalStatus: latestWithdrawal?.status ?? null,
  };
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        currentStage: true,
        highestStage: true,
        stageUpdatedAt: true,
        finalStageCompletedAt: true,
        compensationPlanStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const currentStage = normalizeStageId(user.currentStage);
    const nextStage = getNextStage(currentStage);

    const [rewards, progress, history, loans] = await Promise.all([
      prisma.reward.findMany({
        where: { userId: currentUser.id },
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
      prisma.stageProgress.findMany({
        where: { userId: currentUser.id },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.stageHistory.findMany({
        where: { memberId: currentUser.id },
        include: {
          contributors: {
            include: {
              contributorMember: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  email: true,
                  currentStage: true,
                },
              },
            },
            orderBy: [
              { contributorQualifiedAt: 'asc' },
              { genealogyDepth: 'asc' },
              { contributorMemberId: 'asc' },
            ],
          },
        },
        orderBy: { qualifiedAt: 'asc' },
      }),
      prisma.stageLoan.findMany({
        where: { userId: currentUser.id },
        include: {
          auditEntries: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { issuedAt: 'desc' },
      }),
    ]);

    const rewardStages = new Set(rewards.map((reward) => normalizeStageId(reward.stage)));
    const nextRewardStage = getNextRewardStage(currentStage, rewardStages);
    const nextRewardProgress = nextRewardStage
      ? await calculateQualificationProgress(prisma, currentUser.id, nextRewardStage)
      : null;
    const nextRewardAttained =
      nextRewardStage != null && STAGE_RANK[currentStage] >= STAGE_RANK[nextRewardStage];
    const completedRequirement = nextRewardProgress?.qualifiedContributorCount ?? 0;
    const totalRequirement =
      nextRewardProgress?.requiredContributorCount ??
      (nextRewardStage ? STAGE_CONFIG[nextRewardStage].requiredCount : 0);
    const progressPercentage =
      totalRequirement > 0
        ? Math.min(100, Math.round((completedRequirement / totalRequirement) * 100))
        : nextRewardAttained
          ? 100
          : 0;

    return NextResponse.json({
      rewards: rewards.map(serializeReward),
      progress: progress.map((item) => ({
        ...item,
        stageName: getStageDisplayName(item.stage),
        requirementStageName: item.requirementStage
          ? getStageDisplayName(item.requirementStage)
          : null,
      })),
      history: history.map((item) => ({
        ...item,
        fromStageName: getStageDisplayName(item.fromStage),
        toStageName: getStageDisplayName(item.toStage),
        contributors: item.contributors.map((contributor) => ({
          ...contributor,
          contributorStageName: getStageDisplayName(contributor.contributorStageAtQualification),
          contributorMember: {
            ...contributor.contributorMember,
            currentStageName: getStageDisplayName(contributor.contributorMember.currentStage),
          },
        })),
      })),
      loans: loans.map((loan) => ({
        ...loan,
        stageName: getStageDisplayName(loan.stage),
      })),
      stageSummary: {
        currentStage,
        currentStageName: getStageDisplayName(currentStage),
        currentStageNumberLabel: getStageNumberLabel(currentStage),
        highestStage: normalizeStageId(user.highestStage),
        highestStageName: getStageDisplayName(user.highestStage),
        stageUpdatedAt: user.stageUpdatedAt,
        compensationPlanStatus: user.compensationPlanStatus,
        finalStageCompletedAt: user.finalStageCompletedAt,
        nextStage,
        nextStageName: nextStage ? getStageDisplayName(nextStage) : null,
        nextRequirement: getRequirementText(nextStage),
      },
      currentReward: STAGE_CONFIG[currentStage].hasReward
        ? {
            stage: currentStage,
            stageName: getStageDisplayName(currentStage),
            rewardValue: STAGE_CONFIG[currentStage].rewardValue,
            rewardPackage: STAGE_CONFIG[currentStage].rewardPackage,
          }
        : null,
      nextReward: nextRewardStage
        ? {
            stage: nextRewardStage,
            stageName: getStageDisplayName(nextRewardStage),
            stageNumberLabel: getStageNumberLabel(nextRewardStage),
            rewardValue: STAGE_CONFIG[nextRewardStage].rewardValue,
            rewardPackage: STAGE_CONFIG[nextRewardStage].rewardPackage,
            requirement: getRequirementText(nextRewardStage),
            attained: nextRewardAttained,
            progress: {
              completedRequirement,
              totalRequirement,
              remainingRequirement: nextRewardProgress?.remainingContributorCount ?? 0,
              leftQualifiedCount: nextRewardProgress?.leftQualifiedCount ?? null,
              rightQualifiedCount: nextRewardProgress?.rightQualifiedCount ?? null,
              percentage: progressPercentage,
            },
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    const safeError = getSafeApiError(error, 'Unable to load rewards right now.');
    return NextResponse.json({ message: safeError.message }, { status: safeError.status });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rewardId = typeof body.rewardId === 'string' ? body.rewardId : '';
    const selectedOption = body.selectedOption as ClaimOption;

    if (!rewardId || !CLAIM_OPTIONS.has(selectedOption)) {
      throw new ApiError('Invalid reward claim request.', 400);
    }

    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
    });

    if (!reward || reward.userId !== currentUser.id) {
      throw new ApiError('Reward not found.', 404);
    }

    if (reward.status !== 'EARNED') {
      throw new ApiError('Reward has already been claimed or reserved.', 409);
    }

    const claim = await prisma.$transaction(async (tx) => {
      const claimed = await tx.reward.updateMany({
        where: {
          id: rewardId,
          userId: currentUser.id,
          status: 'EARNED',
        },
        data: { status: 'CLAIMED' },
      });

      if (claimed.count !== 1) {
        throw new ApiError('Reward has already been claimed or reserved.', 409);
      }

      return tx.rewardClaim.create({
        data: {
          rewardId,
          userId: currentUser.id,
          selectedOption,
          status: 'PENDING_ADMIN_PROCESSING',
        },
      });
    });

    return NextResponse.json({
      message:
        selectedOption === 'CASH'
          ? 'Cash reward option submitted. Withdrawal readiness is shown below.'
          : 'Reward option submitted for admin processing.',
      claim,
    });
  } catch (error) {
    console.error('Error claiming reward:', error);
    const safeError = getSafeApiError(error, 'Unable to submit reward claim.');
    return NextResponse.json({ message: safeError.message }, { status: safeError.status });
  }
}
