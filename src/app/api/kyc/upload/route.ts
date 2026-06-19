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
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const docType = formData.get('docType') as string | null;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    if (!docType || !['government_id', 'selfie', 'address_proof'].includes(docType)) {
      return NextResponse.json({ message: 'Invalid document type' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'application/octet-stream';
    const dataUri = `data:${mimeType};base64,${base64}`;

    // Use unsigned_upload with the mlm_uploads preset as requested
    const uploadResult = await cloudinary.uploader.unsigned_upload(dataUri, 'mlm_uploads', {
      resource_type: 'auto',
    });

    // Note: If the preset is configured as async: true in Cloudinary, uploadResult.secure_url might be undefined.
    // If it is missing, we must fail gracefully.
    if (!uploadResult.secure_url) {
       // Check if public_id exists, which implies async upload
       if (uploadResult.status === 'pending') {
          return NextResponse.json({ message: 'Upload is pending Cloudinary async processing. Ensure your preset is synchronous.' }, { status: 400 });
       }
       throw new Error('Upload completed but no secure URL was returned by Cloudinary.');
    }

    const secureUrl = uploadResult.secure_url;

    // Retrieve or initialize KYCSubmission
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { profile: true },
    });

    const fullName = user?.name || `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() || 'Unknown';
    const phone = user?.profile?.phone || 'Not Provided';
    const address = user?.profile?.address || 'Not Provided';
    const state = user?.profile?.state || 'Not Provided';
    const lga = user?.profile?.lga || 'Not Provided';

    // Update the database depending on the document type
    const updateData: any = {};
    if (docType === 'government_id') {
      updateData.governmentIdUrl = secureUrl;
      updateData.govIdStatus = 'UPLOADED';
      updateData.idDocument = secureUrl; // Legacy field sync
    } else if (docType === 'selfie') {
      updateData.selfieUrl = secureUrl;
      updateData.selfieStatus = 'UPLOADED';
      updateData.selfie = secureUrl; // Legacy field sync
    } else if (docType === 'address_proof') {
      updateData.addressProofUrl = secureUrl;
      updateData.addressStatus = 'UPLOADED';
      updateData.proofOfAddress = secureUrl; // Legacy field sync
    }

    const kycSub = await prisma.kYCSubmission.upsert({
      where: { userId: currentUser.id },
      create: {
        userId: currentUser.id,
        fullName,
        phone,
        address,
        state,
        lga,
        idType: 'NIN', // default, can be updated later
        idNumber: 'NOT_PROVIDED',
        ...updateData,
        status: 'PENDING', // Initial status
      },
      update: updateData,
    });

    // Check if all 3 documents are now uploaded
    const isComplete = 
      kycSub.govIdStatus === 'UPLOADED' && 
      kycSub.selfieStatus === 'UPLOADED' && 
      kycSub.addressStatus === 'UPLOADED';

    if (isComplete && kycSub.status === 'PENDING') {
       // Update overall status if all are uploaded
       await prisma.kYCSubmission.update({
         where: { userId: currentUser.id },
         data: { status: 'COMPLETE' }, // The DB expects 'COMPLETE' or 'SUBMITTED', I'll use COMPLETE based on original logic
       });
       await prisma.user.update({
         where: { id: currentUser.id },
         data: { kycStatus: 'SUBMITTED', kycSubmittedAt: new Date() },
       });
    }

    return NextResponse.json({
      message: 'Upload successful',
      secure_url: secureUrl,
      documentType: docType,
      isComplete
    });
  } catch (error: any) {
    console.error('KYC upload error:', error);
    return NextResponse.json(
      { message: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
