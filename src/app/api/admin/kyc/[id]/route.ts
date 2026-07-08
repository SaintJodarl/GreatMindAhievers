import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAdminPermission('kyc:read');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const submission = await prisma.kYCSubmission.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        idDocument: true,
        governmentIdUrl: true,
        proofOfAddress: true,
        addressProofUrl: true,
        selfie: true,
        selfieUrl: true,
        govIdStatus: true,
        addressStatus: true,
        selfieStatus: true,
        status: true,
        adminNote: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            kycStatus: true,
          },
        },
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
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    if (!['SUBMITTED', 'COMPLETE'].includes(submission.status)) {
      return NextResponse.json(
        { message: 'KYC submission is not currently reviewable' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { decision, reason } = body; // decision: APPROVED or REJECTED

    if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
      return NextResponse.json({ message: 'Invalid decision' }, { status: 400 });
    }

    if (decision === 'REJECTED') {
      return NextResponse.json(
        {
          message:
            'Reject a specific KYC document from the document review endpoint instead of rejecting the whole submission.',
        },
        { status: 400 }
      );
    }

    if (
      decision === 'APPROVED' &&
      !(
        (submission.governmentIdUrl || submission.idDocument) &&
        (submission.addressProofUrl || submission.proofOfAddress) &&
        (submission.selfieUrl || submission.selfie) &&
        submission.govIdStatus === 'APPROVED' &&
        submission.addressStatus === 'APPROVED' &&
        submission.selfieStatus === 'APPROVED'
      )
    ) {
      return NextResponse.json(
        { message: 'Approve each required document before approving overall KYC.' },
        { status: 400 }
      );
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
