import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Audit 1: Find events stuck in OUTBOX_PROCESSING for > 15 minutes (Lease leak)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const stuckEvents = await prisma.outboxEvent.count({
      where: {
        status: 'OUTBOX_PROCESSING',
        processingLeaseUntil: { lt: fifteenMinsAgo }
      }
    });

    if (stuckEvents > 0) {
      console.warn(`[Event Audit] Found ${stuckEvents} events stuck in PROCESSING despite expired leases! The lease recovery system might be lagging.`);
    }

    // Audit 2: Count Dead Letters
    const deadLetters = await prisma.outboxEvent.count({
      where: { status: 'DEAD_LETTER' }
    });

    // Audit 3: Queue Depth
    const pendingEvents = await prisma.outboxEvent.count({
      where: { status: 'OUTBOX_PENDING' }
    });

    return NextResponse.json({
      success: true,
      stuckEvents,
      deadLetters,
      pendingEvents,
      timestamp: new Date()
    });
  } catch (error: any) {
    console.error('Event Reconciliation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
