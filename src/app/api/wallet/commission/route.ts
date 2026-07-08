import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { recordCommission } from '@/lib/wallet/service';
import { CommissionType } from '@/lib/wallet/types';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (only admins can record commissions)
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, amount, commissionType, description, reference, metadata } = body;

    if (!reference || typeof reference !== 'string' || !reference.trim()) {
      return NextResponse.json(
        { message: 'reference (eventId) is required for idempotency' },
        { status: 400 }
      );
    }

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
