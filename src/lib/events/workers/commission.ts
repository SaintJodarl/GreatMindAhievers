import { prisma } from '@/lib/prisma';

export async function processCommissionCalc(event: any) {
  const { sourceUserId, amount, type } = event.payload;

  // Optimize: Load path directly without recursive tree traversal
  const sourceUser = await prisma.user.findUnique({ where: { id: sourceUserId } });
  if (!sourceUser || !sourceUser.path) return;

  // Path format: ".admin.user1.user2." -> resolve up to 5 levels up
  const pathParts = sourceUser.path.split('.').filter(Boolean);
  const uplines = pathParts.slice(-5).reverse();

  if (uplines.length === 0) return;

  // Configurable rates per depth could be loaded here. Using flat rate for demonstration.
  const commissionRate = 0.1;

  // Independent Iteration ensures partial-failure recovery
  for (let i = 0; i < uplines.length; i++) {
    const uplineId = uplines[i];
    const commissionAmount = amount * commissionRate;

    // ONE consistent rule for idempotency
    const uniqueCommissionEventId = `${event.idempotencyKey}_comm_${uplineId}`;

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Insert Commission Log (Fails if duplicate)
        await tx.commissionLog.create({
          data: {
            eventId: uniqueCommissionEventId,
            userId: uplineId,
            fromUserId: sourceUserId,
            level: i + 1,
            amount: commissionAmount,
          },
        });

        // 2. Safely emit Outbox Wallet Credit Event instead of direct Wallet mutation
        await tx.outboxEvent.create({
          data: {
            type: 'WALLET_CREDIT',
            userId: uplineId,
            payload: {
              walletId: uplineId, // Assuming walletId == userId based on Wallet creation flow
              userId: uplineId,
              amount: commissionAmount,
              type: 'COMMISSION',
              description: `Commission from ${sourceUserId} at level ${i + 1}`,
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
        continue; // Safely bypass this level and process the rest
      }
      throw error; // Bubble up to trigger cron retry
    }
  }
}
