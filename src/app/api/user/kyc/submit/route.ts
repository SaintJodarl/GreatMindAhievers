import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';


import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = currentUser.id;
    const body = await req.json();
    const { idType = 'NIN', idNumber = 'NOT_PROVIDED', idDocument, selfie, proofOfAddress } = body;

    // Validation of uploads
    if (!idDocument || !selfie || !proofOfAddress) {
      return NextResponse.json(
        { message: 'Government ID, Selfie, and Proof of Address files are all required' },
        { status: 400 }
      );
    }

    // Fetch user and profile to populate KYC required metadata
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (user.kycStatus === 'APPROVED') {
      return NextResponse.json(
        { message: 'Your KYC submission is already approved.' },
        { status: 400 }
      );
    }

    // Get metadata from user and profile
    const fullName = user.name || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Unknown Member';
    const phone = user.profile?.phone || 'Not Provided';
    const address = user.profile?.address || 'Not Provided';
    const state = user.profile?.state || 'Not Provided';
    const lga = user.profile?.lga || 'Not Provided';

    // Insert or update KYCSubmission and update User statuses inside transaction
    const result = await prisma.$transaction(async (tx) => {
      const submission = await tx.kYCSubmission.upsert({
        where: { userId },
        create: {
          userId,
          fullName,
          phone,
          address,
          state,
          lga,
          idType,
          idNumber,
          idDocument,
          selfie,
          proofOfAddress,
          status: 'SUBMITTED',
        },
        update: {
          fullName,
          phone,
          address,
          state,
          lga,
          idType,
          idNumber,
          idDocument,
          selfie,
          proofOfAddress,
          status: 'SUBMITTED',
          adminNote: null,
          reviewedBy: null,
          reviewedAt: null,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          kycStatus: 'SUBMITTED',
          kycSubmittedAt: new Date(),
          kycRejectionReason: null,
          status: 'PENDING_KYC_REVIEW', // Transition user lifecycle status
        },
      });

      return submission;
    });

    return NextResponse.json({
      message: 'KYC documents submitted successfully. Status updated to PENDING_KYC_REVIEW.',
      submission: result,
    });
  } catch (error: any) {
    console.error('KYC submit error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to submit KYC documents' },
      { status: 500 }
    );
  }
}
