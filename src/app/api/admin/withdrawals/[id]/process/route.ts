import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';
import { debitWallet } from '@/lib/wallet/service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminPermission('withdrawal:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, kycStatus: true },
        },
      },
    });

    if (!withdrawal) {
      return NextResponse.json({ message: 'Withdrawal request not found' }, { status: 404 });
    }

    if (withdrawal.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'Withdrawal request has already been processed' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { decision, reason } = body; // decision: approve or reject

    if (!decision || !['approve', 'reject'].includes(decision)) {
      return NextResponse.json(
        { message: 'Invalid decision. Must be approve or reject' },
        { status: 400 }
      );
    }

    if (decision === 'approve') {
      // 1. Enforce KYC approved
      if (withdrawal.user.kycStatus !== 'APPROVED') {
        return NextResponse.json(
          { message: 'Cannot approve withdrawal: User KYC is not approved' },
          { status: 400 }
        );
      }

      // 2. Fetch user's wallet
      const wallet = await prisma.wallet.findUnique({
        where: { userId: withdrawal.userId },
      });

      if (!wallet || wallet.balance < withdrawal.amount) {
        return NextResponse.json(
          { message: 'Cannot approve withdrawal: Insufficient wallet balance' },
          { status: 400 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        // 3. Debit wallet using ledger service
        await debitWallet(tx, {
          walletId: wallet.id,
          amount: withdrawal.amount,
          type: 'WITHDRAWAL',
          description: `Withdrawal request processed (Ref: ${withdrawal.id})`,
        });

        // 4. Update withdrawal request status
        const updated = await tx.withdrawal.update({
          where: { id },
          data: {
            status: 'APPROVED',
            adminNote: reason || 'Processed and approved by admin',
            processedAt: new Date(),
            processedBy: auth.user!.id,
          },
        });

        // 5. Log to Audit logs
        await tx.auditLog.create({
          data: {
            adminId: auth.user!.id,
            action: 'APPROVE_WITHDRAWAL',
            targetType: 'Withdrawal',
            targetId: withdrawal.id,
            details: `Approved withdrawal of ₦${withdrawal.amount} for user ${withdrawal.userId}`,
          },
        });

        return updated;
      });

      return NextResponse.json({
        message: 'Withdrawal request successfully approved and processed',
        withdrawal: result,
      });
    } else {
      // Reject withdrawal
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.withdrawal.update({
          where: { id },
          data: {
            status: 'REJECTED',
            adminNote: reason || 'Rejected by admin',
            processedAt: new Date(),
            processedBy: auth.user!.id,
          },
        });

        // Log to Audit logs
        await tx.auditLog.create({
          data: {
            adminId: auth.user!.id,
            action: 'REJECT_WITHDRAWAL',
            targetType: 'Withdrawal',
            targetId: withdrawal.id,
            details: `Rejected withdrawal of ₦${withdrawal.amount} for user ${withdrawal.userId}. Reason: ${reason || 'N/A'}`,
          },
        });

        return updated;
      });

      return NextResponse.json({
        message: 'Withdrawal request successfully rejected',
        withdrawal: result,
      });
    }
  } catch (error: any) {
    console.error('Process withdrawal error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
