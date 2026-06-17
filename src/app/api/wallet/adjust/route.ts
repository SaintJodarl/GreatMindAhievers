import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/prisma';
import { adjustBalance } from '@/lib/wallet/service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (only admins can adjust balances)
    if (session.user.role !== 'ADMIN' && !session.user.adminRole) {
      return NextResponse.json({ message: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { walletId, newBalance, description, reference, metadata } = body;

    if (!walletId) {
      return NextResponse.json({ message: 'walletId is required' }, { status: 400 });
    }

    if (typeof newBalance !== 'number' || newBalance < 0) {
      return NextResponse.json(
        { message: 'newBalance must be a non-negative number' },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json({ message: 'Description is required' }, { status: 400 });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      return adjustBalance(tx, walletId, newBalance, description, reference, metadata);
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error: any) {
    console.error('Adjust balance error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to adjust balance' },
      { status: 500 }
    );
  }
}
