import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';
import { creditWallet } from '@/lib/wallet/service';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('commission:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const body = await req.json().catch(() => ({}));
    const { cycleId: requestCycleId } = body;
    const cycleId = requestCycleId || `cycle_${Date.now()}`;

    // 1. Fetch Pairing commission setting percentage
    const pairingSetting = await prisma.commissionSetting.findFirst({
      where: { type: 'PAIRING', isActive: true },
    });
    const pairingPercentage = pairingSetting?.percentage ?? new Prisma.Decimal(5); // default 5% matching

    // 2. Fetch all nodes with positive volumes on both legs
    const nodes = await prisma.binaryTree.findMany({
      where: {
        leftVolume: { gt: 0 },
        rightVolume: { gt: 0 },
      },
      include: {
        user: {
          include: {
            wallet: true,
          },
        },
      },
    });

    if (nodes.length === 0) {
      return NextResponse.json({
        message: 'No nodes with matchable volumes found.',
        payoutCount: 0,
        totalPayout: 0,
      });
    }

    let totalPayout = new Prisma.Decimal(0);
    let payoutCount = 0;
    const startDate = new Date(); // Start tracking cycle execution time

    const result = await prisma.$transaction(async (tx) => {
      for (const node of nodes) {
        const leftVol = node.leftVolume;
        const rightVol = node.rightVolume;
        const matchable = Prisma.Decimal.min(leftVol, rightVol);
        if (matchable.lte(0)) continue;

        const payout = matchable.mul(pairingPercentage).div(100);
        if (payout.lte(0)) continue;

        // Construct unique deterministic eventId for this specific user's payout in this cycle run
        const eventId = `cycle:${cycleId}:${node.userId}`;

        // Ensure user has a wallet
        let wallet = node.user.wallet;
        if (!wallet) {
          wallet = await tx.wallet.create({
            data: { userId: node.userId, balance: 0 },
          });
        }

        // A. Update volumes and cycles completed in BinaryTree
        await tx.binaryTree.update({
          where: { id: node.id },
          data: {
            leftVolume: { decrement: matchable },
            rightVolume: { decrement: matchable },
            cyclesCompleted: { increment: 1 },
          },
        });

        // B. Credit wallet matching bonus with idempotency reference
        await creditWallet(tx, {
          walletId: wallet.id,
          amount: payout,
          type: 'PAIRING_BONUS',
          description: `Pairing matching bonus cycle payout. Matched volume: ₦${matchable.toNumber()}`,
          reference: eventId,
        });

        totalPayout = totalPayout.plus(payout);
        payoutCount += 1;
      }

      // C. Save cycle run history
      const cycle = await tx.commissionCycle.create({
        data: {
          id: cycleId,
          startDate,
          endDate: new Date(),
          status: 'COMPLETED',
          totalPayout,
        },
      });

      // D. Log to Audit log
      await tx.auditLog.create({
        data: {
          adminId: auth.user!.id,
          action: 'RUN_COMMISSION_CYCLE',
          targetType: 'CommissionCycle',
          targetId: cycle.id,
          details: `Processed pairing matching cycle. Payouts: ${payoutCount} users. Total paid: ₦${totalPayout.toNumber()}. Cycle ID: ${cycle.id}`,
        },
      });

      return { payoutCount, totalPayout: totalPayout.toNumber(), cycleId: cycle.id };
    });

    return NextResponse.json({
      message: `Commission cycle executed successfully.`,
      ...result,
    });
  } catch (error: any) {
    console.error('Run commission cycle error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
