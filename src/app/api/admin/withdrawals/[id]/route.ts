import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWithdrawalPermission } from '@/lib/auth/withdrawal-permissions';
import { getRewardWithdrawalEligibility } from '@/lib/withdrawals/reward-eligibility';
import { getStageDisplayName } from '@/lib/qualification/constants';

function safeDetails(details: string) {
  try {
    return JSON.parse(details);
  } catch {
    return { raw: details };
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyWithdrawalPermission('withdrawal:read');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const { id } = await params;
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
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
    });

    if (!withdrawal || !withdrawal.rewardId) {
      return NextResponse.json(
        { message: 'Qualified reward withdrawal request not found.' },
        { status: 404 }
      );
    }

    const verification = await getRewardWithdrawalEligibility(prisma, withdrawal.userId, {
      rewardId: withdrawal.rewardId,
    });

    return NextResponse.json({
      withdrawal: {
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
      },
      qualificationVerification: verification,
    });
  } catch (error: any) {
    console.error('Admin withdrawal detail error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
