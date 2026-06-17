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

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update KYCSubmission
      const updatedSubmission = await tx.kYCSubmission.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedBy: auth.user!.id,
          reviewedAt: new Date(),
        },
      });

      // 2. Update User kycStatus & Auto-activate if activation code is already redeemed
      const hasCode = await tx.activationCode.findUnique({
        where: { redeemedBy: submission.userId },
      });

      const userUpdateData: any = {
        kycStatus: 'APPROVED',
        kycApprovedAt: new Date(),
      };

      if (hasCode && hasCode.status === 'USED') {
        userUpdateData.status = 'ACTIVE';
      }

      await tx.user.update({
        where: { id: submission.userId },
        data: userUpdateData,
      });

      // 3. Create Audit Log
      await tx.auditLog.create({
        data: {
          adminId: auth.user!.id,
          action: 'APPROVE_KYC',
          targetType: 'KYCSubmission',
          targetId: submission.id,
          details: `Approved KYC submission for user ${submission.userId}`,
        },
      });

      return updatedSubmission;
    });

    return NextResponse.json({
      message: 'KYC submission successfully approved',
      submission: result,
    });
  } catch (error: any) {
    console.error('Approve KYC error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
