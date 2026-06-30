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

    if (!uploadResult.secure_url) {
      if (uploadResult.status === 'pending') {
        return NextResponse.json(
          { message: 'Upload is pending Cloudinary async processing. Ensure your preset is synchronous.' },
          { status: 400 }
        );
      }
      throw new Error('Upload completed but no secure URL was returned by Cloudinary.');
    }

    return NextResponse.json({
      message: 'Upload successful',
      secure_url: uploadResult.secure_url,
    });
  } catch (error: any) {
    console.error('KYC file upload error:', error);
    return NextResponse.json(
      { message: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
