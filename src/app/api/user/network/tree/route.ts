import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';


import { prisma } from '@/lib/prisma';

function determineRank(leftVolume: number, rightVolume: number): string {
  const totalVolume = leftVolume + rightVolume;
  if (totalVolume >= 100000) return 'Diamond';
  if (totalVolume >= 40000) return 'Gold';
  if (totalVolume >= 15000) return 'Silver';
  if (totalVolume >= 5000) return 'Bronze';
  return 'Entry';
}

function formatNode(user: any) {
  if (!user) return null;
  const leftVol = user.binaryTree?.leftVolume || 0;
  const rightVol = user.binaryTree?.rightVolume || 0;
  return {
    id: user.id,
    name: user.name || 'Unknown',
    rank: determineRank(leftVol, rightVol),
    volume: leftVol + rightVol,
    leftVolume: leftVol,
    rightVolume: rightVol,
    status: user.status,
    joinDate: user.createdAt.toLocaleDateString('en-US', {
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

    // Fetch logged in user's tree path to verify permissions
    const loggedInTree = await prisma.binaryTree.findUnique({
      where: { userId: loggedInUserId },
    });

    if (!loggedInTree) {
      return NextResponse.json({ error: 'Logged in user has no tree record' }, { status: 404 });
    }

    // If rootId is specified and not the logged-in user, verify that rootId is in their downline
    if (rootId !== loggedInUserId) {
      const rootTree = await prisma.binaryTree.findUnique({
        where: { userId: rootId },
      });

      if (!rootTree) {
        return NextResponse.json({ error: 'Target user has no tree record' }, { status: 404 });
      }

      // Check if rootTree's path starts with loggedInTree's path + '/'
      const pathPrefix = loggedInTree.path + '/';
      if (!rootTree.path.startsWith(pathPrefix)) {
        return NextResponse.json(
          { error: 'Forbidden: User is not in your downline' },
          { status: 403 }
        );
      }
    }

    // Fetch Level 1: Root User
    const rootUser = await prisma.user.findUnique({
      where: { id: rootId },
      include: { binaryTree: true },
    });

    if (!rootUser) {
      return NextResponse.json({ error: 'Root user not found' }, { status: 404 });
    }

    const leftChildId = rootUser.binaryTree?.leftChildId || null;
    const rightChildId = rootUser.binaryTree?.rightChildId || null;

    // Fetch Level 2: Children
    const childrenIds = [leftChildId, rightChildId].filter((id): id is string => id !== null);
    const children =
      childrenIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: childrenIds } },
            include: { binaryTree: true },
          })
        : [];

    const leftChildUser = children.find((c) => c.id === leftChildId) || null;
    const rightChildUser = children.find((c) => c.id === rightChildId) || null;

    // Fetch Level 3: Grandchildren
    const leftLeftId = leftChildUser?.binaryTree?.leftChildId || null;
    const leftRightId = leftChildUser?.binaryTree?.rightChildId || null;
    const rightLeftId = rightChildUser?.binaryTree?.leftChildId || null;
    const rightRightId = rightChildUser?.binaryTree?.rightChildId || null;

    const grandchildrenIds = [leftLeftId, leftRightId, rightLeftId, rightRightId].filter(
      (id): id is string => id !== null
    );

    const grandchildren =
      grandchildrenIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: grandchildrenIds } },
            include: { binaryTree: true },
          })
        : [];

    const leftLeftUser = grandchildren.find((g) => g.id === leftLeftId) || null;
    const leftRightUser = grandchildren.find((g) => g.id === leftRightId) || null;
    const rightLeftUser = grandchildren.find((g) => g.id === rightLeftId) || null;
    const rightRightUser = grandchildren.find((g) => g.id === rightRightId) || null;

    // Build the JSON structure
    const rootNode = formatNode(rootUser);
    const leftChildNode = formatNode(leftChildUser);
    const rightChildNode = formatNode(rightChildUser);
    const leftLeftNode = formatNode(leftLeftUser);
    const leftRightNode = formatNode(leftRightUser);
    const rightLeftNode = formatNode(rightLeftUser);
    const rightRightNode = formatNode(rightRightUser);

    if (leftChildNode) {
      leftChildNode.leftChild = leftLeftNode;
      leftChildNode.rightChild = leftRightNode;
    }

    if (rightChildNode) {
      rightChildNode.leftChild = rightLeftNode;
      rightChildNode.rightChild = rightRightNode;
    }

    if (rootNode) {
      rootNode.leftChild = leftChildNode;
      rootNode.rightChild = rightChildNode;
    }

    return NextResponse.json({ tree: rootNode });
  } catch (error) {
    console.error('Binary tree API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
