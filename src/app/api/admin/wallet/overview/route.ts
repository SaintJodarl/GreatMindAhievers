import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';

const CREDIT_TYPES = [
  'CREDIT',
  'REFERRAL_BONUS',
  'PAIRING_BONUS',
  'LEADERSHIP_BONUS',
  'DEPOSIT',
  'ADJUSTMENT',
];
const DEBIT_TYPES = ['DEBIT', 'WITHDRAWAL', 'FEE'];

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('wallet:read');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    // 1. Get total cached balance of all wallets
    const cachedAggregate = await prisma.wallet.aggregate({
      _sum: { balance: true },
    });
    const totalCachedBalance = cachedAggregate._sum.balance || 0;

    // 2. Fetch all transactions to compute derived balance and inflow/outflow
    const allTxns = await prisma.walletTransaction.findMany({
      where: { status: 'COMPLETED' },
      select: { type: true, amount: true, walletId: true },
    });

    let totalDerivedInflow = 0;
    let totalDerivedOutflow = 0;
    const derivedWalletBalances: Record<string, number> = {};

    for (const txn of allTxns) {
      const isCredit = CREDIT_TYPES.includes(txn.type);
      const isDebit = DEBIT_TYPES.includes(txn.type);

      if (!derivedWalletBalances[txn.walletId]) {
        derivedWalletBalances[txn.walletId] = 0;
      }

      if (isCredit) {
        totalDerivedInflow += txn.amount;
        derivedWalletBalances[txn.walletId] += txn.amount;
      } else if (isDebit) {
        totalDerivedOutflow += txn.amount;
        derivedWalletBalances[txn.walletId] -= txn.amount;
      }
    }

    const totalDerivedBalance = totalDerivedInflow - totalDerivedOutflow;

    // 3. Find mismatches
    const wallets = await prisma.wallet.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    const mismatches = [];
    for (const wallet of wallets) {
      const derived = derivedWalletBalances[wallet.id] || 0;
      if (Math.abs(wallet.balance - derived) > 0.01) {
        mismatches.push({
          walletId: wallet.id,
          userId: wallet.userId,
          name: wallet.user.name || 'Unknown',
          email: wallet.user.email || '',
          cachedBalance: wallet.balance,
          derivedBalance: derived,
          difference: wallet.balance - derived,
        });
      }
    }

    return NextResponse.json({
      systemCachedBalance: totalCachedBalance,
      systemDerivedBalance: totalDerivedBalance,
      inflow: totalDerivedInflow,
      outflow: totalDerivedOutflow,
      reconciliationStatus: mismatches.length === 0 ? 'CLEAN' : 'MISMATCHED',
      mismatchCount: mismatches.length,
      mismatches,
    });
  } catch (error: any) {
    console.error('Wallet overview error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
