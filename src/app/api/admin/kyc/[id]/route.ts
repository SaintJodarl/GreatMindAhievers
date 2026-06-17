import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminPermission('kyc:read');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const submission = await prisma.kYCSubmission.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ message: 'KYC submission not found' }, { status: 404 });
    }

    return NextResponse.json({ submission });
  } catch (error: any) {
    console.error('Get KYC detail error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Review KYC submission (accepts approve or reject)
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
    const { decision, reason } = body; // decision: APPROVED or REJECTED

    if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
      return NextResponse.json({ message: 'Invalid decision' }, { status: 400 });
    }

    if (decision === 'REJECTED' && !reason) {
      return NextResponse.json({ message: 'Rejection reason is required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update KYCSubmission
      const updatedSubmission = await tx.kYCSubmission.update({
        where: { id },
        data: {
          status: decision,
          adminNote: reason || null,
          reviewedBy: auth.user!.id,
          reviewedAt: new Date(),
        },
      });

      // 2. Update User kycStatus
      const userUpdateData: any = {
        kycStatus: decision,
      };

      if (decision === 'APPROVED') {
        userUpdateData.kycApprovedAt = new Date();
      } else {
        userUpdateData.kycRejectedAt = new Date();
        userUpdateData.kycRejectionReason = reason;
      }

      await tx.user.update({
        where: { id: submission.userId },
        data: userUpdateData,
      });

      // 3. Create Audit Log
      await tx.auditLog.create({
        data: {
          adminId: auth.user!.id,
          action: decision === 'APPROVED' ? 'APPROVE_KYC' : 'REJECT_KYC',
          targetType: 'KYCSubmission',
          targetId: submission.id,
          details: `${decision === 'APPROVED' ? 'Approved' : 'Rejected'} KYC submission for user ${submission.userId}. Reason: ${reason || 'N/A'}`,
        },
      });

      return updatedSubmission;
    });

    return NextResponse.json({
      message: `KYC submission successfully ${decision.toLowerCase()}d`,
      submission: result,
    });
  } catch (error: any) {
    console.error('Review KYC error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
