import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/prisma';
import { recordCommission } from '@/lib/wallet/service';
import { CommissionType } from '@/lib/wallet/types';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (only admins can record commissions)
    if (session.user.role !== 'ADMIN' && !session.user.adminRole) {
      return NextResponse.json({ message: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, amount, commissionType, description, reference, metadata } = body;

    if (!userId) {
      return NextResponse.json({ message: 'userId is required' }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ message: 'Amount must be greater than zero' }, { status: 400 });
    }

    if (
      !commissionType ||
      !['REFERRAL_BONUS', 'PAIRING_BONUS', 'LEADERSHIP_BONUS'].includes(commissionType)
    ) {
      return NextResponse.json({ message: 'Invalid commission type' }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ message: 'Description is required' }, { status: 400 });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      return recordCommission(tx, {
        userId,
        amount,
        commissionType: commissionType as CommissionType,
        description,
        reference,
        metadata,
      });
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error: any) {
    console.error('Record commission error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to record commission' },
      { status: 500 }
    );
  }
}
