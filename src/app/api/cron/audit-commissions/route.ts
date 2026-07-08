import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const take = parseInt(url.searchParams.get('take') || '100');
    const skip = parseInt(url.searchParams.get('skip') || '0');

    // Audit 1: Commission Log to Wallet Transaction consistency
    const commissions = await prisma.commissionLog.findMany({
      take,
      skip,
      where: { status: 'COMPLETED' }, // Assuming COMPLETED or similar when successful
    });

    let inconsistencies = 0;
    const discrepancies: any[] = [];

    for (const comm of commissions) {
      if (!comm.eventId) continue; // Old legacy commissions without eventId

      // There should be a matching WalletTransaction for this CommissionLog
      // Both should map to the exact same eventId and amount
      const matchingTxn = await prisma.walletTransaction.findFirst({
        where: {
          eventId: comm.eventId,
          userId: comm.userId,
          type: 'COMMISSION',
          amount: comm.amount,
        },
      });

      if (!matchingTxn) {
        inconsistencies++;
        discrepancies.push({
          commissionId: comm.id,
          eventId: comm.eventId,
          userId: comm.userId,
          issue: 'Missing corresponding WalletTransaction for CommissionLog',
        });
      }
    }

    if (inconsistencies > 0) {
      console.error(
        `[Commission Audit Alert] Found ${inconsistencies} commission inconsistencies!`,
        discrepancies
      );
    }

    return NextResponse.json({
      success: true,
      scanned: commissions.length,
      inconsistencies,
      discrepancies,
      nextSkip: skip + take,
    });
  } catch (error: any) {
    console.error('Commission Audit Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
