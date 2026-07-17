import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSafeApiError } from '@/lib/prisma-errors';
import { verifyWithdrawalPermission } from '@/lib/auth/withdrawal-permissions';
import { getRewardWithdrawalEligibility } from '@/lib/withdrawals/reward-eligibility';

class ApiError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

const MIN_REJECTION_REASON_LENGTH = 5;
const MAX_REJECTION_REASON_LENGTH = 1000;
const REJECTION_TYPES = new Set(['CORRECTABLE', 'FINAL']);

function validateRejectionInput(body: any) {
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  const rejectionType = typeof body.rejectionType === 'string' ? body.rejectionType.trim() : '';

  if (!reason) {
    throw new ApiError('Rejection reason is required.', 400);
  }
  if (reason.length < MIN_REJECTION_REASON_LENGTH) {
    throw new ApiError(
      `Rejection reason must be at least ${MIN_REJECTION_REASON_LENGTH} characters.`,
      400
    );
  }
  if (reason.length > MAX_REJECTION_REASON_LENGTH) {
    throw new ApiError(
      `Rejection reason must be ${MAX_REJECTION_REASON_LENGTH} characters or fewer.`,
      400
    );
  }
  if (!REJECTION_TYPES.has(rejectionType)) {
    throw new ApiError('Rejection type must be CORRECTABLE or FINAL.', 400);
  }

  return {
    reason,
    rejectionType: rejectionType as 'CORRECTABLE' | 'FINAL',
  };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyWithdrawalPermission('withdrawal:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const decision = body.decision;

    if (!decision || !['approve', 'reject'].includes(decision)) {
      return NextResponse.json(
        { message: 'Invalid decision. Must be approve or reject.' },
        { status: 400 }
      );
    }

    const rejectionInput = decision === 'reject' ? validateRejectionInput(body) : null;

    const result = await prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.findUnique({
        where: { id },
        include: {
          user: true,
          reward: true,
          rewardClaim: true,
        },
      });

      if (!withdrawal || !withdrawal.rewardId || !withdrawal.reward || !withdrawal.rewardClaimId) {
        throw new ApiError('Qualified reward withdrawal request not found.', 404);
      }

      if (withdrawal.status !== 'PENDING') {
        throw new ApiError('Only pending withdrawal requests can be reviewed.', 409);
      }

      const eligibility = await getRewardWithdrawalEligibility(tx, withdrawal.userId, {
        rewardId: withdrawal.rewardId,
      });

      if (!eligibility.qualificationComplete) {
        throw new ApiError('Qualification can no longer be verified for this reward.', 409);
      }

      if (withdrawal.reward.status !== 'WITHDRAWAL_PENDING') {
        throw new ApiError('Reward is not reserved for this pending withdrawal.', 409);
      }

      if (decision === 'approve') {
        if (!eligibility.kycComplete) {
          throw new ApiError('Cannot approve withdrawal: member KYC is not complete.', 400);
        }
        if (!eligibility.bankDetailsComplete) {
          throw new ApiError('Cannot approve withdrawal: member bank details are incomplete.', 400);
        }

        const updatedCount = await tx.withdrawal.updateMany({
          where: { id, status: 'PENDING', rewardId: withdrawal.rewardId },
          data: {
            status: 'APPROVED',
            adminNote: 'Approved by admin; awaiting manual settlement.',
            processedAt: new Date(),
            processedBy: auth.user!.id,
            approvedAt: new Date(),
          },
        });

        if (updatedCount.count !== 1) {
          throw new ApiError('Withdrawal request was already reviewed.', 409);
        }

        const rewardUpdated = await tx.reward.updateMany({
          where: { id: withdrawal.rewardId, status: 'WITHDRAWAL_PENDING' },
          data: { status: 'WITHDRAWAL_APPROVED' },
        });

        if (rewardUpdated.count !== 1) {
          throw new ApiError('Reward reservation could not be approved.', 409);
        }

        const claimUpdated = await tx.rewardClaim.updateMany({
          where: {
            id: withdrawal.rewardClaimId,
            selectedOption: 'CASH',
            status: 'PROCESSING',
          },
          data: { status: 'PROCESSING' },
        });

        if (claimUpdated.count !== 1) {
          throw new ApiError('Reward claim reservation could not be verified.', 409);
        }

        const ledgerUpdated = await tx.walletTransaction.updateMany({
          where: { reference: `reward-withdrawal:${id}:reserved`, status: 'PENDING' },
          data: { status: 'APPROVED' },
        });

        if (ledgerUpdated.count !== 1) {
          throw new ApiError('Expected withdrawal ledger entry was not updated.', 409);
        }

        await tx.auditLog.create({
          data: {
            adminId: auth.user!.id,
            action: 'APPROVE_REWARD_WITHDRAWAL',
            targetType: 'Withdrawal',
            targetId: id,
            details: JSON.stringify({
              rewardId: withdrawal.rewardId,
              rewardClaimId: withdrawal.rewardClaimId,
              amount: Number(withdrawal.amount),
            }),
          },
        });
      } else {
        if (!rejectionInput) {
          throw new ApiError('Rejection reason is required.', 400);
        }

        const { reason, rejectionType } = rejectionInput;
        const updatedCount = await tx.withdrawal.updateMany({
          where: { id, status: 'PENDING', rewardId: withdrawal.rewardId },
          data: {
            status: 'REJECTED',
            rejectionType,
            adminNote: reason,
            processedAt: new Date(),
            processedBy: auth.user!.id,
            rejectedAt: new Date(),
          },
        });

        if (updatedCount.count !== 1) {
          throw new ApiError('Withdrawal request was already reviewed.', 409);
        }

        const rewardUpdated = await tx.reward.updateMany({
          where: { id: withdrawal.rewardId, status: 'WITHDRAWAL_PENDING' },
          data: { status: rejectionType === 'CORRECTABLE' ? 'CLAIMED' : 'WITHDRAWAL_REJECTED' },
        });

        if (rewardUpdated.count !== 1) {
          throw new ApiError('Reward reservation could not be closed.', 409);
        }

        const claimUpdated = await tx.rewardClaim.updateMany({
          where: { id: withdrawal.rewardClaimId, status: 'PROCESSING' },
          data: {
            status: rejectionType === 'CORRECTABLE' ? 'PENDING_ADMIN_PROCESSING' : 'REJECTED',
            adminNote: reason,
            processedByAdminId: auth.user!.id,
            processedAt: new Date(),
          },
        });

        if (claimUpdated.count !== 1) {
          throw new ApiError('Reward claim reservation could not be released.', 409);
        }

        const ledgerUpdated = await tx.walletTransaction.updateMany({
          where: { reference: `reward-withdrawal:${id}:reserved`, status: 'PENDING' },
          data: { status: 'CANCELLED' },
        });

        if (ledgerUpdated.count !== 1) {
          throw new ApiError('Expected withdrawal ledger entry was not updated.', 409);
        }

        await tx.auditLog.create({
          data: {
            adminId: auth.user!.id,
            action: 'REJECT_REWARD_WITHDRAWAL',
            targetType: 'Withdrawal',
            targetId: id,
            details: JSON.stringify({
              rewardId: withdrawal.rewardId,
              rewardClaimId: withdrawal.rewardClaimId,
              amount: Number(withdrawal.amount),
              reason,
              rejectionType,
            }),
          },
        });
      }

      return tx.withdrawal.findUnique({
        where: { id },
        include: { user: true, reward: true, rewardClaim: true },
      });
    });

    return NextResponse.json({
      message:
        decision === 'approve'
          ? 'Withdrawal approved and awaiting manual settlement.'
          : 'Withdrawal rejected and reservation closed.',
      withdrawal: result,
    });
  } catch (error: any) {
    console.error('Process reward withdrawal error:', error);
    const safeError = getSafeApiError(error, 'Unable to process reward withdrawal.');
    return NextResponse.json({ message: safeError.message }, { status: safeError.status });
  }
}
