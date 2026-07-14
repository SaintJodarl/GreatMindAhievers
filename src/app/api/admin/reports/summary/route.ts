import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';
import { STAGE_ORDER, getStageDisplayName, normalizeStageId } from '@/lib/qualification/constants';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('reports:read');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    // Run counts and sums in parallel using database aggregate methods (which are fast and index-backed)
    const [
      totalUsers,
      activeUsers,
      kycStatsGrouped,
      walletSum,
      withdrawalsSummary,
      commissionsSummary,
      stageStatsGrouped,
      diamondCompleted,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.groupBy({
        by: ['kycStatus'],
        _count: true,
      }),
      prisma.wallet.aggregate({
        _sum: { balance: true },
      }),
      prisma.withdrawal.groupBy({
        by: ['status'],
        _sum: { amount: true },
        _count: true,
      }),
      prisma.walletTransaction.groupBy({
        by: ['type'],
        _sum: { amount: true },
        where: {
          status: 'COMPLETED',
          type: { in: ['REFERRAL_BONUS', 'PAIRING_BONUS', 'LEADERSHIP_BONUS'] },
        },
      }),
      prisma.user.groupBy({
        by: ['currentStage'],
        _count: true,
        where: { role: 'MEMBER' },
      }),
      prisma.user.count({
        where: {
          role: 'MEMBER',
          compensationPlanStatus: 'COMPLETED',
        },
      }),
    ]);

    // Format KYC status statistics
    const kycStats: Record<string, number> = { PENDING: 0, SUBMITTED: 0, APPROVED: 0, REJECTED: 0 };
    for (const stat of kycStatsGrouped) {
      if (stat.kycStatus) {
        kycStats[stat.kycStatus] = stat._count;
      }
    }

    // Format withdrawal statistics
    const withdrawals = {
      pendingCount: 0,
      pendingAmount: 0,
      approvedCount: 0,
      approvedAmount: 0,
      rejectedCount: 0,
      rejectedAmount: 0,
    };
    for (const w of withdrawalsSummary) {
      const amt = w._sum.amount ? Number(w._sum.amount) : 0;
      const count = w._count || 0;
      if (w.status === 'PENDING') {
        withdrawals.pendingCount = count;
        withdrawals.pendingAmount = amt;
      } else if (w.status === 'APPROVED') {
        withdrawals.approvedCount = count;
        withdrawals.approvedAmount = amt;
      } else if (w.status === 'REJECTED') {
        withdrawals.rejectedCount = count;
        withdrawals.rejectedAmount = amt;
      }
    }

    // Format commission payout statistics
    const commissions = {
      referral: 0,
      pairing: 0,
      leadership: 0,
      total: 0,
    };
    for (const comm of commissionsSummary) {
      const amt = comm._sum.amount ? Number(comm._sum.amount) : 0;
      commissions.total += amt;
      if (comm.type === 'REFERRAL_BONUS') commissions.referral = amt;
      if (comm.type === 'PAIRING_BONUS') commissions.pairing = amt;
      if (comm.type === 'LEADERSHIP_BONUS') commissions.leadership = amt;
    }

    const stages = STAGE_ORDER.map((stage) => ({
      stage,
      stageName: getStageDisplayName(stage),
      count: 0,
    }));
    const stageIndex = new Map(stages.map((item) => [item.stage, item]));
    for (const stat of stageStatsGrouped) {
      const stage = normalizeStageId(stat.currentStage);
      const existing = stageIndex.get(stage);
      if (existing) {
        existing.count += stat._count;
      }
    }

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
      kyc: kycStats,
      wallet: {
        totalCachedBalance: walletSum._sum.balance ? Number(walletSum._sum.balance) : 0,
      },
      withdrawals,
      commissions,
      stages: {
        distribution: stages,
        diamondCompleted,
      },
    });
  } catch (error: any) {
    console.error('Reports summary error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
