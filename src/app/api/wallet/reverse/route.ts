import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';


import { prisma } from '@/lib/prisma';
import { reverseTransaction } from '@/lib/wallet/service';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (only admins can reverse transactions)
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { transactionId, reason } = body;

    if (!transactionId) {
      return NextResponse.json({ message: 'transactionId is required' }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({ message: 'Reason is required' }, { status: 400 });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      return reverseTransaction(tx, transactionId, reason);
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error: any) {
    console.error('Reverse transaction error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to reverse transaction' },
      { status: 500 }
    );
  }
}
