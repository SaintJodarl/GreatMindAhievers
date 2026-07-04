import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';

const DOCUMENT_CONFIG = {
  government_id: {
    label: 'Government ID',
    statusField: 'govIdStatus',
    primaryUrlField: 'governmentIdUrl',
    fallbackUrlField: 'idDocument',
  },
  address_proof: {
    label: 'Proof of Address Document',
    statusField: 'addressStatus',
    primaryUrlField: 'addressProofUrl',
    fallbackUrlField: 'proofOfAddress',
  },
  selfie: {
    label: 'Selfie',
    statusField: 'selfieStatus',
    primaryUrlField: 'selfieUrl',
    fallbackUrlField: 'selfie',
  },
  photograph: {
    label: 'Selfie',
    statusField: 'selfieStatus',
    primaryUrlField: 'selfieUrl',
    fallbackUrlField: 'selfie',
  },
} as const;

type DocumentType = keyof typeof DOCUMENT_CONFIG;
type Decision = 'APPROVED' | 'REJECTED';

const isDocumentType = (value: unknown): value is DocumentType =>
  typeof value === 'string' && value in DOCUMENT_CONFIG;

const isDecision = (value: unknown): value is Decision =>
  value === 'APPROVED' || value === 'REJECTED';

const deriveOverallStatus = (
  documents: { status: string; hasUrl: boolean }[]
) => {
  if (documents.every((document) => document.hasUrl && document.status === 'APPROVED')) {
    return 'APPROVED';
  }
  if (documents.some((document) => document.status === 'REJECTED')) {
    return 'REJECTED';
  }
  if (
    documents.every(
      (document) =>
        document.hasUrl &&
        (document.status === 'UPLOADED' || document.status === 'APPROVED')
    )
  ) {
    return 'SUBMITTED';
  }
  return 'PENDING';
};

const hasDocumentUrl = (
  submission: any,
  primaryUrlField: string,
  fallbackUrlField: string
) => Boolean(submission[primaryUrlField] || submission[fallbackUrlField]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminPermission('kyc:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { documentType, decision } = body;

    if (!isDocumentType(documentType)) {
      return NextResponse.json(
        { message: 'Invalid documentType. Use government_id, address_proof, selfie, or photograph.' },
        { status: 400 }
      );
    }

    if (!isDecision(decision)) {
      return NextResponse.json(
        { message: 'Invalid decision. Use APPROVED or REJECTED.' },
        { status: 400 }
      );
    }

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
      },
    });

    if (!submission) {
      return NextResponse.json({ message: 'KYC submission not found' }, { status: 404 });
    }

    const config = DOCUMENT_CONFIG[documentType];
    const documentUrl =
      (submission as any)[config.primaryUrlField] || (submission as any)[config.fallbackUrlField];

    if (!documentUrl) {
      return NextResponse.json(
        { message: `${config.label} is missing and cannot be reviewed.` },
        { status: 400 }
      );
    }

    const nextDocumentStatuses: Record<'govIdStatus' | 'addressStatus' | 'selfieStatus', string> = {
      govIdStatus: submission.govIdStatus,
      addressStatus: submission.addressStatus,
      selfieStatus: submission.selfieStatus,
    };
    nextDocumentStatuses[config.statusField] = decision;

    const nextOverallStatus = deriveOverallStatus([
      {
        status: nextDocumentStatuses.govIdStatus,
        hasUrl: hasDocumentUrl(submission, 'governmentIdUrl', 'idDocument'),
      },
      {
        status: nextDocumentStatuses.addressStatus,
        hasUrl: hasDocumentUrl(submission, 'addressProofUrl', 'proofOfAddress'),
      },
      {
        status: nextDocumentStatuses.selfieStatus,
        hasUrl: hasDocumentUrl(submission, 'selfieUrl', 'selfie'),
      },
    ]);

    const now = new Date();
    const userUpdateData: any = { kycStatus: nextOverallStatus };

    if (nextOverallStatus === 'APPROVED') {
      userUpdateData.kycApprovedAt = now;
      userUpdateData.kycRejectedAt = null;
      userUpdateData.kycRejectionReason = null;
    } else if (nextOverallStatus === 'REJECTED') {
      userUpdateData.kycRejectedAt = now;
      userUpdateData.kycApprovedAt = null;
      userUpdateData.kycRejectionReason = null;
    } else if (nextOverallStatus === 'SUBMITTED') {
      userUpdateData.kycSubmittedAt = now;
      userUpdateData.kycApprovedAt = null;
      userUpdateData.kycRejectedAt = null;
      userUpdateData.kycRejectionReason = null;
    }

    const submissionUpdateData: any = {
      status: nextOverallStatus,
      reviewedBy: auth.user!.id,
      reviewedAt: now,
    };
    submissionUpdateData[config.statusField] = decision;

    const result = await prisma.$transaction(async (tx) => {
      const updatedSubmission = await tx.kYCSubmission.update({
        where: { id },
        data: submissionUpdateData,
        select: {
          id: true,
          status: true,
          govIdStatus: true,
          addressStatus: true,
          selfieStatus: true,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: submission.userId },
        data: userUpdateData,
        select: {
          id: true,
          kycStatus: true,
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: auth.user!.id,
          action: 'REVIEW_KYC_DOCUMENT',
          targetType: 'KYCSubmission',
          targetId: submission.id,
          details: `${decision} ${config.label} for user ${submission.userId}`,
        },
      });

      return { submission: updatedSubmission, user: updatedUser };
    });

    return NextResponse.json({
      message: 'Document review updated',
      submission: result.submission,
      user: result.user,
    });
  } catch (error: any) {
    console.error('Document KYC review error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
