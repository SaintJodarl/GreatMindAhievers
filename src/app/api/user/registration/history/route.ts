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

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const where = {
      sponsorId: userId,
      regCode: {
        isNot: null,
      },
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          binaryPosition: true,
          regCode: {
            select: {
              code: true,
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

    const registrations = users.map((u) => ({
      id: u.id,
      name: u.name || 'Unknown User',
      email: u.email || '',
      registrationDate: u.createdAt.toISOString(),
      placementPosition: u.binaryPosition || 'LEFT',
      codeUsed: u.regCode?.code || 'N/A',
    }));

    return NextResponse.json({
      registrations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Registration history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
