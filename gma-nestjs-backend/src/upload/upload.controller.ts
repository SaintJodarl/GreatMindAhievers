import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { DocumentService } from '../document/document.service';
import { BackgroundProcessorService } from '../processor/background-processor.service';
import { DocumentType } from '@prisma/client';

@Controller('uploads')
export class UploadController {
  private readonly rateLimiter = new Map<string, { count: number; windowStart: number }>();

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly documentService: DocumentService,
    private readonly backgroundProcessor: BackgroundProcessorService,
  ) {}

  @Post('kyc')
  @UseInterceptors(FileInterceptor('file'))
  async uploadKycDocument(
    @Headers('x-user-id') authUserId: string,
    @Headers('x-idempotency-key') idempotencyKey: string,
    @Body('type') type: DocumentType,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|pdf)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!authUserId) {
      throw new BadRequestException('User authentication is required (x-user-id header missing).');
    }

    if (!type || !Object.values(DocumentType).includes(type)) {
      throw new BadRequestException('Valid document type (KYC_FRONT, KYC_BACK, PROFILE) is required.');
    }

    const now = Date.now();
    const limitRecord = this.rateLimiter.get(authUserId);
    if (!limitRecord) {
      this.rateLimiter.set(authUserId, { count: 1, windowStart: now });
    } else {
      if (now - limitRecord.windowStart > 60 * 1000) {
        this.rateLimiter.set(authUserId, { count: 1, windowStart: now });
      } else {
        if (limitRecord.count >= 5) {
          throw new BadRequestException('Upload rate limit exceeded. Max 5 uploads per minute.');
        }
        limitRecord.count += 1;
      }
    }

    if (idempotencyKey) {
      const existingDoc = await this.documentService.findUniqueByIdempotencyKey(idempotencyKey);
      if (existingDoc) {
        console.log(`[Idempotency Gate] Duplicate request detected for key ${idempotencyKey}. Returning cached record.`);
        return {
          message: 'Duplicate request detected. Returning cached upload record.',
          documentId: existingDoc.id,
          secureUrl: existingDoc.fileUrl,
          publicId: existingDoc.publicId,
          status: existingDoc.status,
        };
      }
    }

    try {
      const uploadResult = await this.cloudinaryService.uploadFile(file, authUserId);

      const document = await this.documentService.createDocumentWithIdempotency(
        authUserId,
        type,
        uploadResult.secure_url,
        uploadResult.public_id,
        idempotencyKey || null,
      );

      this.backgroundProcessor.scheduleImmediateProcess(document.id);

      return {
        message: 'File uploaded successfully. Verification processing.',
        documentId: document.id,
        secureUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        status: document.status,
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }
}
