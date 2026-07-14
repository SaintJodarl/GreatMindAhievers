import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';
import { getStageDisplayName, getStageNumberLabel } from '@/lib/qualification/constants';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('member:read');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all'; // all, ACTIVE, PENDING, INACTIVE
    const kycStatus = searchParams.get('kycStatus') || 'all'; // all, SUBMITTED, APPROVED, REJECTED, PENDING
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    const where: any = {
      role: 'MEMBER',
    };

    if (status !== 'all') {
      where.status = status;
    }
    if (kycStatus !== 'all') {
      where.kycStatus = kycStatus;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { referralCode: { contains: search } },
      ];
    }

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          currentStage: true,
          highestStage: true,
          stageUpdatedAt: true,
          compensationPlanStatus: true,
          finalStageCompletedAt: true,
          referralCode: true,
          kycStatus: true,
          createdAt: true,
          leftLegCount: true,
          rightLegCount: true,
          totalDownlines: true,
          wallet: {
            select: { balance: true },
          },
        },
        skip: offset,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      members: members.map((member) => ({
        ...member,
        currentStageName: getStageDisplayName(member.currentStage),
        currentStageNumberLabel: getStageNumberLabel(member.currentStage),
        highestStageName: getStageDisplayName(member.highestStage),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('List members error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
