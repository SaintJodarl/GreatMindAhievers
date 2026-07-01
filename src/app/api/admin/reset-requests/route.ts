import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('member:read');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all'; // all, PENDING, APPROVED, COMPLETED, REJECTED
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    const where: any = {};
    if (status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        {
          user: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.passwordResetRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { requestedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.passwordResetRequest.count({ where }),
    ]);

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('List reset requests error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
