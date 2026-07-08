import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

const DOCUMENT_CONFIG = {
  government_id: {
    label: 'Government ID',
    statusField: 'govIdStatus',
    primaryUrlField: 'governmentIdUrl',
    fallbackUrlField: 'idDocument',
  },
  selfie: {
    label: 'Photograph',
    statusField: 'selfieStatus',
    primaryUrlField: 'selfieUrl',
    fallbackUrlField: 'selfie',
  },
  photograph: {
    label: 'Photograph',
    statusField: 'selfieStatus',
    primaryUrlField: 'selfieUrl',
    fallbackUrlField: 'selfie',
  },
  address_proof: {
    label: 'Proof of Address Document',
    statusField: 'addressStatus',
    primaryUrlField: 'addressProofUrl',
    fallbackUrlField: 'proofOfAddress',
  },
} as const;

type UploadDocumentType = keyof typeof DOCUMENT_CONFIG;

const isUploadDocumentType = (value: unknown): value is UploadDocumentType =>
  typeof value === 'string' && value in DOCUMENT_CONFIG;

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
      hasUrl: hasDocumentUrl(submission, 'governmentIdUrl', 'idDocument'),
    },
    {
      status: submission.addressStatus,
      hasUrl: hasDocumentUrl(submission, 'addressProofUrl', 'proofOfAddress'),
    },
    {
      status: submission.selfieStatus,
      hasUrl: hasDocumentUrl(submission, 'selfieUrl', 'selfie'),
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
        document.hasUrl && (document.status === 'UPLOADED' || document.status === 'APPROVED')
    )
  ) {
    return 'SUBMITTED';
  }
  return 'PENDING';
};

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

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.replace(/['"]/g, '').trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.replace(/['"]/g, '').trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.replace(/['"]/g, '').trim(),
});

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const docType = formData.get('docType') as string | null;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    if (!isUploadDocumentType(docType)) {
      return NextResponse.json({ message: 'Invalid document type' }, { status: 400 });
    }

    const config = DOCUMENT_CONFIG[docType];
    const [user, existingSubmission] = await Promise.all([
      prisma.user.findUnique({
        where: { id: currentUser.id },
        include: { profile: true },
      }),
      prisma.kYCSubmission.findUnique({
        where: { userId: currentUser.id },
        select: {
          id: true,
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
      }),
    ]);

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    if ((existingSubmission as any)?.[config.statusField] === 'APPROVED') {
      return NextResponse.json(
        { message: `${config.label} is already approved and cannot be re-uploaded.` },
        { status: 400 }
      );
    }

    // Validate file type
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'webp'];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !validExtensions.includes(extension)) {
      return NextResponse.json(
        {
          message: 'Invalid file type. Only PDF, JPG, PNG, HEIC, and WEBP are allowed.',
        },
        { status: 400 }
      );
    }

    // Validate file size (5 MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: 'File size exceeds the 5MB limit.' }, { status: 400 });
    }

    // Convert uploaded file to Data URI
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verify file signature (magic bytes) to prevent extension spoofing / dangerous uploads
    if (buffer.length < 4) {
      return NextResponse.json({ message: 'Invalid file size' }, { status: 400 });
    }
    const headerBytes = buffer.slice(0, 4).toString('hex').toUpperCase();
    const isPdf = headerBytes === '25504446'; // %PDF
    const isPng = headerBytes === '89504E47'; // PNG
    const isJpg = headerBytes.startsWith('FFD8'); // JPEG
    const isWebp = headerBytes === '52494646'; // RIFF (for WEBP)
    const isHeic = buffer.slice(4, 8).toString('utf-8') === 'ftyp';

    if (!isPdf && !isPng && !isJpg && !isWebp && !isHeic) {
      return NextResponse.json(
        { message: 'Invalid file content. Spoofed or dangerous file type detected.' },
        { status: 400 }
      );
    }

    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'application/octet-stream';
    const dataUri = `data:${mimeType};base64,${base64}`;

    // Upload to Cloudinary using the configured upload preset
    const uploadResult = await cloudinary.uploader.unsigned_upload(
      dataUri,
      process.env.CLOUDINARY_UPLOAD_PRESET!,
      {
        resource_type: 'auto',
      }
    );

    if (!uploadResult.secure_url) {
      throw new Error('Cloudinary did not return a secure URL.');
    }

    const secureUrl = uploadResult.secure_url;

    const fullName =
      user?.name ||
      `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() ||
      'Unknown';

    const phone = user?.profile?.phone || 'Not Provided';
    const address = user?.profile?.address || 'Not Provided';
    const state = user?.profile?.state || 'Not Provided';
    const lga = user?.profile?.lga || 'Not Provided';

    const updateData: any = {
      [config.primaryUrlField]: secureUrl,
      [config.fallbackUrlField]: secureUrl,
      [config.statusField]: 'UPLOADED',
    };

    const kycSub = await prisma.kYCSubmission.upsert({
      where: {
        userId: currentUser.id,
      },
      create: {
        userId: currentUser.id,
        fullName,
        phone,
        address,
        state,
        lga,
        idType: 'NIN',
        idNumber: 'NOT_PROVIDED',
        ...updateData,
        status: 'PENDING',
      },
      update: updateData,
    });

    const nextOverallStatus = deriveOverallStatus(kycSub);
    const isComplete = nextOverallStatus === 'SUBMITTED' || nextOverallStatus === 'APPROVED';

    if (nextOverallStatus !== kycSub.status || user?.kycStatus !== nextOverallStatus) {
      const now = new Date();
      await prisma.$transaction([
        prisma.kYCSubmission.update({
          where: {
            userId: currentUser.id,
          },
          data: {
            status: nextOverallStatus,
          },
        }),
        prisma.user.update({
          where: {
            id: currentUser.id,
          },
          data: buildUserKycUpdateData(nextOverallStatus, now),
        }),
      ]);
    }

    return NextResponse.json({
      message: 'Upload successful',
      secure_url: secureUrl,
      public_id: uploadResult.public_id,
      original_filename: uploadResult.original_filename,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      documentType: docType,
      isComplete,
      status: nextOverallStatus,
    });
  } catch (error: any) {
    console.error('KYC upload error:', error);

    return NextResponse.json(
      {
        message: error.message || 'File upload failed',
      },
      {
        status: 500,
      }
    );
  }
}
