import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { adjustBalance } from '@/lib/wallet/service';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('wallet:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const body = await req.json();
    const { walletId, newBalance, description, reference, metadata } = body;

    if (!reference || typeof reference !== 'string' || !reference.trim()) {
      return NextResponse.json(
        { message: 'reference (eventId) is required for idempotency' },
        { status: 400 }
      );
    }

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
      const result = await adjustBalance(
        tx,
        walletId,
        new Prisma.Decimal(newBalance),
        description,
        reference,
        metadata
      );

      // Log to audit logs
      await tx.auditLog.create({
        data: {
          adminId: auth.user!.id,
          action: 'WALLET_ADJUSTMENT',
          targetType: 'Wallet',
          targetId: walletId,
          details: `Adjusted wallet balance to ₦${newBalance}. Description: ${description}`,
        },
      });

      return result;
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
