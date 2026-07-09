import { PrismaClient } from '@prisma/client';
import { STAGES, STAGE_CONFIG } from './constants';
import { Decimal } from 'decimal.js';
import { emitOutboxEvent } from '@/lib/events/outbox';

type TxClient =
  | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
  | PrismaClient;

function hasCompletedStage(userCurrentStage: string, requiredStage: string): boolean {
  const stageKeys = Object.keys(STAGE_CONFIG);
  const userStageIndex = stageKeys.indexOf(userCurrentStage);
  const requiredStageIndex = stageKeys.indexOf(requiredStage);

  // If the user's current stage index is strictly greater than the required stage index,
  // it means they have already completed the required stage and moved on.
  // E.g., if user is EMERALD (index 1), they have completed STARTER (index 0).
  return userStageIndex > requiredStageIndex;
}

export async function checkUserQualification(
  tx: TxClient,
  userId: string,
  visited = new Set<string>()
): Promise<void> {
  // Prevent infinite loops in case of circular cascading (though tree structure shouldn't allow it)
  if (visited.has(userId)) return;
  visited.add(userId);

  const user = await tx.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      currentStage: true,
      status: true,
    },
  });

  if (!user || user.status !== 'ACTIVE') return;

  const currentStageName = user.currentStage || STAGES.STARTER;
  const stageKeys = Object.keys(STAGE_CONFIG);
  const currentIndex = stageKeys.indexOf(currentStageName);

  // If at Diamond and completed, there might not be a next stage, but let's check if they can complete the current stage.
  if (currentIndex === -1) return;

  const targetConfig = STAGE_CONFIG[currentStageName];
  if (!targetConfig) return;

  // Check if they already completed THIS stage
  const existingProgress = await tx.stageProgress.findUnique({
    where: { userId_stage: { userId, stage: currentStageName } },
  });

  if (existingProgress && existingProgress.status === 'COMPLETED') {
    // Already completed, nothing to do.
    return;
  }

  // Fetch binary tree
  const rootTree = await tx.binaryTree.findUnique({
    where: { userId },
  });

  if (!rootTree) return;

  // Fetch downlines up to depth 3
  const downlines = await tx.binaryTree.findMany({
    where: {
      path: { startsWith: rootTree.path + '/' },
      depth: { lte: rootTree.depth + 3 },
    },
    include: {
      user: { select: { id: true, status: true, currentStage: true } },
    },
  });

  const leftChildId = rootTree.leftChildId;
  const rightChildId = rootTree.rightChildId;

  let leftCount = 0;
  let rightCount = 0;

  if (currentStageName === STAGES.STARTER) {
    // Starter only requires 1 active immediate left and 1 active immediate right
    const leftChild = downlines.find((d) => d.userId === leftChildId);
    if (leftChild && leftChild.user.status === 'ACTIVE') leftCount++;

    const rightChild = downlines.find((d) => d.userId === rightChildId);
    if (rightChild && rightChild.user.status === 'ACTIVE') rightCount++;
  } else {
    // For Emerald through Diamond, require 14 people (7 left, 7 right) to have completed the previous stage
    const requiredPrevStage = targetConfig.previousStage;
    if (requiredPrevStage) {
      for (const node of downlines) {
        if (node.user.status !== 'ACTIVE') continue;

        if (hasCompletedStage(node.user.currentStage, requiredPrevStage)) {
          // Check leg
          if (
            leftChildId &&
            (node.userId === leftChildId || node.path.includes(`/${leftChildId}/`))
          ) {
            leftCount++;
          } else if (
            rightChildId &&
            (node.userId === rightChildId || node.path.includes(`/${rightChildId}/`))
          ) {
            rightCount++;
          }
        }
      }
    }
  }

  // Upsert progress
  await tx.stageProgress.upsert({
    where: { userId_stage: { userId, stage: currentStageName } },
    create: {
      userId,
      stage: currentStageName,
      status: 'IN_PROGRESS',
      leftQualifiedCount: leftCount,
      rightQualifiedCount: rightCount,
    },
    update: {
      leftQualifiedCount: leftCount,
      rightQualifiedCount: rightCount,
    },
  });

  // Check if qualified
  if (leftCount >= targetConfig.leftRequired && rightCount >= targetConfig.rightRequired) {
    // QUALIFIED!
    const now = new Date();

    await tx.stageProgress.update({
      where: { userId_stage: { userId, stage: currentStageName } },
      data: {
        status: 'COMPLETED',
        qualifiedAt: now,
        movedToNextStageAt: now,
      },
    });

    // Create reward idempotently
    const existingReward = await tx.reward.findUnique({
      where: { userId_stage: { userId, stage: currentStageName } },
    });

    if (!existingReward) {
      // First ensure wallet exists
      const wallet = await tx.wallet.upsert({
        where: { userId },
        update: {},
        create: {
          id: userId,
          userId,
          balance: new Decimal(0),
        },
      });

      // Create reward
      await tx.reward.create({
        data: {
          userId,
          stage: currentStageName,
          rewardValue: new Decimal(targetConfig.rewardValue),
          rewardPackage: targetConfig.rewardPackage,
          status: 'EARNED',
        },
      });

      // Emit outbox event to trigger wallet credit
      const idempotencyKey = `stage_reward:${userId}:${currentStageName}`;
      await emitOutboxEvent(
        tx,
        'WALLET_CREDIT',
        userId,
        {
          walletId: wallet.id,
          userId,
          amount: targetConfig.rewardValue.toString(),
          type: 'STAGE_BONUS',
          description: `Stage bonus for ${currentStageName} qualification`,
        },
        idempotencyKey
      );
    }

    // Move to next stage
    const nextStageIndex = currentIndex + 1;
    if (nextStageIndex < stageKeys.length) {
      const nextStageName = stageKeys[nextStageIndex];
      await tx.user.update({
        where: { id: userId },
        data: { currentStage: nextStageName },
      });

      // Initialize progress for next stage
      await tx.stageProgress.create({
        data: {
          userId,
          stage: nextStageName,
          status: 'IN_PROGRESS',
          leftQualifiedCount: 0,
          rightQualifiedCount: 0,
        },
      });
    }

    // Cascade: Because this user upgraded their stage, their upline might now qualify!
    if (rootTree.parentId) {
      await checkUserQualification(tx, rootTree.parentId, visited);
    }

    // Also, if the user completed a stage, they might immediately qualify for the next stage
    // if their downline had already completed it. Re-run with a fresh guard because stage
    // progression is finite, while the parent cascade above still uses the current guard.
    await checkUserQualification(tx, userId);
  }
}
