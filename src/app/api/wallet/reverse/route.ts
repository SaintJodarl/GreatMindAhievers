import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/prisma';
import { reverseTransaction } from '@/lib/wallet/service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (only admins can reverse transactions)
    if (session.user.role !== 'ADMIN' && !session.user.adminRole) {
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
