import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.replace(/['"]/g, '').trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.replace(/['"]/g, '').trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.replace(/['"]/g, '').trim(),
});

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const docType = formData.get('docType') as string | null;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    if (
      !docType ||
      !['government_id', 'selfie', 'address_proof'].includes(docType)
    ) {
      return NextResponse.json(
        { message: 'Invalid document type' },
        { status: 400 }
      );
    }

    // Validate file type
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'webp'];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !validExtensions.includes(extension)) {
      return NextResponse.json(
        {
          message:
            'Invalid file type. Only PDF, JPG, PNG, HEIC, and WEBP are allowed.',
        },
        { status: 400 }
      );
    }

    // Validate file size (5 MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: 'File size exceeds the 5MB limit.' },
        { status: 400 }
      );
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

    // Retrieve or initialize KYC submission
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { profile: true },
    });

    const fullName =
      user?.name ||
      `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() ||
      'Unknown';

    const phone = user?.profile?.phone || 'Not Provided';
    const address = user?.profile?.address || 'Not Provided';
    const state = user?.profile?.state || 'Not Provided';
    const lga = user?.profile?.lga || 'Not Provided';

    // Update fields based on document type
    const updateData: any = {};

    if (docType === 'government_id') {
      updateData.governmentIdUrl = secureUrl;
      updateData.govIdStatus = 'UPLOADED';
      updateData.idDocument = secureUrl;
    } else if (docType === 'selfie') {
      updateData.selfieUrl = secureUrl;
      updateData.selfieStatus = 'UPLOADED';
      updateData.selfie = secureUrl;
    } else if (docType === 'address_proof') {
      updateData.addressProofUrl = secureUrl;
      updateData.addressStatus = 'UPLOADED';
      updateData.proofOfAddress = secureUrl;
    }

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

    const isComplete =
      kycSub.govIdStatus === 'UPLOADED' &&
      kycSub.selfieStatus === 'UPLOADED' &&
      kycSub.addressStatus === 'UPLOADED';

    if (isComplete && kycSub.status === 'PENDING') {
      await prisma.kYCSubmission.update({
        where: {
          userId: currentUser.id,
        },
        data: {
          status: 'COMPLETE',
        },
      });

      await prisma.user.update({
        where: {
          id: currentUser.id,
        },
        data: {
          kycStatus: 'SUBMITTED',
          kycSubmittedAt: new Date(),
        },
      });
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