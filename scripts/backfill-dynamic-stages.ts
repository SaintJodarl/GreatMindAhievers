import { PrismaClient } from '@prisma/client';
import {
  ATTAINED_STAGE_TO_LEGACY_COMPLETED_STAGE,
  LEGACY_STAGE_IDS,
  STAGE_CONFIG,
  STAGE_IDS,
  STAGE_RANK,
  StageId,
  getHighestStage,
  normalizeStageId,
} from '../src/lib/qualification/constants';
import { checkUserQualification } from '../src/lib/qualification/engine';

const prisma = new PrismaClient();

const execute = process.argv.includes('--execute');
const recalculate = process.argv.includes('--recalculate');

const LEGACY_COMPLETED_STAGE_TO_ATTAINED_STAGE: Record<string, StageId> = {
  STARTER: STAGE_IDS.STARTER_ENTRY_STAGE,
  EMERALD: STAGE_IDS.EMERALD_STAGE_1,
  SILVER: STAGE_IDS.SILVER_STAGE_2,
  GOLD: STAGE_IDS.GOLD_STAGE_3,
  JASPER: STAGE_IDS.JASPER_STAGE_4,
  SAPPHIRE: STAGE_IDS.SAPPHIRE_STAGE_5,
  DIAMOND: STAGE_IDS.DIAMOND_STAGE_6_FINAL,
};

function pickLatestStageFromCompletedProgress(
  progress: { stage: string; qualifiedAt: Date | null }[]
): { stage: StageId; qualifiedAt: Date | null } {
  return progress.reduce<{ stage: StageId; qualifiedAt: Date | null }>(
    (best, item) => {
      const attained: StageId =
        LEGACY_COMPLETED_STAGE_TO_ATTAINED_STAGE[item.stage] ?? normalizeStageId(item.stage);
      if (STAGE_RANK[attained] > STAGE_RANK[best.stage]) {
        return { stage: attained, qualifiedAt: item.qualifiedAt };
      }
      return best;
    },
    { stage: STAGE_IDS.REGISTERED_ACTIVE as StageId, qualifiedAt: null as Date | null }
  );
}

async function main() {
  console.log(`Dynamic stage backfill starting in ${execute ? 'EXECUTE' : 'DRY-RUN'} mode.`);
  console.log(
    'This script does not alter sponsor, placement, child, path, depth, or genealogy data.'
  );

  const members = await prisma.user.findMany({
    where: { role: 'MEMBER' },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      sponsorId: true,
      createdAt: true,
      currentStage: true,
      highestStage: true,
      stageUpdatedAt: true,
      compensationPlanStatus: true,
      finalStageCompletedAt: true,
      activationCode: {
        select: { status: true },
      },
      binaryTree: {
        select: {
          leftChildId: true,
          rightChildId: true,
        },
      },
      stageProgress: {
        where: { status: 'COMPLETED' },
        select: { stage: true, qualifiedAt: true },
      },
      stageHistory: {
        where: { toStage: STAGE_IDS.STARTER_ENTRY_STAGE },
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const membersById = new Map(members.map((member) => [member.id, member]));
  const isEligibleActiveSponsoredMember = (member: (typeof members)[number]) =>
    member.status === 'ACTIVE' && member.activationCode?.status === 'USED';

  const sponsoredEligibleCounts = new Map<string, number>();
  for (const member of members) {
    if (!member.sponsorId || !isEligibleActiveSponsoredMember(member)) continue;
    sponsoredEligibleCounts.set(
      member.sponsorId,
      (sponsoredEligibleCounts.get(member.sponsorId) ?? 0) + 1
    );
  }

  const placementEligibleChildCounts = new Map<string, number>();
  for (const member of members) {
    const childIds = [member.binaryTree?.leftChildId, member.binaryTree?.rightChildId].filter(
      Boolean
    ) as string[];
    const eligibleChildren = childIds.filter((childId) => {
      const child = membersById.get(childId);
      return child ? isEligibleActiveSponsoredMember(child) : false;
    });
    placementEligibleChildCounts.set(member.id, eligibleChildren.length);
  }

  let usersNeedingStageUpdate = 0;
  let rewardsNeedingStageUpdate = 0;
  let historiesToCreate = 0;
  const starterNewlyQualified: Array<{
    id: string;
    email: string | null;
    name: string | null;
    sponsoredEligibleCount: number;
    currentStage: string;
  }> = [];
  const starterPlacementOnlyPreviouslyQualified: Array<{
    id: string;
    email: string | null;
    name: string | null;
    sponsoredEligibleCount: number;
    immediatePlacementEligibleChildCount: number;
    currentStage: string;
  }> = [];

  for (const member of members) {
    const completed = pickLatestStageFromCompletedProgress(member.stageProgress);
    const currentFromLegacy = normalizeStageId(member.currentStage);
    const targetStage = getHighestStage(
      getHighestStage(completed.stage, currentFromLegacy),
      member.highestStage
    );
    const finalCompleted = targetStage === STAGE_IDS.DIAMOND_STAGE_6_FINAL;
    const sponsoredEligibleCount = sponsoredEligibleCounts.get(member.id) ?? 0;
    const immediatePlacementEligibleChildCount = placementEligibleChildCounts.get(member.id) ?? 0;
    const hasStarterCredit =
      STAGE_RANK[targetStage] >= STAGE_RANK[STAGE_IDS.STARTER_ENTRY_STAGE] ||
      member.stageHistory.length > 0 ||
      member.stageProgress.some(
        (progress) =>
          progress.stage === 'STARTER' || progress.stage === STAGE_IDS.STARTER_ENTRY_STAGE
      );

    if (sponsoredEligibleCount >= 2 && !hasStarterCredit) {
      starterNewlyQualified.push({
        id: member.id,
        email: member.email,
        name: member.name,
        sponsoredEligibleCount,
        currentStage: member.currentStage,
      });
    }

    if (
      hasStarterCredit &&
      sponsoredEligibleCount < 2 &&
      immediatePlacementEligibleChildCount >= 2
    ) {
      starterPlacementOnlyPreviouslyQualified.push({
        id: member.id,
        email: member.email,
        name: member.name,
        sponsoredEligibleCount,
        immediatePlacementEligibleChildCount,
        currentStage: member.currentStage,
      });
    }

    if (
      member.currentStage !== targetStage ||
      member.highestStage !== targetStage ||
      (finalCompleted && member.compensationPlanStatus !== 'COMPLETED')
    ) {
      usersNeedingStageUpdate++;
      if (execute) {
        await prisma.user.update({
          where: { id: member.id },
          data: {
            currentStage: targetStage,
            highestStage: targetStage,
            stageUpdatedAt:
              completed.qualifiedAt ??
              member.stageUpdatedAt ??
              (targetStage === STAGE_IDS.REGISTERED_ACTIVE ? null : new Date()),
            compensationPlanStatus: finalCompleted
              ? 'COMPLETED'
              : member.compensationPlanStatus || 'ACTIVE',
            finalStageCompletedAt: finalCompleted
              ? (member.finalStageCompletedAt ?? completed.qualifiedAt ?? new Date())
              : member.finalStageCompletedAt,
          },
        });
      }
    }

    for (const progress of member.stageProgress) {
      const attainedStage =
        LEGACY_COMPLETED_STAGE_TO_ATTAINED_STAGE[progress.stage] ??
        normalizeStageId(progress.stage);
      if (attainedStage === STAGE_IDS.REGISTERED_ACTIVE) continue;

      const exists = await prisma.stageHistory.findUnique({
        where: { memberId_toStage: { memberId: member.id, toStage: attainedStage } },
        select: { id: true },
      });
      if (!exists) {
        historiesToCreate++;
        if (execute) {
          await prisma.stageHistory.create({
            data: {
              memberId: member.id,
              fromStage: STAGE_CONFIG[attainedStage].previousStage ?? STAGE_IDS.REGISTERED_ACTIVE,
              toStage: attainedStage,
              qualifiedAt: progress.qualifiedAt ?? new Date(),
              qualificationRuleVersion: 'legacy-stage-progress-backfill',
              calculationId: `legacy-backfill:${member.id}:${attainedStage}`,
            },
          });
        }
      }
    }
  }

  for (const [attainedStage, legacyStage] of Object.entries(
    ATTAINED_STAGE_TO_LEGACY_COMPLETED_STAGE
  ) as [StageId, string][]) {
    if (attainedStage === STAGE_IDS.STARTER_ENTRY_STAGE) continue;

    const legacyRewards = await prisma.reward.findMany({
      where: { stage: legacyStage },
      select: { id: true, userId: true },
    });

    for (const reward of legacyRewards) {
      const newReward = await prisma.reward.findUnique({
        where: { userId_stage: { userId: reward.userId, stage: attainedStage } },
        select: { id: true },
      });
      if (!newReward) {
        rewardsNeedingStageUpdate++;
        if (execute) {
          await prisma.reward.update({
            where: { id: reward.id },
            data: {
              stage: attainedStage,
              rewardValue: STAGE_CONFIG[attainedStage].rewardValue,
              rewardPackage: STAGE_CONFIG[attainedStage].rewardPackage,
            },
          });
        }
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: execute ? 'execute' : 'dry-run',
        membersChecked: members.length,
        usersNeedingStageUpdate,
        historiesToCreate,
        rewardsNeedingStageUpdate,
        starterRule: {
          relationship: 'User.sponsorId',
          requiredEligibleSponsoredMembers: 2,
          newlyQualifiedBySponsorshipCount: starterNewlyQualified.length,
          placementOnlyPreviouslyQualifiedCount: starterPlacementOnlyPreviouslyQualified.length,
          newlyQualifiedBySponsorship: starterNewlyQualified,
          placementOnlyPreviouslyQualified: starterPlacementOnlyPreviouslyQualified,
          demotionApplied: false,
        },
        legacyStageKeysRecognized: LEGACY_STAGE_IDS,
      },
      null,
      2
    )
  );

  if (recalculate) {
    console.log(`Recalculation requested in ${execute ? 'EXECUTE' : 'DRY-RUN'} mode.`);
    if (!execute) {
      console.log('Skipping recalculation because --execute was not supplied.');
      return;
    }

    const activeMembers = await prisma.user.findMany({
      where: { role: 'MEMBER', status: 'ACTIVE' },
      select: { id: true, depth: true },
      orderBy: [{ depth: 'desc' }, { createdAt: 'asc' }],
    });

    for (const member of activeMembers) {
      await prisma.$transaction(async (tx) => {
        await checkUserQualification(tx, member.id);
      });
    }

    console.log(`Recalculated ${activeMembers.length} active members.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
