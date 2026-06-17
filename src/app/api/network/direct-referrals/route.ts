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

    if (filter === 'left') {
      where.binaryPosition = 'LEFT';
    } else if (filter === 'right') {
      where.binaryPosition = 'RIGHT';
    } else if (filter === 'active') {
      where.status = 'ACTIVE';
    } else if (filter === 'inactive') {
      where.status = { not: 'ACTIVE' };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          binaryPosition: true,
          status: true,
          createdAt: true,
          _count: {
            select: { sponsored: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const referrals = users.map((user) => ({
      id: user.id,
      name: user.name || 'Unknown',
      email: user.email || '',
      position: user.binaryPosition || 'N/A',
      status: user.status || 'PENDING',
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
