import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWithdrawalPermission } from '@/lib/auth/withdrawal-permissions';

class ApiError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyWithdrawalPermission('withdrawal:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const paymentReference =
      typeof body.paymentReference === 'string' ? body.paymentReference.trim() : '';
    const paymentNote = typeof body.paymentNote === 'string' ? body.paymentNote.trim() : '';
    const paymentDate = body.paymentDate ? new Date(body.paymentDate) : new Date();

    if (!paymentReference) {
      return NextResponse.json({ message: 'Payment reference is required.' }, { status: 400 });
    }
    if (Number.isNaN(paymentDate.getTime())) {
      return NextResponse.json({ message: 'A valid payment date is required.' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.findUnique({
        where: { id },
        include: { reward: true, rewardClaim: true },
      });

      if (!withdrawal || !withdrawal.rewardId || !withdrawal.reward || !withdrawal.rewardClaimId) {
        throw new ApiError('Qualified reward withdrawal request not found.', 404);
      }

      if (withdrawal.status !== 'APPROVED') {
        throw new ApiError('Only approved withdrawals can be marked as paid.', 409);
      }

      if (withdrawal.reward.status !== 'WITHDRAWAL_APPROVED') {
        throw new ApiError('Reward is not approved for manual settlement.', 409);
      }

      const updatedCount = await tx.withdrawal.updateMany({
        where: { id, status: 'APPROVED', rewardId: withdrawal.rewardId },
        data: {
          status: 'PAID',
          paidAt: paymentDate,
          paymentReference,
          paymentNote: paymentNote || null,
          processedAt: paymentDate,
          processedBy: auth.user!.id,
        },
      });

      if (updatedCount.count !== 1) {
        throw new ApiError('Withdrawal was already finalized.', 409);
      }

      const rewardUpdated = await tx.reward.updateMany({
        where: { id: withdrawal.rewardId, status: 'WITHDRAWAL_APPROVED' },
        data: { status: 'PAID' },
      });

      if (rewardUpdated.count !== 1) {
        throw new ApiError('Reward settlement could not be finalized.', 409);
      }

      const claimUpdated = await tx.rewardClaim.updateMany({
        where: { id: withdrawal.rewardClaimId, status: 'PROCESSING' },
        data: {
          status: 'PAID',
          processedByAdminId: auth.user!.id,
          processedAt: paymentDate,
        },
      });

      if (claimUpdated.count !== 1) {
        throw new ApiError('Reward claim settlement could not be finalized.', 409);
      }

      const ledgerUpdated = await tx.walletTransaction.updateMany({
        where: {
          reference: `reward-withdrawal:${id}:reserved`,
          status: 'APPROVED',
        },
        data: {
          status: 'COMPLETED',
          metadata: JSON.stringify({
            withdrawalId: id,
            rewardId: withdrawal.rewardId,
            rewardClaimId: withdrawal.rewardClaimId,
            paymentReference,
            paidAt: paymentDate.toISOString(),
          }),
        },
      });

      if (ledgerUpdated.count !== 1) {
        throw new ApiError('Expected withdrawal ledger entry was not updated.', 409);
      }

      await tx.auditLog.create({
        data: {
          adminId: auth.user!.id,
          action: 'MARK_REWARD_WITHDRAWAL_PAID',
          targetType: 'Withdrawal',
          targetId: id,
          details: JSON.stringify({
            rewardId: withdrawal.rewardId,
            rewardClaimId: withdrawal.rewardClaimId,
            amount: Number(withdrawal.amount),
            paymentReference,
            paymentDate: paymentDate.toISOString(),
          }),
        },
      });

      return tx.withdrawal.findUnique({
        where: { id },
        include: { user: true, reward: true, rewardClaim: true },
      });
    });

    return NextResponse.json({
      message: 'Withdrawal marked as paid.',
      withdrawal: result,
    });
  } catch (error: any) {
    console.error('Mark reward withdrawal paid error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status });
  }
}
