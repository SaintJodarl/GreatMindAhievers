import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getCurrentUser } from '@/lib/auth/session';

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

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'webp'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !validExtensions.includes(extension)) {
      return NextResponse.json(
        { message: 'Invalid file type. Only PDF, JPG, PNG, HEIC, and WEBP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: 'File size exceeds the 5MB limit.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'application/octet-stream';
    const dataUri = `data:${mimeType};base64,${base64}`;

    // Use unsigned_upload with the mlm_uploads preset
    const uploadResult = await cloudinary.uploader.unsigned_upload(dataUri, 'mlm_uploads', {
      resource_type: 'auto',
    });

    let secureUrl = uploadResult.secure_url;
    if (!secureUrl && uploadResult.public_id) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.replace(/['"]/g, '').trim();
      const resourceType = uploadResult.resource_type || 'image';
      const formatSuffix = uploadResult.format ? `.${uploadResult.format}` : (extension ? `.${extension}` : '');
      secureUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${uploadResult.public_id}${formatSuffix}`;
    }

    if (!secureUrl) {
      throw new Error('Upload completed but no secure URL was returned by Cloudinary.');
    }

    return NextResponse.json({
      message: 'Upload successful',
      secure_url: secureUrl,
    });
  } catch (error: any) {
    console.error('KYC file upload error:', error);
    return NextResponse.json(
      { message: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
