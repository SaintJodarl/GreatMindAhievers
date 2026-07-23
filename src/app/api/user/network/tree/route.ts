import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getBinaryTreeScope, isWithinBinaryScope } from '@/lib/network/genealogy';
import { getStageDisplayName } from '@/lib/qualification/constants';

type TreeRecord = Awaited<ReturnType<typeof getTreeRecord>>;

async function getTreeRecord(userId: string) {
  return prisma.binaryTree.findUnique({
    where: { userId },
    select: {
      userId: true,
      path: true,
      depth: true,
      leftChildId: true,
      rightChildId: true,
      leftVolume: true,
      rightVolume: true,
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          status: true,
          currentStage: true,
          createdAt: true,
        },
      },
    },
  });
}

function decimalToNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  if (value && typeof value === 'object' && 'toNumber' in value) {
    const decimal = value as { toNumber: () => number };
    return decimal.toNumber();
  }
  return 0;
}

function formatNode(record: NonNullable<TreeRecord>) {
  const leftVol = decimalToNumber(record.leftVolume);
  const rightVol = decimalToNumber(record.rightVolume);
  const currentStageName = getStageDisplayName(record.user.currentStage);

  return {
    id: record.user.id,
    name: record.user.name || record.user.username || 'Unknown',
    rank: currentStageName,
    currentStage: record.user.currentStage,
    currentStageName,
    volume: leftVol + rightVol,
    leftVolume: leftVol,
    rightVolume: rightVol,
    status: record.user.status,
    joinDate: record.user.createdAt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    leftChild: null as any,
    rightChild: null as any,
  };
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const loggedInUserId = currentUser.id;
    const { searchParams } = new URL(req.url);
    const rootId = searchParams.get('rootId') || loggedInUserId;

    const viewerTree = await getBinaryTreeScope(prisma, loggedInUserId);
    if (!viewerTree) {
      return NextResponse.json({ error: 'Logged in user has no tree record' }, { status: 404 });
    }

    const rootRecord = await getTreeRecord(rootId);
    if (!rootRecord) {
      return NextResponse.json({ error: 'Target user has no tree record' }, { status: 404 });
    }

    if (!isWithinBinaryScope(viewerTree, rootRecord)) {
      return NextResponse.json(
        { error: 'Forbidden: User is not in your downline' },
        { status: 403 }
      );
    }

    const descendants = await prisma.binaryTree.findMany({
      where: {
        path: { startsWith: `${rootRecord.path}/` },
      },
      select: {
        userId: true,
        path: true,
        depth: true,
        leftChildId: true,
        rightChildId: true,
        leftVolume: true,
        rightVolume: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            status: true,
            currentStage: true,
            createdAt: true,
          },
        },
      },
      orderBy: [{ depth: 'asc' }, { createdAt: 'asc' }, { userId: 'asc' }],
    });

    const nodeByUserId = new Map<string, NonNullable<TreeRecord>>();
    nodeByUserId.set(rootRecord.userId, rootRecord);
    for (const descendant of descendants) {
      nodeByUserId.set(descendant.userId, descendant);
    }

    function buildTree(userId: string | null, seen = new Set<string>()) {
      if (!userId || seen.has(userId)) return null;

      const record = nodeByUserId.get(userId);
      if (!record) return null;

      seen.add(userId);
      const node = formatNode(record);
      node.leftChild = buildTree(record.leftChildId, seen);
      node.rightChild = buildTree(record.rightChildId, seen);

      return node;
    }

    return NextResponse.json({
      tree: buildTree(rootRecord.userId),
      descendantCount: descendants.length,
    });
  } catch (error) {
    console.error('Binary tree API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
