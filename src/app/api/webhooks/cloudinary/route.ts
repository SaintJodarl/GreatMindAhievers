import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify it's an upload event
    if (body.notification_type !== 'upload') {
      return NextResponse.json({ message: 'Ignored non-upload event' }, { status: 200 });
    }

    const { secure_url, public_id, folder } = body;

    // We expect folder format: mlm/uploads/{userId}/kyc/{docType}
    // Example: mlm/uploads/cuid12345/kyc/government_id
    if (!folder || !folder.startsWith('mlm/uploads/')) {
      return NextResponse.json({ message: 'Ignored unrelated folder' }, { status: 200 });
    }

    const pathParts = folder.split('/');
    // pathParts[0] = 'mlm'
    // pathParts[1] = 'uploads'
    // pathParts[2] = userId
    // pathParts[3] = 'kyc'
    // pathParts[4] = docType
    
    if (pathParts.length < 5 || pathParts[3] !== 'kyc') {
      return NextResponse.json({ message: 'Invalid folder structure for KYC' }, { status: 200 });
    }

    const userId = pathParts[2];
    const docType = pathParts[4];

    // Map folder to DB columns
    let urlField = '';
    let statusField = '';

    if (docType === 'government_id') {
      urlField = 'governmentIdUrl';
      statusField = 'govIdStatus';
    } else if (docType === 'selfie') {
      urlField = 'selfieUrl';
      statusField = 'selfieStatus';
    } else if (docType === 'address_proof') {
      urlField = 'addressProofUrl';
      statusField = 'addressStatus';
    } else {
      return NextResponse.json({ message: 'Unknown docType' }, { status: 200 });
    }

    // Upsert the DB directly. We use upsert in case this arrives before any other profile creation
    await prisma.kYCSubmission.upsert({
      where: { userId },
      create: {
        userId,
        fullName: 'Pending',
        phone: 'Pending',
        address: 'Pending',
        state: 'Pending',
        lga: 'Pending',
        idType: 'Pending',
        idNumber: 'Pending',
        [urlField]: secure_url,
        [statusField]: 'UPLOADED',
        status: 'PENDING',
      },
      update: {
        [urlField]: secure_url,
        [statusField]: 'UPLOADED',
      },
    });

    return NextResponse.json({ message: 'Webhook processed successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Cloudinary webhook error:', error);
    return NextResponse.json({ message: 'Webhook processing failed', error: error.message }, { status: 500 });
  }
}
