import { PrismaService } from '../prisma/prisma.service';
import { KycDocument, DocumentType, DocumentStatus } from '@prisma/client';
export declare class DocumentService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createDocument(userId: string, type: DocumentType, fileUrl: string, publicId: string): Promise<KycDocument>;
    findUniqueByIdempotencyKey(idempotencyKey: string): Promise<KycDocument | null>;
    createDocumentWithIdempotency(userId: string, type: DocumentType, fileUrl: string, publicId: string, idempotencyKey: string | null): Promise<KycDocument>;
    updateStatus(id: string, status: DocumentStatus): Promise<KycDocument>;
    incrementRetryCount(id: string): Promise<KycDocument>;
    findUserDocuments(userId: string): Promise<KycDocument[]>;
}
