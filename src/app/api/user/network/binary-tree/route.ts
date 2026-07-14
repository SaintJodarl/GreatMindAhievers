import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/prisma';
import { getStageDisplayName } from '@/lib/qualification/constants';

// We want to return exactly 3 levels.
// Root -> 1
// L, R -> 2
// L.L, L.R, R.L, R.R -> 4
// L.L.L, L.L.R, L.R.L, L.R.R, R.L.L, R.L.R, R.R.L, R.R.R -> 8
// Total = 15 nodes including root.

interface TreeNode {
  userId: string | null;
  username: string | null;
  isPlaceholder: boolean;
  stage: string | null;
  left?: TreeNode;
  right?: TreeNode;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId') || session.user.id;

    // Fetch the root tree node
    const rootNode = await prisma.binaryTree.findUnique({
      where: { userId: targetUserId },
      include: {
        user: { select: { username: true, currentStage: true } },
      },
    });

    if (!rootNode) {
      return NextResponse.json({ message: 'User not placed in binary tree yet.' }, { status: 404 });
    }

    // Fetch up to depth 3
    const descendants = await prisma.binaryTree.findMany({
      where: {
        path: { startsWith: rootNode.path + '/' },
        depth: { lte: rootNode.depth + 3 },
      },
      include: {
        user: { select: { username: true, currentStage: true } },
      },
    });

    const nodeMap = new Map<string, any>();
    for (const d of descendants) {
      nodeMap.set(d.userId, d);
    }

    function buildTree(currentId: string | null, currentDepth: number): TreeNode {
      if (currentDepth > 3) return null as any;

      if (!currentId) {
        return {
          userId: null,
          username: null,
          isPlaceholder: true,
          stage: null,
          left: currentDepth < 3 ? buildTree(null, currentDepth + 1) : undefined,
          right: currentDepth < 3 ? buildTree(null, currentDepth + 1) : undefined,
        };
      }

      const nodeData = currentId === rootNode!.userId ? rootNode : nodeMap.get(currentId);
      if (!nodeData) {
        return buildTree(null, currentDepth); // Should not happen in a consistent DB
      }

      return {
        userId: nodeData.userId,
        username: nodeData.user.username || 'Unknown',
        isPlaceholder: false,
        stage: getStageDisplayName(nodeData.user.currentStage),
        left: currentDepth < 3 ? buildTree(nodeData.leftChildId, currentDepth + 1) : undefined,
        right: currentDepth < 3 ? buildTree(nodeData.rightChildId, currentDepth + 1) : undefined,
      };
    }

    const tree = buildTree(rootNode.userId, 0);

    return NextResponse.json(tree);
  } catch (error: any) {
    console.error('Error fetching binary tree:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
