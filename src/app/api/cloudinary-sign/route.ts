import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

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

    const { docType } = await req.json();
    if (!docType || !['government_id', 'selfie', 'address_proof'].includes(docType)) {
      return NextResponse.json({ message: 'Invalid document type' }, { status: 400 });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = `mlm/uploads/${currentUser.id}/kyc/${docType}`;

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      cloudinary.config().api_secret as string
    );

    return NextResponse.json({
      timestamp,
      signature,
      api_key: cloudinary.config().api_key,
      cloud_name: cloudinary.config().cloud_name,
      folder,
    });
  } catch (error: any) {
    console.error('Cloudinary signature error:', error);
    return NextResponse.json({ message: 'Failed to generate signature' }, { status: 500 });
  }
}
