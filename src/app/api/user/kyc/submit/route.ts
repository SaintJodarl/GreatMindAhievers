import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = currentUser.id;
    const body = await req.json();

    const { idType, idNumber, idDocument, selfie, proofOfAddress } = body;

    if (!idType) {
      return NextResponse.json(
        { message: 'ID type is required.' },
        { status: 400 }
      );
    }

    // At least one document must be provided
    if (!idDocument && !selfie && !proofOfAddress) {
      return NextResponse.json(
        { message: 'At least one KYC document is required.' },
        { status: 400 }
      );
    }

    // Fetch user details for required KYCSubmission fields
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const fullName = user.name || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Unknown';
    const phone = user.profile?.phone || 'Not Provided';
    const address = user.profile?.address || 'Not Provided';
    const state = user.profile?.state || 'Not Provided';
    const lga = user.profile?.lga || 'Not Provided';

    // Build update data based on provided documents
    const updateData: any = {
      idType,
      idNumber: idNumber || 'NOT_PROVIDED',
    };

    if (idDocument) {
      updateData.idDocument = idDocument;
      updateData.governmentIdUrl = idDocument;
      updateData.govIdStatus = 'UPLOADED';
    }
    if (selfie) {
      updateData.selfie = selfie;
      updateData.selfieUrl = selfie;
      updateData.selfieStatus = 'UPLOADED';
    }
    if (proofOfAddress) {
      updateData.proofOfAddress = proofOfAddress;
      updateData.addressProofUrl = proofOfAddress;
      updateData.addressStatus = 'UPLOADED';
    }

    const kycSub = await prisma.kYCSubmission.upsert({
      where: { userId },
      create: {
        userId,
        fullName,
        phone,
        address,
        state,
        lga,
        ...updateData,
        status: 'PENDING',
      },
      update: updateData,
    });

    // Check if all 3 documents are now uploaded
    const isComplete =
      kycSub.govIdStatus === 'UPLOADED' &&
      kycSub.selfieStatus === 'UPLOADED' &&
      kycSub.addressStatus === 'UPLOADED';

    if (isComplete && kycSub.status === 'PENDING') {
      await prisma.kYCSubmission.update({
        where: { userId },
        data: { status: 'COMPLETE' },
      });
      await prisma.user.update({
        where: { id: userId },
        data: { kycStatus: 'SUBMITTED', kycSubmittedAt: new Date() },
      });
    }

    return NextResponse.json({
      message: 'KYC documents submitted successfully.',
      isComplete,
    });
  } catch (error: any) {
    console.error('KYC submit error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to submit KYC documents.' },
      { status: 500 }
    );
  }
}
