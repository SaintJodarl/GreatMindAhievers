import { prisma } from '@/lib/prisma';
import { PlacementContext, PlacementResult } from './types';
import { executePlacementWithTx, getPlacementInfo } from './utils';

export async function executePlacement(context: PlacementContext): Promise<PlacementResult> {
  return prisma.$transaction(async (tx) => {
    return executePlacementWithTx(tx, context);
  });
}

export { getPlacementInfo };
