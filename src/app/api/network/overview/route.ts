import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const [directReferralsCount, leftLegCount, rightLegCount, binaryTree, user] = await Promise.all(
      [
        prisma.user.count({ where: { sponsorId: userId } }),
        prisma.binaryTree.count({
          where: { path: { startsWith: `${userId}/` }, depth: { gte: 1 } },
        }),
        prisma.binaryTree.count({
          where: { path: { startsWith: `${userId}/` }, depth: { gte: 1 } },
        }),
        prisma.binaryTree.findUnique({ where: { userId } }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { binaryPosition: true, placementId: true },
        }),
      ]
    );

    const totalDownlines = leftLegCount + rightLegCount;
    const currentBinaryPosition = binaryTree?.path || 'ROOT';
    const placementPosition = user?.binaryPosition || 'N/A';
    const placementParent = user?.placementId ? 'HAS_PLACEMENT' : 'ROOT';

    return NextResponse.json({
      directReferrals: directReferralsCount,
      totalDownlines,
      leftLegCount,
      rightLegCount,
      currentBinaryPosition: currentBinaryPosition,
      placementPosition,
      placementParent,
    });
  } catch (error) {
    console.error('Network overview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
