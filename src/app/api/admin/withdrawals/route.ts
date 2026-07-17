import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWithdrawalPermission } from '@/lib/auth/withdrawal-permissions';
import { getStageDisplayName } from '@/lib/qualification/constants';
import { getRewardWithdrawalEligibility } from '@/lib/withdrawals/reward-eligibility';

function safeDetails(details: string) {
  try {
    return JSON.parse(details);
  } catch {
    return { raw: details };
  }
}

async function serializeWithdrawal(withdrawal: any) {
  const verification =
    withdrawal.rewardId && withdrawal.userId
      ? await getRewardWithdrawalEligibility(prisma, withdrawal.userId, {
          rewardId: withdrawal.rewardId,
        })
      : null;

  return {
    id: withdrawal.id,
    userId: withdrawal.userId,
    amount: Number(withdrawal.amount || 0),
    method: withdrawal.method,
    details: safeDetails(withdrawal.details),
    status: withdrawal.status,
    adminNote: withdrawal.adminNote,
    processedAt: withdrawal.processedAt,
    processedBy: withdrawal.processedBy,
    approvedAt: withdrawal.approvedAt,
    rejectedAt: withdrawal.rejectedAt,
    rejectionType: withdrawal.rejectionType,
    paidAt: withdrawal.paidAt,
    paymentReference: withdrawal.paymentReference,
    paymentNote: withdrawal.paymentNote,
    createdAt: withdrawal.createdAt,
    user: withdrawal.user,
    reward: withdrawal.reward
      ? {
          id: withdrawal.reward.id,
          stage: withdrawal.reward.stage,
          stageName: getStageDisplayName(withdrawal.reward.stage),
          rewardValue: Number(withdrawal.reward.rewardValue || 0),
          rewardPackage: withdrawal.reward.rewardPackage,
          status: withdrawal.reward.status,
        }
      : null,
    rewardClaim: withdrawal.rewardClaim,
    qualificationVerification: verification
      ? {
          qualificationComplete: verification.qualificationComplete,
          completedRequirement: verification.completedRequirement,
          totalRequirement: verification.totalRequirement,
          remainingRequirement: verification.remainingRequirement,
          leftCompleted: verification.leftCompleted,
          leftRequired: verification.leftRequired,
          rightCompleted: verification.rightCompleted,
          rightRequired: verification.rightRequired,
          cashOptionSelected: verification.cashOptionSelected,
          kycComplete: verification.kycComplete,
          bankDetailsComplete: verification.bankDetailsComplete,
          blockingReasons: verification.blockingReasons,
        }
      : null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyWithdrawalPermission('withdrawal:read');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all'; // all, PENDING, APPROVED, REJECTED, PAID
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    const where: any = {
      rewardId: { not: null },
    };

    if (status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { method: { contains: search } },
        { details: { contains: search } },
        {
          user: {
            OR: [{ name: { contains: search } }, { email: { contains: search } }],
          },
        },
      ];
    }

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              referralCode: true,
              kycStatus: true,
              bankName: true,
              accountNumber: true,
              accountName: true,
            },
          },
          reward: true,
          rewardClaim: true,
        },
        skip: offset,
        take: limit,
      }),
      prisma.withdrawal.count({ where }),
    ]);

    return NextResponse.json({
      withdrawals: await Promise.all(withdrawals.map(serializeWithdrawal)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('List withdrawals error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
