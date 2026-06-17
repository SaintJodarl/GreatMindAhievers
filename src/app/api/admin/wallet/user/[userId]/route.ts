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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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
    let derivedBalance = 0;
    for (const txn of transactions) {
      if (CREDIT_TYPES.includes(txn.type)) {
        derivedBalance += txn.amount;
      } else if (DEBIT_TYPES.includes(txn.type)) {
        derivedBalance -= txn.amount;
      }
    }

    return NextResponse.json({
      wallet,
      derivedBalance,
      reconciled: Math.abs(wallet.balance - derivedBalance) < 0.01,
      transactions,
    });
  } catch (error: any) {
    console.error('Get user wallet error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
