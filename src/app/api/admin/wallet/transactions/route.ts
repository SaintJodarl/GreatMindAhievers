import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('wallet:read');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type') || 'all'; // all, CREDIT, DEBIT, PAIRING_BONUS, etc.
    const status = searchParams.get('status') || 'all'; // all, COMPLETED, PENDING, FAILED, REVERSED
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    const where: any = {};

    if (type !== 'all') {
      where.type = type;
    }
    if (status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { reference: { contains: search } },
        { description: { contains: search } },
        {
          wallet: {
            user: {
              OR: [{ name: { contains: search } }, { email: { contains: search } }],
            },
          },
        },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        skip: offset,
        take: limit,
      }),
      prisma.walletTransaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Wallet transactions list error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
