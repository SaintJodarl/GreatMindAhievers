import { Prisma } from '@prisma/client';

export async function emitOutboxEvent(
  tx: Prisma.TransactionClient,
  type: string,
  userId: string,
  payload: any,
  idempotencyKey: string,
  executionMode: string = 'GREEN'
) {
  // Fully transactional + idempotent via DB constraints without transaction poisoning
  await tx.outboxEvent.createMany({
    data: [{
      type,
      userId,
      payload,
      idempotencyKey,
      executionMode,
      status: 'OUTBOX_PENDING',
      nextRetryAt: new Date(),
    }],
    skipDuplicates: true
  });
}
