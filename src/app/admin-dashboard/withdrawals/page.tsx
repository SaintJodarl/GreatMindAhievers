import { prisma } from '@/lib/prisma';
import React from 'react';
import AdminWithdrawalsClient from './components/AdminWithdrawalsClient';
import { getSafeApiError } from '@/lib/prisma-errors';
import { getStageDisplayName } from '@/lib/qualification/constants';
import { getRewardWithdrawalEligibility } from '@/lib/withdrawals/reward-eligibility';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Withdrawals | Admin',
};

export default async function WithdrawalsPage() {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      where: {
        rewardId: { not: null },
      },
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
    });

    // Serialize date fields for Client Component compatibility
    const serializedWithdrawals = await Promise.all(
      withdrawals.map(async (w) => {
        const verification = w.rewardId
          ? await getRewardWithdrawalEligibility(prisma, w.userId, { rewardId: w.rewardId })
          : null;

        return {
          id: w.id,
          userId: w.userId,
          amount: Number(w.amount || 0),
          method: w.method,
          details: (() => {
            try {
              return JSON.parse(w.details);
            } catch {
              return { raw: w.details };
            }
          })(),
          status: w.status,
          adminNote: w.adminNote,
          processedAt: w.processedAt ? w.processedAt.toISOString() : null,
          processedBy: w.processedBy,
          approvedAt: w.approvedAt ? w.approvedAt.toISOString() : null,
          rejectedAt: w.rejectedAt ? w.rejectedAt.toISOString() : null,
          rejectionType: w.rejectionType,
          paidAt: w.paidAt ? w.paidAt.toISOString() : null,
          paymentReference: w.paymentReference,
          paymentNote: w.paymentNote,
          createdAt: w.createdAt.toISOString(),
          updatedAt: w.updatedAt.toISOString(),
          user: w.user,
          reward: w.reward
            ? {
                id: w.reward.id,
                stage: w.reward.stage,
                stageName: getStageDisplayName(w.reward.stage),
                rewardValue: Number(w.reward.rewardValue || 0),
                rewardPackage: w.reward.rewardPackage,
                status: w.reward.status,
              }
            : null,
          rewardClaim: w.rewardClaim,
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
      })
    );

    return <AdminWithdrawalsClient initialWithdrawals={serializedWithdrawals} />;
  } catch (error) {
    console.error('Admin withdrawals page error:', error);
    const safeError = getSafeApiError(error, 'Unable to load reward withdrawals.');
    return <AdminWithdrawalsClient initialWithdrawals={[]} initialError={safeError.message} />;
  }
}
