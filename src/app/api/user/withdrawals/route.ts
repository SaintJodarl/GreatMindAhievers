import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { getRewardWithdrawalEligibility } from '@/lib/withdrawals/reward-eligibility';
import { getStageDisplayName } from '@/lib/qualification/constants';

class ApiError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

function safeDetails(details: string) {
  try {
    return JSON.parse(details);
  } catch {
    return { raw: details };
  }
}

function serializeWithdrawal(withdrawal: any) {
  return {
    id: withdrawal.id,
    amount: Number(withdrawal.amount || 0),
    method: withdrawal.method,
    details: safeDetails(withdrawal.details),
    status: withdrawal.status,
    adminNote: withdrawal.adminNote,
    processedAt: withdrawal.processedAt,
    approvedAt: withdrawal.approvedAt,
    rejectedAt: withdrawal.rejectedAt,
    rejectionType: withdrawal.rejectionType,
    paidAt: withdrawal.paidAt,
    paymentReference: withdrawal.paymentReference,
    paymentNote: withdrawal.paymentNote,
    createdAt: withdrawal.createdAt,
    reward: withdrawal.reward
      ? {
          id: withdrawal.reward.id,
          stage: withdrawal.reward.stage,
          stageName: getStageDisplayName(withdrawal.reward.stage),
          rewardValue: Number(withdrawal.reward.rewardValue || 0),
          status: withdrawal.reward.status,
        }
      : null,
    rewardClaim: withdrawal.rewardClaim
      ? {
          id: withdrawal.rewardClaim.id,
          selectedOption: withdrawal.rewardClaim.selectedOption,
          status: withdrawal.rewardClaim.status,
        }
      : null,
  };
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const [eligibility, withdrawals] = await Promise.all([
      getRewardWithdrawalEligibility(prisma, currentUser.id),
      prisma.withdrawal.findMany({
        where: {
          userId: currentUser.id,
          rewardId: { not: null },
        },
        include: {
          reward: true,
          rewardClaim: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      eligibility,
      withdrawals: withdrawals.map(serializeWithdrawal),
    });
  } catch (error: any) {
    console.error('Reward withdrawal GET error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rewardId = typeof body.rewardId === 'string' ? body.rewardId : null;
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : '';

    if (!rewardId) {
      return NextResponse.json({ message: 'Reward ID is required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const eligibility = await getRewardWithdrawalEligibility(tx, currentUser.id, { rewardId });

      if (!eligibility.eligible || !eligibility.rewardId || !eligibility.rewardClaimId) {
        throw new ApiError(
          eligibility.blockingReasons[0] || 'Reward is not eligible for withdrawal',
          403
        );
      }

      const reserved = await tx.reward.updateMany({
        where: {
          id: eligibility.rewardId,
          userId: currentUser.id,
          status: 'CLAIMED',
        },
        data: {
          status: 'WITHDRAWAL_PENDING',
        },
      });

      if (reserved.count !== 1) {
        throw new ApiError('This reward is already reserved or no longer eligible.', 409);
      }

      const claimReserved = await tx.rewardClaim.updateMany({
        where: {
          id: eligibility.rewardClaimId,
          userId: currentUser.id,
          selectedOption: 'CASH',
          status: { in: ['PENDING_ADMIN_PROCESSING', 'PROCESSING'] },
        },
        data: {
          status: 'PROCESSING',
        },
      });

      if (claimReserved.count !== 1) {
        throw new ApiError('This reward claim is already being processed.', 409);
      }

      const wallet = await tx.wallet.upsert({
        where: { userId: currentUser.id },
        create: { userId: currentUser.id, balance: new Prisma.Decimal(0) },
        update: {},
      });

      const details = JSON.stringify({
        bankName: eligibility.bankDetails.bankName,
        accountNumber: eligibility.bankDetails.accountNumber,
        accountName: eligibility.bankDetails.accountName,
        note,
        rewardStage: eligibility.rewardStage,
        rewardStageName: eligibility.rewardStageName,
      });

      const withdrawal = await tx.withdrawal.create({
        data: {
          userId: currentUser.id,
          rewardId: eligibility.rewardId,
          rewardClaimId: eligibility.rewardClaimId,
          qualificationStage: eligibility.rewardStage,
          rewardStatusSnapshot: eligibility.rewardStatus,
          amount: new Prisma.Decimal(eligibility.rewardAmount || 0),
          method: 'BANK_TRANSFER',
          details,
          status: 'PENDING',
        },
        include: {
          reward: true,
          rewardClaim: true,
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: currentUser.id,
          type: 'REWARD_WITHDRAWAL_REQUEST',
          amount: new Prisma.Decimal(eligibility.rewardAmount || 0),
          balanceAfter: wallet.balance,
          description: `Reward withdrawal request reserved for ${eligibility.rewardStageName}`,
          reference: `reward-withdrawal:${withdrawal.id}:reserved`,
          metadata: JSON.stringify({
            withdrawalId: withdrawal.id,
            rewardId: eligibility.rewardId,
            rewardClaimId: eligibility.rewardClaimId,
            stage: eligibility.rewardStage,
          }),
          status: 'PENDING',
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: 'SYSTEM',
          action: 'REWARD_WITHDRAWAL_REQUESTED',
          targetType: 'Withdrawal',
          targetId: withdrawal.id,
          details: JSON.stringify({
            userId: currentUser.id,
            rewardId: eligibility.rewardId,
            rewardClaimId: eligibility.rewardClaimId,
            stage: eligibility.rewardStage,
            amount: eligibility.rewardAmount,
          }),
        },
      });

      return withdrawal;
    });

    return NextResponse.json({
      message: 'Reward withdrawal request submitted for admin review.',
      withdrawal: serializeWithdrawal(result),
    });
  } catch (error: any) {
    console.error('Reward withdrawal POST error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status });
  }
}
