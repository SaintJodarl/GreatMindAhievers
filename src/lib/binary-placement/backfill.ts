import { prisma } from '@/lib/prisma';
import { executePlacementWithTx, getPlacementInfo } from './utils';
import { PlacementContext, BackfillResult } from './types';
import { PLACEMENT_CONSTANTS } from './constants';
import { logger } from './logger';

export async function backfillPlacements(): Promise<BackfillResult> {
  const result: BackfillResult = {
    processed: 0,
    placed: 0,
    skipped: 0,
    errors: [],
  };

  const usersWithoutTree = await prisma.user.findMany({
    where: {
      binaryTree: null,
      sponsorId: { not: null },
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, sponsorId: true, createdAt: true },
  });

  logger.info(`Backfill: Found ${usersWithoutTree.length} users without placement`);

  for (const user of usersWithoutTree) {
    result.processed++;

    try {
      const existing = await getPlacementInfo(user.id);
      if (existing) {
        result.skipped++;
        continue;
      }

      const context: PlacementContext = {
        sponsorId: user.sponsorId!,
        preferredPosition: PLACEMENT_CONSTANTS.DEFAULT_PREFERRED_POSITION,
        userId: user.id,
      };

      await prisma.$transaction(async (tx) => {
        await executePlacementWithTx(tx, context);
      });

      result.placed++;
      logger.info(`Backfill: Placed user ${user.id} under sponsor ${user.sponsorId}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push({ userId: user.id, error: errMsg });
      logger.error(`Backfill failed for user ${user.id}: ${errMsg}`);
    }
  }

  logger.info(
    `Backfill complete: ${result.placed} placed, ${result.skipped} skipped, ${result.errors.length} errors`
  );
  return result;
}
