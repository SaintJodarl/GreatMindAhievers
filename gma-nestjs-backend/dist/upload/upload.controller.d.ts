import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { DocumentService } from '../document/document.service';
import { BackgroundProcessorService } from '../processor/background-processor.service';
import { DocumentType } from '@prisma/client';
export declare class UploadController {
    private readonly cloudinaryService;
    private readonly documentService;
    private readonly backgroundProcessor;
    private readonly rateLimiter;
    constructor(cloudinaryService: CloudinaryService, documentService: DocumentService, backgroundProcessor: BackgroundProcessorService);
    uploadKycDocument(authUserId: string, idempotencyKey: string, type: DocumentType, file: Express.Multer.File): Promise<{
        message: string;
        documentId: string;
        secureUrl: any;
        publicId: any;
        status: import(".prisma/client").$Enums.DocumentStatus;
    }>;
}
