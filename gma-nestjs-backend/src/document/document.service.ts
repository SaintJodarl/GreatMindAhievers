import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KycDocument, DocumentType, DocumentStatus } from '@prisma/client';

@Injectable()
export class DocumentService {
  constructor(private readonly prisma: PrismaService) {}

  async createDocument(
    userId: string,
    type: DocumentType,
    fileUrl: string,
    publicId: string,
  ): Promise<KycDocument> {
    return this.prisma.kycDocument.create({
      data: {
        userId,
        type,
        fileUrl,
        publicId,
        status: 'PENDING',
      },
    });
  }

  async findUniqueByIdempotencyKey(idempotencyKey: string): Promise<KycDocument | null> {
    return this.prisma.kycDocument.findUnique({
      where: { idempotencyKey },
    });
  }

  async createDocumentWithIdempotency(
    userId: string,
    type: DocumentType,
    fileUrl: string,
    publicId: string,
    idempotencyKey: string | null,
  ): Promise<KycDocument> {
    return this.prisma.kycDocument.create({
      data: {
        userId,
        type,
        fileUrl,
        publicId,
        idempotencyKey,
        status: 'PENDING',
      },
    });
  }

  async updateStatus(id: string, status: DocumentStatus): Promise<KycDocument> {
    return this.prisma.kycDocument.update({
      where: { id },
      data: { status },
    });
  }

  async incrementRetryCount(id: string): Promise<KycDocument> {
    return this.prisma.kycDocument.update({
      where: { id },
      data: { retryCount: { increment: 1 } },
    });
  }

  async findUserDocuments(userId: string): Promise<KycDocument[]> {
    return this.prisma.kycDocument.findMany({
      where: { userId },
    });
  }
}
