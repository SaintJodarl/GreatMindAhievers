import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';


import { prisma } from '@/lib/prisma';
import { getOrCreateWallet, debitWallet, TransactionType } from '@/lib/wallet/service';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, type, description, reference, metadata } = body;

    if (!reference || typeof reference !== 'string' || !reference.trim()) {
      return NextResponse.json({ message: 'reference (eventId) is required for idempotency' }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ message: 'Amount must be greater than zero' }, { status: 400 });
    }

    if (!type || !['DEBIT', 'WITHDRAWAL', 'FEE'].includes(type)) {
      return NextResponse.json({ message: 'Invalid debit transaction type' }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ message: 'Description is required' }, { status: 400 });
    }

    const wallet = await getOrCreateWallet(currentUser.id);

    const transaction = await prisma.$transaction(async (tx) => {
      return debitWallet(tx, {
        walletId: wallet.id,
        amount,
        type: type as TransactionType,
        description,
        reference,
        metadata,
      });
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error: any) {
    console.error('Debit wallet error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to debit wallet' },
      { status: 500 }
    );
  }
}
