import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
export declare class CloudinaryService {
    uploadFile(file: Express.Multer.File, userId: string): Promise<UploadApiResponse | UploadApiErrorResponse>;
    generateSignature(userId: string, timestamp: number): string;
}
