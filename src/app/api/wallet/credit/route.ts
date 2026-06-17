import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';


import { prisma } from '@/lib/prisma';
import { getOrCreateWallet, creditWallet, TransactionType } from '@/lib/wallet/service';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, type, description, reference, metadata } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ message: 'Amount must be greater than zero' }, { status: 400 });
    }

    if (
      !type ||
      ![
        'CREDIT',
        'REFERRAL_BONUS',
        'PAIRING_BONUS',
        'LEADERSHIP_BONUS',
        'DEPOSIT',
        'ADJUSTMENT',
      ].includes(type)
    ) {
      return NextResponse.json({ message: 'Invalid credit transaction type' }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ message: 'Description is required' }, { status: 400 });
    }

    const wallet = await getOrCreateWallet(currentUser.id);

    const transaction = await prisma.$transaction(async (tx) => {
      return creditWallet(tx, {
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
    console.error('Credit wallet error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to credit wallet' },
      { status: 500 }
    );
  }
}
