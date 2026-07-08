import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const auth = await verifyAdminPermission('wallet:read');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const resolvedParams = await params;
    const { userId } = resolvedParams;

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!wallet) {
      return NextResponse.json({ message: 'Wallet not found for user' }, { status: 404 });
    }

    // Get all completed transactions for this wallet
    const transactions = await prisma.walletTransaction.findMany({
      where: {
        walletId: wallet.id,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Derive balance
    let derivedBalance = new Prisma.Decimal(0);
    for (const txn of transactions) {
      if (CREDIT_TYPES.includes(txn.type)) {
        derivedBalance = derivedBalance.plus(txn.amount);
      } else if (DEBIT_TYPES.includes(txn.type)) {
        derivedBalance = derivedBalance.minus(txn.amount);
      }
    }

    const difference = wallet.balance.minus(derivedBalance).abs();

    return NextResponse.json({
      wallet: {
        ...wallet,
        balance: wallet.balance.toNumber(), // API formatting boundary
      },
      derivedBalance: derivedBalance.toNumber(),
      reconciled: difference.lt(0.01),
      transactions: transactions.map((t) => ({
        ...t,
        amount: t.amount.toNumber(),
        balanceAfter: t.balanceAfter.toNumber(),
      })),
    });
  } catch (error: any) {
    console.error('Get user wallet error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
