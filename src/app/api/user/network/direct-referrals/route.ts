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

    const loggedInUserId = (session.user as any).id;
    const { searchParams } = new URL(req.url);

    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = searchParams.get('offset')
      ? parseInt(searchParams.get('offset') || '0')
      : (parseInt(searchParams.get('page') || '1') - 1) * limit;

    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where: any = {
      sponsorId: loggedInUserId,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
    }

    const [referrals, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          kycStatus: true,
          leftLegCount: true,
          rightLegCount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      referrals,
      pagination: {
        total,
        limit,
        offset,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Direct referrals API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
