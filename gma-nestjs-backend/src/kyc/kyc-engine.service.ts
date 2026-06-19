import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentService } from '../document/document.service';
import { FraudService } from '../fraud/fraud-detection.service';
import { WalletActivationService } from '../wallet-activation/wallet-activation.service';

@Injectable()
export class KycEngineService {
  private readonly logger = new Logger(KycEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly documentService: DocumentService,
    private readonly fraudService: FraudService,
    private readonly walletActivationService: WalletActivationService,
  ) {}

  async processKycDocument(documentId: string): Promise<void> {
    this.logger.log(`Starting async processing for KYC Document: ${documentId}`);

    const doc = await this.prisma.kycDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      this.logger.error(`Document ${documentId} not found in database.`);
      return;
    }

    await this.prisma.user.update({
      where: { id: doc.userId },
      data: { status: 'KYC_IN_PROGRESS' },
    });

    try {
      const isDuplicate = await this.fraudService.checkDuplicateDocument(doc.userId, doc.publicId);
      if (isDuplicate) {
        this.logger.warn(`Fraud check failed: Duplicate KYC document detected for User ${doc.userId}`);
        await this.documentService.updateStatus(documentId, 'REJECTED');
        return;
      }

      if (!doc.fileUrl || !doc.fileUrl.startsWith('http')) {
        this.logger.warn(`Verification failed: Invalid Cloudinary URL.`);
        await this.documentService.updateStatus(documentId, 'REJECTED');
        return;
      }

      await this.documentService.updateStatus(documentId, 'VERIFIED');
      this.logger.log(`Document ${documentId} successfully verified.`);

      await this.walletActivationService.tryActivateWallet(doc.userId);
    } catch (error) {
      this.logger.error(`Error processing KYC document ${documentId}: ${error.message}`);
      await this.documentService.incrementRetryCount(documentId);
      await this.documentService.updateStatus(documentId, 'REJECTED');
    }
  }
}
