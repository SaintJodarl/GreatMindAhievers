import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = currentUser.id;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const where = {
      sponsorId: userId,
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          createdAt: true,
          binaryPosition: true,
          binaryTree: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const referrals = users.map((u) => ({
      id: u.id,
      name: u.name || 'Unknown User',
      email: u.email || '',
      status: u.status || 'PENDING',
      registrationDate: u.createdAt.toISOString(),
      placementPosition: u.binaryPosition || 'N/A',
      isPlacedInTree: !!u.binaryTree,
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
  } catch (error: any) {
    console.error('Referral history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
