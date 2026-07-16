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
          path: true,
          depth: true,
        },
      },
      stageProgress: {
        where: { status: 'COMPLETED' },
        select: { stage: true, qualifiedAt: true },
      },
      stageHistory: {
        select: { id: true, toStage: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const membersById = new Map(members.map((member) => [member.id, member]));
  const isEligibleActiveSponsoredMember = (member: (typeof members)[number]) =>
    member.status === 'ACTIVE' && member.activationCode?.status === 'USED';

  function resolveRelativeBinaryLeg(
    sponsor: (typeof members)[number] | undefined,
    member: (typeof members)[number]
  ): 'left' | 'right' | null {
    const sponsorTree = sponsor?.binaryTree;
    const memberTree = member.binaryTree;
    if (!sponsorTree?.path || !memberTree?.path) return null;
    if (!memberTree.path.startsWith(`${sponsorTree.path}/`)) return null;

    const [firstDescendantId] = memberTree.path.slice(sponsorTree.path.length + 1).split('/');
    if (firstDescendantId === sponsorTree.leftChildId) return 'left';
    if (firstDescendantId === sponsorTree.rightChildId) return 'right';
    return null;
  }

  const sponsoredEligibleLegCounts = new Map<string, { left: number; right: number }>();
  for (const member of members) {
    if (!member.sponsorId || !isEligibleActiveSponsoredMember(member)) continue;
    const sponsor = membersById.get(member.sponsorId);
    const leg = resolveRelativeBinaryLeg(sponsor, member);
    if (!leg) continue;

    const counts = sponsoredEligibleLegCounts.get(member.sponsorId) ?? { left: 0, right: 0 };
    counts[leg] += 1;
    sponsoredEligibleLegCounts.set(member.sponsorId, counts);
  }

  let usersNeedingStageUpdate = 0;
  let rewardsNeedingStageUpdate = 0;
  let historiesToCreate = 0;
  const starterNewlyQualified: Array<{
    id: string;
    email: string | null;
    name: string | null;
    leftSponsoredEligibleCount: number;
    rightSponsoredEligibleCount: number;
    currentStage: string;
  }> = [];
  const starterMissingSplitButPreviouslyQualified: Array<{
    id: string;
    email: string | null;
    name: string | null;
    leftSponsoredEligibleCount: number;
    rightSponsoredEligibleCount: number;
    currentStage: string;
  }> = [];

  for (const member of members) {
    const completed = pickLatestStageFromCompletedProgress(member.stageProgress);
    const currentFromLegacy = normalizeStageId(member.currentStage);
    const targetStage = getHighestStage(
      getHighestStage(
        member.status === 'ACTIVE' ? STAGE_IDS.STARTER_ENTRY_STAGE : STAGE_IDS.REGISTERED_ACTIVE,
        completed.stage
      ),
      member.highestStage
    );
    const currentTargetStage = getHighestStage(targetStage, currentFromLegacy);
    const finalCompleted = currentTargetStage === STAGE_IDS.DIAMOND_STAGE_6_FINAL;
    const legCounts = sponsoredEligibleLegCounts.get(member.id) ?? { left: 0, right: 0 };
    const hasStarterCompletionCredit =
      STAGE_RANK[currentTargetStage] >= STAGE_RANK[STAGE_IDS.EMERALD_STAGE_1] ||
      member.stageHistory.some(
        (history) => normalizeStageId(history.toStage) === STAGE_IDS.EMERALD_STAGE_1
      ) ||
      member.stageProgress.some(
        (progress) =>
          normalizeStageId(progress.stage) === STAGE_IDS.EMERALD_STAGE_1 ||
          progress.stage === 'EMERALD'
      );

    if (legCounts.left >= 1 && legCounts.right >= 1 && !hasStarterCompletionCredit) {
      starterNewlyQualified.push({
        id: member.id,
        email: member.email,
        name: member.name,
        leftSponsoredEligibleCount: legCounts.left,
        rightSponsoredEligibleCount: legCounts.right,
        currentStage: member.currentStage,
      });
    }

    if (hasStarterCompletionCredit && (legCounts.left < 1 || legCounts.right < 1)) {
      starterMissingSplitButPreviouslyQualified.push({
        id: member.id,
        email: member.email,
        name: member.name,
        leftSponsoredEligibleCount: legCounts.left,
        rightSponsoredEligibleCount: legCounts.right,
        currentStage: member.currentStage,
      });
    }

    if (
      normalizeStageId(member.currentStage) !== currentTargetStage ||
      normalizeStageId(member.highestStage) !== currentTargetStage ||
      (finalCompleted && member.compensationPlanStatus !== 'COMPLETED')
    ) {
      usersNeedingStageUpdate++;
      if (execute) {
        await prisma.user.update({
          where: { id: member.id },
          data: {
            currentStage: currentTargetStage,
            highestStage: currentTargetStage,
            stageUpdatedAt:
              completed.qualifiedAt ??
              member.stageUpdatedAt ??
              (currentTargetStage === STAGE_IDS.REGISTERED_ACTIVE ? null : new Date()),
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
      if (
        attainedStage === STAGE_IDS.REGISTERED_ACTIVE ||
        attainedStage === STAGE_IDS.STARTER_ENTRY_STAGE
      ) {
        continue;
      }

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
          requiredEligibleSponsoredMembers:
            'at least 1 in left binary leg and 1 in right binary leg',
          newlyQualifiedBySplitDirectSponsorshipCount: starterNewlyQualified.length,
          missingSplitButPreviouslyQualifiedCount: starterMissingSplitButPreviouslyQualified.length,
          newlyQualifiedBySplitDirectSponsorship: starterNewlyQualified,
          missingSplitButPreviouslyQualified: starterMissingSplitButPreviouslyQualified,
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
