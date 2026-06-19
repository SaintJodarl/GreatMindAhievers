import { prisma } from '@/lib/prisma';

export async function processWalletCredit(event: any) {
  const { walletId, userId, amount, type, description } = event.payload;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create Ledger Record (Throws P2002 if duplicate eventId)
      const txn = await tx.walletTransaction.create({
        data: {
          walletId,
          userId,
          type,
          amount,
          balanceAfter: 0,
          description,
          eventId: event.idempotencyKey,
          status: 'COMPLETED'
        }
      });

      // 2. Atomic Balance Increment
      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: amount } }
      });

      // 3. Update correct balanceAfter
      await tx.walletTransaction.update({
        where: { id: txn.id },
        data: { balanceAfter: updatedWallet.balance }
      });
    });
  } catch (e: any) {
    // P2002: Prisma unique constraint violation (Database-level check)
    if (e.code === 'P2002' && e.meta?.target?.includes('eventId')) {
      console.log(`[Wallet Worker] DB Idempotency catch: Transaction for event ${event.idempotencyKey} already exists. Skipping safely.`);
      return;
    }
    throw e;
  }
}
