import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('kyc:read');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all'; // all, SUBMITTED, APPROVED, REJECTED
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    const where: any = {};

    if (status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { phone: { contains: search } },
        { idNumber: { contains: search } },
        {
          user: {
            OR: [{ name: { contains: search } }, { email: { contains: search } }],
          },
        },
      ];
    }

    const [submissions, total] = await Promise.all([
      prisma.kYCSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, kycStatus: true },
          },
        },
        skip: offset,
        take: limit,
      }),
      prisma.kYCSubmission.count({ where }),
    ]);

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('List KYC error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
