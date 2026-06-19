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

    const wallets = await prisma.wallet.findMany({
      take,
      skip,
      include: { transactions: true }
    });

    let inconsistencies = 0;
    const discrepancies: any[] = [];

    for (const wallet of wallets) {
      const dbBalance = new Prisma.Decimal(wallet.balance.toString());
      
      const credits = await prisma.walletTransaction.aggregate({
        where: { walletId: wallet.id, type: { in: ['CREDIT', 'COMMISSION', 'DEPOSIT'] }, status: 'COMPLETED' },
        _sum: { amount: true }
      });
      
      const debits = await prisma.walletTransaction.aggregate({
        where: { walletId: wallet.id, type: { in: ['DEBIT', 'WITHDRAWAL', 'FEE'] }, status: 'COMPLETED' },
        _sum: { amount: true }
      });

      const totalCredits = credits._sum.amount ? new Prisma.Decimal(credits._sum.amount.toString()) : new Prisma.Decimal(0);
      const totalDebits = debits._sum.amount ? new Prisma.Decimal(debits._sum.amount.toString()) : new Prisma.Decimal(0);
      
      const ledgerBalance = totalCredits.minus(totalDebits);

      if (!dbBalance.equals(ledgerBalance)) {
        inconsistencies++;
        discrepancies.push({
          walletId: wallet.id,
          userId: wallet.userId,
          dbBalance: dbBalance.toString(),
          ledgerBalance: ledgerBalance.toString(),
          drift: dbBalance.minus(ledgerBalance).toString()
        });
      }
    }

    // Optional: Auto-repair could be added here, but logging is safer first
    if (inconsistencies > 0) {
      console.error(`[Reconciliation Alert] Found ${inconsistencies} wallet drift issues!`, discrepancies);
    }

    return NextResponse.json({
      success: true,
      scanned: wallets.length,
      inconsistencies,
      discrepancies,
      nextSkip: skip + take
    });
  } catch (error: any) {
    console.error('Wallet Reconciliation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
