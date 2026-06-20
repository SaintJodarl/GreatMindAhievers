import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { executePlacementWithTx } from '@/lib/binary-placement/utils';
import { processWalletCredit, processWalletDebit } from './workers/wallet';
import { processCommissionCalc } from './workers/commission';
import { processReferralUpdate } from './workers/referral';

const BATCH_SIZE = 50;

export async function processOutboxEvents(): Promise<number> {
  const workerId = crypto.randomUUID();

  // 1. SKIP LOCKED & Lease Acquisition
  // Atomically select and lock events, updating their lease status immediately.
  // This guarantees absolutely no cross-worker overlapping on the same row.
  const events: any[] = await prisma.$queryRaw`
    UPDATE "OutboxEvent"
    SET 
      status = 'OUTBOX_PROCESSING',
      "processingLeaseUntil" = NOW() + INTERVAL '5 minutes',
      "processingWorkerId" = ${workerId},
      "updatedAt" = NOW()
    WHERE id IN (
      SELECT id FROM "OutboxEvent"
      WHERE status IN ('OUTBOX_PENDING', 'OUTBOX_PROCESSING')
        AND ("processingLeaseUntil" IS NULL OR "processingLeaseUntil" < NOW())
        AND ("nextRetryAt" IS NULL OR "nextRetryAt" <= NOW())
      ORDER BY 
        CASE type 
          WHEN 'WALLET_CREDIT' THEN 1 
          WHEN 'COMMISSION_CALC' THEN 2 
          WHEN 'REFERRAL_UPDATE' THEN 3
          ELSE 4 
        END ASC, 
        "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${BATCH_SIZE}
    )
    RETURNING *;
  `;

  if (!events.length) return 0;

  let processedCount = 0;

  for (const event of events) {
    try {
      // Execute the business logic for this event type
      await routeAndExecuteWorker(event);

      // On Success: Mark DONE and clear lease
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { 
          status: 'OUTBOX_DONE', 
          processingLeaseUntil: null,
          processingWorkerId: null,
          updatedAt: new Date() 
        }
      });
      processedCount++;
    } catch (error: any) {
      console.error(`Failed to process OutboxEvent ${event.id}:`, error);

      // Exponential Backoff Logic
      const newRetryCount = event.retryCount + 1;
      const isDeadLetter = newRetryCount >= 3;
      
      const backoffMinutes = isDeadLetter ? null : Math.min(Math.pow(5, newRetryCount), 60);
      const nextRetryAt = isDeadLetter ? null : new Date(Date.now() + backoffMinutes! * 60000);

      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: isDeadLetter ? 'DEAD_LETTER' : 'OUTBOX_PENDING',
          retryCount: newRetryCount,
          lastError: error.message || 'Unknown Error',
          failedAt: isDeadLetter ? new Date() : null,
          nextRetryAt,
          processingLeaseUntil: null,
          processingWorkerId: null,
          updatedAt: new Date()
        }
      });

      if (isDeadLetter) {
        console.error(`[DEAD LETTER] OutboxEvent ${event.id} permanently failed after 3 attempts.`);
      }
    }
  }

  return processedCount;
}

async function routeAndExecuteWorker(event: any) {
  const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;
  
  if (event.type === 'MLM_DEFERRED_OPERATION') {
    if (payload.originalFunction === 'spilloverSearch') {
      await prisma.$transaction(async (tx) => {
        await executePlacementWithTx(tx, {
          sponsorId: payload.sponsorId,
          preferredPosition: payload.preferredPosition,
          userId: event.userId,
        });
      }, { timeout: 15000 });
    }
  } else if (event.type === 'WALLET_CREDIT') {
    await processWalletCredit(event);
  } else if (event.type === 'DEBIT_WALLET') {
    await processWalletDebit(event);
  } else if (event.type === 'COMMISSION_CALC') {
    await processCommissionCalc(event);
  } else if (event.type === 'REFERRAL_UPDATE') {
    await processReferralUpdate(event);
  } else {
    throw new Error(`Unknown OutboxEvent type: ${event.type}`);
  }
}
