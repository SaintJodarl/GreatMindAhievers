import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { signAccessToken } from '@/lib/auth/jwt';

const DOCUMENT_CONFIG = {
  government_id: {
    statusField: 'govIdStatus',
    primaryUrlField: 'governmentIdUrl',
    fallbackUrlField: 'idDocument',
  },
  photograph: {
    statusField: 'selfieStatus',
    primaryUrlField: 'selfieUrl',
    fallbackUrlField: 'selfie',
  },
  address_proof: {
    statusField: 'addressStatus',
    primaryUrlField: 'addressProofUrl',
    fallbackUrlField: 'proofOfAddress',
  },
} as const;

const hasDocumentUrl = (
  submission: {
    idDocument?: string | null;
    governmentIdUrl?: string | null;
    proofOfAddress?: string | null;
    addressProofUrl?: string | null;
    selfie?: string | null;
    selfieUrl?: string | null;
  },
  primaryUrlField: string,
  fallbackUrlField: string
) => Boolean((submission as any)[primaryUrlField] || (submission as any)[fallbackUrlField]);

const deriveOverallStatus = (submission: {
  idDocument?: string | null;
  governmentIdUrl?: string | null;
  proofOfAddress?: string | null;
  addressProofUrl?: string | null;
  selfie?: string | null;
  selfieUrl?: string | null;
  govIdStatus: string;
  addressStatus: string;
  selfieStatus: string;
}) => {
  const documents = [
    {
      status: submission.govIdStatus,
      hasUrl: hasDocumentUrl(
        submission,
        DOCUMENT_CONFIG.government_id.primaryUrlField,
        DOCUMENT_CONFIG.government_id.fallbackUrlField
      ),
    },
    {
      status: submission.addressStatus,
      hasUrl: hasDocumentUrl(
        submission,
        DOCUMENT_CONFIG.address_proof.primaryUrlField,
        DOCUMENT_CONFIG.address_proof.fallbackUrlField
      ),
    },
    {
      status: submission.selfieStatus,
      hasUrl: hasDocumentUrl(
        submission,
        DOCUMENT_CONFIG.photograph.primaryUrlField,
        DOCUMENT_CONFIG.photograph.fallbackUrlField
      ),
    },
  ];

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

const getCloudinaryCloudName = () =>
  process.env.CLOUDINARY_CLOUD_NAME?.replace(/['"]/g, '').trim();

const isCloudinarySecureUrl = (value: unknown, cloudName: string) => {
  if (typeof value !== 'string' || !value.trim()) {
    return false;
  }

  try {
    const parsed = new URL(value);
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const [urlCloudName, resourceType, deliveryType] = pathParts;

    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === 'res.cloudinary.com' &&
      urlCloudName === cloudName &&
      ['image', 'raw', 'video'].includes(resourceType) &&
      deliveryType === 'upload' &&
      pathParts.length > 3
    );
  } catch {
    return false;
  }
};

const cleanText = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const cleanRequiredText = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const buildUserKycUpdateData = (status: string, now: Date) => {
  const data: any = { kycStatus: status };

  if (status === 'APPROVED') {
    data.kycApprovedAt = now;
    data.kycRejectedAt = null;
    data.kycRejectionReason = null;
  } else if (status === 'REJECTED') {
    data.kycRejectedAt = now;
    data.kycApprovedAt = null;
  } else if (status === 'SUBMITTED') {
    data.kycSubmittedAt = now;
    data.kycApprovedAt = null;
    data.kycRejectedAt = null;
    data.kycRejectionReason = null;
  } else {
    data.kycApprovedAt = null;
    data.kycRejectedAt = null;
    data.kycRejectionReason = null;
  }

  return data;
};

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = currentUser.id;
    const body = await req.json();

    if (body.completeRegistration === true) {
      const firstName = cleanRequiredText(body.firstName);
      const lastName = cleanRequiredText(body.lastName);
      const email = cleanRequiredText(body.email);
      const phone = cleanRequiredText(body.phone);
      const gender = cleanRequiredText(body.gender);
      const dob = cleanRequiredText(body.dob);
      const address = cleanRequiredText(body.address);
      const bankName = cleanRequiredText(body.bankName);
      const accountNumber = cleanRequiredText(body.accountNumber);
      const accountName = cleanRequiredText(body.accountName);

      if (
        !firstName ||
        !lastName ||
        !email ||
        !phone ||
        !gender ||
        !dob ||
        !address ||
        !bankName ||
        !accountNumber ||
        !accountName
      ) {
        return NextResponse.json(
          { message: 'All personal information and banking fields are required.' },
          { status: 400 }
        );
      }

      if (gender !== 'Male' && gender !== 'Female') {
        return NextResponse.json(
          { message: 'Gender must be either Male or Female.' },
          { status: 400 }
        );
      }

      const parsedDob = new Date(dob);
      if (Number.isNaN(parsedDob.getTime())) {
        return NextResponse.json(
          { message: 'Date of birth must be a valid date.' },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          kycStatus: true,
          sessionVersion: true,
        },
      });

      if (!user) {
        return NextResponse.json({ message: 'User not found.' }, { status: 404 });
      }

      const normalizedEmail = email.toLowerCase();
      if (user.email && user.email.toLowerCase() !== normalizedEmail) {
        return NextResponse.json(
          { message: 'Email address must match the registered account email.' },
          { status: 400 }
        );
      }

      const now = new Date();
      const nextKycStatus = user.kycStatus === 'APPROVED' ? 'APPROVED' : 'COMPLETE';

      const updatedUser = await prisma.$transaction(async (tx) => {
        await tx.memberProfile.upsert({
          where: { userId },
          create: {
            userId,
            firstName,
            lastName,
            phone,
            gender,
            dob: parsedDob,
            address,
          },
          update: {
            firstName,
            lastName,
            phone,
            gender,
            dob: parsedDob,
            address,
          },
        });

        return tx.user.update({
          where: { id: userId },
          data: {
            email: user.email || normalizedEmail,
            bankName,
            accountNumber,
            accountName,
            onboardingStep: 4,
            onboardingStatus: 'COMPLETE',
            kycStatus: nextKycStatus,
            kycSubmittedAt: now,
            kycRejectedAt: null,
            kycRejectionReason: null,
          },
        });
      });

      const accessToken = await signAccessToken({
        sub: updatedUser.id,
        role: updatedUser.role,
        status: updatedUser.status,
        onboardingStatus: updatedUser.onboardingStatus,
        sessionVersion: updatedUser.sessionVersion,
      });

      const response = NextResponse.json({
        message: 'Registration completed successfully.',
        isComplete: true,
        status: nextKycStatus,
        onboardingStatus: updatedUser.onboardingStatus,
      });

      response.cookies.set('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 15 * 60,
      });

      return response;
    }

    const {
      fullName: submittedFullName,
      phone: submittedPhone,
      address: submittedAddress,
      state: submittedState,
      lga: submittedLga,
      idType,
      idNumber,
      idDocument,
      selfie,
      proofOfAddress,
    } = body;

    const submittedIdType = cleanText(idType);
    if (!submittedIdType) {
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

    const submittedDocuments = [
      { label: 'Government ID', value: idDocument },
      { label: 'Photograph', value: selfie },
      { label: 'Proof of Address', value: proofOfAddress },
    ].filter((document) => document.value);

    const cloudinaryCloudName = getCloudinaryCloudName();
    if (submittedDocuments.length > 0 && !cloudinaryCloudName) {
      return NextResponse.json(
        { message: 'Cloudinary cloud name is not configured for KYC uploads.' },
        { status: 500 }
      );
    }

    const invalidDocument = submittedDocuments.find(
      (document) => !isCloudinarySecureUrl(document.value, cloudinaryCloudName!)
    );

    if (invalidDocument) {
      return NextResponse.json(
        {
          message: `${invalidDocument.label} must be uploaded first and submitted as a valid Cloudinary secure URL.`,
        },
        { status: 400 }
      );
    }

    const [user, existingSubmission] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      }),
      prisma.kYCSubmission.findUnique({
        where: { userId },
        select: {
          id: true,
          idDocument: true,
          governmentIdUrl: true,
          proofOfAddress: true,
          addressProofUrl: true,
          selfie: true,
          selfieUrl: true,
          fullName: true,
          phone: true,
          address: true,
          state: true,
          lga: true,
          idType: true,
          idNumber: true,
          govIdStatus: true,
          addressStatus: true,
          selfieStatus: true,
          status: true,
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const profileFullName =
      `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim();
    const fullName =
      cleanText(submittedFullName) ||
      existingSubmission?.fullName ||
      user.name ||
      profileFullName ||
      'Unknown';
    const phone =
      cleanText(submittedPhone) ||
      existingSubmission?.phone ||
      user.profile?.phone ||
      'Not Provided';
    const address =
      cleanText(submittedAddress) ||
      existingSubmission?.address ||
      user.profile?.address ||
      'Not Provided';
    const state =
      cleanText(submittedState) ||
      existingSubmission?.state ||
      user.profile?.state ||
      'Not Provided';
    const lga =
      cleanText(submittedLga) ||
      existingSubmission?.lga ||
      user.profile?.lga ||
      'Not Provided';
    const resolvedIdNumber =
      cleanText(idNumber) || existingSubmission?.idNumber || 'NOT_PROVIDED';

    // Build update data based on provided documents
    const updateData: any = {
      fullName,
      phone,
      address,
      state,
      lga,
      idType: submittedIdType,
      idNumber: resolvedIdNumber,
    };

    if (idDocument && existingSubmission?.govIdStatus !== 'APPROVED') {
      updateData.idDocument = idDocument;
      updateData.governmentIdUrl = idDocument;
      updateData.govIdStatus = 'UPLOADED';
    }
    if (selfie && existingSubmission?.selfieStatus !== 'APPROVED') {
      updateData.selfie = selfie;
      updateData.selfieUrl = selfie;
      updateData.selfieStatus = 'UPLOADED';
    }
    if (proofOfAddress && existingSubmission?.addressStatus !== 'APPROVED') {
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

    const nextOverallStatus = deriveOverallStatus(kycSub);
    const isComplete = nextOverallStatus === 'SUBMITTED' || nextOverallStatus === 'APPROVED';

    if (nextOverallStatus !== kycSub.status || user.kycStatus !== nextOverallStatus) {
      const now = new Date();
      await prisma.$transaction([
        prisma.kYCSubmission.update({
          where: { userId },
          data: { status: nextOverallStatus },
        }),
        prisma.user.update({
          where: { id: userId },
          data: buildUserKycUpdateData(nextOverallStatus, now),
        }),
      ]);
    }

    return NextResponse.json({
      message: 'KYC documents submitted successfully.',
      isComplete,
      status: nextOverallStatus,
    });
  } catch (error: any) {
    console.error('KYC submit error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to submit KYC documents.' },
      { status: 500 }
    );
  }
}
