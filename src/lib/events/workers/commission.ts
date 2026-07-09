import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function processCommissionCalc(event: any) {
  const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;
  const sourceUserId = payload.sourceUserId || event.userId;
  const amountPerLevel = Array.isArray(payload.amounts) ? payload.amounts : null;

  // Optimize: Load path directly without recursive tree traversal
  const sourceUser = await prisma.user.findUnique({
    where: { id: sourceUserId },
    select: { id: true, path: true },
  });
  if (!sourceUser || !sourceUser.path) return;

  // Current paths are slash-delimited ("root/sponsor/buyer"); keep dot support for older rows.
  const pathParts = sourceUser.path.includes('/')
    ? sourceUser.path.split('/').filter(Boolean)
    : sourceUser.path.split('.').filter(Boolean);
  const uplines = pathParts.filter((id) => id !== 'root' && id !== sourceUserId);

  if (uplines.length === 0) return;

  const maxLevels = amountPerLevel?.length ?? Math.min(uplines.length, 5);

  // Independent Iteration ensures partial-failure recovery
  for (let level = 1; level <= maxLevels; level++) {
    const uplineId = uplines[uplines.length - level];
    if (!uplineId) break;

    const rawAmount = amountPerLevel ? amountPerLevel[level - 1] : payload.amount;
    if (rawAmount === undefined || rawAmount === null) continue;

    const commissionAmount = amountPerLevel
      ? new Prisma.Decimal(rawAmount)
      : new Prisma.Decimal(rawAmount).mul('0.1');
    if (commissionAmount.lte(0)) continue;

    const uniqueCommissionEventId = payload.orderId
      ? `ref:${payload.orderId}:${sourceUserId}:level${level}`
      : `${event.idempotencyKey}_comm_${uplineId}_level${level}`;

    try {
      await prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.upsert({
          where: { userId: uplineId },
          update: {},
          create: {
            id: uplineId,
            userId: uplineId,
            balance: new Prisma.Decimal(0),
          },
        });

        // 1. Insert Commission Log (Fails if duplicate)
        await tx.commissionLog.create({
          data: {
            eventId: uniqueCommissionEventId,
            userId: uplineId,
            fromUserId: sourceUserId,
            level,
            amount: commissionAmount,
            status: 'COMPLETED',
          },
        });

        // 2. Safely emit Outbox Wallet Credit Event instead of direct Wallet mutation
        await tx.outboxEvent.create({
          data: {
            type: 'WALLET_CREDIT',
            userId: uplineId,
            payload: {
              walletId: wallet.id,
              userId: uplineId,
              amount: commissionAmount.toString(),
              type: 'REFERRAL_BONUS',
              description: `Commission from ${sourceUserId} at level ${level}`,
            },
            idempotencyKey: uniqueCommissionEventId,
            executionMode: event.executionMode || 'GREEN',
            status: 'OUTBOX_PENDING',
            nextRetryAt: new Date(),
          },
        });
      });
    } catch (error: any) {
      // Idempotent recovery step
      if (error.code === 'P2002') {
        console.log(`[Idempotency] Commission ${uniqueCommissionEventId} already paid. Skipping.`);
        continue;
      }
      throw error; // Bubble up to trigger cron retry
    }
  }
}
