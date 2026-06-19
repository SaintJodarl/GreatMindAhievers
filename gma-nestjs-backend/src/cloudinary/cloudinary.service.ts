import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: `mlm/users/${userId}/kyc`,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      upload.end(file.buffer);
    });
  }

  generateSignature(userId: string, timestamp: number): string {
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.replace(/['"]/g, '');
    const params = {
      folder: `mlm/users/${userId}/kyc`,
      timestamp,
    };
    return cloudinary.utils.api_sign_request(params, apiSecret);
  }
}
