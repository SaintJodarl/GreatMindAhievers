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

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const docType = formData.get('docType') as string | null;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    if (!docType || !['government_id', 'selfie', 'address_proof'].includes(docType)) {
      return NextResponse.json({ message: 'Invalid document type' }, { status: 400 });
    }

    // Convert File to a base64 data URI for the Cloudinary SDK
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    // Determine MIME type from the file
    const mimeType = file.type || 'application/octet-stream';
    const dataUri = `data:${mimeType};base64,${base64}`;

    const folder = `mlm/uploads/${currentUser.id}/kyc/${docType}`;

    // Server-side upload using the API secret (bypasses API key permission restrictions)
    // resource_type: 'auto' handles images, PDFs, and other file types
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: 'auto',
    });

    return NextResponse.json({
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      resource_type: uploadResult.resource_type,
    });
  } catch (error: any) {
    console.error('Cloudinary server upload error:', error);
    return NextResponse.json(
      { message: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
