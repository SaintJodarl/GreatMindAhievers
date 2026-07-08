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

    const where = {
      path: { startsWith: userTree.path + '/' },
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
      const leftVol = node.leftVolume?.toNumber() || 0;
      const rightVol = node.rightVolume?.toNumber() || 0;

      return {
        id: node.user.id,
        name: node.user.name || 'Unknown',
        email: node.user.email || '',
        status: node.user.status,
        rank: determineRank(leftVol, rightVol),
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
