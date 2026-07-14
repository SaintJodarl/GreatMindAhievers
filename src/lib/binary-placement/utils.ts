import { PrismaClient } from '@prisma/client';
import { PlacementContext, PlacementResult } from './types';
import { PLACEMENT_CONSTANTS, BinaryPosition } from './constants';
import { logger } from './logger';

type TxClient =
  | PrismaClient
  | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export function generatePath(
  parentPath: string | null,
  position: BinaryPosition,
  userId: string
): string {
  const basePath = parentPath ?? PLACEMENT_CONSTANTS.ROOT_PATH_PREFIX;
  return `${basePath}/${userId}`;
}

export async function findPlacementForUser(
  tx: TxClient,
  context: PlacementContext
): Promise<PlacementResult> {
  const { sponsorId, preferredPosition, userId } = context;

  if (!sponsorId) {
    return {
      userId,
      placementId: null,
      parentId: null,
      binaryPosition: null,
      depth: 0,
      path: generatePath(null, preferredPosition, userId),
    };
  }

  const sponsorTree = await tx.binaryTree.findUnique({
    where: { userId: sponsorId },
    select: {
      userId: true,
      parentId: true,
      leftChildId: true,
      rightChildId: true,
      path: true,
      depth: true,
    },
  });

  if (!sponsorTree) {
    throw new Error(`Sponsor ${sponsorId} has no BinaryTree record`);
  }

  const checkPosition = async (pos: BinaryPosition): Promise<boolean> => {
    const children = await tx.binaryTree.findUnique({
      where: { userId: sponsorId },
      select: { leftChildId: true, rightChildId: true },
    });
    return pos === 'LEFT' ? !children?.leftChildId : !children?.rightChildId;
  };

  if (await checkPosition(preferredPosition)) {
    return buildResult(userId, sponsorId, sponsorTree, preferredPosition);
  }

  const opposite: BinaryPosition = preferredPosition === 'LEFT' ? 'RIGHT' : 'LEFT';
  if (await checkPosition(opposite)) {
    return buildResult(userId, sponsorId, sponsorTree, opposite);
  }

  return spilloverSearch(tx, sponsorTree, userId, preferredPosition);
}

function buildResult(
  userId: string,
  sponsorId: string,
  sponsorTree: any,
  position: BinaryPosition
): PlacementResult {
  const depth = sponsorTree.depth + 1;
  validateDepth(depth, userId);
  logSoftWarning(depth, userId);
  return {
    userId,
    placementId: sponsorId,
    parentId: sponsorId,
    binaryPosition: position,
    depth,
    path: generatePath(sponsorTree.path, position, userId),
  };
}

async function spilloverSearch(
  tx: TxClient,
  sponsorTree: any,
  userId: string,
  preferredPosition: BinaryPosition
): Promise<PlacementResult> {
  // Start BFS from the root of the preferred leg
  const rootLegId =
    preferredPosition === 'LEFT' ? sponsorTree.leftChildId : sponsorTree.rightChildId;

  if (!rootLegId) {
    throw new Error(`Sponsor leg ${preferredPosition} is empty, but spilloverSearch was called`);
  }

  const queue: string[] = [rootLegId];

  while (queue.length > 0) {
    const currentNodeId = queue.shift()!;

    const nodeTree = await tx.binaryTree.findUnique({
      where: { userId: currentNodeId },
      select: { leftChildId: true, rightChildId: true, path: true, depth: true },
    });

    if (!nodeTree) {
      continue;
    }

    // Place in the first available left or right child position
    if (!nodeTree.leftChildId) {
      const depth = nodeTree.depth + 1;
      validateDepth(depth, userId);
      return {
        userId,
        placementId: currentNodeId,
        parentId: currentNodeId,
        binaryPosition: 'LEFT',
        depth,
        path: generatePath(nodeTree.path, 'LEFT', userId),
      };
    }

    if (!nodeTree.rightChildId) {
      const depth = nodeTree.depth + 1;
      validateDepth(depth, userId);
      return {
        userId,
        placementId: currentNodeId,
        parentId: currentNodeId,
        binaryPosition: 'RIGHT',
        depth,
        path: generatePath(nodeTree.path, 'RIGHT', userId),
      };
    }

    // Both children occupied, add to queue for next level BFS
    queue.push(nodeTree.leftChildId);
    queue.push(nodeTree.rightChildId);
  }

  throw new Error('Spillover search failed to find an empty position');
}

function validateDepth(depth: number, userId: string): void {
  if (depth >= PLACEMENT_CONSTANTS.MAX_DEPTH) {
    logger.error(`Max depth ${PLACEMENT_CONSTANTS.MAX_DEPTH} exceeded for user ${userId}`);
    throw new Error(`Maximum placement depth (${PLACEMENT_CONSTANTS.MAX_DEPTH}) exceeded`);
  }
}

function logSoftWarning(depth: number, userId: string): void {
  if (
    depth >= PLACEMENT_CONSTANTS.SOFT_WARNING_DEPTH_MIN &&
    depth <= PLACEMENT_CONSTANTS.SOFT_WARNING_DEPTH_MAX
  ) {
    logger.warn(`Placement depth ${depth} approaching limit (user: ${userId})`);
  }
}

export async function assignPlacementInTransaction(
  tx: TxClient,
  userId: string,
  result: PlacementResult
): Promise<void> {
  await tx.binaryTree.create({
    data: {
      userId,
      parentId: result.parentId,
      leftChildId: null,
      rightChildId: null,
      path: result.path,
      depth: result.depth,
    },
  });

  if (result.parentId) {
    const targetField = result.binaryPosition === 'LEFT' ? 'leftChildId' : 'rightChildId';
    // Atomic check: Only update if the target child slot is currently null to prevent concurrent overwrite race conditions
    const updateCount = await tx.binaryTree.updateMany({
      where: {
        userId: result.parentId,
        [targetField]: null,
      },
      data: {
        [targetField]: userId,
      },
    });

    if (updateCount.count === 0) {
      throw new Error(
        `Placement slot ${result.binaryPosition} on parent ${result.parentId} is already occupied.`
      );
    }
  }

  await tx.user.update({
    where: { id: userId },
    data: {
      placementId: result.placementId,
      binaryPosition: result.binaryPosition,
    },
  });
}

export async function updateAncestorCounters(
  tx: TxClient,
  userId: string,
  binaryPosition: BinaryPosition | null
): Promise<void> {
  if (!binaryPosition) return;

  let currentUserId = userId;
  let currentPosition = binaryPosition;

  while (true) {
    const currentTree = await tx.binaryTree.findUnique({
      where: { userId: currentUserId },
      select: { parentId: true },
    });

    if (!currentTree?.parentId) break;

    const parentId = currentTree.parentId;

    const updateData =
      currentPosition === 'LEFT'
        ? { leftLegCount: { increment: 1 }, totalDownlines: { increment: 1 } }
        : { rightLegCount: { increment: 1 }, totalDownlines: { increment: 1 } };

    await tx.user.update({
      where: { id: parentId },
      data: updateData,
    });

    const treeUpdateData =
      currentPosition === 'LEFT'
        ? { leftVolume: { increment: 1000 } }
        : { rightVolume: { increment: 1000 } };

    await tx.binaryTree.update({
      where: { userId: parentId },
      data: treeUpdateData,
    });

    const parentUser = await tx.user.findUnique({
      where: { id: parentId },
      select: { binaryPosition: true },
    });

    currentUserId = parentId;
    currentPosition = (parentUser?.binaryPosition as BinaryPosition) || null;
    if (!currentPosition) break;
  }
}

import { checkUserQualification } from '@/lib/qualification/engine';

export async function executePlacementWithTx(
  tx: TxClient,
  context: PlacementContext
): Promise<PlacementResult> {
  const result = await findPlacementForUser(tx, context);
  await assignPlacementInTransaction(tx, context.userId, result);
  await updateAncestorCounters(tx, context.userId, result.binaryPosition);

  // Trigger qualification checks for both the placed user and the parent whose leg changed.
  await checkUserQualification(tx, context.userId);
  if (result.parentId) {
    await checkUserQualification(tx, result.parentId);
  }
  if (context.sponsorId && context.sponsorId !== result.parentId) {
    await checkUserQualification(tx, context.sponsorId, new Set<string>(), context.userId);
  }

  return result;
}

export async function getPlacementInfo(userId: string): Promise<PlacementResult | null> {
  const { prisma } = await import('@/lib/prisma');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, placementId: true, binaryPosition: true },
  });

  if (!user) return null;

  const tree = await prisma.binaryTree.findUnique({
    where: { userId },
    select: { path: true, depth: true, parentId: true },
  });

  if (!tree) return null;

  return {
    userId: user.id,
    placementId: user.placementId,
    parentId: tree.parentId,
    binaryPosition: user.binaryPosition as BinaryPosition | null,
    depth: tree.depth,
    path: tree.path,
  };
}
