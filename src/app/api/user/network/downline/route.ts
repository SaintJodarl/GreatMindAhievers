import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getStageDisplayName } from '@/lib/qualification/constants';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const loggedInUserId = currentUser.id;
    const { searchParams } = new URL(req.url);

    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = searchParams.get('offset')
      ? parseInt(searchParams.get('offset') || '0')
      : (parseInt(searchParams.get('page') || '1') - 1) * limit;
    const leg = searchParams.get('leg')?.toUpperCase();
    const status = searchParams.get('status')?.toUpperCase();
    const activation = searchParams.get('activation')?.toUpperCase();
    const stage = searchParams.get('stage');
    const relationship = searchParams.get('relationship')?.toLowerCase();

    // Fetch user's binary tree path to identify their downline
    const userTree = await prisma.binaryTree.findUnique({
      where: { userId: loggedInUserId },
    });

    if (!userTree) {
      return NextResponse.json({
        downlines: [],
        pagination: {
          total: 0,
          limit,
          offset,
          page: 1,
          totalPages: 0,
        },
      });
    }

    let pathWhere: any = { path: { startsWith: userTree.path + '/' } };

    if (leg === 'LEFT' || leg === 'RIGHT') {
      const childId = leg === 'LEFT' ? userTree.leftChildId : userTree.rightChildId;
      if (!childId) {
        return NextResponse.json({
          downlines: [],
          pagination: {
            total: 0,
            limit,
            offset,
            page: Math.floor(offset / limit) + 1,
            totalPages: 0,
          },
        });
      }

      const childTree = await prisma.binaryTree.findUnique({
        where: { userId: childId },
        select: { path: true },
      });

      pathWhere = childTree
        ? {
            OR: [{ path: childTree.path }, { path: { startsWith: `${childTree.path}/` } }],
          }
        : { userId: '__missing_leg__' };
    }

    const userFilters: any = {};
    if (status) {
      userFilters.status = status;
    }
    if (stage) {
      userFilters.currentStage = stage;
    }
    if (activation) {
      userFilters.activationCode = {
        is: {
          status: activation,
        },
      };
    }
    if (relationship === 'direct') {
      userFilters.sponsorId = loggedInUserId;
    } else if (relationship === 'indirect') {
      userFilters.sponsorId = { not: loggedInUserId };
    }

    const where = {
      ...pathWhere,
      ...(Object.keys(userFilters).length ? { user: userFilters } : {}),
    };

    const [nodes, total] = await Promise.all([
      prisma.binaryTree.findMany({
        where,
        include: {
          user: {
            include: {
              placement: {
                select: {
                  id: true,
                  name: true,
                },
              },
              activationCode: {
                select: {
                  status: true,
                },
              },
            },
          },
        },
        orderBy: { depth: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.binaryTree.count({ where }),
    ]);

    const downlines = nodes.map((node) => {
      const currentStageName = getStageDisplayName(node.user.currentStage);

      return {
        id: node.user.id,
        name: node.user.name || 'Unknown',
        email: node.user.email || '',
        status: node.user.status,
        currentStage: node.user.currentStage,
        currentStageName,
        activationStatus: node.user.activationCode?.status ?? null,
        relationship: node.user.sponsorId === loggedInUserId ? 'DIRECT' : 'INDIRECT',
        rank: currentStageName,
        depth: node.depth - userTree.depth,
        placementParent: node.user.placement
          ? {
              id: node.user.placement.id,
              name: node.user.placement.name || 'Unknown',
            }
          : null,
        position: node.user.binaryPosition || 'N/A',
        joinDate: node.user.createdAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      };
    });

    return NextResponse.json({
      downlines,
      pagination: {
        total,
        limit,
        offset,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Downlines API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
