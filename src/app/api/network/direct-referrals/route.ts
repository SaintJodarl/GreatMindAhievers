import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getBinaryTreeScope, resolveRelativeBinaryLeg } from '@/lib/network/genealogy';
import { getStageDisplayName } from '@/lib/qualification/constants';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = currentUser.id;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all';
    const offset = (page - 1) * limit;

    const where: any = { sponsorId: userId };

    if (search) {
      where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
    }

    if (filter === 'active') {
      where.status = 'ACTIVE';
    } else if (filter === 'inactive') {
      where.status = { not: 'ACTIVE' };
    }

    const sponsorTree = await getBinaryTreeScope(prisma, userId);

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        binaryPosition: true,
        status: true,
        currentStage: true,
        createdAt: true,
        placement: {
          select: {
            id: true,
            name: true,
          },
        },
        binaryTree: {
          select: {
            path: true,
            parentId: true,
          },
        },
        _count: {
          select: { sponsored: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const filteredUsers = users.filter((user) => {
      const leg = resolveRelativeBinaryLeg(sponsorTree, user.binaryTree);
      if (filter === 'left') return leg === 'LEFT';
      if (filter === 'right') return leg === 'RIGHT';
      return true;
    });

    const total = filteredUsers.length;
    const pagedUsers = filteredUsers.slice(offset, offset + limit);

    const referrals = pagedUsers.map((user) => ({
      id: user.id,
      name: user.name || 'Unknown',
      email: user.email || '',
      referralCode: user.referralCode,
      position: user.binaryPosition || 'N/A',
      binaryLegRelativeToSponsor: resolveRelativeBinaryLeg(sponsorTree, user.binaryTree),
      status: user.status || 'PENDING',
      currentStage: user.currentStage,
      currentStageName: getStageDisplayName(user.currentStage),
      placementParent: user.placement
        ? {
            id: user.placement.id,
            name: user.placement.name || 'Unknown',
          }
        : null,
      binaryParentId: user.binaryTree?.parentId ?? null,
      downlineCount: user._count.sponsored,
      joinedAt: user.createdAt.toISOString(),
    }));

    return NextResponse.json({
      referrals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Direct referrals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
