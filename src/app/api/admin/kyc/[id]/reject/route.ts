import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';
import { NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminPermission('kyc:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const submission = await prisma.kYCSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      return NextResponse.json({ message: 'KYC submission not found' }, { status: 404 });
    }

    if (submission.status !== 'SUBMITTED') {
      return NextResponse.json(
        { message: 'KYC submission has already been reviewed' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json({ message: 'Rejection reason is required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update KYCSubmission
      const updatedSubmission = await tx.kYCSubmission.update({
        where: { id },
        data: {
          status: 'REJECTED',
          adminNote: reason,
          reviewedBy: auth.user!.id,
          reviewedAt: new Date(),
        },
      });

      // 2. Update User kycStatus
      await tx.user.update({
        where: { id: submission.userId },
        data: {
          kycStatus: 'REJECTED',
          kycRejectedAt: new Date(),
          kycRejectionReason: reason,
        },
      });

      // 3. Create Audit Log
      await tx.auditLog.create({
        data: {
          adminId: auth.user!.id,
          action: 'REJECT_KYC',
          targetType: 'KYCSubmission',
          targetId: submission.id,
          details: `Rejected KYC submission for user ${submission.userId}. Reason: ${reason}`,
        },
      });

      return updatedSubmission;
    });

    return NextResponse.json({
      message: 'KYC submission successfully rejected',
      submission: result,
    });
  } catch (error: any) {
    console.error('Reject KYC error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
